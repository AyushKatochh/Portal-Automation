const express = require('express');
const router = express.Router();
const Admin = require('../models/admin'); // Update the path as necessary
const Application = require('../models/applications'); // Update the path as necessary
const axios = require('axios');




router.get('/admin/:adminId/applications', async (req, res) => {
    const { adminId } = req.params;

    try {
        const admin = await Admin.findById(adminId).populate('applications.application_id', 'type instituteName');
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const applications = admin.applications.map(app => ({
            applicationId: app.application_id._id,
            type: app.application_id.type,
            instituteName: app.application_id.instituteName,
            status: app.status,
            deadline: app.deadline,
        }));

        res.json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get("/application/:applicationId", async (req, res) => {
    const { applicationId } = req.params;
  
    try {
      const application = await Application.findById(applicationId)
        .populate("uploads.docResult_id", "result") // Populate the docResult_id field
        .exec();
  
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
  
      const transformedUploads = application.uploads.map((upload) => ({
        filename: upload.filename,
        url: upload.url,
        docResult: upload.docResult_id?.result || null,
        is_verified: upload.is_verified,
        docName:upload.docName,
        is_verification_complete:upload.is_verification_complete,
        remark: upload.remark,
        _id:upload._id
      }));
  
      res.json({
        applicationDetails: {
          type: application.type,
          instituteName: application.instituteName,
          contactDetails: application.contactDetails,
          landDetails: application.landDetails,
          bankDetails: application.bankDetails,
        },
        uploads: transformedUploads,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Validate upload (mark it as verified)
  router.post("/upload/validate/:uploadId", async (req, res) => {
    const { uploadId } = req.params;
  
    try {
      const application = await Application.findOneAndUpdate(
        { "uploads._id": uploadId },
        { $set: { "uploads.$.is_verified": true } }, // Update the specific upload
        { new: true }
      );
  
      if (!application) {
        return res.status(404).json({ message: "Upload not found" });
      }
  
      res.json({ message: "Upload validated successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });



router.get('/applications/:applicationId/details', async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await Application.findById(applicationId).populate('uploads.docResult_id');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const admins = await Admin.find({ 'applications.application_id': applicationId });
    console.log(application)

    const chatresponse = await axios.post("http://localhost:8000/status_chat", {
          application_id: applicationId,
          query: "what is the current stage of the application, what is the status and deadline of the application",
        });
    const response = {
      instituteName: application.instituteName,
      applicationType: application.type,
      // deadline: application.applications[0]?.deadline || null,
      assignedAdmins: admins.map(admin => admin.name),
      uploads: application.uploads.map(upload => ({
        docName: upload.docName,
        url: upload.url,
        isVerificationComplete: upload.is_verification_complete,
        isVerified: upload.is_verified,
        remark: upload.remark,
      })),
      report: chatresponse.data.response
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  

module.exports = router;
