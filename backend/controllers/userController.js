const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, name, email, role, is_verified FROM users');
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
        const [user] = await pool.query('SELECT id, username, name, email, role, is_verified FROM users WHERE id = ?', [id]);
        
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
    const { username, name, email, password, role } = req.body;
    
    if (!username || !name || !email || !password) {
        return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
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
        
        // Check if email already exists
        const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        
        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'user'; // Default to 'user' if no role is provided
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const is_verified = userRole === 'admin' ? true : false; // Admin users are auto-verified
        
        await pool.query(
            'INSERT INTO users (id, username, name, email, password, role, verification_token, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, username, name, email, hashedPassword, userRole, verificationToken, is_verified]
        );
        
        // Send verification email if not admin
        if (userRole !== 'admin') {
            await sendVerificationEmail(email, verificationToken);
        }
        
        // Log the action
        const logId = uuidv4();
        const action = `Admin ${req.user.username} created new user ${username} with role ${userRole}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.status(201).json({
            message: 'User created successfully' + (userRole !== 'admin' ? '. Verification email sent.' : ''),
            user: {
                id,
                username,
                name,
                email,
                role: userRole,
                is_verified
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
    const { username, name, email, password, role } = req.body;
    
    if (!username || !name) {
        return res.status(400).json({ message: 'Username and name are required' });
    }
    
    if (email) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
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
        
        // Check if email already exists for another user
        if (email && email !== existingUser[0].email) {
            const [emailExists] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (emailExists.length > 0) {
                return res.status(409).json({ message: 'Email already exists' });
            }
        }
        
        // Update user info
        let query = 'UPDATE users SET username = ?, name = ?';
        let params = [username, name];
        
        // Add email if provided and different
        if (email && email !== existingUser[0].email) {
            query += ', email = ?, is_verified = false, verification_token = ?';
            const newVerificationToken = crypto.randomBytes(32).toString('hex');
            params.push(email, newVerificationToken);
            
            // Send new verification email
            await sendVerificationEmail(email, newVerificationToken);
        }
        
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
        
        res.json({ 
            message: 'User updated successfully' + 
                    (email && email !== existingUser[0].email ? '. New verification email sent.' : '')
        });
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

// Send verification email
async function sendVerificationEmail(email, token) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'BSC Booking - Verify Your Email',
        html: `
            <h1>Email Verification</h1>
            <p>Thank you for registering with BSC Booking. Please click the link below to verify your email address:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't register for an account, please ignore this email.</p>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
}

// Verify email
exports.verifyEmail = async (req, res) => {
    const { token } = req.params;
    
    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }
    
    try {
        // Find user with this verification token
        const [user] = await pool.query(
            'SELECT id FROM users WHERE verification_token = ?',
            [token]
        );
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Invalid verification token' });
        }
        
        // Update user to verified
        await pool.query(
            'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = ?',
            [user[0].id]
        );
        
        // Log the verification
        const logId = uuidv4();
        const action = `User email verified with id ${user[0].id}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES (?, NOW(), ?)',
            [logId, action]
        );
        
        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Server error while verifying email' });
    }
}

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    try {
        // Check if user exists and is not verified
        const [user] = await pool.query(
            'SELECT id, is_verified FROM users WHERE email = ?',
            [email]
        );
        
        if (user.length === 0) {
            // Don't reveal that the email doesn't exist for security
            return res.json({ message: 'If your email exists in our system, a verification link will be sent' });
        }
        
        if (user[0].is_verified) {
            return res.status(400).json({ message: 'This email is already verified' });
        }
        
        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        // Update user with new token
        await pool.query(
            'UPDATE users SET verification_token = ? WHERE id = ?',
            [verificationToken, user[0].id]
        );
        
        // Send verification email
        await sendVerificationEmail(email, verificationToken);
        
        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ message: 'Server error while resending verification email' });
    }
};