const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'finaltodo',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Migration function
const migrateDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('🔄 Running database migrations...');
        
        // First, ensure users table exists
        const usersTableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        `);
        
        if (!usersTableCheck.rows[0].exists) {
            console.log('❌ Users table doesn\'t exist! Please create users table first.');
            console.log('Run the schema SQL from previous response to create users table.');
            return;
        }
        
        // Check if todos table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'todos'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            // Create todos table
            await client.query(`
                CREATE TABLE todos (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    priority VARCHAR(20) DEFAULT 'medium',
                    due_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Todos table created');
        } else {
            // Check and add missing columns
            const columns = ['user_id', 'title', 'description', 'completed', 'priority', 'due_date', 'created_at', 'updated_at'];
            
            for (const column of columns) {
                const columnExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = 'todos' AND column_name = $1
                    )
                `, [column]);
                
                if (!columnExists.rows[0].exists) {
                    let columnDef = '';
                    switch(column) {
                        case 'user_id':
                            columnDef = 'INTEGER REFERENCES users(id) ON DELETE CASCADE';
                            break;
                        case 'title':
                            columnDef = 'VARCHAR(255) NOT NULL';
                            break;
                        case 'description':
                            columnDef = 'TEXT';
                            break;
                        case 'completed':
                            columnDef = 'BOOLEAN DEFAULT FALSE';
                            break;
                        case 'priority':
                            columnDef = 'VARCHAR(20) DEFAULT \'medium\'';
                            break;
                        case 'due_date':
                            columnDef = 'DATE';
                            break;
                        case 'created_at':
                            columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
                            break;
                        case 'updated_at':
                            columnDef = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
                            break;
                    }
                    await client.query(`ALTER TABLE todos ADD COLUMN ${column} ${columnDef}`);
                    console.log(`✅ Added ${column} column to todos table`);
                }
            }
        }
        
        // Create index for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
            CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
        `);
        
        console.log('✅ Migrations completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

// Initialize database
const initDatabase = async () => {
    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        
        // Run migrations
        await migrateDatabase();
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
};

module.exports = { pool, initDatabase, migrateDatabase };