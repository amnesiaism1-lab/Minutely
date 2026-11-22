import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { ActionItem, ActionStatus } from '../../types';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import {
  PRIORITY_META,
  ACTION_STATUS_META,
  formatRelativeDeadline,
  getInitials,
  getAvatarTone,
} from '../../utils/uiHelpers';
import {
  List,
  Columns3,
  RotateCcw,
  Search,
  CheckCircle2,
  Circle,
  GripVertical,
  CalendarClock,
  Check,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ActionBoard: React.FC = () => {
  const {
    meetings,
    updateActionItem,
    postponeActionItem,
    currentUser,
    setCurrentMeetingId,
    setActiveTab,
  } = useMeetingContext();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterType, setFilterType] = useState<
    'all' | 'my' | 'assigned_by_me' | 'overdue' | 'week'
  >('all');
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Drag & Drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ActionStatus | null>(null);

  // Quick Postpone inline state
  const [postponingId, setPostponingId] = useState<string | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeReason, setPostponeReason] = useState('');

  const allActions: (ActionItem & { meetingCode?: string })[] = meetings.flatMap((m) =>
    m.agendaItems.flatMap((i) =>
      i.actionItems.map((a) => ({
        ...a,
        meetingCode: m.code,
      }))
    )
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredActions = allActions.filter((a) => {
    if (selectedMeetingFilter !== 'ALL' && a.meetingId !== selectedMeetingFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const qNorm = removeVietnameseDiacritics(searchTerm);
      const match =
        removeVietnameseDiacritics(a.title).includes(qNorm) ||
        removeVietnameseDiacritics(a.ownerName).includes(qNorm) ||
        removeVietnameseDiacritics(a.deliverable).includes(qNorm) ||
        (a.meetingCode && removeVietnameseDiacritics(a.meetingCode).includes(qNorm));
      if (!match) return false;
    }

    if (filterType === 'my') {
      return a.ownerId === currentUser.id;
    }
    if (filterType === 'assigned_by_me') {
      return a.createdById === currentUser.id;
    }
    if (filterType === 'overdue') {
      return a.status !== 'completed' && a.deadline < todayStr;
    }
    if (filterType === 'week') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      return a.deadline >= todayStr && a.deadline <= nextWeekStr;
    }

    return true;
  });

  const columns: {
    status: ActionStatus;
    label: string;
    dotColor: string;
    countBadgeClass: string;
  }[] = [
    {
      status: 'not_started',
      label: 'Chưa bắt đầu',
      dotColor: 'bg-slate-500',
      countBadgeClass: 'border-slate-200 bg-white text-slate-800',
    },
    {
      status: 'in_progress',
      label: 'Đang thực hiện',
      dotColor: 'bg-blue-600',
      countBadgeClass: 'border-blue-200 bg-blue-50 text-blue-900',
    },
    {
      status: 'blocked',
      label: 'Đang vướng mắc',
      dotColor: 'bg-rose-600',
      countBadgeClass: 'border-rose-200 bg-rose-50 text-rose-900',
    },
    {
      status: 'pending_approval',
      label: 'Chờ nghiệm thu',
      dotColor: 'bg-amber-500',
      countBadgeClass: 'border-amber-200 bg-amber-50 text-amber-900',
    },
    {
      status: 'completed',
      label: 'Đã hoàn thành',
      dotColor: 'bg-emerald-600',
      countBadgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    },
  ];

  const handleStatusChange = (actionId: string, newStatus: ActionStatus, title?: string) => {
    updateActionItem(actionId, { status: newStatus });
    const statusLabel = ACTION_STATUS_META[newStatus]?.label || newStatus;
    if (newStatus === 'completed') {
      confetti({
        particleCount: 38,
        spread: 50,
        origin: { y: 0.75 },
      });
      toast.success('Đã hoàn thành nhiệm vụ', title);
    } else {
      toast.info(`Chuyển trạng thái: ${statusLabel}`, title);
    }
  };

  const handleDropOnColumn = (targetStatus: ActionStatus, e: React.DragEvent) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData('text/plain') || draggingId;
    setDragOverStatus(null);
    setDraggingId(null);
    if (!droppedId) return;
    const item = allActions.find((a) => a.id === droppedId);
    if (!item || item.status === targetStatus) return;
    handleStatusChange(droppedId, targetStatus, item.title);
  };

  const handleCommitPostpone = (actionId: string) => {
    if (!postponeDate || !postponeReason.trim()) {
      toast.warning('Vui lòng chọn ngày mới và nhập lý do dời hạn');
      return;
    }
    postponeActionItem(actionId, postponeDate, postponeReason.trim());
    toast.success('Đã dời hạn và ghi nhận nhật ký kiểm toán');
    setPostponingId(null);
    setPostponeDate('');
    setPostponeReason('');
  };

  return (
    <div className="mx-auto max-w-[1520px] space-y-5 p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
            Bảng theo dõi hành động & nhiệm vụ
          </h1>
          <p className="mt-1 text-[14px] text-slate-600">
            Kéo thả thẻ giữa các cột hoặc bấm đánh dấu hoàn thành để cập nhật tiến độ giải trình
            sau họp.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex select-none items-center gap-1 rounded-xl border border-slate-200 bg-[var(--surface-well)] p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white font-semibold text-[#0b3d91] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="h-4 w-4" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white font-semibold text-[#0b3d91] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-2xs xl:flex-row xl:items-center xl:justify-between">
        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'Tất cả nhiệm vụ', count: allActions.length },
            {
              id: 'my',
              label: 'Việc của tôi',
              count: allActions.filter((a) => a.ownerId === currentUser.id).length,
            },
            {
              id: 'assigned_by_me',
              label: 'Tôi giao',
              count: allActions.filter((a) => a.createdById === currentUser.id).length,
            },
            {
              id: 'overdue',
              label: 'Trễ hạn (Gấp)',
              count: allActions.filter((a) => a.status !== 'completed' && a.deadline < todayStr)
                .length,
            },
            {
              id: 'week',
              label: 'Đến hạn trong tuần',
              count: allActions.filter(
                (a) =>
                  a.deadline >= todayStr &&
                  a.deadline <= new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
              ).length,
            },
          ].map((f) => {
            const isSelected = filterType === f.id;
            const isOverdueUrgent = f.id === 'overdue' && f.count > 0;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as typeof filterType)}
                className={`press-subtle flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  isSelected
                    ? f.id === 'overdue'
                      ? 'bg-rose-600 font-semibold text-white shadow-2xs'
                      : 'bg-[#1d4ed8] font-semibold text-white shadow-2xs'
                    : isOverdueUrgent
                    ? 'border border-rose-200 bg-rose-50 font-semibold text-rose-800 hover:bg-rose-100'
                    : 'border border-slate-200/90 bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isOverdueUrgent
                      ? 'bg-rose-200/70 font-semibold text-rose-900'
                      : 'bg-white text-slate-700'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Meeting Dropdown */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên việc, người phụ trách…"
              className="h-9.5 w-full rounded-xl border border-slate-300/85 bg-[var(--surface-well)] pl-9 pr-3 text-[13px] text-slate-900 placeholder-slate-500 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={selectedMeetingFilter}
            onChange={(e) => setSelectedMeetingFilter(e.target.value)}
            className="h-9.5 max-w-full cursor-pointer rounded-xl border border-slate-300/85 bg-[var(--surface-well)] px-3 text-[13px] font-medium text-slate-800 focus:border-[#1d4ed8] focus:bg-white focus:outline-none sm:max-w-[250px]"
            aria-label="Lọc theo cuộc họp"
          >
            <option value="ALL">Tất cả cuộc họp ({meetings.length})</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View with Smooth Horizontal Scroll & Drag-and-Drop */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1160px] grid-cols-5 items-start gap-4">
            {columns.map((col) => {
              const colActions = filteredActions.filter((a) => a.status === col.status);
              const isDropTarget = dragOverStatus === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverStatus !== col.status) setDragOverStatus(col.status);
                  }}
                  onDragLeave={() => {
                    if (dragOverStatus === col.status) setDragOverStatus(null);
                  }}
                  onDrop={(e) => handleDropOnColumn(col.status, e)}
                  className={`flex min-h-[500px] flex-col rounded-2xl border p-3 transition-all ${
                    isDropTarget
                      ? 'border-[#1d4ed8] bg-blue-50/50 ring-2 ring-[#1d4ed8]/25'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-well)]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                      <span className="text-[13.5px] font-semibold text-slate-900">{col.label}</span>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11.5px] font-semibold tabular-nums ${col.countBadgeClass}`}
                    >
                      {colActions.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {colActions.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300/80 p-3 text-center text-xs text-slate-500">
                        {isDropTarget
                          ? 'Thả thẻ vào đây để chuyển trạng thái'
                          : 'Chưa có nhiệm vụ nào'}
                      </div>
                    ) : (
                      colActions.map((act) => {
                        const priorityMeta = PRIORITY_META[act.priority] || PRIORITY_META.medium;
                        const deadlineInfo = formatRelativeDeadline(act.deadline, act.status);
                        const isDragging = draggingId === act.id;
                        const isPostponing = postponingId === act.id;

                        return (
                          <div
                            key={act.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggingId(act.id);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', act.id);
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDragOverStatus(null);
                            }}
                            className={`interactive-card group cursor-grab space-y-2.5 rounded-xl border border-[var(--border-subtle)] bg-white p-3.5 text-[13px] shadow-2xs active:cursor-grabbing ${
                              isDragging ? 'scale-[0.98] opacity-45' : ''
                            }`}
                          >
                            {/* Header: Drag Grip, Code & Priority */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex min-w-0 items-center gap-1">
                                <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentMeetingId(act.meetingId);
                                    setActiveTab('preview');
                                  }}
                                  className="max-w-[110px] cursor-pointer truncate font-mono text-[11.5px] font-medium tabular-nums text-slate-600 hover:text-[#1d4ed8] hover:underline"
                                  title={act.meetingTitle}
                                >
                                  {act.meetingCode}
                                </button>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityMeta.badgeClass}`}
                              >
                                {priorityMeta.label}
                              </span>
                            </div>

                            {/* Title with 1-click Complete Toggle */}
                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(
                                    act.id,
                                    act.status === 'completed' ? 'in_progress' : 'completed',
                                    act.title
                                  )
                                }
                                className="mt-0.5 shrink-0 cursor-pointer text-slate-400 transition-colors hover:text-emerald-600"
                                title={
                                  act.status === 'completed'
                                    ? 'Mở lại nhiệm vụ'
                                    : 'Đánh dấu hoàn thành ngay'
                                }
                              >
                                {act.status === 'completed' ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </button>
                              <h4
                                className={`text-[13.5px] font-semibold leading-snug ${
                                  act.status === 'completed'
                                    ? 'text-slate-500 line-through'
                                    : 'text-slate-900'
                                }`}
                              >
                                {act.title}
                              </h4>
                            </div>

                            {/* Deliverable */}
                            <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                              <span className="font-semibold text-slate-800">Đầu ra:</span>{' '}
                              {act.deliverable}
                              {act.supporterNames && act.supporterNames.length > 0 && (
                                <p className="mt-1 text-[11px] text-slate-600">
                                  Phối hợp: {act.supporterNames.join(', ')}
                                </p>
                              )}
                            </div>

                            {/* Owner & Relative Deadline */}
                            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs">
                              <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-700">
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold ${getAvatarTone(
                                    act.ownerName
                                  )}`}
                                >
                                  {getInitials(act.ownerName)}
                                </span>
                                <span className="truncate">{act.ownerName}</span>
                              </span>
                              <span
                                className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${deadlineInfo.toneClass}`}
                              >
                                {deadlineInfo.label}
                              </span>
                            </div>

                            {act.carriedFromPrevious && (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700">
                                <RotateCcw className="h-3 w-3" />
                                <span>Tồn kỳ trước chuyển sang</span>
                              </div>
                            )}

                            {isPostponing ? (
                              <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50/70 p-2">
                                <input
                                  type="date"
                                  value={postponeDate}
                                  onChange={(e) => setPostponeDate(e.target.value)}
                                  className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-[11px] text-slate-900 focus:outline-none"
                                />
                                <input
                                  type="text"
                                  value={postponeReason}
                                  onChange={(e) => setPostponeReason(e.target.value)}
                                  placeholder="Lý do dời hạn..."
                                  className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-[11px] text-slate-900 focus:outline-none"
                                />
                                <div className="flex justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setPostponingId(null)}
                                    className="cursor-pointer rounded p-1 text-slate-500 hover:bg-white"
                                    aria-label="Hủy dời hạn"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCommitPostpone(act.id)}
                                    className="inline-flex cursor-pointer items-center gap-1 rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white hover:bg-slate-800"
                                  >
                                    <Check className="h-3 w-3" />
                                    Lưu
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <select
                                  value={act.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      act.id,
                                      e.target.value as ActionStatus,
                                      act.title
                                    )
                                  }
                                  className="flex-1 cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none"
                                >
                                  <option value="not_started">Chưa bắt đầu</option>
                                  <option value="in_progress">Đang thực hiện</option>
                                  <option value="blocked">Đang vướng mắc</option>
                                  <option value="pending_approval">Chờ nghiệm thu</option>
                                  <option value="completed">Đã hoàn thành</option>
                                </select>
                                {act.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPostponingId(act.id);
                                      setPostponeDate(act.deadline);
                                      setPostponeReason(act.postponedReason || '');
                                    }}
                                    className="cursor-pointer rounded-md border border-slate-200 bg-white p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-amber-700"
                                    title="Gia hạn / Dời hạn chót (Lưu Audit Log)"
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-[var(--surface-panel)] shadow-2xs">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="p-3.5">Hành động</th>
                <th className="p-3.5">Sản phẩm đầu ra (DoD)</th>
                <th className="p-3.5">Phụ trách</th>
                <th className="p-3.5">Thời hạn</th>
                <th className="p-3.5">Mức độ</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Cuộc họp gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-slate-500">
                    Không có nhiệm vụ nào khớp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredActions.map((act) => {
                  const priorityMeta = PRIORITY_META[act.priority] || PRIORITY_META.medium;
                  const deadlineInfo = formatRelativeDeadline(act.deadline, act.status);

                  return (
                    <tr key={act.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="max-w-xs p-3.5 font-semibold text-slate-900">
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(
                                act.id,
                                act.status === 'completed' ? 'in_progress' : 'completed',
                                act.title
                              )
                            }
                            className="mt-0.5 shrink-0 cursor-pointer text-slate-400 hover:text-emerald-600"
                          >
                            {act.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <span
                            className={
                              act.status === 'completed' ? 'text-slate-400 line-through' : ''
                            }
                          >
                            {act.title}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs p-3.5 text-slate-600">{act.deliverable}</td>
                      <td className="p-3.5 font-medium text-slate-800">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${getAvatarTone(
                              act.ownerName
                            )}`}
                          >
                            {getInitials(act.ownerName)}
                          </span>
                          {act.ownerName}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 text-[10px] ${deadlineInfo.toneClass}`}
                        >
                          {deadlineInfo.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityMeta.badgeClass}`}
                        >
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={act.status}
                          onChange={(e) =>
                            handleStatusChange(
                              act.id,
                              e.target.value as ActionStatus,
                              act.title
                            )
                          }
                          className="cursor-pointer rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                        >
                          <option value="not_started">Chưa bắt đầu</option>
                          <option value="in_progress">Đang thực hiện</option>
                          <option value="blocked">Đang vướng mắc</option>
                          <option value="pending_approval">Chờ nghiệm thu</option>
                          <option value="completed">Đã hoàn thành</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentMeetingId(act.meetingId);
                            setActiveTab('preview');
                          }}
                          className="cursor-pointer font-mono font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          {act.meetingCode}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
