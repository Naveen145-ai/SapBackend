const express = require('express');
const router = express.Router();
const { submitSAPForm } = require('../controllers/sapControllers');
const upload = require('../middleware/upload');

router.post('/submit', upload.single('proof'), submitSAPForm);

module.exports = router;
