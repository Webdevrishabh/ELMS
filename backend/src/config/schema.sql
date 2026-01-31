-- ELMS Database Schema
-- PostgreSQL database for Leave Management System

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('employee', 'team_lead', 'admin')),
    team_id INTEGER REFERENCES teams(id),
    leave_balance INTEGER DEFAULT 20,
    sick_leave_balance INTEGER DEFAULT 10,
    casual_leave_balance DEFAULT 5,
    skills TEXT, -- JSON array stored as text
    phone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    leave_type TEXT NOT NULL CHECK(leave_type IN ('annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity')),
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    total_days INTEGER NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    team_lead_approval TEXT DEFAULT 'pending' CHECK(team_lead_approval IN ('pending', 'approved', 'rejected', 'na')),
    team_lead_comment TEXT,
    admin_approval TEXT DEFAULT 'pending' CHECK(admin_approval IN ('pending', 'approved', 'rejected')),
    admin_comment TEXT,
    ai_recommendation TEXT, -- JSON stored as text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('leave_applied', 'leave_approved', 'leave_rejected', 'leave_pending', 'system')),
    related_leave_id INTEGER REFERENCES leaves(id),
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Logs table for audit trail
CREATE TABLE IF NOT EXISTS ai_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action_type TEXT NOT NULL CHECK(action_type IN ('chat', 'autofill', 'recommendation', 'conflict_detection')),
    request_masked TEXT, -- Personal data masked
    response_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_leaves_user ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON leaves(from_date, to_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
