const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addIsVerifiedColumn() {
  try {
    console.log('🔧 Adding is_verified column to otp_verification table...');
    
    // Add is_verified column with default value false
    await pool.query(`
      ALTER TABLE otp_verification 
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false
    `);
    
    console.log('✅ is_verified column added successfully!');
    
    // Verify the column was added
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'otp_verification'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current otp_verification table structure:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding is_verified column:', error);
  } finally {
    await pool.end();
  }
}

addIsVerifiedColumn();
