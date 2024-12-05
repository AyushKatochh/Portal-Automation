const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Institute = require('./models/institute'); // Schema file
const multer = require('multer'); // To handle file uploads
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup file upload middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create the uploads folder if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as the filename
  },
});

const upload = multer({ storage }); // Files will be uploaded to 'uploads/' folder

// MongoDB Connection
mongoose
  .connect('mongodb+srv://AyushKatoch:ayush2002@cluster0.72gtk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Route for saving institute
app.post('/save-institute', async (req, res) => {
  const { name, email, password, userName } = req.body;

  if (!name || !email || !password || !userName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const institute = new Institute({ name, email, password, userName });
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

    if (institute.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Authentication successful', institute });
  } catch (error) {
    console.error('Error authenticating institute:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/validate-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const formData = new FormData();

    // Append the file with its original filename
    formData.append('file', fs.createReadStream(filePath), {
      filename: req.file.originalname,
      contentType: req.file.mimetype, // Use the file's MIME type
    });

    // Send the request to the validation service (localhost:8000)
    const response = await axios.post('http://localhost:8000/validate-document', formData, {
      headers: formData.getHeaders(),
    });

    // Log and send the response back
    console.log(response.data);
    res.status(200).json(response.data);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Error processing the request.');
  }
});

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
// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
