import React, { useState } from 'react';
import { AgendaItem, DecisionStatus, ActionItem, Vote } from '../../types';
import {
  Gavel,
  CheckCircle,
  XCircle,
  PauseCircle,
  Plus,
  Scale,
  Calendar,
  AlertCircle,
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
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Kết Luận & Quyết Nghị
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Decision Box */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">Nội dung quyết nghị</label>
            {/* Status Selector */}
            <div className="flex items-center gap-1">
              {[
                { status: 'agreed' as const, label: 'Thống nhất', color: 'emerald' },
                { status: 'disagreed' as const, label: 'Bác bỏ', color: 'rose' },
                { status: 'deferred' as const, label: 'Hoãn', color: 'amber' },
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
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    decisionStatus === s.status
                      ? s.status === 'agreed'
                        ? 'bg-emerald-600 text-white'
                        : s.status === 'disagreed'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-slate-200'
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
            placeholder="Ghi nhận kết luận hoặc quyết nghị cuối cùng của vấn đề này..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">Tự động lưu khi rời ô</span>
            <button
              onClick={handleSaveDecision}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              Lưu kết luận
            </button>
          </div>
        </div>

        {/* Voting Block */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <VoteIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">Biểu quyết</span>
            </div>
            <button
              onClick={onOpenVoteModal}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{currentDecision.vote ? 'Chỉnh sửa' : 'Mở biểu quyết'}</span>
            </button>
          </div>

          {currentDecision.vote ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kết quả:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    currentDecision.vote.isPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {currentDecision.vote.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden flex">
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
                <div className="bg-slate-900 p-1 rounded">
                  <span className="text-emerald-400 font-bold">
                    {currentDecision.vote.inFavor}
                  </span>{' '}
                  <span className="text-slate-500">Tán thành</span>
                </div>
                <div className="bg-slate-900 p-1 rounded">
                  <span className="text-rose-400 font-bold">
                    {currentDecision.vote.against}
                  </span>{' '}
                  <span className="text-slate-500">Bác bỏ</span>
                </div>
                <div className="bg-slate-900 p-1 rounded">
                  <span className="text-amber-400 font-bold">
                    {currentDecision.vote.abstain}
                  </span>{' '}
                  <span className="text-slate-500">Không ý kiến</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Chưa có biểu quyết cho mục này. Nhấn "Mở biểu quyết" hoặc gõ /bq.
            </p>
          )}
        </div>

        {/* Action Items List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              Hành động phát sinh ({currentAgenda.actionItems.length})
            </span>
            <button
              onClick={onOpenActionModal}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao việc mới</span>
            </button>
          </div>

          {currentAgenda.actionItems.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-500">
              Chưa có hành động nào cho mục này.
            </div>
          ) : (
            currentAgenda.actionItems.map((act) => (
              <div
                key={act.id}
                className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-100 leading-snug">{act.title}</h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      act.priority === 'urgent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : act.priority === 'high'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {act.priority}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Chủ trì (Owner):</span>
                    <span className="font-semibold text-slate-200">👤 {act.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hạn chót:</span>
                    <span className="font-mono text-indigo-300">📅 {act.deadline}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">
                    <span className="font-bold text-slate-300">🎯 Đầu ra:</span> {act.deliverable}
                  </div>
                </div>

                {/* Status Changer */}
                <div className="flex items-center justify-between pt-1">
                  <select
                    value={act.status}
                    onChange={(e) => onUpdateActionStatus(act.id, e.target.value as any)}
                    className="bg-slate-900 text-slate-300 border border-slate-700 rounded px-2 py-0.5 text-[10px] focus:outline-none cursor-pointer"
                  >
                    <option value="not_started">Chưa bắt đầu</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="blocked">Bị chặn</option>
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
