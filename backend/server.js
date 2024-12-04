const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 5000;
const documentsFolderPath = path.join(__dirname, 'documents');

// Set up storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'documents/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Document type mapping based on filename
const getDocumentType = (filename) => {
  const lowerFilename = filename.toLowerCase().trim();  // Normalize to lowercase and trim spaces
  console.log(`Checking document type for filename: ${filename}`);  // Debugging line

  // Enhanced matching with different variations of filenames
  if (lowerFilename.includes('fire safety')) return 'fire_safety_certificate';
  if (lowerFilename.includes('land conversion')) return 'land_conversion_certificate';
  if (lowerFilename.includes('affidavit')) return 'affidavit';
  if (lowerFilename.includes('bank certificate')) return 'bank_certificate';
  if (lowerFilename.includes('architect certificate')) return 'architect_certificate';
  if (lowerFilename.includes('mou')) return 'mou_document';
  if (lowerFilename.includes('occupancy')) return 'occupancy_certificate';

  console.log(`Document type unknown for filename: ${filename}`); // Debugging line
  return 'unknown';  // If no match is found, return 'unknown'
};

// Function to validate signature by sending the file to the validation service
const validateSignature = async (filePath) => {
  console.log(`Validating signature for file: ${filePath}`);
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post('http://localhost:8000/validate-signature', formData, {
      headers: formData.getHeaders(),
    });

    if (response.status === 200) {
      const signatures = response.data.signatures;
      if (signatures && signatures.length > 0) {
        const validity = signatures[0].certificate.validity;
        console.log('Signature is valid. Validity:', validity);
        return true;
      } else {
        console.log('No signatures found in the document.');
        return false;
      }
    } else {
      console.error('Signature validation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error during signature validation:', error);
    return false;
  }
};

// Function to process OCR for a file
const processOCR = async (filePath, fileName, documentType) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath), { filename: fileName });
  formData.append('document_type', documentType);

  try {
    const response = await axios.post('http://localhost:8000/ocr_and_extract', formData, {
      headers: formData.getHeaders(),
    });

    console.log(`OCR response for ${fileName}:`, response.data);

    // Extract the 'extracted_values'
    const extractedValues = response.data.results[fileName].keyword_values || {}; 
    return { extractedValues, message: 'No data found for this document' };
  } catch (error) {
    console.error(`Error during OCR request for ${fileName}:`, error);
    return { error: 'OCR request failed' };
  }
};

// Function to delay execution for a given time (in milliseconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Combined route: Upload, validate, and process documents
app.post('/upload', upload.fields([
  { name: 'Affidavit' },
  { name: 'MOU' },
  { name: 'Fire Safety' },
  { name: 'Architect Certificate' },
  { name: 'Land Conversion' }
]), async (req, res) => {
  console.log('Files uploaded:', req.files);

  try {
    const uploadedFiles = Object.values(req.files).flat(); // Get all uploaded files

    const validFiles = [];

    // Step 1: Validate all files
    for (const file of uploadedFiles) {
      const isValidSignature = await validateSignature(file.path);
      if (isValidSignature) {
        validFiles.push(file); 
      } else {
        console.log(`Skipping file ${file.originalname}, invalid signature.`);
      }
    }

    // Step 2: Process valid files
    const results = [];
    const parsingData = {}; 

    for (const file of validFiles) {
      const documentType = getDocumentType(file.originalname);

      if (documentType === 'unknown') {
        console.log(`Skipping file ${file.originalname}, document type unknown.`);
        results.push({ fileName: file.originalname, error: 'Unknown document type' });
      } else {
        console.log(`Processing file ${file.originalname} with document type ${documentType}`);
        const { extractedValues, message } = await processOCR(file.path, file.originalname, documentType);
        results.push({ fileName: file.originalname, result: message });

        // Store extracted values in parsingData using the document type as the key
        parsingData[documentType] = {
          extractedValues,
          timestamp: new Date().toISOString(), // Adding the timestamp when processing occurs
        };
      }

      // Wait for 10 seconds before processing the next file
      await delay(10000);  // 10 seconds
    }

    // Save parsingData to parsing.json
    const parsingJsonPath = path.join(documentsFolderPath, 'parsing.json');
    fs.writeFileSync(parsingJsonPath, JSON.stringify(parsingData, null, 2));
    console.log('Parsing data saved to parsing.json');

    // Send response to the client
    res.json({
      message: 'Files processed successfully.',
      results,
    });
  } catch (error) {
    console.error('Error during document processing:', error);
    res.status(500).json({ error: 'Document processing failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
