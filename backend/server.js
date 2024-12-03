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
    cb(null, 'documents/'); // Store files in the 'documents/' folder
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Generate unique filename
  },
});

const upload = multer({ storage });

// Document type mapping based on filename
const getDocumentType = (filename) => {
  const lowerFilename = filename.toLowerCase(); // Convert filename to lowercase for case-insensitive matching
  
  if (lowerFilename.includes('fire safety')) return 'fire_safety_certificate';
  if (lowerFilename.includes('land conversion')) return 'land_conversion_certificate';
  if (lowerFilename.includes('affidavit')) return 'affidavit';
  if (lowerFilename.includes('bank certificate')) return 'bank_certificate';
  if (lowerFilename.includes('architect certificate')) return 'architect_certificate';
  if (lowerFilename.includes('mou')) return 'mou_document';
  if (lowerFilename.includes('occupancy')) return 'occupancy_certificate';

  return 'unknown'; // Default if no match found
};

// Function to process files and send them to the OCR service
const processFilesWithDelay = (files, callback) => {
  const results = {};
  const errors = {};
  let totalDocuments = 0;
  let processedDocuments = 0;

  // Recursive function to process each file with a 30-second delay
  const processFile = (index) => {
    if (index >= files.length) {
      callback(results, errors); // All files processed
      return;
    }

    const fileName = files[index];
    const filePath = path.join(documentsFolderPath, fileName);

    if (fs.statSync(filePath).isFile()) {
      const documentType = getDocumentType(fileName);
      if (documentType === 'unknown') {
        console.log(`Skipping file ${fileName}, document type unknown.`);
        processedDocuments++;
        setTimeout(() => processFile(index + 1), 10000); // Wait 30 seconds
        return;
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), { filename: fileName });
      formData.append('document_type', documentType);

      totalDocuments++;

      formData.getLength((err, length) => {
        if (err) {
          console.error('Error getting form data length:', err);
          errors[fileName] = 'Error getting form data length';
          processedDocuments++;
          setTimeout(() => processFile(index + 1), 10000); // Wait 30 seconds
          return;
        }

        // Send the request to the OCR service
        axios.post('http://localhost:8000/ocr_and_extract', formData, {
          headers: {
            ...formData.getHeaders(),
            'Content-Length': length,
          },
        })
        .then(response => {
          console.log(`OCR API response for ${fileName}:`, response.data);

          // Store results
          const ocrResults = response.data.results;
          results[fileName] = ocrResults ? ocrResults[fileName] : { message: 'No data found for this document' };

          processedDocuments++;
          setTimeout(() => processFile(index + 1), 10000); // Wait 30 seconds
        })
        .catch(error => {
          console.error('Error during OCR request for ' + fileName, error);
          errors[fileName] = 'OCR request failed';
          processedDocuments++;
          setTimeout(() => processFile(index + 1), 10000); // Wait 30 seconds
        });
      });
    } else {
      processedDocuments++;
      setTimeout(() => processFile(index + 1), 10000); // Wait 30 seconds
    }
  };

  // Start processing the first file
  processFile(0);
};

// Combined route to handle file upload and processing
app.post('/upload', upload.fields([{ name: 'Affidavit' }, { name: 'MOU' }, { name: 'Fire Safety' }, { name: 'Architect Certificate' }, { name: 'Land Conversion' }]), (req, res) => {
  console.log('Files uploaded:', req.files);

  // Read the files from the documents folder
  const files = fs.readdirSync(documentsFolderPath);

  // Process the files
  processFilesWithDelay(files, (results, errors) => {
    res.json({
      message: 'File upload and processing completed.',
      results,
      errors,
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
