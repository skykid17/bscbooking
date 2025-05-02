const express = require('express');
const router = express.Router();
const { 
    getAllUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser 
} = require('../controllers/userController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);
// Apply admin middleware to all routes since user management is admin-only
router.use(adminOnly);

// Get all users
router.get('/', getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;