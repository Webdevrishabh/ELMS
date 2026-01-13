/**
 * Dashboard Controller
 * Provides role-specific dashboard data
 */

import { Context } from 'hono';
import db from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';

interface DashboardStats {
    totalLeaves: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
}

/**
 * Get dashboard data based on user role
 */
export const getDashboard = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;

        if (user.role === 'employee') {
            return getEmployeeDashboard(c, user);
        } else if (user.role === 'team_lead') {
            return getTeamLeadDashboard(c, user);
        } else if (user.role === 'admin') {
            return getAdminDashboard(c);
        }

        return c.json({ error: 'Invalid role' }, 400);
    } catch (error) {
        console.error('Dashboard error:', error);
        return c.json({ error: 'Failed to fetch dashboard' }, 500);
    }
};

/**
 * Employee Dashboard
 */
const getEmployeeDashboard = async (c: Context, user: JWTPayload) => {
    // Get leave balances
    const balances = db.query(`
        SELECT leave_balance, sick_leave_balance, casual_leave_balance
        FROM users WHERE id = ?
    `).get(user.userId) as any;

    // Get leave statistics
    const stats = db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM leaves WHERE user_id = ?
    `).get(user.userId) as any;

    // Recent leaves
    const recentLeaves = db.query(`
        SELECT * FROM leaves WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 5
    `).all(user.userId);

    return c.json({
        role: 'employee',
        balances: {
            annual: balances?.leave_balance || 0,
            sick: balances?.sick_leave_balance || 0,
            casual: balances?.casual_leave_balance || 0
        },
        stats: {
            total: stats?.total || 0,
            pending: stats?.pending || 0,
            approved: stats?.approved || 0,
            rejected: stats?.rejected || 0
        },
        recentLeaves
    });
};

/**
 * Team Lead Dashboard
 */
const getTeamLeadDashboard = async (c: Context, user: JWTPayload) => {
    // Own leave balances
    const balances = db.query(`
        SELECT leave_balance, sick_leave_balance, casual_leave_balance
        FROM users WHERE id = ?
    `).get(user.userId) as any;

    // Team pending leaves (needs TL approval)
    const pendingTeamLeaves = db.query(`
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE u.team_id = ? AND u.role = 'employee' AND l.team_lead_approval = 'pending'
        ORDER BY l.created_at DESC
    `).all(user.teamId);

    // Team stats
    const teamStats = db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE u.team_id = ? AND u.role = 'employee'
    `).get(user.teamId) as any;

    // Own leaves status
    const ownStats = db.query(`
        SELECT 
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM leaves WHERE user_id = ?
    `).get(user.userId) as any;

    return c.json({
        role: 'team_lead',
        balances: {
            annual: balances?.leave_balance || 0,
            sick: balances?.sick_leave_balance || 0,
            casual: balances?.casual_leave_balance || 0
        },
        pendingTeamLeaves,
        teamStats: {
            total: teamStats?.total || 0,
            pending: teamStats?.pending || 0,
            approved: teamStats?.approved || 0
        },
        ownStats: {
            pending: ownStats?.pending || 0,
            approved: ownStats?.approved || 0
        }
    });
};

/**
 * Admin Dashboard
 */
const getAdminDashboard = async (c: Context) => {
    // System-wide stats
    const systemStats = db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM leaves
    `).get() as any;

    // Pending for admin approval (TL approved or TL leave)
    const pendingAdminApproval = db.query(`
        SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role, t.name as team_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE l.admin_approval = 'pending' AND (l.team_lead_approval = 'approved' OR l.team_lead_approval = 'na')
        ORDER BY l.created_at DESC
    `).all();

    // User counts
    const userCounts = db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
            SUM(CASE WHEN role = 'team_lead' THEN 1 ELSE 0 END) as teamLeads
        FROM users WHERE role != 'admin'
    `).get() as any;

    // Recent leaves
    const recentLeaves = db.query(`
        SELECT l.*, u.name as user_name, u.role as user_role
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC LIMIT 10
    `).all();

    return c.json({
        role: 'admin',
        systemStats: {
            totalLeaves: systemStats?.total || 0,
            pending: systemStats?.pending || 0,
            approved: systemStats?.approved || 0,
            rejected: systemStats?.rejected || 0
        },
        pendingAdminApproval,
        userCounts: {
            total: userCounts?.total || 0,
            employees: userCounts?.employees || 0,
            teamLeads: userCounts?.teamLeads || 0
        },
        recentLeaves
    });
};
