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
  ShieldAlert,
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
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
      badge: undefined,
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
      badge: currentMeeting?.status === 'draft' ? 'Đang họp' : undefined,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'actions',
      label: 'Bảng việc & Kanban',
      icon: CheckSquare,
      badge: meetings
        .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
        .filter((a) => a.status !== 'completed').length,
      badgeColor: 'bg-amber-500 text-white',
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
      badge: '14 Mẫu',
    },
  ];

  const groupFilters = [
    { id: 'ALL', label: 'Tất cả nhóm', icon: Building, count: meetings.length },
    {
      id: 'B',
      label: 'B. Pháp lý DN (Luật DN 2020)',
      icon: Scale,
      count: meetings.filter((m) => m.group === 'B').length,
    },
    {
      id: 'A',
      label: 'A. Nội bộ doanh nghiệp',
      icon: Building,
      count: meetings.filter((m) => m.group === 'A').length,
    },
    {
      id: 'C',
      label: 'C. Dự án & Phần mềm',
      icon: Terminal,
      count: meetings.filter((m) => m.group === 'C').length,
    },
    {
      id: 'D',
      label: 'D. Đối ngoại & Khách hàng',
      icon: Handshake,
      count: meetings.filter((m) => m.group === 'D').length,
    },
    {
      id: 'E',
      label: 'E. Đoàn thể, cộng đồng',
      icon: Users,
      count: meetings.filter((m) => m.group === 'E').length,
    },
  ];

  return (
    <aside className="no-print w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Điều hướng chính
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
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
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Phân loại nghiệp vụ
          </p>
          <div className="space-y-1">
            {groupFilters.map((group) => {
              const Icon = group.icon;
              const isSelected = selectedGroupFilter === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroupFilter(group.id);
                    if (activeTab === 'dashboard') {
                      setActiveTab('meetings');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{group.label}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legal & Compliance Notice */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Quy chuẩn pháp lý</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hệ thống tự động kiểm tra túc số & tỷ lệ biểu quyết theo Luật Doanh nghiệp 2020 và thể thức Nghị định 30/2020/NĐ-CP.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Minutely v1.0.0</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online / Vercel</span>
        </span>
      </div>
    </aside>
  );
};
