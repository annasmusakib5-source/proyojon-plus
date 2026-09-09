/**
 * 30. Global Error Handler Middleware
 * Catches all unhandled errors thrown in controllers/services.
 */
const errorHandler = (err, req, res, next) => {
    console.error('Global Error:', err);

    let statusCode = 500;
    let message = 'An unexpected internal server error occurred.';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    // Map common errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
        errorCode = 'VALIDATION_ERROR';
    } else if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
        statusCode = 401;
        message = 'Invalid or expired token.';
        errorCode = 'UNAUTHORIZED';
    } else if (err.message.includes('not found') || err.name === 'NotFoundError') {
        statusCode = 404;
        message = err.message;
        errorCode = 'NOT_FOUND';
    } else if (err.code === 'ER_DUP_ENTRY') { // MySQL duplicate entry
        statusCode = 409;
        message = 'Duplicate entry found. A record with this information already exists.';
        errorCode = 'DUPLICATE_ENTRY';
    }

    // You can customize further based on specific AppError classes if implemented

    return res.status(statusCode).json({
        success: false,
        message,
        errorCode,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
