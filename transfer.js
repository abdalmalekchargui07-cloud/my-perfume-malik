const mysql = require('mysql2'); // أو mysql2 إذا كنت تستخدمها

// 1. الاتصال بقاعدة بياناتك القديمة (XAMPP)
const localDb = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'perfume_malik_db',
    port: 3307   // البورت الخاص بجهازك كما يظهر في الصورة
});

// 2. الاتصال بقاعدة البيانات الجديدة (Aiven)
const remoteDb = mysql.createConnection({
    host: 'mysql-23a1db40-abdalmalekchargui07-5242.f.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_ArdUB-UdqrKydISdaRK', // ⚠️ لا تنسَ وضع كلمة المرور الخاصة بـ Aiven هنا
    port: 18683,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

console.log("جاري الاتصال بقواعد البيانات...");

localDb.connect(err => {
    if (err) return console.error("خطأ في الاتصال بالـ Localhost:", err);
    console.log("✅ تم الاتصال بجهازك (Localhost)");

    remoteDb.connect(err => {
        if (err) return console.error("خطأ في الاتصال بـ Aiven:", err);
        console.log("✅ تم الاتصال بالإنترنت (Aiven)");

        // إنشاء نفس جدول products في Aiven
        remoteDb.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT PRIMARY KEY,
                name VARCHAR(255),
                price VARCHAR(50),
                category VARCHAR(255),
                old_price VARCHAR(50),
                image_url VARCHAR(255)
            )
        `, (err) => {
            if (err) return console.error("خطأ في إنشاء الجدول:", err);
            
            // جلب العطور من جهازك
            localDb.query("SELECT * FROM products", (err, rows) => {
                if (err) throw err;
                console.log(`📦 تم العثور على ${rows.length} عطراً في جهازك، جاري نقلها...`);

                let inserted = 0;
                rows.forEach(row => {
                    // إدخال كل عطر في Aiven
                    remoteDb.query("INSERT IGNORE INTO products SET ?", row, (err) => {
                        if (err) console.error("خطأ في نقل عطر:", err);
                        inserted++;
                        if (inserted === rows.length) {
                            console.log("🎉 مبروك! تمت عملية نقل جميع العطور الحقيقية بنجاح إلى الإنترنت.");
                            process.exit();
                        }
                    });
                });
            });
        });
    });
});