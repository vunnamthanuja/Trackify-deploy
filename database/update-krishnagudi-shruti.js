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

async function updateStaff() {
    try {
        console.log('Updating Krishna Gudi and Shruthi TS department to CSE...\n');

        // Update Krishna Gudi's department
        const krishnaResult = await pool.query(
            `UPDATE staff SET department = $1 WHERE name = $2`,
            ['CSE', 'Krishna Gudi']
        );

        if (krishnaResult.rowCount > 0) {
            console.log(`✅ Updated Krishna Gudi's department to CSE`);
        } else {
            console.log(`⚠️  Krishna Gudi not found in database`);
        }

        // Update Shruthi TS's department
        const shruthiResult = await pool.query(
            `UPDATE staff SET department = $1 WHERE name = $2`,
            ['CSE', 'Shruthi TS']
        );

        if (shruthiResult.rowCount > 0) {
            console.log(`✅ Updated Shruthi TS's department to CSE`);
        } else {
            console.log(`⚠️  Shruthi TS not found in database`);
        }

        console.log('\n✅ Department updates completed!');

        // Display all CSE staff
        console.log('\n📋 Current CSE Department Staff:');
        const allStaff = await pool.query(
            'SELECT id, name, department, phone_number, email FROM staff WHERE department = $1 ORDER BY name',
            ['CSE']
        );

        allStaff.rows.forEach(staff => {
            console.log(`   ${staff.id}. ${staff.name} - ${staff.phone_number} - ${staff.email}`);
        });

        console.log(`\nTotal CSE Staff: ${allStaff.rows.length} members`);

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating staff:', error);
        await pool.end();
        process.exit(1);
    }
}

updateStaff();
