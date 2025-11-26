const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'YOUR_DATABASE_URL_HERE';

console.log('🔄 Updating OTP verification table structure...');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateOTPTable() {
    try {
        // Add phone_number column if it doesn't exist
        await pool.query(`
            ALTER TABLE otp_verification 
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
        `);
        
        // Add email column if it doesn't exist
        await pool.query(`
            ALTER TABLE otp_verification 
            ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        `);
        
        console.log('✅ OTP verification table updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating OTP table:', error.message);
        process.exit(1);
    }
}

updateOTPTable();
