import PyPDF2
import json
from datetime import datetime
from typing import Dict, Any
from cryptography.x509 import load_der_x509_certificate
from cryptography.exceptions import InvalidSignature
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os

def validate_pdf_signature(pdf_path: str) -> Dict[str, Any]:
    """
    Validate digital signatures in a PDF and return detailed information.
    """
    result = {
        "file_path": pdf_path,
        "has_signatures": False,
        "validation_time": datetime.now().isoformat(),
        "signatures": [],
        "status": "success",
        "message": ""
    }
    
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Check for AcroForm signatures
            if hasattr(pdf_reader, 'AcroForm') and pdf_reader.AcroForm:
                for field in pdf_reader.AcroForm.get('/Fields', []):
                    if field.get('/FT') == '/Sig' and field.get('/V'):
                        result["has_signatures"] = True
                        sig_dict = field['/V']
                        sig_info = extract_signature_info(sig_dict)
                        result["signatures"].append(sig_info)
            
            # Check for document-level certification
            if '/Perms' in pdf_reader.trailer['/Root']:
                perms = pdf_reader.trailer['/Root']['/Perms']
                if '/DocMDP' in perms:
                    result["has_signatures"] = True
                    result["signatures"].append({
                        "type": "certification_signature",
                        "validation_status": "certification_present",
                        "details": "Document contains a certification signature"
                    })
            
            if not result["signatures"]:
                result["message"] = "No digital signatures found in the PDF"
            else:
                result["message"] = f"Found {len(result['signatures'])} signature(s)"
                
    except FileNotFoundError:
        result["status"] = "error"
        result["message"] = "PDF file not found"
    except Exception as e:
        result["status"] = "error"
        result["message"] = f"Error analyzing PDF: {str(e)}"
    
    return result

def extract_signature_info(sig_dict: Dict) -> Dict[str, Any]:
    """
    Extract signature information from a signature dictionary.
    """
    sig_info = {
        "type": "digital_signature",
        "subfilter": decode_pdf_string(sig_dict.get('/SubFilter', '')),
        "signer_info": {},
        "timestamp": None,
        "location": decode_pdf_string(sig_dict.get('/Location', '')),
        "reason": decode_pdf_string(sig_dict.get('/Reason', '')),
        "validation_status": "unknown"
    }
    
    # Extract certificate information
    if '/Cert' in sig_dict:
        sig_info["signer_info"] = extract_certificate_info(sig_dict['/Cert'])
    
    # Extract timestamp
    if '/M' in sig_dict:
        sig_info["timestamp"] = decode_pdf_string(sig_dict['/M'])
    
    # Validate signature
    sig_info.update(validate_signature(sig_dict))
    
    return sig_info

def extract_certificate_info(cert_data: bytes) -> Dict[str, Any]:
    """
    Extract information from a certificate.
    """
    try:
        if isinstance(cert_data, bytes):
            cert = load_der_x509_certificate(cert_data)
            return {
                "subject": str(cert.subject),
                "issuer": str(cert.issuer),
                "serial_number": str(cert.serial_number),
                "valid_from": cert.not_valid_before.isoformat(),
                "valid_until": cert.not_valid_after.isoformat(),
                "verification_status": "valid" if datetime.now() < cert.not_valid_after else "expired"
            }
    except Exception as cert_error:
        return {"error": str(cert_error)}
    return {}

def validate_signature(sig_dict: Dict) -> Dict[str, str]:
    """
    Validate a signature dictionary.
    """
    try:
        if '/Contents' in sig_dict and '/ByteRange' in sig_dict:
            return {"validation_status": "signature_present"}
        return {"validation_status": "invalid_format"}
    except Exception as validation_error:
        return {
            "validation_status": "validation_error",
            "validation_error": str(validation_error)
        }

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