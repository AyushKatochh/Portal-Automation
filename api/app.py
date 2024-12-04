import os
import json
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI
from groq import Groq
import uvicorn



# Import existing utility functions (these would be in a separate utils.py)
from utils import (
    get_pdf_signatures,
    process_document_for_ocr,
    cleanup_file
)

# Load environment variables
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="Comprehensive Document Processing API",
    description="AI-powered document processing, OCR, and information extraction service",
    version="2.1.0"
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



class DocumentValidationRequest(BaseModel):
    document_type: str
    json_data: Dict[Any, Any]


class GroqDocumentValidator:
    def __init__(self, api_key: str = None):
        """
        Initialize the Groq-based document validator
        :param api_key: Groq API key (optional, can use environment variable)
        """
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key is required. Set GROQ_API_KEY environment variable or pass it directly.")
        self.client = Groq(api_key=self.api_key)

    def validate_document(self, document_type: str, json_data: Dict[Any, Any]) -> Dict[str, Any]:
        """
        Validate document using Groq LLM-based semantic analysis
        :param document_type: Type of document being validated
        :param json_data: JSON data to validate
        :return: Validation results
        """
        validation_prompt = self._prepare_validation_prompt(document_type, json_data)
        try:
            # Call Groq API for validation
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in document verification. Carefully validate each field with attention to authenticity, consistency, and completeness."
                    },
                    {
                        "role": "user",
                        "content": validation_prompt
                    }
                ],
                model="llama3-70b-8192",
                max_tokens=1000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            llm_response = chat_completion.choices[0].message.content

            # Parse the JSON response
            validation_result = json.loads(llm_response)

            # Post-process confidence scores
            for field, result in validation_result.get("field_validations", {}).items():
                if "confidence_score" in result:
                    result["confidence_score"] = self._adjust_confidence_score(result["confidence_score"], field)

            return validation_result
        except Exception as e:
            return {
                "overall_validity": False,
                "error": str(e),
                "validation_method": "Groq Llama3 LLM-based semantic analysis"
            }

    def _prepare_validation_prompt(self, document_type: str, json_data: Dict[Any, Any]) -> str:
        """
        Prepare a detailed prompt for LLM-based validation
        :param document_type: Type of document
        :param json_data: JSON data to validate
        :return: Validation prompt
        """
        # Validation rules based on the document type
        validation_instructions = {
            "Fire Safety Certificate": """
            Validation Criteria for Fire Safety Certificate:
            - Certificate Number: Validate for proper format and uniqueness.
            - Issuing Authority: Ensure the authority details are correct and valid.
            - Issuance Date & Expiry Date: Confirm validity period and format.
            - Authorized Signature and Seal: Verify the presence and authenticity of the signature and seal.
            - Fire Equipment Details: Check for accurate and complete equipment information.
            """,
            "Land Conversion Certificate": """
            Validation Criteria for Land Conversion Certificate:
            - Certificate Number: Verify proper format and uniqueness.
            - Issuing Authority: Ensure the government authority details are correct.
            - Issue Date & Validity Period: Confirm issue date, validity, and renewal requirements.
            - Name of the Applicant & Contact Information: Verify correctness and completeness.
            - Location & Area of Land: Ensure accurate geographical and size information.
            - From (Owner) - To (Institute): Validate ownership transfer details.
            - Competent Authority's Seal and Signature: Confirm authenticity.
            """,
            "Affidavit 2": """
            Validation Criteria for Affidavit 2:
            - Non-Judicial Stamp Paper: Confirm value (Rs. 100/-) and judicial details.
            - Notary Public & Oath Commissioner: Validate registration number, seals, and signatures.
            - Verification Details: Ensure the place, date, and executant's information are correct.
            """,
            "Bank Certificate": """
            Validation Criteria for Bank Certificate:
            - Account Holder Name & Account Number: Validate for accuracy and consistency.
            - Bank Name & Address: Confirm bank details are correct and current.
            - FDR Details: Check the number, deposit date, maturity date, and amount.
            - Balance Verification: Confirm the reported balance matches the records.
            - Bank Manager’s Signature, Name & Seal: Validate for authenticity.
            """,
            "Architect Certificate": """
            Validation Criteria for Architect Certificate:
            - Approval Authority: Validate the name, number, and date of approval.
            - Room Details: Check the number, type, area, and construction details.
            - Occupancy & Structural Stability Certificates: Confirm authenticity and validity.
            """,
            "MoU Document": """
            Validation Criteria for MoU Document:
            - Names of Institutes: Confirm the names and roles of both Indian and foreign institutes.
            - Document Reference Number & Date of Issue: Validate for proper identification.
            - Event Details: Confirm the date, time, venue, and purpose of the event.
            - Key Participants: Ensure the participants' names and designations are correct.
            - Signature and Seal: Validate the authorized signatory and institutional seal.
            """,
            "Occupancy Certificate": """
            Validation Criteria for Occupancy Certificate:
            - Memo No. & Date of Issue: Verify for uniqueness and correctness.
            - Holding No. & Location: Confirm property details are accurate.
            - Building Type: Validate against the specified purpose.
            - Signature and Seal: Confirm authenticity of the certificate.
            """
        }

        specific_instructions = validation_instructions.get(document_type, "No specific validation instructions available.")

        prompt = f"""
            Perform a comprehensive semantic validation of the following document:

            Document Type: {document_type}
            Document Data: {json.dumps(json_data, indent=2)}

{specific_instructions}

            Response Format (MUST be a valid JSON):
{{
                "overall_validity": true/false,
                "confidence_score": 0-100,
                "field_validations": {{
                    "field_name": {{
                        "is_valid": true/false,
                        "confidence_score": 0-100,
                        "notes": "string"
                    }}
                }},
                "validation_notes": "string with overall observations",
                "potential_issues": ["list", "of", "potential", "problems"]
}}

            Provide a thorough, precise, and structured validation response.
            """
        return prompt

    def _adjust_confidence_score(self, score: int, field: str) -> int:
        """
        Adjust confidence scores dynamically based on field importance and validation rules
        :param score: Original confidence score
        :param field: Field being validated
        :return: Adjusted confidence score
        """
        critical_fields = ["certificate_number", "issuing_authority", "authorized_signature"]
        if field in critical_fields and score > 90:
            return max(score - 5, 85)  # Slight penalty for critical fields
        return score

validator = GroqDocumentValidator()

class OCRResult:
    def __init__(self, documents, document_type):
        self.documents = documents
        self.document_type = document_type
        self.keywords = DOCUMENT_KEYWORDS.get(document_type, [])

# Pydantic models for request validation
class DocumentData(BaseModel):
    text: str = Field(..., min_length=10, description="Document text content")

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
        # Construct prompt for structured extraction with more explicit instructions
        keywords_list = ", ".join(keywords)
        prompt = f"""
        You are an expert document information extractor. 
        Extract ONLY the following specific keywords: {keywords_list}

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
            temperature=0.1,
            top_p=0.9
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
            "error": f"Extraction Error: {str(e)}",
            "keyword_values": {keyword: None for keyword in keywords}
        }

@app.post("/validate-document", response_model=dict)
async def validate_document(request: DocumentValidationRequest):
    """
    Endpoint for document validation
    :param request: Document validation request containing document type and JSON data
    :return: Validation results
    """
    try:
        validation_result = validator.validate_document(
            document_type=request.document_type,
            json_data=request.json_data
        )
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# New combined processing endpoint
@app.post("/process_document/")
async def process_document_comprehensively(file: UploadFile = File(...), document_type: str = File(...)):

    # Validate file type
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    # Validate document type
    if not document_type or document_type not in DOCUMENT_KEYWORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {', '.join(DOCUMENT_KEYWORDS.keys())}"
        )

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    document_name = os.path.basename(file_path)

    try:
        # Save file
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Perform OCR extraction
        client = get_ai_client()
        keyword_list = DOCUMENT_KEYWORDS.get(document_type, [])
        
        # Extract text via OCR
        extracted_text = process_document_for_ocr(
            file_path,
            is_pdf=(file.content_type == "application/pdf")
        )

        # Perform information extraction
        extracted_info = extract_document_info(
            extracted_text,
            keyword_list,
            client
        )

        # Validate signatures (if PDF)
        signatures_info = []
        if file.content_type == "application/pdf":
            try:
                for signature in get_pdf_signatures(file_path):
                    certificate = signature.certificate
                    subject = certificate.subject

                    signature_details = {
                        "type": str(signature.type),
                        "signature": str(signature),
                        "signer_name": str(signature.signer_name),
                        "signing_time": str(signature.signing_time),
                        "certificate": {
                            "validity": {
                                "not_before": str(certificate.validity.not_before),
                                "not_after": str(certificate.validity.not_after),
                            },
                            "issuer": str(certificate.issuer),
                            "subject": {
                                "common_name": str(subject.common_name),
                                "serial_number": str(subject.serial_number),
                            }
                        }
                    }
                    signatures_info.append(signature_details)
            except Exception as sig_error:
                signatures_info = [{"error": str(sig_error)}]

        # Combine results
        combined_result = {
            "status": "success",
            "document_type": document_type,
            "ocr_extraction": extracted_info['extracted_data'],
            "signatures": signatures_info
        }

        return JSONResponse(content=combined_result, status_code=200)

    except Exception as e:
        return JSONResponse(
            content={
                "status": "error", 
                "message": str(e)
            }, 
            status_code=500
        )
    finally:
        # Always cleanup the uploaded file
        cleanup_file(file_path)

# Existing OCR endpoint (kept for backward compatibility)
@app.post("/ocr_and_extract/")
async def perform_ocr(file: UploadFile = File(...), document_type: str = Body(...)):
    """
    Perform OCR on uploaded document
    Args:
        file (UploadFile): Uploaded image or PDF file
        document_type (str): Type of document for keyword extraction
    Returns:
        JSONResponse with extracted text
    """
    # Validate file type
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    # Validate document type
    if not document_type or document_type not in DOCUMENT_KEYWORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {', '.join(DOCUMENT_KEYWORDS.keys())}"
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
        keyword_list = DOCUMENT_KEYWORDS.get(document_type, [])
        ocr_result = OCRResult(
            documents={document_name: {"text": extracted_text, "document_type": document_type}}, 
            document_type=document_type
        )

        results = {}
        for doc_type, doc_data in ocr_result.documents.items():
            extracted_info = extract_document_info(
                doc_data['text'],
                keyword_list,
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
    signatures_info = []
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        for signature in get_pdf_signatures(file_path):
            certificate = signature.certificate
            subject = certificate.subject

            signature_info = {
                "type": str(signature.type),
                "signature": str(signature),
                "signer_name": str(signature.signer_name),
                "signing_time": str(signature.signing_time),
                "certificate": {
                    "validity": {
                        "not_before": str(certificate.validity.not_before),
                        "not_after": str(certificate.validity.not_after),
                    },
                    "issuer": str(certificate.issuer),
                    "subject": {
                        "common_name": str(subject.common_name),
                        "serial_number": str(subject.serial_number),
                    }
                }
            }
            signatures_info.append(signature_info)
        return JSONResponse(content={"signatures": signatures_info}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": "No Valid digital signature", "details": str(e)}, status_code=500)
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
            "Comprehensive Processing": "/process_document/",
            "OCR and Extract": "/ocr_and_extract/",
            "Signature Validation": "/validate-signature/",
            "Information Extraction": "/extract"
        }
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




















































































