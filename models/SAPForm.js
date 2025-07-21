const mongoose = require('mongoose');

const SAPFormSchema = new mongoose.Schema({
  name: String,
  email: String,
  activity: String,
  proofUrl: String,
});

module.exports = mongoose.model('SAPForm', SAPFormSchema);
