import os
import json
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI
import uvicorn
from dotenv import load_dotenv

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
    description="AI-powered document processing, OCR, signature validation, and information extraction service",
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

# Custom OCRResult class for structured data
class OCRResult:
    def __init__(self, documents, keywords):
        self.documents = documents
        self.keywords = keywords

# Pydantic models for request validation
class DocumentData(BaseModel):
    text: str = Field(..., min_length=10, description="Document text content")

class ExtractionRequest(BaseModel):
    documents: Dict[str, DocumentData]
    keywords: List[str] = Field(default_factory=list, description="Optional keywords to extract")

# OpenAI/Groq Client Configuration
def get_ai_client():
    """Initialize and return the AI client"""
    from openai import OpenAI  # Import OpenAI here if necessary
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )

# Function for extracting document information
def extract_document_info(document_type: str, text: str, keywords: List[str], client: OpenAI) -> Dict[str, Any]:
    """
    Extract structured information from a document using AI
    Args:
        document_type (str): Type of document being processed
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

        Document Text: {text}

        {keywords_prompt}

        Provide a JSON response with key details. 
        Guidelines:
        - Extract core information relevant to the document type
        - Use clear, concise key names
        - Handle missing information gracefully
        - If keywords are provided, return their values
        - Ensure valid JSON output
        """

        # Call AI model for extraction
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are an expert document information extractor. Respond with precise, structured JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.2
        )

        # Parse and return extracted information
        extracted_data = json.loads(response.choices[0].message.content)
        return {
            "type": document_type,
            "extracted_data": extracted_data,
            "keyword_values": {keyword: extracted_data.get(keyword, None) for keyword in keywords} if keywords else {}
        }

    except Exception as e:
        # Handle extraction errors
        return {
            "type": document_type,
            "error": str(e),
            "keyword_values": {keyword: None for keyword in keywords} if keywords else {}
        }

# OCR endpoint
@app.post("/ocr_and_extract/")
async def perform_ocr(file: UploadFile = File(...)):
    """
    Perform OCR on uploaded document
    Args:
        file (UploadFile): Uploaded image or PDF file
    Returns:
        JSONResponse with extracted text
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
            "keywords": keyword_list
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
        request (ExtractionRequest): Request containing documents to extract and optional keywords
    Returns:
        Dict with extraction results
    """
    try:
        # Initialize AI client
        client = get_ai_client()

        # Process each document
        results = {}
        for doc_type, doc_data in request.documents.items():
            extracted_info = extract_document_info(
                doc_type,
                doc_data.text,
                request.keywords,
                client
            )
            results[doc_type] = extracted_info

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
        "message": "Comprehensive Document Processing API is running",
        "endpoints": {
            "OCR": "/ocr/",
            "Signature Validation": "/validate-signature/",
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
        port=5000,
        reload=True
    )

if __name__ == '__main__':
    main()
