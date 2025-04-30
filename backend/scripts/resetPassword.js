const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPassword() {
    const username = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!username || !newPassword) {
        console.error('Usage: node resetPassword.js <username> <new-password>');
        process.exit(1);
    }
    
    try {
        // Connect to database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'P@55w0rd',
            database: process.env.DB_NAME || 'bsc_booking'
        });
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`Generated hash: ${hashedPassword} (length: ${hashedPassword.length})`);
        
        // Update the user's password
        const [result] = await connection.execute(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, username]
        );
        
        if (result.affectedRows === 0) {
            console.error(`User "${username}" not found`);
            process.exit(1);
        }
        
        console.log(`Password for user "${username}" has been reset successfully`);
        
        // Verify the password was stored correctly
        const [rows] = await connection.execute(
            'SELECT password FROM users WHERE username = ?',
            [username]
        );
        
        if (rows.length === 0) {
            console.error('Could not verify password update');
            process.exit(1);
        }
        
        console.log(`Stored hash: ${rows[0].password} (length: ${rows[0].password.length})`);
        
        // Test if comparison works
        const testValid = await bcrypt.compare(newPassword, rows[0].password);
        console.log(`Password validation test: ${testValid ? 'SUCCESS' : 'FAILED'}`);
        
        connection.end();
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();