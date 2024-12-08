import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from groq import Groq
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ChatRequestStatus(BaseModel):
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

# FastAPI Application
app = FastAPI(
    title="Application Chatbot API",
    description="API for retrieving and chatting with application data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


def load_status_chat():
    mongo_uri = 'mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    groq_api_key = os.getenv("GROQ_API_KEY")
    chatbot = SimpleChatbot(mongo_uri, groq_api_key)
    return chatbot
    