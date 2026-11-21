import {
  ActionStatus,
  AttendanceStatus,
  MeetingStatus,
  ParticipantRole,
  PriorityLevel,
} from '../types';

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
    badgeClass: 'border border-rose-200 bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
  },
  high: {
    label: 'Cao',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  medium: {
    label: 'Trung bình',
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  },
  low: {
    label: 'Thấp',
    badgeClass: 'border border-slate-200/70 bg-slate-50 text-slate-500',
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
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-700',
    dotClass: 'bg-slate-400',
  },
  pending_review: {
    label: 'Chờ Chủ tọa duyệt',
    shortLabel: 'Chờ duyệt',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  approved: {
    label: 'Đã duyệt (Khóa)',
    shortLabel: 'Đã duyệt',
    badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  published: {
    label: 'Đã phát hành',
    shortLabel: 'Phát hành',
    badgeClass: 'border border-sky-200 bg-sky-50 text-sky-800',
    dotClass: 'bg-sky-500',
  },
  archived: {
    label: 'Lưu trữ',
    shortLabel: 'Lưu trữ',
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-600',
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
    badgeClass: 'border border-slate-200 bg-slate-50 text-slate-700',
    dotClass: 'bg-slate-400',
  },
  in_progress: {
    label: 'Đang thực hiện',
    badgeClass: 'border border-sky-200 bg-sky-50 text-sky-800',
    dotClass: 'bg-sky-500',
  },
  blocked: {
    label: 'Đang vướng mắc',
    badgeClass: 'border border-rose-200 bg-rose-50 text-rose-700',
    dotClass: 'bg-rose-500',
  },
  pending_approval: {
    label: 'Chờ nghiệm thu',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-800',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Đã hoàn thành',
    badgeClass: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Đã hủy',
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-500',
    dotClass: 'bg-slate-300',
  },
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'M';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_TONES = [
  'bg-slate-100 text-slate-700 border-slate-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  'bg-sky-50 text-sky-800 border-sky-200/80',
  'bg-amber-50 text-amber-800 border-amber-200/80',
  'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  'bg-teal-50 text-teal-800 border-teal-200/80',
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
      label: `Xong · ${deadline}`,
      toneClass: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      isOverdue: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${deadline}T00:00:00`);
  if (isNaN(target.getTime())) {
    return {
      label: deadline,
      toneClass: 'text-slate-600 bg-slate-100 border-slate-200/80',
      isOverdue: false,
    };
  }

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return {
      label: `Trễ ${Math.abs(diffDays)} ngày (${deadline})`,
      toneClass: 'text-rose-700 bg-rose-50 border-rose-200 font-semibold',
      isOverdue: true,
    };
  }
  if (diffDays === 0) {
    return {
      label: 'Hạn hôm nay',
      toneClass: 'text-amber-800 bg-amber-50 border-amber-200 font-semibold',
      isOverdue: false,
    };
  }
  if (diffDays === 1) {
    return {
      label: 'Hạn ngày mai',
      toneClass: 'text-amber-700 bg-amber-50/70 border-amber-200/70',
      isOverdue: false,
    };
  }
  if (diffDays <= 7) {
    return {
      label: `Còn ${diffDays} ngày (${deadline})`,
      toneClass: 'text-slate-700 bg-slate-100 border-slate-200',
      isOverdue: false,
    };
  }

  return {
    label: deadline,
    toneClass: 'text-slate-500 bg-slate-50 border-slate-200/70',
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

