import React, { useState, useEffect } from 'react';
import { Vote, Participant, MemberVoteRecord } from '../../types';
import {
  Vote as VoteIcon,
  X,
  AlertTriangle,
  Scale,
  Users,
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
    initialVote?.method || 'show_of_hands'
  );

  // Eligible participants (attendees with status present or delegated, excluding pure guests)
  const eligibleAttendees = participants.filter(
    (p) => (p.status === 'present' || p.status === 'delegated') && p.role !== 'guest'
  );

  const hasShares = eligibleAttendees.some((p) => p.sharesCount && p.sharesCount > 0);
  const hasCapital = eligibleAttendees.some((p) => p.capitalRatio && p.capitalRatio > 0);
  const unitLabel = hasShares ? 'Cổ phần (CP)' : hasCapital ? '% Vốn điều lệ' : 'Phiếu đại biểu';

  // Individual member votes map: DO NOT default to in_favor! Start empty unless initialVote is provided!
  const [memberVotes, setMemberVotes] = useState<MemberVoteRecord[]>(() => {
    if (initialVote?.memberVotes && initialVote.memberVotes.length > 0) {
      return initialVote.memberVotes;
    }
    return eligibleAttendees.map((p) => ({
      participantId: p.id,
      participantName: p.name,
      voteChoice: undefined as any, // Not voted yet!
    }));
  });

  const [inFavor, setInFavor] = useState<number>(initialVote?.inFavor ?? 0);
  const [against, setAgainst] = useState<number>(initialVote?.against ?? 0);
  const [abstain, setAbstain] = useState<number>(initialVote?.abstain ?? 0);
  const [invalid, setInvalid] = useState<number>(initialVote?.invalid ?? 0);

  // Compute total eligible votes securely (non-negative)
  const calculatedTotalEligible = eligibleAttendees.reduce((sum, p) => {
    const weight = Math.max(0, hasShares ? (p.sharesCount || 0) : hasCapital ? (p.capitalRatio || 0) : 1);
    return sum + weight;
  }, 0) || defaultEligibleVotes || 1;

  const [totalEligible, setTotalEligible] = useState<number>(
    initialVote?.totalEligible ?? calculatedTotalEligible
  );
  const [thresholdPercent, setThresholdPercent] = useState<number>(
    initialVote?.thresholdPercent ?? 50
  );

  // Sync aggregate counts when memberVotes changes in rollcall mode
  useEffect(() => {
    if (voteMode === 'rollcall' && memberVotes.length > 0) {
      let calcInFavor = 0;
      let calcAgainst = 0;
      let calcAbstain = 0;
      let calcTotal = 0;

      eligibleAttendees.forEach((p) => {
        const mv = memberVotes.find((m) => m.participantId === p.id);
        const weight = Math.max(0, hasShares ? (p.sharesCount || 0) : hasCapital ? (p.capitalRatio || 0) : 1);
        calcTotal += weight;

        if (mv?.voteChoice === 'in_favor') {
          calcInFavor += weight;
        } else if (mv?.voteChoice === 'against') {
          calcAgainst += weight;
        } else if (mv?.voteChoice === 'abstain') {
          calcAbstain += weight;
        }
      });

      setInFavor(calcInFavor);
      setAgainst(calcAgainst);
      setAbstain(calcAbstain);
      setTotalEligible(calcTotal || eligibleAttendees.length || 1);
    }
  }, [memberVotes, voteMode, eligibleAttendees, hasShares, hasCapital]);

  const handleMemberVoteChoice = (participantId: string, choice: 'in_favor' | 'against' | 'abstain') => {
    setMemberVotes((prev) =>
      prev.map((item) =>
        item.participantId === participantId ? { ...item, voteChoice: choice } : item
      )
    );
  };

  const totalCast = inFavor + against + abstain + invalid;
  const isOvervoted = totalCast > totalEligible && totalEligible > 0;
  const ratioPassed = totalEligible > 0 ? Number(((inFavor / totalEligible) * 100).toFixed(1)) : 0;
  
  // A resolution can only be passed if votes have actually been cast and threshold is reached!
  const hasAnyVote = totalCast > 0;
  const isPassed = hasAnyVote && ratioPassed >= thresholdPercent && !isOvervoted;

  const handleSave = () => {
    if (!hasAnyVote) {
      alert('Chưa có phiếu biểu quyết nào được ghi nhận! Vui lòng chọn biểu quyết cho các đại biểu.');
      return;
    }

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <VoteIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">Thiết lập biểu quyết nghị quyết</h3>
              <p className="text-[11px] text-slate-500">
                Ghi nhận theo Điều 148, 158 Luật Doanh nghiệp 2020 • Đơn vị: <strong className="text-slate-700">{unitLabel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setVoteMode('rollcall')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              voteMode === 'rollcall'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Từng đại biểu ({eligibleAttendees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setVoteMode('aggregate')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              voteMode === 'aggregate'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Đếm số phiếu tổng hợp</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Voting Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Phương thức biểu quyết</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'show_of_hands', label: 'Biểu quyết giơ tay' },
                { id: 'secret_ballot', label: 'Bỏ phiếu kín' },
                { id: 'electronic', label: 'Biểu quyết điện tử' },
                { id: 'written', label: 'Lấy ý kiến văn bản' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id as any)}
                  className={`p-2 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                    method === m.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
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
              <label className="text-xs font-medium text-slate-700">
                Ngưỡng thông qua nghị quyết
              </label>
              <span className="text-xs font-mono font-semibold text-slate-900">
                {thresholdPercent}%
              </span>
            </div>
            <div className="flex gap-2">
              {[50, 65, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setThresholdPercent(pct)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border font-medium cursor-pointer transition-colors ${
                    thresholdPercent === pct
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct}% {pct === 50 ? '(Đa số >50%)' : pct === 65 ? '(HĐTV/ĐHĐCĐ ≥65%)' : '(Đặc biệt ≥75%)'}
                </button>
              ))}
            </div>
          </div>

          {/* ROLLCALL MODE: MEMBER LIST */}
          {voteMode === 'rollcall' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Ghi nhận biểu quyết từng đại biểu (Điều 158)</span>
                <span className="text-[11px] text-slate-500">Mặc định: Chưa bỏ phiếu</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {eligibleAttendees.map((p) => {
                  const currentVote = memberVotes.find((m) => m.participantId === p.id)?.voteChoice;

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {p.title}
                          {p.sharesCount ? ` • ${p.sharesCount.toLocaleString()} CP` : ''}
                          {p.capitalRatio ? ` • ${p.capitalRatio}% vốn` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'in_favor')}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                            currentVote === 'in_favor'
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Tán thành
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'against')}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                            currentVote === 'against'
                              ? 'bg-rose-600 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Bác bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'abstain')}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer ${
                            currentVote === 'abstain'
                              ? 'bg-amber-600 text-white shadow-xs font-semibold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

          {/* Counts inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-emerald-700">
                Tán thành {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                min="0"
                disabled={voteMode === 'rollcall'}
                value={inFavor}
                onChange={(e) => setInFavor(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-rose-700">
                Không tán thành {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                min="0"
                disabled={voteMode === 'rollcall'}
                value={against}
                onChange={(e) => setAgainst(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-700">
                Không ý kiến {voteMode === 'rollcall' ? '(Tự tính)' : ''}
              </label>
              <input
                type="number"
                min="0"
                disabled={voteMode === 'rollcall'}
                value={abstain}
                onChange={(e) => setAbstain(Math.max(0, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Tổng số phiếu / quyền biểu quyết
              </label>
              <input
                type="number"
                min="1"
                disabled={voteMode === 'rollcall'}
                value={totalEligible}
                onChange={(e) => setTotalEligible(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 disabled:opacity-75 rounded-lg p-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Warning if overvoted */}
          {isOvervoted && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Tổng số phiếu ({totalCast.toLocaleString()}) vượt quá tổng quyền hợp lệ ({totalEligible.toLocaleString()})!</span>
            </div>
          )}

          {/* Live Calculation preview */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tỷ lệ biểu quyết tán thành:</span>
              <span className="font-semibold font-mono text-base text-slate-900">{ratioPassed}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Kết luận pháp lý:</span>
              <span
                className={`font-semibold px-2.5 py-0.5 rounded text-[11px] ${
                  !hasAnyVote
                    ? 'bg-slate-200 text-slate-700'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {!hasAnyVote
                  ? 'CHƯA BỎ PHIẾU'
                  : isPassed
                  ? 'NGHỊ QUYẾT ĐƯỢC THÔNG QUA'
                  : 'CHƯA ĐỦ ĐIỀU KIỆN THÔNG QUA'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isOvervoted || !hasAnyVote}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white shadow-xs cursor-pointer transition-colors"
          >
            Lưu kết quả biểu quyết
          </button>
        </div>
      </div>
    </div>
  );
};
