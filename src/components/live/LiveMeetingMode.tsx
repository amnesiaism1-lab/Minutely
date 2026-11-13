import React, { useState, useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { AgendaColumn } from './AgendaColumn';
import { NoteTakingStream } from './NoteTakingStream';
import { DecisionActionColumn } from './DecisionActionColumn';
import { VoteModal } from './VoteModal';
import { ActionItemModal } from './ActionItemModal';
import { AttendanceModal } from './AttendanceModal';
import { validateMeeting } from '../../utils/validation';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LiveMeetingMode: React.FC = () => {
  const {
    currentMeeting,
    updateMeeting,
    addOpinion,
    updateDecision,
    addActionItem,
    updateActionItem,
    setActiveTab,
    submitForReview,
    currentUser,
  } = useMeetingContext();

  if (!currentMeeting) {
    return (
      <div className="p-12 text-center text-slate-500">
        Chưa chọn cuộc họp nào. Vui lòng quay lại trang danh sách.
      </div>
    );
  }

  const [activeAgendaId, setActiveAgendaId] = useState<string>(
    currentMeeting.agendaItems[0]?.id || ''
  );
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');

  // Modals state
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    blockers: any[];
    warnings: any[];
  } | null>(null);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentAgenda =
    currentMeeting.agendaItems.find((i) => i.id === activeAgendaId) ||
    currentMeeting.agendaItems[0];

  const handleAddAgendaItem = () => {
    const newId = `ag-${Date.now()}`;
    const nextOrder = currentMeeting.agendaItems.length + 1;
    const newItem = {
      id: newId,
      order: nextOrder,
      title: `Vấn đề thảo luận #${nextOrder}`,
      description: 'Nhập tóm tắt vấn đề...',
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
      alert('Không thể gửi duyệt do còn lỗi chặn. Vui lòng khắc phục!');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50/60 overflow-hidden text-slate-900">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0 select-none">
        {/* Left: Meeting Info & Quorum */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded">
            {currentMeeting.code}
          </span>
          <h1 className="text-sm font-semibold text-slate-900 truncate max-w-md">
            {currentMeeting.title}
          </h1>

          {/* Quorum & Attendance Badge */}
          <button
            onClick={() => setIsAttendanceModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700 cursor-pointer transition-colors"
            title="Mở danh sách đại biểu & điểm danh"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {currentMeeting.participants.filter((p) => p.status === 'present' || p.status === 'delegated').length}/
              {currentMeeting.participants.length} Đại biểu
            </span>
          </button>

          {currentMeeting.quorum && (
            <div
              onClick={() => setIsAttendanceModalOpen(true)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-90 transition-opacity ${
                currentMeeting.quorum.isMet
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                  : 'bg-rose-50 text-rose-800 border-rose-200/80'
              }`}
              title={`Túc số: ${currentMeeting.quorum.actualPercentage}% (Yêu cầu: ${currentMeeting.quorum.requiredPercentage}%). Bấm để điểm danh.`}
            >
              {currentMeeting.quorum.isMet ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>Túc số {currentMeeting.quorum.actualPercentage}%</span>
            </div>
          )}
        </div>

        {/* Center: Meeting Timer */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60">
          <span className="text-xs font-mono font-medium text-slate-800">
            {formatTimer(timerSeconds)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title={isTimerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu bấm giờ'}
            >
              {isTimerRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Đã lưu: {lastSavedTime}
          </span>

          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Xem trước</span>
          </button>

          {currentUser.role === 'member' ? (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
              Chế độ xem (Thành viên)
            </span>
          ) : (
            <button
              onClick={handleOpenValidation}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi duyệt</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Agenda Items */}
        <AgendaColumn
          agendaItems={currentMeeting.agendaItems}
          activeItemId={currentAgenda?.id || ''}
          onSelectItem={(id) => setActiveAgendaId(id)}
          onAddItem={handleAddAgendaItem}
        />

        {/* Center: Live Note Stream */}
        {currentAgenda && (
          <NoteTakingStream
            currentAgenda={currentAgenda}
            participants={currentMeeting.participants}
            onAddOpinion={(agendaItemId, opinion) => {
              addOpinion(currentMeeting.id, agendaItemId, {
                ...opinion,
                agendaItemId,
              });
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
              addActionItem({
                meetingId: currentMeeting.id,
                meetingTitle: currentMeeting.title,
                agendaItemId: currentAgenda.id,
                title,
                ownerId: matchedOwner?.id || currentMeeting.participants[0]?.id || 'p1',
                ownerName: matchedOwner?.name || currentMeeting.participants[0]?.name || 'Thành viên',
                deliverable: 'Báo cáo hoàn thành công việc',
                deadline: deadline || new Date().toISOString().split('T')[0],
                priority: 'medium',
                status: 'not_started',
              });
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }}
            onOpenVoteModal={() => setIsVoteModalOpen(true)}
          />
        )}

        {/* Right: Decision & Action Items */}
        {currentAgenda && (
          <DecisionActionColumn
            currentAgenda={currentAgenda}
            onUpdateDecision={(decision) => {
              updateDecision(currentMeeting.id, currentAgenda.id, decision);
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }}
            onOpenVoteModal={() => setIsVoteModalOpen(true)}
            onOpenActionModal={() => setIsActionModalOpen(true)}
            onUpdateActionStatus={(actionId, status) => {
              updateActionItem(actionId, { status });
              setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
            }}
          />
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
            currentMeeting.participants.filter((p) => p.status === 'present' || p.status === 'delegated').length ||
            10
          }
          initialVote={currentAgenda.decision?.vote}
          onSaveVote={(vote) => {
            updateDecision(currentMeeting.id, currentAgenda.id, { vote });
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
          }}
        />
      )}

      {/* Action Item Modal */}
      {isActionModalOpen && currentAgenda && (
        <ActionItemModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          meetingId={currentMeeting.id}
          meetingTitle={currentMeeting.title}
          agendaItemId={currentAgenda.id}
          participants={currentMeeting.participants}
          onSaveAction={(actionData) => {
            addActionItem(actionData);
            setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
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

      {/* Validation / Submit Checklist Modal */}
      {isValidationModalOpen && validationResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 text-slate-900 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-base text-slate-900">Kiểm tra biên bản trước khi gửi duyệt</h3>
              </div>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Blockers list */}
            {validationResult.blockers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>
                    Lỗi chặn nghiêm trọng ({validationResult.blockers.length}) - Cần khắc phục:
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {validationResult.blockers.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed"
                    >
                      {b.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings list */}
            {validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Cảnh báo nhắc nhở ({validationResult.warnings.length}):</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {validationResult.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed"
                    >
                      {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.isValid && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold">Đạt chuẩn pháp lý!</span> Toàn bộ các khối bắt
                  buộc, túc số và người chủ trì đã hoàn tất.
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Đóng & Chỉnh sửa tiếp
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={!validationResult.isValid}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white shadow-xs cursor-pointer transition-colors"
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
