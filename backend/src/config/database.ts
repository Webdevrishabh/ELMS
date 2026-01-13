/**
 * SQLite Database Configuration
 * Uses Bun's built-in SQLite for fast, native operations
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';

// Database file path
const DB_PATH = join(import.meta.dir, '../../elms.db');

// Initialize database connection
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.exec('PRAGMA journal_mode = WAL');

export default db;
