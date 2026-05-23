const { body, param, query } = require('express-validator');

const validation = {
    // Create todo validation
    create: [
        body('title')
            .notEmpty().withMessage('Title is required')
            .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters')
            .trim(),
        body('description')
            .optional()
            .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
            .trim(),
        body('priority')
            .optional()
            .isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
        body('due_date')
            .optional()
            .isISO8601().withMessage('Due date must be a valid date')
            .toDate()
    ],

    // Update todo validation
    update: [
        body('title')
            .optional()
            .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters')
            .trim(),
        body('description')
            .optional()
            .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
            .trim(),
        body('completed')
            .optional()
            .isBoolean().withMessage('Completed must be a boolean'),
        body('priority')
            .optional()
            .isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3'),
        body('due_date')
            .optional()
            .isISO8601().withMessage('Due date must be a valid date')
            .toDate()
    ],

    // ID parameter validation
    idParam: [
        param('id')
            .isInt({ min: 1 }).withMessage('ID must be a positive integer')
            .toInt()
    ],

    // Pagination and filtering validation
    pagination: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
            .toInt(),
        query('offset')
            .optional()
            .isInt({ min: 0 }).withMessage('Offset must be a positive integer')
            .toInt(),
        query('priority')
            .optional()
            .isInt({ min: 1, max: 3 }).withMessage('Priority must be between 1 and 3')
            .toInt(),
        query('completed')
            .optional()
            .isBoolean().withMessage('Completed must be true or false'),
        query('sortBy')
            .optional()
            .isIn(['id', 'title', 'priority', 'due_date', 'created_at', 'updated_at'])
            .withMessage('Invalid sort field'),
        query('sortOrder')
            .optional()
            .isIn(['asc', 'desc'])
            .withMessage('Sort order must be asc or desc')
    ]
};

module.exports = validation;