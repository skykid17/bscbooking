const pool = require('../config/db');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { v4: uuidv4 } = require('uuid');
    const crypto = require('crypto');
    const nodemailer = require('nodemailer');

    const JWT_SECRET = process.env.JWT_SECRET;

    // Check if email is properly configured
    const isEmailConfigured = () => {
        return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    };

    // Email configuration
    let transporter;
    try {
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        // Always log email configuration status
        console.log('Email configuration status:', isEmailConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED');
        
        if (isEmailConfigured()) {
            // Verify connection configuration
            transporter.verify(function(error, success) {
                if (error) {
                    console.error('Email transporter error:', error);
                } else {
                    console.log("Email server is ready to send messages");
                }
            });
        } else {
            console.warn('WARNING: Email not configured - verification emails will be attempted but may fail');
            console.warn('Set EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD in your .env file');
        }
    } catch (error) {
        console.error('Failed to initialize email transporter:', error);
    }

    exports.registerUser = async (req, res) => {
        const { name, email, password, ministry_id } = req.body;

        if (!password || !name || !email) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        try {
            // Check email uniqueness
            const resultEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            const existingEmail = resultEmail.rows;
            if (existingEmail.length > 0) {
                return res.status(400).json({ message: "Email already exists." });
            }
            
            // Check if ministry exists if provided
            if (ministry_id) {
                const resultMinistry = await pool.query('SELECT * FROM ministries WHERE id = $1', [ministry_id]);
                if (resultMinistry.rows.length === 0) {
                    return res.status(400).json({ message: "Ministry not found." });
                }
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const id = uuidv4();
            const verificationToken = crypto.randomBytes(32).toString('hex');
            
            await pool.query(
                'INSERT INTO users (id, name, password, ministry_id, email, role, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', 
                [id, name, hashedPassword, ministry_id || null, email, 'user', false, verificationToken]
            );
            
            let responseMessage;
            
            // Try to send verification email
            const emailSent = await sendVerificationEmail(email, verificationToken);
            responseMessage = emailSent 
                ? "User registered successfully. Please check your email to verify your account." 
                : "User registered successfully, but we couldn't send a verification email. Please contact support.";
            
            res.status(201).json({ message: responseMessage });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error during registration." });
        }
    };

    exports.loginUser = async (req, res) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        try {
            const resultUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = resultUser.rows;
            if (user.length === 0) {
                return res.status(400).json({ message: "Invalid credentials." });
            }

            const validPassword = await bcrypt.compare(password, user[0].password);
            if (!validPassword) {
                return res.status(400).json({ message: "Invalid credentials." });
            }
            
            // Check if email is verified
            if (!user[0].is_verified && isEmailConfigured()) {
                return res.status(401).json({ 
                    message: "Please verify your email before logging in.",
                    needsVerification: true,
                    email: user[0].email
                });
            }

            // Get ministry name if user has a ministry
            let ministryName = null;
            if (user[0].ministry_id) {
                const ministryResult = await pool.query('SELECT name FROM ministries WHERE id = $1', [user[0].ministry_id]);
                if (ministryResult.rows.length > 0) {
                    ministryName = ministryResult.rows[0].name;
                }
            }

            const token = jwt.sign({
                id: user[0].id,
                email: user[0].email,
                role: user[0].role
            }, JWT_SECRET, { expiresIn: '8h' });

            res.json({
                token,
                user: {
                    id: user[0].id,
                    name: user[0].name,
                    email: user[0].email,
                    role: user[0].role,
                    is_verified: user[0].is_verified,
                    ministry_id: user[0].ministry_id,
                    ministry_name: ministryName
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error during login." });
        }
    };

    // Send verification email
    async function sendVerificationEmail(email, token) {
        if (!isEmailConfigured() || !transporter) {
            console.warn('Email sending skipped: EMAIL_USER and/or EMAIL_PASSWORD not configured');
            return false;
        }

        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;
        
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
        
        console.log('[VERIFY EMAIL] Received request with token:', token);

        if (!token) {
            console.log('[VERIFY EMAIL] No token provided');
            return res.status(400).json({ message: 'Verification token is required', success: false });
        }
        
        try {
            // Find user with this verification token
            const result = await pool.query(
                'SELECT id FROM users WHERE verification_token = $1',
                [token]
            );
            const user = result.rows;
            console.log('[VERIFY EMAIL] User lookup result:', user);

            if (!user || user.length === 0) {
                console.log('[VERIFY EMAIL] Invalid or expired token');
                return res.status(404).json({ message: 'Invalid or expired verification token', success: false });
            }
            
            // Update user to verified
            const updateResult = await pool.query(
                'UPDATE users SET is_verified = true WHERE id = $1',
                [user[0].id]
            );
            console.log('[VERIFY EMAIL] Update result:', updateResult);

            if (updateResult.rowCount === 0) {
                console.log('[VERIFY EMAIL] Update failed, no rows affected');
                return res.status(500).json({ message: 'Failed to update verification status', success: false });
            }
            
            console.log('[VERIFY EMAIL] Email verified successfully for user id:', user[0].id);
            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('[VERIFY EMAIL] Error verifying email:', error);
            res.status(500).json({ message: 'Server error while verifying email', success: false });
        }
    };

    // Resend verification email
    exports.resendVerificationEmail = async (req, res) => {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        try {
            // Check if user exists and is not verified
            const resultUser = await pool.query(
                'SELECT id, is_verified FROM users WHERE email = $1',
                [email]
            );
            const user = resultUser.rows;
            
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
            const emailSent = await sendVerificationEmail(email, verificationToken);
            const responseMessage = emailSent 
                ? 'Verification email sent' 
                : 'Verification email could not be sent. Please contact support.';
            
            res.json({ message: responseMessage });
        } catch (error) {
            console.error('Error resending verification email:', error);
            res.status(500).json({ message: 'Server error while resending verification email' });
        }
    };
