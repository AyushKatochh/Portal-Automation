import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from groq import Groq
from datetime import datetime

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

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
                
                Also, Greet with Hi if prompted. Do not explicitly mention document name.
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

class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    question: str
    ai_response: str
    timestamp: str

# Initialize PDF processor and chatbot
def load_document():
    
    pdf_processor = PDFProcessor("Document/AICTE Doc.pdf")
    text_pages = pdf_processor.load_pdf()
    text_chunks = pdf_processor.chunk_text(text_pages)
    chatbot = ChatBot(os.getenv("GROQ_API_KEY"))
    
    return {chatbot, text_chunks}

# Create FastAPI app
app = FastAPI(
    title="AITCE",
    description="AI-powered chatbot for AICTE Approval Process Handbook",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Get current timestamp
        
        pdf_processor = PDFProcessor("Document/AICTE Doc.pdf")
        text_pages = pdf_processor.load_pdf()
        text_chunks = pdf_processor.chunk_text(text_pages)
        chatbot = ChatBot(os.getenv("GROQ_API_KEY"))
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

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# Main entry point
def start():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start()

# Requirements (requirements.txt)
'''
fastapi
uvicorn
python-dotenv
PyPDF2
groq
pydantic
datetime
'''