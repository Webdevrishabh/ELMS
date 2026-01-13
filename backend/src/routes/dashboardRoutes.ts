/**
 * Dashboard Routes
 */

import { Hono } from 'hono';
import { getDashboard } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authMiddleware';

const dashboardRoutes = new Hono();

dashboardRoutes.use('*', authenticate);
dashboardRoutes.get('/', getDashboard);

export default dashboardRoutes;
