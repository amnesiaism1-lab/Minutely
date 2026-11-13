import React, { useState, useEffect } from 'react';
import { Vote, Participant, MemberVoteRecord } from '../../types';
import {
  Vote as VoteIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Scale,
  Users,
  Check,
  MinusCircle,
  XCircle,
} from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVote: (vote: Vote) => void;
  initialVote?: Vote;
  defaultEligibleVotes: number;
  participants?: Participant[];
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onSaveVote,
  initialVote,
  defaultEligibleVotes,
  participants = [],
}) => {
  if (!isOpen) return null;

  const [voteMode, setVoteMode] = useState<'rollcall' | 'aggregate'>(
    participants.length > 0 ? 'rollcall' : 'aggregate'
  );
  const [method, setMethod] = useState<Vote['method']>(
    initialVote?.method || 'secret_ballot'
  );

  // Eligible participants (attendees with status present or delegated, excluding pure guests)
  const eligibleAttendees = participants.filter(
    (p) => (p.status === 'present' || p.status === 'delegated') && p.role !== 'guest'
  );

  // Individual member votes map
  const [memberVotes, setMemberVotes] = useState<MemberVoteRecord[]>(() => {
    if (initialVote?.memberVotes && initialVote.memberVotes.length > 0) {
      return initialVote.memberVotes;
    }
    return eligibleAttendees.map((p) => ({
      participantId: p.id,
      participantName: p.name,
      voteChoice: 'in_favor' as const,
    }));
  });

  const [inFavor, setInFavor] = useState<number>(initialVote?.inFavor ?? (eligibleAttendees.length || defaultEligibleVotes));
  const [against, setAgainst] = useState<number>(initialVote?.against ?? 0);
  const [abstain, setAbstain] = useState<number>(initialVote?.abstain ?? 0);
  const [invalid, setInvalid] = useState<number>(initialVote?.invalid ?? 0);
  const [totalEligible, setTotalEligible] = useState<number>(
    initialVote?.totalEligible ?? (eligibleAttendees.length || defaultEligibleVotes || 10)
  );
  const [thresholdPercent, setThresholdPercent] = useState<number>(
    initialVote?.thresholdPercent ?? 50
  );

  // Sync aggregate counts when memberVotes changes in rollcall mode
  useEffect(() => {
    if (voteMode === 'rollcall' && memberVotes.length > 0) {
      // Check if we have shares or capital ratio weighting
      const hasShares = eligibleAttendees.some((p) => p.sharesCount && p.sharesCount > 0);
      const hasCapital = eligibleAttendees.some((p) => p.capitalRatio && p.capitalRatio > 0);

      let calcInFavor = 0;
      let calcAgainst = 0;
      let calcAbstain = 0;
      let calcTotal = 0;

      eligibleAttendees.forEach((p) => {
        const mv = memberVotes.find((m) => m.participantId === p.id);
        const weight = hasShares
          ? p.sharesCount || 0
          : hasCapital
          ? p.capitalRatio || 0
          : 1;

        calcTotal += weight;
        if (!mv || mv.voteChoice === 'in_favor') {
          calcInFavor += weight;
        } else if (mv.voteChoice === 'against') {
          calcAgainst += weight;
        } else {
          calcAbstain += weight;
        }
      });

      setInFavor(calcInFavor);
      setAgainst(calcAgainst);
      setAbstain(calcAbstain);
      setTotalEligible(calcTotal || eligibleAttendees.length || 1);
    }
  }, [memberVotes, voteMode]);

  const handleMemberVoteChoice = (participantId: string, choice: 'in_favor' | 'against' | 'abstain') => {
    setMemberVotes((prev) => {
      const existing = prev.find((m) => m.participantId === participantId);
      if (existing) {
        return prev.map((m) => (m.participantId === participantId ? { ...m, voteChoice: choice } : m));
      }
      const p = eligibleAttendees.find((item) => item.id === participantId);
      return [...prev, { participantId, participantName: p?.name || 'Đại biểu', voteChoice: choice }];
    });
  };

  const totalCast = inFavor + against + abstain + invalid;
  const isOvervoted = totalCast > totalEligible && totalEligible > 0;
  const ratioPassed = totalEligible > 0 ? Number(((inFavor / totalEligible) * 100).toFixed(1)) : 0;
  const isPassed = ratioPassed >= thresholdPercent && !isOvervoted;

  const handleSave = () => {
    if (isOvervoted) {
      alert('Tổng số phiếu biểu quyết không được vượt quá tổng số phiếu hợp lệ!');
      return;
    }

    onSaveVote({
      method,
      inFavor,
      against,
      abstain,
      invalid,
      totalEligible,
      ratioPassed,
      thresholdPercent,
      isPassed,
      memberVotes: voteMode === 'rollcall' ? memberVotes : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl p-6 text-white space-y-4 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <VoteIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Thiết Lập Biểu Quyết Nghị Quyết</h3>
              <p className="text-[11px] text-slate-400">Ghi nhận kết quả theo Điều 158 Luật Doanh nghiệp 2020</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setVoteMode('rollcall')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              voteMode === 'rollcall'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Biểu quyết từng thành viên ({eligibleAttendees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setVoteMode('aggregate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              voteMode === 'aggregate'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Đếm số phiếu tổng hợp</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Voting Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Phương thức biểu quyết</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'secret_ballot', label: 'Bỏ phiếu kín' },
                { id: 'show_of_hands', label: 'Giơ tay' },
                { id: 'electronic', label: 'Biểu quyết điện tử' },
                { id: 'written', label: 'Lấy ý kiến văn bản' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id as any)}
                  className={`p-2 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    method === m.id
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold Percent */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Ngưỡng thông qua nghị quyết
              </label>
              <span className="text-xs font-mono font-bold text-purple-400">
                {thresholdPercent}%
              </span>
            </div>
            <div className="flex gap-2">
              {[50, 65, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setThresholdPercent(pct)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-semibold cursor-pointer transition-colors ${
                    thresholdPercent === pct
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {pct}% {pct === 50 ? '(Đa số)' : pct === 65 ? '(HĐTV)' : '(Đặc biệt)'}
                </button>
              ))}
            </div>
          </div>

          {/* ROLLCALL MODE: MEMBER LIST */}
          {voteMode === 'rollcall' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Ý kiến biểu quyết từng thành viên dự họp</span>
                <span className="text-[11px] text-slate-400">Bấm chọn 1 trong 3 trạng thái</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950/60">
                {eligibleAttendees.map((p) => {
                  const currentVote = memberVotes.find((m) => m.participantId === p.id)?.voteChoice || 'in_favor';

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.title}
                          {p.sharesCount ? ` • ${p.sharesCount.toLocaleString()} CP` : ''}
                          {p.capitalRatio ? ` • ${p.capitalRatio}% vốn` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'in_favor')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentVote === 'in_favor'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Tán thành
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'against')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentVote === 'against'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Không tán thành
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'abstain')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            currentVote === 'abstain'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Không ý kiến
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Counts inputs (Editable in aggregate mode, read-only/synced in rollcall) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-emerald-400">
                Tán thành {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                disabled={voteMode === 'rollcall'}
                value={inFavor}
                onChange={(e) => setInFavor(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 disabled:opacity-75 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-rose-400">
                Không tán thành {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                disabled={voteMode === 'rollcall'}
                value={against}
                onChange={(e) => setAgainst(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 disabled:opacity-75 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-400">
                Không ý kiến {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                disabled={voteMode === 'rollcall'}
                value={abstain}
                onChange={(e) => setAbstain(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 disabled:opacity-75 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Tổng số phiếu có quyền
              </label>
              <input
                type="number"
                disabled={voteMode === 'rollcall'}
                value={totalEligible}
                onChange={(e) => setTotalEligible(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 disabled:opacity-75 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Warning if overvoted */}
          {isOvervoted && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Tổng phiếu ({totalCast}) vượt quá số phiếu hợp lệ ({totalEligible})!</span>
            </div>
          )}

          {/* Live Calculation preview */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tỷ lệ biểu quyết tán thành đạt:</span>
              <span className="font-bold font-mono text-base text-indigo-400">{ratioPassed}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kết luận pháp lý:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isPassed ? 'NGHỊ QUYẾT ĐƯỢC THÔNG QUA' : 'CHƯA ĐỦ ĐIỀU KIỆN THÔNG QUA'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isOvervoted}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md cursor-pointer transition-colors"
          >
            Lưu kết quả biểu quyết
          </button>
        </div>
      </div>
    </div>
  );
};
