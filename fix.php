<?php
// البيانات مستخرجة مباشرة من سيرفر Aiven الخاص بك
$host = 'mysql-23a1db40-abdalmalekchargui07-5242.f.aivencloud.com'; 
$port = '18683';
$user = 'avnadmin';
$password = 'AVNS_ArdUB-UdqrKydISdaRK';
$dbname = 'defaultdb';

try {
    // الاتصال الآمن بالسيرفر السحابي
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname";
    $pdo = new PDO($dsn, $user, $password, array(
        PDO::MYSQL_ATTR_SSL_CA => true,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ));
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // أمر إصلاح حقل المعرف id ليصبح تلقائي الزيادة
    $sql = "ALTER TABLE products MODIFY id INT AUTO_INCREMENT;";
    $pdo->exec($sql);
    
    echo "<div style='text-align:center; margin-top:50px; font-family:Arial;'>";
    echo "<h1 style='color: #28a745;'>✅ تم إصلاح قاعدة البيانات السحابية بنجاح!</h1>";
    echo "<p style='font-size:18px; color:#555;'>يمكنك الآن الذهاب للوحة التحكم وإضافة العطور الحقيقية بحرية كاملة.</p>";
    echo "</div>";
} catch (PDOException $e) {
    echo "<div style='text-align:center; margin-top:50px; font-family:Arial; dir:rtl;'>";
    echo "<h1 style='color: #dc3545;'>❌ حدث خطأ أثناء الاتصال:</h1>";
    echo "<p style='font-size:16px; color:red;'>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>