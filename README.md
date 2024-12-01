
## 🛠 Technology Stack

- **Framework**: FastAPI
- **OCR**: Integrated OCR processing
- **AI Integration**: OpenAI/Groq API (Llama3 70B model)
- **Additional Libraries**:
  - Pydantic (Data validation)
  - python-dotenv (Environment management)
  - uvicorn (ASGI Server)

## 📦 Prerequisites

- Python 3.8+
- pip
- Virtual environment (recommended)

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/document-processing-api.git
   cd document-processing-api
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key
   ```

## 🌐 Endpoints

### 1. OCR and Document Extraction
- **Endpoint**: `/ocr_and_extract/`
- **Method**: POST
- **Functionality**: 
  - Supports image and PDF files
  - Performs OCR
  - Extracts structured information
- **Default Keywords**: 
  - `issued_date`
  - `name`
  - `document_type`
  - `location`
  - `certificate_validity`

### 2. Signature Validation
- **Endpoint**: `/validate-signature/`
- **Method**: POST
- **Functionality**: 
  - Validates digital signatures in PDF documents

### 3. Custom Document Extraction
- **Endpoint**: `/extract`
- **Method**: POST
- **Functionality**:
  - Process multiple documents
  - Extract custom keywords
  - Supports flexible information retrieval

## 🚦 API Usage Examples

### OCR and Extraction
```python
import requests

url = "http://localhost:5000/ocr_and_extract/"
with open("document.pdf", "rb") as f:
    files = {"file": f}
    response = requests.post(url, files=files)
print(response.json())
```

### Custom Extraction
```python
import requests

url = "http://localhost:5000/extract"
payload = {
    "documents": {
        "resume": {"text": "Full document text here"}
    },
    "keywords": ["name", "email", "experience"]
}
response = requests.post(url, json=payload)
print(response.json())
```

## 🔒 Security Features
- CORS middleware
- File type validation
- Secure AI client configuration
- Temporary file cleanup

## 🏃 Running the Application

### Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

### Production Deployment
```bash
python main.py
```

## 📋 Configuration Options

Customize through environment variables:
- `UPLOAD_FOLDER`: Directory for temporary file storage
- `GROQ_API_KEY`: AI service API key
- Modify `keyword_list` for default extraction keywords

## 🐞 Error Handling
- Comprehensive error responses
- Graceful exception handling
- Informative status codes

## 🔍 Logging and Monitoring
- Health check endpoint (`/health`)
- Detailed error logging
- Performance-oriented design

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License
[Specify your license here - MIT/Apache/etc.]

## 📞 Support
For issues, questions, or support, please open a GitHub issue or contact [your contact information].

---

**Note**: Ensure you have the necessary dependencies and API keys before running the application.