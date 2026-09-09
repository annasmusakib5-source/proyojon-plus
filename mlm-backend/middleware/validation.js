/**
 * 28. Validation Middleware (Zod)
 * Validates request body, query, and params against a Zod schema
 */
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errorCode: 'VALIDATION_ERROR',
            details: error.errors ? error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            })) : [{ message: error.message || 'Unknown validation error' }]
        });
    }
};

module.exports = { validate };
