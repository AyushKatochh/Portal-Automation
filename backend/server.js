// server.js
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
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Document type mapping based on filename
const getDocumentType = (filename) => {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.includes('fire safety')) return 'fire_safety_certificate';
  if (lowerFilename.includes('land conversion')) return 'land_conversion_certificate';
  if (lowerFilename.includes('affidavit')) return 'affidavit';
  if (lowerFilename.includes('bank certificate')) return 'bank_certificate';
  if (lowerFilename.includes('architect certificate')) return 'architect_certificate';
  if (lowerFilename.includes('mou')) return 'mou_document';
  if (lowerFilename.includes('occupancy')) return 'occupancy_certificate';

  return 'unknown';
};

// Mock signature validation to always return valid
const validateSignature = async (filePath) => {
  console.log(`Mock validating signature for file: ${filePath}`);
  return true; // Always return true for testing
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

// Combined route: Upload, validate, and process documents
app.post('/upload', upload.fields([{ name: 'Affidavit' }, { name: 'MOU' }, { name: 'Fire Safety' }, { name: 'Architect Certificate' }, { name: 'Land Conversion' }]), async (req, res) => {
  console.log('Files uploaded:', req.files);

  try {
    const files = fs.readdirSync(documentsFolderPath);

    const validFiles = [];

    // Step 1: Validate all files
    for (const fileName of files) {
      const filePath = path.join(documentsFolderPath, fileName);

      if (fs.statSync(filePath).isFile()) {
        const isValidSignature = await validateSignature(filePath);
        if (isValidSignature) {
          validFiles.push({ filePath, fileName });
        } else {
          console.log(`Skipping file ${fileName}, invalid signature.`);
        }
      }
    }

    // Step 2: Process valid files
    const results = [];
    const parsingData = {}; // Object to store extracted values for each document

    for (const { filePath, fileName } of validFiles) {
      const documentType = getDocumentType(fileName);

      if (documentType === 'unknown') {
        console.log(`Skipping file ${fileName}, document type unknown.`);
        results.push({ fileName, error: 'Unknown document type' });
      } else {
        console.log(`Processing file ${fileName} with document type ${documentType}`);
        const { extractedValues, message } = await processOCR(filePath, fileName, documentType);
        results.push({ fileName, result: message }); // Update results to include message

        // Store extracted values in parsingData
        parsingData[documentType] = extractedValues;
      }

      // Add a delay between processing files
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay
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