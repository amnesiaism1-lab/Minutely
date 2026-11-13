import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { Meeting, MeetingGroup, MeetingStatus } from '../../types';
import {
  Search,
  Filter,
  PlusCircle,
  FileCheck2,
  Play,
  Copy,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Scale,
  ShieldCheck,
  MoreVertical,
} from 'lucide-react';

export const MeetingList: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const {
    meetings,
    setCurrentMeetingId,
    setActiveTab,
    duplicateMeeting,
    deleteMeeting,
    searchQuery,
    setSearchQuery,
    selectedGroupFilter,
    setSelectedGroupFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    currentUser,
    approveMeeting,
    rejectMeeting,
    isGuest,
    isDemoActive,
    restoreDemoData,
  } = useMeetingContext();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredMeetings = meetings.filter((m) => {
    // Group filter
    if (selectedGroupFilter !== 'ALL' && m.group !== selectedGroupFilter) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter !== 'ALL' && m.status !== selectedStatusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = m.title.toLowerCase().includes(q);
      const inCode = m.code.toLowerCase().includes(q);
      const inOrg = m.organization.name.toLowerCase().includes(q);
      if (!inTitle && !inCode && !inOrg) return false;
    }
    return true;
  });

  const getStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Đã duyệt (Khóa)</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Chờ Chủ tọa duyệt</span>
          </span>
        );
      case 'published':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
            <FileCheck2 className="w-3 h-3" />
            <span>Đã phát hành</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kho Biên Bản Cuộc Họp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý toàn bộ biên bản cuộc họp theo nhóm nghiệp vụ, trạng thái vòng đời và chuẩn Nghị định 30.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo cuộc họp mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã số, tên, đơn vị..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Group Filter */}
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả các nhóm (A-E)</option>
            <option value="B">Nhóm B: Pháp lý doanh nghiệp</option>
            <option value="A">Nhóm A: Nội bộ công ty</option>
            <option value="C">Nhóm C: Dự án & Phần mềm</option>
            <option value="D">Nhóm D: Đối ngoại khách hàng</option>
            <option value="E">Nhóm E: Đoàn thể, cộng đồng</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="pending_review">Chờ duyệt (Pending Review)</option>
            <option value="approved">Đã duyệt (Approved - Locked)</option>
            <option value="published">Đã phát hành (Published)</option>
          </select>
        </div>
      </div>

      {/* Meetings Grid / List */}
      <div className="space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kho biên bản hiện đang trống</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isGuest && !isDemoActive
                  ? 'Bạn đã xóa dữ liệu mẫu. Bạn có thể tự tạo cuộc họp mới hoặc nạp lại dữ liệu mẫu bất cứ lúc nào.'
                  : 'Chưa có cuộc họp nào được ghi nhận. Hãy bắt đầu khởi tạo cuộc họp đầu tiên.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo cuộc họp mới</span>
              </button>
              {isGuest && !isDemoActive && (
                <button
                  onClick={restoreDemoData}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Nạp lại 5 biên bản mẫu
                </button>
              )}
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-500">
              Không tìm thấy biên bản nào phù hợp với bộ lọc
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          filteredMeetings.map((mtg) => (
            <div
              key={mtg.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Meeting Core Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                    {mtg.code}
                  </span>
                  {getStatusBadge(mtg.status)}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Nhóm {mtg.group} • {mtg.typeName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Phiên bản {mtg.version}</span>
                  {mtg.contentHash && (
                    <span
                      className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                      title="Mã băm xác thực toàn vẹn không bị sửa đổi"
                    >
                      🔒 {mtg.contentHash}
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('preview');
                  }}
                  className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer truncate"
                >
                  {mtg.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {mtg.date} ({mtg.startTime} - {mtg.endTime})
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    {mtg.participants.length} người tham gia
                  </span>
                  <span>📍 {mtg.venue}</span>
                  {mtg.quorum && (
                    <span
                      className={`font-semibold ${
                        mtg.quorum.isMet ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      ⚖️ Túc số: {mtg.quorum.actualPercentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('live');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Mở chế độ ghi chép trực tiếp 3 cột"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Ghi chép</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('preview');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  title="Xem trước & Xuất PDF/Word"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Xem & Xuất</span>
                </button>

                {/* Approve button if pending review and current user is chairperson */}
                {mtg.status === 'pending_review' && currentUser.role === 'chairperson' && (
                  <button
                    onClick={() => approveMeeting(mtg.id, currentUser.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Duyệt ký</span>
                  </button>
                )}

                {/* Duplicate */}
                <button
                  onClick={() => duplicateMeeting(mtg.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Nhân bản cuộc họp"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa cuộc họp "${mtg.title}"?`)) {
                      deleteMeeting(mtg.id);
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa biên bản"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
