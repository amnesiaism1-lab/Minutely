import {
  ActionStatus,
  AttendanceStatus,
  MeetingGroup,
  MeetingStatus,
  OpinionType,
  ParticipantRole,
  PriorityLevel,
} from '../types';

export const GROUP_META: Record<
  MeetingGroup,
  {
    code: MeetingGroup;
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
    borderLeftClass: string;
    borderTopClass: string;
    iconBoxClass: string;
    activeFilterClass: string;
  }
> = {
  B: {
    code: 'B',
    label: 'Nhóm B · Pháp lý DN',
    shortLabel: 'Nhóm B',
    badgeClass: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200/50',
    dotClass: 'bg-blue-600',
    borderLeftClass: 'border-l-blue-600',
    borderTopClass: 'border-t-blue-600',
    iconBoxClass: 'bg-blue-50 text-blue-700',
    activeFilterClass: 'border-blue-300 bg-[#d3e3fd] text-[#0b3d91] font-medium',
  },
  A: {
    code: 'A',
    label: 'Nhóm A · Nội bộ',
    shortLabel: 'Nhóm A',
    badgeClass: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200/50',
    dotClass: 'bg-sky-600',
    borderLeftClass: 'border-l-sky-600',
    borderTopClass: 'border-t-sky-600',
    iconBoxClass: 'bg-sky-50 text-sky-700',
    activeFilterClass: 'border-sky-300 bg-sky-100/90 text-sky-950 font-medium',
  },
  C: {
    code: 'C',
    label: 'Nhóm C · Kỹ thuật & Dự án',
    shortLabel: 'Nhóm C',
    badgeClass: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200/50',
    dotClass: 'bg-teal-600',
    borderLeftClass: 'border-l-teal-600',
    borderTopClass: 'border-t-teal-600',
    iconBoxClass: 'bg-teal-50 text-teal-700',
    activeFilterClass: 'border-teal-300 bg-teal-100/90 text-teal-950 font-medium',
  },
  D: {
    code: 'D',
    label: 'Nhóm D · Đối ngoại',
    shortLabel: 'Nhóm D',
    badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/55',
    dotClass: 'bg-amber-500',
    borderLeftClass: 'border-l-amber-500',
    borderTopClass: 'border-t-amber-500',
    iconBoxClass: 'bg-amber-50 text-amber-800',
    activeFilterClass: 'border-amber-300 bg-amber-100/90 text-amber-950 font-medium',
  },
  E: {
    code: 'E',
    label: 'Nhóm E · Đoàn thể',
    shortLabel: 'Nhóm E',
    badgeClass: 'bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-200/50',
    dotClass: 'bg-indigo-600',
    borderLeftClass: 'border-l-indigo-600',
    borderTopClass: 'border-t-indigo-600',
    iconBoxClass: 'bg-indigo-50 text-indigo-700',
    activeFilterClass: 'border-indigo-300 bg-indigo-100/90 text-indigo-950 font-medium',
  },
};

export const OPINION_TYPE_META: Record<
  OpinionType,
  {
    label: string;
    cmd: string;
    badgeClass: string;
    activePillClass: string;
    borderLeftClass: string;
  }
> = {
  opinion: {
    label: 'Ý kiến',
    cmd: '/yk',
    badgeClass: 'bg-slate-100 text-slate-700',
    activePillClass: 'bg-slate-800 text-white shadow-2xs',
    borderLeftClass: 'border-l-slate-300',
  },
  proposal: {
    label: 'Đề xuất',
    cmd: '/dx',
    badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/55',
    activePillClass: 'bg-amber-600 text-white shadow-2xs',
    borderLeftClass: 'border-l-amber-400',
  },
  counter: {
    label: 'Phản biện',
    cmd: '/pb',
    badgeClass: 'bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200/55',
    activePillClass: 'bg-rose-600 text-white shadow-2xs',
    borderLeftClass: 'border-l-rose-400',
  },
  clarify: {
    label: 'Làm rõ',
    cmd: '/lr',
    badgeClass: 'bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-200/55',
    activePillClass: 'bg-[#1d4ed8] text-white shadow-2xs',
    borderLeftClass: 'border-l-blue-400',
  },
};

export const PRIORITY_META: Record<
  PriorityLevel,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  urgent: {
    label: 'Khẩn cấp',
    badgeClass: 'bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
  },
  high: {
    label: 'Cao',
    badgeClass: 'bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
  },
  low: {
    label: 'Thấp',
    badgeClass: 'bg-slate-50 text-slate-500',
    dotClass: 'bg-slate-300',
  },
};

export const MEETING_STATUS_META: Record<
  MeetingStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  draft: {
    label: 'Bản nháp',
    shortLabel: 'Nháp',
    badgeClass: 'bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
  },
  pending_review: {
    label: 'Chờ Chủ tọa duyệt',
    shortLabel: 'Chờ duyệt',
    badgeClass: 'bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  approved: {
    label: 'Đã duyệt',
    shortLabel: 'Đã duyệt',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  published: {
    label: 'Đã phát hành',
    shortLabel: 'Phát hành',
    badgeClass: 'bg-blue-50 text-blue-700',
    dotClass: 'bg-blue-500',
  },
  archived: {
    label: 'Lưu trữ',
    shortLabel: 'Lưu trữ',
    badgeClass: 'bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
  },
};

export const ACTION_STATUS_META: Record<
  ActionStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  not_started: {
    label: 'Chưa bắt đầu',
    badgeClass: 'bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  },
  in_progress: {
    label: 'Đang thực hiện',
    badgeClass: 'bg-blue-50 text-blue-800',
    dotClass: 'bg-blue-500',
  },
  blocked: {
    label: 'Đang vướng mắc',
    badgeClass: 'bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
  },
  pending_approval: {
    label: 'Chờ nghiệm thu',
    badgeClass: 'bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeClass: 'bg-emerald-50 text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeClass: 'bg-slate-100 text-slate-500',
    dotClass: 'bg-slate-400',
  },
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TONES = [
  'bg-slate-100 text-slate-700',
  'bg-emerald-50 text-emerald-700',
  'bg-sky-50 text-sky-700',
  'bg-amber-50 text-amber-800',
  'bg-blue-50 text-blue-700',
  'bg-teal-50 text-teal-700',
];

export function getAvatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function formatRelativeDeadline(
  deadline: string,
  status: ActionStatus
): {
  label: string;
  toneClass: string;
  isOverdue: boolean;
} {
  if (status === 'completed') {
    return {
      label: 'Hoàn thành',
      toneClass: 'text-emerald-700 bg-emerald-50/80 border-transparent',
      isOverdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadline}T00:00:00`);
  if (isNaN(target.getTime())) {
    return {
      label: deadline,
      toneClass: 'text-slate-500 bg-slate-100/70 border-transparent',
      isOverdue: false,
    };
  }

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Trễ ${Math.abs(diffDays)} ngày`,
      toneClass: 'text-rose-600 bg-rose-50/80 border-transparent font-medium',
      isOverdue: true,
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Hôm nay',
      toneClass: 'text-amber-700 bg-amber-50 border-transparent font-medium',
      isOverdue: false,
    };
  }
  if (diffDays === 1) {
    return {
      label: 'Ngày mai',
      toneClass: 'text-amber-700 bg-amber-50/70 border-transparent',
      isOverdue: false,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `Còn ${diffDays} ngày`,
      toneClass: 'text-slate-600 bg-slate-100/80 border-transparent',
      isOverdue: false,
    };
  }

  return {
    label: deadline,
    toneClass: 'text-slate-500 bg-transparent border-transparent',
    isOverdue: false,
  };
}

export function formatAttendanceStatus(
  status: AttendanceStatus,
  delegatedTo?: string
): string {
  switch (status) {
    case 'present':
      return 'Có mặt';
    case 'late':
      return 'Đến muộn';
    case 'left_early':
      return 'Về sớm';
    case 'delegated':
      return `Ủy quyền hợp lệ cho ${delegatedTo || 'đại diện'}`;
    case 'absent_permitted':
      return 'Vắng có phép';
    case 'absent_unexcused':
      return 'Vắng không phép';
    default:
      return 'Vắng mặt';
  }
}

export function formatParticipantRole(role: ParticipantRole): string {
  switch (role) {
    case 'chairperson':
      return 'Chủ tọa';
    case 'secretary':
      return 'Thư ký';
    case 'scrutineer':
      return 'Ban kiểm phiếu';
    case 'guest':
      return 'Khách mời';
    default:
      return 'Thành viên';
  }
}
