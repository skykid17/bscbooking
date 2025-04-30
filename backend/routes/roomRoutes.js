const express = require('express');
const router = express.Router();
const { 
    getAllRooms, 
    getRoomById, 
    createRoom, 
    updateRoom, 
    deleteRoom 
} = require('../controllers/roomController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Public route - anyone can view rooms
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Admin only routes
router.use(authenticate);
router.use(adminOnly);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;