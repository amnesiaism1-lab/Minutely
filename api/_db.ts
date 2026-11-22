import pg from 'pg';

const { Pool } = pg;

// Cho phép kết nối TLS qua Supavisor Pooler khi cần
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  setHeader(name: string, value: string): ApiResponse | void;
  status(code: number): ApiResponse;
  json(data: any): ApiResponse | void;
  end(): ApiResponse | void;
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
  max: 5,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 8000,
});

let isSchemaEnsured = false;

/**
 * Idempotent schema migration guard executed at most once per warm container.
 * Ensures meeting_payload JSONB aggregate and single-row system_heartbeat exist.
 */
export async function ensureRuntimeSchema(client: pg.PoolClient): Promise<void> {
  if (isSchemaEnsured) return;
  await client.query(`
    ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_payload JSONB DEFAULT NULL;
    CREATE TABLE IF NOT EXISTS system_heartbeat (
      id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ping_count BIGINT NOT NULL DEFAULT 1,
      last_source VARCHAR(100) DEFAULT 'init'
    );
  `);
  isSchemaEnsured = true;
}

export default pool;
