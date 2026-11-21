import React, { useState, useEffect, useRef } from 'react';
import { AgendaItem, DecisionStatus, ActionItem, Vote } from '../../types';
import { PRIORITY_META, formatRelativeDeadline } from '../../utils/uiHelpers';
import { useToast } from '../../context/ToastContext';
import { Gavel, Plus, Vote as VoteIcon, Check, Loader2, ShieldAlert, X } from 'lucide-react';

interface DecisionActionColumnProps {
  currentAgenda: AgendaItem;
  onUpdateDecision: (decision: {
    content: string;
    status: DecisionStatus;
    thresholdPercent: number;
    vote?: Vote;
    deferredReason?: string;
    reservedOpinions?: string[];
  }) => void;
  onOpenVoteModal: () => void;
  onOpenActionModal: () => void;
  onUpdateActionStatus: (actionId: string, status: ActionItem['status']) => void;
  readOnly?: boolean;
}

export const DecisionActionColumn: React.FC<DecisionActionColumnProps> = ({
  currentAgenda,
  onUpdateDecision,
  onOpenVoteModal,
  onOpenActionModal,
  onUpdateActionStatus,
  readOnly = false,
}) => {
  const { toast } = useToast();

  const currentDecision = currentAgenda.decision || {
    id: `dec-${Date.now()}`,
    agendaItemId: currentAgenda.id,
    content: '',
    status: 'agreed',
    thresholdPercent: 50,
  };

  const [decisionContent, setDecisionContent] = useState(currentDecision.content);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>(currentDecision.status);
  const [deferredReason, setDeferredReason] = useState(currentDecision.deferredReason || '');
  const [reservedOpinions, setReservedOpinions] = useState<string[]>(
    currentDecision.reservedOpinions || []
  );
  const [newReservedText, setNewReservedText] = useState('');
  const [showReservedBox, setShowReservedBox] = useState(
    (currentDecision.reservedOpinions?.length || 0) > 0
  );
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      c: currentDecision.content,
      d: currentDecision.deferredReason || '',
    })
  );

  useEffect(() => {
    const incomingContent = currentAgenda.decision?.content || '';
    const incomingDeferred = currentAgenda.decision?.deferredReason || '';
    const incomingReserved = currentAgenda.decision?.reservedOpinions || [];

    setDecisionContent(incomingContent);
    setDeferredReason(incomingDeferred);
    setReservedOpinions(incomingReserved);
    setShowReservedBox(incomingReserved.length > 0);
    setDecisionStatus(currentAgenda.decision?.status || 'agreed');
    lastSavedRef.current = JSON.stringify({ c: incomingContent, d: incomingDeferred });
    setSaveState('idle');
  }, [
    currentAgenda.id,
    currentAgenda.decision?.content,
    currentAgenda.decision?.status,
    currentAgenda.decision?.deferredReason,
    currentAgenda.decision?.reservedOpinions,
  ]);

  useEffect(() => {
    if (readOnly) return;
    const serialized = JSON.stringify({ c: decisionContent, d: deferredReason });
    if (serialized === lastSavedRef.current) return;

    setSaveState('saving');
    const timer = window.setTimeout(() => {
      lastSavedRef.current = serialized;
      onUpdateDecision({
        content: decisionContent,
        status: decisionStatus,
        thresholdPercent: currentDecision.thresholdPercent || 50,
        vote: currentDecision.vote,
        deferredReason: deferredReason.trim() || undefined,
        reservedOpinions,
      });
      setSaveState('saved');
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    decisionContent,
    deferredReason,
    decisionStatus,
    reservedOpinions,
    currentDecision.thresholdPercent,
    currentDecision.vote,
    onUpdateDecision,
    readOnly,
  ]);

  const handleSaveDecision = (notify: boolean = false) => {
    if (readOnly) return;
    lastSavedRef.current = JSON.stringify({ c: decisionContent, d: deferredReason });
    onUpdateDecision({
      content: decisionContent,
      status: decisionStatus,
      thresholdPercent: currentDecision.thresholdPercent || 50,
      vote: currentDecision.vote,
      deferredReason: deferredReason.trim() || undefined,
      reservedOpinions,
    });
    setSaveState('saved');
    if (notify) {
      toast.success('Đã lưu kết luận & quyết nghị');
    }
  };

  const handleAddReserved = () => {
    if (!newReservedText.trim() || readOnly) return;
    const next = [...reservedOpinions, newReservedText.trim()];
    setReservedOpinions(next);
    setNewReservedText('');
    onUpdateDecision({
      content: decisionContent,
      status: decisionStatus,
      thresholdPercent: currentDecision.thresholdPercent || 50,
      vote: currentDecision.vote,
      deferredReason: deferredReason.trim() || undefined,
      reservedOpinions: next,
    });
    toast.info('Đã ghi nhận ý kiến bảo lưu (Điều 158 Luật DN)');
  };

  const handleRemoveReserved = (idx: number) => {
    if (readOnly) return;
    const next = reservedOpinions.filter((_, i) => i !== idx);
    setReservedOpinions(next);
    onUpdateDecision({
      content: decisionContent,
      status: decisionStatus,
      thresholdPercent: currentDecision.thresholdPercent || 50,
      vote: currentDecision.vote,
      deferredReason: deferredReason.trim() || undefined,
      reservedOpinions: next,
    });
  };

  return (
    <div className="flex h-full w-full shrink-0 select-none flex-col border-l border-slate-200/80 bg-[var(--surface-panel)] xl:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 p-3.5">
        <div className="flex items-center gap-2">
          <Gavel className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Kết luận & Quyết nghị
          </h2>
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          Mục #{currentAgenda.order}
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3.5">
        {/* Decision Box */}
        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-800">Nội dung quyết nghị</label>
            <div className="flex items-center gap-1">
              {[
                { status: 'agreed' as const, label: 'Thống nhất' },
                { status: 'disagreed' as const, label: 'Bác bỏ' },
                { status: 'deferred' as const, label: 'Hoãn lại' },
              ].map((s) => (
                <button
                  key={s.status}
                  type="button"
                  disabled={readOnly}
                  onClick={() => {
                    setDecisionStatus(s.status);
                    lastSavedRef.current = JSON.stringify({ c: decisionContent, d: deferredReason });
                    onUpdateDecision({
                      content: decisionContent,
                      status: s.status,
                      thresholdPercent: currentDecision.thresholdPercent || 50,
                      vote: currentDecision.vote,
                      deferredReason: deferredReason.trim() || undefined,
                      reservedOpinions,
                    });
                    setSaveState('saved');
                  }}
                  className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors disabled:cursor-not-allowed ${
                    decisionStatus === s.status
                      ? s.status === 'agreed'
                        ? 'bg-emerald-600 text-white'
                        : s.status === 'disagreed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={decisionContent}
            disabled={readOnly}
            onChange={(e) => setDecisionContent(e.target.value)}
            onBlur={() => handleSaveDecision(false)}
            rows={4}
            placeholder="Ghi nhận kết luận hoặc quyết nghị chính thức (hoặc bấm biểu tượng búa trên ý kiến để chốt nhanh)..."
            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-xs leading-relaxed text-slate-900 placeholder-slate-400 transition-all focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100"
          />

          {/* Deferred Reason when status === 'deferred' */}
          {decisionStatus === 'deferred' && (
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-800">
                Lý do hoãn xem xét (bắt buộc để giải trình)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={deferredReason}
                onChange={(e) => setDeferredReason(e.target.value)}
                onBlur={() => handleSaveDecision(false)}
                placeholder="VD: Chờ bổ sung báo cáo thẩm định tài chính từ Ban Kiểm soát..."
                className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Reserved Opinions (Bảo lưu ý kiến - Điều 158) */}
          <div className="border-t border-slate-200/80 pt-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowReservedBox((prev) => !prev)}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <span>Ý kiến bảo lưu ({reservedOpinions.length})</span>
              </button>
              <span className="text-[10px] text-slate-400">Điều 158 Luật DN</span>
            </div>

            {showReservedBox && (
              <div className="mt-2 space-y-1.5">
                {reservedOpinions.map((ro, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/70 px-2.5 py-1.5 text-[11px] text-rose-900"
                  >
                    <span className="leading-snug">{ro}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveReserved(idx)}
                        className="shrink-0 cursor-pointer text-rose-400 hover:text-rose-700"
                        aria-label="Xóa ý kiến bảo lưu"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}

                {!readOnly && (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newReservedText}
                      onChange={(e) => setNewReservedText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddReserved();
                        }
                      }}
                      placeholder="VD: Ông/Bà X bảo lưu ý kiến về..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddReserved}
                      disabled={!newReservedText.trim()}
                      className="cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                    >
                      Ghi
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              {saveState === 'saving' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                  <span>Đang tự động lưu…</span>
                </>
              ) : saveState === 'saved' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">Đã lưu thay đổi</span>
                </>
              ) : (
                <span>Tự động lưu sau khi ngừng gõ</span>
              )}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleSaveDecision(true)}
                className="press-subtle cursor-pointer rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-slate-800"
              >
                Lưu kết luận
              </button>
            )}
          </div>
        </div>

        {/* Voting Block */}
        <div className="space-y-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <VoteIcon className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
              <span className="text-xs font-semibold text-slate-800">Biểu quyết</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={onOpenVoteModal}
                className="cursor-pointer text-xs font-semibold text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
              >
                {currentDecision.vote ? 'Chỉnh sửa phiếu' : 'Mở biểu quyết'}
              </button>
            )}
          </div>

          {currentDecision.vote ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Kết quả ({currentDecision.vote.ratioPassed}% /{' '}
                  {currentDecision.vote.thresholdPercent}%):
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                    currentDecision.vote.isPassed
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {currentDecision.vote.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}
                </span>
              </div>

              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-emerald-500 transition-[width] duration-300"
                  style={{ width: `${currentDecision.vote.ratioPassed}%` }}
                />
                <div
                  className="h-full bg-rose-500 transition-[width] duration-300"
                  style={{
                    width: `${
                      (currentDecision.vote.against / currentDecision.vote.totalEligible) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
                <div className="rounded border border-slate-200/70 bg-white p-1.5">
                  <span className="block font-bold text-emerald-700">
                    {currentDecision.vote.inFavor.toLocaleString()}
                  </span>
                  <span className="text-slate-400">Tán thành</span>
                </div>
                <div className="rounded border border-slate-200/70 bg-white p-1.5">
                  <span className="block font-bold text-rose-700">
                    {currentDecision.vote.against.toLocaleString()}
                  </span>
                  <span className="text-slate-400">Bác bỏ</span>
                </div>
                <div className="rounded border border-slate-200/70 bg-white p-1.5">
                  <span className="block font-bold text-amber-700">
                    {currentDecision.vote.abstain.toLocaleString()}
                  </span>
                  <span className="text-slate-400">Không ý kiến</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] italic text-slate-400">
              Chưa có biểu quyết cho mục này. Nhấn "Mở biểu quyết" để ghi phiếu.
            </p>
          )}
        </div>

        {/* Action Items List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Nhiệm vụ phân công ({currentAgenda.actionItems.length})
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={onOpenActionModal}
                className="press-subtle inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Giao việc mới</span>
              </button>
            )}
          </div>

          {currentAgenda.actionItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
              Chưa có nhiệm vụ nào cho mục này.
            </div>
          ) : (
            currentAgenda.actionItems.map((act) => {
              const priorityMeta = PRIORITY_META[act.priority] || PRIORITY_META.medium;
              const deadlineInfo = formatRelativeDeadline(act.deadline, act.status);

              return (
                <div
                  key={act.id}
                  className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs transition-colors hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold leading-snug text-slate-900">{act.title}</h4>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center justify-between gap-2">
                      <span>Phụ trách:</span>
                      <span className="truncate font-semibold text-slate-800">{act.ownerName}</span>
                    </div>
                    {act.supporterNames && act.supporterNames.length > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Phối hợp:</span>
                        <span className="truncate text-slate-700">
                          {act.supporterNames.join(', ')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span>Thời hạn:</span>
                      <span
                        className={`rounded border px-1.5 py-0.2 font-mono text-[10px] ${deadlineInfo.toneClass}`}
                      >
                        {deadlineInfo.label}
                      </span>
                    </div>
                    <div className="border-t border-slate-100 pt-1 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700">Đầu ra:</span> {act.deliverable}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <select
                      value={act.status}
                      disabled={readOnly}
                      onChange={(e) =>
                        onUpdateActionStatus(act.id, e.target.value as ActionItem['status'])
                      }
                      className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none disabled:cursor-not-allowed"
                    >
                      <option value="not_started">Chưa bắt đầu</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="blocked">Đang vướng mắc</option>
                      <option value="pending_approval">Chờ nghiệm thu</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
