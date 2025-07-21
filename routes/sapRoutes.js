const express = require('express');
const router = express.Router();
const { submitSAPForm } = require('../controllers/sapControllers');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Use 'proof' as field name here
const upload = multer({ storage });

router.post('/submit', upload.single('proof'), submitSAPForm);

module.exports = router;
