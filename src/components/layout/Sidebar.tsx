import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import {
  LayoutDashboard,
  FolderKanban,
  Edit3,
  CheckSquare,
  BookOpen,
  FileSearch,
  Scale,
  Building,
  Terminal,
  Handshake,
  Users,
  ShieldCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedGroupFilter,
    setSelectedGroupFilter,
    meetings,
    currentMeeting,
  } = useMeetingContext();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan không gian',
      icon: LayoutDashboard,
      badge: undefined as string | number | undefined,
    },
    {
      id: 'meetings',
      label: 'Kho biên bản',
      icon: FolderKanban,
      badge: meetings.length,
    },
    {
      id: 'live',
      label: 'Ghi chép trực tiếp',
      icon: Edit3,
      badge: currentMeeting?.status === 'draft' ? 'Đang mở' : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    },
    {
      id: 'actions',
      label: 'Bảng việc & Nhiệm vụ',
      icon: CheckSquare,
      badge:
        meetings
          .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
          .filter((a) => a.status !== 'completed').length || undefined,
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    },
    {
      id: 'preview',
      label: 'Xem & Xuất bản',
      icon: FileSearch,
      badge: undefined,
    },
    {
      id: 'templates',
      label: 'Thư viện mẫu chuẩn',
      icon: BookOpen,
      badge: '14',
    },
  ];

  const groupFilters = [
    { id: 'ALL', label: 'Tất cả loại hình', icon: Building, count: meetings.length },
    {
      id: 'B',
      label: 'B. Pháp lý DN',
      icon: Scale,
      count: meetings.filter((m) => m.group === 'B').length,
    },
    {
      id: 'A',
      label: 'A. Nội bộ điều hành',
      icon: Building,
      count: meetings.filter((m) => m.group === 'A').length,
    },
    {
      id: 'C',
      label: 'C. Kỹ thuật & Dự án',
      icon: Terminal,
      count: meetings.filter((m) => m.group === 'C').length,
    },
    {
      id: 'D',
      label: 'D. Đối ngoại',
      icon: Handshake,
      count: meetings.filter((m) => m.group === 'D').length,
    },
    {
      id: 'E',
      label: 'E. Đoàn thể & Sự kiện',
      icon: Users,
      count: meetings.filter((m) => m.group === 'E').length,
    },
  ];

  return (
    <aside className="no-print flex w-64 shrink-0 select-none flex-col border-r border-slate-200/90 bg-white">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="space-y-6 p-3.5 pb-4">
          {/* Main Navigation */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Điều hướng
            </p>
            <nav className="space-y-0.5" aria-label="Điều hướng chính">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as typeof activeTab)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-400"
                        aria-hidden
                      />
                    )}
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-2 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          isActive
                            ? 'bg-white/15 text-slate-100'
                            : item.badgeColor ||
                              'border border-slate-200/70 bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group Filter */}
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Phân loại nghiệp vụ
            </p>
            <div className="space-y-0.5" role="listbox" aria-label="Lọc theo nhóm">
              {groupFilters.map((group) => {
                const Icon = group.icon;
                const isSelected = selectedGroupFilter === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedGroupFilter(group.id);
                      if (activeTab === 'dashboard') {
                        setActiveTab('meetings');
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'border border-slate-200 bg-slate-50 font-semibold text-slate-900'
                        : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? 'text-slate-800' : 'text-slate-400'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span
                      className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                        isSelected
                          ? 'border border-slate-200/80 bg-white font-semibold text-slate-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {group.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legal notice */}
          <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
              <span>Quy chuẩn pháp lý</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Kiểm soát túc số, biểu quyết theo Luật DN 2020 và thể thức Nghị định
              30/2020/NĐ-CP.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200/80 bg-white px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-700">Minutely</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Trực tuyến
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Tuân thủ pháp chế doanh nghiệp Việt Nam
        </p>
      </div>
    </aside>
  );
};
