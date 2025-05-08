const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'P@55w0rd',
    database: process.env.DB_NAME || 'bsc_booking',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

module.exports = pool;
