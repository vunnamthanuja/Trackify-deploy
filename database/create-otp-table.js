// Create OTP verification table for email OTP
const { Client } = require('pg');

const connectionString = 'postgresql://trackify_user:MuZ8ggwdHn6vhcB1PfKPdhUhOXGgs37V@dpg-d4g4qd8gjchc73dpv16g-a.singapore-postgres.render.com/trackify_db_8mte';

async function createOTPTable() {
    const client = new Client({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Create otp_verification table
        await client.query(`
            CREATE TABLE IF NOT EXISTS otp_verification (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp VARCHAR(10) NOT NULL,
                user_type VARCHAR(50) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL
            );
        `);

        console.log('✅ otp_verification table created successfully!');

        // Create index for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_otp_verification_lookup ON otp_verification(phone_number, user_type, is_verified);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON otp_verification(expires_at);
        `);

        console.log('✅ OTP verification indexes created successfully');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

createOTPTable();
