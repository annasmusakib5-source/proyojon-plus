const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15, 'Phone number must be at most 15 characters'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        sponsor_id: z.string().optional().nullable()
    })
});

const loginSchema = z.object({
    body: z.object({
        phone: z.string().min(10, 'Phone number must be at least 10 characters').max(15, 'Phone number must be at most 15 characters'),
        password: z.string().min(6, 'Password must be at least 6 characters')
    })
});

module.exports = {
    registerSchema,
    loginSchema
};
