/**
 * JWT Configuration
 */

export const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: '24h'
};
