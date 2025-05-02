const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, name, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    
    try {
        const [user] = await pool.query('SELECT id, username, name, role FROM users WHERE id = ?', [id]);
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error while fetching user' });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    const { username, name, password, role } = req.body;
    
    if (!username || !name || !password) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    // Validate role
    if (role && role !== 'user' && role !== 'admin') {
        return res.status(400).json({ message: 'Invalid role' });
    }
    
    try {
        // Check if username already exists
        const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        
        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'user'; // Default to 'user' if no role is provided
        
        await pool.query(
            'INSERT INTO users (id, username, name, password, role) VALUES (?, ?, ?, ?, ?)',
            [id, username, name, hashedPassword, userRole]
        );
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} created new user ${username} with role ${userRole}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id,
                username,
                name,
                role: userRole
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error while creating user' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, name, password, role } = req.body;
    
    if (!username || !name) {
        return res.status(400).json({ message: 'Username and name are required' });
    }
    
    // Validate role
    if (role && role !== 'user' && role !== 'admin') {
        return res.status(400).json({ message: 'Invalid role' });
    }
    
    try {
        // Check if user exists
        const [existingUser] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        
        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if username already exists for another user
        const [usernameExists] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
        
        if (usernameExists.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        
        // Update user info
        let query = 'UPDATE users SET username = ?, name = ?';
        let params = [username, name];
        
        // Add role if provided
        if (role) {
            query += ', role = ?';
            params.push(role);
        }
        
        // Add password if provided
        if (password) {
            query += ', password = ?';
            const hashedPassword = await bcrypt.hash(password, 10);
            params.push(hashedPassword);
        }
        
        query += ' WHERE id = ?';
        params.push(id);
        
        await pool.query(query, params);
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} updated user ${username}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if user exists and get their info for logging
        const [existingUser] = await pool.query('SELECT username FROM users WHERE id = ?', [id]);
        
        if (existingUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Don't allow deleting your own account
        if (id === req.user.id) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} deleted user ${existingUser[0].username}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};