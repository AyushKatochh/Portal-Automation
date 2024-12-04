const mongoose = require("mongoose");
const { Schema } = mongoose;

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
    userName:{
      type: String,
      required: true,
      unique: true,
    },   
  });
  
  
  const Institute = mongoose.model('Institute', instituteSchema);
  module.exports =Institute;
  