const express = require('express');

const router = express.Router();

const {mentorSignUp,mentorLogin} = require('../controllers/mentorAuthController');

router.post('/signup',mentorSignUp);

router.post('/login',mentorLogin);


module.exports = router;