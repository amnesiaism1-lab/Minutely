import type { VercelRequest, VercelResponse } from '@vercel/node';
import pool from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = await pool.connect();
  try {
    if (req.method === 'GET') {
      const meetingsRes = await client.query(`
        SELECT * FROM meetings ORDER BY meeting_date DESC, created_at DESC;
      `);

      const meetings = await Promise.all(
        meetingsRes.rows.map(async (m) => {
          // Fetch participants
          const pRes = await client.query(
            `SELECT * FROM participants WHERE meeting_id = $1 ORDER BY created_at ASC;`,
            [m.id]
          );

          // Fetch agenda items
          const agRes = await client.query(
            `SELECT * FROM agenda_items WHERE meeting_id = $1 ORDER BY item_order ASC;`,
            [m.id]
          );

          const agendaItems = await Promise.all(
            agRes.rows.map(async (ag) => {
              // Opinions
              const opRes = await client.query(
                `SELECT * FROM opinions WHERE agenda_item_id = $1 ORDER BY created_at ASC;`,
                [ag.id]
              );

              // Decision
              const decRes = await client.query(
                `SELECT * FROM decisions WHERE agenda_item_id = $1 LIMIT 1;`,
                [ag.id]
              );

              // Action Items
              const actRes = await client.query(
                `SELECT * FROM action_items WHERE agenda_item_id = $1 ORDER BY deadline ASC;`,
                [ag.id]
              );

              const decRow = decRes.rows[0];

              return {
                id: ag.id,
                order: ag.item_order,
                title: ag.title,
                description: ag.description,
                durationMinutes: ag.duration_minutes,
                presenterId: ag.presenter_id,
                presenterName: ag.presenter_name,
                opinions: opRes.rows.map((o) => ({
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
                actionItems: actRes.rows.map((a) => ({
                  id: a.id,
                  meetingId: a.meeting_id,
                  agendaItemId: a.agenda_item_id,
                  decisionId: a.decision_id,
                  title: a.title,
                  ownerId: a.owner_id,
                  ownerName: a.owner_name,
                  deadline: a.deadline ? a.deadline.toISOString().split('T')[0] : '',
                  deliverable: a.deliverable,
                  priority: a.priority,
                  status: a.status,
                  carriedFromPrevious: a.carried_from_previous,
                  completedAt: a.completed_at,
                })),
              };
            })
          );

          return {
            id: m.id,
            code: m.code,
            title: m.title,
            templateId: m.template_id,
            group: m.group_type,
            type: m.template_id,
            typeName: m.type_name,
            organization: m.organization_snapshot || {},
            locationCity: m.location_city || 'Hà Nội',
            date: m.meeting_date ? m.meeting_date.toISOString().split('T')[0] : '',
            startTime: m.start_time?.slice(0, 5) || '09:00',
            endTime: m.end_time?.slice(0, 5) || '10:30',
            venue: m.venue,
            meetingMode: m.meeting_mode,
            meetingUrl: m.meeting_url,
            participants: pRes.rows.map((p) => ({
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
                signerName: pRes.rows.find((p) => p.role === 'chairperson')?.name || 'Chủ tọa',
                signedAt: m.approved_at,
                refused: false,
                signatureType: 'digital_cert',
              },
              {
                role: 'secretary',
                roleTitle: 'THƯ KÝ GHI BIÊN BẢN',
                signerName: pRes.rows.find((p) => p.role === 'secretary')?.name || 'Thư ký',
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
            createdAt: m.created_at,
            updatedAt: m.updated_at,
            auditLogs: [],
          };
        })
      );

      return res.status(200).json(meetings);
    }

    if (req.method === 'POST') {
      const data = req.body;
      const mRes = await client.query(
        `INSERT INTO meetings (
          code, title, template_id, group_type, type_name, organization_snapshot,
          location_city, meeting_date, start_time, end_time, venue, meeting_mode,
          meeting_url, quorum, status, version, content_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
          data.status || 'draft',
          data.version || '1.0',
          data.contentHash || null,
        ]
      );

      const newMeetingId = mRes.rows[0].id;

      // Insert participants
      if (data.participants && data.participants.length > 0) {
        for (const p of data.participants) {
          await client.query(
            `INSERT INTO participants (meeting_id, name, email, role, title, status)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [newMeetingId, p.name, p.email, p.role || 'member', p.title || 'Đại biểu', p.status || 'present']
          );
        }
      }

      // Insert initial agenda item
      if (data.agendaItems && data.agendaItems.length > 0) {
        for (const ag of data.agendaItems) {
          const agRes = await client.query(
            `INSERT INTO agenda_items (meeting_id, item_order, title, description, duration_minutes)
             VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
            [newMeetingId, ag.order || 1, ag.title, ag.description || '', ag.durationMinutes || 30]
          );
          const agId = agRes.rows[0].id;
          if (ag.decision) {
            await client.query(
              `INSERT INTO decisions (agenda_item_id, content, status, threshold_percent)
               VALUES ($1, $2, $3, $4);`,
              [agId, ag.decision.content || 'Thống nhất', ag.decision.status || 'agreed', 50]
            );
          }
        }
      }

      return res.status(201).json({ id: newMeetingId, success: true });
    }

    if (req.method === 'PUT') {
      const { id, updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing meeting id' });

      if (updates.status) {
        await client.query(
          `UPDATE meetings SET status = $1, approved_at = $2, approved_by = $3, content_hash = $4, updated_at = NOW() WHERE id = $5;`,
          [updates.status, updates.approvedAt || null, updates.approvedBy || null, updates.contentHash || null, id]
        );
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing meeting id' });

      await client.query(`DELETE FROM meetings WHERE id = $1;`, [id]);
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
