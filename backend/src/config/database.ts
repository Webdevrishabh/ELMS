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

const isInternal = connectionString ? connectionString.includes('.internal') : false;

console.log(`🔌 DB Init: URL provided: ${!!connectionString}, Is Internal: ${isInternal}`);

const sql = postgres(connectionString || 'postgres://user:pass@localhost:5432/db', {
    ssl: connectionString && !isInternal ? 'require' : false,
    max: 10,
    connect_timeout: 10,
    onnotice: () => { },
    debug: (conn, query, params) => {
        // Log valid connection establishment
        if (query === 'select 1') console.log('✅ DB Connection check detected');
    }
});

console.log(`🔌 DB Configured with SSL: ${connectionString && !isInternal ? 'require' : 'false'}`);

export default sql;
