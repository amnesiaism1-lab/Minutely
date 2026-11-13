import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function seed() {
  console.log('🌱 Đang kết nối tới Supabase để nạp dữ liệu mẫu (Seed Data)...');
  const client = new Client({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ewztorukxapprldbybit',
    password: 'Alittlebitch@123',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Kiểm tra xem đã có meeting chưa
    const countRes = await client.query('SELECT COUNT(*) FROM meetings');
    if (parseInt(countRes.rows[0].count, 10) > 0) {
      console.log(`ℹ️ Cơ sở dữ liệu đã có ${countRes.rows[0].count} cuộc họp. Bỏ qua bước seed để tránh trùng lặp.`);
      return;
    }

    // Insert Organization
    const orgRes = await client.query(`
      INSERT INTO organizations (name, governing_body, enterprise_code, department, address)
      VALUES 
      ('CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY VINACORP', 'ỦY BAN CHỨNG KHOÁN NHÀ NƯỚC', '0109887766', 'Hội đồng Quản trị', 'Tầng 18, Keangnam Landmark 72, Hà Nội')
      RETURNING id;
    `);
    const orgId = orgRes.rows[0].id;

    // Insert Meeting 1: ĐHĐCĐ
    const m1Res = await client.query(`
      INSERT INTO meetings (
        code, title, template_id, group_type, type_name, organization_id, organization_snapshot,
        location_city, meeting_date, start_time, end_time, venue, meeting_mode, quorum,
        status, version, content_hash
      ) VALUES (
        '01/2026/BB-ĐHĐCĐ',
        'Đại Hội Đồng Cổ Đông Thường Niên Năm 2026 - Minutely Vinacorp',
        'tpl-b1', 'B', 'Biên Bản Họp Đại Hội Đồng Cổ Đông',
        $1,
        '{"name": "CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY VINACORP", "governingBody": "ỦY BAN CHỨNG KHOÁN NHÀ NƯỚC", "enterpriseCode": "0109887766"}'::jsonb,
        'Hà Nội', '2026-04-18', '08:30', '11:45', 'Hội trường Grand Ballroom, Khách sạn JW Marriott Hà Nội', 'hybrid',
        '{"requiredPercentage": 50, "actualPercentage": 77.8, "isMet": true, "totalCapitalOrShares": 50000000, "presentCapitalOrShares": 38900000}'::jsonb,
        'published', '1.0', 'MIN-9F4D2E1B-4A18'
      ) RETURNING id;
    `, [orgId]);
    const m1Id = m1Res.rows[0].id;

    // Participants for M1
    await client.query(`
      INSERT INTO participants (meeting_id, name, email, role, title, status, shares_count, voting_power, has_signed)
      VALUES
      ($1, 'Nguyễn Văn Hùng', 'hung.nguyen@vinacorp.vn', 'chairperson', 'Chủ tịch HĐQT', 'present', 15000000, 15000000, true),
      ($1, 'Trần Thị Thu Hà', 'ha.tran@vinacorp.vn', 'secretary', 'Thư ký HĐQT', 'present', 200000, 200000, true),
      ($1, 'Lê Hoàng Minh', 'minh.le@dragoncapital.com', 'member', 'Đại diện Cổ đông lớn Dragon Capital', 'present', 18500000, 18500000, false);
    `, [m1Id]);

    // Agenda for M1
    const ag1Res = await client.query(`
      INSERT INTO agenda_items (meeting_id, item_order, title, description, duration_minutes)
      VALUES ($1, 1, 'Báo cáo Kết quả Kinh doanh năm 2025 và Kế hoạch Tài chính năm 2026', 'Tổng kết doanh thu đạt 850 tỷ đồng (vượt 112% kế hoạch), LNST 145 tỷ.', 45)
      RETURNING id;
    `, [m1Id]);
    const ag1Id = ag1Res.rows[0].id;

    // Decision for Agenda 1
    const dec1Res = await client.query(`
      INSERT INTO decisions (agenda_item_id, content, status, threshold_percent, vote_data)
      VALUES ($1, 'Thông qua toàn văn Báo cáo Kết quả Kinh doanh 2025 và chỉ tiêu Doanh thu 1.150 tỷ, LNST 210 tỷ cho năm tài chính 2026.', 'agreed', 50,
      '{"method": "secret_ballot", "inFavor": 38900000, "against": 0, "abstain": 0, "ratioPassed": 100, "isPassed": true}'::jsonb)
      RETURNING id;
    `, [ag1Id]);
    const dec1Id = dec1Res.rows[0].id;

    // Action Item for Agenda 1
    await client.query(`
      INSERT INTO action_items (meeting_id, agenda_item_id, decision_id, title, owner_id, owner_name, deadline, deliverable, priority, status)
      VALUES ($1, $2, $3, 'Công bố Nghị quyết ĐHĐCĐ và Báo cáo tài chính lên Ủy ban Chứng khoán & HOSE', 'p2', 'Trần Thị Thu Hà', '2026-04-20', 'Bản công bố thông tin có xác nhận tiếp nhận của UBCKNN và Sở GDCK', 'urgent', 'completed');
    `, [m1Id, ag1Id, dec1Id]);

    // Insert Meeting 2: HĐQT BIDV 50 tỷ (có từ chối ký)
    const m2Res = await client.query(`
      INSERT INTO meetings (
        code, title, template_id, group_type, type_name, organization_id, organization_snapshot,
        location_city, meeting_date, start_time, end_time, venue, meeting_mode, quorum,
        status, version, content_hash
      ) VALUES (
        '12/2026/BB-HĐQT',
        'Phiên Họp Hội Đồng Quản Trị Quý IV/2026 - Phê Duyệt Hạn Mức Tín Dụng BIDV 50 Tỷ',
        'tpl-b2', 'B', 'Biên Bản Họp Hội Đồng Quản Trị',
        $1,
        '{"name": "CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY VINACORP", "enterpriseCode": "0109887766"}'::jsonb,
        'Hà Nội', '2026-11-10', '14:00', '16:30', 'Phòng họp Boardroom tầng 18', 'offline',
        '{"requiredPercentage": 75, "actualPercentage": 100, "isMet": true, "totalCapitalOrShares": 4, "presentCapitalOrShares": 4}'::jsonb,
        'approved', '1.0', 'MIN-7A3C1D9F-1110'
      ) RETURNING id;
    `, [orgId]);
    const m2Id = m2Res.rows[0].id;

    // Participants with refusal note (Điều 158)
    await client.query(`
      INSERT INTO participants (meeting_id, name, email, role, title, status, voting_power, has_signed, refused_sign, refusal_reason)
      VALUES
      ($1, 'Nguyễn Văn Hùng', 'hung.nguyen@vinacorp.vn', 'chairperson', 'Chủ tịch HĐQT', 'present', 1, true, false, NULL),
      ($1, 'Trần Thị Thu Hà', 'ha.tran@vinacorp.vn', 'secretary', 'Thư ký HĐQT', 'present', 0, true, false, NULL),
      ($1, 'Bùi Thanh Tùng', 'tung.bui@vinacorp.vn', 'member', 'Thành viên HĐQT Độc lập', 'present', 1, false, true, 'Bảo lưu ý kiến: Không tán thành thế chấp tài sản trí tuệ theo Điều 158 Khoản 4 Luật Doanh nghiệp.');
    `, [m2Id]);

    console.log('🎉 ĐÃ NẠP THÀNH CÔNG DỮ LIỆU MẪU CHUẨN PHÁP LÝ VÀO SUPABASE POSTGRESQL!');

  } catch (err) {
    console.error('❌ Lỗi khi seed dữ liệu:', err.message);
  } finally {
    await client.end();
  }
}

seed();
