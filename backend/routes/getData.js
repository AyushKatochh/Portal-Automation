const express = require('express');
const router = express.Router();
const Application = require('../models/applications'); // Adjust the path as needed
const Logs = require('../models/logs'); // Adjust the path as neededconst Logs = require('./models/logs'); // Adjust the path as needed
const Admin = require('../models/admin'); // Adjust the path as needed



// API 1: Get applications by institute_id and is_complete
router.get('/institute-applications', async (req, res) => {
    const { institute_id, is_complete } = req.query;
  
    if (!institute_id === undefined) {
      return res.status(400).send('Parameters institute_id and is_complete are required.');
    }
  

    try {
      const applications = await Application.find({
        institute_id: institute_id,
        is_complete: is_complete,
      });
  
      return res.status(200).send(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).send('An error occurred while fetching applications.');
    }
  });
  


  // API 2: Track application by applicationId
router.get('/track-application/:applicationId', async (req, res) => {
    const { applicationId } = req.params;
  
    if (!applicationId) {
      return res.status(400).send('Application ID is required.');
    }
  
    try {
      const application = await Application.findById(applicationId).populate('logs_id');
  
      if (!application) {
        return res.status(404).send('Application not found.');
      }
  
      return res.status(200).send(application);
    } catch (error) {
      console.error('Error tracking application:', error);
      res.status(500).send('An error occurred while tracking the application.');
    }
  });


  module.exports = router;
