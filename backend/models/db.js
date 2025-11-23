const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get promise-based connection (for compatibility with existing code)
const promisePool = {
    execute: async (query, params) => {
        const client = await pool.connect();
        try {
            const result = await client.query(query, params);
            return [result.rows, result.fields];
        } finally {
            client.release();
        }
    },
    query: async (query, params) => {
        return await pool.query(query, params);
    }
};

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully');
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection
};
