/**
 * E-Commerce Migration Script
 * Creates: orders, order_items, dealer_applications, notices, gallery_images tables
 * Alters: products table (add new columns)
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection(
        process.env.DATABASE_URL || {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mlm_db',
            port: process.env.DB_PORT || 3306,
        }
    );

    console.log('🔌 Connected to MySQL database.');

    try {
        // ========================
        // 1. ALTER products table - add new columns
        // ========================
        console.log('\n📦 Altering products table...');
        
        // Check if 'slug' column already exists
        const [slugCols] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'slug'`
        );
        
        if (slugCols.length === 0) {
            await connection.execute(`
                ALTER TABLE products 
                ADD COLUMN slug VARCHAR(255) NULL AFTER name,
                ADD COLUMN category ENUM('healthcare','grocery','organic','cosmetics','accessories','other') NOT NULL DEFAULT 'other' AFTER slug,
                ADD COLUMN description TEXT NULL AFTER dealer_commission_percentage,
                ADD COLUMN image_url VARCHAR(500) NULL AFTER description,
                ADD COLUMN stock INT NOT NULL DEFAULT 0 AFTER image_url,
                ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER stock,
                ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER created_at
            `);

            // Generate slugs from existing product names
            const [existingProducts] = await connection.execute('SELECT id, name FROM products');
            for (const p of existingProducts) {
                const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                await connection.execute('UPDATE products SET slug = ? WHERE id = ?', [slug, p.id]);
            }

            // Make slug NOT NULL and UNIQUE
            await connection.execute('ALTER TABLE products MODIFY COLUMN slug VARCHAR(255) NOT NULL');
            await connection.execute('ALTER TABLE products ADD UNIQUE INDEX idx_products_slug (slug)');
            
            // Add performance indexes
            await connection.execute('ALTER TABLE products ADD INDEX idx_products_category (category)');
            await connection.execute('ALTER TABLE products ADD INDEX idx_products_status (status)');
            await connection.execute('ALTER TABLE products ADD INDEX idx_products_is_featured (is_featured)');
            
            console.log('   ✅ Products table altered successfully.');
        } else {
            console.log('   ⏭️ Products table already has slug column, skipping ALTER.');
        }

        // ========================
        // 2. CREATE orders table
        // ========================
        console.log('\n🛒 Creating orders table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_price DECIMAL(15, 2) NOT NULL,
                total_pv DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
                shipping_name VARCHAR(100) NOT NULL,
                shipping_phone VARCHAR(15) NOT NULL,
                shipping_address TEXT NOT NULL,
                shipping_district VARCHAR(100) NULL,
                payment_method VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery',
                admin_note TEXT NULL,
                pv_credited TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                INDEX idx_orders_user_id (user_id),
                INDEX idx_orders_status (status),
                INDEX idx_orders_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Orders table created.');

        // ========================
        // 3. CREATE order_items table
        // ========================
        console.log('\n📋 Creating order_items table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(15, 2) NOT NULL,
                unit_pv DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
                CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                INDEX idx_order_items_order_id (order_id),
                INDEX idx_order_items_product_id (product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Order items table created.');

        // ========================
        // 4. CREATE dealer_applications table
        // ========================
        console.log('\n🏪 Creating dealer_applications table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS dealer_applications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                shop_name VARCHAR(255) NOT NULL,
                shop_address TEXT NOT NULL,
                district VARCHAR(100) NOT NULL,
                division VARCHAR(100) NULL,
                nid_number VARCHAR(20) NULL,
                status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
                admin_note TEXT NULL,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                CONSTRAINT fk_dealer_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                INDEX idx_dealer_applications_user_id (user_id),
                INDEX idx_dealer_applications_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Dealer applications table created.');

        // ========================
        // 5. CREATE notices table
        // ========================
        console.log('\n📢 Creating notices table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS notices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                is_ticker TINYINT(1) NOT NULL DEFAULT 0,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                INDEX idx_notices_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Notices table created.');

        // ========================
        // 6. CREATE gallery_images table
        // ========================
        console.log('\n🖼️ Creating gallery_images table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS gallery_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                image_url VARCHAR(500) NOT NULL,
                category VARCHAR(100) NULL,
                sort_order INT NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                INDEX idx_gallery_images_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Gallery images table created.');

        // ========================
        // 7. SEED sample products (if products table is empty or has few items)
        // ========================
        console.log('\n🌱 Seeding sample products...');
        const [productCount] = await connection.execute('SELECT COUNT(*) as cnt FROM products');
        
        if (productCount[0].cnt < 5) {
            const sampleProducts = [
                { name: 'Organic Honey (500g)', slug: 'organic-honey-500g', category: 'organic', price: 450.00, pv: 15, desc: 'Pure organic honey collected from Sundarbans. Rich in antioxidants and natural enzymes.', stock: 100, featured: true },
                { name: 'Herbal Neem Soap', slug: 'herbal-neem-soap', category: 'cosmetics', price: 120.00, pv: 5, desc: 'Natural neem soap for clear and healthy skin. Antibacterial and antifungal properties.', stock: 200, featured: true },
                { name: 'Black Seed Oil (250ml)', slug: 'black-seed-oil-250ml', category: 'healthcare', price: 550.00, pv: 20, desc: 'Premium cold-pressed black seed oil (Kalonji). Boosts immunity and aids digestion.', stock: 80, featured: true },
                { name: 'Premium Green Tea (100 bags)', slug: 'premium-green-tea-100bags', category: 'grocery', price: 350.00, pv: 10, desc: 'Imported premium green tea bags. Rich in catechins for heart health and weight management.', stock: 150, featured: true },
                { name: 'Aloe Vera Gel (200ml)', slug: 'aloe-vera-gel-200ml', category: 'cosmetics', price: 180.00, pv: 8, desc: 'Pure aloe vera gel for skin hydration and sunburn relief. 99% natural ingredients.', stock: 120, featured: false },
                { name: 'Turmeric Powder (Pure - 500g)', slug: 'turmeric-powder-pure-500g', category: 'grocery', price: 220.00, pv: 7, desc: 'Organically grown pure turmeric powder. High curcumin content for anti-inflammatory benefits.', stock: 200, featured: false },
                { name: 'Moringa Capsules (60 caps)', slug: 'moringa-capsules-60', category: 'healthcare', price: 650.00, pv: 25, desc: 'Superfood moringa leaf extract capsules. Rich in vitamins, minerals, and amino acids.', stock: 60, featured: true },
                { name: 'Coconut Oil (Cold Pressed - 500ml)', slug: 'coconut-oil-cold-pressed-500ml', category: 'organic', price: 380.00, pv: 12, desc: 'Virgin cold-pressed coconut oil. Perfect for cooking, skin care, and hair treatment.', stock: 90, featured: false },
                { name: 'Handmade Leather Wallet', slug: 'handmade-leather-wallet', category: 'accessories', price: 850.00, pv: 30, desc: 'Premium handcrafted genuine leather wallet with multiple card slots and coin pocket.', stock: 50, featured: true },
                { name: 'Organic Apple Cider Vinegar (500ml)', slug: 'organic-apple-cider-vinegar-500ml', category: 'healthcare', price: 420.00, pv: 15, desc: 'Raw, unfiltered apple cider vinegar with mother. Aids digestion and detoxification.', stock: 75, featured: false },
            ];

            for (const p of sampleProducts) {
                // Check if slug already exists
                const [existing] = await connection.execute('SELECT id FROM products WHERE slug = ?', [p.slug]);
                if (existing.length === 0) {
                    await connection.execute(
                        `INSERT INTO products (name, slug, category, price, pv_value, description, stock, is_featured, status, dealer_commission_percentage, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', 5.00, NOW(3), NOW(3))`,
                        [p.name, p.slug, p.category, p.price, p.pv, p.desc, p.stock, p.featured ? 1 : 0]
                    );
                    console.log(`   🌱 Seeded: ${p.name}`);
                }
            }
        } else {
            console.log('   ⏭️ Products already seeded, skipping.');
        }

        // ========================
        // 8. SEED sample notices
        // ========================
        console.log('\n📢 Seeding sample notices...');
        const [noticeCount] = await connection.execute('SELECT COUNT(*) as cnt FROM notices');
        if (noticeCount[0].cnt === 0) {
            const notices = [
                { title: 'মেয়াদ শেষ হওয়ার আগেই ১০০ PV পয়েন্ট সম্পন্ন করুন', isTicker: true },
                { title: 'প্রয়োজন প্লাসে স্বাগতম! আজই রেজিস্ট্রেশন করুন এবং আয় শুরু করুন', isTicker: true },
                { title: 'নতুন প্রোডাক্ট যুক্ত হয়েছে - এখনই শপ ভিজিট করুন', isTicker: true },
            ];
            for (const n of notices) {
                await connection.execute(
                    `INSERT INTO notices (title, is_active, is_ticker, created_at, updated_at) VALUES (?, 1, ?, NOW(3), NOW(3))`,
                    [n.title, n.isTicker ? 1 : 0]
                );
            }
            console.log('   ✅ Sample notices seeded.');
        }

        console.log('\n🎉 Migration completed successfully!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
