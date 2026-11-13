import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

async function migrate() {
  console.log('🚀 Đang kết nối tới Supabase PostgreSQL để tạo bảng schema...');
  const client = new Client({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432, // Session pooler is ideal for DDL migrations
    user: 'postgres.ewztorukxapprldbybit',
    password: 'Alittlebitch@123',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Đã kết nối cơ sở dữ liệu thành công!');

    const sqlPath = path.resolve('supabase/schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📦 Đang thực thi supabase/schema.sql...');
    await client.query(sql);
    console.log('🎉 TẤT CẢ CÁC BẢNG ĐÃ ĐƯỢC KHỞI TẠO THÀNH CÔNG!');

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Danh sách bảng hiện có trong database public:');
    res.rows.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.table_name}`);
    });

  } catch (err) {
    console.error('❌ Lỗi khi chạy migration:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
