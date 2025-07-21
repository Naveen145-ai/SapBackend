const mongoose = require('mongoose');

const sapSchema = new mongoose.Schema({
  name: String,
  email: String,
  activity: String,
  proofUrl: String,
});

module.exports = mongoose.model('SAPSubmission', sapSchema);
