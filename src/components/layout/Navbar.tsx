import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import {
  FileText,
  Search,
  PlusCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const {
    currentUser,
    setCurrentUser,
    searchQuery,
    setSearchQuery,
    previewMode,
    setPreviewMode,
    activeTab,
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
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-900 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900">Minutely</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    NĐ 30 & Luật DN
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 hidden sm:block">Biên bản cuộc họp chuẩn pháp lý</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm cuộc họp, quyết nghị, nhiệm vụ..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Mode switch (Decree 30 vs Modern) */}
            <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setPreviewMode('decree30')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  previewMode === 'decree30'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Định dạng theo Nghị định 30/2020/NĐ-CP (Font Times New Roman, Quốc hiệu, thể thức chuẩn)"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Nghị định 30</span>
              </button>
              <button
                onClick={() => setPreviewMode('modern')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  previewMode === 'modern'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Định dạng hiện đại (Agile, thẻ tag, typography gọn gàng)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hiện đại</span>
              </button>
            </div>

            {/* Guest Sandbox Control (If not using Google) */}
            {isGuest && (
              <div className="hidden xl:flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 rounded-lg px-2.5 py-1 text-xs">
                <span className="text-amber-800 font-semibold flex items-center gap-1">
                  <span>💡 Khách vãng lai</span>
                </span>
                <span className="text-amber-300">|</span>
                {isDemoActive ? (
                  <button
                    onClick={clearAllDemoData}
                    className="text-[11px] text-amber-900 hover:underline cursor-pointer transition-colors"
                    title="Xóa 5 biên bản mẫu để bắt đầu kho trống"
                  >
                    Bỏ dữ liệu mẫu
                  </button>
                ) : (
                  <button
                    onClick={restoreDemoData}
                    className="text-[11px] text-emerald-800 hover:underline cursor-pointer transition-colors font-medium"
                    title="Nạp lại 5 biên bản mẫu chuẩn hóa"
                  >
                    Nạp lại mẫu
                  </button>
                )}
              </div>
            )}

            {/* Google Authentication Button / Profile */}
            <GoogleAuthButton />

            {/* Persona Switcher (If not using Google) */}
            {!currentUser.isGoogleAuth && (
              <div className="relative">
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const found = userRoles.find((u) => u.id === e.target.value);
                    if (found) setCurrentUser(found);
                  }}
                  className="bg-white text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-2xs"
                  title="Chuyển đổi vai trò người dùng để trải nghiệm phân quyền duyệt"
                >
                  {userRoles.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create Meeting button */}
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo cuộc họp</span>
            </button>

            {/* GitHub Repo link */}
            <a
              href="https://github.com/amnesiaism1-lab/Minutely"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Xem mã nguồn trên GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
