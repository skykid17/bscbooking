const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public routes - no authentication required
router.get('/ministries', publicController.getAllMinistries);

module.exports = router;
