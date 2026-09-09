const { z } = require('zod');

const transferSchema = z.object({
    body: z.object({
        receiver_id: z.number().int().positive('Receiver ID must be a positive integer'),
        amount: z.number().positive('Amount must be greater than 0')
    })
});

module.exports = { transferSchema };
