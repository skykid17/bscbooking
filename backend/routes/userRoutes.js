const express = require('express');
const router = express.Router();
const { 
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserMinistries
} = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all users (admin only)
router.get('/', adminOnly, getUsers);

// Get user by ID 
router.get('/:id', getUserById);

// Get ministries for a specific user
router.get('/:id/ministries', getUserMinistries);

// Create a new user (admin only)
router.post('/', adminOnly, createUser);

// Update a user
router.put('/:id', updateUser);

// Delete a user (admin only)
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;