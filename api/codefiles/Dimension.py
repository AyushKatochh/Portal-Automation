import fitz  
import base64
import os
from groq import Groq
from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

def extract_first_image_from_pdf(pdf_bytes):

    # Open the PDF from bytes
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
   
        
    # Try to extract first image
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Extract images from the page
        image_list = page.get_images(full=True)
        
        if image_list:
            # Extract the first image
            xref = image_list[0][0]
            base_image = doc.extract_image(xref)
            
            # Get image data
            image_bytes = base_image["image"]
            
            # Convert to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # Close the document
            doc.close()
            
            return base64_image
    
    # Close the document
    doc.close()
    
    # Return None if no images found
    return None

def detect_text(image_bytes):
    """Detects text in the image bytes."""
    client = vision.ImageAnnotatorClient()

    image = vision.Image(content=image_bytes)

    # for dense text
    response = client.document_text_detection(image=image)
    texts = response.text_annotations
    ocr_text = []

    for text in texts:
        ocr_text.append(text.description)

    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )
    return " ".join(ocr_text)

def analyze_architectural_plan(ocr_text):
    """
    Analyze the OCR text using Groq and Llama 3 to generate 
    a detailed architectural documentation plan
    """
    aicte_validation='''
            The Approval Process Handbook provides detailed norms and standards for infrastructure and physical facilities for technical institutions. Below are key guidelines:

        1. Built-Up Area Requirements
                The minimum built-up area required for institutions varies based on the type of program and student intake capacity:
                Diploma Programs:  
                    Minimum Requirement: 500 square meters per 100 students.
                Undergraduate Programs: 
                    Minimum Requirement: 750 square meters per 100 students.
                Postgraduate Programs:
                    Minimum Requirement: 1,000 square meters per 100 students.
        2. Land Requirements
                The required land area depends on the type of institution and program offered:
                Polytechnic Institutions:
                    Minimum Land Area: 2.5 acres.
                Engineering Colleges:
                    Minimum Land Area: 10 acres.
        3. General Infrastructure Guidelines
                Institutions must ensure:
                    Adequate space for classrooms, laboratories, libraries, faculty offices, and common areas.
                    Compliance with local building codes and safety regulations.
                    Proper allocation of space to support effective learning and student activities.
            Important Note
            While these guidelines provide a framework for infrastructure planning, they do not include specific instructions on dimensional analysis of maps or arranging students according to area. 
            Institutions are advised to use the provided norms to create facilities that comfortably accommodate students and enhance the learning environment.
    '''
    # Initialize Groq client
    client = Groq(
        api_key=os.getenv('GROQ_API_KEY')
    )

    # Construct a detailed prompt for architectural analysis
    prompt = f"""You are an expert architectural analyst. 
    Given the following OCR-extracted text from an architectural plan:

    {ocr_text}

    Please provide a comprehensive architectural documentation plan that includes:
    Make sure to start with the Architectural Plan states ......
    1. Detailed description of the architectural elements
    2. Structural insights and key design features
    3. Potential construction considerations
    4. Material specifications (if discernible)
    5. Scale and dimensional analysis
    6. Any unique or noteworthy design characteristics
    7. Provide a dimensional report of each floor and each type of room.
    8. give me the area of different regions eg. classroom, playground, and the total institute
    
    Make sure to give 8th point with maximum accuracy.

    Analyze the text thoroughly and extract as much architectural information as possible.
    
    Also create the dimensional analysis in this format:
    Validate the results from dimensional extraction with the {aicte_validation} guidelines.
    1. Create a comparative analysis and make sure that aicte_validation is STRICTLY followed. 
    2. Create another analysis on how many maximum students can be accomodated on which room based on department.
    3. Do not mention if you are not clear or document is not clear. Please specify if the map is not clear.
    4. If you find any student value as negative or in fraction then round off.
    5. If you find area as negative then turn it positive.
    6. If you find any student value as zero then consider it as 1.
    
    In the end do not provide any precautionary guideline.
    Also do not mention anything about accuracy
    
    """

    # Create chat completion
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama3-8b-8192"  # Groq's Llama 3 model
    )

    # Return the generated analysis
    return chat_completion.choices[0].message.content

def verify_signature(signatures_info):
    signer_names=['DigiSigner', 'Arch']
    if signatures_info[0].get('signer_name') in signer_names:
        return True
    else:
        return False
   