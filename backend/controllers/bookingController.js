const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create new booking
exports.createBooking = async (req, res) => {
    const { 
        room, 
        startDateTime, 
        endDateTime,
        eventName, 
        frequency, 
        userId, 
        userName, 
        repeatConfig 
    } = req.body;

    // Validate user from token matches the requested user ID or is an admin
    const isAdmin = req.user.role === 'admin';
    const isCreatingForSelf = req.user.id === userId;
    
    if (!isCreatingForSelf && !isAdmin) {
        return res.status(403).json({ message: "You can only create bookings for yourself" });
    }

    if (!room || !startDateTime || !endDateTime || !eventName || !userId) {
        console.log("Missing required fields:", { room, startDateTime, endDateTime, eventName, userId });
        return res.status(400).json({ message: "Required fields are missing" });
    }

    try {
        const createdAt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        // If admin is creating, auto-approve the booking
        const status = isAdmin ? 'approved' : 'pending';
        
        // Check for time conflicts
        const [conflicts] = await pool.query(
            `SELECT * FROM bookings 
            WHERE room = ? AND status != 'rejected'
            AND NOT (
                end_datetime <= ? OR 
                start_datetime >= ?
            )`,
            [room, startDateTime, endDateTime]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        // Generate a series ID if this is a repeating booking
        let seriesId = null;
        if (frequency !== 'single' && repeatConfig) {
            seriesId = uuidv4();
            
            // Create the repeat series configuration
            await pool.query(
                `INSERT INTO repeat_series 
                (id, created_by, repeat_type, repeat_interval, repeat_on, ends_after, ends_on, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    seriesId, 
                    userId, 
                    repeatConfig.repeatType,
                    repeatConfig.repeatInterval,
                    JSON.stringify(repeatConfig.repeatOn),
                    repeatConfig.endsAfter,
                    repeatConfig.endsOn
                ]
            );
        }
        
        // For repeating bookings, generate all occurrences
        const bookings = [];
        
        if (frequency === 'single' || !repeatConfig) {
            // Single booking
            const id = uuidv4();
            await pool.query(
                `INSERT INTO bookings 
                (id, user_id, user_name, room, event_name, start_datetime, end_datetime, 
                 frequency, created_at, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, userId, userName, room, eventName, startDateTime, endDateTime, 
                 frequency, createdAt, status]
            );            
            bookings.push({
                id,
                userId,
                userName,
                room,
                eventName,
                startDateTime,
                endDateTime,
                frequency,
                createdAt,
                status
            });
        } else {
            // Generate all occurrences based on the repeat configuration
            const occurrences = generateOccurrences(
                startDateTime, endDateTime, repeatConfig.repeatType, repeatConfig.repeatInterval, 
                repeatConfig.repeatOn, repeatConfig.endsAfter, repeatConfig.endsOn
            );
            
            const approvedBy = isAdmin ? req.user.id : null;

            for (const occurrence of occurrences) {
                const id = uuidv4();
                await pool.query(
                    `INSERT INTO bookings 
                    (id, user_id, user_name, room, event_name, start_datetime, end_datetime, series_id, frequency, created_at, approved_at, approved_by, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
                    [
                        id, userId, userName, room, eventName,
                        occurrence.startDateTime, occurrence.endDateTime,
                        seriesId, frequency,
                        approvedBy, status // Make sure these two are included
                    ]
                );

                bookings.push({
                    id,
                    userId,
                    userName,
                    room,
                    eventName,
                    startDateTime: occurrence.startDateTime,
                    endDateTime: occurrence.endDateTime,
                    seriesId,
                    frequency,
                    createdAt: new Date().toISOString(),
                    approvedAt: isAdmin ? new Date().toISOString() : null,
                    approvedBy: approvedBy,
                    status
                });
            }
        }
        
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
            booking: bookings[0],  // Return just the first booking for backward compatibility
            bookings: bookings     // Return all created bookings
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Server error during booking creation" });
    }
};

// Helper function to generate all occurrences for a repeating booking
function generateOccurrences(startDateTime, endDateTime, repeatType, interval, repeatOn, endsAfter, endsOn) {
    const occurrences = [];

    // Use explicit UTC parsing
    let currentStart = new Date(startDateTime + 'Z');
    let currentEnd = new Date(endDateTime + 'Z');

    let occurrenceCount = 0;

    const maxAllowedEnd = new Date(startDateTime + 'Z');
    maxAllowedEnd.setFullYear(maxAllowedEnd.getFullYear() + 2);

    const maxEndDate = endsOn ? new Date(endsOn + 'Z') : maxAllowedEnd;

    while ((!endsAfter || occurrenceCount < endsAfter) &&
           (!maxEndDate || currentStart <= maxEndDate)) {

        if (shouldIncludeOccurrence(currentStart, repeatType, repeatOn)) {
            occurrences.push({
                startDateTime: formatTime(currentStart),
                endDateTime: formatTime(currentEnd)
            });
            occurrenceCount++;
        }

        const newStart = advanceDate(currentStart, repeatType, interval);
        const durationMs = currentEnd - currentStart;
        const newEnd = new Date(newStart.getTime() + durationMs);

        currentStart = newStart;
        currentEnd = newEnd;
    }

    return occurrences;
}

// Helper functions to support generateOccurrences
function shouldIncludeOccurrence(date, repeatType, repeatOn) {
    if (!repeatOn) {
        return true; // If no specific days specified, include all occurrences
    }

    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = date.getDate();
    const month = date.getMonth(); // 0 = January, 11 = December

    switch (repeatType) {
        case 'daily':
            return true; // Daily repeats include all days
            
        case 'weekly':
            // repeatOn is an array of day names ['sunday', 'monday', etc.]
            const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            return repeatOn.includes(weekdays[dayOfWeek]);
            
        case 'monthly':
            if (repeatOn.type === 'day-of-month') {
                // Repeat on a specific day of month (e.g., the 15th)
                return dayOfMonth === repeatOn.day;
            } else if (repeatOn.type === 'day-of-week') {
                // Repeat on a specific occurrence of a day (e.g., 2nd Tuesday)
                const weekNumber = Math.ceil(dayOfMonth / 7);
                
                // Handle 'last' week of month (-1)
                if (repeatOn.position === -1) {
                    const nextMonth = new Date(date);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(0); // Last day of current month
                    
                    // Check if within the last 7 days of the month
                    const daysUntilEnd = nextMonth.getDate() - dayOfMonth;
                    return dayOfWeek === repeatOn.day && daysUntilEnd < 7;
                }
                
                return dayOfWeek === repeatOn.day && weekNumber === repeatOn.position;
            }
            return false;
            
        case 'yearly':
            // Check if this month should be included
            if (Array.isArray(repeatOn.months) && !repeatOn.months.includes(month)) {
                return false;
            }
            
            // Check day of month
            return dayOfMonth === repeatOn.day;
            
        default:
            return false;
    }
}

function advanceDate(date, repeatType, interval) {
    const newDate = new Date(date);
    switch (repeatType) {
        case 'daily':
            newDate.setDate(newDate.getDate() + interval);
            break;
        case 'weekly':
            newDate.setDate(newDate.getDate() + (7 * interval));
            break;
        case 'monthly':
            newDate.setMonth(newDate.getMonth() + interval);
            break;
        case 'yearly':
            newDate.setFullYear(newDate.getFullYear() + interval);
            break;
    }
    return newDate;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

// Get all bookings (admin only)
exports.getBookings = async (req, res) => {
    try {
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
            // Ensure date is treated as a full-day range
            const dayStart = new Date(date + 'T00:00:00').toISOString();
            const dayEnd = new Date(date + 'T23:59:59.999Z').toISOString();

            conditions.push('start_datetime <= ? AND end_datetime >= ?');
            params.push(dayEnd, dayStart);
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
        start_datetime, 
        end_datetime, 
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
             WHERE room = ? AND id != ? AND status != 'rejected'
             AND NOT (end_datetime <= ? OR start_datetime >= ?)`,
            [room, id, start_datetime, end_datetime]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        // Update the booking with new values
        await pool.query(
            `UPDATE bookings SET
             room = ?,
             event_name = ?,
             start_datetime = ?,
             end_datetime = ?,
             frequency = ?
             WHERE id = ?`,
            [room, eventName, start_datetime, end_datetime, frequency, id]
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

// Update booking with series options
exports.updateSeriesBooking = async (req, res) => {
    const { id } = req.params;
    const { 
        room, start_datetime, end_datetime, eventName, frequency,
        updateType // 'this', 'future', or 'all'
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

        // Handle different update types for series bookings
        if (booking.series_id && updateType) {
            switch (updateType) {
                case 'this':
                    // Update only this specific booking
                    await updateSingleBooking(id, room, startDateTime, endDateTime, eventName, frequency);
                    break;
                    
                case 'future':
                    // Update this and all future bookings in the series
                    await updateFutureBookings(booking, room, startDateTime, endDateTime, eventName, frequency);
                    break;
                    
                case 'all':
                    // Update all bookings in the series
                    await updateAllSeriesBookings(booking.series_id, room, startDateTime, endDateTime, eventName, frequency);
                    break;
                    
                default:
                    return res.status(400).json({ message: "Invalid update type" });
            }
        } else {
            // Single booking or no updateType specified
            await updateSingleBooking(id, room, startDateTime, endDateTime, eventName, frequency);
        }
        
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

// Helper function to update a single booking
async function updateSingleBooking(id, room, startDateTime, endDateTime, eventName, frequency) {
    await pool.query(
        `UPDATE bookings SET
         room = ?,
         event_name = ?,
         start_datetime = ?,
         end_datetime = ?,
         frequency = ?
         WHERE id = ?`,
        [room, eventName, startDateTime, endDateTime, frequency, id]
    );
}

// Helper function to update future bookings in a series
async function updateFutureBookings(booking, room, startDateTime, endDateTime, eventName, frequency) {
    await pool.query(
        `UPDATE bookings SET
         room = ?,
         event_name = ?,
         start_datetime = ?,
         end_datetime = ?,
         frequency = ?
         WHERE series_id = ? AND start_datetime >= ?`,
        [room, eventName, startDateTime, endDateTime, frequency, booking.series_id, booking.start_datetime]
    );
}

// Helper function to update all bookings in a series
async function updateAllSeriesBookings(seriesId, room, startDateTime, endDateTime, eventName, frequency) {
    await pool.query(
        `UPDATE bookings SET
         room = ?,
         event_name = ?,
         start_datetime = ?,
         end_datetime = ?,
         frequency = ?
         WHERE series_id = ?`,
        [room, eventName, startDateTime, endDateTime, frequency, seriesId]
    );
}

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

// Delete booking with series options
exports.deleteSeriesBooking = async (req, res) => {
    const { id } = req.params;
    const { deleteType } = req.query; // 'this', 'future', or 'all'
    
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

        console.log(`Processing series deletion: ${id}, type: ${deleteType}`); // Add logging

        // Handle different delete types for series bookings
        if (deleteType === 'this') {
            await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
        } else if (deleteType === 'future') {
            await pool.query(
                'DELETE FROM bookings WHERE series_id = ? AND start_datetime >= ?', 
                [booking.series_id, booking.start_datetime]
            );
        } else if (deleteType === 'all') {
            await pool.query('DELETE FROM bookings WHERE series_id = ?', [booking.series_id]);
            await pool.query('DELETE FROM repeat_series WHERE id = ?', [booking.series_id]);
        } else {
            return res.status(400).json({ message: "Invalid delete type" });
        }
        
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
        console.error("Error in deleteSeriesBooking:", error);
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
    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({ message: "Server error while approving booking" });
    }
};

// Approve booking with series options (admin only)
exports.approveSeriesBooking = async (req, res) => {
    const { id } = req.params;
    const { approveType } = req.query; // 'this', 'future', or 'all'
    
    try {
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = existingBooking[0];
        
        if (!booking.series_id || approveType === 'this') {
            // Approve only this specific booking
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = ? WHERE id = ?`,
                [req.user.id, id]
            );
        } else if (approveType === 'future') {
            // Approve this and all future bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = ? 
                 WHERE series_id = ? AND start_datetime >= ?`,
                [req.user.id, booking.series_id, booking.start_datetime]
            );
        } else if (approveType === 'all') {
            // Approve all bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = ? 
                 WHERE series_id = ?`,
                [req.user.id, booking.series_id]
            );
        } else {
            return res.status(400).json({ message: "Invalid approval type" });
        }
        
        // Log the approval
        const logId = uuidv4();
        const action = `Admin ${req.user.username} approved booking ${id} for ${booking.user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)`,
            [logId, action]
        );
        
        res.json({ message: "Bookings approved successfully" });
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

// Reject booking with series options (admin only)
exports.rejectSeriesBooking = async (req, res) => {
    const { id } = req.params;
    const { rejectType } = req.query; // 'this', 'future', or 'all'
    
    try {
        const [existingBooking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
        
        if (existingBooking.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = existingBooking[0];
        
        if (!booking.series_id || rejectType === 'this') {
            // Reject only this specific booking
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = ? WHERE id = ?`,
                [req.user.id, id]
            );
        } else if (rejectType === 'future') {
            // Reject this and all future bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = ? 
                 WHERE series_id = ? AND start_datetime >= ?`,
                [req.user.id, booking.series_id, booking.start_datetime]
            );
        } else if (rejectType === 'all') {
            // Reject all bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = ? 
                 WHERE series_id = ?`,
                [req.user.id, booking.series_id]
            );
        } else {
            return res.status(400).json({ message: "Invalid rejection type" });
        }
        
        // Log the rejection
        const logId = uuidv4();
        const action = `Admin ${req.user.username} rejected booking ${id} for ${booking.user_name}`;
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