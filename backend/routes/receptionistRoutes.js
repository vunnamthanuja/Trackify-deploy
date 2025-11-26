const express = require('express');
const router = express.Router();
const { promisePool } = require('../models/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const emailService = require('../utils/emailService');

/**
 * Get all pending visitor visits
 * GET /api/receptionist/pending-visits
 */
router.get('/pending-visits', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, name, phone_number, email, purpose, whom_to_meet,
                check_in_time as in_time,
                check_out_time as out_time,
                status, approved_by, created_at, place
            FROM visitors
            WHERE status = 'pending'
            ORDER BY created_at DESC
        `;

        const [rows] = await promisePool.execute(query);

        res.json({
            success: true,
            visits: rows
        });
    } catch (error) {
        console.error('Error fetching pending visits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending visits'
        });
    }
});

/**
 * Approve or reject visitor visit
 * POST /api/receptionist/process-visit
 */
router.post('/process-visit', async (req, res) => {
    try {
        const { visitId, action, receptionistId } = req.body;

        if (!visitId || !action || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Valid visit ID and action (accept/reject) are required'
            });
        }

        // Get visit details with visitor email
        const visitQuery = `
            SELECT *
            FROM visitors
            WHERE id = ?
        `;

        const [visitRows] = await promisePool.execute(visitQuery, [visitId]);

        if (visitRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        const visit = visitRows[0];
        const status = action === 'accept' ? 'accepted' : 'rejected';
        const now = new Date();

        // Update visit status and set check_in_time ONLY on acceptance
        const updateQuery = status === 'accepted' 
            ? `UPDATE visitors SET status = ?, approved_at = ?, check_in_time = ? WHERE id = ?`
            : `UPDATE visitors SET status = ?, approved_at = ? WHERE id = ?`;

        const params = status === 'accepted' 
            ? [status, now, now, visitId]
            : [status, now, visitId];

        await promisePool.execute(updateQuery, params);

        // Use default receptionist name
        const receptionistName = 'Receptionist';

        // Send email notification to visitor
        if (visit.email) {
            if (status === 'accepted') {
                await emailService.sendVisitorApprovalEmail(
                    visit.email,
                    visit.name,
                    visit.purpose,
                    receptionistName
                );
            } else {
                await emailService.sendVisitorRejectionEmail(
                    visit.email,
                    visit.name,
                    visit.purpose,
                    receptionistName,
                    'Security reasons'
                );
            }
        }

        // If accepted and visitor wants to meet staff, send notification to staff
        if (status === 'accepted' && visit.whom_to_meet) {
            // Try to find staff email/phone if whom_to_meet is a staff member
            const staffQuery = 'SELECT name, phone_number, email FROM staff WHERE name ILIKE ?';
            const [staffRows] = await promisePool.execute(staffQuery, [
                `%${visit.whom_to_meet}%`
            ]);

            if (staffRows.length > 0) {
                const staff = staffRows[0];
                if (staff.email) {
                    console.log('📧 Sending staff notification');
                    console.log('   Approval timestamp (UTC):', now);
                    console.log('   Approval timestamp (IST):', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
                    console.log('   Staff email:', staff.email);
                    console.log('   Visitor name:', visit.name);
                    await emailService.sendStaffNotification(
                        staff.email,
                        staff.name,
                        visit.name,
                        visit.purpose,
                        now  // Pass the actual acceptance timestamp
                    );
                    console.log('✅ Staff notification sent successfully');
                }
            }
        }

        res.json({
            success: true,
            message: `Visit ${status} successfully`,
            visit: {
                id: visitId,
                status,
                visitorName: visit.name
            }
        });
    } catch (error) {
        console.error('Error processing visit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process visit'
        });
    }
});

/**
 * Get today's accepted visitor visits (for dashboard)
 * GET /api/receptionist/today-visits
 */
router.get('/today-visits', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, name, phone_number, email, purpose, whom_to_meet,
                check_in_time as in_time,
                check_out_time as out_time,
                status, approved_by, created_at, place
            FROM visitors
            WHERE status = 'accepted' AND DATE(check_in_time) = CURRENT_DATE
            ORDER BY check_in_time DESC
        `;

        const [rows] = await promisePool.execute(query);

        res.json({
            success: true,
            visits: rows
        });
    } catch (error) {
        console.error('Error fetching today\'s visits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s visits'
        });
    }
});

/**
 * Get all visitor visits (for dashboard)
 * GET /api/receptionist/all-visits
 */
router.get('/all-visits', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, name, phone_number, email, purpose, whom_to_meet,
                check_in_time as in_time,
                check_out_time as out_time,
                status, approved_by, created_at, place
            FROM visitors
            ORDER BY created_at DESC
            LIMIT 100
        `;

        const [rows] = await promisePool.execute(query);

        res.json({
            success: true,
            visits: rows
        });
    } catch (error) {
        console.error('Error fetching all visits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch visits'
        });
    }
});

/**
 * Get today's statistics
 * GET /api/receptionist/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_visits,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM visitors
            WHERE DATE(created_at) = CURRENT_DATE
        `;

        const [statsRows] = await promisePool.execute(statsQuery);

        res.json({
            success: true,
            stats: statsRows[0]
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
