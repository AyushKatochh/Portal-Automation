
const mongoose = require("mongoose");
const { Schema } = mongoose;

const applicationSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
    },
    landDetail:{
        location:{type: String},
        totalArea:{type: String}, //Add other details
    },
    contactDetail:{
        firstName:{type: String},
        lastName:{type: String}, //Add other details
    },
    bankDetail:{
        bankName:{type: String},
        branchName:{type: String}, 
    },
    uploads:[{
        filename:{type: String},
        url:{type: String},
    }],
    institute_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Institute', required: false }], // allocated applications
    
  });
  
  
  const Application = mongoose.model('Application', applicationSchema);
  
  module.exports =Application;
  