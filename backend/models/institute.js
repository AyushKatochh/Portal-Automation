const mongoose = require("mongoose");

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
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
});

const Institute = mongoose.model("Institute", instituteSchema);
module.exports = Institute;
