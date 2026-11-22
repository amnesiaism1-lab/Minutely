import pool, { ApiRequest, ApiResponse, ensureRuntimeSchema } from './_db';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    if (req.method === 'GET') {
      return res.status(200).json({ settings: null, members: [], groups: [] });
    }
    return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  }

  const client = await pool.connect();
  try {
    await ensureRuntimeSchema(client);

    if (req.method === 'GET') {
      const [settingsRes, membersRes, groupsRes] = await Promise.all([
        client.query(`SELECT * FROM workspace_settings WHERE id = 1 LIMIT 1;`),
        client.query(`SELECT * FROM directory_members ORDER BY is_sample ASC, created_at ASC;`),
        client.query(`SELECT * FROM member_groups ORDER BY is_sample ASC, created_at ASC;`),
      ]);

      const sRow = settingsRes.rows[0];
      const settings = sRow
        ? {
            orgName: sRow.org_name,
            governingBody: sRow.governing_body || '',
            enterpriseCode: sRow.enterprise_code || '',
            address: sRow.address || '',
            defaultCity: sRow.default_city || 'Hà Nội',
            departments: Array.isArray(sRow.departments) ? sRow.departments : [],
            venues: Array.isArray(sRow.venues) ? sRow.venues : [],
            defaultSecretaryId: sRow.default_secretary_id || undefined,
            defaultDistributionAction: sRow.default_distribution?.forAction || [],
            defaultDistributionInfo: sRow.default_distribution?.forInfo || [],
            updatedAt: sRow.updated_at,
          }
        : null;

      const members = membersRes.rows.map((m) => ({
        id: m.id,
        name: m.full_name,
        email: m.email || '',
        title: m.title || 'Thành viên',
        department: m.department || undefined,
        organizationName: m.organization_name || undefined,
        memberType: m.member_type || 'internal',
        defaultRole: m.default_role || 'member',
        sharesCount: m.shares_count ? Number(m.shares_count) : undefined,
        capitalRatio: m.capital_ratio ? Number(m.capital_ratio) : undefined,
        isSample: Boolean(m.is_sample),
        updatedAt: m.updated_at,
      }));

      const groups = groupsRes.rows.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || undefined,
        defaultTemplateId: g.default_template_id || undefined,
        defaultVenue: g.default_venue || undefined,
        memberIds: Array.isArray(g.member_ids) ? g.member_ids : [],
        chairpersonId: g.chairperson_id || undefined,
        secretaryId: g.secretary_id || undefined,
        defaultAgendas: Array.isArray(g.default_agendas) ? g.default_agendas : [],
        isSample: Boolean(g.is_sample),
        updatedAt: g.updated_at,
      }));

      return res.status(200).json({ settings, members, groups });
    }

    if (req.method === 'PUT') {
      const { kind, payload } = req.body || {};

      if (kind === 'settings' && payload) {
        await client.query(
          `INSERT INTO workspace_settings (
            id, org_name, governing_body, enterprise_code, address, default_city,
            departments, venues, default_secretary_id, default_distribution, updated_at
          ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (id) DO UPDATE SET
            org_name = EXCLUDED.org_name,
            governing_body = EXCLUDED.governing_body,
            enterprise_code = EXCLUDED.enterprise_code,
            address = EXCLUDED.address,
            default_city = EXCLUDED.default_city,
            departments = EXCLUDED.departments,
            venues = EXCLUDED.venues,
            default_secretary_id = EXCLUDED.default_secretary_id,
            default_distribution = EXCLUDED.default_distribution,
            updated_at = NOW();`,
          [
            payload.orgName || 'ĐƠN VỊ CHƯA ĐẶT TÊN',
            payload.governingBody || '',
            payload.enterpriseCode || '',
            payload.address || '',
            payload.defaultCity || 'Hà Nội',
            Array.isArray(payload.departments) ? payload.departments : [],
            JSON.stringify(Array.isArray(payload.venues) ? payload.venues : []),
            payload.defaultSecretaryId || null,
            JSON.stringify({
              forAction: payload.defaultDistributionAction || [],
              forInfo: payload.defaultDistributionInfo || [],
            }),
          ]
        );
        return res.status(200).json({ success: true });
      }

      if (kind === 'member' && payload?.id) {
        await client.query(
          `INSERT INTO directory_members (
            id, full_name, email, title, department, organization_name,
            member_type, default_role, shares_count, capital_ratio, is_sample, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            title = EXCLUDED.title,
            department = EXCLUDED.department,
            organization_name = EXCLUDED.organization_name,
            member_type = EXCLUDED.member_type,
            default_role = EXCLUDED.default_role,
            shares_count = EXCLUDED.shares_count,
            capital_ratio = EXCLUDED.capital_ratio,
            is_sample = EXCLUDED.is_sample,
            updated_at = NOW();`,
          [
            payload.id,
            payload.name,
            payload.email || '',
            payload.title || 'Thành viên',
            payload.department || '',
            payload.organizationName || '',
            payload.memberType || 'internal',
            payload.defaultRole || 'member',
            payload.sharesCount || 0,
            payload.capitalRatio || 0,
            Boolean(payload.isSample),
          ]
        );
        return res.status(200).json({ success: true });
      }

      if (kind === 'group' && payload?.id) {
        await client.query(
          `INSERT INTO member_groups (
            id, name, description, default_template_id, default_venue,
            member_ids, chairperson_id, secretary_id, default_agendas, is_sample, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            default_template_id = EXCLUDED.default_template_id,
            default_venue = EXCLUDED.default_venue,
            member_ids = EXCLUDED.member_ids,
            chairperson_id = EXCLUDED.chairperson_id,
            secretary_id = EXCLUDED.secretary_id,
            default_agendas = EXCLUDED.default_agendas,
            is_sample = EXCLUDED.is_sample,
            updated_at = NOW();`,
          [
            payload.id,
            payload.name,
            payload.description || '',
            payload.defaultTemplateId || 'tpl-a1',
            payload.defaultVenue || '',
            Array.isArray(payload.memberIds) ? payload.memberIds : [],
            payload.chairpersonId || null,
            payload.secretaryId || null,
            Array.isArray(payload.defaultAgendas) ? payload.defaultAgendas : [],
            Boolean(payload.isSample),
          ]
        );
        return res.status(200).json({ success: true });
      }

      if (kind === 'clear_samples') {
        await client.query(`DELETE FROM directory_members WHERE is_sample = TRUE;`);
        await client.query(`DELETE FROM member_groups WHERE is_sample = TRUE;`);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid directory update kind' });
    }

    if (req.method === 'DELETE') {
      const kind = Array.isArray(req.query?.kind) ? req.query.kind[0] : req.query?.kind;
      const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
      if (!kind || !id) {
        return res.status(400).json({ error: 'Missing kind or id' });
      }

      if (kind === 'member') {
        await client.query(`DELETE FROM directory_members WHERE id = $1;`, [id]);
        return res.status(200).json({ success: true });
      }
      if (kind === 'group') {
        await client.query(`DELETE FROM member_groups WHERE id = $1;`, [id]);
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ error: 'Unknown delete kind' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/directory error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
