const express = require('express');
const router = express.Router();
const Application = require('../models/applications'); // Adjust the path as needed
const Logs = require('../models/logs'); // Adjust the path as neededconst Logs = require('./models/logs'); // Adjust the path as needed
const Admin = require('../models/admin'); // Adjust the path as needed
const axios = require('axios');



router.post('/verify-document', async (req, res) => {
  const { remark, action, applicationId, id } = req.body;

  if (!remark || !action || !applicationId || !id) {
    return res.status(400).send('All parameters (remark, action, applicationId, id) are required.');
  }

  try {
    // Find the application
    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).send('Application not found.');
    }

    // Find the specific upload in the uploads array
    const upload = application.uploads.id(id);

    if (!upload) {
      return res.status(404).send('Upload not found.');
    }

    const docName = upload.docName;
    const logs = await Logs.findOne({ application_id: applicationId });

    if (!logs) {
      return res.status(404).send('Logs not found for the given application.');
    }

    if (action === 'Approve') {
      // Update the upload object
      upload.is_verified = true;
      upload.is_verification_complete = true;
      upload.remark = remark;

      // Save the application
      await application.save();

      // Update logs
      logs.status_logs.push({
        message: `${docName} is verified`,
        timestamp: new Date(),
      });

      await logs.save();

      return res.status(200).send({ message: 'Document approved successfully.' });
    } else if (action === 'Reject') {
      // Update the upload object
      upload.is_verified = false;
      upload.is_verification_complete = true;
      upload.remark = remark;

      // Save the application
      await application.save();

      // Update logs
      logs.status = 'Rejected';
      logs.stage.document_verification = {
        is_completed: false,
        success: false,
        verification_timestamp: new Date(),
        remark: remark,
      };

      logs.status_logs.push({
        message: `${docName} is not verified, please reupload`,
        timestamp: new Date(),
      });

      await logs.save();

      return res.status(200).send({ message: 'Document rejected successfully.' });
    } else {
      return res.status(400).send('Invalid action. Action must be Approve or Reject.');
    }
  } catch (error) {
    console.error('Error processing document verification:', error);
    res.status(500).send('An error occurred while processing the request.');
  }
});




router.post('/verify-scrutiny', async (req, res) => {
  const { remark, action, applicationId} = req.body;

  if (!remark || !action || !applicationId) {
    return res.status(400).send('All parameters (remark, action, applicationId, id) are required.');
  }

  try {
    if (action === 'Reject') {
      // Find the logs by applicationId
      const logs = await Logs.findOne({ application_id: applicationId });

      if (!logs) {
        return res.status(404).send('Logs not found for the given application.');
      }

      // Update logs
      logs.status = 'Rejected';
      logs.stage.document_verification = {
        is_completed: false,
        success: false,
        verification_timestamp: new Date(),
        remark: remark,
      };


      logs.status_logs.push({
        message: 'Document is not verified, please reupload',
        timestamp: new Date(),
      });

      await logs.save();

      return res.status(200).send({ message: 'Document rejected successfully.' });
    } 

    else if (action === 'Approve') {
      // Send request to schedule scrutiny
      const response = await axios.get('http://localhost:8000/schedule_expert');

      if (response.status !== 200) {
        return res.status(500).send('Error scheduling scrutiny.');
      }

      const { admin_id, new_deadline } = response.data;

      // Find the admin and update applications array
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

      // Find the logs by applicationId
      const logs = await Logs.findOne({ application_id: applicationId });

      if (!logs) {
        return res.status(404).send('Logs not found for the given application.');
      }

      // Update logs
      logs.stage.document_verification = {
        is_completed: true,
        success: true,
        verification_timestamp: new Date(),
        remark: remark,
      };

      logs.stage.expert_visit_stage = {
        is_allocated: true,
        deadline: new_deadline,
      };

      logs.status_logs.push(
        { message: 'All Document is verified', timestamp: new Date() },
        { message: 'Allocated the application to expert visit committee.', timestamp: new Date() }
      );
    //   console.log(logs)

      await logs.save();

      return res.status(200).send({ message: 'Document approved and allocated to expert visit committee successfully.' });
    } else {
      return res.status(400).send('Invalid action. Action must be Approve or Reject.');
    }
  } catch (error) {
    console.error('Error processing document verification:', error);
    res.status(500).send('An error occurred while processing the request.');
  }
});





router.post('/verify-expert-visit', async (req, res) => {
  const { remark, action, applicationId } = req.body;

  if (!remark || !action || !applicationId) {
    return res.status(400).send('All parameters (remark, action, applicationId) are required.');
  }

  try {
    if (action === 'Reject') {
      // Find the logs by applicationId
      const logs = await Logs.findOne({ application_id: applicationId });

      if (!logs) {
        return res.status(404).send('Logs not found for the given application.');
      }

      const application = await Application.findById(applicationId);
      if (!application) {
        return res.status(404).send('Application not found.');
      }

      const docName = "Document"; // Replace with appropriate document name if available

      // Update logs
      logs.status = 'Rejected';
      logs.stage.document_verification = {
        is_completed: false,
        success: false,
        verification_timestamp: new Date(),
        remark: remark,
      };

      logs.status_logs.push({
        message: `${docName} is not verified, please reupload`,
        timestamp: new Date(),
      });

      await logs.save();

      return res.status(200).send({ message: 'Document rejected successfully.' });
    } else if (action === 'Approve') {
      // Find an admin from the "Executive" committee
      const admin = await Admin.findOne({ committee: 'Executive' });

      if (!admin) {
        return res.status(404).send('Executive committee admin not found.');
      }

      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3); // Set deadline to 3 days from now

      admin.applications.push({
        application_id:applicationId,
        deadline: deadline,
        status: 'Pending',
      });

      await admin.save();

      // Find the logs by applicationId
      const logs = await Logs.findOne({ application_id: applicationId });

      if (!logs) {
        return res.status(404).send('Logs not found for the given application.');
      }

      // Update logs
      logs.stage.expert_visit_stage = {
        is_completed: true,
        success: true,
        verification_timestamp: new Date(),
        remark: remark,
      };

      logs.stage.final_stage = {
        is_allocated: true,
        deadline: deadline,
      };

      logs.status_logs.push(
        { message: 'Institution/University infrastructure verified', timestamp: new Date() },
        { message: 'Forwarded the application to executive committee.', timestamp: new Date() }
      );

      await logs.save();

      return res.status(200).send({ message: 'Document approved and forwarded to executive committee successfully.' });
    } else {
      return res.status(400).send('Invalid action. Action must be Approve or Reject.');
    }
  } catch (error) {
    console.error('Error processing document verification:', error);
    res.status(500).send('An error occurred while processing the request.');
  }
});





module.exports = router;
