const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all rooms
exports.getAllRooms = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms');
        const rooms = result.rows;
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
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
        const room = result.rows;
        
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
        const result = await pool.query('SELECT * FROM rooms WHERE name = $1', [name]);
        const existingRoom = result.rows;
        
        if (existingRoom.length > 0) {
            return res.status(409).json({ message: 'A room with this name already exists' });
        }
        
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO rooms (id, name, floor, pax) VALUES ($1, $2, $3, $4)',
            [id, name, floor, pax]
        );
        
        const logId = uuidv4();
        const action = `Admin ${req.user.username} created new room "${name}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)',
            [logId, action]
        );
        
        res.status(201).json({
            message: 'Room created successfully',
            room: { id, name, floor, pax }
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
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
        const existingRoom = result.rows;
        
        if (existingRoom.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }
        
        const resultName = await pool.query('SELECT * FROM rooms WHERE name = $1 AND id != $2', [name, id]);
        const roomWithName = resultName.rows;
        
        if (roomWithName.length > 0) {
            return res.status(409).json({ message: 'A room with this name already exists' });
        }
        
        await pool.query(
            'UPDATE rooms SET name = $1, floor = $2, pax = $3 WHERE id = $4',
            [name, floor, pax, id]
        );
        
        await pool.query(
            'UPDATE bookings SET room = $1 WHERE room = $2',
            [name, existingRoom[0].name]
        );

        const logId = uuidv4();
        const action = `Admin ${req.user.username} updated room "${existingRoom[0].name}" to "${name}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)',
            [logId, action]
        );

        res.json({ message: 'Room updated successfully', room: { id, name, floor, pax } });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ message: 'Server error while updating room' });
    }
};

// Delete room
exports.deleteRoom = async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
        const existingRoom = result.rows;

        if (existingRoom.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
        await pool.query('DELETE FROM bookings WHERE room = $1', [existingRoom[0].name]);

        const logId = uuidv4();
        const action = `Admin ${req.user.username} deleted room "${existingRoom[0].name}"`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)',
            [logId, action]
        );

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ message: 'Server error while deleting room' });
    }
};