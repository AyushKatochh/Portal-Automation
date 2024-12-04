import os
import json
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants
UPLOAD_FOLDER = "./uploads"

# Document type to keywords mapping
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

# Pydantic models
class DocumentValidationRequest(BaseModel):
    document_type: str
    json_data: Dict[Any, Any]

class DocumentData(BaseModel):
    text: str = Field(..., min_length=10, description="Document text content")

class ExtractionRequest(BaseModel):
    documents: Dict[str, DocumentData]
    keywords: List[str] = Field(..., description="Keywords to extract")

class OCRResult:
    def __init__(self, documents, document_type):
        self.documents = documents
        self.document_type = document_type
        self.keywords = DOCUMENT_KEYWORDS.get(document_type, [])

class GroqDocumentValidator:
    def __init__(self, api_key: str = None):
        """Initialize the Groq-based document validator"""
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            raise ValueError("Groq API key is required")
        self.client = Groq(api_key=self.api_key)

    def validate_document(self, document_type: str, json_data: Dict[Any, Any]) -> Dict[str, Any]:
        """Validate document using Groq LLM-based semantic analysis"""
        validation_prompt = self._prepare_validation_prompt(document_type, json_data)
        
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert in document verification."
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
            
            validation_result = json.loads(chat_completion.choices[0].message.content)

            # Post-process confidence scores
            for field, result in validation_result.get("field_validations", {}).items():
                if "confidence_score" in result:
                    result["confidence_score"] = self._adjust_confidence_score(
                        result["confidence_score"], 
                        field
                    )

            return validation_result
            
        except Exception as e:
            return {
                "overall_validity": False,
                "error": str(e),
                "validation_method": "Groq Llama3 LLM-based semantic analysis"
            }

    def _prepare_validation_prompt(self, document_type: str, json_data: Dict[Any, Any]) -> str:
        """Prepare validation prompt based on document type"""
        validation_instructions = {
            "Fire Safety Certificate": """
            Validation Criteria for Fire Safety Certificate:
            - Certificate Number: Validate format and uniqueness
            - Issuing Authority: Check authority details
            - Issuance Date & Expiry Date: Confirm validity period
            - Authorized Signature and Seal: Verify authenticity
            - Fire Equipment Details: Check completeness
            """,
            # ... [other document types' validation instructions]
        }

        specific_instructions = validation_instructions.get(
            document_type, 
            "No specific validation instructions available."
        )

        return f"""
        Perform a comprehensive semantic validation of the following document:

        Document Type: {document_type}
        Document Data: {json.dumps(json_data, indent=2)}

        {specific_instructions}

        Response Format (MUST be valid JSON):
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
            "validation_notes": "string",
            "potential_issues": ["list", "of", "issues"]
        }}
        """

    def _adjust_confidence_score(self, score: int, field: str) -> int:
        """Adjust confidence scores based on field importance"""
        critical_fields = ["certificate_number", "issuing_authority", "authorized_signature"]
        if field in critical_fields and score > 90:
            return max(score - 5, 85)  # Apply penalty for critical fields
        return score

def get_ai_client():
    """Initialize and return the AI client"""
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )

def extract_document_info(text: str, keywords: List[str], client: OpenAI) -> Dict[str, Any]:
    """
    Extract structured information from a document using AI
    
    Args:
        text: Raw text content of the document
        keywords: Keywords to extract values for
        client: AI client for processing
        
    Returns:
        Dictionary containing extracted information
    """
    try:
        # Construct detailed extraction prompt
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

        # Call AI model with conservative settings
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert document information extractor. Always return valid, precise JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.1,
            top_p=0.9
        )

        # Parse extracted information
        raw_content = response.choices[0].message.content
        
        # Handle JSON parsing with cleanup if needed
        try:
            extracted_data = json.loads(raw_content)
        except json.JSONDecodeError:
            # Clean and retry parsing
            import re
            cleaned_content = re.sub(r'[\n\r]', '', raw_content)
            extracted_data = json.loads(cleaned_content)

        # Ensure all keywords are present
        for keyword in keywords:
            if keyword not in extracted_data:
                extracted_data[keyword] = None

        return {
            "extracted_data": extracted_data,
            "keyword_values": {
                keyword: extracted_data.get(keyword, None) 
                for keyword in keywords
            }
        }

    except Exception as e:
        return {
            "error": f"Extraction Error: {str(e)}",
            "keyword_values": {keyword: None for keyword in keywords}
        }

def process_document_for_ocr(file_path: str, is_pdf: bool = False) -> str:
    """
    Process document for OCR extraction
    
    Args:
        file_path: Path to the document file
        is_pdf: Boolean indicating if the file is a PDF
        
    Returns:
        Extracted text from the document
    """
    try:
        if is_pdf:
            # Import PDF specific libraries only when needed
            from pdf2image import convert_from_path
            import pytesseract
            import tempfile
            
            # Convert PDF to images
            images = convert_from_path(file_path)
            extracted_text = []
            
            # Process each page
            for image in images:
                # Extract text from image
                text = pytesseract.image_to_string(image)
                extracted_text.append(text.strip())
            
            return "\n".join(extracted_text)
        else:
            # Process image file
            import pytesseract
            from PIL import Image
            
            # Open and process image
            with Image.open(file_path) as image:
                return pytesseract.image_to_string(image)

    except Exception as e:
        raise Exception(f"OCR Processing Error: {str(e)}")

def get_pdf_signatures(file_path: str) -> list:
    """
    Extract digital signatures from PDF
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        List of signature information
    """
    try:
        from pyhanko.pdf_utils.reader import PdfFileReader
        from pyhanko.sign.validation import validate_pdf_signature

        with open(file_path, 'rb') as file:
            reader = PdfFileReader(file)
            signatures = []
            
            # Check each signature field
            for sig_field in reader.root['/AcroForm']['/Fields']:
                if sig_field['/FT'] == '/Sig':
                    sig_info = validate_pdf_signature(reader, sig_field.get_object())
                    signatures.append(sig_info)
                    
            return signatures
    except Exception as e:
        raise Exception(f"Signature Extraction Error: {str(e)}")

def cleanup_file(file_path: str) -> None:
    """
    Clean up temporary files
    
    Args:
        file_path: Path to file to be removed
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Cleanup Error: {str(e)}")

# Additional helper functions
def validate_file_type(content_type: str, allowed_types: List[str]) -> bool:
    """
    Validate file content type
    
    Args:
        content_type: MIME type of the file
        allowed_types: List of allowed MIME types
        
    Returns:
        Boolean indicating if file type is valid
    """
    return any(content_type.startswith(type_) for type_ in allowed_types)

def create_error_response(message: str, status_code: int = 400) -> Dict[str, Any]:
    """
    Create standardized error response
    
    Args:
        message: Error message
        status_code: HTTP status code
        
    Returns:
        Dictionary containing error information
    """
    return {
        "status": "error",
        "message": message,
        "code": status_code
    }

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename for safe storage
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    import re
    # Remove invalid characters
    sanitized = re.sub(r'[^\w\s-]', '', filename)
    # Replace spaces with underscores
    sanitized = re.sub(r'\s+', '_', sanitized)
    return sanitized.lower()