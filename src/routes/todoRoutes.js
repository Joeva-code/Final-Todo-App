const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController.js');
const validation = require('../middleware/validation.js');
const authMiddleware = require('../middleware/authMiddleware.js');

// Apply authentication middleware to ALL todo routes
router.use(authMiddleware);

// Routes (all protected)
router.get('/', validation.pagination, todoController.getAllTodos);
router.get('/stats', todoController.getStats);
router.get('/:id', validation.idParam, todoController.getTodoById);
router.post('/', validation.create, todoController.createTodo);
router.put('/:id', validation.idParam, validation.update, todoController.updateTodo);
router.patch('/:id/toggle', validation.idParam, todoController.toggleComplete);
router.delete('/:id', validation.idParam, todoController.deleteTodo);

module.exports = router;