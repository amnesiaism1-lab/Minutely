import pg from 'pg';
const { Pool } = pg;

// Cho phép kết nối TLS qua Supavisor Pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres.ewztorukxapprldbybit:Alittlebitch%40123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;
