const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

async function resetPassword() {
    const username = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!username || !newPassword) {
        console.error('Usage: node resetPassword.js <username> <new-password>');
        process.exit(1);
    }
    
    try {
        // Connect to PostgreSQL
        const client = new Client({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'P@55w0rd',
            database: process.env.DB_NAME || 'bsc_booking',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        });
        await client.connect();
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`Generated hash: ${hashedPassword} (length: ${hashedPassword.length})`);
        
        // Update the user's password
        const result = await client.query(
            'UPDATE users SET password = $1 WHERE username = $2',
            [hashedPassword, username]
        );
        
        if (result.rowCount === 0) {
            console.error(`User "${username}" not found`);
            process.exit(1);
        }
        
        console.log(`Password for user "${username}" has been reset successfully`);
        
        // Verify the password was stored correctly
        const rowsResult = await client.query(
            'SELECT password FROM users WHERE username = $1',
            [username]
        );
        const rows = rowsResult.rows;
        
        if (rows.length === 0) {
            console.error('Could not verify password update');
            process.exit(1);
        }
        
        console.log(`Stored hash: ${rows[0].password} (length: ${rows[0].password.length})`);
        
        // Test if comparison works
        const testValid = await bcrypt.compare(newPassword, rows[0].password);
        console.log(`Password validation test: ${testValid ? 'SUCCESS' : 'FAILED'}`);
        
        await client.end();
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();