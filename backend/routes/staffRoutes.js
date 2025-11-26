const express = require('express');
const router = express.Router();
const { promisePool } = require('../models/db');

/**
 * Check if staff exists by phone number
 * GET /api/staff/check/:phoneNumber
 */
router.get('/check/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        const query = 'SELECT * FROM staff WHERE phone_number = ?';
        const [rows] = await promisePool.execute(query, [phoneNumber]);

        res.json({
            success: true,
            exists: rows.length > 0,
            isStaff: rows.length > 0,
            staff: rows.length > 0 ? rows[0] : null
        });
    } catch (error) {
        console.error('Error checking staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check staff'
        });
    }
});

/**
 * Check staff status (inside or outside campus)
 * GET /api/staff/status/:phoneNumber
 */
router.get('/status/:phoneNumber', async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        // Find staff by phone number
        const staffQuery = 'SELECT * FROM staff WHERE phone_number = ?';
        const [staffRows] = await promisePool.execute(staffQuery, [phoneNumber]);

        if (staffRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this phone number'
            });
        }

        const staff = staffRows[0];

        // Get the most recent entry log for this staff
        // Check if there's an incomplete exit (has exit_time but no entry_time)
        const checkIncompleteQuery = `
            SELECT * FROM staff_entry_logs 
            WHERE staff_id = ? AND exit_time IS NOT NULL AND entry_time IS NULL
            ORDER BY exit_time DESC
            LIMIT 1
        `;
        const [incompleteRows] = await promisePool.execute(checkIncompleteQuery, [staff.id]);

        console.log('=== Staff Status Check ===');
        console.log('Staff ID:', staff.id);
        console.log('Staff Name:', staff.name);
        console.log('Incomplete exits found:', incompleteRows.length);
        if (incompleteRows.length > 0) {
            console.log('Last exit:', incompleteRows[0]);
        }

        let isInside = true; // Default: assume staff is inside campus
        
        if (incompleteRows.length > 0) {
            // Staff has an exit record without entry - they are OUTSIDE
            isInside = false;
        }

        console.log('isInside status:', isInside);

        res.json({
            success: true,
            isInside,
            staff: {
                id: staff.id,
                name: staff.name,
                phone_number: staff.phone_number,
                email: staff.email,
                department: staff.department
            }
        });
    } catch (error) {
        console.error('Error checking staff status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check staff status'
        });
    }
});

/**
 * Staff check-out (going out)
 * POST /api/staff/check-out
 */
router.post('/check-out', async (req, res) => {
    try {
        const { staffId, purpose } = req.body;

        if (!staffId || !purpose) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID and purpose are required'
            });
        }

        // Verify staff exists
        const staffQuery = 'SELECT * FROM staff WHERE staff_id = ?';
        const [staffRows] = await promisePool.execute(staffQuery, [staffId]);

        if (staffRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        const outTime = new Date();

        // Insert staff log
        const insertQuery = `
            INSERT INTO staff_logs (staff_id, purpose, out_time, log_type)
            VALUES (?, ?, ?, 'out')
        `;

        const [result] = await promisePool.execute(insertQuery, [staffId, purpose, outTime]);

        res.json({
            success: true,
            message: 'Check-out successful',
            log: {
                id: result.insertId,
                staffId,
                staffName: staffRows[0].name,
                purpose,
                outTime
            }
        });
    } catch (error) {
        console.error('Error during staff check-out:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check-out'
        });
    }
});

/**
 * Staff check-in (coming back)
 * POST /api/staff/check-in
 */
router.post('/check-in', async (req, res) => {
    try {
        const { staffId } = req.body;

        if (!staffId) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }

        // Verify staff exists
        const staffQuery = 'SELECT * FROM staff WHERE staff_id = ?';
        const [staffRows] = await promisePool.execute(staffQuery, [staffId]);

        if (staffRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found'
            });
        }

        const inTime = new Date();

        // Insert staff log
        const insertQuery = `
            INSERT INTO staff_logs (staff_id, purpose, in_time, log_type)
            VALUES (?, 'Return', ?, 'in')
        `;

        const [result] = await promisePool.execute(insertQuery, [staffId, inTime]);

        res.json({
            success: true,
            message: 'Check-in successful',
            log: {
                id: result.insertId,
                staffId,
                staffName: staffRows[0].name,
                inTime
            }
        });
    } catch (error) {
        console.error('Error during staff check-in:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check-in'
        });
    }
});

/**
 * Get all staff
 * GET /api/staff
 */
router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM staff ORDER BY name';
        const [rows] = await promisePool.execute(query);

        res.json({
            success: true,
            staff: rows
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff'
        });
    }
});

/**
 * Get staff logs
 * GET /api/staff/logs/:staffId
 */
router.get('/logs/:staffId', async (req, res) => {
    try {
        const { staffId } = req.params;

        const query = `
            SELECT sl.*, s.name, s.department
            FROM staff_logs sl
            JOIN staff s ON sl.staff_id = s.staff_id
            WHERE sl.staff_id = ?
            ORDER BY sl.created_at DESC
        `;

        const [rows] = await promisePool.execute(query, [staffId]);

        res.json({
            success: true,
            logs: rows
        });
    } catch (error) {
        console.error('Error fetching staff logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch staff logs'
        });
    }
});

/**
 * Staff going out (by phone number)
 * POST /api/staff/out
 */
router.post('/out', async (req, res) => {
    try {
        const { phoneNumber, purpose } = req.body;

        // ✅ BACKEND VALIDATION: Staff Going Out - Purpose is mandatory
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Phone number is required'
            });
        }
        if (!purpose || purpose.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Purpose is required. Please provide the reason for going out'
            });
        }
        if (purpose.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: '❌ Please provide a more detailed purpose (at least 5 characters)'
            });
        }

        // Find staff by phone number
        const staffQuery = 'SELECT * FROM staff WHERE phone_number = ?';
        const [staffRows] = await promisePool.execute(staffQuery, [phoneNumber]);

        if (staffRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this phone number'
            });
        }

        const staff = staffRows[0];
        const exitTime = new Date();

        // Create NEW row with exit_time and purpose (staff going OUT)
        // Explicitly set entry_time to NULL to prevent any default timestamp
        const insertQuery = `
            INSERT INTO staff_entry_logs (staff_id, exit_time, entry_time, purpose)
            VALUES (?, ?, NULL, ?)
        `;
        const [result] = await promisePool.execute(insertQuery, [staff.id, exitTime, purpose]);

        res.json({
            success: true,
            message: 'Exit recorded successfully',
            log: {
                id: result.insertId,
                staffId: staff.id,
                staffName: staff.name,
                purpose,
                exitTime
            }
        });
    } catch (error) {
        console.error('Error recording staff exit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record exit'
        });
    }
});

/**
 * Staff coming in (by phone number)
 * POST /api/staff/in
 */
router.post('/in', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Find staff by phone number
        const staffQuery = 'SELECT * FROM staff WHERE phone_number = ?';
        const [staffRows] = await promisePool.execute(staffQuery, [phoneNumber]);

        if (staffRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Staff not found with this phone number'
            });
        }

        const staff = staffRows[0];
        const entryTime = new Date();

        // Find the most recent exit record without entry_time (staff was out, now coming in)
        const checkQuery = `
            SELECT * FROM staff_entry_logs 
            WHERE staff_id = ? AND exit_time IS NOT NULL AND entry_time IS NULL
            ORDER BY exit_time DESC
            LIMIT 1
        `;
        const [exitRows] = await promisePool.execute(checkQuery, [staff.id]);

        if (exitRows.length > 0) {
            // Update the existing exit record with entry_time
            const updateQuery = `
                UPDATE staff_entry_logs 
                SET entry_time = ? 
                WHERE id = ?
            `;
            await promisePool.execute(updateQuery, [entryTime, exitRows[0].id]);

            res.json({
                success: true,
                message: 'Entry recorded successfully',
                log: {
                    id: exitRows[0].id,
                    staffId: staff.id,
                    staffName: staff.name,
                    purpose: exitRows[0].purpose,
                    entryTime
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No exit record found. Please record exit first.'
            });
        }
    } catch (error) {
        console.error('Error recording staff entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record entry'
        });
    }
});

module.exports = router;
