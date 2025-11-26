// Direct PostgreSQL connection for database script
const { Pool } = require('pg');

// Render PostgreSQL connection string
const connectionString = process.env.DATABASE_URL || 
    'postgresql://trackify_user:MuZ8ggwdHn6vhcB1PfKPdhUhOXGgs37V@dpg-d4g4qd8gjchc73dpv16g-a.singapore-postgres.render.com/trackify_db_8mte';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function listAllStaff() {
    try {
        console.log('📋 All Staff Members in Database:\n');

        const allStaff = await pool.query(
            'SELECT id, name, department, phone_number, email FROM staff ORDER BY id'
        );

        allStaff.rows.forEach(staff => {
            console.log(`ID ${staff.id}: ${staff.name} - ${staff.department} - ${staff.phone_number} - ${staff.email}`);
        });

        console.log(`\nTotal Staff: ${allStaff.rows.length} members`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing staff:', error);
        await pool.end();
        process.exit(1);
    }
}

listAllStaff();
