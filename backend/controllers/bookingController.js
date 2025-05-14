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
        ministryId,
        repeatConfig 
    } = req.body;

    // Validate user from token matches the requested user ID or is an admin
    const isAdmin = req.user.role === 'admin';
    const isCreatingForSelf = req.user.id === userId;
    
    if (!isCreatingForSelf && !isAdmin) {
        return res.status(403).json({ message: "You can only create bookings for yourself" });
    }

    // Enhanced validation to check for empty strings as well
    if (!room || !startDateTime || !endDateTime || !eventName || eventName === '' || !userId || !frequency) {
        console.log("Missing or empty required fields:", {
            room,
            startDateTime,
            endDateTime,
            eventName,
            userId,
            userName,
            ministryId,
            frequency
        });
        return res.status(400).json({ message: "Required fields are missing or empty" });
    }

    try {
        // Additional debug logging
        console.log("Processing booking with validated fields:", {
            room,
            startDateTime,
            endDateTime,
            eventName,
            userId,
            ministryId,
            frequency,
            repeatConfig
        });
        
        // If ministry ID is provided, verify user has access to this ministry
        if (ministryId) {
            const ministryCheck = await pool.query(
                `SELECT * FROM user_ministries 
                 WHERE user_id = $1 AND ministry_id = $2`,
                [userId, ministryId]
            );
            
            if (ministryCheck.rows.length === 0) {
                return res.status(403).json({ 
                    message: "You can only create bookings for ministries you belong to" 
                });
            }
        }

        // Lookup room_id from room name
        const roomResult = await pool.query('SELECT id FROM rooms WHERE name = $1', [room]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: "Room not found" });
        }
        const roomId = roomResult.rows[0].id;
        
        const createdAt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        // If admin is creating, auto-approve the booking
        const status = isAdmin ? 'approved' : 'pending';
        
        // Check for time conflicts
        const conflictsResult = await pool.query(
            `SELECT * FROM bookings 
            WHERE room_id = $1 AND status = 'approved'
            AND NOT (
                end_datetime <= $2 OR 
                start_datetime >= $3
            )`,
            [roomId, startDateTime, endDateTime]
        );

        if (conflictsResult.rows.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        // Generate a series ID if this is a repeating booking
        let seriesId = null;
        if (frequency !== 'single' && repeatConfig) {
            seriesId = uuidv4();
            
            // Create the repeat series configuration
            await pool.query(
                `INSERT INTO repeat_series 
                (id, created_by, repeat_type, repeat_interval, repeat_on, ends_after, ends_on)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
                (id, user_id, ministry_id, room_id, event_name, start_datetime, end_datetime, 
                 frequency, created_at, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [id, userId, ministryId, roomId, eventName, startDateTime, endDateTime, 
                 frequency, createdAt, status]
            );            
            bookings.push({
                id,
                userId,
                userName,
                room,
                roomId,
                ministry_id: ministryId,
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
            
            console.log(`Generated ${occurrences.length} occurrences for recurring booking`);
            
            const approvedBy = isAdmin ? req.user.id : null;

            for (const occurrence of occurrences) {
                const id = uuidv4();
                console.log(`Creating occurrence: ${occurrence.startDateTime} - ${occurrence.endDateTime}`);
                
                await pool.query(
                    `INSERT INTO bookings 
                    (id, user_id, ministry_id, room_id, event_name, start_datetime, end_datetime, series_id, frequency, created_at, approved_at, approved_by, status) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12)`,
                    [
                        id, userId, ministryId, roomId, eventName,
                        occurrence.startDateTime, occurrence.endDateTime,
                        seriesId, frequency,
                        isAdmin ? new Date() : null,
                        approvedBy, status
                    ]
                );

                bookings.push({
                    id,
                    userId,
                    userName,
                    room,
                    roomId,
                    ministry_id: ministryId,
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
            const action = `Admin ${req.user.email} created ${status} booking for ${userName}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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

// Get all bookings (admin only)
exports.getBookings = async (req, res) => {
    try {
        const { user, room, date, status } = req.query;
        
        // Build a query that joins with room and user tables to get names
        let query = `
            SELECT b.*, 
                   r.name as room_name, 
                   u.name as user_name, 
                   m.name as ministry_name
            FROM bookings b
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            LEFT JOIN ministries m ON b.ministry_id = m.id
        `;
        
        let conditions = [];
        let params = [];
        let paramCount = 1;

        if (user) {
            conditions.push(`b.user_id = $${paramCount}`);
            params.push(user);
            paramCount++;
        }

        if (room) {
            conditions.push(`r.name = $${paramCount}`);
            params.push(room);
            paramCount++;
        }

        if (date) {
            // Ensure date is treated as a full-day range
            const dayStart = new Date(date + 'T00:00:00').toISOString();
            const dayEnd = new Date(date + 'T23:59:59.999Z').toISOString();

            conditions.push(`b.start_datetime <= $${paramCount} AND b.end_datetime >= $${paramCount + 1}`);
            params.push(dayEnd, dayStart);
            paramCount += 2;
        }

        if (status) {
            conditions.push(`b.status = $${paramCount}`);
            params.push(status);
            paramCount++;
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY b.created_at DESC';

        const bookingsResult = await pool.query(query, params);
        
        // Format the results to match frontend expected format
        const formattedBookings = bookingsResult.rows.map(booking => ({
            id: booking.id,
            userId: booking.user_id,
            userName: booking.user_name,
            ministryId: booking.ministry_id,
            ministryName: booking.ministry_name,
            roomId: booking.room_id,
            roomName: booking.room_name,
            eventName: booking.event_name,
            startDateTime: booking.start_datetime,
            endDateTime: booking.end_datetime,
            frequency: booking.frequency,
            status: booking.status,
            createdAt: booking.created_at,
            approvedAt: booking.approved_at,
            approvedBy: booking.approved_by,
            seriesId: booking.series_id
        }));
        console.log("Bookings fetched successfully:", formattedBookings);
        res.json(formattedBookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error while fetching bookings" });
    }
};

// Helper function to generate all occurrences for a repeating booking
function generateOccurrences(startDateTime, endDateTime, repeatType, interval, repeatOn, endsAfter, endsOn) {
    const occurrences = [];
    console.log("Generating occurrences with params:", { 
        startDateTime, endDateTime, repeatType, interval, repeatOn, endsAfter, endsOn 
    });

    // Parse dates properly
    let currentStart = new Date(startDateTime);
    let currentEnd = new Date(endDateTime);

    let occurrenceCount = 0;
    
    // Set maximum end date (2 years from start date or specific end date)
    const maxAllowedEnd = new Date(currentStart);
    maxAllowedEnd.setFullYear(maxAllowedEnd.getFullYear() + 2);
    
    // If endsOn is provided, use it; otherwise use maxAllowedEnd
    const maxEndDate = endsOn ? new Date(endsOn) : maxAllowedEnd;

    // Add the first occurrence regardless of the repeat pattern
    occurrences.push({
        startDateTime: formatTime(currentStart),
        endDateTime: formatTime(currentEnd)
    });
    occurrenceCount++;

    // Set the start date for the next occurrence
    currentStart = advanceDate(currentStart, repeatType, interval);
    const durationMs = new Date(endDateTime) - new Date(startDateTime);
    currentEnd = new Date(currentStart.getTime() + durationMs);
    
    // Maximum safety limit to prevent infinite loops
    const MAX_ITERATIONS = 1000;
    let iterations = 0;
    
    // Generate subsequent occurrences
    while (
        ((!endsAfter || occurrenceCount < endsAfter) &&
        (!maxEndDate || currentStart <= maxEndDate)) &&
        iterations < MAX_ITERATIONS
    ) {
        iterations++;
        
        if (shouldIncludeOccurrence(currentStart, repeatType, repeatOn)) {
            console.log(`Including occurrence on ${currentStart.toISOString()}`);
            occurrences.push({
                startDateTime: formatTime(currentStart),
                endDateTime: formatTime(currentEnd)
            });
            occurrenceCount++;
        } else {
            console.log(`Skipping occurrence on ${currentStart.toISOString()} - doesn't match criteria`);
        }

        // Advance to the next potential date
        currentStart = advanceDate(currentStart, repeatType, interval);
        currentEnd = new Date(currentStart.getTime() + durationMs);
    }

    console.log(`Generated ${occurrences.length} occurrences`);
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
    
    console.log(`Checking occurrence: ${date.toISOString()}, day: ${dayOfWeek}, date: ${dayOfMonth}, month: ${month}`);
    console.log(`Repeat config:`, { repeatType, repeatOn });

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
                // Calculate which occurrence of this weekday in the month
                let count = 0;
                let tempDate = new Date(date.getFullYear(), date.getMonth(), 1);
                
                // Count occurrences of this weekday in this month up to the current date
                while (tempDate <= date) {
                    if (tempDate.getDay() === repeatOn.day) {
                        count++;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }
                
                // Handle 'last' week of month (-1)
                if (repeatOn.position === -1) {
                    // Check if this is the last occurrence of this day in the month
                    const nextDate = new Date(date);
                    nextDate.setDate(date.getDate() + 7); // Add a week
                    // If next occurrence is in a different month, this is the last one
                    return nextDate.getMonth() !== date.getMonth() && date.getDay() === repeatOn.day;
                }
                
                console.log(`Day ${repeatOn.day}, Position ${repeatOn.position}, Count ${count}`);
                return dayOfWeek === repeatOn.day && count === repeatOn.position;
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
    // Format as YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
}

// Get user bookings
exports.getUserBookings = async (req, res) => {
    const { userId } = req.params;

    // Only allow users to access their own bookings, unless they're admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "You can only access your own bookings" });
    }

    try {
        const bookingsResult = await pool.query(
            `SELECT b.*, 
                    r.name as room, 
                    u.name as user_name, 
                    m.name as ministry_name
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN ministries m ON b.ministry_id = m.id
             WHERE b.user_id = $1 
             ORDER BY b.created_at DESC`,
            [userId]
        );

        const formattedBookings = bookingsResult.rows.map(booking => ({
            id: booking.id,
            userId: booking.user_id,
            userName: booking.user_name,
            ministryId: booking.ministry_id,
            ministryName: booking.ministry_name,
            room: booking.room,
            roomId: booking.room_id,
            eventName: booking.event_name,
            startDateTime: booking.start_datetime,
            endDateTime: booking.end_datetime,
            frequency: booking.frequency,
            status: booking.status,
            createdAt: booking.created_at,
            approvedAt: booking.approved_at,
            approvedBy: booking.approved_by,
            seriesId: booking.series_id
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ message: "Server error while fetching user bookings" });
    }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const bookingResult = await pool.query(
            `SELECT b.*, 
                    r.name as room, 
                    u.name as user_name, 
                    m.name as ministry_name
             FROM bookings b
             LEFT JOIN rooms r ON b.room_id = r.id
             LEFT JOIN users u ON b.user_id = u.id
             LEFT JOIN ministries m ON b.ministry_id = m.id
             WHERE b.id = $1`,
            [id]
        );
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        // Only allow users to access their own bookings, unless they're admin
        if (bookingResult.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only access your own bookings" });
        }
        
        const booking = bookingResult.rows[0];
        const formattedBooking = {
            id: booking.id,
            userId: booking.user_id,
            userName: booking.user_name,
            ministry_id: booking.ministry_id,
            ministryName: booking.ministry_name,
            room: booking.room,
            roomId: booking.room_id,
            eventName: booking.event_name,
            startDateTime: booking.start_datetime,
            endDateTime: booking.end_datetime,
            frequency: booking.frequency,
            status: booking.status,
            createdAt: booking.created_at,
            approvedAt: booking.approved_at,
            approvedBy: booking.approved_by,
            seriesId: booking.series_id
        };

        res.json(formattedBooking);
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
        // Lookup room_id from room name
        const roomResult = await pool.query('SELECT id FROM rooms WHERE name = $1', [room]);
        if (roomResult.rows.length === 0) {
            return res.status(404).json({ message: "Room not found" });
        }
        const roomId = roomResult.rows[0].id;

        // Check if booking exists
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBookingResult.rows[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only update your own bookings" });
        }

        // Regular users can only edit pending bookings
        if (booking.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(400).json({ message: "Cannot edit approved or rejected bookings" });
        }

        // Check for time conflicts (excluding this booking)
        const conflictsResult = await pool.query(
            `SELECT * FROM bookings 
             WHERE room_id = $1 AND id != $2 AND status != 'rejected'
             AND NOT (end_datetime <= $3 OR start_datetime >= $4)`,
            [roomId, id, start_datetime, end_datetime]
        );

        if (conflictsResult.rows.length > 0) {
            return res.status(409).json({ message: "This time slot conflicts with an existing booking" });
        }

        // Update the booking with new values
        await pool.query(
            `UPDATE bookings SET
             room_id = $1,
             event_name = $2,
             start_datetime = $3,
             end_datetime = $4,
             frequency = $5
             WHERE id = $6`,
            [roomId, eventName, start_datetime, end_datetime, frequency, id]
        );

        // Log admin updates
        if (req.user.role === 'admin' && req.user.id !== booking.user_id) {
            const logId = uuidv4();
            const action = `Admin ${req.user.username} updated booking ${id} for ${booking.user_name}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBookingResult.rows[0];
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
                `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
         room = $1,
         event_name = $2,
         start_datetime = $3,
         end_datetime = $4,
         frequency = $5
         WHERE id = $6`,
        [room, eventName, startDateTime, endDateTime, frequency, id]
    );
}

// Helper function to update future bookings in a series
async function updateFutureBookings(booking, room, startDateTime, endDateTime, eventName, frequency) {
    await pool.query(
        `UPDATE bookings SET
         room = $1,
         event_name = $2,
         start_datetime = $3,
         end_datetime = $4,
         frequency = $5
         WHERE series_id = $6 AND start_datetime >= $7`,
        [room, eventName, startDateTime, endDateTime, frequency, booking.series_id, booking.start_datetime]
    );
}

// Helper function to update all bookings in a series
async function updateAllSeriesBookings(seriesId, room, startDateTime, endDateTime, eventName, frequency) {
    await pool.query(
        `UPDATE bookings SET
         room = $1,
         event_name = $2,
         start_datetime = $3,
         end_datetime = $4,
         frequency = $5
         WHERE series_id = $6`,
        [room, eventName, startDateTime, endDateTime, frequency, seriesId]
    );
}

// Delete booking
exports.deleteBooking = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if booking exists
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBookingResult.rows[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only delete your own bookings" });
        }

        const result = await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
        
        // Log admin deletions
        if (req.user.role === 'admin' && req.user.id !== booking.user_id) {
            const logId = uuidv4();
            const action = `Admin ${req.user.username} deleted booking ${id} for ${booking.user_name}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if user owns the booking or is an admin
        const booking = existingBookingResult.rows[0];
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You can only delete your own bookings" });
        }

        // Delete the booking
        await pool.query('DELETE FROM bookings WHERE id = $1', [id]);

        // Handle different delete types for series bookings
        if (deleteType === 'this') {
            await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
        } else if (deleteType === 'future') {
            await pool.query(
                'DELETE FROM bookings WHERE series_id = $1 AND start_datetime >= $2', 
                [booking.series_id, booking.start_datetime]
            );
        } else if (deleteType === 'all') {
            await pool.query('DELETE FROM bookings WHERE series_id = $1', [booking.series_id]);
            await pool.query('DELETE FROM repeat_series WHERE id = $1', [booking.series_id]);
        } else {
            return res.status(400).json({ message: "Invalid delete type" });
        }
        
        // Log admin deletions
        if (req.user.role === 'admin' && req.user.id !== booking.user_id) {
            const logId = uuidv4();
            const action = `Admin ${req.user.email} deleted booking ${id} for ${booking.user_name}`;
            await pool.query(
                `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        await pool.query(
            `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
            [req.user.id, id]
        );
        
        // Log the approval
        const logId = uuidv4();
        const action = `Admin ${req.user.username} approved booking ${id} for ${existingBookingResult.rows[0].user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = existingBookingResult.rows[0];
        
        if (!booking.series_id || approveType === 'this') {
            // Approve only this specific booking
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
                [req.user.id, id]
            );
        } else if (approveType === 'future') {
            // Approve this and all future bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = $1 
                 WHERE series_id = $2 AND start_datetime >= $3`,
                [req.user.id, booking.series_id, booking.start_datetime]
            );
        } else if (approveType === 'all') {
            // Approve all bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'approved', approved_at = NOW(), approved_by = $1 
                 WHERE series_id = $2`,
                [req.user.id, booking.series_id]
            );
        } else {
            return res.status(400).json({ message: "Invalid approval type" });
        }
        
        // Log the approval
        const logId = uuidv4();
        const action = `Admin ${req.user.username} approved booking ${id} for ${booking.user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        
        await pool.query(
            `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
            [req.user.id, id]
        );
        
        // Log the rejection
        const logId = uuidv4();
        const action = `Admin ${req.user.username} rejected booking ${id} for ${existingBookingResult.rows[0].user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
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
        const existingBookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
        
        if (existingBookingResult.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = existingBookingResult.rows[0];
        
        if (!booking.series_id || rejectType === 'this') {
            // Reject only this specific booking
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = $1 WHERE id = $2`,
                [req.user.id, id]
            );
        } else if (rejectType === 'future') {
            // Reject this and all future bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = $1 
                 WHERE series_id = $2 AND start_datetime >= $3`,
                [req.user.id, booking.series_id, booking.start_datetime]
            );
        } else if (rejectType === 'all') {
            // Reject all bookings in the series
            await pool.query(
                `UPDATE bookings SET status = 'rejected', approved_at = NOW(), approved_by = $1 
                 WHERE series_id = $2`,
                [req.user.id, booking.series_id]
            );
        } else {
            return res.status(400).json({ message: "Invalid rejection type" });
        }
        
        // Log the rejection
        const logId = uuidv4();
        const action = `Admin ${req.user.username} rejected booking ${id} for ${booking.user_name}`;
        await pool.query(
            `INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)`,
            [logId, action]
        );
        
        res.json({ message: "Booking rejected successfully" });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        res.status(500).json({ message: "Server error while rejecting booking" });
    }
};