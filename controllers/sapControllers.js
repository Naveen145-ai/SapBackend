const SAPForm = require('../models/SAPForm');

exports.submitSAPForm = async (req, res) => {
  try {
    const { name, email, activity } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File upload failed or missing" });
    }

    const newForm = new SAPForm({
      name,
      email,
      activity,
      proofUrl: `uploads/${req.file.filename}`,
    });

    const savedForm = await newForm.save();

    res.status(201).json({
      success: true,
      message: "SAP form submitted successfully",
      data: savedForm,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};
