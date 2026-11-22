import React, { useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import {
  LayoutDashboard,
  FolderKanban,
  Edit3,
  CheckSquare,
  FileSearch,
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
      id: 'dashboard' as const,
      label: 'Tổng quan điều hành',
      icon: LayoutDashboard,
      badge: undefined as string | number | undefined,
    },
    {
      id: 'live' as const,
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
      id: 'preview' as const,
      label: 'Xem, Ký & Xuất bản',
      icon: FileSearch,
      badge: undefined,
    },
    {
      id: 'meetings' as const,
      label: 'Kho biên bản',
      icon: FolderKanban,
      badge: meetings.length,
    },
    {
      id: 'actions' as const,
      label: 'Bảng việc sau họp',
      icon: CheckSquare,
      badge: pendingTasksCount || undefined,
      badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
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

        <div className={`space-y-5 ${collapsed ? 'p-2.5' : 'px-3 pt-1 pb-4'}`}>
          {/* Active Meeting Context Selector — Clean Elevated M3 Surface Card */}
          {!collapsed && currentMeeting && (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3.5 shadow-2xs">
              <div className="mb-2 flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <FileText className="h-3.5 w-3.5 text-[#1d4ed8]" strokeWidth={2} />
                  <span>Hồ sơ đang chọn</span>
                </span>
                {currentMeeting.status === 'approved' ||
                currentMeeting.status === 'published' ||
                currentMeeting.status === 'archived' ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                    <Lock className="h-2.5 w-2.5" />
                    Khóa v{currentMeeting.version}
                  </span>
                ) : currentMeeting.status === 'pending_review' ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                    <Clock className="h-2.5 w-2.5" />
                    Chờ duyệt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900">
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
                className="w-full cursor-pointer truncate rounded-xl border border-slate-300/80 bg-[var(--surface-well)] px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-[#1d4ed8]/50 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                title={currentMeeting.title}
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id} className="bg-white text-slate-900">
                    [{m.code}] {m.title}
                  </option>
                ))}
              </select>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectNav('live')}
                  className={`press-subtle flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-semibold ${
                    activeTab === 'live'
                      ? 'bg-[#1d4ed8] text-white shadow-2xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" strokeWidth={1.85} />
                  <span>Ghi chép</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectNav('preview')}
                  className={`press-subtle flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-semibold ${
                    activeTab === 'preview'
                      ? 'bg-[#1d4ed8] text-white shadow-2xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.85} />
                  <span>Bản in & Ký</span>
                </button>
              </div>
            </div>
          )}

          {/* Main Navigation — Google Material 3 Pill Navigation */}
          <div>
            {!collapsed && (
              <p className="mb-2 px-3.5 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
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
                    onClick={() => handleSelectNav(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`group press-subtle relative flex h-10 w-full cursor-pointer items-center ${
                      collapsed ? 'justify-center rounded-xl px-2' : 'justify-between rounded-full px-3.5'
                    } text-left text-[13.5px] transition-all ${
                      isActive
                        ? 'bg-[var(--brand-container)] font-semibold text-[var(--on-brand-container)]'
                        : 'font-medium text-slate-700 hover:bg-[var(--surface-hover)] hover:text-slate-950'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 ${
                          isActive ? 'text-[#1d4ed8]' : 'text-slate-500 group-hover:text-slate-800'
                        }`}
                        strokeWidth={isActive ? 2.1 : 1.85}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                          isActive
                            ? 'bg-white/90 text-[#0b3d91]'
                            : item.badgeColor ||
                              'border border-slate-300/70 bg-white text-slate-700'
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
        </div>
      </div>

      {/* Footer + Collapse Toggle */}
      <div className="shrink-0 px-3.5 py-3">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2 rounded-xl px-1">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Minutely</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Đồng bộ
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-600">
                Bảo toàn SHA-256 · Keep-alive DB
              </p>
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden cursor-pointer rounded-lg border border-slate-300/80 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:inline-flex"
                title="Thu gọn thanh điều hướng"
                aria-label="Thu gọn thanh điều hướng"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.85} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex cursor-pointer rounded-lg border border-slate-300/80 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                title="Mở rộng thanh điều hướng"
                aria-label="Mở rộng thanh điều hướng"
              >
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.85} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Google M3 seamless outer shell) */}
      <aside
        className={`no-print hidden shrink-0 select-none flex-col bg-[var(--surface-shell)] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex ${
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
          <aside className="animate-drawer-enter relative z-10 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-[var(--surface-shell)] shadow-2xl">
            {renderSidebarBody(false)}
          </aside>
        </div>
      )}
    </>
  );
};
