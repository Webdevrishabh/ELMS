/**
 * Dashboard Controller
 * Provides role-specific dashboard data
 */

import { Context } from 'hono';
import sql from '../config/database';
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
    const balancesResult = await sql`
        SELECT leave_balance, sick_leave_balance, casual_leave_balance
        FROM users WHERE id = ${user.userId}
    `;
    const balances = balancesResult[0];

    // Get leave statistics
    const statsResult = await sql`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM leaves WHERE user_id = ${user.userId}
    `;
    const stats = statsResult[0];

    // Recent leaves
    const recentLeaves = await sql`
        SELECT * FROM leaves WHERE user_id = ${user.userId}
        ORDER BY created_at DESC LIMIT 5
    `;

    return c.json({
        role: 'employee',
        balances: {
            annual: balances?.leave_balance || 0,
            sick: balances?.sick_leave_balance || 0,
            casual: balances?.casual_leave_balance || 0
        },
        stats: {
            total: parseInt(stats?.total || 0),
            pending: parseInt(stats?.pending || 0),
            approved: parseInt(stats?.approved || 0),
            rejected: parseInt(stats?.rejected || 0)
        },
        recentLeaves
    });
};

/**
 * Team Lead Dashboard
 */
const getTeamLeadDashboard = async (c: Context, user: JWTPayload) => {
    // Own leave balances
    const balancesResult = await sql`
        SELECT leave_balance, sick_leave_balance, casual_leave_balance
        FROM users WHERE id = ${user.userId}
    `;
    const balances = balancesResult[0];

    // Team pending leaves (needs TL approval)
    const pendingTeamLeaves = await sql`
        SELECT l.*, u.name as user_name, u.email as user_email
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE u.team_id = ${user.teamId} AND u.role = 'employee' AND l.team_lead_approval = 'pending'
        ORDER BY l.created_at DESC
    `;

    // Team stats
    const teamStatsResult = await sql`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN l.status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN l.status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        WHERE u.team_id = ${user.teamId} AND u.role = 'employee'
    `;
    const teamStats = teamStatsResult[0];

    // Own leaves status
    const ownStatsResult = await sql`
        SELECT 
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
        FROM leaves WHERE user_id = ${user.userId}
    `;
    const ownStats = ownStatsResult[0];

    return c.json({
        role: 'team_lead',
        balances: {
            annual: balances?.leave_balance || 0,
            sick: balances?.sick_leave_balance || 0,
            casual: balances?.casual_leave_balance || 0
        },
        pendingTeamLeaves,
        teamStats: {
            total: parseInt(teamStats?.total || 0),
            pending: parseInt(teamStats?.pending || 0),
            approved: parseInt(teamStats?.approved || 0)
        },
        ownStats: {
            pending: parseInt(ownStats?.pending || 0),
            approved: parseInt(ownStats?.approved || 0)
        }
    });
};

/**
 * Admin Dashboard
 */
const getAdminDashboard = async (c: Context) => {
    // System-wide stats
    const systemStatsResult = await sql`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM leaves
    `;
    const systemStats = systemStatsResult[0];

    // Pending for admin approval (TL approved or TL leave)
    const pendingAdminApproval = await sql`
        SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role, t.name as team_name
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        LEFT JOIN teams t ON u.team_id = t.id
        WHERE l.admin_approval = 'pending' AND (l.team_lead_approval = 'approved' OR l.team_lead_approval = 'na')
        ORDER BY l.created_at DESC
    `;

    // User counts
    const userCountsResult = await sql`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
            SUM(CASE WHEN role = 'team_lead' THEN 1 ELSE 0 END) as teamLeads
        FROM users WHERE role != 'admin'
    `;
    const userCounts = userCountsResult[0];

    // Recent leaves
    const recentLeaves = await sql`
        SELECT l.*, u.name as user_name, u.role as user_role
        FROM leaves l
        JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC LIMIT 10
    `;

    return c.json({
        role: 'admin',
        systemStats: {
            totalLeaves: parseInt(systemStats?.total || 0),
            pending: parseInt(systemStats?.pending || 0),
            approved: parseInt(systemStats?.approved || 0),
            rejected: parseInt(systemStats?.rejected || 0)
        },
        pendingAdminApproval,
        userCounts: {
            total: parseInt(userCounts?.total || 0),
            employees: parseInt(userCounts?.employees || 0),
            teamLeads: parseInt(userCounts?.teamLeads || 0)
        },
        recentLeaves
    });
};
