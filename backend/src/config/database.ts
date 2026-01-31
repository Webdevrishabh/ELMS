/**
 * PostgreSQL Database Configuration
 * Uses 'postgres' library for Bun
 */

import postgres from 'postgres';

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.warn('⚠️ DATABASE_URL is missing! Database features will fail.');
}

const sql = postgres(connectionString || 'postgres://user:pass@localhost:5432/db', {
    ssl: connectionString ? 'require' : false,
    max: 10,
    connect_timeout: 5, // Fail fast (5 seconds)
    onnotice: () => { }, // Silence notice logs
});

console.log('🔌 DB Config:', connectionString ? 'URL provided' : 'Using Fallback (Will fail on Railway)');

export default sql;
