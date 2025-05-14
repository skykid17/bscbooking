const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all ministries
exports.getAllMinistries = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ministries ORDER BY name');
        const ministries = result.rows;
        res.json(ministries);
    } catch (error) {
        console.error('Error fetching ministries:', error);
        res.status(500).json({ message: 'Server error while fetching ministries' });
    }
};

// Get ministries by user ID
exports.getMinistriesByUserId = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const query = `
            SELECT m.id, m.name 
            FROM user_ministries um
            JOIN ministries m ON um.ministry_id = m.id
            WHERE um.user_id = $1
        `;

        const result = await pool.query(query, [userId]);
        const ministries = result.rows;
        
        if (ministries.length === 0) {
            return res.status(404).json({ message: 'No ministries found for the user' });
        }
        
        res.json(ministries);
    } catch (error) {
        console.error('Error fetching ministries for user:', error);
        res.status(500).json({ message: 'Server error while fetching ministries' });
    }
};

// Create new ministry (admin only)
exports.createMinistry = async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Ministry name is required' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM ministries WHERE name = $1', [name]);
        const existingMinistry = result.rows;
        
        if (existingMinistry.length > 0) {
            return res.status(409).json({ message: 'A ministry with this name already exists' });
        }
        
        const id = uuidv4();
        
        await pool.query(
            'INSERT INTO ministries (id, name) VALUES ($1, $2)',
            [id, name]
        );
        
        res.status(201).json({
            message: 'Ministry created successfully',
            ministry: { id, name }
        });
    } catch (error) {
        console.error('Error creating ministry:', error);
        res.status(500).json({ message: 'Server error while creating ministry' });
    }
};

// Update ministry (admin only)
exports.updateMinistry = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Ministry name is required' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM ministries WHERE id = $1', [id]);
        const existingMinistry = result.rows;
        
        if (existingMinistry.length === 0) {
            return res.status(404).json({ message: 'Ministry not found' });
        }
        
        const resultName = await pool.query('SELECT * FROM ministries WHERE name = $1 AND id != $2', [name, id]);
        const ministryWithName = resultName.rows;
        
        if (ministryWithName.length > 0) {
            return res.status(409).json({ message: 'A ministry with this name already exists' });
        }
        
        await pool.query(
            'UPDATE ministries SET name = $1 WHERE id = $2',
            [name, id]
        );

        res.json({ message: 'Ministry updated successfully' });
    } catch (error) {
        console.error('Error updating ministry:', error);
        res.status(500).json({ message: 'Server error while updating ministry' });
    }
};

// Delete ministry (admin only)
exports.deleteMinistry = async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('SELECT * FROM ministries WHERE id = $1', [id]);
        const existingMinistry = result.rows;

        if (existingMinistry.length === 0) {
            return res.status(404).json({ message: 'Ministry not found' });
        }
        
        // Remove ministry association from users
        await pool.query('UPDATE users SET ministry_id = NULL WHERE ministry_id = $1', [id]);
        
        // Remove ministry association from bookings
        await pool.query('UPDATE bookings SET ministry_id = NULL WHERE ministry_id = $1', [id]);
        
        // Delete ministry
        await pool.query('DELETE FROM ministries WHERE id = $1', [id]);

        res.json({ message: 'Ministry deleted successfully' });
    } catch (error) {
        console.error('Error deleting ministry:', error);
        res.status(500).json({ message: 'Server error while deleting ministry' });
    }
};
