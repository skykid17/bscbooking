const express = require('express');
const router = express.Router();
const { 
    createBooking, 
    getBookings, 
    getUserBookings,
    getBookingById, 
    updateBooking, 
    deleteBooking,
    approveBooking,
    rejectBooking
} = require('../controllers/bookingController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// User routes
router.post('/', createBooking);
router.get('/user/:userId', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

// Admin routes
router.get('/', adminOnly, getBookings);
router.put('/:id/approve', adminOnly, approveBooking);
router.put('/:id/reject', adminOnly, rejectBooking);

module.exports = router;