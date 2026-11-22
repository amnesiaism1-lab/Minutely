import pool, { ApiRequest, ApiResponse, ensureRuntimeSchema } from './_db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(200).json({ ok: false, reason: 'DATABASE_URL_MISSING' });
  }

  const rawSource = Array.isArray(req.query?.source) ? req.query.source[0] : req.query?.source;
  const source = (rawSource || 'cron').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60) || 'cron';

  const client = await pool.connect();
  try {
    await ensureRuntimeSchema(client);

    let heartbeatRow: { last_ping_at: string; ping_count: string | number; last_source: string } | null = null;

    if (source === 'client-visit') {
      // Client visits write at most once per 6 hours to avoid write spam, while always performing a real Postgres read
      const upsertRes = await client.query(
        `INSERT INTO system_heartbeat (id, last_ping_at, ping_count, last_source)
         VALUES (1, NOW(), 1, $1)
         ON CONFLICT (id) DO UPDATE SET
           last_ping_at = NOW(),
           ping_count = system_heartbeat.ping_count + 1,
           last_source = EXCLUDED.last_source
         WHERE system_heartbeat.last_ping_at < NOW() - INTERVAL '6 hours'
         RETURNING last_ping_at, ping_count, last_source;`,
        [source]
      );

      if (upsertRes.rows.length > 0) {
        heartbeatRow = upsertRes.rows[0];
      } else {
        const readRes = await client.query(
          `SELECT last_ping_at, ping_count, last_source FROM system_heartbeat WHERE id = 1;`
        );
        heartbeatRow = readRes.rows[0] || null;
      }
    } else {
      // Scheduled Vercel Cron / GitHub Actions / manual triggers perform a real write + read I/O transaction
      const writeRes = await client.query(
        `INSERT INTO system_heartbeat (id, last_ping_at, ping_count, last_source)
         VALUES (1, NOW(), 1, $1)
         ON CONFLICT (id) DO UPDATE SET
           last_ping_at = NOW(),
           ping_count = system_heartbeat.ping_count + 1,
           last_source = EXCLUDED.last_source
         RETURNING last_ping_at, ping_count, last_source;`,
        [source]
      );
      heartbeatRow = writeRes.rows[0] || null;
    }

    const countRes = await client.query(`SELECT COUNT(*)::int AS total_meetings FROM meetings;`);
    const meetingsCount = countRes.rows[0]?.total_meetings ?? 0;

    return res.status(200).json({
      ok: true,
      status: 'alive',
      heartbeat: heartbeatRow,
      meetingsCount,
    });
  } catch (error: any) {
    console.error('API /api/keepalive error:', error);
    return res.status(500).json({ ok: false, error: error.message });
  } finally {
    client.release();
  }
}
