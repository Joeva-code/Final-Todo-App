const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const todoRoutes = require('./src/routes/todoRoutes.js');
const { testConnection } = require('./src/config/database.js');
const { errorHandler, notFound } = require('./src/middleware/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Routes
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
        name: 'Todo API',
        version: '1.0.0',
        description: 'A complete Todo backend API with PostgreSQL',
        endpoints: {
            todos: '/api/todos',
            todoById: '/api/todos/:id',
            todoStats: '/api/todos/stats',
            toggleComplete: '/api/todos/:id/toggle',
            deleteCompleted: '/api/todos/completed/delete-all',
            health: '/health'
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        documentation: 'https://github.com/yourusername/todo-backend'
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    console.log('🚀 Starting Todo API Server...');
    console.log('📦 Environment:', process.env.NODE_ENV || 'development');
    
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected && process.env.NODE_ENV === 'production') {
        console.error('❌ Failed to connect to database. Exiting...');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📝 Todo API: http://localhost:${PORT}/api/todos`);
        console.log(`❤️ Health check: http://localhost:${PORT}/health`);
        console.log(`📊 Stats: http://localhost:${PORT}/api/todos/stats`);
    });
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

startServer();