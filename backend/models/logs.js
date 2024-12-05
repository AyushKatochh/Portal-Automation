const mongoose = require("mongoose");
const { Schema } = mongoose;

const logsSchema = new Schema({
  application_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application', 
    required: true 
  }, // Foreign key referencing the Application collection
  
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Rejected', 'Approved'], 
    required: true 
  }, // Current status of the application
  
  stage: {
    document_verification: {
      is_allocated: { type: Boolean, default: false },
      deadline: { type: Date },
      is_completed: { type: Boolean, default: false },
      success: { type: Boolean, default: false },
      verification_timestamp:{ type: Date },
      remark: { type: String },
    },
    expert_visit_stage: {
      is_allocated: { type: Boolean, default: false },
      deadline: { type: Date },
      is_completed: { type: Boolean, default: false },
      success: { type: Boolean, default: false },
      verification_timestamp:{ type: Date },
      remark: { type: String },
    },
    final_stage: {
      is_allocated: { type: Boolean, default: false },
      deadline: { type: Date },
      is_completed: { type: Boolean, default: false },
      success: { type: Boolean, default: false },
      verification_timestamp:{ type: Date },
      remark: { type: String },
    },
  }, // Stages with detailed fields for each stage
  
  status_logs: [
    {
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ], // Array of status messages with timestamps
});

// Export the model
const Logs = mongoose.model('Logs', logsSchema);

module.exports = Logs;
