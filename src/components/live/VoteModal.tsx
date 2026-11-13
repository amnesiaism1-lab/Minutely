import React, { useState } from 'react';
import { Vote } from '../../types';
import { Vote as VoteIcon, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVote: (vote: Vote) => void;
  initialVote?: Vote;
  defaultEligibleVotes: number;
}

export const VoteModal: React.FC<VoteModalProps> = ({
  isOpen,
  onClose,
  onSaveVote,
  initialVote,
  defaultEligibleVotes,
}) => {
  if (!isOpen) return null;

  const [method, setMethod] = useState<Vote['method']>(
    initialVote?.method || 'secret_ballot'
  );
  const [inFavor, setInFavor] = useState<number>(initialVote?.inFavor || defaultEligibleVotes);
  const [against, setAgainst] = useState<number>(initialVote?.against || 0);
  const [abstain, setAbstain] = useState<number>(initialVote?.abstain || 0);
  const [invalid, setInvalid] = useState<number>(initialVote?.invalid || 0);
  const [totalEligible, setTotalEligible] = useState<number>(
    initialVote?.totalEligible || defaultEligibleVotes || 100
  );
  const [thresholdPercent, setThresholdPercent] = useState<number>(
    initialVote?.thresholdPercent || 50
  );

  const totalCast = inFavor + against + abstain + invalid;
  const isOvervoted = totalCast > totalEligible;
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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <VoteIcon className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base">Thiết Lập Biểu Quyết</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                className={`flex-1 py-1 text-xs rounded-md border font-semibold cursor-pointer ${
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

        {/* Counts inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-emerald-400">
              Số phiếu Tán thành
            </label>
            <input
              type="number"
              value={inFavor}
              onChange={(e) => setInFavor(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-rose-400">
              Số phiếu Không tán thành
            </label>
            <input
              type="number"
              value={against}
              onChange={(e) => setAgainst(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-amber-400">
              Số phiếu Không ý kiến
            </label>
            <input
              type="number"
              value={abstain}
              onChange={(e) => setAbstain(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">
              Tổng số phiếu có quyền
            </label>
            <input
              type="number"
              value={totalEligible}
              onChange={(e) => setTotalEligible(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Warning if overvoted */}
        {isOvervoted && (
          <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Tổng phiếu ({totalCast}) vượt quá số phiếu hợp lệ ({totalEligible})!</span>
          </div>
        )}

        {/* Live Calculation preview */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Tỷ lệ biểu quyết đạt:</span>
            <span className="font-bold font-mono text-white">{ratioPassed}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Trạng thái:</span>
            <span
              className={`font-bold ${
                isPassed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPassed ? 'ĐỦ ĐIỀU KIỆN THÔNG QUA' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isOvervoted}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md cursor-pointer"
          >
            Lưu kết quả biểu quyết
          </button>
        </div>
      </div>
    </div>
  );
};
