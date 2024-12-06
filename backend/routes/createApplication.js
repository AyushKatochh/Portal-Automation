const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const Application = require('../models/applications'); // Adjust path as needed
const Institute = require('../models/institute'); // Adjust path as needed
const Admin = require('../models/admin'); // Adjust the path as needed
const Logs = require('../models/logs'); // Adjust the path as needed

const router = express.Router();

// Route to create a new application
router.post('/create-application', async (req, res) => {
  try {
    const { instituteId, type } = req.body;

    if (!instituteId || !type) {
      return res.status(400).json({ message: 'Institute ID and application type are required.' });
    }

    // Find the institute by ID
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found.' });
    }

    // Create a new application
    const newApplication = new Application({
      type,
      instituteName: institute.name,
      institute_id: instituteId,
    });

    // Save the application
    const savedApplication = await newApplication.save();

    // Send the application ID as response
    res.status(201).json({ applicationId: savedApplication._id });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});





// Route to fetch application by ID
router.get('/application/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find application by ID
      const application = await Application.findById(id).populate('institute_id', 'name'); // Populate institute details if needed
  
      if (!application) {
        return res.status(404).json({ message: 'Application not found.' });
      }
  
      res.status(200).json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  });






router.post('/submit-application', async (req, res) => {
  const { applicationId } = req.body;

  if (!applicationId) {
    return res.status(400).send('Application ID is required.');
  }

  try {
    // Step 1: Call the scrutiny scheduling endpoint
    const response = await axios.get('http://localhost:8000/schedule_scrutiny');

    if (response.status !== 200) {
      return res.status(500).send('Error scheduling scrutiny.');
    }

    const { admin_id, new_deadline } = response.data;

    // Step 2: Find the admin and update the applications array
    const admin = await Admin.findById(admin_id);

    if (!admin) {
      return res.status(404).send('Admin not found.');
    }

    admin.applications.push({
      application_id: applicationId,
      deadline: new_deadline,
      status: 'Pending',
    });

    await admin.save();

    // Step 3: Create a new log
    const newLog = new Logs({
      application_id: applicationId,
      stage: {
        document_verification: {
          is_allocated: true,
          deadline: new_deadline,
        },
      },
      status_logs: [
        {
          message: 'Allocated a scrutiny member for document verification.',
        },
      ],
    });

    await newLog.save();

    // Step 4: Update the application with the new log ID
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).send('Application not found.');
    }

    application.logs_id = newLog._id;
    await application.save();

    // Step 5: Respond with success
    res.status(200).send({
      message: 'Application submitted successfully.',
      admin,
      log: newLog,
      application,
    });
  } catch (error) {
    console.error('Error processing application submission:', error);
    res.status(500).send('Error processing application submission.');
  }
});



module.exports = router;
