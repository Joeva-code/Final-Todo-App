const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes.js');
const todoRoutes = require('./src/routes/todoRoutes.js');
const { pool, testConnection } = require('./src/config/database.js');
const { errorHandler, notFound } = require('./src/middleware/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Create tables if they don't exist
const initDatabase = async () => {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    const createTodosTable = `
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            priority INTEGER DEFAULT 2,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    const createIndexes = `
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
        CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
    `;
    
    try {
        await pool.query(createUsersTable);
        await pool.query(createTodosTable);
        await pool.query(createIndexes);
        console.log('✅ Database tables created/verified');
    } catch (error) {
        console.error('❌ Failed to create tables:', error.message);
        throw error;
    }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// Root endpoint with API information
app.get('/', (req, res) => {
    res.json({
        name: 'Todo API with Authentication',
        version: '2.0.0',
        description: 'A complete Todo backend API with user authentication',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me'
            },
            todos: {
                getAll: 'GET /api/todos',
                getById: 'GET /api/todos/:id',
                create: 'POST /api/todos',
                update: 'PUT /api/todos/:id',
                delete: 'DELETE /api/todos/:id',
                toggle: 'PATCH /api/todos/:id/toggle',
                stats: 'GET /api/todos/stats'
            },
            health: 'GET /health'
        },
        authentication: 'Bearer token required for all todo endpoints'
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    console.log('🚀 Starting Todo API Server with Authentication...');
    console.log('📦 Environment:', process.env.NODE_ENV || 'development');
    
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    
    // Initialize database tables
    if (dbConnected) {
        await initDatabase();
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
        console.log(`📝 Todo API: http://localhost:${PORT}/api/todos`);
        console.log(`❤️ Health check: http://localhost:${PORT}/health`);
    });
};

startServer();