/**
 * Authentication Routes
 */

import { Hono } from 'hono';
import { login, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const authRoutes = new Hono();

// Public routes
authRoutes.post('/login', login);

// Protected routes
authRoutes.post('/change-password', authenticate, changePassword);

export default authRoutes;
