const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
<<<<<<< HEAD
const bcrypt = require("bcryptjs");

=======
>>>>>>> main
const fileUpload = require('express-fileupload');
const Institute = require('./models/institute'); // Schema file
const Application = require('./models/applications'); // Schema file
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const AWS = require('aws-sdk');

const saveValidationResponse = require('./utils/saveDocResult'); // Import the function
const addUploadToApplication = require('./utils/updateApplicationUploads'); // Import the function
require('dotenv').config();

<<<<<<< HEAD
const app = express();
const PORT = 5000;


=======

const app = express();
const PORT = 5000;

>>>>>>> main
// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Define API routes
app.use("/api", require("./routes/login"));
app.use("/api", require("./routes/adminapplications"));
app.use("/api", require("./routes/createApplication"));
app.use("/api", require("./routes/verifications"));
app.use("/api", require("./routes/getData"));
<<<<<<< HEAD
app.use("/api", require("./routes/newApplication"));
=======
>>>>>>> main


app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file) { // Access the file using req.files.file
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const uploadedFile = req.files.file;
  const uploadPath = path.join(__dirname, 'uploads', uploadedFile.name);

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error uploading file' });
    }

    res.status(200).json({ success: true, filePath: uploadPath });
  });
});

// MongoDB Connection
mongoose
  .connect('Your_uri', {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Route for saving institute
app.post('/save-institute', async (req, res) => {
  const { name, email, password, userName } = req.body;

  if (!name || !email || !password || !userName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

<<<<<<< HEAD
  const userExists = await Institute.findOne({ email });
  if (userExists) {
    return res.json({ success: false, message: "User already exists" });
  }
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const institute = new Institute({ name, email, password:hashedPassword, userName });
=======
  try {
    const institute = new Institute({ name, email, password, userName });
>>>>>>> main
    await institute.save();
    res.status(201).json({ message: 'Institute saved successfully' });
  } catch (error) {
    console.error('Error saving institute:', error);
    if (error.code === 11000) {
      res.status(409).json({ message: 'Duplicate email or username' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Authentication route
app.post('/authenticate', async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const institute = await Institute.findOne({ userName });

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

<<<<<<< HEAD
    const isMatch = await bcrypt.compare(password, institute.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


=======
    if (institute.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

>>>>>>> main
    res.status(200).json({ message: 'Authentication successful', institute });
  } catch (error) {
    console.error('Error authenticating institute:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


const uploadMiddleware = (req, res, next) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  req.file = req.files.file; // Map req.file to the uploaded file
  next();
};


//INCLUDE AWS here......................................................

const s3 = new AWS.S3({
<<<<<<< HEAD
  accessKeyId: 'AKIARHQBNPCADJETSQ7P', 
  secretAccessKey: '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',
});
=======
  accessKeyId: process.env.AWSID, 
  secretAccessKey: process.env.AWSKEY,
 });
>>>>>>> main

// Function to upload file to S3
const uploadPdfToS3 = async (bucketName, filePath, s3Key) => {
  try {
    const fileContent = fs.readFileSync(filePath); // Read the file

    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
    };

    // Upload to S3
    await s3.upload(params).promise();
    console.log(`File uploaded successfully to ${bucketName}/${s3Key}`);
  } catch (error) {
    throw new Error(`S3 Upload Error: ${error.message}`);
  }
};

<<<<<<< HEAD

=======
>>>>>>> main
// Express route for document validation and upload
app.post('/validate-document', uploadMiddleware, async (req, res) => {
  try {
    const uploadedFile = req.file;
    const uploadPath = path.join(__dirname, 'uploads', uploadedFile.name);
    const { applicationId, docName } = req.body; 
<<<<<<< HEAD
    console.log(docName)
=======
>>>>>>> main

    uploadedFile.mv(uploadPath, async (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return res.status(500).send('File upload failed.');
      }

      const formData = new FormData();
      formData.append('file', fs.createReadStream(uploadPath));
      formData.append('document_type', docName); // Example document type

<<<<<<< HEAD
      if(docName=="fire_safety_certificate" ||docName=="land_conversion_certificate"||docName=="affidavit"||docName=="bank_certificate"||docName=="architect_certificate"|| docName=="mou_document"){
        try {
          // Validate the document
          console.log("came to other document validation");
          console.log(formData)
          const response = await axios.post(
            'http://localhost:8000/process-and-validate/',
            formData,
            { headers: formData.getHeaders() }
          );
  
          console.log(response.data)
          // If validation is successful, upload to S3
          const bucketName = 'aicte-portal';
          const s3Key = `${docName}/${uploadedFile.name}`;
  
          await uploadPdfToS3(bucketName, uploadPath, s3Key);
  
          const docId = await saveValidationResponse(applicationId, response.data);
  
          // Update application uploads
          await addUploadToApplication(
            applicationId,
            uploadedFile.name,
            `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
            docId,
            docName
          );
          // Send success response
          res.status(200).json({
            status: 'success',
            message: 'Document validated and uploaded successfully',
            s3Url: `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
            validationResponse: response.data, // Include validation data in the response
          });
        } catch (err) {
          // Handle validation or upload error
          if (err.response) {
            const statusCode = err.response.status;
            const errorMessage = err.response.data.message || 'Validation error occurred';
            console.error(`Validation Error: ${errorMessage}`);
            res.status(statusCode).json({
              status: 'error',
              message: errorMessage,
            });
          } else {
            console.error('Unexpected error during validation:', err.message);
            res.status(500).json({
              status: 'error',
              message: 'Validation or upload failed due to a server error.',
            });
          }
        }
      }
      else{
        try {
          // Validate the document
          const response = await axios.post(
            'http://localhost:8000/analyze-plan/',
            formData,
            { headers: formData.getHeaders() }
          );
  
          // If validation is successful, upload to S3
          const bucketName = 'aicte-portal';
          const s3Key = `${docName}/${uploadedFile.name}`;
  
          await uploadPdfToS3(bucketName, uploadPath, s3Key);
          console.log(response.data)
  
          const docId = await saveValidationResponse(applicationId, response.data.analysis);
          // Update application uploads
          await addUploadToApplication(
            applicationId,
            uploadedFile.name,
            `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
            docId,
            docName
          );
          // Send success response
          res.status(200).json({
            status: 'success',
            message: 'Document validated and uploaded successfully',
            s3Url: `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
            validationResponse: response.data, // Include validation data in the response
          });
        } catch (err) {
          // Handle validation or upload error
          if (err.response) {
            const statusCode = err.response.status;
            const errorMessage = err.response.data.message || 'Validation error occurred';
            console.error(`Validation Error: ${errorMessage}`);
            res.status(statusCode).json({
              status: 'error',
              message: errorMessage,
            });
          } else {
            console.error('Unexpected error during validation:', err.message);
            res.status(500).json({
              status: 'error',
              message: 'Validation or upload failed due to a server error.',
            });
          }
        }
      }


=======
      try {
        // Validate the document
        const response = await axios.post(
          'http://localhost:8000/process-and-validate/',
          formData,
          { headers: formData.getHeaders() }
        );

        // If validation is successful, upload to S3
        const bucketName = 'aicte-portal';
        const s3Key = `${docName}/${uploadedFile.name}`;

        await uploadPdfToS3(bucketName, uploadPath, s3Key);

        const docId = await saveValidationResponse(applicationId, response.data);

        // Update application uploads
        await addUploadToApplication(
          applicationId,
          uploadedFile.name,
          `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
          docId,
          docName
        );
        // Send success response
        res.status(200).json({
          status: 'success',
          message: 'Document validated and uploaded successfully',
          s3Url: `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
          validationResponse: response.data, // Include validation data in the response
        });
      } catch (err) {
        // Handle validation or upload error
        if (err.response) {
          const statusCode = err.response.status;
          const errorMessage = err.response.data.message || 'Validation error occurred';
          console.error(`Validation Error: ${errorMessage}`);
          res.status(statusCode).json({
            status: 'error',
            message: errorMessage,
          });
        } else {
          console.error('Unexpected error during validation:', err.message);
          res.status(500).json({
            status: 'error',
            message: 'Validation or upload failed due to a server error.',
          });
        }
      }
>>>>>>> main
    });
  } catch (error) {
    console.error('Error in validate-document:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error occurred while processing the request.',
    });
  }
});



<<<<<<< HEAD

/////////////////.............super admin endpoint...............//////////////////////


=======
>>>>>>> main
app.get('/super-admin-stats', async (req, res) => {
  try {
    const totalApplications = await Application.countDocuments();
    const totalInstitutes = await Institute.countDocuments();
    const applicationsByType = await Application.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);
    const applicationsByStatus = await Application.aggregate([
      {
        $group: {
          _id: '$status', 
          count: { $sum: 1 },
        },
      },
    ]);
    const institutesByState = await Institute.aggregate([
      {
        $group: {
          _id: '$state', 
          count: { $sum: 1 },
        },
      },
    ]);

    const applicationStatusCounts = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Transform the aggregation result into the desired format
    const applicationsByStatus1 = {
      pending: 0,
      verified: 0, 
      approved: 0,
    };

    applicationStatusCounts.forEach((item) => {
      if (item._id === 'Pending') {
        applicationsByStatus.pending = item.count;
      } else if (item._id === 'In Progress') {
        applicationsByStatus.verified = item.count;
      } else if (item._id === 'Approved') {
        applicationsByStatus.approved = item.count;
      }
    });


    res.json({
      totalApplications,
      totalInstitutes,
      applicationsByType,
      applicationsByStatus,
      institutesByState,
      applicationsByStatus1
    });
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


<<<<<<< HEAD
=======
app.post("/save-contact-details", async (req, res) => {
  const { userName, contactDetails } = req.body;
  const instituteName = req.headers["institute-name"]; // Retrieve from headers

  console.log("Received Data:", { userName, instituteName, contactDetails });

  if (!userName || !instituteName || !contactDetails) {
    return res.status(400).json({ message: "Required data is missing." });
  }

  try {
    // Use a case-insensitive query for both userName and name (which is the instituteName in the database)
    const institute = await Institute.findOne({
      userName: userName,
      name: { $regex: new RegExp("^" + instituteName + "$", "i") } // Case-insensitive matching for 'name' field
    });

    console.log("Found Institute:", institute); // Log the found institute

    if (!institute) {
      return res.status(404).json({ message: "Institute not found." });
    }

    // Update only the contactDetails field (do not modify other fields like name)
    institute.contactDetails = contactDetails;

    // Save the document with updated contactDetails only
    await institute.save();

    res.status(200).json({ message: "Contact details updated successfully.", institute });
  } catch (error) {
    console.error("Error updating contact details:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/save-land-details", async (req, res) => {
  const { userName, landDetails } = req.body;

  if (!userName || !landDetails) {
    return res.status(400).json({ message: "Required data is missing." });
  }

  try {
    // Find the institute based on the userName
    const institute = await Institute.findOne({ userName });

    if (!institute) {
      return res.status(404).json({ message: "Institute not found." });
    }

    // Update the institute with the new landDetails
    institute.landDetails = landDetails;

    // Save the updated document
    await institute.save();

    res.status(200).json({ message: "Land details saved successfully.", institute });
  } catch (error) {
    console.error("Error saving land details:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/save-bank-details", async (req, res) => {
  const { userName, bankDetails } = req.body;

  if (!userName || !bankDetails) {
    return res.status(400).json({ message: "Required data is missing." });
  }

  try {
    // Find the institute based on the userName
    const institute = await Institute.findOne({ userName });

    if (!institute) {
      return res.status(404).json({ message: "Institute not found." });
    }

    // Update the institute with the new bankDetails
    institute.bankDetails = bankDetails;

    // Save the updated document
    await institute.save();

    res.status(200).json({ message: "Bank details saved successfully.", institute });
  } catch (error) {
    console.error("Error saving bank details:", error);
    res.status(500).json({ message: "Server error." });
  }
});
>>>>>>> main
// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
