const { z } = require('zod');

const withdrawalRequestSchema = z.object({
    body: z.object({
        amount: z.number().positive('Amount must be greater than 0'),
        method: z.enum(['bkash', 'nagad', 'rocket', 'bank'], {
            errorMap: () => ({ message: "method must be one of 'bkash', 'nagad', 'rocket', or 'bank'" })
        }),
        account_number: z.string().min(1, 'Account number is required'),
        account_holder_name: z.string().min(1, 'Account holder name is required')
    })
});

module.exports = { withdrawalRequestSchema };
