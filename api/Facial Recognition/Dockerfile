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

# Copy the api.py file into the container
COPY api.py /app/api.py

# Expose port 9000
EXPOSE 9000

# Run the app
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "9000"]
