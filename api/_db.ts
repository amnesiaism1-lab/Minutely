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
 * Ensures meeting_payload JSONB aggregate, single-row system_heartbeat,
 * and Master Data tables (workspace_settings, directory_members, member_groups) exist.
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

    CREATE TABLE IF NOT EXISTS workspace_settings (
      id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      org_name VARCHAR(500) NOT NULL DEFAULT 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
      governing_body VARCHAR(500) DEFAULT '',
      enterprise_code VARCHAR(100) DEFAULT '',
      address TEXT DEFAULT '',
      default_city VARCHAR(100) DEFAULT 'Hà Nội',
      departments TEXT[] DEFAULT ARRAY[]::TEXT[],
      venues JSONB DEFAULT '[]'::jsonb,
      default_secretary_id VARCHAR(100) DEFAULT NULL,
      default_distribution JSONB DEFAULT '{"forAction": [], "forInfo": []}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS directory_members (
      id VARCHAR(100) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) DEFAULT '',
      title VARCHAR(255) DEFAULT 'Thành viên',
      department VARCHAR(255) DEFAULT '',
      organization_name VARCHAR(255) DEFAULT '',
      member_type VARCHAR(50) DEFAULT 'internal',
      default_role VARCHAR(50) DEFAULT 'member',
      shares_count BIGINT DEFAULT 0,
      capital_ratio NUMERIC(5, 2) DEFAULT 0,
      is_sample BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS member_groups (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      default_template_id VARCHAR(50) DEFAULT 'tpl-a1',
      default_venue VARCHAR(255) DEFAULT '',
      member_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      chairperson_id VARCHAR(100) DEFAULT NULL,
      secretary_id VARCHAR(100) DEFAULT NULL,
      default_agendas TEXT[] DEFAULT ARRAY[]::TEXT[],
      is_sample BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  isSchemaEnsured = true;
}

export default pool;
