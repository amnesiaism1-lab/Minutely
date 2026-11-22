import React, { useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import {
  LayoutDashboard,
  FolderKanban,
  Edit3,
  CheckSquare,
  FileSearch,
  X,
  Lock,
  Clock,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
  WandSparkles,
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
    meetings,
    currentMeeting,
    setCurrentMeetingId,
    directoryMembers,
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
      id: 'dashboard' as const,
      label: 'Tổng quan điều hành',
      icon: LayoutDashboard,
      badge: undefined as string | number | undefined,
      hasLiveDot: false,
      badgeColor: '',
    },
    {
      id: 'live' as const,
      label: 'Phòng ghi trực tiếp',
      icon: Edit3,
      hasLiveDot: currentMeeting?.status === 'draft',
      badge: currentMeeting?.status === 'pending_review' ? 'Chờ' : undefined,
      badgeColor: 'bg-amber-50 text-amber-800',
    },
    {
      id: 'preview' as const,
      label: 'Xem, Ký & Xuất bản',
      icon: FileSearch,
      badge: undefined,
      hasLiveDot: false,
      badgeColor: '',
    },
    {
      id: 'meetings' as const,
      label: 'Kho biên bản',
      icon: FolderKanban,
      badge: meetings.length,
      hasLiveDot: false,
      badgeColor: '',
    },
    {
      id: 'actions' as const,
      label: 'Bảng việc sau họp',
      icon: CheckSquare,
      badge: pendingTasksCount || undefined,
      hasLiveDot: false,
      badgeColor: 'bg-amber-50 text-amber-800',
    },
  ];

  const handleSelectNav = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    onCloseMobile?.();
  };

  const renderSidebarBody = (collapsed: boolean) => (
    <div className="flex h-full flex-col justify-between bg-[var(--surface-shell)]">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 lg:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Menu hệ thống
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
            aria-label="Đóng menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`space-y-5 ${collapsed ? 'p-2.5' : 'px-3 pt-1.5 pb-4'}`}>
          {/* Active Meeting Context Selector — Airy Single-Line Header & Buttons */}
          {!collapsed && currentMeeting && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3 shadow-2xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Hồ sơ đang mở
                </span>
                {currentMeeting.status === 'approved' ||
                currentMeeting.status === 'published' ||
                currentMeeting.status === 'archived' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    <Lock className="h-2.5 w-2.5" />
                    Khóa v{currentMeeting.version}
                  </span>
                ) : currentMeeting.status === 'pending_review' ? (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <Clock className="h-2.5 w-2.5" />
                    Chờ duyệt
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600">
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
                className="w-full cursor-pointer truncate rounded-xl border border-slate-200/90 bg-[var(--surface-well)] px-2.5 py-1.5 text-[12.5px] font-medium text-slate-800 transition-colors hover:border-slate-300 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                title={currentMeeting.title}
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white text-slate-900">
                    [{m.code}] {m.title}
                  </option>
                ))}
              </select>

              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectNav('live')}
                  className={`press-subtle flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[12px] font-medium ${
                    activeTab === 'live'
                      ? 'bg-[#1d4ed8] text-white'
                      : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 hover:text-slate-950'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span>Ghi chép</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectNav('preview')}
                  className={`press-subtle flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[12px] font-medium ${
                    activeTab === 'preview'
                      ? 'bg-[#1d4ed8] text-white'
                      : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/70 hover:text-slate-950'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span>Xem & Ký</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Navigation — Google Material 3 Pill Navigation */}
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Không gian làm việc
              </p>
            )}
            <nav className="space-y-0.5" aria-label="Điều hướng chính">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group press-subtle relative flex h-9.5 w-full cursor-pointer items-center ${
                      collapsed ? 'justify-center rounded-xl px-2' : 'justify-between rounded-full px-3'
                    } text-left text-[13px] transition-all ${
                      isActive
                        ? 'bg-[var(--brand-container)] font-semibold text-[var(--on-brand-container)]'
                        : 'font-normal text-slate-700 hover:bg-[var(--surface-hover)] hover:text-slate-950'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-[#1d4ed8]' : 'text-slate-500 group-hover:text-slate-800'
                        }`}
                        strokeWidth={isActive ? 2 : 1.75}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && item.hasLiveDot && (
                      <span
                        className="ml-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                        title="Phiên nháp đang mở"
                      />
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                          isActive
                            ? 'bg-white/90 text-[#0b3d91]'
                            : item.badgeColor || 'bg-white/85 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge !== undefined && typeof item.badge === 'number' && (
                      <span
                        className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Document Formatting & Master Data */}
          <div className="space-y-0.5 border-t border-slate-200/70 pt-3">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Văn thư & Danh mục
              </p>
            )}

            <button
              type="button"
              onClick={() => handleSelectNav('format-word')}
              aria-current={activeTab === 'format-word' ? 'page' : undefined}
              title={collapsed ? 'Chuẩn hóa Word & Văn bản' : undefined}
              className={`group press-subtle relative flex h-9.5 w-full cursor-pointer items-center ${
                collapsed ? 'justify-center rounded-xl px-2' : 'justify-between rounded-full px-3'
              } text-left text-[13px] transition-all ${
                activeTab === 'format-word'
                  ? 'bg-[var(--brand-container)] font-semibold text-[var(--on-brand-container)]'
                  : 'font-normal text-slate-700 hover:bg-[var(--surface-hover)] hover:text-slate-950'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <WandSparkles
                  className={`h-4 w-4 shrink-0 ${
                    activeTab === 'format-word'
                      ? 'text-[#1d4ed8]'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                  strokeWidth={activeTab === 'format-word' ? 2 : 1.75}
                />
                {!collapsed && <span className="truncate">Chuẩn hóa Word & VB</span>}
              </span>
              {!collapsed && (
                <span
                  className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                    activeTab === 'format-word'
                      ? 'bg-white/90 text-[#0b3d91]'
                      : 'bg-blue-50 text-[#0b3d91]'
                  }`}
                >
                  NĐ 30
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectNav('directory')}
              aria-current={activeTab === 'directory' ? 'page' : undefined}
              title={collapsed ? 'Danh bạ & Đơn vị' : undefined}
              className={`group press-subtle relative flex h-9.5 w-full cursor-pointer items-center ${
                collapsed ? 'justify-center rounded-xl px-2' : 'justify-between rounded-full px-3'
              } text-left text-[13px] transition-all ${
                activeTab === 'directory'
                  ? 'bg-[var(--brand-container)] font-semibold text-[var(--on-brand-container)]'
                  : 'font-normal text-slate-700 hover:bg-[var(--surface-hover)] hover:text-slate-950'
              }`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <UsersRound
                  className={`h-4 w-4 shrink-0 ${
                    activeTab === 'directory'
                      ? 'text-[#1d4ed8]'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                  strokeWidth={activeTab === 'directory' ? 2 : 1.75}
                />
                {!collapsed && <span className="truncate">Danh bạ & Đơn vị</span>}
              </span>
              {!collapsed && (
                <span
                  className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                    activeTab === 'directory'
                      ? 'bg-white/90 text-[#0b3d91]'
                      : 'bg-white/85 text-slate-600'
                  }`}
                >
                  {directoryMembers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer + Collapse Toggle */}
      <div className="shrink-0 px-3.5 py-2.5">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 rounded-xl px-0.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-600">Đồng bộ trực tuyến</span>
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 lg:inline-flex"
                title="Thu gọn thanh điều hướng"
                aria-label="Thu gọn thanh điều hướng"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
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
      {/* Desktop Sidebar */}
      <aside
        className={`no-print hidden shrink-0 select-none flex-col bg-[var(--surface-shell)] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
          isCollapsed ? 'w-[68px]' : 'w-[260px]'
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
          <aside className="animate-drawer-enter relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-[var(--surface-shell)] shadow-2xl">
            {renderSidebarBody(false)}
          </aside>
        </div>
      )}
    </>
  );
};
