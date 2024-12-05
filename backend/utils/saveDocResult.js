const DocResult = require('../models/docResult'); // Update the path as necessary

/**
 * Save validation response to the DocResult collection in MongoDB
 * 
 * @param {String} docId - Document ID
 * @param {String} applicationId - Application ID
 * @param {Object} validationResponse - The validation response to store
 */

const saveValidationResponse = async (applicationId, validationResponse) => {
    try {
      // Create a new DocResult document
      const newDocResult = new DocResult({
        application_id: applicationId,
        result: validationResponse,
      });
  
      // Save the document to MongoDB
      const savedDocResult = await newDocResult.save();
  
      console.log('Validation response saved:', savedDocResult._id);
      return savedDocResult._id; // Return the new document's ID
    } catch (error) {
      console.error('Error saving validation response to MongoDB:', error);
      throw new Error('Database operation failed.');
    }
  };
  
  module.exports = saveValidationResponse;
  
