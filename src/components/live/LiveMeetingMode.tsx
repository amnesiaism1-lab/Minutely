import React, { useState, useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { AgendaColumn } from './AgendaColumn';
import { NoteTakingStream } from './NoteTakingStream';
import { DecisionActionColumn } from './DecisionActionColumn';
import { VoteModal } from './VoteModal';
import { ActionItemModal } from './ActionItemModal';
import { AttendanceModal } from './AttendanceModal';
import { MeetingDetailsModal } from './MeetingDetailsModal';
import { validateMeeting } from '../../utils/validation';
import { GROUP_META } from '../../utils/uiHelpers';
import { ActionItem } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Send,
  FileCheck2,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  X,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  ListOrdered,
  MessageSquare,
  Gavel,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LiveMeetingMode: React.FC = () => {
  const {
    currentMeeting,
    updateMeeting,
    updateAgendaItem,
    deleteAgendaItem,
    reorderAgendaItem,
    addOpinion,
    updateOpinion,
    deleteOpinion,
    updateDecision,
    addActionItem,
    updateActionItem,
    setActiveTab,
    submitForReview,
    markAsInquorateMinutes,
    currentUser,
  } = useMeetingContext();

  const { toast } = useToast();

  if (!currentMeeting) {
    return (
      <div className="mx-auto max-w-md p-12 text-center text-slate-500 space-y-3">
        <p className="text-sm font-semibold text-slate-800">Chưa chọn cuộc họp nào</p>
        <p className="text-xs text-slate-500">
          Vui lòng chọn một biên bản từ Kho biên bản hoặc tạo cuộc họp mới để bắt đầu ghi chép.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('meetings')}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Mở Kho biên bản
        </button>
      </div>
    );
  }

  const [activeAgendaId, setActiveAgendaId] = useState<string>(
    currentMeeting.agendaItems[0]?.id || ''
  );
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');
  const [mobilePane, setMobilePane] = useState<'agenda' | 'stream' | 'decision'>('stream');
  const [focusMode, setFocusMode] = useState(false);
  const [dismissedRejection, setDismissedRejection] = useState(false);

  // Modals state
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [prefilledAction, setPrefilledAction] = useState<Partial<ActionItem> | undefined>(
    undefined
  );
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    blockers: any[];
    warnings: any[];
  } | null>(null);

  // Keep activeAgendaId valid when switching meetings or deleting items
  useEffect(() => {
    const exists = currentMeeting.agendaItems.some((i) => i.id === activeAgendaId);
    if (!exists && currentMeeting.agendaItems.length > 0) {
      setActiveAgendaId(currentMeeting.agendaItems[0].id);
    }
  }, [currentMeeting.id, currentMeeting.agendaItems, activeAgendaId]);

  useEffect(() => {
    setDismissedRejection(false);
  }, [currentMeeting.id, currentMeeting.rejectionReason]);

  // Timer Effect
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning]);

  // Close Validation Modal on Escape
  useEffect(() => {
    if (!isValidationModalOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsValidationModalOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isValidationModalOpen]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(
        2,
        '0'
      )}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentAgenda =
    currentMeeting.agendaItems.find((i) => i.id === activeAgendaId) ||
    currentMeeting.agendaItems[0];

  const isLocked =
    currentMeeting.status === 'approved' ||
    currentMeeting.status === 'published' ||
    currentMeeting.status === 'archived';
  const isReadOnly = currentUser.role === 'member' || isLocked;

  const hasChairperson = currentMeeting.participants.some(
    (p) => p.role === 'chairperson' && p.status === 'present'
  );
  const hasSecretary = currentMeeting.participants.some(
    (p) => p.role === 'secretary' && p.status === 'present'
  );
  const quorumMet = currentMeeting.quorum ? currentMeeting.quorum.isMet : true;
  const totalAgendas = currentMeeting.agendaItems.length;
  const decidedCount = currentMeeting.agendaItems.filter(
    (i) => i.decision && i.decision.content.trim().length > 0
  ).length;
  const isAllDecided = totalAgendas > 0 && decidedCount === totalAgendas;
  const adjournedAt = currentMeeting.archiveDetails?.adjournedAt;
  const groupMeta = GROUP_META[currentMeeting.group] || GROUP_META.A;
  const isReadyToSubmit = hasChairperson && hasSecretary && quorumMet && isAllDecided;

  const handleSetAdjournedNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowTime = `${hh}:${mm}`;

    const currentArchive = currentMeeting.archiveDetails || {
      totalCopies: 2,
      storageLocations: ['Văn thư đơn vị', 'Hồ sơ lưu trữ cuộc họp'],
      approvedWithoutObjection: true,
    };

    updateMeeting(currentMeeting.id, {
      endTime: nowTime,
      archiveDetails: {
        ...currentArchive,
        adjournedAt: nowTime,
        approvedWithoutObjection: true,
      },
    });
    setLastSavedTime(now.toLocaleTimeString('vi-VN'));
    toast.success(`Đã chốt giờ bế mạc lúc ${nowTime}`, 'Giờ kết thúc đã đồng bộ vào biên bản.');
  };

  const handleAddAgendaItem = () => {
    const newId = `ag-${Date.now()}`;
    const nextOrder = currentMeeting.agendaItems.length + 1;
    const newItem = {
      id: newId,
      order: nextOrder,
      title: `Vấn đề thảo luận #${nextOrder}`,
      description: 'Nhập tóm tắt nội dung cần thảo luận...',
      durationMinutes: 20,
      opinions: [],
      decision: {
        id: `dec-${Date.now()}`,
        agendaItemId: newId,
        content: '',
        status: 'agreed' as const,
        thresholdPercent: 50,
      },
      actionItems: [],
    };

    updateMeeting(currentMeeting.id, {
      agendaItems: [...currentMeeting.agendaItems, newItem],
    });
    setActiveAgendaId(newId);
    setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
    toast.success(`Đã thêm Mục #${nextOrder}`, 'Bấm biểu tượng bút để đặt tiêu đề cụ thể.');
  };

  const handleOpenValidation = () => {
    const res = validateMeeting(currentMeeting);
    setValidationResult(res);
    setIsValidationModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    const res = submitForReview(currentMeeting.id);
    if (res.success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setIsValidationModalOpen(false);
      setActiveTab('preview');
    } else {
      setValidationResult({
        isValid: false,
        blockers: res.issues,
        warnings: validationResult?.warnings || [],
      });
      toast.error('Còn lỗi chặn pháp lý', 'Vui lòng hoàn thiện các mục báo đỏ bên dưới.');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--surface-canvas)] text-slate-900">
      {/* Unified Streamlined Single Top Bar */}
      <div className="flex h-14 shrink-0 select-none items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 sm:px-4">
        {/* Left: Group, Code, Title & Unified Attendance/Quorum Status */}
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`hidden shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold lg:inline-flex ${groupMeta.badgeClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${groupMeta.dotClass}`} />
            {groupMeta.shortLabel}
          </span>
          <span className="shrink-0 rounded border border-slate-200/90 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
            {currentMeeting.code}
          </span>
          <h1 className="max-w-[130px] truncate text-sm font-bold text-slate-900 sm:max-w-xs md:max-w-sm">
            {currentMeeting.title}
          </h1>

          {/* Unified Quorum & Attendance + Chair/Secretary Readiness Pill */}
          <button
            type="button"
            onClick={() => setIsAttendanceModalOpen(true)}
            className={`press-subtle hidden cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors sm:flex ${
              !quorumMet
                ? 'border-rose-200/90 bg-rose-50 text-rose-800 hover:bg-rose-100/70'
                : !hasChairperson || !hasSecretary
                ? 'border-amber-200/90 bg-amber-50 text-amber-900 hover:bg-amber-100/70'
                : 'border-emerald-200/90 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
            }`}
            title={
              !quorumMet
                ? `Chưa đạt túc số (${currentMeeting.quorum?.actualPercentage}% / ${currentMeeting.quorum?.requiredPercentage}%). Bấm để điểm danh.`
                : !hasChairperson || !hasSecretary
                ? `Thiếu điểm danh ${!hasChairperson ? 'Chủ tọa' : ''}${
                    !hasChairperson && !hasSecretary ? ' & ' : ''
                  }${!hasSecretary ? 'Thư ký' : ''}. Bấm để mở Điểm danh.`
                : 'Đủ Chủ tọa, Thư ký & Túc số hợp lệ. Bấm để quản lý đại biểu.'
            }
          >
            {!quorumMet ? (
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            ) : !hasChairperson || !hasSecretary ? (
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="tabular-nums">
              {
                currentMeeting.participants.filter(
                  (p) => p.status === 'present' || p.status === 'delegated'
                ).length
              }
              /{currentMeeting.participants.length} ĐB
              {currentMeeting.quorum ? ` · ${currentMeeting.quorum.actualPercentage}%` : ''}
            </span>
          </button>

          {currentMeeting.quorum && !currentMeeting.quorum.isMet && !isReadOnly && (
            currentMeeting.isInquorateMinutes ? (
              <button
                type="button"
                onClick={() => {
                  updateMeeting(currentMeeting.id, { isInquorateMinutes: false });
                  toast.info('Đã trở lại chế độ biên bản thường');
                }}
                className="hidden cursor-pointer items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 md:inline-flex"
                title="Đang lập BB Họp không thành (Điều 145) — Bấm để hủy"
              >
                <span>Điều 145 (Hủy)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => markAsInquorateMinutes(currentMeeting.id)}
                className="hidden cursor-pointer items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 md:inline-flex"
                title="Chuyển sang lập Biên bản họp không đủ túc số (Điều 145 Luật DN 2020)"
              >
                <span>Lập BB Điều 145</span>
              </button>
            )
          )}
        </div>

        {/* Center: Meeting Timer + Adjourn Button */}
        <div className="hidden items-center gap-1.5 sm:flex">
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 transition-colors ${
              isTimerRunning
                ? 'border-emerald-300 bg-emerald-50/90 text-emerald-950 shadow-2xs'
                : 'border-slate-200/80 bg-slate-100 text-slate-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isTimerRunning ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono text-xs font-bold tabular-nums">
              {formatTimer(timerSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`cursor-pointer rounded p-0.5 transition-colors ${
                isTimerRunning
                  ? 'text-emerald-700 hover:bg-emerald-100'
                  : 'text-slate-600 hover:bg-white hover:text-indigo-700'
              }`}
              title={isTimerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ cuộc họp'}
              aria-label={isTimerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ'}
            >
              {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="cursor-pointer rounded p-0.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
              title="Đặt lại đồng hồ"
              aria-label="Đặt lại đồng hồ"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {adjournedAt ? (
            <span
              className="hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 2xl:inline-flex"
              title="Giờ bế mạc đã ghi nhận vào biên bản"
            >
              <Clock className="h-3 w-3" />
              <span>Bế mạc {adjournedAt}</span>
            </span>
          ) : (
            !isReadOnly && (
              <button
                type="button"
                onClick={handleSetAdjournedNow}
                className="press-subtle hidden cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 2xl:inline-flex"
                title="Chốt giờ bế mạc thực tế ngay lúc này"
              >
                <Clock className="h-3 w-3 text-slate-500" />
                <span>Chốt bế mạc</span>
              </button>
            )
          )}
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden text-[11px] text-slate-400 2xl:inline">
            Lưu: {lastSavedTime}
          </span>

          <button
            type="button"
            onClick={() => setIsAttendanceModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:hidden"
            aria-label="Điểm danh"
          >
            <Users className="h-3.5 w-3.5" />
          </button>

          {/* Focus Mode Toggle (xl+) */}
          <button
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
            className={`press-subtle hidden cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-colors xl:flex ${
              focusMode
                ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white shadow-2xs'
                : 'border-slate-300/85 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={
              focusMode
                ? 'Thoát chế độ tập trung — hiện lại 3 cột'
                : 'Chế độ tập trung — mở rộng tối đa luồng ghi chép'
            }
          >
            {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden 2xl:inline">{focusMode ? 'Hiện 3 cột' : 'Tập trung'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDetailsModalOpen(true)}
            className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300/85 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
            title="Chỉnh sửa thông tin pháp nhân, nơi nhận, tài liệu đính kèm & khối chuyên biệt"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden md:inline">Hồ sơ & Phụ lục</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300/85 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-slate-600" />
            <span className="hidden sm:inline">Xem trước</span>
          </button>

          {currentUser.role === 'member' ? (
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              Chế độ xem
            </span>
          ) : isLocked ? (
            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              Đã khóa duyệt
            </span>
          ) : (
            <button
              type="button"
              onClick={handleOpenValidation}
              className={`press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-xs transition-all ${
                isReadyToSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#1d4ed8] hover:bg-[#1e40af]'
              }`}
              title={`Tiến độ quyết nghị: ${decidedCount}/${totalAgendas} mục`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Gửi duyệt</span>
              {totalAgendas > 0 && !isAllDecided && (
                <span className="rounded bg-white/20 px-1.5 py-0.2 font-mono text-[11px] tabular-nums">
                  {decidedCount}/{totalAgendas}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rejection Notice Banner if returned by Chairperson */}
      {currentMeeting.rejectionReason && !dismissedRejection && (
        <div className="flex items-center justify-between gap-3 border-b border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs text-rose-900">
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <p className="truncate sm:whitespace-normal">
              <strong className="font-semibold">Biên bản được Chủ tọa trả lại để chỉnh sửa:</strong>{' '}
              {currentMeeting.rejectionReason}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedRejection(true)}
            className="shrink-0 cursor-pointer rounded p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-800"
            aria-label="Ẩn thông báo trả lại"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Responsive Pane Switcher for screens < xl */}
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-200/80 bg-slate-100/70 p-1.5 xl:hidden">
        {[
          {
            id: 'agenda' as const,
            label: `Nghị sự (${currentMeeting.agendaItems.length})`,
            icon: ListOrdered,
          },
          {
            id: 'stream' as const,
            label: `Ghi chép (${currentAgenda?.opinions.length || 0})`,
            icon: MessageSquare,
          },
          {
            id: 'decision' as const,
            label: `Kết luận & Việc (${currentAgenda?.actionItems.length || 0})`,
            icon: Gavel,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = mobilePane === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobilePane(tab.id)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-indigo-700 ring-1 ring-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3-Column Adaptive Layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Agenda Items */}
        <div
          className={`${
            mobilePane === 'agenda' ? 'flex w-full' : 'hidden'
          } ${focusMode ? 'xl:hidden' : 'xl:flex'} h-full shrink-0`}
        >
          <AgendaColumn
            agendaItems={currentMeeting.agendaItems}
            activeItemId={currentAgenda?.id || ''}
            onSelectItem={(id) => {
              setActiveAgendaId(id);
              setMobilePane('stream');
            }}
            onAddItem={handleAddAgendaItem}
            onUpdateItem={(id, updates) => {
              updateAgendaItem(currentMeeting.id, id, updates);
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }}
            onDeleteItem={(id) => {
              deleteAgendaItem(currentMeeting.id, id);
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              toast.info('Đã xóa mục nghị sự');
            }}
            onReorderItem={(id, dir) => {
              reorderAgendaItem(currentMeeting.id, id, dir);
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }}
            readOnly={isReadOnly}
          />
        </div>

        {/* Center: Live Note Stream */}
        {currentAgenda && (
          <div
            className={`${
              mobilePane === 'stream' ? 'flex' : 'hidden'
            } min-w-0 flex-1 xl:flex`}
          >
            <NoteTakingStream
              currentAgenda={currentAgenda}
              participants={currentMeeting.participants}
              readOnly={isReadOnly}
              onAddOpinion={(agendaItemId, opinion) => {
                addOpinion(currentMeeting.id, agendaItemId, {
                  ...opinion,
                  agendaItemId,
                });
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onUpdateOpinion={(agendaItemId, opinionId, updates) => {
                updateOpinion(currentMeeting.id, agendaItemId, opinionId, updates);
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onDeleteOpinion={(agendaItemId, opinionId) => {
                deleteOpinion(currentMeeting.id, agendaItemId, opinionId);
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onCreateDecisionFromStream={(text) => {
                updateDecision(currentMeeting.id, currentAgenda.id, {
                  content: text,
                  status: 'agreed',
                });
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onCreateActionFromStream={(title, ownerName, deadline) => {
                const matchedOwner = currentMeeting.participants.find((p) =>
                  ownerName ? p.name.toLowerCase().includes(ownerName.toLowerCase()) : false
                );
                const fallbackOwner = currentMeeting.participants[0];
                const chosenOwner = matchedOwner || fallbackOwner;
                addActionItem({
                  meetingId: currentMeeting.id,
                  meetingTitle: currentMeeting.title,
                  agendaItemId: currentAgenda.id,
                  title,
                  ownerId: chosenOwner?.directoryMemberId || chosenOwner?.id || currentUser.id,
                  ownerName: chosenOwner?.name || currentUser.name,
                  ownerEmail: chosenOwner?.email || currentUser.email,
                  deliverable: 'Báo cáo hoàn thành công việc',
                  deadline: deadline || new Date().toISOString().split('T')[0],
                  priority: 'medium',
                  status: 'not_started',
                });
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onOpenPrefilledAction={(title, ownerId) => {
                setPrefilledAction({ title, ownerId });
                setIsActionModalOpen(true);
              }}
              onOpenVoteModal={() => setIsVoteModalOpen(true)}
            />
          </div>
        )}

        {/* Right: Decision & Action Items */}
        {currentAgenda && (
          <div
            className={`${
              mobilePane === 'decision' ? 'flex w-full' : 'hidden'
            } ${focusMode ? 'xl:hidden' : 'xl:flex'} h-full shrink-0`}
          >
            <DecisionActionColumn
              currentAgenda={currentAgenda}
              readOnly={isReadOnly}
              onUpdateDecision={(decision) => {
                updateDecision(currentMeeting.id, currentAgenda.id, decision);
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
              onOpenVoteModal={() => setIsVoteModalOpen(true)}
              onOpenActionModal={() => {
                setPrefilledAction(undefined);
                setIsActionModalOpen(true);
              }}
              onUpdateActionStatus={(actionId, status) => {
                updateActionItem(actionId, { status });
                setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
              }}
            />
          </div>
        )}
      </div>

      {/* Vote Modal */}
      {isVoteModalOpen && currentAgenda && (
        <VoteModal
          isOpen={isVoteModalOpen}
          onClose={() => setIsVoteModalOpen(false)}
          participants={currentMeeting.participants}
          defaultEligibleVotes={
            currentMeeting.quorum?.totalCapitalOrShares ||
            currentMeeting.participants.filter(
              (p) => p.status === 'present' || p.status === 'delegated'
            ).length ||
            10
          }
          initialVote={currentAgenda.decision?.vote}
          onSaveVote={(vote) => {
            updateDecision(currentMeeting.id, currentAgenda.id, { vote });
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            toast.success('Đã lưu kết quả biểu quyết');
          }}
        />
      )}

      {/* Action Item Modal */}
      {isActionModalOpen && currentAgenda && (
        <ActionItemModal
          isOpen={isActionModalOpen}
          onClose={() => {
            setIsActionModalOpen(false);
            setPrefilledAction(undefined);
          }}
          meetingId={currentMeeting.id}
          meetingTitle={currentMeeting.title}
          agendaItemId={currentAgenda.id}
          participants={currentMeeting.participants}
          initialValues={prefilledAction}
          onSaveAction={(actionData) => {
            addActionItem(actionData);
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            toast.success('Đã phân công nhiệm vụ mới', actionData.title);
          }}
        />
      )}

      {/* Attendance & Participant Management Modal */}
      {isAttendanceModalOpen && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
          meeting={currentMeeting}
        />
      )}

      {/* Meeting Details, Attachments & Specialized Blocks Modal */}
      {isDetailsModalOpen && (
        <MeetingDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          meeting={currentMeeting}
          readOnly={isReadOnly}
        />
      )}

      {/* Validation / Submit Checklist Modal */}
      {isValidationModalOpen && validationResult && (
        <div
          className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setIsValidationModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-modal-enter w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-slate-700" />
                <h3 className="text-base font-semibold text-slate-900">
                  Kiểm tra biên bản trước khi gửi duyệt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationResult.blockers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <AlertOctagon className="h-4 w-4 text-rose-600" />
                  <span>
                    Lỗi chặn nghiêm trọng ({validationResult.blockers.length}) - Cần khắc phục:
                  </span>
                </div>
                <div className="max-h-48 space-y-1.5 overflow-y-auto">
                  {validationResult.blockers.map((b, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs leading-relaxed text-rose-800"
                    >
                      {b.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Cảnh báo nhắc nhở ({validationResult.warnings.length}):</span>
                </div>
                <div className="max-h-36 space-y-1.5 overflow-y-auto">
                  {validationResult.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800"
                    >
                      {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.isValid && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-semibold">Đạt chuẩn pháp lý!</span> Toàn bộ các khối bắt
                  buộc, túc số và người chủ trì đã hoàn tất.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(false)}
                className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Đóng & Chỉnh sửa tiếp
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={!validationResult.isValid}
                className="press-subtle cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Xác nhận gửi Chủ tọa duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
