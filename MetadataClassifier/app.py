import os
import json
from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

def load_client():
    """
    Initialize and return the OpenAI-compatible Groq client
    """
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY")
    )
    return client

def extract_document_info(document_name, document_text, client):
    """
    Dynamically extract information from any type of document
    
    Args:
        document_name (str): Name/type of the document
        document_text (str): Text content of the document
        client (OpenAI): Groq client instance
    
    Returns:
        dict: Extracted document information
    """
    prompt = f"""CRITICAL INSTRUCTIONS FOR JSON GENERATION:
    1. Generate a STRICTLY VALID JSON object
    2. Use these EXACT rules:
       - No comments or extra text
       - All string values must be properly quoted
       - Use correct JSON data types (string, number, boolean, array, object)
       - Avoid mathematical expressions in numbers
       - Use camelCase for key names
       - Handle boolean values as true/false
    3. Focus on extracting structured information

    Document Type: {document_name}
    Document Text: {document_text}

    JSON TEMPLATE (ADAPT AS NEEDED):
    {{
        "documentType": "string",
        "issuer": "string",
        "date": "string",
        "details": {{
            "key1": "value",
            "key2": number,
            "key3": true/false
        }}
    }}

    EXTRACT PRECISE INFORMATION NOW:"""

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a JSON generation expert. Generate ONLY a valid, precise JSON object. NO EXTRA TEXT."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
            temperature=0.1  # Very low temperature for consistency
        )

        # Get the response content
        extracted_text = response.choices[0].message.content.strip()
        
        # Validate JSON
        parsed_result = json.loads(extracted_text)
        
        return {
            "document_type": document_name,
            "extracted_info": parsed_result
        }

    except json.JSONDecodeError as json_err:
        print(f"JSON Parsing Error for {document_name}")
        print(f"Raw response: {extracted_text}")
        print(f"Specific error: {json_err}")
        return {
            "document_type": document_name,
            "error": "JSON parsing failed",
            "raw_text": extracted_text
        }
    except Exception as e:
        print(f"Unexpected error in extracting {document_name} data: {e}")
        return {
            "document_type": document_name,
            "error": str(e)
        }

def extract_metadata(metadata, client):
    """
    Extract information from all documents in the metadata
    
    Args:
        metadata (dict): Dictionary containing document texts
        client (OpenAI): Groq client instance
    
    Returns:
        dict: Extracted information from all documents
    """
    results = {}
    
    # Dynamically process all documents in the metadata
    for doc_type, doc_data in metadata.items():
        # Check if the document has extracted text
        extracted_text = doc_data.get('extracted_text', '')
        
        if extracted_text:
            # Extract information for this specific document
            doc_results = extract_document_info(doc_type, extracted_text, client)
            results[doc_type] = doc_results
    
    return results

@app.route('/extract', methods=['POST'])
def process_document_extraction():
    """
    Flask route to handle document information extraction
    """
    try:
        # Get JSON data from the request
        metadata = request.json

        # Validate input
        if not metadata:
            return jsonify({
                "error": "No metadata provided",
                "status": "failure"
            }), 400

        # Validate that metadata contains at least one document
        if not any(metadata.values()):
            return jsonify({
                "error": "Metadata is empty",
                "status": "failure"
            }), 400

        # Load Groq client
        client = load_client()

        # Extract data from all documents
        results = extract_metadata(metadata, client)

        # Return results
        return jsonify({
            "data": results,
            "status": "success",
            "total_documents_processed": len(results)
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "failure"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "message": "Intelligent Document Extraction API is running",
        "capabilities": [
            "Dynamic document type extraction",
            "Multiple document processing",
            "AI-powered information extraction"
        ]
    }), 200

def main():
    """
    Run the Flask application
    """
    app.run(host='0.0.0.0', port=8000, debug=True)

if __name__ == '__main__':
    main()