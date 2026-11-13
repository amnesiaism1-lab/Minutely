import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import {
  FileText,
  Search,
  PlusCircle,
  FileCheck2,
  Sparkles,
  ExternalLink,
  Code2,
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
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white">Minutely</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    NĐ 30 & Luật DN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Lập biên bản họp chuẩn pháp lý</p>
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
                placeholder="Tìm cuộc họp, quyết nghị, action items..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Mode switch (Decree 30 vs Modern) */}
            <div className="hidden lg:flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setPreviewMode('decree30')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  previewMode === 'decree30'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Định dạng theo Nghị định 30/2020/NĐ-CP (Font Times New Roman, Quốc hiệu, thể thức chuẩn)"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Nghị định 30</span>
              </button>
              <button
                onClick={() => setPreviewMode('modern')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  previewMode === 'modern'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Định dạng hiện đại (Agile, thẻ tag, typography gọn gàng)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hiện đại</span>
              </button>
            </div>

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
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Tạo cuộc họp</span>
            </button>

            {/* GitHub Repo link */}
            <a
              href="https://github.com/amnesiaism1-lab/Minutely"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Xem mã nguồn trên GitHub"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
