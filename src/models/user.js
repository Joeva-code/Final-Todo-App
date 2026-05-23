const { pool } = require('../config/database.js');
const bcrypt = require('bcryptjs');

class User {
    // Create new user
    static async create(userData) {
        const { username, email, password } = userData;
        const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || 10));
        
        const query = `
            INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at
        `;
        const values = [username, email.toLowerCase(), password_hash];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                if (error.constraint === 'users_username_key') {
                    throw new Error('Username already exists');
                }
                if (error.constraint === 'users_email_key') {
                    throw new Error('Email already exists');
                }
            }
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        try {
            const result = await pool.query(query, [email.toLowerCase()]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find user by id
    static async findById(id) {
        const query = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
        try {
            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Find user by username
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        try {
            const result = await pool.query(query, [username]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Verify password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;