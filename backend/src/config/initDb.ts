/**
 * Database Initialization Script
 * Creates tables and seeds initial data
 */

import db from './database';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

// Read and execute schema
const schemaPath = join(import.meta.dir, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

console.log('🔧 Initializing database...');

// Execute schema (split by semicolons for multiple statements)
const statements = schema.split(';').filter(s => s.trim());
for (const statement of statements) {
    if (statement.trim()) {
        db.exec(statement);
    }
}

console.log('✅ Schema created successfully');

// Seed initial data
const seedData = async () => {
    // Check if admin already exists
    const adminExists = db.query('SELECT id FROM users WHERE role = ?').get('admin');

    if (!adminExists) {
        // Create default teams
        const insertTeam = db.query('INSERT OR IGNORE INTO teams (name) VALUES (?)');
        insertTeam.run('Engineering');
        insertTeam.run('Marketing');
        insertTeam.run('Human Resources');
        insertTeam.run('Finance');

        console.log('✅ Teams created');

        // Create admin user (password: admin123)
        const adminPasswordHash = bcrypt.hashSync('admin123', 10);
        const insertUser = db.query(`
            INSERT INTO users (email, password_hash, name, role, team_id, leave_balance, sick_leave_balance, casual_leave_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertUser.run('admin@elms.com', adminPasswordHash, 'System Admin', 'admin', null, 0, 0, 0);
        console.log('✅ Admin user created (admin@elms.com / admin123)');

        // Create sample team lead (password: teamlead123)
        const tlPasswordHash = bcrypt.hashSync('teamlead123', 10);
        insertUser.run('teamlead@elms.com', tlPasswordHash, 'John Manager', 'team_lead', 1, 20, 10, 5);
        console.log('✅ Team Lead created (teamlead@elms.com / teamlead123)');

        // Create sample employee (password: employee123)
        const empPasswordHash = bcrypt.hashSync('employee123', 10);
        insertUser.run('employee@elms.com', empPasswordHash, 'Jane Employee', 'employee', 1, 20, 10, 5);
        console.log('✅ Employee created (employee@elms.com / employee123)');
    } else {
        console.log('ℹ️  Data already seeded, skipping...');
    }
};

seedData();

console.log('🎉 Database initialization complete!');
process.exit(0);
