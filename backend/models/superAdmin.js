const mongoose = require("mongoose");
const { Schema } = mongoose;

const superAdminSchema = new mongoose.Schema({
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
    designation:{
        type: String,
        required: true,
      }, 
  });
  
  
  const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
  module.exports =SuperAdmin;
  