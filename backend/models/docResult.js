
const mongoose = require("mongoose");
const { Schema } = mongoose;

const docResultSchema = new mongoose.Schema({
    application_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: false }], // allocated applications
    result: { type: mongoose.Schema.Types.Mixed }, // Allows any data
    
  });
  
  
  const DocResult = mongoose.model('DocResult', docResultSchema);
  
  module.exports =DocResult;
  