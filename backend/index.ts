/**
 * ELMS Backend Server
 * Employee Leave Management System
 * 
 * Stack: Bun + Hono + SQLite + Gemini AI
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import routes
import authRoutes from './src/routes/authRoutes';
import userRoutes from './src/routes/userRoutes';
import leaveRoutes from './src/routes/leaveRoutes';
import dashboardRoutes from './src/routes/dashboardRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import aiRoutes from './src/routes/aiRoutes';

// Initialize app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: (origin) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
        ];
        return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    },
    credentials: true
}));

// Health check
app.get('/', (c) => c.json({
    message: 'ELMS API Server',
    version: '1.0.0',
    status: 'running'
}));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/leaves', leaveRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/ai', aiRoutes);

// 404 handler
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// Error handler
app.onError((err, c) => {
    console.error('Server error:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
});

// Initialize DB and Start server
const port = parseInt(process.env.PORT || '5000');
import initDb from './src/config/initDb';

await initDb();

console.log(`
╔═══════════════════════════════════════════╗
║     ELMS - Leave Management System        ║
║     Server running on port ${port}            ║
╚═══════════════════════════════════════════╝
`);

export default {
    port,
    fetch: app.fetch,
    hostname: '0.0.0.0'
};
