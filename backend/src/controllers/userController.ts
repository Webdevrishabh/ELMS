/**
 * User Controller
 * Handles user CRUD operations and profile management
 */

import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import { JWTPayload } from '../middleware/authMiddleware';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    team_id: number | null;
    leave_balance: number;
    sick_leave_balance: number;
    casual_leave_balance: number;
    skills: string | null;
    phone: string | null;
    created_at: string;
}

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (c: Context) => {
    try {
        const users = db.query(`
            SELECT u.id, u.email, u.name, u.role, u.team_id, t.name as team_name,
                   u.leave_balance, u.sick_leave_balance, u.casual_leave_balance,
                   u.phone, u.created_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            ORDER BY u.created_at DESC
        `).all();

        return c.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
};

/**
 * Get user by ID
 */
export const getUser = async (c: Context) => {
    try {
        const id = c.req.param('id');

        const user = db.query(`
            SELECT u.id, u.email, u.name, u.role, u.team_id, t.name as team_name,
                   u.leave_balance, u.sick_leave_balance, u.casual_leave_balance,
                   u.skills, u.phone, u.created_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.id = ?
        `).get(id);

        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        return c.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
};

/**
 * Create new user (Admin only)
 */
export const createUser = async (c: Context) => {
    try {
        const { email, password, name, role, teamId, phone } = await c.req.json();

        // Validation
        if (!email || !password || !name || !role) {
            return c.json({ error: 'Email, password, name, and role are required' }, 400);
        }

        if (!['employee', 'team_lead', 'admin'].includes(role)) {
            return c.json({ error: 'Invalid role' }, 400);
        }

        // Check if email exists
        const existing = db.query('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return c.json({ error: 'Email already exists' }, 400);
        }

        // Hash password
        const passwordHash = bcrypt.hashSync(password, 10);

        // Insert user
        const result = db.query(`
            INSERT INTO users (email, password_hash, name, role, team_id, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(email, passwordHash, name, role, teamId || null, phone || null);

        return c.json({
            message: 'User created successfully',
            userId: result.lastInsertRowid
        }, 201);
    } catch (error) {
        console.error('Create user error:', error);
        return c.json({ error: 'Failed to create user' }, 500);
    }
};

/**
 * Update user (Admin or self)
 */
export const updateUser = async (c: Context) => {
    try {
        const id = parseInt(c.req.param('id'));
        const currentUser = c.get('user') as JWTPayload;
        const { name, role, teamId, phone, leaveBalance, sickLeaveBalance, casualLeaveBalance } = await c.req.json();

        // Only admin can update other users
        if (currentUser.role !== 'admin' && currentUser.userId !== id) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        // Check user exists
        const existing = db.query('SELECT id FROM users WHERE id = ?').get(id);
        if (!existing) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }

        // Only admin can update these
        if (currentUser.role === 'admin') {
            if (role) { updates.push('role = ?'); values.push(role); }
            if (teamId !== undefined) { updates.push('team_id = ?'); values.push(teamId); }
            if (leaveBalance !== undefined) { updates.push('leave_balance = ?'); values.push(leaveBalance); }
            if (sickLeaveBalance !== undefined) { updates.push('sick_leave_balance = ?'); values.push(sickLeaveBalance); }
            if (casualLeaveBalance !== undefined) { updates.push('casual_leave_balance = ?'); values.push(casualLeaveBalance); }
        }

        if (updates.length === 0) {
            return c.json({ error: 'No fields to update' }, 400);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        return c.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        return c.json({ error: 'Failed to update user' }, 500);
    }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (c: Context) => {
    try {
        const id = parseInt(c.req.param('id'));
        const currentUser = c.get('user') as JWTPayload;

        // Prevent self-deletion
        if (currentUser.userId === id) {
            return c.json({ error: 'Cannot delete yourself' }, 400);
        }

        const result = db.query('DELETE FROM users WHERE id = ?').run(id);

        if (result.changes === 0) {
            return c.json({ error: 'User not found' }, 404);
        }

        return c.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return c.json({ error: 'Failed to delete user' }, 500);
    }
};

/**
 * Get current user's profile
 */
export const getProfile = async (c: Context) => {
    try {
        const currentUser = c.get('user') as JWTPayload;

        const user = db.query(`
            SELECT u.id, u.email, u.name, u.role, u.team_id, t.name as team_name,
                   u.leave_balance, u.sick_leave_balance, u.casual_leave_balance,
                   u.skills, u.phone, u.created_at
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.id = ?
        `).get(currentUser.userId);

        return c.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        return c.json({ error: 'Failed to fetch profile' }, 500);
    }
};

/**
 * Update current user's profile
 */
export const updateProfile = async (c: Context) => {
    try {
        const currentUser = c.get('user') as JWTPayload;
        const { name, phone, skills } = await c.req.json();

        const updates: string[] = [];
        const values: any[] = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
        if (skills !== undefined) { updates.push('skills = ?'); values.push(JSON.stringify(skills)); }

        if (updates.length === 0) {
            return c.json({ error: 'No fields to update' }, 400);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(currentUser.userId);

        db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        return c.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        return c.json({ error: 'Failed to update profile' }, 500);
    }
};

/**
 * Get all teams
 */
export const getTeams = async (c: Context) => {
    try {
        const teams = db.query('SELECT id, name FROM teams ORDER BY name').all();
        return c.json({ teams });
    } catch (error) {
        console.error('Get teams error:', error);
        return c.json({ error: 'Failed to fetch teams' }, 500);
    }
};

/**
 * Create a new team (Admin only)
 */
export const createTeam = async (c: Context) => {
    try {
        const { name } = await c.req.json();

        if (!name || !name.trim()) {
            return c.json({ error: 'Team name is required' }, 400);
        }

        const teamName = name.trim();

        // Check if team already exists
        const existing = db.query('SELECT id FROM teams WHERE name = ?').get(teamName);
        if (existing) {
            return c.json({ error: 'Team already exists', team: existing }, 400);
        }

        // Insert new team
        const result = db.query('INSERT INTO teams (name) VALUES (?)').run(teamName);

        return c.json({
            message: 'Team created successfully',
            team: { id: result.lastInsertRowid, name: teamName }
        }, 201);
    } catch (error) {
        console.error('Create team error:', error);
        return c.json({ error: 'Failed to create team' }, 500);
    }
};
