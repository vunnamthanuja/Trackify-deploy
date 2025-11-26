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
 * Register new visitor - Step 1: Create base visitor record
 * This creates a visitor record with basic details (name, phone, email, place)
 * No visit request is created yet - that happens in check-in with purpose/whom_to_meet
 * POST /api/visitors/register
 */
router.post('/register', async (req, res) => {
    try {
        const { name, phoneNumber, email, place, otp } = req.body;

        // ✅ BACKEND VALIDATION: New Visitor - All fields mandatory
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Name is required for new visitor registration'
            });
        }
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Phone number is required'
            });
        }
        if (!email || email.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Email is required for new visitor registration'
            });
        }
        if (!place || place.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Place/Address is required for new visitor registration'
            });
        }
        if (!otp || otp.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ OTP is required for verification'
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

        // ✅ STEP 1: Create base visitor profile (NO visit request yet)
        // Check if visitor already exists
        const checkQuery = 'SELECT * FROM visitors WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1';
        const [existing] = await promisePool.execute(checkQuery, [phoneNumber]);

        let visitorId;
        if (existing.length > 0) {
            // Update existing visitor's basic info
            const updateQuery = 'UPDATE visitors SET name = ?, email = ?, place = ? WHERE phone_number = ? AND id = ?';
            await promisePool.execute(updateQuery, [name, email, place, phoneNumber, existing[0].id]);
            visitorId = existing[0].id;
        } else {
            // Insert new base visitor record (no purpose/whom_to_meet yet)
            const insertQuery = 'INSERT INTO visitors (name, phone_number, email, place, status) VALUES (?, ?, ?, ?, "draft")';
            const [result] = await promisePool.execute(insertQuery, [name, phoneNumber, email, place]);
            visitorId = result.insertId;
        }

        res.json({
            success: true,
            message: 'Registration successful! Please proceed to enter visit details.',
            visitor: {
                id: visitorId,
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
 * Create visitor visit request - Step 2: Add purpose and whom_to_meet
 * This creates a NEW visit request record linked to the visitor's base profile
 * POST /api/visitors/check-in
 */
router.post('/check-in', async (req, res) => {
    try {
        const { phoneNumber, purpose, whomToMeet } = req.body;

        // ✅ BACKEND VALIDATION: Purpose and Whom to Meet mandatory
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Phone number is required'
            });
        }
        if (!purpose || purpose.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Purpose of Visit is required. Please provide the reason for your visit'
            });
        }
        if (!whomToMeet || whomToMeet.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Whom to Meet is required. Please select the person you want to meet'
            });
        }

        // Get visitor's base profile
        const visitorQuery = 'SELECT * FROM visitors WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1';
        const [visitorRows] = await promisePool.execute(visitorQuery, [phoneNumber]);

        if (visitorRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found. Please register first.'
            });
        }

        const visitor = visitorRows[0];

        // Determine if this is a returning visitor (has previous visits with status other than draft)
        const previousVisitsQuery = 'SELECT COUNT(*) as visit_count FROM visitors WHERE phone_number = ? AND status != "draft"';
        const [countResult] = await promisePool.execute(previousVisitsQuery, [phoneNumber]);
        const isReturning = countResult[0].visit_count > 0;

        // ✅ STEP 2: Create ONE complete visit request
        const insertQuery = `
            INSERT INTO visitors (name, phone_number, email, place, purpose, whom_to_meet, status, is_returning)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `;
        
        const [result] = await promisePool.execute(insertQuery, [
            visitor.name,
            phoneNumber,
            visitor.email,
            visitor.place,
            purpose,
            whomToMeet,
            isReturning
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
