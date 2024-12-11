from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import threading
import time
from datetime import datetime
import os
import cv2
from main import FaceAuthSystem

app = FastAPI(title="Face Authentication API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class AuthResponse(BaseModel):
    success: bool
    message: str
    session_id: Optional[str] = None

class StatusResponse(BaseModel):
    success: bool
    message: str
    active: Optional[bool] = None
    session_id: Optional[str] = None

# Store for active sessions
active_sessions = {}

class AuthenticationSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.is_active = True
        self.result = None
        self.auth_system = None
        self.start_time = time.time()

async def cleanup_session(session_id: str):
    await asyncio.sleep(60)  # 1 minute timeout
    if session_id in active_sessions:
        session = active_sessions[session_id]
        if session.auth_system:
            session.auth_system.cleanup()
        session.is_active = False
        session.result = {"success": False, "message": "Session timed out"}
        # Clean up after timeout
        await asyncio.sleep(5)  # Give time for final status check
        if session_id in active_sessions:
            del active_sessions[session_id]

def run_auth_process(session_id: str):
    """Run the authentication process in a separate thread"""
    session = active_sessions[session_id]
    try:
        reference_path = "reference_face.jpg"
        if not os.path.exists(reference_path):
            session.auth_system.capture_reference_face(reference_path)
        
        validation_result = session.auth_system.validate_face(reference_path)
        session.result = {
            "success": validation_result,
            "message": "Authentication successful" if validation_result else "Authentication failed"
        }
    except Exception as e:
        session.result = {
            "success": False,
            "message": f"Error during authentication: {str(e)}"
        }
    finally:
        session.auth_system.cleanup()
        session.is_active = False

@app.post("/start-auth", response_model=AuthResponse)
async def start_authentication(background_tasks: BackgroundTasks):
    # Generate unique session ID
    session_id = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Check for existing active sessions for cleanup
    current_time = time.time()
    expired_sessions = [
        sid for sid, session in active_sessions.items()
        if current_time - session.start_time > 60
    ]
    for sid in expired_sessions:
        if sid in active_sessions:
            active_sessions[sid].auth_system.cleanup()
            del active_sessions[sid]
    
    # Create new session
    session = AuthenticationSession(session_id)
    session.auth_system = FaceAuthSystem()
    active_sessions[session_id] = session
    
    # Start authentication process in a separate thread
    auth_thread = threading.Thread(
        target=run_auth_process,
        args=(session_id,)
    )
    auth_thread.daemon = True
    auth_thread.start()
    
    # Schedule cleanup
    background_tasks.add_task(cleanup_session, session_id)
    
    return AuthResponse(
        success=True,
        message="Authentication session started",
        session_id=session_id
    )

@app.get("/check-status/{session_id}", response_model=StatusResponse)
async def check_status(session_id: str):
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=404,
            detail="Authentication session not found"
        )
    
    session = active_sessions[session_id]
    
    if session.result:
        result = session.result
        # Clean up completed session
        if not session.is_active:
            del active_sessions[session_id]
        return StatusResponse(
            success=result["success"],
            message=result["message"],
            active=session.is_active,
            session_id=session_id
        )
    
    return StatusResponse(
        success=True,
        message="Authentication in progress",
        active=session.is_active,
        session_id=session_id
    )

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup all active sessions on shutdown"""
    for session in active_sessions.values():
        if session.auth_system:
            session.auth_system.cleanup()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)