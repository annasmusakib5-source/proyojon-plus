const { z } = require('zod');

const purchaseSchema = z.object({
    body: z.object({
        package_type: z.enum(['customer', 'shareholder', 'gold'], {
            errorMap: () => ({ message: "package_type must be one of 'customer', 'shareholder', or 'gold'" })
        })
    })
});

module.exports = { purchaseSchema };
