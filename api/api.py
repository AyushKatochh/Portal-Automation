from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
from typing import Dict, Any
from utils import (
    validate_pdf_signature,
    process_document_for_ocr,
    cleanup_file
)

app = FastAPI(
    title="Document Processing API",
    description="API for PDF signature validation and OCR processing",
    version="1.0.0"
)

# Directory to temporarily store uploaded files
UPLOAD_FOLDER = "./uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/ocr/", 
         response_model=Dict[str, str],
         summary="Perform OCR on uploaded document",
         description="Extract text from an uploaded image or PDF file using OCR")
async def perform_ocr(file: UploadFile = File(...)) -> JSONResponse:
    # Validate file type
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image or a PDF."
        )

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Process the document
        extracted_text = process_document_for_ocr(
            file_path,
            is_pdf=(file.content_type == "application/pdf")
        )

        return JSONResponse(
            content={"extracted_text": extracted_text},
            status_code=200
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_file(file_path)

@app.post("/validate-signature/",
          response_model=Dict[str, Any],
          summary="Validate PDF digital signatures",
          description="Check and validate digital signatures in a PDF document")
async def validate_signature(file: UploadFile = File(...)) -> JSONResponse:
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

@app.get("/", response_model=Dict[str, str])
async def root() -> Dict[str, str]:
    return {
        "message": "Document Processing API is running",
        "endpoints": {
            "OCR": "/ocr/",
            "Signature Validation": "/validate-signature/"
        }
    }