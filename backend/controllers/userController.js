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
exports.getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        const users = result.rows;
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    
    // Only allow users to access their own info, unless they're admin
    if (id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = result.rows[0];
        
        // Get all ministries for the user
        const ministriesResult = await pool.query(
            `SELECT m.id, m.name 
             FROM ministries m 
             JOIN user_ministries um ON m.id = um.ministry_id 
             WHERE um.user_id = $1`,
            [id]
        );
        
        // Remove password before sending
        delete user.password;
        user.ministries = ministriesResult.rows;
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error while fetching user details' });
    }
};

// Get ministries for a user
exports.getUserMinistries = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Get all ministries for the user
        const ministriesResult = await pool.query(
            `SELECT m.id, m.name 
             FROM ministries m 
             JOIN user_ministries um ON m.id = um.ministry_id 
             WHERE um.user_id = $1`,
            [id]
        );
        
        res.json(ministriesResult.rows);
    } catch (error) {
        console.error('Error fetching user ministries:', error);
        res.status(500).json({ message: 'Server error while fetching user ministries' });
    }
};

// Create a new user
exports.createUser = async (req, res) => {
    const { name, email, password, role, ministry_ids } = req.body;
    
    try {
        // Check if email already exists
        const checkResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        
        // Create the user
        await pool.query(
            `INSERT INTO users (id, name, email, password, role) 
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, name, email, hashedPassword, role || 'user']
        );
        
        // Add ministries if provided (up to 3)
        if (ministry_ids && Array.isArray(ministry_ids)) {
            // Limit to 3 ministries
            const ministriesToAdd = ministry_ids.slice(0, 3);
            
            for (const ministryId of ministriesToAdd) {
                await pool.query(
                    `INSERT INTO user_ministries (id, user_id, ministry_id) 
                     VALUES ($1, $2, $3)`,
                    [uuidv4(), userId, ministryId]
                );
            }
        }
        
        // Return the created user (without password)
        const newUser = {
            id: userId,
            name,
            email,
            role: role || 'user'
        };
        
        res.status(201).json({ 
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error while creating user' });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, ministry_ids } = req.body;
    
    // Only allow users to update their own info, unless they're admin
    if (id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Build update query dynamically
        let updateQuery = 'UPDATE users SET';
        const updateValues = [];
        let valueIndex = 1;
        
        if (name) {
            updateQuery += ` name = $${valueIndex},`;
            updateValues.push(name);
            valueIndex++;
        }
        
        if (email) {
            // Check if new email already exists for another user
            if (email !== userResult.rows[0].email) {
                const emailCheck = await pool.query(
                    'SELECT * FROM users WHERE email = $1 AND id != $2',
                    [email, id]
                );
                
                if (emailCheck.rows.length > 0) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
            }
            
            updateQuery += ` email = $${valueIndex},`;
            updateValues.push(email);
            valueIndex++;
        }
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ` password = $${valueIndex},`;
            updateValues.push(hashedPassword);
            valueIndex++;
        }
        
        // Only admin can change roles
        if (role && req.user.role === 'admin') {
            updateQuery += ` role = $${valueIndex},`;
            updateValues.push(role);
            valueIndex++;
        }
        
        // Remove trailing comma
        updateQuery = updateQuery.slice(0, -1);
        
        // Add WHERE clause
        updateQuery += ` WHERE id = $${valueIndex}`;
        updateValues.push(id);
        
        // Execute update if there are values to update
        if (updateValues.length > 1) { // > 1 because we always have the ID
            await pool.query(updateQuery, updateValues);
        }
        
        // Update ministries if provided
        if (ministry_ids && Array.isArray(ministry_ids)) {
            // First delete existing associations
            await pool.query(
                'DELETE FROM user_ministries WHERE user_id = $1',
                [id]
            );
            
            // Then add new ones (up to 3)
            const ministriesToAdd = ministry_ids.slice(0, 3);
            
            for (const ministryId of ministriesToAdd) {
                await pool.query(
                    `INSERT INTO user_ministries (id, user_id, ministry_id) 
                     VALUES ($1, $2, $3)`,
                    [uuidv4(), id, ministryId]
                );
            }
        }
        
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        // First delete all ministry associations
        await pool.query('DELETE FROM user_ministries WHERE user_id = $1', [id]);
        
        // Then delete the user
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
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
        const result = await pool.query(
            'SELECT id FROM users WHERE verification_token = $1',
            [token]
        );
        const user = result.rows;
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Invalid verification token' });
        }
        
        // Update user to verified
        await pool.query(
            'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
            [user[0].id]
        );
        
        // Log the verification
        const logId = uuidv4();
        const action = `User email verified with id ${user[0].id}`;
        await pool.query(
            'INSERT INTO logs (id, timestamp, action) VALUES ($1, NOW(), $2)',
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
        const result = await pool.query(
            'SELECT id, is_verified FROM users WHERE email = $1',
            [email]
        );
        const user = result.rows;
        
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
            'UPDATE users SET verification_token = $1 WHERE id = $2',
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