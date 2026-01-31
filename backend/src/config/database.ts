/**
 * PostgreSQL Database Configuration
 * Uses 'postgres' library for Bun
 */

import postgres from 'postgres';

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.warn('⚠️ DATABASE_URL is missing! Database features will fail.');
}

const sql = postgres(connectionString || 'postgres://user:pass@localhost:5432/db', {
    ssl: connectionString ? 'require' : false, // Railway requires SSL
    max: 10, // Pool size
});

export default sql;
