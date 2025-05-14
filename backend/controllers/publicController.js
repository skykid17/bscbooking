const pool = require('../config/db');

// Get all ministries for public access
exports.getAllMinistries = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM ministries ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ministries:', error);
        res.status(500).json({ message: 'Server error while fetching ministries' });
    }
};
