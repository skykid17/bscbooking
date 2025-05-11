const express = require('express');
const router = express.Router();
const {
    getAllMinistries, 
    getMinistryById, 
    createMinistry, 
    updateMinistry, 
    deleteMinistry
} = require('../controllers/ministryController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all ministries
router.get('/', getAllMinistries);

// Get ministry by ID
router.get('/:id', getMinistryById);

// Admin-only routes
router.post('/', adminOnly, createMinistry);
router.put('/:id', adminOnly, updateMinistry);
router.delete('/:id', adminOnly, deleteMinistry);

module.exports = router;
