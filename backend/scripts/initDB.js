const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function initializeDatabase() {
    let connection;
    
    try {
        // Connect to MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'P@55w0rd'
        });
        
        await connection.query(`DROP DATABASE IF EXISTS bsc_booking`);

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS bsc_booking`);
        console.log('Database created or already exists');
        
        // Use the database
        await connection.query(`USE bsc_booking`);
        
        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user'
            )
        `);
        console.log('Users table created or already exists');
        
        // Create rooms table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                floor INT NOT NULL,
                pax INT NOT NULL
            )
        `);
        console.log('Rooms table created or already exists');
        
        // Create recurring_series table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS repeat_series (
                id VARCHAR(36) PRIMARY KEY,
                created_by VARCHAR(36) NOT NULL,
                repeat_type ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
                repeat_interval INT NOT NULL DEFAULT 1, -- Every X days/weeks/etc.
                repeat_on JSON DEFAULT NULL, -- e.g., ["Monday", "Wednesday"] or ["15"] or ["February", "April"]
                ends_after INT DEFAULT NULL, -- Repeat N times
                ends_on DATE DEFAULT NULL,   -- Or until specific date (max 2 years from now)
                created_at DATETIME NOT NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log('Repeat series table created or already exists');

        // Create bookings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                user_name VARCHAR(255) NOT NULL,
                room VARCHAR(255) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                start_datetime DATETIME NOT NULL,
                end_datetime DATETIME NOT NULL,
                series_id VARCHAR(36) DEFAULT NULL,
                frequency VARCHAR(50) DEFAULT 'single',
                frequency_start DATETIME DEFAULT NULL,
                frequency_end DATETIME DEFAULT NULL,
                created_at DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
                approved_at DATETIME DEFAULT NULL,
                approved_by VARCHAR(36) DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (series_id) REFERENCES repeat_series(id) ON DELETE SET NULL
            );
        `);
        console.log('Bookings table created or already exists');
        
        // Create logs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id VARCHAR(36) PRIMARY KEY,
                timestamp DATETIME NOT NULL,
                action TEXT NOT NULL
            )
        `);
        console.log('Logs table created or already exists');
        
        // Create test users if they don't exist
        // Check if user1 exists
        const [existingUser] = await connection.query(`SELECT * FROM users WHERE username = 'user'`);
        if (existingUser.length === 0) {
            const userId = uuidv4();
            const hashedPassword = await bcrypt.hash('user1', 10);
            await connection.query(
                `INSERT INTO users (id, username, name, password, role) VALUES (?, ?, ?, ?, ?)`,
                [userId, 'user1', 'user', hashedPassword, 'user']
            );
            console.log('Test user "user" created');
        } else {
            console.log('Test user "user" already exists');
        }
        
        // Check if admin1 exists
        const [existingAdmin] = await connection.query(`SELECT * FROM users WHERE username = 'admin'`);
        if (existingAdmin.length === 0) {
            const adminId = uuidv4();
            const hashedPassword = await bcrypt.hash('admin', 10);
            await connection.query(
                `INSERT INTO users (id, username, name, password, role) VALUES (?, ?, ?, ?, ?)`,
                [adminId, 'admin', 'admin', hashedPassword, 'admin']
            );
            console.log('Test admin "admin" created');
        } else {
            console.log('Test admin "admin" already exists');
        }
        
        // Create test rooms if they don't exist
        const rooms = [
            { name: 'Damien Hall', floor: 2, pax: 100 },
            { name: 'St John', floor: 3, pax: 10 },
            { name: 'St Andrew', floor: 4, pax: 8 },
            { name: 'Attic', floor: 5, pax: 20 }
        ];
        
        for (const room of rooms) {
            const [existingRoom] = await connection.query(`SELECT * FROM rooms WHERE name = ?`, [room.name]);
            if (existingRoom.length === 0) {
                const roomId = uuidv4();
                await connection.query(
                    `INSERT INTO rooms (id, name, floor, pax) VALUES (?, ?, ?, ?)`,
                    [roomId, room.name, room.floor, room.pax]
                );
                console.log(`Room "${room.name}" created`);
            } else {
                console.log(`Room "${room.name}" already exists`);
            }
        }
        
        console.log('Database initialization complete');
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initializeDatabase();