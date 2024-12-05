
const mongoose = require("mongoose");
const { Schema } = mongoose;

const applicationSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
    },
    landDetail: {
        location: { type: String },
        totalArea: { type: String },
    },
    contactDetail: {
        title: { type: String },
        firstName: { type: String },
        middleName: { type: String },
        lastName: { type: String },
        address: { type: String },
        designation: { type: String },
        state: { type: String },
        city: { type: String },
        postalCode: { type: String },
        stdCode: { type: String },
        mobileNumber: { type: String },
        emailAddress: { type: String },
    },
    bankDetail: {
        bankName: { type: String },
        branchName: { type: String },
    },
    uploads: [
        {
            filename: { type: String },
            url: { type: String },
        },
    ],
    institute_id: [{ type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: false }],
});
  
  
  const Application = mongoose.model('Application', applicationSchema);
  
  module.exports =Application;
  