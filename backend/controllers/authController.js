const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = 'supersecret'; // TODO: move to .env later

exports.registerUser = async (req, res) => {
    const { username, name, password, role } = req.body;

    if (!username || !password || !name || !role) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Username already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        await pool.query('INSERT INTO users (id, username, name, password, role) VALUES (?, ?, ?, ?, ?)', 
            [id, username, name, hashedPassword, role]);

        res.status(201).json({ message: "User registered successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during registration." });
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (user.length === 0) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const validPassword = password === user[0].password;
        if (!validPassword) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign({
            id: user[0].id,
            username: user[0].username,
            role: user[0].role
        }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            token,
            user: {
                id: user[0].id,
                username: user[0].username,
                name: user[0].name,
                role: user[0].role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during login." });
    }
};
