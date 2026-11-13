-- ==============================================================================
-- MINUTELY - SUPABASE POSTGRESQL SCHEMA SPECIFICATION
-- Tuân thủ: Nghị định 30/2020/NĐ-CP & Luật Doanh nghiệp 2020 (Điều 60, 150, 158)
-- Chạy trực tiếp tại Supabase Dashboard > SQL Editor
-- ==============================================================================

-- 1. Bật các extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Bảng Người dùng (Users / Google OAuth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member', -- 'chairperson', 'secretary', 'member', 'admin'
    title VARCHAR(255) DEFAULT 'Thành viên',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Tổ chức / Doanh nghiệp (Organizations)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    governing_body VARCHAR(255),
    enterprise_code VARCHAR(50),
    department VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Cuộc họp & Biên bản (Meetings)
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    group_type VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D', 'E'
    type_name VARCHAR(255) NOT NULL,
    
    -- Tổ chức & Địa danh
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    organization_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    location_city VARCHAR(100) DEFAULT 'Hà Nội',
    
    -- Thời gian & Địa điểm
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    meeting_mode VARCHAR(20) DEFAULT 'offline', -- 'offline', 'online', 'hybrid'
    meeting_url TEXT,
    
    -- Túc số (Quorum - Luật Doanh nghiệp)
    quorum JSONB DEFAULT NULL,
    
    -- Dữ liệu chuyên biệt
    bilateral_info JSONB DEFAULT NULL, -- Nhóm D
    post_mortem JSONB DEFAULT NULL,    -- Nhóm A3/C5
    scrum_retro JSONB DEFAULT NULL,    -- Nhóm C3
    distribution JSONB DEFAULT '{"forAction": [], "forInfo": []}'::jsonb,
    
    -- Vòng đời văn bản & Toàn vẹn
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'published', 'archived'
    version VARCHAR(20) DEFAULT '1.0',
    previous_version_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    content_hash VARCHAR(100),
    approved_at TIMESTAMPTZ,
    approved_by VARCHAR(255),
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Thành phần tham dự (Participants)
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'chairperson', 'secretary', 'member', 'guest'
    title VARCHAR(255) DEFAULT 'Đại biểu',
    department VARCHAR(255),
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent_permitted', 'absent_unexcused', 'delegated'
    delegated_to VARCHAR(255),
    
    -- Pháp lý Luật Doanh nghiệp
    shares_count BIGINT DEFAULT 0,          -- ĐHĐCĐ Điều 150
    capital_ratio NUMERIC(5, 2) DEFAULT 0,  -- HĐTV Điều 60 (%)
    voting_power BIGINT DEFAULT 1,
    
    -- Chữ ký & Ghi nhận từ chối ký Điều 158
    has_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    refused_sign BOOLEAN DEFAULT FALSE,
    refusal_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Chương trình nghị sự (Agenda Items)
CREATE TABLE IF NOT EXISTS agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    item_order INT NOT NULL DEFAULT 1,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 30,
    presenter_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    presenter_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Ý kiến thảo luận trực tiếp (Opinions)
CREATE TABLE IF NOT EXISTS opinions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
    speaker_id VARCHAR(100),
    speaker_name VARCHAR(255) NOT NULL,
    opinion_type VARCHAR(50) NOT NULL, -- 'opinion', 'counter', 'proposal', 'clarify'
    content TEXT NOT NULL,
    timestamp_str VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Bảng Kết luận & Biểu quyết (Decisions & Votes)
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'agreed', -- 'agreed', 'disagreed', 'deferred'
    threshold_percent INT DEFAULT 50,
    
    -- Thông tin biểu quyết (Vote Stats)
    vote_data JSONB DEFAULT NULL,
    reserved_opinions TEXT[],
    deferred_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Phân công thực hiện (Action Items)
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL,
    decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
    
    title VARCHAR(500) NOT NULL,
    owner_id VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    supporter_ids TEXT[],
    approver_id VARCHAR(100),
    approver_name VARCHAR(255),
    
    -- Nguyên tắc bắt buộc
    deadline DATE NOT NULL,
    deliverable TEXT NOT NULL, -- Tiêu chí nghiệm thu DoD
    priority VARCHAR(20) DEFAULT 'medium', -- 'urgent', 'high', 'medium', 'low'
    status VARCHAR(30) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'blocked', 'pending_approval', 'completed'
    
    carried_from_previous BOOLEAN DEFAULT FALSE,
    postponed_reason TEXT,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bảng Nhật ký kiểm toán (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tối ưu hóa hiệu năng (Indexes)
CREATE INDEX IF NOT EXISTS idx_meetings_code ON meetings(code);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_group ON meetings(group_type);
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_meeting ON agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_actions_meeting ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_actions_owner ON action_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_actions_deadline ON action_items(deadline);

-- 11. Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_meetings_timestamp
BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TRIGGER trg_update_action_items_timestamp
BEFORE UPDATE ON action_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
