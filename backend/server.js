const express = require('express');
const FormData = require('form-data');
const multer = require('multer');
const axios = require("axios");
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Create a folder called 'documents' if it doesn't exist
const uploadDir = path.join(__dirname, 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage });

// Handle file upload route
app.post('/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    console.log('No files were uploaded.');
    return res.status(400).send({ message: 'No files were uploaded.' });
  }

  const responses = [];
  console.log(`Processing ${req.files.length} file(s)...`);

  for (const file of req.files) {
    try {
      const filePath = path.join(uploadDir, file.filename);
      console.log(`Sending file: ${file.filename} to OCR endpoint...`);
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));

      const response = await axios.post('http://localhost:8000/ocr_and_extract', formData, {
        headers: formData.getHeaders(),
      });


      console.log(`Response for file ${file.filename}:`, JSON.stringify(response.data, null, 2));

      responses.push({
        filename: file.filename,
        ocrData: response.data,
      });
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error.message);
      responses.push({
        filename: file.filename,
        error: error.message,
      });
    }
  }

  console.log('Final responses:', responses);
  res.send({
    message: 'Files processed successfully!',
    results: responses,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
