const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisePool } = require('../models/db');
const { createOTP, verifyOTP } = require('../utils/otp');
const emailService = require('../utils/emailService');

/**
 * Send OTP for authentication
 * POST /api/auth/send-otp
 */
router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber, email, userType } = req.body;

        if (!phoneNumber || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and user type are required'
            });
        }

        // Generate and store OTP
        const otp = await createOTP(phoneNumber, userType);

        // Send OTP via Email (email is required)
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required for OTP verification'
            });
        }
        
        await emailService.sendOTP(email, otp, 'User');

        res.json({
            success: true,
            message: 'OTP sent to your email successfully',
            // Include OTP in development mode for testing
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
});

/**
 * Verify OTP (without creating any database records)
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp, userType } = req.body;

        if (!phoneNumber || !otp || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, OTP, and user type are required'
            });
        }

        // Verify OTP
        const isValid = await verifyOTP(phoneNumber, otp, userType);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
});

/**
 * Login for Receptionist/Security/Principal
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber, password, userType } = req.body;

        if (!phoneNumber || !password || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Phone number, password, and user type are required'
            });
        }

        // Get user details based on user type
        let tableName = `${userType}_credentials`;
        let query = `SELECT * FROM ${tableName} WHERE phone_number = ?`;
        const [rows] = await promisePool.execute(query, [phoneNumber]);

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = rows[0];

        // Verify password (plain text comparison for now)
        if (password !== user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                phoneNumber: user.phone_number,
                role: userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phone_number,
                role: userType
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
    try {
        const { phoneNumber, userType } = req.body;

        if (!phoneNumber || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and user type are required'
            });
        }

        const query = `UPDATE ${userType} SET is_logged_in = FALSE WHERE phone_number = ?`;
        await promisePool.execute(query, [phoneNumber]);

        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});

module.exports = router;
