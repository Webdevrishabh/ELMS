/**
 * PostgreSQL Database Configuration
 * Uses 'postgres' library for Bun
 */

import postgres from 'postgres';

// Get connection string from environment variable
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is missing!');
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require', // Railway requires SSL
    max: 10, // Pool size
});

export default sql;
