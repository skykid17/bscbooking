const express = require('express');
const router = express.Router();
const { 
    loginUser, 
    registerUser,
    verifyEmail,
    resendVerificationEmail
} = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;
