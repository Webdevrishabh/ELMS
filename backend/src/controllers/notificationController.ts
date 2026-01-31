/**
 * Notification Controller
 * Handles notification CRUD operations
 */

import { Context } from 'hono';
import sql from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';

/**
 * Create a notification (internal function)
 */
export const createNotification = async (userId: number, message: string, type: string, leaveId?: number) => {
    try {
        await sql`
            INSERT INTO notifications (user_id, message, type, related_leave_id)
            VALUES (${userId}, ${message}, ${type}, ${leaveId || null})
        `;
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

/**
 * Get user's notifications
 */
export const getNotifications = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const unreadOnly = c.req.query('unread') === 'true';

        let notifications;
        if (unreadOnly) {
            notifications = await sql`SELECT * FROM notifications WHERE user_id = ${user.userId} AND is_read = 0 ORDER BY created_at DESC LIMIT 50`;
        } else {
            notifications = await sql`SELECT * FROM notifications WHERE user_id = ${user.userId} ORDER BY created_at DESC LIMIT 50`;
        }

        // Get unread count
        const unreadCountResult = await sql`SELECT COUNT(*) as count FROM notifications WHERE user_id = ${user.userId} AND is_read = 0`;
        const unreadCount = parseInt(unreadCountResult[0].count);

        return c.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return c.json({ error: 'Failed to fetch notifications' }, 500);
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const notificationId = c.req.param('id');

        if (notificationId === 'all') {
            // Mark all as read
            await sql`UPDATE notifications SET is_read = 1 WHERE user_id = ${user.userId}`;
        } else {
            await sql`UPDATE notifications SET is_read = 1 WHERE id = ${notificationId} AND user_id = ${user.userId}`;
        }

        return c.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        return c.json({ error: 'Failed to update notification' }, 500);
    }
};
