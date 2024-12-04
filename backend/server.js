const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const mongooseConnection = require("./models/MoongooseConnection");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'documents/'); // Files will be stored in the 'documents' directory
  },
  filename: function (req, file, cb) {
    // You can customize the filename here if needed
    cb(null, file.originalname); 
  }
});

const upload = multer({ storage: storage });

// Handle file uploads
app.post('/upload', upload.any(), (req, res) => {
  try {
    console.log('Files uploaded successfully:', req.files);
    res.status(200).send('Files uploaded successfully!');
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Error uploading files.');
  }
});

app.post('/submit', (req, res) => {
  try {
    console.log('Submit request received:', req.body); 

    // 1. Get the document types from the request body
    const documentTypes = req.body.documentTypes;

    // 2. Create an object to store the extracted data
    const extractedData = {};

    // 3. Assuming you have access to the extracted data from the OCR service
    //    (This is just an example, replace with your actual logic)
    documentTypes.forEach(docType => {
      const filePath = path.join(__dirname, 'documents', `${docType}.txt`); // Assuming extracted data is in .txt files
      if (fs.existsSync(filePath)) {
        extractedData[docType] = fs.readFileSync(filePath, 'utf-8');
      } else {
        extractedData[docType] = 'Data not found'; 
      }
    });

    // 4. Now you have the extractedData object, you can:
    //    - Log it to the console
    console.log('Extracted Data:', extractedData);
    //    - Save it to a database
    //    - Send it back to the frontend if needed

    res.status(200).send('Submit request successful!'); 
  } catch (error) {
    console.error('Error in submit route:', error);
    res.status(500).send('Error processing submit request.');
  }
});

app.listen(5000, () => {
  console.log('Server listening on port 5000');
});