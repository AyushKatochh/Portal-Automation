const Application = require('../models/applications'); // Adjust the path as necessary

/**
 * Add metadata of an uploaded document to an application's uploads field
 * 
 * @param {String} applicationId - The ID of the application to update
 * @param {String} filename - The name of the uploaded file
 * @param {String} s3Url - The S3 URL of the uploaded file
 * @param {String} docResultId - The ID of the corresponding DocResult document
 */
const addUploadToApplication = async (applicationId, filename, s3Url, docResultId) => {
  try {
    // Find the application by its ID and update the uploads array
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      {
        $push: {
          uploads: {
            filename,
            url: s3Url,
            docResult_id: docResultId,
          },
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedApplication) {
      throw new Error(`Application with ID ${applicationId} not found.`);
    }

    console.log('Updated application with new upload:', updatedApplication);
    return updatedApplication;
  } catch (error) {
    console.error('Error updating application uploads:', error);
    throw new Error('Failed to update application uploads.');
  }
};

module.exports = addUploadToApplication;
