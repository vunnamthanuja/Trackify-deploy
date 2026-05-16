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

        // ✅ STEP 1: Only verify OTP (NO database insert yet)
        // Registration data will be stored in frontend temporarily
        // ONE complete record will be created in Step 2 with purpose/whom_to_meet

        res.json({
            success: true,
            message: 'Registration verified! Please proceed to enter visit details.',
            visitor: {
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
 * Create visitor visit request - Step 2: Create ONE complete visitor record
 * Accepts registration data for new visitors or looks up existing visitors
 * POST /api/visitors/check-in
 */
router.post('/check-in', async (req, res) => {
    try {
        const { phoneNumber, purpose, whomToMeet, name, email, place, isNewVisitor } = req.body;

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

        let visitorName, visitorEmail, visitorPlace, isReturning;

        if (isNewVisitor) {
            // NEW VISITOR: Use registration data from frontend
            if (!name || !email || !place) {
                return res.status(400).json({
                    success: false,
                    message: '❌ Registration data is incomplete. Please start over.'
                });
            }
            visitorName = name;
            visitorEmail = email;
            visitorPlace = place;
            isReturning = false;
        } else {
            // RETURNING VISITOR: Get existing visitor data from most recent visit
            const visitorQuery = 'SELECT * FROM visitors WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1';
            const [visitorRows] = await promisePool.execute(visitorQuery, [phoneNumber]);

            if (visitorRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Visitor not found. Please register first.'
                });
            }

            const visitor = visitorRows[0];
            visitorName = visitor.name;
            visitorEmail = visitor.email;
            visitorPlace = visitor.place;
            isReturning = true;
        }

        // ✅ STEP 2: Create ONE complete visit request (ONLY database insert happens here)
        const insertQuery = `
            INSERT INTO visitors (name, phone_number, email, place, purpose, whom_to_meet, status, is_returning)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            RETURNING id
        `;

        const [rows] = await promisePool.execute(insertQuery, [
            visitorName,
            phoneNumber,
            visitorEmail,
            visitorPlace,
            purpose,
            whomToMeet,
            isReturning
        ]);

        const insertedId = (rows && rows[0] && rows[0].id) || null;

        res.json({
            success: true,
            message: 'Visit request submitted. Waiting for receptionist approval.',
            visit: {
                id: insertedId,
                visitorName: visitorName,
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
