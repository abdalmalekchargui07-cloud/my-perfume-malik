const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// مشاركة الملفات الثابتة من المجلد الرئيسي
app.use(express.static(__dirname));

// حل سحري ومضمون لقراءة ملف الواجهة على السيرفرات السحابية
app.get('/', (req, res) => {
    // نبحث عن الملف بأكثر من طريقة للتأكد من تشغيله
    res.sendFile('index.html', { root: __dirname }, (err) => {
        if (err) {
            // إذا لم يجده، نحاول قراءته بحروف صغيرة وكبيرة لضمان التشغيل
            res.sendFile('Index.html', { root: __dirname }, (err2) => {
                if (err2) {
                    res.status(404).send("لم يتم العثور على ملف index.html في المجلد الرئيسي للمشروع، يرجى التأكد من تسميته بشكل صحيح.");
                }
            });
        }
    });
});

app.get('/admin', (req, res) => {
    res.sendFile('admin.html', { root: __dirname }, (err) => {
        if (err) {
            // إذا كان اسم الملف لديك dashboard.html جرب قراءته هنا
            res.sendFile('dashboard.html', { root: __dirname }, (err2) => {
                if (err2) {
                    res.status(404).send("لم يتم العثور على ملف لوحة التحكم، تأكد من وجود الملف وتسميته الصحيحة في المجلد.");
                }
            });
        }
    });
});

// الاتصال بقاعدة البيانات على المنفذ 3307
const db = mysql.createConnection({
    host: 'mysql-23a1db40-abdalmalekchargui07-5242.f.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_ArdUB-UdqrKydISdaRK',
    port: 18683,
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

// الاتصال وإنشاء الجدول تلقائياً إذا كان ناقصاً
db.connect((err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بـ MySQL:', err.message);
    } else {
        console.log('✅ تم الاتصال بقاعدة بيانات بنجاح!');
        
        // كود إنشاء جدول الطلبات تلقائياً لحل مشكلة (Table doesn't exist)
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                client_phone VARCHAR(50) NOT NULL,
                client_city VARCHAR(255) NOT NULL,
                cart_data TEXT NOT NULL,
                subtotal INT NOT NULL,
                shipping INT NOT NULL,
                total_price INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        db.query(createTableSql, (tableErr) => {
            if (tableErr) {
                console.error('❌ خطأ أثناء محاولة إنشاء جدول orders:', tableErr.message);
            } else {
                console.log('📦 جدول orders جاهز ومؤمن في قاعدة البيانات!');
            }
        });
    }
});

// استقبال طلبات جلب المنتجات حسب النوع
app.get('/api/products', (req, res) => {
    const category = req.query.category; 
    let sql = 'SELECT * FROM products';
    let params = [];

    if (category === 'best-seller') {
        sql = "SELECT * FROM products WHERE category LIKE 'best-seller-%'";
    } else if (category === 'nos-parfums') {
        sql = "SELECT * FROM products WHERE category LIKE 'nos-parfums-%'";
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// استقبال طلبات إضافة منتج جديد
app.post('/api/products', (req, res) => {
    const { name, price, category, image_url } = req.body;
    const final_image = image_url && image_url.trim() !== '' ? image_url : '3.jpeg';
    const sql = 'INSERT INTO products (name, price, category, image_url) VALUES (?, ?, ?, ?)';

    db.query(sql, [name, price, category, final_image], (err, result) => {
        if (err) {
            console.error('❌ خطأ أثناء الحفظ في الجدول:', err.message);
            return res.status(500).send(err);
        }
        res.status(200).send({ message: 'تم حفظ المنتج والصورة بنجاح!' });
    });
});

// حذف منتج
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200);
    });
});

// --- كود نظام إشعارات الواتساب الفوري ---
// --- كود نظام إشعارات الواتساب الفوري المطور ---
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const QRCodeImage = require('qrcode'); // تأكد من تثبيتها عبر npm i qrcode

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log('\n📱 === جاري تحديث صورة الـ QR للواتساب ===\n');
            // حفظ الكود كصورة واضحة في المجلد الرئيسي للمشروع
            try {
                await QRCodeImage.toFile('./qr.png', qr);
                console.log('✅ تم حفظ الكود بنجاح كصورة! يمكنك رؤيتها الآن عبر الرابط: your-site.onrender.com/get-qr');
            } catch (err) {
                console.error('خطأ في توليد صورة QR:', err);
            }
        }
        
        if (connection === 'close') {
            console.log('🔄 جاري إعادة الاتصال بالواتساب...');
            connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ سيرفر الواتساب متصل الآن وجاهز لإرسال الطلبات في الخلفية!');
            // حذف الصورة بعد الاتصال الناجح للأمان
            if (fs.existsSync('./qr.png')) fs.unlinkSync('./qr.png');
        }
    });
}

// مسار سري ومؤقت لفتح الصورة ومسحها من الهاتف
app.get('/get-qr', (req, res) => {
    const qrPath = path.join(__dirname, 'qr.png');
    if (fs.existsSync(qrPath)) {
        res.sendFile(qrPath);
    } else {
        res.send("<h1>الواتساب متصل بالفعل أو لم يتم توليد الكود بعد. إذا كان منفصلاً، انتظر دقيقة وأعد تحديث الصفحة.</h1>");
    }
});

// تشغيل الواتساب تلقائياً
connectToWhatsApp();

// تشغيل الواتساب تلقائياً
connectToWhatsApp();

// مسار استقبال الطلبات وحفظها ثم إرسالها للواتساب
app.post('/api/orders', (req, res) => {
    const { client_name, client_phone, client_city, cart, subtotal, shipping, total_price } = req.body;

    const sql = 'INSERT INTO orders (client_name, client_phone, client_city, cart_data, subtotal, shipping, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const cartJson = JSON.stringify(cart);

    db.query(sql, [client_name, client_phone, client_city, cartJson, subtotal, shipping, total_price], async (err, result) => {
        if (err) {
            console.error('❌ خطأ في حفظ الطلب في قاعدة البيانات:', err.message);
            return res.status(500).send('خطأ في قاعدة البيانات');
        }

        let productsDetails = "";
        if (cart && cart.length > 0) {
            productsDetails = cart.map(item => `- ${item.name} (الكمية: ${item.quantity})`).join('\n');
        }

        const messageText = `🔔 *طلب جديد في المتجر!* 👑\n\n` +
                            `👤 *الزبون:* ${client_name}\n` +
                            `📞 *الهاتف:* ${client_phone}\n` +
                            `📍 *العنوان/المدينة:* ${client_city}\n` +
                            `🛍️ *المنتجات المطلوبة:*\n${productsDetails}\n\n` +
                            `💰 *الثمن الإجمالي:* ${total_price} درهم`;

        const myNumber = "212630451926@s.whatsapp.net"; 

        try {
            if (sock) {
                await sock.sendMessage(myNumber, { text: messageText });
                console.log("✅ تم إرسال إشعار الواتساب بنجاح");
            }
            res.status(200).send({ success: true, message: 'تم تسجيل الطلب وإرسال الإشعار بنجاح!' });
        } catch (error) {
            console.error("❌ خطأ في إرسال الواتساب:", error);
            res.status(200).send({ success: true, message: "تم تسجيل الطلب في قاعدة البيانات." });
        }
    });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});