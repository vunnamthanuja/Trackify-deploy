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

async function addCSEStaff() {
    try {
        console.log('Adding CSE Department staff members to Render database...\n');

        const staffMembers = [
            {
                name: 'Roopesh Kumar BN',
                department: 'CSE',
                phone: '9538367685',
                email: 'roopeshkumarbn@ksit.edu.in'
            },
            {
                name: 'Swapna S Bansole',
                department: 'CSE',
                phone: '9620495879',
                email: 'swapnasbansole@ksit.edu.in'
            },
            {
                name: 'Abhilash L Bhat',
                department: 'CSE',
                phone: '9164465694',
                email: 'abhilashlbhat@ksit.edu.in'
            },
            {
                name: 'Kumar K',
                department: 'CSE',
                phone: '9964161212',
                email: 'kumark@ksit.edu.in'
            },
            {
                name: 'Raghavendrachar S',
                department: 'CSE',
                phone: '9742734816',
                email: 'raghavendrachars@ksit.edu.in'
            },
            {
                name: 'Roopashree SV',
                department: 'CSE',
                phone: '9538367685',
                email: 'roopashreesv@ksit.edu.in'
            },
            {
                name: 'Ramya R',
                department: 'CSE',
                phone: '9972863036',
                email: 'ramyar@ksit.edu.in'
            },
            {
                name: 'Rekha B Venkatapur',
                department: 'CSE',
                phone: '9740295819',
                email: 'rekhabvenkatapur@ksit.edu.in'
            }
        ];

        for (const staff of staffMembers) {
            // Check if staff already exists
            const existing = await pool.query(
                'SELECT id FROM staff WHERE phone_number = $1',
                [staff.phone]
            );

            if (existing.rows.length > 0) {
                console.log(`⚠️  Staff already exists: ${staff.name} (${staff.phone})`);
                continue;
            }

            // Insert new staff member
            const result = await pool.query(
                `INSERT INTO staff (name, department, phone_number, email) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
                [staff.name, staff.department, staff.phone, staff.email]
            );

            console.log(`✅ Added: ${staff.name} - ${staff.department} (ID: ${result.rows[0].id})`);
        }

        console.log('\n✅ All CSE staff members processed successfully!');

        // Display all CSE staff
        console.log('\n📋 Current CSE Department Staff:');
        const allStaff = await pool.query(
            'SELECT id, name, department, phone_number, email FROM staff WHERE department = $1 ORDER BY name',
            ['CSE']
        );

        allStaff.rows.forEach(staff => {
            console.log(`   ${staff.id}. ${staff.name} - ${staff.phone_number} - ${staff.email}`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding CSE staff:', error);
        await pool.end();
        process.exit(1);
    }
}

addCSEStaff();
