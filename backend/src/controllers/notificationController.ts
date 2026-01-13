/**
 * Notification Controller
 * Handles notification CRUD operations
 */

import { Context } from 'hono';
import db from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';

/**
 * Create a notification (internal function)
 */
export const createNotification = async (userId: number, message: string, type: string, leaveId?: number) => {
    try {
        db.query(`
            INSERT INTO notifications (user_id, message, type, related_leave_id)
            VALUES (?, ?, ?, ?)
        `).run(userId, message, type, leaveId || null);
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

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        if (unreadOnly) {
            query += ' AND is_read = 0';
        }
        query += ' ORDER BY created_at DESC LIMIT 50';

        const notifications = db.query(query).all(user.userId);

        // Get unread count
        const unreadCount = db.query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.userId) as { count: number };

        return c.json({
            notifications,
            unreadCount: unreadCount.count
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
            db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.userId);
        } else {
            db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, user.userId);
        }

        return c.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark as read error:', error);
        return c.json({ error: 'Failed to update notification' }, 500);
    }
};
