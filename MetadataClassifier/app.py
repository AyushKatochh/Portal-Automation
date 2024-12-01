import os
import json
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAI
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="Document Extraction API",
    description="AI-powered document information extraction service",
    version="1.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic models for request validation
class DocumentData(BaseModel):
    text: str = Field(..., min_length=10, description="Document text content")

class ExtractionRequest(BaseModel):
    documents: Dict[str, DocumentData]
    keywords: List[str] = Field(default_factory=list, description="Optional keywords to extract")

# OpenAI/Groq Client Configuration
def get_ai_client():
    """Initialize and return the AI client"""
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )

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
                {
                    "role": "system", 
                    "content": "You are an expert document information extractor. Respond with precise, structured JSON."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.2
        )

        # Parse and return extracted information
        return {
            "type": document_type,
            "extracted_data": json.loads(response.choices[0].message.content),
            "keyword_values": {keyword: json.loads(response.choices[0].message.content).get(keyword, None) for keyword in keywords} if keywords else {}
        }

    except Exception as e:
        # Handle extraction errors
        return {
            "type": document_type,
            "error": str(e),
            "keyword_values": {keyword: None for keyword in keywords} if keywords else {}
        }

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

@app.get("/health")
def health_check():
    """Simple health check endpoint"""
    return {
        "status": "healthy",
        "message": "Document Extraction API is operational"
    }

def main():
    """Run the FastAPI application"""
    uvicorn.run(
        "main:app", 
        host='0.0.0.0', 
        port=8000, 
        reload=True
    )

if __name__ == '__main__':
    main()