// Import necessary libraries
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const terminateConnections = async (client, dbName) => {
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `, [dbName]);
  };

const initializeDatabase = async () => {
    let client;

    try {
        // Connect to PostgreSQL
        client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: 'P@55w0rd',
            port: 5432
        });
        await client.connect();
        await terminateConnections(client, 'bsc_booking');
        // Drop and create database
        await client.query('DROP DATABASE IF EXISTS bsc_booking');
        await client.query('CREATE DATABASE bsc_booking');
        console.log('Database created or already exists');

        // Connect to the created database
        await client.end();
        client = new Client({
            host: 'localhost',
            user: 'postgres',
            password: 'P@55w0rd',
            database: 'bsc_booking',
            port: 5432
        });
        await client.connect();

        // Create users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                email VARCHAR(100) UNIQUE NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255)
            );
        `);

        // Create ministries table
        await client.query(`
            CREATE TABLE IF NOT EXISTS ministries (
                id UUID PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            );
        `);

        // Create rooms table
        await client.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id UUID PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                floor INT NOT NULL,
                pax INT NOT NULL
            );
        `);

        // Create repeat_series table
        await client.query(`
            CREATE TABLE IF NOT EXISTS repeat_series (
                id UUID PRIMARY KEY,
                created_by UUID REFERENCES users(id) ON DELETE CASCADE,
                repeat_type VARCHAR(20) NOT NULL,
                repeat_interval INT DEFAULT 1,
                repeat_on JSON DEFAULT NULL,
                ends_after INT DEFAULT NULL,
                ends_on DATE DEFAULT NULL
            );
        `);

        // Create bookings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                ministry_id UUID REFERENCES ministries(id) ON DELETE SET NULL,
                room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
                event_name VARCHAR(255) NOT NULL,
                start_datetime TIMESTAMP NOT NULL,
                end_datetime TIMESTAMP NOT NULL,
                series_id UUID REFERENCES repeat_series(id) ON DELETE SET NULL,
                frequency VARCHAR(50) DEFAULT 'single',
                created_at TIMESTAMP DEFAULT NOW(),
                status VARCHAR(20) DEFAULT 'pending',
                approved_at TIMESTAMP DEFAULT NULL,
                approved_by UUID DEFAULT NULL
            );
        `);

        // Create logs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS logs (
                id UUID PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT NOW(),
                action TEXT NOT NULL
            );
        `);

        // Create starting users
        const hashedPassword = await bcrypt.hash('admin', 10);
        const users = [
            { id: uuidv4(), username: 'admin', name: 'admin', password: await bcrypt.hash('admin', 10), role: 'admin', email: 'admin@example.com', is_verified: true, verification_token: null },    
            { id: uuidv4(), username: 'user', name: 'user', password: await bcrypt.hash('user', 10), role: 'user', email: 'user@example.com', is_verified: true, verification_token: null },
        ];

        for (const user of users) {
            await client.query(`
                INSERT INTO users (id, username, name, password, role, email, is_verified, verification_token)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (username) DO NOTHING;
            `, [user.id, user.username, user.name, user.password, user.role, user.email, user.is_verified, user.verification_token]);
        }

        // Create starting ministries
        const ministries = [
            { id: uuidv4(), name: 'Alcholic Anonymous' },
            { id: uuidv4(), name: 'Altar Servers' },
            { id: uuidv4(), name: 'Antioch' },
            { id: uuidv4(), name: 'BSC Choir' },
            { id: uuidv4(), name: 'Blessed Family Group (BFG)' },
            { id: uuidv4(), name: 'Catechism L1' },
            { id: uuidv4(), name: 'Catechism L2' },
            { id: uuidv4(), name: 'Catechism L3' },
            { id: uuidv4(), name: 'Catechism L4' },
            { id: uuidv4(), name: 'Catechism L5' },
            { id: uuidv4(), name: 'Catechism L6' },
            { id: uuidv4(), name: 'Catechism L7' },
            { id: uuidv4(), name: 'Catechism L8' },
            { id: uuidv4(), name: 'Catechism L9' },
            { id: uuidv4(), name: 'Catechist of the Good Shepherd (CGS)' },
            { id: uuidv4(), name: 'Communion Ministers' },
            { id: uuidv4(), name: 'Executive Committee (ExCo)' },
            { id: uuidv4(), name: 'El Shaddai' },
            { id: uuidv4(), name: 'Emmaus' },
            { id: uuidv4(), name: 'Hospitality' },
            { id: uuidv4(), name: 'Lectors' },
            { id: uuidv4(), name: 'Liturgical Committee' },
            { id: uuidv4(), name: 'Ladies of the Altar' },
            { id: uuidv4(), name: 'Legion of Mary Junior' },
            { id: uuidv4(), name: 'Legion of Mary Senior' },
            { id: uuidv4(), name: 'Lumen Christi Chorus (LCC)' },
            { id: uuidv4(), name: 'Neighbourhood Christian Community (NCC)' },
            { id: uuidv4(), name: 'RCIA' },
            { id: uuidv4(), name: 'St Francis Music Ministry (SFMM)' },
            { id: uuidv4(), name: 'Santa Maria Choir (SMC)' },
            { id: uuidv4(), name: 'St. Vincent de Paul Society (SVDP)' },
            { id: uuidv4(), name: 'Parish Conversion Group (PCG)' },
            { id: uuidv4(), name: 'Youth Community' },
        ]

        for (const ministry of ministries) {
            await client.query(`
                INSERT INTO ministries (id, name)
                VALUES ($1, $2)
                ON CONFLICT (name) DO NOTHING;
            `, [ministry.id, ministry.name]);
        }

        // Create starting rooms
        const rooms = [
            { id: uuidv4(), name: 'Damien Hall', floor: 1, pax: 100 },
            { id: uuidv4(), name: 'Holy Family', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. Andrew', floor: 4, pax: 20 },
            { id: uuidv4(), name: 'St. Bartholomew (Music Room)', floor: 4, pax: 20 },
            { id: uuidv4(), name: 'St. James Alphesus', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. James Zebedee', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. John', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. Jude', floor: 4, pax: 20 },
            { id: uuidv4(), name: 'St. Mark (Cathechetical Office)', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. Matthew', floor: 4, pax: 20 },
            { id: uuidv4(), name: 'St. Paul (Attic)', floor: 5, pax: 30 },
            { id: uuidv4(), name: 'St. Peter', floor: 3, pax: 20 },
            { id: uuidv4(), name: 'St. Philip (Youth Room)', floor: 4, pax: 20 },
            { id: uuidv4(), name: 'St. Thomas', floor: 4, pax: 20 },
        ];

        for (const room of rooms) {
            await client.query(`
                INSERT INTO rooms (id, name, floor, pax)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (name) DO NOTHING;
            `, [room.id, room.name, room.floor, room.pax]);
        }

        console.log('All tables created successfully');

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        if (client) {
            await client.end();
        }
    }
}

initializeDatabase();
