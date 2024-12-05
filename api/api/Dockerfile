# Use official Python image from the Python foundation
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy only the requirements file to leverage Docker's caching mechanism


# Install dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    libtesseract-dev \
    poppler-data \
    && rm -rf /var/lib/apt/lists/*

# Copy the application code to the container
COPY . /app


COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt
# Expose the application port
EXPOSE 8000

# Set the environment variables for production
ENV PYTHONUNBUFFERED=1

# Run the FastAPI application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]