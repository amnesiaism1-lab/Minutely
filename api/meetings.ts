import pool, { ApiRequest, ApiResponse, ensureRuntimeSchema } from './_db';

const TEMPLATE_TO_TYPE_MAP: Record<string, string> = {
  'tpl-a1': 'A1_GIAO_BAN',
  'tpl-a2': 'A2_PHONG_BAN',
  'tpl-a3': 'A3_XU_LY_SU_CO',
  'tpl-b1': 'B1_DH_CO_DONG',
  'tpl-b2': 'B2_HD_QUAN_TRI',
  'tpl-b3': 'B3_HD_THANH_VIEN',
  'tpl-c1': 'C1_KICKOFF',
  'tpl-c2': 'C2_YEU_CAU',
  'tpl-c3': 'C3_SPRINT_RETRO',
  'tpl-c4': 'C4_BUG_TRIAGE_CCB',
  'tpl-c5': 'C5_POST_MORTEM',
  'tpl-d1': 'D1_HAI_BEN',
  'tpl-d2': 'D2_DAM_PHAN',
  'tpl-e1': 'E1_CONG_DONG',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatDateField(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).slice(0, 10);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
    if (req.method === 'GET') {
      return res.status(200).json([]);
    }
    return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  }

  const client = await pool.connect();
  try {
    await ensureRuntimeSchema(client);

    if (req.method === 'GET') {
      const meetingsRes = await client.query(`
        SELECT * FROM meetings ORDER BY meeting_date DESC, created_at DESC;
      `);

      // Separate rows needing legacy relational hydration from rows with complete meeting_payload JSONB
      const legacyIds = meetingsRes.rows
        .filter((m) => !m.meeting_payload || typeof m.meeting_payload !== 'object')
        .map((m) => m.id);

      const participantsByMeeting = new Map<string, any[]>();
      const agendasByMeeting = new Map<string, any[]>();
      const opinionsByAgenda = new Map<string, any[]>();
      const decisionsByAgenda = new Map<string, any>();
      const actionsByAgenda = new Map<string, any[]>();

      if (legacyIds.length > 0) {
        try {
          const [pRes, agRes] = await Promise.all([
            client.query(
              `SELECT * FROM participants WHERE meeting_id = ANY($1::uuid[]) ORDER BY created_at ASC;`,
              [legacyIds]
            ),
            client.query(
              `SELECT * FROM agenda_items WHERE meeting_id = ANY($1::uuid[]) ORDER BY item_order ASC;`,
              [legacyIds]
            ),
          ]);

          for (const p of pRes.rows) {
            const arr = participantsByMeeting.get(p.meeting_id) || [];
            arr.push(p);
            participantsByMeeting.set(p.meeting_id, arr);
          }

          const legacyAgendaIds: string[] = [];
          for (const ag of agRes.rows) {
            legacyAgendaIds.push(ag.id);
            const arr = agendasByMeeting.get(ag.meeting_id) || [];
            arr.push(ag);
            agendasByMeeting.set(ag.meeting_id, arr);
          }

          if (legacyAgendaIds.length > 0) {
            const [opRes, decRes, actRes] = await Promise.all([
              client.query(
                `SELECT * FROM opinions WHERE agenda_item_id = ANY($1::uuid[]) ORDER BY created_at ASC;`,
                [legacyAgendaIds]
              ),
              client.query(
                `SELECT * FROM decisions WHERE agenda_item_id = ANY($1::uuid[]);`,
                [legacyAgendaIds]
              ),
              client.query(
                `SELECT * FROM action_items WHERE agenda_item_id = ANY($1::uuid[]) ORDER BY deadline ASC;`,
                [legacyAgendaIds]
              ),
            ]);

            for (const o of opRes.rows) {
              const arr = opinionsByAgenda.get(o.agenda_item_id) || [];
              arr.push(o);
              opinionsByAgenda.set(o.agenda_item_id, arr);
            }
            for (const d of decRes.rows) {
              if (!decisionsByAgenda.has(d.agenda_item_id)) {
                decisionsByAgenda.set(d.agenda_item_id, d);
              }
            }
            for (const a of actRes.rows) {
              const arr = actionsByAgenda.get(a.agenda_item_id) || [];
              arr.push(a);
              actionsByAgenda.set(a.agenda_item_id, arr);
            }
          }
        } catch {
          // Bỏ qua an toàn nếu DB mới chỉ khởi tạo bảng meetings aggregate mà không có các bảng con cũ
        }
      }

      const meetings = meetingsRes.rows.map((m) => {
        if (m.meeting_payload && typeof m.meeting_payload === 'object') {
          const payload = m.meeting_payload;
          return {
            ...payload,
            id: m.id,
            code: m.code,
            title: m.title,
            templateId: m.template_id,
            group: m.group_type,
            type: payload.type || TEMPLATE_TO_TYPE_MAP[m.template_id] || 'A1_GIAO_BAN',
            typeName: m.type_name,
            organization: m.organization_snapshot || payload.organization || {},
            locationCity: m.location_city || payload.locationCity || 'Hà Nội',
            date: formatDateField(m.meeting_date) || payload.date || '',
            startTime: m.start_time?.slice(0, 5) || payload.startTime || '09:00',
            endTime: m.end_time?.slice(0, 5) || payload.endTime || '10:30',
            venue: m.venue,
            meetingMode: m.meeting_mode,
            meetingUrl: m.meeting_url ?? payload.meetingUrl,
            quorum: m.quorum ?? payload.quorum,
            bilateral: m.bilateral_info ?? payload.bilateral,
            postMortem: m.post_mortem ?? payload.postMortem,
            scrumRetro: m.scrum_retro ?? payload.scrumRetro,
            distribution: m.distribution || payload.distribution || { forAction: [], forInfo: [] },
            status: m.status,
            version: m.version,
            contentHash: m.content_hash ?? payload.contentHash,
            approvedAt: m.approved_at ?? payload.approvedAt,
            approvedBy: m.approved_by ?? payload.approvedBy,
            rejectionReason: m.rejection_reason || undefined,
            createdAt: m.created_at,
            updatedAt: m.updated_at,
          };
        }

        // Fallback assembly from batched relational tables
        const pRows = participantsByMeeting.get(m.id) || [];
        const agRows = agendasByMeeting.get(m.id) || [];

        const agendaItems = agRows.map((ag) => {
          const opRows = opinionsByAgenda.get(ag.id) || [];
          const decRow = decisionsByAgenda.get(ag.id);
          const actRows = actionsByAgenda.get(ag.id) || [];

          return {
            id: ag.id,
            order: ag.item_order,
            title: ag.title,
            description: ag.description,
            durationMinutes: ag.duration_minutes,
            presenterId: ag.presenter_id,
            presenterName: ag.presenter_name,
            opinions: opRows.map((o) => ({
              id: o.id,
              agendaItemId: o.agenda_item_id,
              speakerId: o.speaker_id,
              speakerName: o.speaker_name,
              type: o.opinion_type,
              content: o.content,
              timestamp: o.timestamp_str,
            })),
            decision: decRow
              ? {
                  id: decRow.id,
                  agendaItemId: decRow.agenda_item_id,
                  content: decRow.content,
                  status: decRow.status,
                  thresholdPercent: decRow.threshold_percent,
                  vote: decRow.vote_data,
                  reservedOpinions: decRow.reserved_opinions,
                  deferredReason: decRow.deferred_reason,
                }
              : undefined,
            actionItems: actRows.map((a) => ({
              id: a.id,
              meetingId: a.meeting_id,
              agendaItemId: a.agenda_item_id,
              decisionId: a.decision_id,
              title: a.title,
              ownerId: a.owner_id,
              ownerName: a.owner_name,
              deadline: formatDateField(a.deadline),
              deliverable: a.deliverable,
              priority: a.priority,
              status: a.status,
              carriedFromPrevious: a.carried_from_previous,
              completedAt: a.completed_at,
            })),
          };
        });

        return {
          id: m.id,
          code: m.code,
          title: m.title,
          templateId: m.template_id,
          group: m.group_type,
          type: TEMPLATE_TO_TYPE_MAP[m.template_id] || 'A1_GIAO_BAN',
          typeName: m.type_name,
          organization: m.organization_snapshot || {},
          locationCity: m.location_city || 'Hà Nội',
          date: formatDateField(m.meeting_date),
          startTime: m.start_time?.slice(0, 5) || '09:00',
          endTime: m.end_time?.slice(0, 5) || '10:30',
          venue: m.venue,
          meetingMode: m.meeting_mode,
          meetingUrl: m.meeting_url,
          participants: pRows.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            title: p.title,
            department: p.department,
            status: p.status,
            delegatedTo: p.delegated_to,
            sharesCount: p.shares_count ? Number(p.shares_count) : undefined,
            capitalRatio: p.capital_ratio ? Number(p.capital_ratio) : undefined,
            votingPower: p.voting_power ? Number(p.voting_power) : undefined,
            hasSigned: p.has_signed,
            signedAt: p.signed_at,
            refusedSign: p.refused_sign,
            refusalReason: p.refusal_reason,
          })),
          quorum: m.quorum,
          agendaItems,
          bilateral: m.bilateral_info,
          postMortem: m.post_mortem,
          scrumRetro: m.scrum_retro,
          signatures: [
            {
              role: 'chairperson',
              roleTitle: 'CHỦ TỌA CUỘC HỌP',
              signerName: pRows.find((p) => p.role === 'chairperson')?.name || 'Chủ tọa',
              signedAt: m.approved_at,
              refused: false,
              signatureType: 'digital_cert',
            },
            {
              role: 'secretary',
              roleTitle: 'THƯ KÝ GHI BIÊN BẢN',
              signerName: pRows.find((p) => p.role === 'secretary')?.name || 'Thư ký',
              signedAt: m.approved_at,
              refused: false,
              signatureType: 'digital_cert',
            },
          ],
          distribution: m.distribution || { forAction: [], forInfo: [] },
          status: m.status,
          version: m.version,
          contentHash: m.content_hash,
          approvedAt: m.approved_at,
          approvedBy: m.approved_by,
          rejectionReason: m.rejection_reason || undefined,
          createdAt: m.created_at,
          updatedAt: m.updated_at,
          auditLogs: [],
        };
      });

      return res.status(200).json(meetings);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const mRes = await client.query(
        `INSERT INTO meetings (
          code, title, template_id, group_type, type_name, organization_snapshot,
          location_city, meeting_date, start_time, end_time, venue, meeting_mode,
          meeting_url, quorum, bilateral_info, post_mortem, scrum_retro, distribution,
          meeting_payload, status, version, content_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id;`,
        [
          data.code,
          data.title,
          data.templateId || 'tpl-a1',
          data.group || 'A',
          data.typeName || 'Họp Giao Ban',
          JSON.stringify(data.organization || {}),
          data.locationCity || 'Hà Nội',
          data.date || new Date().toISOString().split('T')[0],
          data.startTime || '09:00',
          data.endTime || '10:30',
          data.venue || 'Phòng họp',
          data.meetingMode || 'offline',
          data.meetingUrl || null,
          data.quorum ? JSON.stringify(data.quorum) : null,
          data.bilateral ? JSON.stringify(data.bilateral) : null,
          data.postMortem ? JSON.stringify(data.postMortem) : null,
          data.scrumRetro ? JSON.stringify(data.scrumRetro) : null,
          JSON.stringify(data.distribution || { forAction: [], forInfo: [] }),
          JSON.stringify(data),
          data.status || 'draft',
          data.version || '1.0',
          data.contentHash || null,
        ]
      );

      return res.status(201).json({ id: mRes.rows[0].id, success: true });
    }

    if (req.method === 'PUT') {
      const { id, code, updates, meetingPayload } = req.body;
      if (!id && !code && !meetingPayload?.code) {
        return res.status(400).json({ error: 'Missing meeting identifier' });
      }

      const patch = updates && typeof updates === 'object' ? updates : {};
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      const pushField = (col: string, val: any) => {
        setClauses.push(`${col} = $${paramIdx++}`);
        values.push(val);
      };

      if ('title' in patch) pushField('title', patch.title);
      if ('code' in patch) pushField('code', patch.code);
      if ('date' in patch) pushField('meeting_date', patch.date);
      if ('startTime' in patch) pushField('start_time', patch.startTime);
      if ('endTime' in patch) pushField('end_time', patch.endTime);
      if ('venue' in patch) pushField('venue', patch.venue);
      if ('meetingMode' in patch) pushField('meeting_mode', patch.meetingMode);
      if ('meetingUrl' in patch) pushField('meeting_url', patch.meetingUrl || null);
      if ('status' in patch) pushField('status', patch.status);
      if ('version' in patch) pushField('version', patch.version);
      if ('approvedAt' in patch) pushField('approved_at', patch.approvedAt || null);
      if ('approvedBy' in patch) pushField('approved_by', patch.approvedBy || null);
      if ('contentHash' in patch) pushField('content_hash', patch.contentHash || null);
      if ('rejectionReason' in patch) pushField('rejection_reason', patch.rejectionReason || null);
      if ('quorum' in patch) {
        pushField('quorum', patch.quorum ? JSON.stringify(patch.quorum) : null);
      }
      if ('locationCity' in patch) pushField('location_city', patch.locationCity);
      if ('organization' in patch) {
        pushField('organization_snapshot', JSON.stringify(patch.organization || {}));
      }
      if ('bilateral' in patch) {
        pushField('bilateral_info', patch.bilateral ? JSON.stringify(patch.bilateral) : null);
      }
      if ('postMortem' in patch) {
        pushField('post_mortem', patch.postMortem ? JSON.stringify(patch.postMortem) : null);
      }
      if ('scrumRetro' in patch) {
        pushField('scrum_retro', patch.scrumRetro ? JSON.stringify(patch.scrumRetro) : null);
      }
      if ('distribution' in patch) {
        pushField('distribution', JSON.stringify(patch.distribution || { forAction: [], forInfo: [] }));
      }

      if (meetingPayload && typeof meetingPayload === 'object') {
        if (!('title' in patch) && meetingPayload.title) pushField('title', meetingPayload.title);
        if (!('endTime' in patch) && meetingPayload.endTime) pushField('end_time', meetingPayload.endTime);
        if (!('venue' in patch) && meetingPayload.venue) pushField('venue', meetingPayload.venue);
        if (!('quorum' in patch) && 'quorum' in meetingPayload) {
          pushField('quorum', meetingPayload.quorum ? JSON.stringify(meetingPayload.quorum) : null);
        }
        if (!('organization' in patch) && meetingPayload.organization) {
          pushField('organization_snapshot', JSON.stringify(meetingPayload.organization));
        }
        if (!('bilateral' in patch) && 'bilateral' in meetingPayload) {
          pushField(
            'bilateral_info',
            meetingPayload.bilateral ? JSON.stringify(meetingPayload.bilateral) : null
          );
        }
        if (!('postMortem' in patch) && 'postMortem' in meetingPayload) {
          pushField(
            'post_mortem',
            meetingPayload.postMortem ? JSON.stringify(meetingPayload.postMortem) : null
          );
        }
        if (!('scrumRetro' in patch) && 'scrumRetro' in meetingPayload) {
          pushField(
            'scrum_retro',
            meetingPayload.scrumRetro ? JSON.stringify(meetingPayload.scrumRetro) : null
          );
        }
        if (!('distribution' in patch) && meetingPayload.distribution) {
          pushField('distribution', JSON.stringify(meetingPayload.distribution));
        }
        pushField('meeting_payload', JSON.stringify(meetingPayload));
      }

      if (setClauses.length > 0) {
        setClauses.push('updated_at = NOW()');
        const isUuid = typeof id === 'string' && UUID_REGEX.test(id);
        const matchCode = code || meetingPayload?.code;
        if (isUuid) {
          values.push(id);
          await client.query(
            `UPDATE meetings SET ${setClauses.join(', ')} WHERE id = $${paramIdx}::uuid;`,
            values
          );
        } else if (matchCode) {
          values.push(matchCode);
          await client.query(
            `UPDATE meetings SET ${setClauses.join(', ')} WHERE code = $${paramIdx};`,
            values
          );
        }
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const rawId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
      if (!rawId) return res.status(400).json({ error: 'Missing meeting id' });

      if (UUID_REGEX.test(rawId)) {
        await client.query(`DELETE FROM meetings WHERE id = $1::uuid;`, [rawId]);
      } else {
        await client.query(`DELETE FROM meetings WHERE code = $1;`, [rawId]);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API /api/meetings error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
