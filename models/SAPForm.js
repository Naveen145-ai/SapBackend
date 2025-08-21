const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  key: String,
  title: String,
  values: mongoose.Schema.Types.Mixed,
  proofUrls: [{ type: String }]
}, { _id: false });

const SAPFormSchema = new mongoose.Schema({
  name: String,
  email: String, // mentee email
  activity: String,
  category: { type: String, enum: ['activity', 'fullForm', 'eventsForm'], default: 'activity' },
  proofUrl: String,
  proofUrls: [{ type: String }],
  mentorEmail: String, // 👈 this links to the mentor
  details: mongoose.Schema.Types.Mixed, // flexible JSON for full form
  events: [EventSchema],
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
