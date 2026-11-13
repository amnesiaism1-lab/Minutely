import React, { useState } from 'react';
import { AgendaItem, DecisionStatus, ActionItem, Vote } from '../../types';
import {
  Gavel,
  Plus,
  Vote as VoteIcon,
} from 'lucide-react';

interface DecisionActionColumnProps {
  currentAgenda: AgendaItem;
  onUpdateDecision: (decision: {
    content: string;
    status: DecisionStatus;
    thresholdPercent: number;
    vote?: Vote;
  }) => void;
  onOpenVoteModal: () => void;
  onOpenActionModal: () => void;
  onUpdateActionStatus: (actionId: string, status: ActionItem['status']) => void;
}

export const DecisionActionColumn: React.FC<DecisionActionColumnProps> = ({
  currentAgenda,
  onUpdateDecision,
  onOpenVoteModal,
  onOpenActionModal,
  onUpdateActionStatus,
}) => {
  const currentDecision = currentAgenda.decision || {
    id: `dec-${Date.now()}`,
    agendaItemId: currentAgenda.id,
    content: '',
    status: 'agreed',
    thresholdPercent: 50,
  };

  const [decisionContent, setDecisionContent] = useState(currentDecision.content);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>(currentDecision.status);

  // Sync state if agenda item changed
  React.useEffect(() => {
    setDecisionContent(currentAgenda.decision?.content || '');
    setDecisionStatus(currentAgenda.decision?.status || 'agreed');
  }, [currentAgenda.id, currentAgenda.decision?.content, currentAgenda.decision?.status]);

  const handleSaveDecision = () => {
    onUpdateDecision({
      content: decisionContent,
      status: decisionStatus,
      thresholdPercent: currentDecision.thresholdPercent || 50,
      vote: currentDecision.vote,
    });
  };

  return (
    <div className="w-96 bg-white border-l border-slate-200/80 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Kết luận & Quyết nghị
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Decision Box */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-800">Nội dung quyết nghị</label>
            {/* Status Selector */}
            <div className="flex items-center gap-1">
              {[
                { status: 'agreed' as const, label: 'Thống nhất' },
                { status: 'disagreed' as const, label: 'Bác bỏ' },
                { status: 'deferred' as const, label: 'Hoãn lại' },
              ].map((s) => (
                <button
                  key={s.status}
                  onClick={() => {
                    setDecisionStatus(s.status);
                    onUpdateDecision({
                      content: decisionContent,
                      status: s.status,
                      thresholdPercent: currentDecision.thresholdPercent || 50,
                      vote: currentDecision.vote,
                    });
                  }}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                    decisionStatus === s.status
                      ? s.status === 'agreed'
                        ? 'bg-emerald-600 text-white'
                        : s.status === 'disagreed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={decisionContent}
            onChange={(e) => setDecisionContent(e.target.value)}
            onBlur={handleSaveDecision}
            rows={3}
            placeholder="Ghi nhận kết luận hoặc quyết nghị chính thức..."
            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none transition-all"
          />

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-400">Tự động lưu khi rời ô</span>
            <button
              onClick={handleSaveDecision}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Lưu kết luận
            </button>
          </div>
        </div>

        {/* Voting Block */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <VoteIcon className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-800">Biểu quyết</span>
            </div>
            <button
              onClick={onOpenVoteModal}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
            >
              <span>{currentDecision.vote ? 'Chỉnh sửa' : 'Mở biểu quyết'}</span>
            </button>
          </div>

          {currentDecision.vote ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kết quả:</span>
                <span
                  className={`font-medium px-2 py-0.5 rounded text-[10px] ${
                    currentDecision.vote.isPassed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {currentDecision.vote.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${currentDecision.vote.ratioPassed}%` }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${
                      (currentDecision.vote.against / currentDecision.vote.totalEligible) * 100
                    }%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                <div className="bg-white p-1 rounded border border-slate-200/60">
                  <span className="text-emerald-700 font-semibold">
                    {currentDecision.vote.inFavor}
                  </span>{' '}
                  <span className="text-slate-400">Tán thành</span>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200/60">
                  <span className="text-rose-700 font-semibold">
                    {currentDecision.vote.against}
                  </span>{' '}
                  <span className="text-slate-400">Bác bỏ</span>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200/60">
                  <span className="text-amber-700 font-semibold">
                    {currentDecision.vote.abstain}
                  </span>{' '}
                  <span className="text-slate-400">Không ý kiến</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Chưa có biểu quyết cho mục này. Nhấn "Mở biểu quyết" để thiết lập.
            </p>
          )}
        </div>

        {/* Action Items List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Nhiệm vụ phân công ({currentAgenda.actionItems.length})
            </span>
            <button
              onClick={onOpenActionModal}
              className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao việc mới</span>
            </button>
          </div>

          {currentAgenda.actionItems.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              Chưa có nhiệm vụ nào cho mục này.
            </div>
          ) : (
            currentAgenda.actionItems.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-xl p-3 border border-slate-200/80 text-xs space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-slate-900 leading-snug">{act.title}</h4>
                  <span
                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${
                      act.priority === 'urgent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : act.priority === 'high'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {act.priority}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Phụ trách:</span>
                    <span className="font-medium text-slate-800">{act.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Thời hạn:</span>
                    <span className="font-mono text-slate-700">{act.deadline}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-600">Đầu ra:</span> {act.deliverable}
                  </div>
                </div>

                {/* Status Changer */}
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={act.status}
                    onChange={(e) => onUpdateActionStatus(act.id, e.target.value as any)}
                    className="bg-slate-50 text-slate-700 border border-slate-200 rounded px-2 py-0.5 text-[10px] focus:outline-none cursor-pointer"
                  >
                    <option value="not_started">Chưa bắt đầu</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="blocked">Đang vướng mắc</option>
                    <option value="completed">Đã hoàn thành</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
