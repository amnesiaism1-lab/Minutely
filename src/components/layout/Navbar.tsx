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
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const {
    currentUser,
    setCurrentUser,
    searchQuery,
    setSearchQuery,
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
      title: 'Chủ tịch HĐQT (Chủ tọa)',
      email: 'hung.nguyen@vinacorp.vn',
    },
    {
      id: 'p2',
      name: 'Trần Thị Thu Hà',
      role: 'secretary' as const,
      title: 'Trưởng ban Pháp chế (Thư ký)',
      email: 'ha.tran@vinacorp.vn',
    },
    {
      id: 'p3',
      name: 'Lê Hoàng Minh',
      role: 'member' as const,
      title: 'Đại diện Cổ đông lớn (Thành viên)',
      email: 'minh.le@dragoncapital.com',
    },
    {
      id: 'p11',
      name: 'Trương Tuấn Anh',
      role: 'admin' as const,
      title: 'Giám đốc Công nghệ (Quản trị)',
      email: 'anh.truong@vinacorp.vn',
    },
  ];

  return (
    <header className="no-print sticky top-0 z-30 h-14 border-b border-slate-200/90 bg-white/90 text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="group flex shrink-0 items-center gap-2.5 rounded-lg text-left transition-opacity hover:opacity-90"
          aria-label="Về trang tổng quan Minutely"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
            <FileText className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold tracking-tight text-slate-900">
                Minutely
              </span>
              <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 sm:inline">
                NĐ 30 · Luật DN
              </span>
            </div>
            <p className="hidden text-[10px] leading-none text-slate-500 sm:block">
              Biên bản cuộc họp chuẩn pháp lý
            </p>
          </div>
        </button>

        {/* Search */}
        <div className="mx-2 hidden min-w-0 flex-1 md:flex md:max-w-md lg:max-w-lg">
          <label className="relative w-full" htmlFor="global-search">
            <span className="sr-only">Tìm kiếm toàn hệ thống</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              strokeWidth={1.75}
            />
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm cuộc họp, quyết nghị, nhiệm vụ…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Preview mode */}
          <div
            className="hidden items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 lg:flex"
            role="group"
            aria-label="Chế độ xem biên bản"
          >
            <button
              type="button"
              onClick={() => setPreviewMode('decree30')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                previewMode === 'decree30'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Định dạng Nghị định 30/2020/NĐ-CP"
              aria-pressed={previewMode === 'decree30'}
            >
              <FileCheck2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Nghị định 30</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('modern')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                previewMode === 'modern'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Định dạng hiện đại"
              aria-pressed={previewMode === 'modern'}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Hiện đại</span>
            </button>
          </div>

          {/* Guest sandbox */}
          {isGuest && (
            <div className="hidden items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50/90 px-2.5 py-1.5 text-xs xl:flex">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-amber-700" strokeWidth={1.75} />
              <span className="font-semibold text-amber-900">Khách</span>
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
                  Bỏ dữ liệu mẫu
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restoreDemoData}
                  className="inline-flex cursor-pointer items-center gap-1 font-medium text-emerald-800 transition-colors hover:text-emerald-900"
                  title="Nạp lại biên bản mẫu chuẩn hóa"
                >
                  <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                  Nạp lại mẫu
                </button>
              )}
            </div>
          )}

          <GoogleAuthButton />

          {!currentUser.isGoogleAuth && (
            <div className="relative">
              <label htmlFor="persona-switcher" className="sr-only">
                Chuyển vai trò dùng thử
              </label>
              <select
                id="persona-switcher"
                value={currentUser.id}
                onChange={(e) => {
                  const found = userRoles.find((u) => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="max-w-[120px] cursor-pointer truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:max-w-[160px] md:max-w-[200px]"
                title="Chuyển vai trò để trải nghiệm phân quyền duyệt"
              >
                {userRoles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-1"
          >
            <PlusCircle className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Tạo cuộc họp</span>
          </button>

          <a
            href="https://github.com/amnesiaism1-lab/Minutely"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            title="Mã nguồn trên GitHub"
            aria-label="Mở repository GitHub"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
