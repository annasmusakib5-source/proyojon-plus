const db = require('../config/db');
const { distributeGenerationBonus, distributeGlobalPV } = require('../services/commissionService');

/**
 * POST /api/orders
 * Protected: Create a new order from cart items
 * Body: { items: [{ productId, quantity }], shippingName, shippingPhone, shippingAddress, shippingDistrict, paymentMethod }
 */
const createOrder = async (req, res) => {
    const userId = req.user.id;
    const { items, shippingName, shippingPhone, shippingAddress, shippingDistrict, paymentMethod } = req.body;

    // --- Validation ---
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart items are required.' });
    }
    if (!shippingName || !shippingPhone || !shippingAddress) {
        return res.status(400).json({ success: false, message: 'Shipping name, phone, and address are required.' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validate all products and calculate totals
        let totalPrice = 0;
        let totalPv = 0;
        const orderItems = [];

        for (const item of items) {
            const [products] = await connection.execute(
                'SELECT id, name, price, pv_value, stock, status FROM products WHERE id = ? AND status = ? FOR UPDATE',
                [item.productId, 'active']
            );

            if (products.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ success: false, message: `Product ID ${item.productId} is not available.` });
            }

            const product = products[0];
            const quantity = parseInt(item.quantity) || 1;

            if (product.stock < quantity) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}` 
                });
            }

            const itemPrice = parseFloat(product.price) * quantity;
            const itemPv = parseFloat(product.pv_value) * quantity;
            totalPrice += itemPrice;
            totalPv += itemPv;

            orderItems.push({
                productId: product.id,
                quantity,
                unitPrice: parseFloat(product.price),
                unitPv: parseFloat(product.pv_value)
            });

            // Decrement stock
            await connection.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [quantity, product.id]
            );
        }

        // 2. Create the order
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (user_id, total_price, total_pv, status, shipping_name, shipping_phone, shipping_address, shipping_district, payment_method, created_at, updated_at)
             VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
            [userId, totalPrice, totalPv, shippingName, shippingPhone, shippingAddress, shippingDistrict || null, paymentMethod || 'cash_on_delivery']
        );
        const orderId = orderResult.insertId;

        // 3. Insert order items
        for (const item of orderItems) {
            await connection.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_pv) VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.productId, item.quantity, item.unitPrice, item.unitPv]
            );
        }

        await connection.commit();
        connection.release();

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully! Admin will review your order shortly.',
            data: {
                orderId,
                totalPrice,
                totalPv,
                itemCount: orderItems.length
            }
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Create Order Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create order.' });
    }
};

/**
 * GET /api/orders
 * Protected: Get current user's order history
 */
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]
        );
        const total = countResult[0].total;

        // Get orders
        const [orders] = await db.execute(
            `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), offset]
        );

        // Get items for each order
        for (const order of orders) {
            const [items] = await db.execute(
                `SELECT oi.*, p.name as product_name, p.slug as product_slug, p.image_url 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Get Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
};

/**
 * GET /api/orders/:id
 * Protected: Get single order details
 */
const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;

        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orders[0];

        const [items] = await db.execute(
            `SELECT oi.*, p.name as product_name, p.slug as product_slug, p.image_url 
             FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
            [orderId]
        );
        order.items = items;

        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Get Order Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch order.' });
    }
};

// ========================
// ADMIN ORDER MANAGEMENT
// ========================

/**
 * GET /api/admin/orders
 * Admin: List all orders with filters
 */
const adminGetAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `SELECT o.*, u.phone as user_phone 
                      FROM orders o 
                      JOIN users u ON o.user_id = u.id 
                      WHERE 1=1`;
        const params = [];

        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        const countQuery = query.replace(/SELECT o\.\*, u\.phone as user_phone/, 'SELECT COUNT(*) as total');
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [orders] = await db.execute(query, params);

        // Get items for each order
        for (const order of orders) {
            const [items] = await db.execute(
                `SELECT oi.*, p.name as product_name FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`,
                [order.id]
            );
            order.items = items;
        }

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Admin Get Orders Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
    }
};

/**
 * PUT /api/admin/orders/:id/status
 * Admin: Update order status. When delivered, auto-credit PV to user's monthly_accumulated_pv
 * Body: { status, admin_note }
 */
const updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status, admin_note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [orders] = await connection.execute(
            'SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        const order = orders[0];

        // Update order status
        await connection.execute(
            `UPDATE orders SET status = ?, admin_note = ?, updated_at = NOW(3) WHERE id = ?`,
            [status, admin_note || order.admin_note, orderId]
        );

        // If status is 'confirmed' (or later) and PV not yet credited, credit PV to user
        if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status) && !order.pv_credited) {
            // --- Dealer Commission Logic ---
            const [users] = await connection.execute(
                'SELECT is_dealer FROM users WHERE id = ?',
                [order.user_id]
            );

            if (users.length > 0 && users[0].is_dealer) {
                const [items] = await connection.execute(
                    `SELECT oi.quantity, oi.unit_price, p.dealer_commission_percentage 
                     FROM order_items oi 
                     JOIN products p ON oi.product_id = p.id 
                     WHERE oi.order_id = ?`,
                    [orderId]
                );

                let dealerCommission = 0;
                for (const item of items) {
                    const commissionPercent = parseFloat(item.dealer_commission_percentage) || 5.0;
                    dealerCommission += (parseFloat(item.unit_price) * item.quantity * (commissionPercent / 100));
                }

                if (dealerCommission > 0) {
                    await connection.execute(
                        'UPDATE wallets SET current_balance = current_balance + ?, total_income = total_income + ? WHERE user_id = ?',
                        [dealerCommission, dealerCommission, order.user_id]
                    );

                    await connection.execute(
                        `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                         VALUES (?, ?, 'credit', 'deposit', ?, 'current_balance', ?, NOW(3))`,
                        [order.user_id, dealerCommission, `Dealer commission for Order #${orderId}`, orderId]
                    );
                }
            }
            // --- End Dealer Commission Logic ---

            const totalPv = parseFloat(order.total_pv);

            if (totalPv > 0) {
                // Credit PV to ALL active Customer packages for this user
                await connection.execute(
                    `UPDATE user_packages SET monthly_accumulated_pv = monthly_accumulated_pv + ? 
                     WHERE user_id = ? AND status = 'active'`,
                    [totalPv, order.user_id]
                );

                // Add to user's total accumulated PV (for inactive users trying to activate)
                await connection.execute(
                    `UPDATE users SET accumulated_pv = accumulated_pv + ? WHERE id = ?`,
                    [totalPv, order.user_id]
                );

                // Check user's current status and PV for auto-activations
                const [users] = await connection.execute(
                    'SELECT status, accumulated_pv, sp, gp FROM users WHERE id = ?',
                    [order.user_id]
                );

                if (users.length > 0) {
                    const currentStatus = users[0].status;
                    const currentPV = parseFloat(users[0].accumulated_pv);
                    const currentSP = parseFloat(users[0].sp || 0);
                    const currentGP = parseFloat(users[0].gp || 0);

                    // 1. Account Auto-Activation (100 PV) - No PV Deduction
                    if (currentStatus === 'inactive' && currentPV >= 100) {
                        await connection.execute(
                            `UPDATE users SET status = 'active' WHERE id = ?`,
                            [order.user_id]
                        );

                        await connection.execute(
                            `INSERT INTO user_activity_logs (user_id, action, description, created_at)
                             VALUES (?, 'AUTO_ACTIVATION', 'ID automatically activated after accumulating 100+ PV', NOW(3))`,
                            [order.user_id]
                        );
                    }

                    // Helper to auto activate package
                    const autoActivatePackage = async (packageId, packageType, thresholdDesc) => {
                        const [activePackages] = await connection.execute(
                            `SELECT id FROM user_packages WHERE user_id = ? AND package_id = ? AND status = 'active'`,
                            [order.user_id, packageId]
                        );

                        if (activePackages.length === 0) {
                            let expiresAt = null;
                            if (packageId === 1) { // Customer
                                expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
                            } else if (packageId === 3) { // Gold
                                expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000));
                            }
                            
                            if (expiresAt) {
                                await connection.execute(
                                    `INSERT INTO user_packages (user_id, package_id, status, activated_at, expires_at) 
                                     VALUES (?, ?, 'active', NOW(3), ?)`,
                                    [order.user_id, packageId, expiresAt]
                                );
                            } else {
                                await connection.execute(
                                    `INSERT INTO user_packages (user_id, package_id, status, activated_at, expires_at) 
                                     VALUES (?, ?, 'active', NOW(3), NULL)`,
                                    [order.user_id, packageId]
                                );
                            }

                            await connection.execute(
                                `INSERT INTO user_activity_logs (user_id, action, description, created_at)
                                 VALUES (?, 'PACKAGE_ACTIVATION', ?, NOW(3))`,
                                [order.user_id, `${packageType} Package automatically activated after accumulating ${thresholdDesc}`]
                            );
                        }
                    };

                    // 2. Customer Package Auto-Activation (1000 PV)
                    if (currentPV >= 1000) {
                        await autoActivatePackage(1, 'Customer', '1000+ PV');
                    }
                    
                    // 3. Shareholder Package Auto-Activation (5000 SP)
                    if (currentSP >= 5000) {
                        await autoActivatePackage(2, 'Shareholder', '5000+ SP');
                    }
                    
                    // 4. Gold Package Auto-Activation (5000 GP)
                    if (currentGP >= 5000) {
                        await autoActivatePackage(3, 'Gold', '5000+ GP');
                    }
                }

                // Mark PV as credited on this order
                await connection.execute(
                    'UPDATE orders SET pv_credited = 1 WHERE id = ?', [orderId]
                );

                // Log transaction
                await connection.execute(
                    `INSERT INTO transactions (user_id, amount, type, category, description, wallet_field, reference_id, created_at)
                     VALUES (?, ?, 'credit', 'deposit', ?, 'pv_points', ?, NOW(3))`,
                    [order.user_id, totalPv, `PV credited from Order #${orderId} (${totalPv} PV)`, orderId]
                );

                // --- NEW AUTO DISTRIBUTION LOGIC AS REQUESTED ---
                // Trigger 5% Generation Bonus
                await distributeGenerationBonus(connection, order.user_id, totalPv);

                // Trigger Global Distribution across all 7 clubs based on percentage
                await distributeGlobalPV(connection, totalPv, req.user.id, `Order-${orderId}`);
            }
        }

        // If cancelled, restore stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
            const [items] = await connection.execute(
                'SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]
            );
            for (const item of items) {
                await connection.execute(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
        }

        await connection.commit();
        connection.release();

        return res.status(200).json({
            success: true,
            message: `Order #${orderId} status updated to "${status}".${status === 'delivered' && !order.pv_credited ? ` ${parseFloat(order.total_pv)} PV credited to user.` : ''}`
        });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Update Order Status Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update order status.' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    adminGetAllOrders,
    updateOrderStatus
};
