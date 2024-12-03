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
    cb(null, 'documents/');  // Store files in the 'documents/' folder
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Generate unique filename
  },
});

const upload = multer({ storage });

// Document type mapping based on filename
const getDocumentType = (filename) => {
  const lowerFilename = filename.toLowerCase(); // Convert filename to lowercase for case-insensitive matching
  console.log(`Processing file: ${filename}, Type: ${lowerFilename}`);  // Log the filename and its lowercase form
  
  if (lowerFilename.includes('fire safety')) return 'fire_safety_certificate';
  if (lowerFilename.includes('land conversion')) return 'land_conversion_certificate';
  if (lowerFilename.includes('affidavit')) return 'affidavit';
  if (lowerFilename.includes('bank certificate')) return 'bank_certificate';
  if (lowerFilename.includes('architect certificate')) return 'architect_certificate';
  if (lowerFilename.includes('mou')) return 'mou_document';  
  if (lowerFilename.includes('occupancy')) return 'occupancy_certificate';

  return 'unknown'; // Default if no match found
};

// Endpoint to handle file uploads
app.post('/upload', upload.fields([{ name: 'Affidavit' }, { name: 'MOU' }, { name: 'Fire Safety' }, { name: 'Architect Certificate' }, { name: 'Land Conversion' }]), (req, res) => {
  console.log('Files uploaded:', req.files);
  res.status(200).json({ message: 'Files uploaded successfully' });
});

// Route for testing input files
app.post('/test-input', async (req, res) => {
  try {
    // Check if the documents folder exists
    if (!fs.existsSync(documentsFolderPath)) {
      return res.status(400).json({ error: 'Documents folder not found' });
    }

    // Read the files in the documents folder
    const files = fs.readdirSync(documentsFolderPath);

    // If no files are found in the documents folder, return an error
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files found in the documents folder' });
    }

    const results = {}; // Store OCR results for all processed documents
    const errors = {}; // Store errors for failed documents
    let totalDocuments = 0;
    let processedDocuments = 0;

    // Process each file in the documents folder
    for (const fileName of files) {
      const filePath = path.join(documentsFolderPath, fileName);

      // Check if the file is a valid file (not a directory)
      if (fs.statSync(filePath).isFile()) {
        const documentType = getDocumentType(fileName);
        if (documentType === 'unknown') {
          console.log(`Skipping file ${fileName}, document type unknown.`);
          continue; // Skip files with unknown types
        }

        // Create a new FormData instance for each file
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), { filename: fileName });
        formData.append('document_type', documentType);

        totalDocuments++;

        // Get the length of the formData asynchronously before sending the request
        // eslint-disable-next-line no-loop-func
        formData.getLength((err, length) => {
          if (err) {
            console.error('Error getting form data length:', err);
            errors[fileName] = 'Error getting form data length';
            processedDocuments++;
            checkIfFinished();
            return;
          }

          // Send form data to the OCR service at localhost:8000/ocr_and_extract
          axios.post('http://localhost:8000/ocr_and_extract', formData, {
            headers: {
              ...formData.getHeaders(),
              'Content-Length': length,
            },
          })
          .then(response => {
            // Log the full response to see what was returned
            console.log(`OCR API response for ${fileName}:`, response.data);

            // Collect results for each document and add them to the results object
            const ocrResults = response.data.results;
            if (ocrResults && ocrResults[fileName]) {
              results[fileName] = ocrResults[fileName];
            } else {
              results[fileName] = { message: 'No data found for this document' };
            }
            processedDocuments++;
            checkIfFinished();
          })
          .catch(error => {
            console.error('Error during OCR request for ' + fileName, error);
            errors[fileName] = 'OCR request failed';
            processedDocuments++;
            checkIfFinished();
          });
        });
      }
    }

    // Helper function to check if all files have been processed
    function checkIfFinished() {
      if (processedDocuments === totalDocuments) {
        res.json({
          message: `Processed ${totalDocuments} documents from the folder.`,
          results: results,
          errors: errors, // Return errors for failed documents
        });
      }
    }

    // If no valid files were found for processing, return an error
    if (totalDocuments === 0) {
      return res.status(400).json({ error: 'No valid files found for processing' });
    }

  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
