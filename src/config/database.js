
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Optional: Add these for better production performance
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const initDatabase = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            priority INTEGER DEFAULT 2,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
        CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('✅ Database tables created/verified');
        return true;
    } catch (error) {
        console.error('❌ Failed to create tables:', error.message);
        return false;
    }
};

// Export both pool and init function
module.exports = { pool, testConnection: initDatabase };
