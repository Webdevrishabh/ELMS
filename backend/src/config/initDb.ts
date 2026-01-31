/**
 * Database Initialization Script
 * Creates tables and seeds initial data
 */

import sql from './database';
import { readFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';

// Read and execute schema
const schemaPath = join(import.meta.dir, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

console.log('🔧 Initializing database...');

// Execute schema
const statements = schema.split(';').filter(s => s.trim());

const init = async () => {
    try {
        for (const statement of statements) {
            if (statement.trim()) {
                await sql.unsafe(statement);
            }
        }
        console.log('✅ Schema created successfully');

        // Seed initial data
        // Check if admin already exists
        const adminExists = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;

        if (adminExists.length === 0) {
            // Create default teams
            await sql`
                INSERT INTO teams (name) VALUES 
                ('Engineering'), ('Marketing'), ('Human Resources'), ('Finance')
                ON CONFLICT (name) DO NOTHING
            `;

            console.log('✅ Teams created');

            // Create admin user (password: admin123)
            const adminPasswordHash = bcrypt.hashSync('admin123', 10);

            await sql`
                INSERT INTO users (email, password_hash, name, role, team_id, leave_balance, sick_leave_balance, casual_leave_balance)
                VALUES ('admin@elms.com', ${adminPasswordHash}, 'System Admin', 'admin', null, 0, 0, 0)
            `;
            console.log('✅ Admin user created (admin@elms.com / admin123)');

            // Create sample team lead (password: teamlead123)
            const tlPasswordHash = bcrypt.hashSync('teamlead123', 10);
            const engineeringTeam = await sql`SELECT id FROM teams WHERE name = 'Engineering'`;

            if (engineeringTeam.length > 0) {
                await sql`
                    INSERT INTO users (email, password_hash, name, role, team_id, leave_balance, sick_leave_balance, casual_leave_balance)
                    VALUES ('teamlead@elms.com', ${tlPasswordHash}, 'John Manager', 'team_lead', ${engineeringTeam[0].id}, 20, 10, 5)
                `;
                console.log('✅ Team Lead created (teamlead@elms.com / teamlead123)');

                // Create sample employee (password: employee123)
                const empPasswordHash = bcrypt.hashSync('employee123', 10);
                await sql`
                    INSERT INTO users (email, password_hash, name, role, team_id, leave_balance, sick_leave_balance, casual_leave_balance)
                    VALUES ('employee@elms.com', ${empPasswordHash}, 'Jane Employee', 'employee', ${engineeringTeam[0].id}, 20, 10, 5)
                `;
                console.log('✅ Employee created (employee@elms.com / employee123)');
            }
        } else {
            console.log('ℹ️  Data already seeded, skipping...');
        }

        console.log('🎉 Database initialization complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};

init();
