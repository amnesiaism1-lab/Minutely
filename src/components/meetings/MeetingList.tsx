import React, { useState, useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { Meeting, MeetingGroup, MeetingStatus } from '../../types';
import { GROUP_META, MEETING_STATUS_META } from '../../utils/uiHelpers';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
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
  Link as LinkIcon,
  Check,
  AlertTriangle,
  MapPin,
  Scale,
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

  const { toast } = useToast();
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingToDelete) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMeetingToDelete(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [meetingToDelete]);

  const handleCopyLink = (mtgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'preview');
      url.searchParams.set('id', mtgId);
      navigator.clipboard.writeText(url.toString());
      setCopiedId(mtgId);
      toast.success('Đã sao chép liên kết biên bản');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Lỗi copy link:', err);
      toast.error('Không thể sao chép liên kết vào bộ nhớ tạm');
    }
  };

  const handleConfirmDelete = () => {
    if (meetingToDelete) {
      deleteMeeting(meetingToDelete.id);
      setMeetingToDelete(null);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    if (selectedGroupFilter !== 'ALL' && m.group !== selectedGroupFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'ALL' && m.status !== selectedStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const qNorm = removeVietnameseDiacritics(searchQuery);
      const inTitle = removeVietnameseDiacritics(m.title).includes(qNorm);
      const inCode = removeVietnameseDiacritics(m.code).includes(qNorm);
      const inOrg = removeVietnameseDiacritics(m.organization.name).includes(qNorm);
      if (!inTitle && !inCode && !inOrg) return false;
    }
    return true;
  });

  const getStatusBadge = (status: MeetingStatus) => {
    const meta = MEETING_STATUS_META[status] || MEETING_STATUS_META.draft;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta.badgeClass}`}
      >
        {status === 'approved' && <CheckCircle className="h-3 w-3 text-emerald-700" />}
        {status === 'pending_review' && <Clock className="h-3 w-3 text-amber-700" />}
        {status === 'published' && <FileCheck2 className="h-3 w-3 text-blue-700" />}
        <span>{meta.label}</span>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 p-5 sm:p-7">
      {/* Title & Top Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Kho biên bản cuộc họp
          </h1>
          <p className="mt-1 text-[14px] text-slate-600">
            Quản trị toàn bộ biên bản cuộc họp theo chuẩn pháp chế Nghị định 30 & Luật Doanh nghiệp
            2020.
          </p>
        </div>

        {currentUser.role !== 'member' && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="press-subtle inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-4 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af] sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Khởi tạo cuộc họp</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-2xs">
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã số, tên, đơn vị (không dấu)…"
              className="h-9.5 w-full rounded-xl border border-slate-300/85 bg-[var(--surface-well)] pl-9.5 pr-3 text-[13.5px] text-slate-900 placeholder-slate-500 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex w-full items-center justify-end gap-2.5 md:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-9.5 cursor-pointer rounded-xl border border-slate-300/85 bg-[var(--surface-well)] px-3 text-[13px] font-medium text-slate-800 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
              aria-label="Lọc theo trạng thái biên bản"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="pending_review">Chờ Chủ tọa duyệt</option>
              <option value="approved">Đã duyệt (Khóa)</option>
              <option value="published">Đã phát hành</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>

        {/* Quick Group Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {[
            { id: 'ALL', label: 'Tất cả (A–E)' },
            { id: 'B', label: 'B. Pháp lý' },
            { id: 'A', label: 'A. Nội bộ' },
            { id: 'C', label: 'C. Dự án' },
            { id: 'D', label: 'D. Đối ngoại' },
            { id: 'E', label: 'E. Đoàn thể' },
          ].map((g) => {
            const isSelected = selectedGroupFilter === g.id;
            const meta = g.id !== 'ALL' ? GROUP_META[g.id as MeetingGroup] : null;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroupFilter(g.id)}
                className={`press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-all ${
                  isSelected
                    ? meta
                      ? meta.activeFilterClass
                      : 'border-[#1d4ed8] bg-[#1d4ed8] font-semibold text-white'
                    : 'border-slate-200/90 bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/60 hover:text-slate-950'
                }`}
              >
                {meta && <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />}
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meetings List — Linear / Stripe Unified Divided Container */}
      <div>
        {meetings.length === 0 ? (
          <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-12 text-center shadow-2xs">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900">Kho biên bản hiện đang trống</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">
                {isGuest && !isDemoActive
                  ? 'Bạn đã làm sạch dữ liệu mẫu. Bạn có thể tự tạo cuộc họp mới hoặc khôi phục dữ liệu mẫu bất cứ lúc nào.'
                  : 'Chưa có cuộc họp nào được ghi nhận. Hãy bắt đầu khởi tạo cuộc họp đầu tiên.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Tạo cuộc họp mới</span>
              </button>
              {isGuest && !isDemoActive && (
                <button
                  type="button"
                  onClick={restoreDemoData}
                  className="press-subtle cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-[13.5px] font-medium text-slate-800 transition-colors hover:bg-slate-200"
                >
                  Nạp lại biên bản mẫu
                </button>
              )}
            </div>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-10 text-center">
            <p className="text-[13.5px] font-medium text-slate-600">
              Không tìm thấy biên bản nào phù hợp với bộ lọc hiện tại
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="cursor-pointer text-[13.5px] font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs">
            {filteredMeetings.map((mtg) => {
              const groupMeta = GROUP_META[mtg.group] || GROUP_META.A;
              return (
                <div
                  key={mtg.id}
                  className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-well)]/75 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-slate-800">
                        <span className={`h-2 w-2 rounded-full ${groupMeta.dotClass}`} aria-hidden />
                        {mtg.code}
                      </span>
                      {getStatusBadge(mtg.status)}
                      <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${groupMeta.badgeClass}`}>
                        Nhóm {mtg.group} · {mtg.typeName}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-500">v{mtg.version}</span>
                      {mtg.contentHash && (
                        <span
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] tabular-nums text-slate-600"
                          title="Mã băm xác thực toàn vẹn không bị sửa đổi"
                        >
                          SHA256: {mtg.contentHash.substring(0, 10)}…
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => {
                        setCurrentMeetingId(mtg.id);
                        setActiveTab('preview');
                      }}
                      className="cursor-pointer truncate text-[15px] font-semibold text-slate-900 transition-colors hover:text-[#1d4ed8]"
                    >
                      {mtg.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        {mtg.date} ({mtg.startTime} - {mtg.endTime})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                        {mtg.participants.length} đại biểu
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {mtg.venue}
                      </span>
                      {mtg.quorum && (
                        <span
                          className={`flex items-center gap-1 font-semibold tabular-nums ${
                            mtg.quorum.isMet ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          <Scale className="h-3.5 w-3.5" />
                          Túc số: {mtg.quorum.actualPercentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMeetingId(mtg.id);
                        setActiveTab('live');
                      }}
                      className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 text-[12.5px] font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
                      title="Mở chế độ ghi chép trực tiếp"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Ghi chép</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentMeetingId(mtg.id);
                        setActiveTab('preview');
                      }}
                      className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300/80 bg-white px-3 text-[12.5px] font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
                      title="Xem trước & Xuất PDF/Word"
                    >
                      <FileCheck2 className="h-3.5 w-3.5 text-slate-600" />
                      <span>Xem & Xuất</span>
                    </button>

                    {mtg.status === 'pending_review' && currentUser.role === 'chairperson' && (
                      <button
                        type="button"
                        onClick={() => approveMeeting(mtg.id, currentUser.name)}
                        className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[12.5px] font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Duyệt ký</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(mtg.id, e)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      title="Sao chép liên kết cuộc họp"
                      aria-label="Sao chép liên kết cuộc họp"
                    >
                      {copiedId === mtg.id ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateMeeting(mtg.id)}
                      className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                      title="Nhân bản cuộc họp"
                      aria-label="Nhân bản cuộc họp"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    {currentUser.role !== 'member' && (
                      <button
                        type="button"
                        disabled={
                          mtg.status === 'approved' ||
                          mtg.status === 'published' ||
                          mtg.status === 'archived'
                        }
                        onClick={() => setMeetingToDelete(mtg)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          mtg.status === 'approved' ||
                          mtg.status === 'published' ||
                          mtg.status === 'archived'
                            ? 'cursor-not-allowed text-slate-300 opacity-50'
                            : 'cursor-pointer text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title={
                          mtg.status === 'approved' ||
                          mtg.status === 'published' ||
                          mtg.status === 'archived'
                            ? 'Biên bản đã duyệt/khóa/lưu trữ, không thể xóa'
                            : 'Xóa biên bản'
                        }
                        aria-label="Xóa biên bản"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {meetingToDelete && (
        <div
          className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setMeetingToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-modal-enter w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900">Xác nhận xóa cuộc họp</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Hành động này không thể hoàn tác. Toàn bộ dữ liệu ghi chép, biểu quyết và công
                  việc liên quan sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mã biên bản:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {meetingToDelete.code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tiêu đề:</span>
                <span
                  className="max-w-[220px] truncate font-medium text-slate-800"
                  title={meetingToDelete.title}
                >
                  {meetingToDelete.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Số nhiệm vụ liên quan:</span>
                <span className="font-semibold text-amber-700">
                  {meetingToDelete.agendaItems.reduce(
                    (acc, item) => acc + item.actionItems.length,
                    0
                  )}{' '}
                  nhiệm vụ
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-rose-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
