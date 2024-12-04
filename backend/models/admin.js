const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new mongoose.Schema({
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
    committee:{
      type: String,
      required: true,
      enum:['Scrutiny','Rescrutiny','Expert Visit', 'Executive']
    },
    applicatins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: false }], // allocated applications
    
  });
  
  
  const Admin = mongoose.model('Admin', adminSchema);
  
  module.exports =Admin;
  