/**
 * Authentication Middleware
 * Handles JWT verification and role-based access control
 */

import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';

// User payload in JWT
export interface JWTPayload {
    userId: number;
    email: string;
    role: 'employee' | 'team_lead' | 'admin';
    teamId: number | null;
}

/**
 * Authenticate middleware - verifies JWT token
 */
export const authenticate = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized - No token provided' }, 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret) as JWTPayload;
        c.set('user', decoded);
        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }
};

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as JWTPayload;

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        if (!roles.includes(user.role)) {
            return c.json({ error: 'Forbidden - Insufficient permissions' }, 403);
        }

        await next();
    };
};
