import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { MeetingStatus } from '../../types';
import {
  Search,
  PlusCircle,
  FileCheck2,
  Play,
  Copy,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
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
    isGuest,
    isDemoActive,
    restoreDemoData,
  } = useMeetingContext();

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
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Đã duyệt (Khóa)</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ Chủ tọa duyệt</span>
          </span>
        );
      case 'published':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
            <FileCheck2 className="w-3 h-3 text-slate-600" />
            <span>Đã phát hành</span>
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kho biên bản cuộc họp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị toàn bộ biên bản cuộc họp theo chuẩn pháp chế Nghị định 30 & Luật Doanh nghiệp 2020.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-lg text-xs shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Khởi tạo cuộc họp</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã số, tên, đơn vị..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Group Filter */}
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
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
      <div className="space-y-2.5">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Kho biên bản hiện đang trống</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isGuest && !isDemoActive
                  ? 'Bạn đã làm sạch dữ liệu mẫu. Bạn có thể tự tạo cuộc họp mới hoặc khôi phục dữ liệu demo bất cứ lúc nào.'
                  : 'Chưa có cuộc họp nào được ghi nhận. Hãy bắt đầu khởi tạo cuộc họp đầu tiên.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo cuộc họp mới</span>
              </button>
              {isGuest && !isDemoActive && (
                <button
                  onClick={restoreDemoData}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  Nạp lại 5 biên bản mẫu
                </button>
              )}
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2.5">
            <p className="text-xs font-medium text-slate-600">
              Không tìm thấy biên bản nào phù hợp với bộ lọc hiện tại
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="text-xs font-medium text-slate-900 hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          filteredMeetings.map((mtg) => (
            <div
              key={mtg.id}
              className="bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
            >
              {/* Meeting Core Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {mtg.code}
                  </span>
                  {getStatusBadge(mtg.status)}
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    Nhóm {mtg.group} • {mtg.typeName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">v{mtg.version}</span>
                  {mtg.contentHash && (
                    <span
                      className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                      title="Mã băm xác thực toàn vẹn không bị sửa đổi"
                    >
                      SHA256: {mtg.contentHash.substring(0, 10)}...
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('preview');
                  }}
                  className="text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer truncate"
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
                    {mtg.participants.length} đại biểu
                  </span>
                  <span>📍 {mtg.venue}</span>
                  {mtg.quorum && (
                    <span
                      className={`font-medium ${
                        mtg.quorum.isMet ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      ⚖️ Túc số: {mtg.quorum.actualPercentage}%
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('live');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors cursor-pointer"
                  title="Mở chế độ ghi chép trực tiếp"
                >
                  <Play className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ghi chép</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentMeetingId(mtg.id);
                    setActiveTab('preview');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                  title="Xem trước & Xuất PDF/Word"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Xem & Xuất</span>
                </button>

                {/* Approve button if pending review and current user is chairperson */}
                {mtg.status === 'pending_review' && currentUser.role === 'chairperson' && (
                  <button
                    onClick={() => approveMeeting(mtg.id, currentUser.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Duyệt ký</span>
                  </button>
                )}

                {/* Duplicate */}
                <button
                  onClick={() => duplicateMeeting(mtg.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
