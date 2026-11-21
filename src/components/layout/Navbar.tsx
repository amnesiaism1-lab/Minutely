import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import {
  FileText,
  Search,
  PlusCircle,
  FileCheck2,
  Sparkles,
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
    previewMode,
    setPreviewMode,
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
    <header className="no-print sticky top-0 z-30 h-14 border-b border-slate-200/90 bg-[var(--surface-panel)]/95 text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03)] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-2.5 px-3 sm:px-5 lg:px-6">
        {/* Left: Hamburger (Mobile) + Brand */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="press-subtle inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg text-left transition-opacity hover:opacity-90"
            aria-label="Về trang tổng quan Minutely"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs ring-1 ring-slate-900/10">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold tracking-tight text-slate-900">
                  Minutely
                </span>
                <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 sm:inline">
                  NĐ 30 · Luật DN 2020
                </span>
              </div>
              <p className="hidden text-[10px] leading-none text-slate-500 sm:block">
                Quản trị biên bản & quyết nghị pháp lý
              </p>
            </div>
          </button>
        </div>

        {/* Center: Omnisearch Command Palette Trigger */}
        <div className="mx-2 hidden min-w-0 flex-1 md:flex md:max-w-md lg:max-w-lg">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 text-left text-xs text-slate-500 transition-all hover:border-slate-300 hover:bg-white hover:shadow-2xs"
            aria-label="Mở tìm kiếm và lệnh nhanh (Ctrl+K)"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search
                className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-slate-700"
                strokeWidth={1.75}
              />
              <span className="truncate">
                Tìm nhanh biên bản, nhiệm vụ, mẫu chuẩn…
              </span>
            </span>
            <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 shadow-2xs sm:inline-block">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobile Omnisearch button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="press-subtle inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 md:hidden"
            title="Tìm kiếm nhanh (Ctrl+K)"
            aria-label="Tìm kiếm nhanh"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {/* Eye-Comfort Paper Mode Toggle */}
          {onToggleComfortMode && (
            <button
              type="button"
              onClick={onToggleComfortMode}
              aria-pressed={comfortMode}
              className={`press-subtle inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors ${
                comfortMode
                  ? 'border-amber-300/90 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={
                comfortMode
                  ? 'Đang bật Chế độ Dịu mắt (giấy ấm) — Bấm để về nền sáng chuẩn'
                  : 'Bật Chế độ Dịu mắt (giấy ấm) giảm mỏi mắt khi họp lâu'
              }
            >
              {comfortMode ? (
                <Sun className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              <span className="hidden 2xl:inline">
                {comfortMode ? 'Dịu mắt' : 'Nền chuẩn'}
              </span>
            </button>
          )}

          {/* Preview format switcher */}
          <div
            className="hidden items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 xl:flex"
            role="group"
            aria-label="Chế độ thể thức biên bản"
          >
            <button
              type="button"
              onClick={() => setPreviewMode('decree30')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                previewMode === 'decree30'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Thể thức hành chính Nghị định 30/2020/NĐ-CP"
              aria-pressed={previewMode === 'decree30'}
            >
              <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Nghị định 30</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('modern')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                previewMode === 'modern'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Định dạng biên bản hiện đại"
              aria-pressed={previewMode === 'modern'}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Hiện đại</span>
            </button>
          </div>

          {/* Guest sandbox controls */}
          {isGuest && (
            <div className="hidden items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-1 text-xs 2xl:flex">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-amber-700" strokeWidth={1.75} />
              <span className="font-semibold text-amber-900">Dùng thử</span>
              <span className="text-amber-300" aria-hidden>
                |
              </span>
              {isDemoActive ? (
                <button
                  type="button"
                  onClick={clearAllDemoData}
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-amber-900 transition-colors hover:text-amber-950"
                  title="Bỏ các biên bản mẫu để bắt đầu kho trống"
                >
                  <Eraser className="h-3 w-3" strokeWidth={1.75} />
                  <span>Xóa mẫu</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restoreDemoData}
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-emerald-800 transition-colors hover:text-emerald-900"
                  title="Nạp lại biên bản mẫu chuẩn hóa"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                  <span>Nạp lại mẫu</span>
                </button>
              )}
            </div>
          )}

          <GoogleAuthButton />

          {/* Role / Persona Switcher for testing RBAC */}
          {!currentUser.isGoogleAuth && (
            <div className="flex items-center gap-1.5">
              <span
                className={`hidden items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold lg:inline-flex ${roleBadgeColor}`}
                title="Quyền hạn vai trò hiện tại trong hệ thống"
              >
                <Shield className="h-3 w-3" strokeWidth={1.75} />
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
                  className="max-w-[120px] cursor-pointer truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:max-w-[165px]"
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

          {/* Create Meeting Button */}
          {currentUser.role !== 'member' && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="press-subtle inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-1"
            >
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Tạo cuộc họp</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
