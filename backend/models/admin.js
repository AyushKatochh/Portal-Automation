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
    applications: [{
      application_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: false },
      deadline:{type:Date},
      status:{type:String, enum:['Pending','In Progress','Approved','Rejected'], default:'Pending'}
    }], // allocated applications
    
  });
  
  
  const Admin = mongoose.model('Admin', adminSchema);
  
  module.exports =Admin;
  