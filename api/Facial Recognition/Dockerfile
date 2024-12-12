# Use official Python image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-python-dev \
    libboost-thread-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pillow face_recognition

# Add the API code directly
COPY <<EOF /app/main.py
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import face_recognition
import io
from PIL import Image

app = FastAPI()

@app.post("/authenticate-faces/")
async def authenticate_faces(image1: UploadFile, image2: UploadFile):
    try:
        img1_bytes = await image1.read()
        img2_bytes = await image2.read()

        img1 = face_recognition.load_image_file(io.BytesIO(img1_bytes))
        img2 = face_recognition.load_image_file(io.BytesIO(img2_bytes))

        encodings1 = face_recognition.face_encodings(img1)
        encodings2 = face_recognition.face_encodings(img2)

        if len(encodings1) == 0 or len(encodings2) == 0:
            raise HTTPException(status_code=400, detail="No face detected in one or both images.")

        match = face_recognition.compare_faces([encodings1[0]], encodings2[0])[0]

        if match:
            return JSONResponse(content={"status": "success", "message": "Faces match!"}, status_code=200)
        else:
            return JSONResponse(content={"status": "failure", "message": "Faces do not match!"}, status_code=401)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
EOF

# Expose port 8000
EXPOSE 8000

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
