const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Register new user
const register = async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Create new user
        const user = await User.create({ username, email, password });
        
        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            data: {
                user,
                token
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Login user
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get current user
const getMe = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = { register, login, getMe };