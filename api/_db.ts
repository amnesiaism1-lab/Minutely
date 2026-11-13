import pg from 'pg';
const { Pool } = pg;

// Cho phép kết nối TLS qua Supavisor Pooler khi cần
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    '[api/_db] DATABASE_URL environment variable is missing. Set DATABASE_URL in .env or Vercel Environment Variables.'
  );
}

const pool = new Pool({
  connectionString: connectionString || undefined,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

export default pool;
