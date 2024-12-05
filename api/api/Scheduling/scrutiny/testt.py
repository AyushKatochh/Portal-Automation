import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from pymongo import MongoClient
import uvicorn

# FastAPI Application
app = FastAPI(
    title="Task Allocation API",
    description="API for managing task allocation and deadlines",
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

# MongoDB Connection
MONGO_URI = 'mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(MONGO_URI)
db = client['aicte']
admins_collection = db['admins']

def get_members():
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

@app.get("/get-next-deadline")
async def get_next_deadline():
    """
    Retrieve the next available member and their new deadline
    
    Returns:
        Dict containing member ID and new deadline
    """
    try:
        # Get current members
        members = get_members()
        
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

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    
    Returns:
        Dict with API details
    """
    return {
        "message": "Task Allocation API is running",
        "endpoint": "/get-next-deadline"
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

if __name__ == "__main__":
    main()