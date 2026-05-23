const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide a valid token.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found. Invalid token.'
            });
        }

        // Attach user to request object
        req.user = user;
        req.userId = decoded.userId;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token. Please login again.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please login again.'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Authentication error: ' + error.message
        });
    }
};

module.exports = authMiddleware;