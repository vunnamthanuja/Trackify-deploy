const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addStaff() {
  try {
    console.log('📝 Adding staff member: Rajkumar...');
    
    // Check if staff already exists
    const checkQuery = 'SELECT * FROM staff WHERE phone_number = $1';
    const checkResult = await pool.query(checkQuery, ['8088943390']);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Staff member already exists with this phone number');
      console.log('Existing staff:', checkResult.rows[0]);
      return;
    }
    
    // Insert new staff member
    const insertQuery = `
      INSERT INTO staff (name, department, email, phone_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      'Rajkumar',
      'CSE',
      'yashaswinikt0502@gmail.com',
      '8088943390'
    ]);
    
    console.log('✅ Staff member added successfully!');
    console.log('Staff details:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Error adding staff:', error);
  } finally {
    await pool.end();
  }
}

addStaff();
