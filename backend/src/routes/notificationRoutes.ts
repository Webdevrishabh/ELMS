/**
 * Notification Routes
 */

import { Hono } from 'hono';
import { getNotifications, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const notificationRoutes = new Hono();

notificationRoutes.use('*', authenticate);
notificationRoutes.get('/', getNotifications);
notificationRoutes.put('/:id/read', markAsRead);

export default notificationRoutes;
