import os
import logging
from typing import List, Optional, Dict
from datetime import datetime
from collections import deque
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    filename='document_chat.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Load environment variables
load_dotenv()

# Pydantic models for request and response
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

# FastAPI app setup
app = FastAPI(
    title="Document-Chat API",
    description="Backend API for PDF-based intelligent document chatbot"
)

# CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Global variables to store vector store and current document
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

@app.on_event("startup")
async def startup_event():
    """Configure Google AI on startup"""
    configure_google_ai()

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Main chat endpoint"""
    # Validate input
    load_document()
    if not request.question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    # Process chat query
    response = process_chat_query(request.question, request.chat_history)
    
    return ChatResponse(**response)

@app.get("/logs", response_model=LogsResponse)
async def get_logs():
    """Retrieve recent log entries"""
    logs = read_last_log_lines()
    return LogsResponse(logs=logs)

@app.get("/current-document", response_model=Dict[str, Optional[str]])
async def get_current_document():
    """Retrieve the currently loaded document path"""
    return {"document_path": current_document_path}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)