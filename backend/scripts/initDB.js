// Import necessary libraries
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function initializeDatabase() {
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
                password VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                email VARCHAR(100) UNIQUE NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255)
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
                ends_on DATE DEFAULT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Create bookings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                user_name VARCHAR(255) NOT NULL,
                room VARCHAR(255) NOT NULL,
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

        // Create admin
        const hashedPassword = await bcrypt.hash('admin', 10);
        const adminId = uuidv4();
        await client.query(`
            INSERT INTO users (id, username, name, password, role, email, is_verified, verification_token)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8  )
            ON CONFLICT (username) DO NOTHING;
        `, [adminId, 'admin', 'admin', hashedPassword, 'admin', 'example@example.com', false, null]);

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
