-- ==============================================================================
-- MINUTELY - DOMAIN & SUPABASE POSTGRESQL SCHEMA (V2 - MASTER + LEGAL SNAPSHOT)
-- Tuân thủ: Nghị định 30/2020/NĐ-CP & Luật Doanh nghiệp 2020 (Điều 60, 145, 150, 158)
-- Kiến trúc 2 Tầng:
--   + Tầng Danh mục Gốc (Master Data): workspace_settings, directory_members, member_groups
--   + Tầng Hồ sơ Pháp lý Bất biến (Legal Snapshot): meetings (organization_snapshot + meeting_payload JSONB)
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Bảng Heartbeat chống tạm dừng DB trên Supabase Free Tier (luôn duy trì đúng 1 dòng)
CREATE TABLE IF NOT EXISTS system_heartbeat (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ping_count BIGINT NOT NULL DEFAULT 1,
    last_source VARCHAR(100) DEFAULT 'init'
);

-- 3. Bảng Tài khoản Người dùng (Users / Google OAuth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'chairperson', -- 'chairperson', 'secretary', 'member', 'admin'
    title VARCHAR(255) DEFAULT 'Lãnh đạo / Chủ tọa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Hồ sơ Pháp nhân Đơn vị & Cấu hình Mặc định (Master Singleton)
-- Dùng để điền tự động Quốc hiệu/Tên cơ quan bên trái (NĐ30), Phòng họp, Phòng ban, Thư ký mặc định
CREATE TABLE IF NOT EXISTS workspace_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    org_name VARCHAR(500) NOT NULL DEFAULT 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
    governing_body VARCHAR(500) DEFAULT '',
    enterprise_code VARCHAR(100) DEFAULT '',
    address TEXT DEFAULT '',
    default_city VARCHAR(100) DEFAULT 'Hà Nội',
    departments TEXT[] DEFAULT ARRAY['Ban Điều hành', 'Phòng Pháp chế', 'Khối Kỹ thuật'],
    venues JSONB DEFAULT '[]'::jsonb,
    default_secretary_id VARCHAR(100) DEFAULT NULL,
    default_distribution JSONB DEFAULT '{"forAction": ["Các bộ phận / cá nhân liên quan"], "forInfo": ["Ban Lãnh đạo", "Lưu: VT, Hồ sơ cuộc họp"]}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Danh bạ Nhân sự · Thành viên HĐQT · Cổ đông · Đối tác (Master Directory)
-- Tách độc lập khỏi từng cuộc họp để tái sử dụng nhanh, tránh nhập lại hoặc gắn chết danh sách tĩnh
CREATE TABLE IF NOT EXISTS directory_members (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    title VARCHAR(255) DEFAULT 'Thành viên',
    department VARCHAR(255) DEFAULT '',
    organization_name VARCHAR(255) DEFAULT '',
    member_type VARCHAR(50) DEFAULT 'internal', -- 'internal', 'board', 'shareholder', 'external'
    default_role VARCHAR(50) DEFAULT 'member',  -- 'chairperson', 'secretary', 'member', 'guest', 'scrutineer'
    shares_count BIGINT DEFAULT 0,              -- Số cổ phần sở hữu (ĐHĐCĐ Điều 150)
    capital_ratio NUMERIC(5, 2) DEFAULT 0,      -- Tỷ lệ vốn góp % (HĐTV Điều 60)
    is_sample BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Nhóm Thành phần Họp Nhanh (Roster Presets - Quan hệ N-N logic tới directory_members)
-- Cho phép chọn 1 chạm đúng thành phần từng loại cuộc họp (HĐQT, Ban Giám đốc, Kỹ thuật...)
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

-- 7. Bảng Hồ sơ Biên bản Cuộc họp (Transactional & Historical Legal Snapshot)
-- Lưu bản chụp bất biến tại thời điểm họp (organization_snapshot + meeting_payload JSONB)
-- Đảm bảo khi nhân sự đổi chức vụ hoặc công ty đổi địa chỉ sau này, biên bản cũ đã ký khóa SHA-256 không bị sai lệch lịch sử!
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    group_type VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
    type_name VARCHAR(255) NOT NULL,
    
    -- Bản chụp pháp nhân tại thời điểm họp (Nghị định 30)
    organization_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    location_city VARCHAR(100) DEFAULT 'Hà Nội',
    
    -- Thời gian & Địa điểm
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    meeting_mode VARCHAR(20) DEFAULT 'offline',
    meeting_url TEXT,
    
    -- Túc số & Nội dung toàn văn (Single-Query Aggregate)
    quorum JSONB DEFAULT NULL,
    bilateral_info JSONB DEFAULT NULL,
    post_mortem JSONB DEFAULT NULL,
    scrum_retro JSONB DEFAULT NULL,
    distribution JSONB DEFAULT '{"forAction": [], "forInfo": []}'::jsonb,
    meeting_payload JSONB DEFAULT NULL, -- Chứa participants (kèm directoryMemberId + snapshot), agendaItems, opinions, decisions, actionItems, signatures, auditLogs
    
    -- Vòng đời pháp lý & Khóa toàn vẹn SHA-256
    status VARCHAR(30) DEFAULT 'draft',
    version VARCHAR(20) DEFAULT '1.0',
    previous_version_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    content_hash VARCHAR(100),
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Indexes tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_meetings_code ON meetings(code);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_group ON meetings(group_type);
CREATE INDEX IF NOT EXISTS idx_directory_email ON directory_members(email);
CREATE INDEX IF NOT EXISTS idx_directory_type ON directory_members(member_type);

-- 9. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_meetings_timestamp ON meetings;
CREATE TRIGGER trg_update_meetings_timestamp
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
