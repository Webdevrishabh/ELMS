/**
 * Authentication Controller
 * Handles login and password management
 */

import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { JWT_CONFIG } from '../config/jwt';
import { JWTPayload } from '../middleware/authMiddleware';

interface User {
    id: number;
    email: string;
    password_hash: string;
    name: string;
    role: string;
    team_id: number | null;
}

/**
 * Login user and return JWT token
 */
export const login = async (c: Context) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ error: 'Email and password are required' }, 400);
        }

        // Find user by email
        const user = db.query(`
            SELECT id, email, password_hash, name, role, team_id 
            FROM users WHERE email = ?
        `).get(email) as User | undefined;

        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // Verify password
        const validPassword = bcrypt.compareSync(password, user.password_hash);
        if (!validPassword) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        // Generate JWT
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            role: user.role as JWTPayload['role'],
            teamId: user.team_id
        };

        const token = jwt.sign(payload, JWT_CONFIG.secret, { expiresIn: JWT_CONFIG.expiresIn });

        return c.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                teamId: user.team_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return c.json({ error: 'Login failed' }, 500);
    }
};

/**
 * Change password for authenticated user
 */
export const changePassword = async (c: Context) => {
    try {
        const user = c.get('user') as JWTPayload;
        const { currentPassword, newPassword } = await c.req.json();

        if (!currentPassword || !newPassword) {
            return c.json({ error: 'Current and new password are required' }, 400);
        }

        if (newPassword.length < 6) {
            return c.json({ error: 'New password must be at least 6 characters' }, 400);
        }

        // Get current user
        const dbUser = db.query('SELECT password_hash FROM users WHERE id = ?').get(user.userId) as { password_hash: string } | undefined;

        if (!dbUser) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Verify current password
        const validPassword = bcrypt.compareSync(currentPassword, dbUser.password_hash);
        if (!validPassword) {
            return c.json({ error: 'Current password is incorrect' }, 401);
        }

        // Hash new password and update
        const newHash = bcrypt.hashSync(newPassword, 10);
        db.query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, user.userId);

        return c.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return c.json({ error: 'Failed to change password' }, 500);
    }
};
