import os
import io
import fitz  # PyMuPDF
import base64
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
import uvicorn

# Import existing utility functions (these would be in a separate utils.py)
from utils import (
    get_pdf_signatures,
    verify_signature,
    extract_first_image_from_pdf,
    detect_text,
    analyze_architectural_plan,
    process_document_for_ocr,
    cleanup_file,
    DOCUMENT_KEYWORDS,
    get_ai_client,
    DocumentValidationRequest,
    extract_document_info,
    validator,
    get_members_expert,
    get_members_scrutiny,
    allocate_task,
    ChatRequestDocument,
    ChatResponse,
    PDFProcessor,
    ChatBot,
    
)
from ChatBot import(
    load_status_chat,
    ChatRequestStatus
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
MONGO_URI = 'mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/aicte?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(MONGO_URI)
db = client['aicte']
admins_collection = db['admins']

@app.post("/analyze-plan/")
async def process_architectural_plans(file: UploadFile = File(...)):

    # Read file contents
    file_contents = await file.read()
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    document_name = os.path.basename(file_path)
    
    
    # Determine file type
    file_extension = file.filename.split('.')[-1].lower()
    
    # Store results
    results = {}
    try:
        with open(file_path, 'wb') as f:
            f.write(file_contents)
            signatures_info=[]
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
                                # signatures_info = [{"error": str(sig_error)}]
                                        # except Exception as sig_error:
                                return JSONResponse(
                                    content={
                                        "status": "error", 
                                        "message": f"Signature Validation Failed: {str(sig_error)}"
                                    }, 
                                    status_code=400
                                )
        if verify_signature(signatures_info):
            # Process based on file type
            if file_extension == 'pdf':
                # Extract first image from PDF
                base64_image = extract_first_image_from_pdf(file_contents)
                
                if not base64_image:
                    raise HTTPException(status_code=404, detail="No images found in the PDF")
            else:
                # Treat as single image
                base64_image = base64.b64encode(file_contents).decode('utf-8')
                
            # Decode base64 image
            image_bytes = base64.b64decode(base64_image)
            
            # Perform OCR
            ocr_text = detect_text(image_bytes)
            
            # Analyze architectural plan
            analysis = analyze_architectural_plan(ocr_text)
            
            # Store results
            return JSONResponse(
                content={
                    "analysis":analysis
                }
            )
        else:
            return JSONResponse(
                content={
               "result" : "The signature is not verified"
                }
            )

    except Exception as e:
        # Raise HTTP exception for overall processing error
        raise HTTPException(status_code=500, detail=str(e))




@app.post("/status_chat")
async def chat_with_application(request: ChatRequestStatus):
    
    chatbot=load_status_chat()
    try:
        # Fetch application data
        document, logs = chatbot.get_application_data(request.application_id)
        
        # Generate response
        response = chatbot.generate_response(document, logs, request.query)
        
        return {
            "status": "success",
            "response": response
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/document_chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequestDocument):
    try:
        pdf_processor = PDFProcessor("Document/AICTE Doc.pdf")
        text_pages = pdf_processor.load_pdf()
        text_chunks = pdf_processor.chunk_text(text_pages)
        chatbot = ChatBot(os.getenv("GROQ_API_KEY"))
        # Get current timestamp
        current_timestamp = datetime.now().isoformat()
    
        
        # Get AI response with context
        ai_response = chatbot.get_response(request.question, text_chunks)
        
        return JSONResponse(content={
            "timestamp": current_timestamp,
            "question": request.question,
            "ai_response": ai_response,
            
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schedule_expert")
async def get_next_deadline():
    try:
        # Get current members
        members = get_members_expert()
        
        # Allocate task (which sorts and selects the least burdened member)
        updated_members = allocate_task(members)
        
        # Select the first member (least burdened)
        selected_member = updated_members[0]
        
        return {
            "admin_id": selected_member[0],
            "new_deadline": selected_member[2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/schedule_scrutiny")
async def get_next_deadline():

    try:
        # Get current members
        members = get_members_scrutiny()
        
        # Allocate task (which sorts and selects the least burdened member)
        updated_members = allocate_task(members)
        
        # Select the first member (least burdened)
        selected_member = updated_members[0]
        
        return {
            "admin_id": selected_member[0],
            "new_deadline": selected_member[2]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process-and-validate/")
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
                            # signatures_info = [{"error": str(sig_error)}]
                                    # except Exception as sig_error:
                            return JSONResponse(
                                content={
                                    "status": "error", 
                                    "message": f"Signature Validation Failed: {str(sig_error)}"
                                }, 
                                status_code=400
                            )    
                        

        # Combine results
        combined_result = {
            "document_type": document_type,
            "ocr_extraction": extracted_info['extracted_data'],
            "signatures": signatures_info
        }
        

 
        validation_result = validator.validate_document(
                    document_type=combined_result['document_type'],
                    json_data=combined_result
                )
        # return validation_result
        #     except Exception as e:
        #     raise HTTPException(status_code=500, detail=str(e))
        
        final_result={
                "document_type":document_type,
                "combined_result":combined_result,
                "validation_result":validation_result,
                
            }
        
        return JSONResponse(content=final_result, status_code=200)

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
            "Task Allocation for Scrutiny Members":"/schedule_scrutiny",
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

















































































