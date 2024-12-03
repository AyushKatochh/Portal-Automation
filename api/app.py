import os
import json
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI
import uvicorn

# Import existing utility functions (these would be in a separate utils.py)
from utils import (
    validate_pdf_signature,
    process_document_for_ocr,
    cleanup_file
)

# Load environment variables
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="Comprehensive Document Processing API",
    description="AI-powered document processing, OCR, and information extraction service",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Directory to temporarily store uploaded files
UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Comprehensive document type to keywords mapping
DOCUMENT_KEYWORDS = {
    "fire_safety_certificate": [
        "certificate_number", "issuing_authority", "issuance_date", 
        "expiry_date", "fire_equipment_details"
    ],
    "land_conversion_certificate": [
        "certificate_number", "issuing_authority", "issue_date", 
        "validity_period", "applicant_name", "contact_information", 
        "location", "area_of_land"
    ],
    "affidavit": [
        "stamp_paper_type", "notary_registration_number", 
        "oath_commissioner_name", "verification_place", 
        "verification_date", "executant_name", "executant_designation"
    ],
    "bank_certificate": [
        "account_holder_name", "account_number", "bank_name", 
        "bank_address", "fdr_details", "balance_verification", 
        "certificate_date", "certificate_place"
    ],
    "architect_certificate": [
        "approval_authority", "approval_number", "approval_date", 
        "room_details", "occupancy_certificate", "structural_stability_certificate"
    ],
    "mou_document": [
        "indian_institute_name", "foreign_institute_name", 
        "document_reference_number", "date_of_issue", 
        "event_date", "event_time", "venue", "purpose", 
        "key_participants"
    ],
    "occupancy_certificate": [
        "memo_number", "date_of_issue", "holding_number", 
        "street", "ward_number", "building_type"
    ]
}

# Custom OCRResult class for structured data
class OCRResult:
    def __init__(self, documents, keywords):
        self.documents = documents
        self.keywords = keywords

# Pydantic models for request validation
class DocumentData(BaseModel):
    text: str = Field(..., min_length=10, description="Document text content")
    document_type: str = Field(..., description="Type of document being processed")

class ExtractionRequest(BaseModel):
    documents: Dict[str, DocumentData]
    keywords: List[str] = Field(..., description="Keywords to extract")

# OpenAI/Groq Client Configuration
def get_ai_client():
    """Initialize and return the AI client"""
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )

# Function for extracting document information
def extract_document_info(text: str, keywords: List[str], client: OpenAI) -> Dict[str, Any]:
    """
    Extract structured information from a document using AI
    Args:
        text (str): Raw text content of the document
        keywords (List[str]): Keywords to extract values for
        client (OpenAI): AI client for processing
    Returns:
        Dict containing extracted information
    """
    try:
        # Construct prompt for structured extraction
        keywords_prompt = f"Extract values for the following keywords: {', '.join(keywords)}" if keywords else ""
        prompt = f"""
        Extract structured information from the following {document_type}:

        Document Text:
        {text}

        IMPORTANT EXTRACTION GUIDELINES:
        1. Return a clean, valid JSON object
        2. Use null for any missing information
        3. If a keyword is not found, set its value to null
        4. Do NOT invent or fabricate information
        5. Extract precisely what is in the document
        6. Keep the JSON structure simple and flat

        Strictly return a JSON with these keys: {keywords_list}
        """

        # Call AI model for extraction with more conservative settings
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are an expert document information extractor. Always return valid, precise JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.2
        )

        # Parse and return extracted information
        raw_content = response.choices[0].message.content
        
        # Additional parsing and validation
        try:
            extracted_data = json.loads(raw_content)
        except json.JSONDecodeError:
            # Attempt to clean and parse the JSON
            import re
            cleaned_content = re.sub(r'[\n\r]', '', raw_content)
            extracted_data = json.loads(cleaned_content)

        # Ensure all keywords are present, even if null
        for keyword in keywords:
            if keyword not in extracted_data:
                extracted_data[keyword] = None

        return {
            "extracted_data": extracted_data,
            "keyword_values": {keyword: extracted_data.get(keyword, None) for keyword in keywords}
        }

    except Exception as e:
        # Comprehensive error handling
        return {
            "type": document_type,
            "error": str(e),
            "keyword_values": {keyword: None for keyword in keywords} if keywords else {}
        }
# OCR endpoint
@app.post("/ocr_and_extract/")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded document with flexible keyword extraction
    Args:
        file (UploadFile): Uploaded image or PDF file
    Returns:
        JSONResponse with extracted text and information
    """
    # Validate file type
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    document_name = os.path.basename(file_path)

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Process the document
        extracted_text = process_document_for_ocr(
            file_path,
            is_pdf=(file.content_type == "application/pdf")
        )

        # Perform AI extraction
        client = get_ai_client()
        keyword_list = ["issued_date", "name", "document_type", "location", "certificate_validity"]
        ocr_result = OCRResult(documents={document_name: {"text": extracted_text}}, keywords=keyword_list)

        results = {}
        for doc_type, doc_data in ocr_result.documents.items():
            extracted_info = extract_document_info(
                doc_type,
                doc_data['text'],
                ocr_result.keywords,
                client
            )
            results[doc_type] = extracted_info

        return {
            "status": "success",
            "results": results,
            "total_documents": len(results),
            "keywords": keywords,
            "extracted_text": extracted_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_file(file_path)

# Signature validation endpoint
@app.post("/validate-signature/")
async def validate_signature(file: UploadFile = File(...)):
    """
    Validate digital signatures in a PDF document
    Args:
        file (UploadFile): Uploaded PDF file
    Returns:
        JSONResponse with signature validation results
    """
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be a PDF."
        )

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Validate signatures
        result = validate_pdf_signature(file_path)
        return JSONResponse(content=result, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_file(file_path)




# Extraction endpoint
@app.post("/extract")
def process_document_extraction(request: ExtractionRequest):
    """
    Main extraction endpoint to process multiple documents
    Args:
        request (ExtractionRequest): Request containing documents to extract and keywords
    Returns:
        Dict with extraction results
    """
    try:
        # Initialize AI client
        client = get_ai_client()

        # Process each document
        results = {}
        for doc_name, doc_data in request.documents.items():
            extracted_info = extract_document_info(
                doc_data.text,
                request.keywords,
                client
            )
            results[doc_name] = extracted_info

        return {
            "status": "success",
            "results": results,
            "total_documents": len(results),
            "keywords": request.keywords
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    Returns:
        Dict with API details
    """
    return {
        "message": "Flexible Document Processing API is running",
        "endpoints": {
            "OCR and Extract": "/ocr_and_extract/",
            "Information Extraction": "/extract"
        }
    }

# Health check endpoint
@app.get("/health")
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "message": "Document Processing API is operational"
    }

# Main entry point
def main():
    """Run the FastAPI application"""
    uvicorn.run(
        "main:app",
        host='0.0.0.0',
        port=8000,
        reload=True
    )

if __name__ == '__main__':
    main()
