// Comprehensive Data Models for Minutely Meeting Minutes System
// Aligned with Decree 30/2020/NĐ-CP & Enterprise Law 2020

export type MeetingGroup = 'A' | 'B' | 'C' | 'D' | 'E';

export type MeetingType = 
  // Nhóm A: Nội bộ
  | 'A1_GIAO_BAN'
  | 'A2_PHONG_BAN'
  | 'A3_XU_LY_SU_CO'
  // Nhóm B: Pháp lý doanh nghiệp
  | 'B1_DH_CO_DONG'
  | 'B2_HD_QUAN_TRI'
  | 'B3_HD_THANH_VIEN'
  // Nhóm C: Dự án & Phần mềm
  | 'C1_KICKOFF'
  | 'C2_YEU_CAU'
  | 'C3_SPRINT_RETRO'
  | 'C4_BUG_TRIAGE_CCB'
  | 'C5_POST_MORTEM'
  // Nhóm D: Đối ngoại
  | 'D1_HAI_BEN'
  | 'D2_DAM_PHAN'
  // Nhóm E: Đoàn thể, cộng đồng
  | 'E1_CONG_DONG';

export type MeetingStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';

export type ParticipantRole = 'chairperson' | 'secretary' | 'member' | 'guest';

export type PartyAffiliation = 'internal' | 'party_a' | 'party_b' | 'observer';

export type MeetingMode = 'offline' | 'online' | 'hybrid';

export type AttendanceStatus = 'present' | 'absent_permitted' | 'absent_unexcused' | 'late' | 'left_early' | 'delegated';

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: ParticipantRole;
  title: string;
  department?: string;
  organizationName?: string; // Tên đơn vị / doanh nghiệp (quan trọng cho nhóm D hoặc khách mời)
  affiliation?: PartyAffiliation;
  status: AttendanceStatus;
  delegatedTo?: string; // Tên hoặc ID người được ủy quyền
  sharesCount?: number; // Số cổ phần (ĐHĐCĐ)
  capitalRatio?: number; // Tỷ lệ vốn góp % (HĐTV)
  votingPower?: number; // Số phiếu biểu quyết
  hasSigned?: boolean;
  signedAt?: string;
  refusedSign?: boolean;
  refusalReason?: string;
}

export type OpinionType = 'opinion' | 'counter' | 'proposal' | 'clarify';

export interface Opinion {
  id: string;
  agendaItemId: string;
  speakerId: string;
  speakerName: string;
  type: OpinionType;
  content: string;
  timestamp: string;
}

export type DecisionStatus = 'agreed' | 'disagreed' | 'deferred';

export interface MemberVoteRecord {
  participantId: string;
  participantName: string;
  voteChoice: 'in_favor' | 'against' | 'abstain';
  note?: string;
}

export interface Vote {
  method: 'show_of_hands' | 'secret_ballot' | 'electronic' | 'written';
  inFavor: number;
  against: number;
  abstain: number;
  invalid?: number;
  totalEligible: number;
  ratioPassed: number; // calculated %
  thresholdPercent: number; // e.g. 50%, 65%, 75%
  isPassed: boolean;
  memberVotes?: MemberVoteRecord[]; // Ghi nhận biểu quyết từng thành viên (Điều 158 Luật DN)
}

export interface Decision {
  id: string;
  agendaItemId: string;
  content: string;
  status: DecisionStatus;
  thresholdPercent: number; // Ngưỡng thông qua
  vote?: Vote;
  reservedOpinions?: string[]; // Bảo lưu ý kiến
  deferredReason?: string;
}

export type ActionStatus = 'not_started' | 'in_progress' | 'blocked' | 'pending_approval' | 'completed' | 'cancelled';
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface ActionItem {
  id: string;
  meetingId: string;
  meetingTitle?: string;
  agendaItemId?: string;
  decisionId?: string;
  title: string;
  ownerId: string;
  ownerName: string;
  supporterIds?: string[];
  supporterNames?: string[];
  approverId?: string;
  approverName?: string;
  deadline: string; // YYYY-MM-DD
  deliverable: string; // Sản phẩm đầu ra bắt buộc
  priority: PriorityLevel;
  status: ActionStatus;
  postponedReason?: string;
  carriedFromPrevious?: boolean; // Tự động mang từ kỳ trước
  completedAt?: string;
}

export interface AgendaItem {
  id: string;
  order: number;
  title: string;
  description?: string;
  durationMinutes: number;
  presenterId?: string;
  presenterName?: string;
  opinions: Opinion[];
  decision?: Decision;
  actionItems: ActionItem[];
}

export interface QuorumInfo {
  requiredPercentage: number; // Túc số tối thiểu % theo luật/điều lệ
  actualPercentage: number;
  isMet: boolean;
  totalCapitalOrShares: number;
  presentCapitalOrShares: number;
}

export interface BilateralInfo {
  partyA: {
    companyName: string;
    representative: string;
    title: string;
    address?: string;
  };
  partyB: {
    companyName: string;
    representative: string;
    title: string;
    address?: string;
  };
  commitmentsA: string[];
  commitmentsB: string[];
  pendingPoints: string[];
}

export interface IncidentPostMortem {
  summary: string;
  impactLevel: 'P1 - Critical' | 'P2 - Major' | 'P3 - Moderate';
  startTime: string;
  resolvedTime: string;
  downtimeMinutes: number;
  rootCause: string;
  whatWentWell: string[];
  whatToImprove: string[];
  preventionActions: string[];
}

export interface ScrumRetroData {
  sprintName: string;
  sprintGoal: string;
  whatWentWell: string[];
  whatWentWrong: string[];
  actionImprovements: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface SignatureEntry {
  role: 'chairperson' | 'secretary' | 'party_a' | 'party_b' | 'member';
  roleTitle: string; // e.g. "CHỦ TỌA", "NGƯỜI GHI BIÊN BẢN"
  signerName: string;
  signedAt?: string;
  refused: boolean;
  refusalReason?: string;
  signatureType: 'digital_cert' | 'electronic_confirm' | 'wet_scan';
}

export interface Meeting {
  id: string;
  code: string; // e.g. "08/BB-HĐQT/2026"
  title: string;
  templateId: string;
  group: MeetingGroup;
  type: MeetingType;
  typeName: string;
  
  // Organization Info (Decree 30)
  organization: {
    governingBody?: string; // Cơ quan chủ quản (nếu có)
    name: string; // Tên cơ quan, tổ chức
    department?: string; // Phòng ban / Đơn vị
    address?: string;
    enterpriseCode?: string; // Mã số doanh nghiệp (nhóm B)
  };
  locationCity: string; // e.g. "Hà Nội", "TP. Hồ Chí Minh"
  
  // Timing & Venue
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  venue: string;
  meetingMode: 'offline' | 'online' | 'hybrid';
  meetingUrl?: string; // Zoom / Google Meet
  
  // Participants & Quorum
  participants: Participant[];
  quorum?: QuorumInfo;
  
  // Content
  agendaItems: AgendaItem[];
  
  // Specialized Data
  bilateral?: BilateralInfo;
  postMortem?: IncidentPostMortem;
  scrumRetro?: ScrumRetroData;
  
  // Conclusion & Closing
  conclusionSummary?: string;
  nextMeetingDate?: string;
  nextMeetingAgenda?: string;
  
  // Signatures & Distribution (Decree 30)
  signatures: SignatureEntry[];
  distribution: {
    forAction: string[]; // Nơi nhận để thực hiện
    forInfo: string[]; // Nơi nhận để biết / lưu
  };
  
  // Workflow State & Versioning
  isSample?: boolean; // Đánh dấu dữ liệu mẫu
  status: MeetingStatus;
  version: string; // "1.0", "1.1", "2.0"
  previousVersionId?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  contentHash?: string;
  
  // Metadata & Logs
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLog[];
}

export interface TemplateDefinition {
  id: string;
  group: MeetingGroup;
  type: MeetingType;
  name: string;
  description: string;
  legalBasis?: string; // e.g. "Điều 150 Luật Doanh nghiệp 2020"
  requiredBlocks: string[];
  defaultQuorum?: number;
  badgeColor: string;
  iconName: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
  blockTarget?: string;
}
