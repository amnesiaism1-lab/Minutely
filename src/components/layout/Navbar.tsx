import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import {
  FileText,
  Search,
  PlusCircle,
  UserRound,
  RotateCcw,
  Eraser,
  Menu,
  Shield,
  Eye,
  Sun,
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  comfortMode?: boolean;
  onToggleComfortMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onToggleMobileSidebar,
  onOpenCommandPalette,
  comfortMode = false,
  onToggleComfortMode,
}) => {
  const {
    currentUser,
    setCurrentUser,
    setActiveTab,
    isGuest,
    isDemoActive,
    clearAllDemoData,
    restoreDemoData,
  } = useMeetingContext();

  const userRoles = [
    {
      id: 'p1',
      name: 'Nguyễn Văn Hùng',
      role: 'chairperson' as const,
      roleBadge: 'Chủ tọa',
      title: 'Chủ tịch HĐQT',
      email: 'hung.nguyen@vinacorp.vn',
    },
    {
      id: 'p2',
      name: 'Trần Thị Thu Hà',
      role: 'secretary' as const,
      roleBadge: 'Thư ký',
      title: 'Trưởng ban Pháp chế',
      email: 'ha.tran@vinacorp.vn',
    },
    {
      id: 'p3',
      name: 'Lê Hoàng Minh',
      role: 'member' as const,
      roleBadge: 'Thành viên',
      title: 'Đại diện Cổ đông lớn',
      email: 'minh.le@dragoncapital.com',
    },
    {
      id: 'p11',
      name: 'Trương Tuấn Anh',
      role: 'admin' as const,
      roleBadge: 'Quản trị',
      title: 'Giám đốc Công nghệ',
      email: 'anh.truong@vinacorp.vn',
    },
  ];

  const roleBadgeColor =
    currentUser.role === 'chairperson'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : currentUser.role === 'secretary'
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : currentUser.role === 'admin'
      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const roleLabel =
    currentUser.role === 'chairperson'
      ? 'Chủ tọa'
      : currentUser.role === 'secretary'
      ? 'Thư ký'
      : currentUser.role === 'admin'
      ? 'Quản trị'
      : 'Thành viên';

  return (
    <header className="no-print sticky top-0 z-30 h-14 border-b border-slate-200/80 bg-[var(--surface-shell)] text-slate-900 lg:border-b-0">
      <div className="flex h-full w-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
        {/* Left: Hamburger (Mobile) + Brand Lockup */}
        <div className="flex items-center gap-2.5 lg:w-60">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="press-subtle inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-300/80 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-4 w-4" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl py-1 text-left transition-opacity hover:opacity-90"
            aria-label="Về trang tổng quan Minutely"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d4ed8] text-white shadow-xs">
              <FileText className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-tight text-slate-900">
                  Minutely
                </span>
                <span className="hidden rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-900 xl:inline">
                  NĐ 30
                </span>
              </div>
              <p className="hidden text-[11.5px] leading-tight text-slate-600 sm:block">
                Biên bản & quyết nghị pháp lý
              </p>
            </div>
          </button>
        </div>

        {/* Center: Google Workspace Style Pill Omnisearch */}
        <div className="mx-2 hidden min-w-0 flex-1 md:flex md:max-w-lg lg:max-w-xl">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="group flex h-9.5 w-full cursor-pointer items-center justify-between gap-2.5 rounded-full border border-slate-300/85 bg-white px-4 text-left text-[13.5px] text-slate-600 shadow-2xs transition-all hover:border-[#1d4ed8]/60 hover:text-slate-900 hover:shadow-xs"
            aria-label="Mở tìm kiếm và lệnh nhanh (Ctrl+K)"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Search
                className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-[#1d4ed8]"
                strokeWidth={2}
              />
              <span className="truncate">
                Tìm nhanh biên bản, nhiệm vụ, mẫu chuẩn…
              </span>
            </span>
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 sm:inline-block">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Mobile Omnisearch button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="press-subtle inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-300/80 bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 md:hidden"
            title="Tìm kiếm nhanh (Ctrl+K)"
            aria-label="Tìm kiếm nhanh"
          >
            <Search className="h-4 w-4" strokeWidth={2} />
          </button>

          {/* Eye-Comfort Paper Mode Toggle */}
          {onToggleComfortMode && (
            <button
              type="button"
              onClick={onToggleComfortMode}
              aria-pressed={comfortMode}
              className={`press-subtle inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                comfortMode
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950'
              }`}
              title={
                comfortMode
                  ? 'Đang bật Chế độ Dịu mắt (giấy ấm) — Bấm để về nền sáng chuẩn'
                  : 'Bật Chế độ Dịu mắt (giấy ấm) giảm mỏi mắt khi họp lâu'
              }
            >
              {comfortMode ? (
                <Sun className="h-4 w-4 text-amber-600" strokeWidth={1.85} />
              ) : (
                <Eye className="h-4 w-4 text-slate-600" strokeWidth={1.85} />
              )}
              <span className="hidden xl:inline">
                {comfortMode ? 'Dịu mắt' : 'Nền chuẩn'}
              </span>
            </button>
          )}

          {/* Guest sandbox controls */}
          {isGuest && (
            <div className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs 2xl:flex">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-amber-800" strokeWidth={1.85} />
              <span className="font-semibold text-amber-950">Dùng thử</span>
              <span className="text-amber-300" aria-hidden>
                |
              </span>
              {isDemoActive ? (
                <button
                  type="button"
                  onClick={clearAllDemoData}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-amber-900 transition-colors hover:text-amber-950"
                  title="Bỏ các biên bản mẫu để bắt đầu kho trống"
                >
                  <Eraser className="h-3.5 w-3.5" strokeWidth={1.85} />
                  <span>Xóa mẫu</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restoreDemoData}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-emerald-800 transition-colors hover:text-emerald-950"
                  title="Nạp lại biên bản mẫu chuẩn hóa"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.85} />
                  <span>Nạp lại mẫu</span>
                </button>
              )}
            </div>
          )}

          <GoogleAuthButton />

          {/* Role / Persona Switcher for testing RBAC */}
          {!currentUser.isGoogleAuth && (
            <div className="flex h-9 items-center rounded-full border border-slate-300/80 bg-white pl-2 pr-1.5 shadow-2xs transition-colors hover:border-slate-400">
              <span
                className={`hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold lg:inline-flex ${roleBadgeColor}`}
                title="Quyền hạn vai trò hiện tại trong hệ thống"
              >
                <Shield className="h-3 w-3" strokeWidth={1.85} />
                <span>{roleLabel}</span>
              </span>
              <div className="relative">
                <label htmlFor="persona-switcher" className="sr-only">
                  Chuyển vai trò phân quyền
                </label>
                <select
                  id="persona-switcher"
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = userRoles.find((u) => u.id === e.target.value);
                    if (found) setCurrentUser(found);
                  }}
                  className="max-w-[125px] cursor-pointer truncate border-0 bg-transparent px-2 py-1 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-0 sm:max-w-[170px]"
                  title="Chuyển vai trò để kiểm thử phân quyền Soạn thảo / Duyệt ký / Xem"
                >
                  {userRoles.map((u) => (
                    <option key={u.id} value={u.id}>
                      [{u.roleBadge}] {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Create Meeting Button (Single Solid Primary CTA) */}
          {currentUser.role !== 'member' && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="press-subtle inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[#1d4ed8] px-4 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Tạo cuộc họp</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
