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
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SAPForm', SAPFormSchema);
