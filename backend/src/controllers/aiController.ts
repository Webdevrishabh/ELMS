/**
 * AI Controller
 * Handles AI-powered features endpoints
 */

import { Context } from 'hono';
import sql from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';
import { chatAssistant, autoFillLeave, getLeaveRecommendation, detectConflicts } from '../services/aiService';

/**
 * Smart Leave Assistant Chat
 */
export const chat = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const { message } = await c.req.json();

        if (!message) {
            return c.json({ error: 'Message is required' }, 400);
        }

        // Get user context
        const balancesResult = await sql`
            SELECT leave_balance, sick_leave_balance, casual_leave_balance
            FROM users WHERE id = ${user.userId}
        `;
        const balances = balancesResult[0];

        const statsResult = await sql`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
            FROM leaves WHERE user_id = ${user.userId}
        `;
        const stats = statsResult[0];

        const context = {
            balances: {
                annual: balances?.leave_balance || 0,
                sick: balances?.sick_leave_balance || 0,
                casual: balances?.casual_leave_balance || 0
            },
            stats: {
                total: parseInt(stats?.total || 0),
                pending: parseInt(stats?.pending || 0),
                approved: parseInt(stats?.approved || 0)
            }
        };

        const result = await chatAssistant(user.userId, message, context);

        return c.json(result);
    } catch (error) {
        console.error('AI Chat error:', error);
        return c.json({ error: 'Failed to process chat' }, 500);
    }
};

/**
 * Auto-fill leave form from natural language
 */
export const autofill = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const { input } = await c.req.json();

        if (!input) {
            return c.json({ error: 'Input is required' }, 400);
        }

        const result = await autoFillLeave(user.userId, input);

        return c.json(result);
    } catch (error) {
        console.error('AI Autofill error:', error);
        return c.json({ error: 'Failed to parse leave request' }, 500);
    }
};

/**
 * Get AI recommendation for leave approval
 */
export const recommend = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const leaveId = c.req.param('leaveId');

        console.log(`[AI] Generating recommendation for Leave ID: ${leaveId}`);

        // Get leave details
        const leaves = await sql`
            SELECT l.*, u.team_id, u.leave_balance
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE l.id = ${leaveId}
        `;
        const leave = leaves[0];

        if (!leave) {
            console.warn(`[AI] Leave not found: ${leaveId}`);
            return c.json({ error: 'Leave not found' }, 404);
        }

        // Get team context
        let overlappingCount = 0;
        let teamSizeCount = 0;

        if (leave.team_id) {
            const overlappingResult = await sql`
                SELECT COUNT(*) as count
                FROM leaves l
                JOIN users u ON l.user_id = u.id
                WHERE u.team_id = ${leave.team_id} 
                AND l.status = 'approved'
                AND l.from_date <= ${leave.to_date} AND l.to_date >= ${leave.from_date}
            `;
            overlappingCount = parseInt(overlappingResult[0]?.count || 0);

            const teamSizeResult = await sql`
                SELECT COUNT(*) as count FROM users WHERE team_id = ${leave.team_id}
            `;
            teamSizeCount = parseInt(teamSizeResult[0]?.count || 0);
        }

        const teamContext = {
            overlapping: overlappingCount,
            teamSize: teamSizeCount,
            balance: leave.leave_balance
        };

        console.log(`[AI] Context prepared, calling AI service...`);
        const result = await getLeaveRecommendation(user.userId, leave, teamContext);
        console.log(`[AI] Result:`, result);

        return c.json(result);
    } catch (error: any) {
        console.error('AI Recommend error:', error);
        // Return a safe fallback response instead of 500
        return c.json({
            success: false,
            recommendation: {
                suggestion: 'review',
                riskLevel: 'unknown',
                reason: 'System error during AI analysis. ' + (error.message || ''),
                considerations: []
            }
        });
    }
};

/**
 * Detect conflicts for a leave request
 */
export const conflicts = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const { fromDate, toDate, leaveType } = await c.req.json();

        if (!fromDate || !toDate) {
            return c.json({ error: 'Dates are required' }, 400);
        }

        // Get user's team
        const userDataResult = await sql`SELECT team_id FROM users WHERE id = ${user.userId}`;
        const userData = userDataResult[0];

        // Get overlapping leaves from team
        const existingLeaves = await sql`
            SELECT l.from_date, l.to_date, l.leave_type, l.status
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE u.team_id = ${userData?.team_id} 
            AND l.status IN ('approved', 'pending')
            AND l.from_date <= ${toDate} AND l.to_date >= ${fromDate}
            AND l.user_id != ${user.userId}
        `;

        const leaveData = { from_date: fromDate, to_date: toDate, leave_type: leaveType };

        const result = await detectConflicts(user.userId, leaveData, existingLeaves);

        return c.json(result);
    } catch (error) {
        console.error('AI Conflicts error:', error);
        return c.json({ error: 'Failed to detect conflicts' }, 500);
    }
};
