const express = require('express');
const router = express.Router();
const { promisePool } = require('../models/db');
const { createOTP, verifyOTP } = require('../utils/otp');
const emailService = require('../utils/emailService');

/**
 * Check if visitor exists by phone number
 * GET /api/visitors/check/:phoneNumber
 */
router.get('/check/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Get the most recent visitor record
        const query = 'SELECT * FROM visitors WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1';
        const [rows] = await promisePool.execute(query, [phoneNumber]);

        let hasActiveVisit = false;
        if (rows.length > 0) {
            // Check if visitor has an active visit (checked in but not checked out)
            const visitor = rows[0];
            hasActiveVisit = visitor.status === 'accepted' && visitor.check_out_time === null;
        }

        res.json({
            success: true,
            exists: rows.length > 0,
            hasActiveVisit: hasActiveVisit,
            visitor: rows.length > 0 ? rows[0] : null
        });
    } catch (error) {
        console.error('Error checking visitor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check visitor'
        });
    }
});

/**
 * Register new visitor
 * POST /api/visitors/register
 */
router.post('/register', async (req, res) => {
    try {
        const { name, phoneNumber, email, place, otp } = req.body;

        if (!name || !phoneNumber || !email || !place || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Verify OTP
        const isValidOTP = await verifyOTP(phoneNumber, otp, 'visitor');
        
        if (!isValidOTP) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Check if visitor already exists
        const checkQuery = 'SELECT * FROM visitors WHERE phone_number = ?';
        const [existing] = await promisePool.execute(checkQuery, [phoneNumber]);

        if (existing.length > 0) {
            // Update email if not set
            if (!existing[0].email && email) {
                await promisePool.execute('UPDATE visitors SET email = ? WHERE id = ?', [email, existing[0].id]);
                existing[0].email = email;
            }
            return res.json({
                success: true,
                message: 'Visitor already registered',
                visitor: existing[0]
            });
        }

        // Insert new visitor with email
        const insertQuery = 'INSERT INTO visitors (name, phone_number, email, place) VALUES (?, ?, ?, ?)';
        const [result] = await promisePool.execute(insertQuery, [name, phoneNumber, email, place]);

        res.json({
            success: true,
            message: 'Visitor registered successfully',
            visitor: {
                id: result.insertId,
                name,
                phoneNumber,
                email,
                place
            }
        });
    } catch (error) {
        console.error('Error registering visitor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register visitor'
        });
    }
});

/**
 * Create visitor visit entry
 * POST /api/visitors/check-in
 */
router.post('/check-in', async (req, res) => {
    try {
        const { phoneNumber, purpose, whomToMeet } = req.body;

        if (!phoneNumber || !purpose || !whomToMeet) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Get visitor ID
        const visitorQuery = 'SELECT * FROM visitors WHERE phone_number = ?';
        const [visitorRows] = await promisePool.execute(visitorQuery, [phoneNumber]);

        if (visitorRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found. Please register first.'
            });
        }

        const visitor = visitorRows[0];

        // Allow multiple simultaneous visit requests - no restriction on active visits
        // Visitors can submit multiple requests to meet different staff members or revisit

        // Create NEW visitor record for this visit (NO check_in_time yet - only on approval)
        const insertQuery = `
            INSERT INTO visitors (name, phone_number, email, place, purpose, whom_to_meet, status, is_returning)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', true)
        `;
        
        const [result] = await promisePool.execute(insertQuery, [
            visitor.name,
            phoneNumber,
            visitor.email,
            visitor.place,
            purpose,
            whomToMeet
        ]);

        res.json({
            success: true,
            message: 'Visit request submitted. Waiting for receptionist approval.',
            visit: {
                id: result.insertId,
                visitorName: visitor.name,
                purpose,
                whomToMeet,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Error creating visit entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create visit entry'
        });
    }
});

/**
 * Visitor check-out
 * POST /api/visitors/check-out
 */
router.post('/check-out', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const outTime = new Date();

        // Find the most recent visit
        const findQuery = `
            SELECT id FROM visitors
            WHERE phone_number = ? AND check_out_time IS NULL AND status = 'accepted'
            ORDER BY check_in_time DESC
            LIMIT 1
        `;
        
        const [visits] = await promisePool.execute(findQuery, [phoneNumber]);
        
        if (visits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active visit found for check-out'
            });
        }

        // Update the visit
        const updateQuery = `
            UPDATE visitors
            SET check_out_time = ?
            WHERE id = ?
        `;

        const [result] = await promisePool.execute(updateQuery, [outTime, visits[0].id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No active visit found for check-out'
            });
        }

        res.json({
            success: true,
            message: 'Check-out successful',
            outTime
        });
    } catch (error) {
        console.error('Error during check-out:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check-out'
        });
    }
});

/**
 * Get all visitors
 * GET /api/visitors
 */
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM visitors ORDER BY created_at DESC';
        const [rows] = await promisePool.execute(query);

        res.json({
            success: true,
            visitors: rows
        });
    } catch (error) {
        console.error('Error fetching visitors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visitors'
        });
    }
});

module.exports = router;
