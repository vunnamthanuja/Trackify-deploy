const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixVisitorsConstraints() {
  try {
    console.log('🔧 Making purpose and other columns nullable in visitors table...');
    
    // Make purpose, person_to_meet, and department nullable
    await pool.query(`
      ALTER TABLE visitors 
      ALTER COLUMN purpose DROP NOT NULL
    `);
    console.log('✅ purpose column is now nullable');
    
    await pool.query(`
      ALTER TABLE visitors 
      ALTER COLUMN person_to_meet DROP NOT NULL
    `);
    console.log('✅ person_to_meet column is now nullable');
    
    await pool.query(`
      ALTER TABLE visitors 
      ALTER COLUMN department DROP NOT NULL
    `);
    console.log('✅ department column is now nullable');
    
    // Verify the changes
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'visitors'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current visitors table structure:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ Visitors table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing visitors table:', error);
  } finally {
    await pool.end();
  }
}

fixVisitorsConstraints();
