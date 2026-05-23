const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Something went wrong!';
    
    res.status(status).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`
    });
};

module.exports = { errorHandler, notFound };