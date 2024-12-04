import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from utils import (
    DOCUMENT_KEYWORDS,
    UPLOAD_FOLDER,
    DocumentValidationRequest,
    GroqDocumentValidator,
    OCRResult,
    ExtractionRequest,
    get_ai_client,
    extract_document_info,
    process_document_for_ocr,
    get_pdf_signatures,
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

# Create upload directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize validator
validator = GroqDocumentValidator()

@app.post("/validate-document", response_model=dict)
async def validate_document(request: DocumentValidationRequest):
    """Endpoint for document validation"""
    try:
        validation_result = validator.validate_document(
            document_type=request.document_type,
            json_data=request.json_data
        )
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_document/")
async def process_document_comprehensively(
    file: UploadFile = File(...), 
    document_type: str = File(...)
):
    """Process document with comprehensive analysis"""
    # Validate file type
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    # Validate document type
    if document_type not in DOCUMENT_KEYWORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {', '.join(DOCUMENT_KEYWORDS.keys())}"
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    try:
        # Save file
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Extract information
        client = get_ai_client()
        keyword_list = DOCUMENT_KEYWORDS[document_type]
        extracted_text = process_document_for_ocr(
            file_path,
            is_pdf=(file.content_type == "application/pdf")
        )
        extracted_info = extract_document_info(extracted_text, keyword_list, client)

        # Process signatures for PDFs
        signatures_info = []
        if file.content_type == "application/pdf":
            try:
                signatures_info = [
                    {
                        "type": str(sig.type),
                        "signature": str(sig),
                        "signer_name": str(sig.signer_name),
                        "signing_time": str(sig.signing_time),
                        "certificate": {
                            "validity": {
                                "not_before": str(sig.certificate.validity.not_before),
                                "not_after": str(sig.certificate.validity.not_after),
                            },
                            "issuer": str(sig.certificate.issuer),
                            "subject": {
                                "common_name": str(sig.certificate.subject.common_name),
                                "serial_number": str(sig.certificate.subject.serial_number),
                            }
                        }
                    }
                    for sig in get_pdf_signatures(file_path)
                ]
            except Exception as sig_error:
                signatures_info = [{"error": str(sig_error)}]

        return JSONResponse(content={
            "status": "success",
            "document_type": document_type,
            "ocr_extraction": extracted_info['extracted_data'],
            "signatures": signatures_info
        })

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)}, 
            status_code=500
        )
    finally:
        cleanup_file(file_path)

@app.post("/ocr_and_extract/")
async def perform_ocr(file: UploadFile = File(...), document_type: str = Body(...)):
    """Perform OCR on uploaded document"""
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    if document_type not in DOCUMENT_KEYWORDS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: {', '.join(DOCUMENT_KEYWORDS.keys())}"
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    document_name = os.path.basename(file_path)

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        extracted_text = process_document_for_ocr(
            file_path,
            is_pdf=(file.content_type == "application/pdf")
        )

        client = get_ai_client()
        keyword_list = DOCUMENT_KEYWORDS[document_type]
        ocr_result = OCRResult(
            documents={document_name: {"text": extracted_text, "document_type": document_type}},
            document_type=document_type
        )

        results = {
            doc_type: extract_document_info(doc_data['text'], keyword_list, client)
            for doc_type, doc_data in ocr_result.documents.items()
        }

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

@app.post("/validate-signature/")
async def validate_signature(file: UploadFile = File(...)):
    """Validate digital signatures in a PDF document"""
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be a PDF."
        )

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        signatures_info = [
            {
                "type": str(sig.type),
                "signature": str(sig),
                "signer_name": str(sig.signer_name),
                "signing_time": str(sig.signing_time),
                "certificate": {
                    "validity": {
                        "not_before": str(sig.certificate.validity.not_before),
                        "not_after": str(sig.certificate.validity.not_after),
                    },
                    "issuer": str(sig.certificate.issuer),
                    "subject": {
                        "common_name": str(sig.certificate.subject.common_name),
                        "serial_number": str(sig.certificate.subject.serial_number),
                    }
                }
            }
            for sig in get_pdf_signatures(file_path)
        ]
        
        return JSONResponse(content={"signatures": signatures_info})
    except Exception as e:
        return JSONResponse(
            content={"error": "No Valid digital signature", "details": str(e)}, 
            status_code=500
        )
    finally:
        cleanup_file(file_path)

@app.post("/extract")
def process_document_extraction(request: ExtractionRequest):
    """Process multiple documents for information extraction"""
    try:
        client = get_ai_client()
        results = {
            doc_name: extract_document_info(doc_data.text, request.keywords, client)
            for doc_name, doc_data in request.documents.items()
        }

        return {
            "status": "success",
            "results": results,
            "total_documents": len(results),
            "keywords": request.keywords
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Flexible Document Processing API is running",
        "endpoints": {
            "Comprehensive Processing": "/process_document/",
            "OCR and Extract": "/ocr_and_extract/",
            "Signature Validation": "/validate-signature/",
            "Information Extraction": "/extract"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)