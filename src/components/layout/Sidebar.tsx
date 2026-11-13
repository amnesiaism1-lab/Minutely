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
      badge: currentMeeting?.status === 'draft' ? 'Đang mở' : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    },
    {
      id: 'actions',
      label: 'Bảng việc & Nhiệm vụ',
      icon: CheckSquare,
      badge: meetings
        .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
        .filter((a) => a.status !== 'completed').length || undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/80',
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
    { id: 'ALL', label: 'Tất cả loại hình', icon: Building, count: meetings.length },
    {
      id: 'B',
      label: 'B. Pháp lý DN (Luật DN 2020)',
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
      label: 'D. Đối ngoại & Khách hàng',
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
    <aside className="no-print w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3.5 space-y-6">
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
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white font-medium shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-slate-800 text-slate-200'
                          : item.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200/60'
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
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200/80'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`} />
                    <span className="truncate">{group.label}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-white text-slate-800 border border-slate-200/60 font-semibold' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {group.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legal & Compliance Notice */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Quy chuẩn pháp lý tích hợp</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tự động kiểm soát tỷ lệ túc số, biểu quyết theo Luật Doanh nghiệp 2020 và định dạng chuẩn thể thức Nghị định 30/2020/NĐ-CP.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-200/70 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-700">Minutely Platform</span>
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Trực tuyến</span>
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Tuân thủ pháp chế doanh nghiệp Việt Nam
        </p>
      </div>
    </aside>
  );
};
