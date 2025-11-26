const express = require('express');
const router = express.Router();
const { promisePool } = require('../models/db');
const { verifyToken, checkRole } = require('../middleware/auth');

/**
 * Get daily report (visitor and staff details)
 * GET /api/principal/daily-report
 */
router.get('/daily-report', async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date || new Date().toISOString().split('T')[0];

        // Get visitor visits for the day (including all statuses)
        const visitorQuery = `
            SELECT 
                id, name, phone_number, email, purpose, whom_to_meet,
                CASE 
                    WHEN status = 'pending' THEN created_at
                    WHEN status = 'accepted' THEN check_in_time
                    WHEN status = 'rejected' THEN approved_at
                    ELSE check_in_time
                END as in_time,
                check_out_time as out_time,
                status, created_at, place
            FROM visitors
            WHERE DATE(created_at) = ?
            ORDER BY created_at ASC
        `;

        const [visitorRows] = await promisePool.execute(visitorQuery, [reportDate]);

        // Get staff logs for the day
        const staffQuery = `
            SELECT 
                CASE 
                    WHEN sel.entry_time IS NOT NULL AND sel.exit_time IS NOT NULL THEN 'complete'
                    WHEN sel.entry_time IS NULL AND sel.exit_time IS NOT NULL THEN 'exit'
                    ELSE 'pending'
                END as log_type,
                sel.id,
                sel.staff_id,
                s.name,
                s.phone_number,
                s.department,
                sel.purpose,
                sel.entry_time as in_time,
                sel.exit_time as out_time,
                sel.exit_time as created_at
            FROM staff_entry_logs sel
            JOIN staff s ON sel.staff_id = s.id
            WHERE sel.exit_time IS NOT NULL AND DATE(sel.exit_time) = ?
            ORDER BY created_at ASC
        `;

        const [staffRows] = await promisePool.execute(staffQuery, [reportDate]);

        // Number the records
        const numberedVisitors = visitorRows.map((visitor, index) => ({
            number: index + 1,
            ...visitor
        }));

        const numberedStaffLogs = staffRows.map((log, index) => ({
            number: index + 1,
            ...log
        }));

        res.json({
            success: true,
            report: {
                date: reportDate,
                visitors: {
                    count: numberedVisitors.length,
                    data: numberedVisitors
                },
                staffLogs: {
                    count: numberedStaffLogs.length,
                    data: numberedStaffLogs
                }
            }
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate daily report'
        });
    }
});

/**
 * Get report for date range
 * GET /api/principal/report-range
 */
router.get('/report-range', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;

        if (!fromDate || !toDate) {
            return res.status(400).json({
                success: false,
                message: 'From date and to date are required'
            });
        }

        // Get visitor visits for the date range (including all statuses)
        const visitorQuery = `
            SELECT 
                id, name, phone_number, email, purpose, whom_to_meet,
                CASE 
                    WHEN status = 'pending' THEN created_at
                    WHEN status = 'accepted' THEN check_in_time
                    WHEN status = 'rejected' THEN approved_at
                    ELSE check_in_time
                END as in_time,
                check_out_time as out_time,
                status, created_at, place
            FROM visitors
            WHERE DATE(created_at) BETWEEN ? AND ?
            ORDER BY created_at ASC
        `;

        const [visitorRows] = await promisePool.execute(visitorQuery, [fromDate, toDate]);

        // Get staff logs for the date range
        const staffQuery = `
            SELECT 
                CASE 
                    WHEN sel.exit_time IS NOT NULL THEN 'complete'
                    WHEN sel.exit_time IS NULL THEN 'exit'
                    ELSE 'entry'
                END as log_type,
                sel.id,
                sel.staff_id,
                s.name,
                s.phone_number,
                s.department,
                sel.purpose,
                sel.entry_time as in_time,
                sel.exit_time as out_time,
                COALESCE(sel.exit_time, sel.entry_time) as created_at
            FROM staff_entry_logs sel
            JOIN staff s ON sel.staff_id = s.id
            WHERE (sel.exit_time IS NOT NULL AND DATE(sel.exit_time) BETWEEN ? AND ?) 
               OR DATE(sel.entry_time) BETWEEN ? AND ?
            ORDER BY created_at ASC
        `;

        const [staffRows] = await promisePool.execute(staffQuery, [fromDate, toDate, fromDate, toDate]);

        // Number the records
        const numberedVisitors = visitorRows.map((visitor, index) => ({
            number: index + 1,
            ...visitor
        }));

        const numberedStaffLogs = staffRows.map((log, index) => ({
            number: index + 1,
            ...log
        }));

        res.json({
            success: true,
            report: {
                fromDate,
                toDate,
                visitors: {
                    count: numberedVisitors.length,
                    data: numberedVisitors
                },
                staffLogs: {
                    count: numberedStaffLogs.length,
                    data: numberedStaffLogs
                }
            }
        });
    } catch (error) {
        console.error('Error generating range report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report'
        });
    }
});

/**
 * Get dashboard statistics
 * GET /api/principal/stats
 */
router.get('/stats', async (req, res) => {
    try {
        // Today's statistics
        const todayStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM visitors WHERE DATE(check_in_time) = CURRENT_DATE) as today_visitors,
                (SELECT COUNT(*) FROM staff_entry_logs WHERE (exit_time IS NOT NULL AND DATE(exit_time) = CURRENT_DATE) OR DATE(entry_time) = CURRENT_DATE) as today_staff_logs,
                (SELECT COUNT(*) FROM visitors WHERE status = 'pending') as pending_approvals,
                (SELECT COUNT(*) FROM visitors WHERE status = 'accepted' AND check_out_time IS NULL AND DATE(check_in_time) = CURRENT_DATE) as active_visitors
        `;

        const [todayStats] = await promisePool.execute(todayStatsQuery);

        // Monthly statistics
        const monthlyStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM visitors WHERE EXTRACT(MONTH FROM check_in_time) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM check_in_time) = EXTRACT(YEAR FROM CURRENT_DATE)) as month_visitors,
                (SELECT COUNT(*) FROM staff_entry_logs WHERE (exit_time IS NOT NULL AND EXTRACT(MONTH FROM exit_time) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM exit_time) = EXTRACT(YEAR FROM CURRENT_DATE)) OR (EXTRACT(MONTH FROM entry_time) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM entry_time) = EXTRACT(YEAR FROM CURRENT_DATE))) as month_staff_logs
        `;

        const [monthlyStats] = await promisePool.execute(monthlyStatsQuery);

        res.json({
            success: true,
            stats: {
                today: todayStats[0],
                monthly: monthlyStats[0]
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

/**
 * Get summary for SMS notification (called at 6 PM daily)
 * GET /api/principal/daily-summary
 */
router.get('/daily-summary', async (req, res) => {
    try {
        const visitorCountQuery = `
            SELECT COUNT(*) as count
            FROM visitors
            WHERE DATE(check_in_time) = CURRENT_DATE
        `;

        const staffLogCountQuery = `
            SELECT COUNT(*) as count
            FROM staff_entry_logs 
            WHERE (exit_time IS NOT NULL AND DATE(exit_time) = CURRENT_DATE) 
               OR DATE(entry_time) = CURRENT_DATE
        `;

        const [visitorCount] = await promisePool.execute(visitorCountQuery);
        const [staffLogCount] = await promisePool.execute(staffLogCountQuery);

        res.json({
            success: true,
            summary: {
                visitorCount: visitorCount[0].count,
                staffLogCount: staffLogCount[0].count,
                date: new Date().toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('Error fetching daily summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch daily summary'
        });
    }
});

module.exports = router;
