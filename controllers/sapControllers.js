const SAPForm = require('../models/SAPForm'); // make sure you have a correct model

exports.submitSAPForm = async (req, res) => {
  try {
    const { name, email, activity } = req.body;
    const proof = req.file?.filename;

    if (!proof) {
      return res.status(400).json({ error: 'File upload failed or missing' });
    }

    const newForm = new SAPForm({
      name,
      email,
      activity,
      proofUrl: `/uploads/${proof}`
    });

    await newForm.save();

    res.status(201).json({ success: true, message: 'SAP form submitted successfully' });
  } catch (error) {
    console.error('Error submitting SAP form:', error);
    res.status(500).json({ error: 'Server error while submitting form' });
  }
};
