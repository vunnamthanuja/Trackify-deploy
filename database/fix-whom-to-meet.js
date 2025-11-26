const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixWhomToMeet() {
  try {
    console.log('🔧 Making whom_to_meet nullable in visitors table...');
    
    await pool.query(`
      ALTER TABLE visitors 
      ALTER COLUMN whom_to_meet DROP NOT NULL
    `);
    
    console.log('✅ whom_to_meet column is now nullable');
    
    // Verify the change
    const result = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'visitors' AND column_name IN ('purpose', 'whom_to_meet', 'whom_to_meet_phone')
    `);
    
    console.log('\n📋 Updated columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: nullable = ${col.is_nullable}`);
    });
    
    console.log('\n✅ Visitors table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixWhomToMeet();
