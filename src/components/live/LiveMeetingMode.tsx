import React, { useState, useEffect } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { AgendaColumn } from './AgendaColumn';
import { NoteTakingStream } from './NoteTakingStream';
import { DecisionActionColumn } from './DecisionActionColumn';
import { VoteModal } from './VoteModal';
import { ActionItemModal } from './ActionItemModal';
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
  } = useMeetingContext();

  if (!currentMeeting) {
    return (
      <div className="p-12 text-center text-slate-400">
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
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setIsValidationModalOpen(false);
      setActiveTab('preview');
    } else {
      alert('Không thể gửi duyệt do còn lỗi chặn. Vui lòng khắc phục!');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden text-white">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Left: Meeting Info & Quorum */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {currentMeeting.code}
          </span>
          <h1 className="text-sm font-bold text-white truncate max-w-md">
            {currentMeeting.title}
          </h1>

          {/* Quorum Badge */}
          {currentMeeting.quorum && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                currentMeeting.quorum.isMet
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
              title={`Túc số: ${currentMeeting.quorum.actualPercentage}% (Yêu cầu: ${currentMeeting.quorum.requiredPercentage}%)`}
            >
              {currentMeeting.quorum.isMet ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              <span>Túc số {currentMeeting.quorum.actualPercentage}%</span>
            </div>
          )}
        </div>

        {/* Center: Meeting Timer */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700/80">
          <span className="text-xs font-mono font-bold text-indigo-400">
            {formatTimer(timerSeconds)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 hover:text-indigo-400 transition-colors cursor-pointer"
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
              className="p-1 hover:text-slate-200 transition-colors cursor-pointer"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Tự động lưu: {lastSavedTime}
          </span>

          <button
            onClick={() => setActiveTab('preview')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Xem trước</span>
          </button>

          <button
            onClick={handleOpenValidation}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi duyệt</span>
          </button>
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
          defaultEligibleVotes={
            currentMeeting.quorum?.totalCapitalOrShares ||
            currentMeeting.participants.filter((p) => p.status === 'present').length ||
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

      {/* Validation / Submit Checklist Modal */}
      {isValidationModalOpen && validationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Kiểm Tra Biên Bản Trước Khi Gửi Duyệt</h3>
              </div>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Blockers list */}
            {validationResult.blockers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                  <span>
                    Lỗi chặn nghiêm trọng ({validationResult.blockers.length}) - Không thể gửi duyệt:
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {validationResult.blockers.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200"
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
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Cảnh báo nhắc nhở ({validationResult.warnings.length}):</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {validationResult.warnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200"
                    >
                      {w.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.isValid && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">Đạt điều kiện pháp lý!</span> Toàn bộ các khối bắt
                  buộc, túc số và người chủ trì đã hoàn tất.
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsValidationModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Đóng & Chỉnh sửa tiếp
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={!validationResult.isValid}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md cursor-pointer"
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
