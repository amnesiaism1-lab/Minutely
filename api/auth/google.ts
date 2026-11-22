import pool, { ApiRequest, ApiResponse, ensureRuntimeSchema } from '../_db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { googleId, email, name, avatarUrl } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: 'Missing required user fields' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(200).json({
      success: true,
      user: {
        id: googleId || `usr-${Date.now()}`,
        googleId,
        email,
        name,
        avatarUrl,
        role: 'chairperson',
        title: 'Lãnh đạo / Chủ tọa',
      },
    });
  }

  const client = await pool.connect();
  try {
    await ensureRuntimeSchema(client);

    const upsertRes = await client.query(
      `INSERT INTO users (google_id, email, full_name, avatar_url, role, title)
       VALUES ($1, $2, $3, $4, 'chairperson', 'Lãnh đạo / Chủ tọa')
       ON CONFLICT (email) 
       DO UPDATE SET 
         full_name = EXCLUDED.full_name,
         avatar_url = EXCLUDED.avatar_url,
         google_id = COALESCE(EXCLUDED.google_id, users.google_id),
         updated_at = NOW()
       RETURNING *;`,
      [googleId || null, email, name, avatarUrl || null]
    );

    const user = upsertRes.rows[0];

    // Tự động đồng bộ tài khoản thực vào Danh bạ Nhân sự nếu chưa có email này
    const existingDir = await client.query(
      `SELECT id FROM directory_members WHERE LOWER(email) = LOWER($1) LIMIT 1;`,
      [email]
    );
    if (existingDir.rows.length === 0) {
      await client.query(
        `INSERT INTO directory_members (
          id, full_name, email, title, department, member_type, default_role, is_sample, updated_at
        ) VALUES ($1, $2, $3, $4, 'Ban Điều hành', 'board', 'chairperson', FALSE, NOW())
        ON CONFLICT (id) DO NOTHING;`,
        [`dir-user-${user.id}`, user.full_name, user.email, user.title || 'Lãnh đạo / Chủ tọa']
      );
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        googleId: user.google_id,
        email: user.email,
        name: user.full_name,
        avatarUrl: user.avatar_url,
        role: user.role,
        title: user.title,
      },
    });
  } catch (error: any) {
    console.error('API /api/auth/google error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
