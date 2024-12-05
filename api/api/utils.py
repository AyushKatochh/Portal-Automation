import PyPDF2
import json
from datetime import datetime
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from cryptography.x509 import load_der_x509_certificate
from cryptography.exceptions import InvalidSignature
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
from pydantic import BaseModel, Field
import datetime
import sys
from asn1crypto import cms
from dateutil.parser import parse
from pypdf import PdfReader
from groq import Groq
from openai import OpenAI


DOCUMENT_KEYWORDS = {
    "fire_safety_certificate": [
        "certificate_number", "issuing_authority", "issuance_date", 
        "expiry_date", "fire_equipment_details"
    ],
    "land_conversion_certificate": [
        "certificate_number", "issuing_authority", "issue_date", "applicant_name", "contact_information", 
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

class AttrClass:
    """Abstract helper class"""

    def __init__(self, data, cls_name=None):
        self._data = data
        self._cls_name = cls_name

    def __getattr__(self, name):
        try:
            value = self._data[name]
        except KeyError:
            value = None
        else:
            if isinstance(value, dict):
                return AttrClass(value, cls_name=name.capitalize() or self._cls_name)
        return value

    def __values_for_str__(self):
        """Values to show for "str" and "repr" methods"""
        return [
            (k, v) for k, v in self._data.items()
            if isinstance(v, (str, int, datetime.datetime))
        ]

    def __str__(self):
        """String representation of object"""
        values = ", ".join([
            f"{k}={v}" for k, v in self.__values_for_str__()
        ])
        return f"{self._cls_name or self.__class__.__name__}({values})"

    def __repr__(self):
        return f"<{self}>"


class Signature(AttrClass):
    """Signature helper class

    Attributes:
        type (str): 'timestamp' or 'signature'
        signing_time (datetime, datetime): when user has signed
            (user HW's clock)
        signer_name (str): the signer's common name
        signer_contact_info (str, None): the signer's email / contact info
        signer_location (str, None): the signer's location
        signature_type (str): ETSI.cades.detached, adbe.pkcs7.detached, ...
        certificate (Certificate): the signers certificate
        digest_algorithm (str): the digest algorithm used
        message_digest (bytes): the digest
        signature_algorithm (str): the signature algorithm used
        signature_bytes (bytest): the raw signature
    """

    @property
    def signer_name(self):
        return (
            self._data.get('signer_name') or
            getattr(self.certificate.subject, 'common_name', '')
        )


class Subject(AttrClass):
    """Certificate subject helper class

    Attributes:
        common_name (str): the subject's common name
        given_name (str): the subject's first name
        surname (str): the subject's surname
        serial_number (str): subject's identifier (may not exist)
        country (str): subject's country
    """
    pass


class Certificate(AttrClass):
    """Signer's certificate helper class

    Attributes:
        version (str): v3 (= X509v3)
        serial_number (int): the certificate's serial number
        subject (object): signer's subject details
        issuer (object): certificate issuer's details
        signature (object): certificate signature
        extensions (list[OrderedDict]): certificate extensions
        validity (object): validity (not_before, not_after)
        subject_public_key_info (object): public key info
        issuer_unique_id (object, None): issuer unique id
        subject_uniqiue_id (object, None): subject unique id
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.subject = Subject(self._data['subject'])

    def __values_for_str__(self):
        return (
            super().__values_for_str__() +
            [('common_name', self.subject.common_name)]
        )

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
            - Issue Date : Confirm issue date, and renewal requirements.
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



def parse_pkcs7_signatures(signature_data: bytes):
    """Parse a PKCS7 / CMS / CADES signature"""
    content_info = cms.ContentInfo.load(signature_data).native
    if content_info['content_type'] != 'signed_data':
        return None
    content = content_info['content']
    certificates = content['certificates']
    # each PKCS7 / CMS / CADES could have several signatures
    signer_infos = content['signer_infos']
    for signer_info in signer_infos:
        # the sid key should point to the certificates collection
        sid = signer_info['sid']
        digest_algorithm = signer_info['digest_algorithm']['algorithm']
        signature_algorithm = signer_info['signature_algorithm']['algorithm']
        signature_bytes = signer_info['signature']
        # signed attributes is a list of key, value pairs
        # oversimplification: normally we have no repeated attributes
        signed_attrs = {
            sa['type']: sa['values'][0] for sa in signer_info['signed_attrs']}
        # find matching certificate, only for issuer / serial number
        for cert in certificates:
            cert = cert['tbs_certificate']
            if (
                sid['serial_number'] == cert['serial_number'] and
                sid['issuer'] == cert['issuer']
            ):
                break
        else:
            raise RuntimeError(
                f"Couldn't find certificate in certificates collection: {sid}")
        yield dict(
            sid=sid,
            certificate=Certificate(cert),
            digest_algorithm=digest_algorithm,
            signature_algorithm=signature_algorithm,
            signature_bytes=signature_bytes,
            signer_info=signer_info,
            **signed_attrs,
        )


def get_pdf_signatures(filename):
    """Parse PDF signatures"""
    reader = PdfReader(filename)
    fields = reader.get_fields().values()
    signature_field_values = [
        f.value for f in fields if f.field_type == '/Sig']
    for v in signature_field_values:
        # - signature datetime (not included in pkcs7) in format:
        #   D:YYYYMMDDHHmmss[offset]
        #   where offset is +/-HH'mm' difference to UTC.
        v_type = v['/Type']
        if v_type in ('/Sig', '/DocTimeStamp'):  # unknow types are skipped
            is_timestamp = v_type == '/DocTimeStamp'
            try:
                signing_time = parse(v['/M'][2:].strip("'").replace("'", ":"))
            except KeyError:
                signing_time = None
            # - used standard for signature encoding, in my case:
            # - get PKCS7/CMS/CADES signature package encoded in ASN.1 / DER format
            raw_signature_data = v['/Contents']
            # if is_timestamp:
            for attrdict in parse_pkcs7_signatures(raw_signature_data):
                if attrdict:
                    attrdict.update(dict(
                        type='timestamp' if is_timestamp else 'signature',
                        signer_name=v.get('/Name'),
                        signer_contact_info=v.get('/ContactInfo'),
                        signer_location=v.get('/Location'),
                        signing_time=signing_time or attrdict.get('signing_time'),
                        signature_type=v['/SubFilter'][1:],  # ETSI.CAdES.detached, ...
                        signature_handler=v['/Filter'][1:],
                        raw=raw_signature_data,
                    ))
                    yield Signature(attrdict)

def decode_pdf_string(value: Any) -> str:
    """
    Decode PDF string values that might be bytes or string.
    """
    if isinstance(value, bytes):
        return value.decode('utf-8', errors='ignore')
    return str(value)

def process_document_for_ocr(file_path: str, is_pdf: bool) -> str:
    """
    Process a document (PDF or image) for OCR.
    """
    extracted_text = ""
    
    if is_pdf:
        # Process PDF: Convert each page to an image
        images = convert_from_path(file_path)
        for page_number, image in enumerate(images, start=1):
            text = pytesseract.image_to_string(image)
            extracted_text += f"Page {page_number}:\n{text}\n\n"
    else:
        # Process Image: Perform OCR directly
        img = Image.open(file_path)
        extracted_text = pytesseract.image_to_string(img)
    
    return extracted_text

def cleanup_file(file_path: str) -> None:
    """
    Safely remove a file if it exists.
    """
    if os.path.exists(file_path):
        os.remove(file_path)