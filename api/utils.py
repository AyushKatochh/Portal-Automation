import json
import logging
import datetime
import io
import fitz  
import base64
from datetime import datetime
from datetime import timedelta
from typing import List, Optional, Dict, Any
from fastapi import  HTTPException
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
from pydantic import BaseModel, Field
from collections import deque
from asn1crypto import cms
from dateutil.parser import parse
from pypdf import PdfReader
from groq import Groq
from openai import OpenAI
from pymongo import MongoClient
from PyPDF2 import PdfReader
from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = 'mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(MONGO_URI)
db = client['aicte']
admins_collection = db['admins']


logging.basicConfig(
    filename='document_chat.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

DOCUMENT_KEYWORDS = {
    "fire_safety_certificate": [
        "document_name", "issuing_authority", "issuance_date", 
        "expiry_date", "fire_equipment_details"
    ],
    "land_conversion_certificate": [
        "issuing_authority", "issue_date", "applicant_name", "contact_information", 
        "location", "area_of_land"
    ],
    "affidavit": [
        "document_name","stamp_paper_type", "notary_registration_number", 
        "oath_commissioner_name", "verification_place", 
        "verification_date", "executant_name", "executant_designation"
    ],
    "bank_certificate": [
        "document_name","account_holder_name", "account_number", "bank_name", 
        "bank_address", "fdr_details", "balance_verification", 
        "certificate_date", "certificate_place"
    ],
    "architect_certificate": [
        "document_name","approval_authority", "approval_number", "approval_date", 
        "room_details", "occupancy_certificate", "structural_stability_certificate"
    ],
    "mou_document": [
        "indian_institute_name", "foreign_institute_name", 
        "document_reference_number", "date_of_issue", 
        "event_date", "event_time", "venue", "purpose", 
        "key_participants"
    ],
    "occupancy_certificate": [
       "document_name", "memo_number", "date_of_issue", "holding_number", 
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
            if isinstance(v, (str, int, datetime))
        ]

    def __str__(self):
        """String representation of object"""
        values = ", ".join([
            f"{k}={v}" for k, v in self.__values_for_str__()
        ])
        return f"{self._cls_name or self.__class__.__name__}({values})"

    def __repr__(self):
        return f"<{self}>"

vector_store = None
current_document_path = None

class PDFProcessor:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
    
    def load_pdf(self):
        pdf_reader = PdfReader(self.pdf_path)
        text_pages = []
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text:
                text_pages.append(text)
        return text_pages
    
    def chunk_text(self, text_pages, chunk_size=500):
        chunks = []
        for text in text_pages:
            words = text.split()
            for i in range(0, len(words), chunk_size):
                chunk = ' '.join(words[i:i + chunk_size])
                chunks.append(chunk)
        return chunks
    
class ChatBot:
    def __init__(self, api_key):
        self.client = Groq(api_key=api_key)
    
    def get_response(self, user_question, context_chunks=None):
        context = " ".join(context_chunks[:2]) if context_chunks else ""
        
        messages = [
            {
                "role": "system", 
                "content": '''
                    You are an expert intelligent document assistant designed to interpret and provide comprehensive responses specifically for the AICTE Approval Process Handbook (2024-2027).
                
                ### Guidelines:
                1. Explain thoroughly: Provide detailed, accurate answers based on the provided document content.
                2. Document-based responses: Always prioritize the document's content. If a question cannot be directly answered from the document, state so explicitly and recommend reviewing relevant sections or consulting AICTE directly.
                3. Concise summaries: When appropriate, summarize information clearly for quick comprehension, while retaining accuracy.

                ### Context:
                - **Document Scope:** 
                - Approval and operational guidelines for technical institutions in India.
                - Key policies from the AICTE Act and related regulatory frameworks.
                - **Previous Conversations:**\n{memory}
                - **Extracted Document Highlights:**\n{context}

                ### Task:
                - Use the uploaded handbook as your sole reference.
                - Provide a detailed and well-organized answer to the following user query:\n**{question}**
                
                Also, Greet with Hi if prompted. Do not explicitly mention that the document is AITCE Student Handbook. It is your answer you need to own it.
                '''
            },
            {
                "role": "user", 
                "content": f"Context: {context}\n\nQuestion: {user_question}"
            }
        ]
        
        try:
            response = self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=messages,
                temperature=0.2,
                max_tokens=512
            )
            
            return response.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
# Pydantic models for request validation and response
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class ChatRequestDocument(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    question: str
    ai_response: str
    timestamp: str

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

            # Enforce overall validity based on document type match
            uploaded_doc_type = json_data.get('document_type', '').lower()
            expected_doc_type = document_type.lower()
            
            if uploaded_doc_type != expected_doc_type:
                validation_result['overall_validity'] = False
                validation_result['validation_notes'] = f"Document type mismatch. Expected {expected_doc_type}, got {uploaded_doc_type}"

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
        """
        # First, check if the uploaded document type matches the expected type
        uploaded_doc_type = json_data.get('document_name', '').lower()
        

        expected_doc_type = document_type.lower()

        # Validation rules based on the document type
        validation_guidelines = {
                "fire_safety_certificate": {
                "required_fields": [
                "document_type",
                "certificate_number",
                "issuing_authority",
                "issuance_date",
                "expiry_date",
                "fire_equipment_details"
                ],
                "validation_criteria": """
                Validation Criteria for Fire Safety Certificate:
                - Certificate Number must be unique and from a recognized authority
                - Validate issuance and expiry dates
                - Confirm comprehensive fire equipment details
                """
                },
                "land_conversion_certificate": {
                "required_fields": [
                "document_type",
                "certificate_number",
                "issuing_authority",
                "issue_date",
                "applicant_name",
                "location",
                "area_of_land"
                ],
                "validation_criteria": """
                Validation Criteria for Land Conversion Certificate:
                - Ensure document type is exactly 'Land Conversion Certificate'
                - Validate certificate number and issuing authority
                - Confirm applicant details and land location
                - Check area of land specifications
                """
                },
                "affidavit": {
                "required_fields": [
                "document_type",
                "stamp_paper_type",
                "notary_registration_number",
                "oath_commissioner_name",
                "verification_place",
                "verification_date",
                "executant_name",
                "executant_designation"
                ],
                "validation_criteria": """
                Validation Criteria for Affidavit:
                - Ensure document type is exactly 'Affidavit'
                - Validate stamp paper details
                - Confirm notary registration number
                - Check verification details and executant information
                """
                },
                "bank_certificate": {
                "required_fields": [
                "document_type",
                "account_holder_name",
                "account_number",
                "bank_name",
                "bank_address",
                "fdr_details",
                "balance_verification",
                "certificate_date",
                "certificate_place"
                ],
                "validation_criteria": """
                Validation Criteria for Bank Certificate:
                - Ensure document type is exactly 'Bank Certificate'
                - Validate account holder and account details
                - Confirm bank information
                - Check FDR and balance verification details
                """
                }
            }

        # Prepare specific validation instructions
        specific_instructions = validation_guidelines.get(expected_doc_type, {})

        prompt = f"""
        CRITICAL VALIDATION RULES:
        1. Document Type Matching: 
           - Uploaded Document Type: {uploaded_doc_type}
           - Expected Document Type: {expected_doc_type}
           - STRICT REQUIREMENT: Should be Same.
           - If types do NOT match, document is INVALID

        Perform comprehensive semantic validation:

        Document Type: {document_type}
        Document Data: {json.dumps(json_data, indent=2)}

        Validation Criteria:
        {specific_instructions.get('validation_criteria', 'No specific validation criteria')}

        Required Fields: {specific_instructions.get('required_fields', [])}

        Response Format (MUST be valid JSON):
        {{
            "overall_validity": true/false (If confidence score is above 90 give true else false),
            "confidence_score": (no. of true / total true )*100,
            "field_validations": {{
                "document_type": {{
                    "is_valid": true/false,
                    "confidence_score": 0-100,
                    "notes": "Type matching result"
                }}
            }},
            "validation_notes": "Overall validation observations. keep it positive if confidence score is good else give it negative",
            "potential_issues": ["list of potential problems"]
        }}

        VALIDATION PROCESS:
        1. Check document type match first
        2. If types match, perform detailed field validation
        3. If types do NOT match, set overall_validity to FALSE
        """
        return prompt

    def _adjust_confidence_score(self, score: int, field: str) -> int:
        """
        Dynamically adjust confidence scores
        """
        critical_fields = ["document_type", "certificate_number", "issuing_authority"]
        if field in critical_fields and score > 90:
            return max(score - 5, 85)
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


def extract_first_image_from_pdf(pdf_bytes):

    # Open the PDF from bytes
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
   
        
    # Try to extract first image
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Extract images from the page
        image_list = page.get_images(full=True)
        
        if image_list:
            # Extract the first image
            xref = image_list[0][0]
            base_image = doc.extract_image(xref)
            
            # Get image data
            image_bytes = base_image["image"]
            
            # Convert to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # Close the document
            doc.close()
            
            return base64_image
    
    # Close the document
    doc.close()
    
    # Return None if no images found
    return None

def detect_text(image_bytes):
    """Detects text in the image bytes."""
    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=image_bytes)

    # for dense text
    response = client.document_text_detection(image=image)
    texts = response.text_annotations
    ocr_text = []

    for text in texts:
        ocr_text.append(text.description)

    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )
    return " ".join(ocr_text)

def analyze_architectural_plan(ocr_text):
    """
    Analyze the OCR text using Groq and Llama 3 to generate 
    a detailed architectural documentation plan
    """
    aicte_validation='''
            The Approval Process Handbook provides detailed norms and standards for infrastructure and physical facilities for technical institutions. Below are key guidelines:

        1. Built-Up Area Requirements
                The minimum built-up area required for institutions varies based on the type of program and student intake capacity:
                Diploma Programs:  
                    Minimum Requirement: 500 square meters per 100 students.
                Undergraduate Programs: 
                    Minimum Requirement: 750 square meters per 100 students.
                Postgraduate Programs:
                    Minimum Requirement: 1,000 square meters per 100 students.
        2. Land Requirements
                The required land area depends on the type of institution and program offered:
                Polytechnic Institutions:
                    Minimum Land Area: 2.5 acres.
                Engineering Colleges:
                    Minimum Land Area: 10 acres.
        3. General Infrastructure Guidelines
                Institutions must ensure:
                    Adequate space for classrooms, laboratories, libraries, faculty offices, and common areas.
                    Compliance with local building codes and safety regulations.
                    Proper allocation of space to support effective learning and student activities.
            Important Note
            While these guidelines provide a framework for infrastructure planning, they do not include specific instructions on dimensional analysis of maps or arranging students according to area. 
            Institutions are advised to use the provided norms to create facilities that comfortably accommodate students and enhance the learning environment.
    '''
    # Initialize Groq client
    client = Groq(
        api_key=os.getenv('GROQ_API_KEY')
    )

    # Construct a detailed prompt for architectural analysis
    prompt = f"""You are an expert architectural analyst. 
    Given the following OCR-extracted text from an architectural plan:

    {ocr_text}

    Please provide a comprehensive architectural documentation plan that includes:
    Make sure to start with the Architectural Plan states ......
    1. Detailed description of the architectural elements
    2. Structural insights and key design features
    3. Potential construction considerations
    4. Material specifications (if discernible)
    5. Scale and dimensional analysis
    6. Any unique or noteworthy design characteristics
    7. Provide a dimensional report of each floor and each type of room.
    8. give me the area of different regions eg. classroom, playground, and the total institute
    
    Make sure to give 8th point with maximum accuracy.

    Analyze the text thoroughly and extract as much architectural information as possible.
    
    Also create the dimensional analysis in this format:
    Validate the results from dimensional extraction with the {aicte_validation} guidelines.
    1. Create a comparative analysis and make sure that aicte_validation is STRICTLY followed. 
    2. Create another analysis on how many maximum students can be accomodated on which room based on department.
    3. Do not mention if you are not clear or document is not clear. Please specify if the map is not clear.
    4. If you find any student value as negative or in fraction then round off.
    5. If you find area as negative then turn it positive.
    6. If you find any student value as zero then consider it as 1.
    
    In the end do not provide any precautionary guideline.
    Also do not mention anything about accuracy
    
    """

    # Create chat completion
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama3-8b-8192"  # Groq's Llama 3 model
    )

    # Return the generated analysis
    return chat_completion.choices[0].message.content

def verify_signature(signatures_info):
    signer_names=['DigiSigner', 'Arch']
    if signatures_info[0].get('signer_name') in signer_names:
        return True
    else:
        return False
    
    
def get_ai_client():
    """Initialize and return the AI client"""
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )

# Function for extracting document information
def extract_document_info(text: str, keywords: List[str], client: OpenAI) -> Dict[str, Any]:
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


def get_members_scrutiny():
    """
    Retrieve members from the Scrutiny committee
    
    Returns:
        List of members with their task details
    """
    member = []
    admins = list(admins_collection.find({"committee": "Scrutiny"}))
    for admin in admins:
        admin_id = str(admin.get('_id'))
        no_of_tasks = len(admin.get('applications', []))
        if admin.get('applications'):
            latest_deadline = max(app['deadline'] for app in admin['applications'])
        else:
            latest_deadline = datetime.min  # No applications allocated yet
        member.append([admin_id, no_of_tasks, latest_deadline])
    return member

def get_members_expert():
    """
    Retrieve members from the Scrutiny committee
    
    Returns:
        List of members with their task details
    """
    member = []
    admins = list(admins_collection.find({"committee": "Expert Visit"}))
    for admin in admins:
        admin_id = str(admin.get('_id'))
        no_of_tasks = len(admin.get('applications', []))
        if admin.get('applications'):
            latest_deadline = max(app['deadline'] for app in admin['applications'])
        else:
            latest_deadline = datetime.min  # No applications allocated yet
        member.append([admin_id, no_of_tasks, latest_deadline])
    return member

def allocate_task(members):

    # Sort by number of tasks (ascending), then by earliest deadline
    members.sort(key=lambda x: (x[1], x[2]))
    
    # Select the member with the least burden
    selected_member = members[0]
    selected_member[1] += 1  # Increment task count
    selected_member[2] += timedelta(days=2)  # Extend deadline by 2 days

    return members

def parse_pkcs7_signatures(signature_data: bytes):

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