const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController.js');
const validation = require('../middleware/validation.js');

// All routes are public (no authentication)

// GET /api/todos - Get all todos with filtering and pagination
router.get('/', validation.pagination, todoController.getAllTodos);

// GET /api/todos/stats - Get statistics
router.get('/stats', todoController.getStats);

// GET /api/todos/:id - Get single todo
router.get('/:id', validation.idParam, todoController.getTodoById);

// POST /api/todos - Create new todo
router.post('/', validation.create, todoController.createTodo);

// PUT /api/todos/:id - Update todo
router.put('/:id', validation.idParam, validation.update, todoController.updateTodo);

// PATCH /api/todos/:id/toggle - Toggle completion
router.patch('/:id/toggle', validation.idParam, todoController.toggleComplete);

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', validation.idParam, todoController.deleteTodo);

// DELETE /api/todos/completed/delete-all - Delete all completed todos
router.delete('/completed/delete-all', todoController.deleteCompleted);

module.exports = router;