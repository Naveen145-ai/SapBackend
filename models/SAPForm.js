const mongoose = require('mongoose');

const SAPFormSchema = new mongoose.Schema({
  name: String,
  email: String, // mentee email
  activity: String,
  proofUrl: String,
  mentorEmail: String, // 👈 this links to the mentor
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  marksAwarded: { type: Number, default: 0 },
  decisionNote: { type: String },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  mentorDecisionAt: { type: Date }
});

module.exports = mongoose.model('SAPForm', SAPFormSchema);
