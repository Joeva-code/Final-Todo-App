const Todo = require('../models/Todo.js');
const { validationResult } = require('express-validator');

// Get all todos
const getAllTodos = async (req, res) => {
    try {
        const { completed, priority, search, sortBy, sortOrder, limit, offset } = req.query;
        
        const filters = {
            completed,
            priority,
            search,
            sortBy,
            sortOrder,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined
        };
        
        const todos = await Todo.findAll(filters);
        res.json({ 
            success: true, 
            count: todos.length,
            data: todos 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get single todo
const getTodoById = async (req, res) => {
    try {
        const todo = await Todo.findById(parseInt(req.params.id));
        if (!todo) {
            return res.status(404).json({ success: false, error: 'Todo not found' });
        }
        res.json({ success: true, data: todo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create new todo
const createTodo = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { title, description, priority, due_date } = req.body;
        
        const todo = await Todo.create({ 
            title, 
            description, 
            priority, 
            due_date 
        });
        
        res.status(201).json({ success: true, data: todo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update todo
const updateTodo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const todo = await Todo.update(parseInt(req.params.id), req.body);
        if (!todo) {
            return res.status(404).json({ success: false, error: 'Todo not found' });
        }
        res.json({ success: true, data: todo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete todo
const deleteTodo = async (req, res) => {
    try {
        const todo = await Todo.delete(parseInt(req.params.id));
        if (!todo) {
            return res.status(404).json({ success: false, error: 'Todo not found' });
        }
        res.json({ success: true, message: 'Todo deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Toggle todo completion
const toggleComplete = async (req, res) => {
    try {
        const todo = await Todo.toggleComplete(parseInt(req.params.id));
        if (!todo) {
            return res.status(404).json({ success: false, error: 'Todo not found' });
        }
        res.json({ success: true, data: todo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get statistics
const getStats = async (req, res) => {
    try {
        const stats = await Todo.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Bulk delete completed todos
const deleteCompleted = async (req, res) => {
    try {
        const deleted = await Todo.deleteCompleted();
        res.json({ 
            success: true, 
            message: `${deleted.length} completed todos deleted`,
            deletedCount: deleted.length 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getAllTodos,
    getTodoById,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    getStats,
    deleteCompleted
};