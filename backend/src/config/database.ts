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

// Disable SSL for internal Railway connections (they hang with ssl: 'require')
const isInternal = connectionString ? connectionString.includes('.internal') : false;

const sql = postgres(connectionString || 'postgres://user:pass@localhost:5432/db', {
    ssl: connectionString && !isInternal ? 'require' : false,
    max: 10,
    connect_timeout: 10, // Increased timeout for initial connection
    onnotice: () => { }, // Silence notice logs
});

console.log('🔌 DB Config:', connectionString ? 'URL provided' : 'Using Fallback (Will fail on Railway)');

export default sql;
