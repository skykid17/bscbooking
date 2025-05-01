const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create new booking
exports.createBooking = async (req, res) => {
    const { 
        room, 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        eventName, 
        frequency, 
        userId, 
        userName 
    } = req.body;

    // Validate user from token matches the requested user ID or is an admin
    const isAdmin = req.user.role === 'admin';
    const isCreatingForSelf = req.user.id === userId;
    
    if (!isCreatingForSelf && !isAdmin) {
        return res.status(403).json({ message: "You can only create bookings for yourself" });
    }

    if (!room || !startDate || !startTime || !endTime || !eventName || !userId) {
        return res.status(400).json({ message: "Required fields are missing" });
    }

    try {
        const id = uuidv4();
        const createdAt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        // If admin is creating, auto-approve the booking
        const status = isAdmin ? 'approved' : 'pending';
        
        // Check for time conflicts
        const [conflicts] = await pool.query(
            `SELECT * FROM bookings 
            WHERE name = ? AND status != 'rejected'
            AND ((start_date = ? AND end_date = ? AND 
                ((start_time <= ? AND end_time > ?) OR 
                (start_time < ? AND end_time >= ?) OR 
                (start_time >= ? AND end_time <= ?))))`,
            [room, startDate, endDate, startTime, startTime, endTime, endTime, startTime, endTime]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        // Insert booking into database
        await pool.query(
            `INSERT INTO bookings 
            (id, user_id, user_name, room, event_name, start_date, start_time, end_date, end_time, 
             frequency, created_at, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, userName, room, eventName, startDate, startTime, endDate, endTime, 
             frequency, createdAt, status]
        );

        // If admin is creating the booking for someone else, log this action
        if (isAdmin && !isCreatingForSelf) {
            const logId = uuidv4();
            const action = `Admin ${req.user.username} created ${status} booking for ${userName}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
                [logId, action]
            );
        }

        res.status(201).json({ 
            message: "Booking created successfully",
            booking: {
                id,
                userId,
                userName,
                room,
                eventName,
                startDate,
                startTime,
                endDate,
                endTime,
                frequency,
                createdAt,
                status
            }
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Server error during booking creation" });
    }
};

// Get all bookings (admin only)
exports.getBookings = async (req, res) => {
    try {
        // Apply filters if provided
        const { user, room, date, status } = req.query;
        let query = 'SELECT * FROM bookings';
        let conditions = [];
        let params = [];

        if (user) {
            conditions.push('user_id = ?');
            params.push(user);
        }
        
        if (room) {
            conditions.push('room = ?');
            params.push(room);
        }
        
        if (date) {
            conditions.push('(start_date <= ? AND end_date >= ?)');
            params.push(date, date);
        }
        
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const [bookings] = await pool.query(query, params);
        
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error while fetching bookings" });
    }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
    const { userId } = req.params;

    // Only allow users to access their own bookings, unless they're admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "You can only access your own bookings" });
    }

    try {
        const [bookings] = await pool.query(
            'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ message: "Server error while fetching user bookings" });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (booking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        // Only allow users to access their own bookings, unless they're admin
        if (booking[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only access your own bookings" });
        }
        
        res.json(booking[0]);
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Server error while fetching booking" });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    const { id } = req.params;
    const { 
        room, 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        eventName, 
        frequency 
    } = req.body;

    try {
        // Check if booking exists
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBooking[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only update your own bookings" });
        }

        // Regular users can only edit pending bookings
        if (booking.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({ message: "Cannot edit approved or rejected bookings" });
        }

        // Check for time conflicts (excluding this booking)
        const [conflicts] = await pool.query(
            `SELECT * FROM bookings 
            WHERE name = ? AND id != ? AND status != 'rejected'
            AND ((start_date = ? AND end_date = ? AND 
                ((start_time <= ? AND end_time > ?) OR 
                (start_time < ? AND end_time >= ?) OR 
                (start_time >= ? AND end_time <= ?))))`,
            [room, id, startDate, endDate, startTime, startTime, endTime, endTime, startTime, endTime]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        await pool.query(
            `UPDATE bookings SET
             room = ?,
             event_name = ?,
             start_date = ?,
             start_time = ?,
             end_date = ?,
             end_time = ?,
             frequency = ?
             WHERE id = ?`,
            [room, eventName, startDate, startTime, endDate, endTime, frequency, id]
        );

        // Log admin updates
        if (req.user.role === 'admin' && req.user.id !== booking.user_id) {
            const logId = uuidv4();
            const action = `Admin ${req.user.username} updated booking ${id} for ${booking.user_name}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
                [logId, action]
            );
        }

        res.json({ message: "Booking updated successfully" });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Server error while updating booking" });
    }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if booking exists
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBooking[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only delete your own bookings" });
        }

        const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
        
        // Log admin deletions
        if (req.user.role === 'admin' && req.user.id !== booking.user_id) {
            const logId = uuidv4();
            const action = `Admin ${req.user.username} deleted booking ${id} for ${booking.user_name}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
                [logId, action]
            );
        }
        
        res.json({ message: "Booking deleted successfully" });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Server error while deleting booking" });
    }
};

// Approve booking (admin only)
exports.approveBooking = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        await pool.query(
            `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?`,
            [req.user.id, id]
        );
        
        // Log the approval
        const logId = uuidv4();
        const action = `Admin ${req.user.username} approved booking ${id} for ${existingBooking[0].user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
            [logId, action]
        );
        
        res.json({ message: "Booking approved successfully" });
    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({ message: "Server error while approving booking" });
    }
};

// Reject booking (admin only)
exports.rejectBooking = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        await pool.query(
            `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = ? WHERE id = ?`,
            [req.user.id, id]
        );
        
        // Log the rejection
        const logId = uuidv4();
        const action = `Admin ${req.user.username} rejected booking ${id} for ${existingBooking[0].user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
            [logId, action]
        );
        
        res.json({ message: "Booking rejected successfully" });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        res.status(500).json({ message: "Server error while rejecting booking" });
    }
};