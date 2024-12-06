
const mongoose = require("mongoose");
const { Schema } = mongoose;

const applicationSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true,
    },
    instituteName: {
      type: String,
    },
    contactDetails: {
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
      landDetails: {
        location: { type: String },
        hillyArea: { type: String },
        totalArea: { type: Number },
        fsi: { type: Number },
        numberOfPlaces: { type: Number },
        landPieces: {
          landPieceArea1: { type: Number },
          landPieceArea2: { type: Number },
          landPieceArea3: { type: Number },
        },
        landRegistrationNo: { type: String },
        dateOfRegistration: { type: Date },
      },
      bankDetails: {
        bankName: { type: String },
        bankIfscCode: { type: String },
        bankAccountNumber: { type: String },
        accountHolderName: { type: String },
        branchName: { type: String },
        branchCode: { type: String },
        bankAddress: { type: String },
        bankState: { type: String },
        bankPin: { type: String },
      },
    uploads: [
        {
            filename: { type: String },
            url: { type: String },
            docResult_id:{ type: mongoose.Schema.Types.ObjectId, ref: "DocResult", required:true},
            docName:{type: String},
            is_verification_complete:{type:Boolean, default:false},
            is_verified:{ type: Boolean, default: false },
            remark:{ type: String },
        },
    ],
    institute_id:{ type: mongoose.Schema.Types.ObjectId, ref: "Institute", required:true},
    logs_id:{ type: mongoose.Schema.Types.ObjectId, ref: "Logs"},
    is_complete:{type:Boolean, default:false},
});
  
  
  const Application = mongoose.model('Application', applicationSchema);
  
  module.exports =Application;
  