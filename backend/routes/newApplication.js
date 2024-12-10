const express = require('express');
const router = express.Router();
const Application = require('../models/applications'); // Adjust the path if needed

// Route to save contact details
router.post('/save-contact-details', async (req, res) => {
  try {
    const { contactDetails } = req.body; // Extract contact details from the request body
    const applicationId = req.header('applicationId'); // Extract applicationId from headers
    

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required.' });
    }

    // Find application by ID and update contact details
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // Update contact details in the application
    application.contactDetails = contactDetails;
    await application.save();

    return res.status(200).json({ message: 'Contact details saved successfully.',application:application });
  } catch (error) {
    console.error('Error saving contact details:', error);
    return res.status(500).json({ message: 'An error occurred while saving contact details.', error: error.message });
  }
});





router.post('/save-land-details', async (req, res) => {
    try {
      const { landDetails } = req.body; // Extract contact details from the request body
      const applicationId = req.header('applicationId'); // Extract applicationId from headers
  
      if (!applicationId) {
        return res.status(400).json({ message: 'Application ID is required.' });
      }
  
      // Find application by ID and update contact details
      const application = await Application.findById(applicationId);
  
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }
  
      // Update contact details in the application
      application.landDetails = landDetails;
      await application.save();
  
      return res.status(200).json({ message: 'Contact details saved successfully.',application:application });
    } catch (error) {
      console.error('Error saving contact details:', error);
      return res.status(500).json({ message: 'An error occurred while saving contact details.', error: error.message });
    }
  });







  router.post('/save-bank-details', async (req, res) => {
    try {
      const { bankDetails } = req.body; // Extract contact details from the request body
      const applicationId = req.header('applicationId'); // Extract applicationId from headers
  
      if (!applicationId) {
        return res.status(400).json({ message: 'Application ID is required.' });
      }
  
      // Find application by ID and update contact details
      const application = await Application.findById(applicationId);
  
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }
  
      // Update contact details in the application
      application.bankDetails = bankDetails;
      await application.save();
  
      return res.status(200).json({ message: 'Contact details saved successfully.',application:application });
    } catch (error) {
      console.error('Error saving contact details:', error);
      return res.status(500).json({ message: 'An error occurred while saving contact details.', error: error.message });
    }
  });

module.exports = router;
