import logging
from typing import List, Optional
from fastapi import  HTTPException
from pydantic import BaseModel
from pypdf import PdfReader
from groq import Groq
from PyPDF2 import PdfReader
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    filename='document_chat.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

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
    