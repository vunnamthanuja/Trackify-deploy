const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'YOUR_DATABASE_URL_HERE';

console.log('🔄 Fixing OTP table constraints...');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fixOTPTable() {
    try {
        // Make identifier column nullable
        await pool.query(`
            ALTER TABLE otp_verification 
            ALTER COLUMN identifier DROP NOT NULL;
        `);
        
        console.log('✅ identifier column is now nullable');
        
        // Make user_type nullable too
        await pool.query(`
            ALTER TABLE otp_verification 
            ALTER COLUMN user_type DROP NOT NULL;
        `);
        
        console.log('✅ user_type column is now nullable');
        console.log('✅ OTP table fixed successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixOTPTable();
