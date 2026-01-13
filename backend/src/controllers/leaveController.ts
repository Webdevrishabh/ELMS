/**
 * Leave Controller
 * Handles leave application, approval workflow, and history
 */

import { Context } from 'hono';
import db from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';
import { createNotification } from './notificationController';

interface Leave {
    id: number;
    user_id: number;
    leave_type: string;
    from_date: string;
    to_date: string;
    total_days: number;
    description: string | null;
    status: string;
    team_lead_approval: string;
    admin_approval: string;
    created_at: string;
}

/**
 * Calculate business days between two dates
 */
const calculateDays = (fromDate: string, toDate: string): number => {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let days = 0;
    const current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
            days++;
        }
        current.setDate(current.getDate() + 1);
    }

    return days || 1; // At least 1 day
};

/**
 * Apply for leave
 */
export const applyLeave = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const { leaveType, fromDate, toDate, description } = await c.req.json();

        // Validation
        if (!leaveType || !fromDate || !toDate) {
            return c.json({ error: 'Leave type, from date, and to date are required' }, 400);
        }

        const validTypes = ['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity'];
        if (!validTypes.includes(leaveType)) {
            return c.json({ error: 'Invalid leave type' }, 400);
        }

        // Validate dates
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (from > to) {
            return c.json({ error: 'From date cannot be after to date' }, 400);
        }

        const totalDays = calculateDays(fromDate, toDate);

        // Set approval flow based on role
        // Team Lead leaves go directly to Admin (team_lead_approval = 'na')
        const teamLeadApproval = user.role === 'team_lead' ? 'na' : 'pending';

        const result = db.query(`
            INSERT INTO leaves (user_id, leave_type, from_date, to_date, total_days, description, team_lead_approval)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(user.userId, leaveType, fromDate, toDate, totalDays, description || null, teamLeadApproval);

        const leaveId = result.lastInsertRowid as number;

        // Create notifications
        if (user.role === 'team_lead') {
            // Notify admins
            const admins = db.query("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
            for (const admin of admins) {
                await createNotification(admin.id, `New leave request from Team Lead requires your approval`, 'leave_applied', leaveId);
            }
        } else {
            // Notify team lead
            if (user.teamId) {
                const teamLeads = db.query("SELECT id FROM users WHERE role = 'team_lead' AND team_id = ?").all(user.teamId) as { id: number }[];
                for (const tl of teamLeads) {
                    await createNotification(tl.id, `New leave request from your team member`, 'leave_applied', leaveId);
                }
            }
        }

        return c.json({
            message: 'Leave applied successfully',
            leaveId,
            totalDays
        }, 201);
    } catch (error) {
        console.error('Apply leave error:', error);
        return c.json({ error: 'Failed to apply leave' }, 500);
    }
};

/**
 * Get current user's leave history
 */
export const getMyLeaves = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const status = c.req.query('status');

        let query = `
            SELECT * FROM leaves WHERE user_id = ?
        `;
        const params: any[] = [user.userId];

        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const leaves = db.query(query).all(...params);

        return c.json({ leaves });
    } catch (error) {
        console.error('Get my leaves error:', error);
        return c.json({ error: 'Failed to fetch leaves' }, 500);
    }
};

/**
 * Get team leaves (Team Lead only)
 */
export const getTeamLeaves = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const status = c.req.query('status');
        const approval = c.req.query('approval'); // 'pending' for team lead pending

        let query = `
            SELECT l.*, u.name as user_name, u.email as user_email
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE u.team_id = ? AND u.role = 'employee'
        `;
        const params: any[] = [user.teamId];

        if (status && status !== 'all') {
            query += ' AND l.status = ?';
            params.push(status);
        }

        if (approval === 'pending') {
            query += ' AND l.team_lead_approval = ?';
            params.push('pending');
        }

        query += ' ORDER BY l.created_at DESC';

        const leaves = db.query(query).all(...params);

        return c.json({ leaves });
    } catch (error) {
        console.error('Get team leaves error:', error);
        return c.json({ error: 'Failed to fetch team leaves' }, 500);
    }
};

/**
 * Get all leaves (Admin only)
 */
export const getAllLeaves = async (c: Context) => {
    try {
        const status = c.req.query('status');
        const approval = c.req.query('approval'); // 'pending' for admin pending

        let query = `
            SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role, t.name as team_name
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status && status !== 'all') {
            query += ' AND l.status = ?';
            params.push(status);
        }

        if (approval === 'pending') {
            // Admin pending: team lead approved OR team lead is N/A (TL's own leave)
            query += " AND l.admin_approval = 'pending' AND (l.team_lead_approval = 'approved' OR l.team_lead_approval = 'na')";
        }

        query += ' ORDER BY l.created_at DESC';

        const leaves = db.query(query).all(...params);

        return c.json({ leaves });
    } catch (error) {
        console.error('Get all leaves error:', error);
        return c.json({ error: 'Failed to fetch leaves' }, 500);
    }
};

/**
 * Approve leave (Team Lead or Admin)
 */
export const approveLeave = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const leaveId = parseInt(c.req.param('id'));
        const { comment } = await c.req.json();

        // Get leave
        const leave = db.query('SELECT * FROM leaves WHERE id = ?').get(leaveId) as Leave | undefined;
        if (!leave) {
            return c.json({ error: 'Leave not found' }, 404);
        }

        if (user.role === 'team_lead') {
            // Team Lead approval
            if (leave.team_lead_approval !== 'pending') {
                return c.json({ error: 'Leave already processed by team lead' }, 400);
            }

            db.query(`
                UPDATE leaves 
                SET team_lead_approval = 'approved', team_lead_comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(comment || null, leaveId);

            // Notify Admin for final approval
            const admins = db.query("SELECT id FROM users WHERE role = 'admin'").all() as { id: number }[];
            for (const admin of admins) {
                await createNotification(admin.id, `Leave request approved by Team Lead, pending your final approval`, 'leave_pending', leaveId);
            }

            // Notify employee
            await createNotification(leave.user_id, `Your leave request has been approved by Team Lead, pending Admin approval`, 'leave_pending', leaveId);

        } else if (user.role === 'admin') {
            // Admin final approval
            if (leave.admin_approval !== 'pending') {
                return c.json({ error: 'Leave already processed by admin' }, 400);
            }

            // For employee leaves, check if team lead approved
            if (leave.team_lead_approval === 'pending') {
                return c.json({ error: 'Leave needs Team Lead approval first' }, 400);
            }

            db.query(`
                UPDATE leaves 
                SET admin_approval = 'approved', status = 'approved', admin_comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(comment || null, leaveId);

            // Deduct leave balance
            const leaveUser = db.query('SELECT * FROM users WHERE id = ?').get(leave.user_id) as any;
            if (leaveUser && leave.leave_type !== 'unpaid') {
                const balanceField = leave.leave_type === 'sick' ? 'sick_leave_balance'
                    : leave.leave_type === 'casual' ? 'casual_leave_balance'
                        : 'leave_balance';
                db.query(`UPDATE users SET ${balanceField} = ${balanceField} - ? WHERE id = ?`).run(leave.total_days, leave.user_id);
            }

            // Notify employee
            await createNotification(leave.user_id, `Your leave request has been approved!`, 'leave_approved', leaveId);
        }

        return c.json({ message: 'Leave approved successfully' });
    } catch (error) {
        console.error('Approve leave error:', error);
        return c.json({ error: 'Failed to approve leave' }, 500);
    }
};

/**
 * Reject leave (Team Lead or Admin)
 */
export const rejectLeave = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const leaveId = parseInt(c.req.param('id'));
        const { comment } = await c.req.json();

        // Get leave
        const leave = db.query('SELECT * FROM leaves WHERE id = ?').get(leaveId) as Leave | undefined;
        if (!leave) {
            return c.json({ error: 'Leave not found' }, 404);
        }

        if (user.role === 'team_lead') {
            if (leave.team_lead_approval !== 'pending') {
                return c.json({ error: 'Leave already processed' }, 400);
            }

            db.query(`
                UPDATE leaves 
                SET team_lead_approval = 'rejected', status = 'rejected', team_lead_comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(comment || null, leaveId);

        } else if (user.role === 'admin') {
            db.query(`
                UPDATE leaves 
                SET admin_approval = 'rejected', status = 'rejected', admin_comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(comment || null, leaveId);
        }

        // Notify employee
        await createNotification(leave.user_id, `Your leave request has been rejected. ${comment ? 'Reason: ' + comment : ''}`, 'leave_rejected', leaveId);

        return c.json({ message: 'Leave rejected successfully' });
    } catch (error) {
        console.error('Reject leave error:', error);
        return c.json({ error: 'Failed to reject leave' }, 500);
    }
};

/**
 * Get single leave details
 */
export const getLeave = async (c: Context) => {
    try {
        const leaveId = parseInt(c.req.param('id'));
        const user = c.get('user') as JWTPayload;

        const leave = db.query(`
            SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role, t.name as team_name
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE l.id = ?
        `).get(leaveId);

        if (!leave) {
            return c.json({ error: 'Leave not found' }, 404);
        }

        // Check access: own leave, team's leave (TL), or admin
        const leaveData = leave as any;
        if (user.role === 'employee' && leaveData.user_id !== user.userId) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        return c.json({ leave });
    } catch (error) {
        console.error('Get leave error:', error);
        return c.json({ error: 'Failed to fetch leave' }, 500);
    }
};
