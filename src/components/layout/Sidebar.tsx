import React, { useEffect } from 'react';
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
  X,
  FileText,
  Lock,
  Clock,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const {
    activeTab,
    setActiveTab,
    selectedGroupFilter,
    setSelectedGroupFilter,
    meetings,
    currentMeeting,
    setCurrentMeetingId,
  } = useMeetingContext();

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isMobileOpen, onCloseMobile]);

  const pendingTasksCount = meetings
    .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan điều hành',
      icon: LayoutDashboard,
      badge: undefined as string | number | undefined,
    },
    {
      id: 'meetings',
      label: 'Kho biên bản cuộc họp',
      icon: FolderKanban,
      badge: meetings.length,
    },
    {
      id: 'live',
      label: 'Phòng ghi trực tiếp',
      icon: Edit3,
      badge:
        currentMeeting?.status === 'draft'
          ? 'Đang mở'
          : currentMeeting?.status === 'pending_review'
          ? 'Chờ duyệt'
          : undefined,
      badgeColor:
        currentMeeting?.status === 'draft'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          : 'bg-amber-50 text-amber-800 border border-amber-200/80',
    },
    {
      id: 'preview',
      label: 'Duyệt, Ký & Xuất bản',
      icon: FileSearch,
      badge: undefined,
    },
    {
      id: 'actions',
      label: 'Bảng việc & Giải trình',
      icon: CheckSquare,
      badge: pendingTasksCount || undefined,
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
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
      label: 'B. Pháp lý doanh nghiệp',
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
      label: 'D. Đối ngoại & Đàm phán',
      icon: Handshake,
      count: meetings.filter((m) => m.group === 'D').length,
    },
    {
      id: 'E',
      label: 'E. Đoàn thể & Cộng đồng',
      icon: Users,
      count: meetings.filter((m) => m.group === 'E').length,
    },
  ];

  const handleSelectNav = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    onCloseMobile?.();
  };

  const renderSidebarBody = (collapsed: boolean) => (
    <div className="flex h-full flex-col justify-between bg-[var(--surface-panel)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Menu hệ thống
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`space-y-5 ${collapsed ? 'p-2.5' : 'p-3.5 pb-4'}`}>
          {/* Active Meeting Context Selector (Hidden when collapsed into icon rail) */}
          {!collapsed && currentMeeting && (
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 shadow-2xs">
              <div className="mb-1.5 flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <FileText className="h-3 w-3 text-slate-400" strokeWidth={1.75} />
                  <span>Hồ sơ đang chọn</span>
                </span>
                {currentMeeting.status === 'approved' ||
                currentMeeting.status === 'published' ||
                currentMeeting.status === 'archived' ? (
                  <span className="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                    <Lock className="h-2.5 w-2.5" />
                    Khóa v{currentMeeting.version}
                  </span>
                ) : currentMeeting.status === 'pending_review' ? (
                  <span className="inline-flex items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                    <Clock className="h-2.5 w-2.5" />
                    Chờ duyệt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-600">
                    Nháp v{currentMeeting.version}
                  </span>
                )}
              </div>

              <label htmlFor="active-meeting-select" className="sr-only">
                Chuyển đổi biên bản đang làm việc
              </label>
              <select
                id="active-meeting-select"
                value={currentMeeting.id}
                onChange={(e) => setCurrentMeetingId(e.target.value)}
                className="w-full cursor-pointer truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs transition-colors hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                title={currentMeeting.title}
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.title}
                  </option>
                ))}
              </select>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectNav('live')}
                  className={`press-subtle flex cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                    activeTab === 'live'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="h-3 w-3" strokeWidth={1.75} />
                  <span>Ghi chép</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectNav('preview')}
                  className={`press-subtle flex cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                    activeTab === 'preview'
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                  <span>Bản in & Ký</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Không gian làm việc
              </p>
            )}
            <nav className="space-y-1" aria-label="Điều hướng chính">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id as typeof activeTab)}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group press-subtle relative flex w-full cursor-pointer items-center ${
                      collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                    } rounded-lg text-left text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    {isActive && !collapsed && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-emerald-400"
                        aria-hidden
                      />
                    )}
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                        strokeWidth={1.75}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && item.badge !== undefined && (
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
                    {collapsed && item.badge !== undefined && typeof item.badge === 'number' && (
                      <span
                        className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Group Filter */}
          {!collapsed && (
            <div>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Phân nhóm biên bản
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
                        if (activeTab !== 'meetings') {
                          setActiveTab('meetings');
                        }
                        onCloseMobile?.();
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${
                        isSelected && activeTab === 'meetings'
                          ? 'border border-slate-200 bg-slate-100/80 font-semibold text-slate-900'
                          : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isSelected && activeTab === 'meetings'
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                          strokeWidth={1.75}
                        />
                        <span className="truncate">{group.label}</span>
                      </span>
                      <span
                        className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] tabular-nums ${
                          isSelected && activeTab === 'meetings'
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
          )}

          {/* Legal notice */}
          {!collapsed && (
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
                <span>Chuẩn pháp chế Việt Nam</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Kiểm soát túc số, biểu quyết theo Điều 60, 150, 158 Luật DN 2020 và thể thức Nghị
                định 30/2020/NĐ-CP.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer + Collapse Toggle */}
      <div className="shrink-0 border-t border-slate-200/80 bg-[var(--surface-panel)] px-3 py-2.5">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700">Minutely</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Đồng bộ
                </span>
              </div>
              <p className="truncate text-[10px] text-slate-400">Bảo toàn chữ ký & SHA-256</p>
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden cursor-pointer rounded-lg border border-slate-200/80 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
                title="Thu gọn thanh điều hướng"
                aria-label="Thu gọn thanh điều hướng"
              >
                <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex cursor-pointer rounded-lg border border-slate-200/80 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                title="Mở rộng thanh điều hướng"
                aria-label="Mở rộng thanh điều hướng"
              >
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (smooth collapsible width) */}
      <aside
        className={`no-print hidden shrink-0 select-none flex-col border-r border-slate-200/90 bg-[var(--surface-panel)] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
          isCollapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {renderSidebarBody(isCollapsed)}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="animate-backdrop-enter fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden
          />
          <aside className="animate-drawer-enter relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-[var(--surface-panel)] shadow-2xl">
            {renderSidebarBody(false)}
          </aside>
        </div>
      )}
    </>
  );
};
