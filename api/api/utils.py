import json
import logging
import datetime
import os
from datetime import datetime
from datetime import timedelta
from typing import List, Optional, Dict, Any
from fastapi import  HTTPException
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from bson import ObjectId
from pydantic import BaseModel, Field
from collections import deque
from asn1crypto import cms
from dateutil.parser import parse
from pypdf import PdfReader
from groq import Groq
from openai import OpenAI
from pymongo import MongoClient
import google.generativeai as genai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate



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
        "document_name","certificate_number", "issuing_authority", "issuance_date", 
        "expiry_date", "fire_equipment_details"
    ],
    "land_conversion_certificate": [
        "document_name","certificate_number", "issuing_authority", "issue_date", "applicant_name", "contact_information", 
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


class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    timestamp: str
    user_question: str
    ai_response: str

class LogsResponse(BaseModel):
    logs: str

class DocumentUploadRequest(BaseModel):
    file_path: str

vector_store = None
current_document_path = None

def configure_google_ai():
    """Configure Google Generative AI"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        logging.error("Google API key not found in environment variables.")
        raise HTTPException(status_code=500, detail="Google API key not configured")
    genai.configure(api_key=google_api_key)

def load_pdf(pdf_path):
    """Load PDF from given path"""
    try:
        pdf_reader = PdfReader(pdf_path)
        text_pages = []
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text:
                text_pages.append((text, i + 1))
        return text_pages
    except Exception as e:
        logging.error(f"Error reading PDF file {pdf_path}: {e}")
        return []

def get_text_chunks(text_pages):
    """Split text into chunks"""
    try:
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=10000, chunk_overlap=1000)
        chunks = []
        for text, page_num in text_pages:
            split_chunks = text_splitter.split_text(text)
            for chunk in split_chunks:
                chunks.append((chunk, page_num))
        return chunks
    except Exception as e:
        logging.error(f"Error splitting text into chunks: {e}")
        return []

def get_vector_store(text_chunks):
    """Create and save vector store"""
    global vector_store
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        texts = [chunk for chunk, _ in text_chunks]
        metadatas = [{"page_num": page_num} for _, page_num in text_chunks]
        vector_store = FAISS.from_texts(texts, embedding=embeddings, metadatas=metadatas)
        vector_store.save_local("faiss_index")
        return vector_store
    except Exception as e:
        logging.error(f"Error creating vector store: {e}")
        raise HTTPException(status_code=500, detail="Failed to create vector store")

def get_conversational_chain():
    """Set up conversational chain"""
    try:
        prompt_template = prompt = """
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
        
        Also, Greet with Hi if prompted
        """

        model = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.3)
        prompt = PromptTemplate(template=prompt_template, input_variables=["memory", "context", "question"])
        chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)
        return chain
    except Exception as e:
        logging.error(f"Error setting up conversational chain: {e}")
        raise HTTPException(status_code=500, detail="Failed to set up conversational chain")

def process_chat_query(user_question, chat_history):
    """Process user chat query"""
    try:
        # Ensure vector store is loaded
        if not vector_store:
            raise HTTPException(status_code=400, detail="No document loaded. Please upload a document first.")

        # Perform similarity search
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        docs = vector_store.similarity_search(user_question)

        # Prepare conversation memory
        memory = "\n".join([f"{msg.get('role', '')}: {msg.get('text', '')}" for msg in chat_history]) if chat_history else ""

        # Get conversational chain
        chain = get_conversational_chain()

        # Generate response
        response = chain({"memory": memory, "input_documents": docs, "question": user_question}, return_only_outputs=True)

        # Record timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return {
            "timestamp": timestamp, 
            "user_question": user_question, 
            "ai_response": response["output_text"]
        }
    except Exception as e:
        logging.error(f"Error processing user input: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ChatRequest(BaseModel):
    application_id: str
    query: str



class SimpleChatbot:
    def __init__(self, mongo_uri: str, groq_api_key: str):
        # MongoDB Connection
        self.client = MongoClient(mongo_uri)
        self.db = self.client['aicte']
        self.documents = self.db["docresults"]
        self.logs = self.db["logs"]

        # GROQ Client
        self.groq_client = Groq(api_key=groq_api_key)

    def get_application_data(self, application_id: str) -> tuple:
        """Fetch document and logs for a specific application ID"""
        try:
            # Convert to ObjectId if needed
            app_id = ObjectId(application_id)
            
            # Fetch document and logs
            document = self.documents.find_one({'application_id': app_id})
            logs = self.logs.find_one({'application_id': app_id})
            
            return document, logs
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Error fetching data: {str(e)}")

    def generate_response(self, document: Dict[str, Any], logs: Dict[str, Any], query: str) -> str:
        """Generate AI response using GROQ"""
        try:
            # Create context
            context = f"Document: {document}\nLogs: {logs}"
            
            # Create prompt
            full_prompt = f'''
            You are a status tracking chat bot and you need to answer to the queries. The context comprises of Document data and Logs comprise of logs of what was being processed.
            Context:\n{context}\n\n
            Query: {query}\n\nProvide a helpful response based on the context.
            '''
            
            # Generate response using GROQ
            chat_completion = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": full_prompt}],
                model="llama3-8b-8192"
            )
            
            return chat_completion.choices[0].message.content
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


def read_last_log_lines(lines_count=5):
    """Read last lines from log file"""
    try:
        with open('document_chat.log', 'r') as file:
            return ''.join(deque(file, maxlen=lines_count))
    except Exception as e:
        logging.error(f"Error reading log file: {e}")
        return f"Error reading log file: {e}"

def load_document():
    """Upload and process a document"""
    global vector_store, current_document_path
    
    file_path="Document/AICTE Doc.pdf"
    
    # Validate file path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found")
    
    # Load and process document
    text_pages = load_pdf(file_path)
    if not text_pages:
        raise HTTPException(status_code=400, detail="Failed to extract text from document")
    
    # Create vector store
    text_chunks = get_text_chunks(text_pages)
    get_vector_store(text_chunks)
    
    # Update current document path
    current_document_path = file_path
    
    return {"status": "success", "message": "Document processed successfully"}

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
            "overall_validity": true/false,
            "confidence_score": 0-100,
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
    """
    Allocate a task to the member with the least burden
    
    Args:
        members (List): List of members and their task details
    
    Returns:
        Updated list of members with task allocation
    """
    # Sort by number of tasks (ascending), then by earliest deadline
    members.sort(key=lambda x: (x[1], x[2]))
    
    # Select the member with the least burden
    selected_member = members[0]
    selected_member[1] += 1  # Increment task count
    selected_member[2] += timedelta(days=2)  # Extend deadline by 2 days

    return members

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