const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all rooms
exports.getAllRooms = async (req, res) => {
    try {
        const [rooms] = await pool.query('SELECT * FROM rooms');
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Server error while fetching rooms' });
    }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [room] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
        
        if (room.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        res.json(room[0]);
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ message: 'Server error while fetching room' });
    }
};

// Create new room
exports.createRoom = async (req, res) => {
    const { name, floor, pax } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Room name is required' });
    }
    
    try {
        // Check if room already exists
        const [existingRoom] = await pool.query('SELECT * FROM rooms WHERE room = ?', [name]);
        
        if (existingRoom.length > 0) {
            return res.status(409).json({ message: 'A room with this name already exists' });
        }
        
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO rooms (id, room, floor, pax) VALUES (?, ?, ?, ?)',
            [id, name, floor, pax]
        );
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} created new room "${name}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.status(201).json({
            message: 'Room created successfully',
            room: {
                id,
                room: name,
                floor,
                pax
            }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Server error while creating room' });
    }
};

// Update room
exports.updateRoom = async (req, res) => {
    const { id } = req.params;
    const { name, floor, pax } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Room name is required' });
    }
    
    try {
        // Check if room exists
        const [existingRoom] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
        
        if (existingRoom.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        // Check if new name already exists for another room
        const [roomWithName] = await pool.query('SELECT * FROM rooms WHERE room = ? AND id != ?', [name, id]);
        
        if (roomWithName.length > 0) {
            return res.status(409).json({ message: 'A room with this name already exists' });
        }
        
        await pool.query(
            'UPDATE rooms SET room = ?, floor = ?, pax = ? WHERE id = ?',
            [name, floor, pax, id]
        );
        
        // Update any bookings referencing this room
        await pool.query(
            'UPDATE bookings SET room = ? WHERE room = ?',
            [name, existingRoom[0].room]
        );
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} updated room "${existingRoom[0].room}" to "${name}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.json({ 
            message: 'Room updated successfully',
            room: {
                id,
                room: name,
                floor,
                pax
            }
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Server error while updating room' });
    }
};

// Delete room
exports.deleteRoom = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if room exists
        const [existingRoom] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
        
        if (existingRoom.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        // Delete room
        await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
        
        // Delete all bookings for this room
        await pool.query('DELETE FROM bookings WHERE room = ?', [existingRoom[0].room]);
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} deleted room "${existingRoom[0].room}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Server error while deleting room' });
    }
};