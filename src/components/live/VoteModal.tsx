import React, { useState, useEffect } from 'react';
import { Vote, Participant, MemberVoteRecord } from '../../types';
import { useToast } from '../../context/ToastContext';
import { getInitials, getAvatarTone } from '../../utils/uiHelpers';
import {
  Vote as VoteIcon,
  X,
  AlertTriangle,
  Scale,
  Users,
  CheckCheck,
  RotateCcw,
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
  const { toast } = useToast();

  const [voteMode, setVoteMode] = useState<'rollcall' | 'aggregate'>(
    participants.length > 0 ? 'rollcall' : 'aggregate'
  );
  const [method, setMethod] = useState<Vote['method']>(
    initialVote?.method || 'show_of_hands'
  );

  const eligibleAttendees = participants.filter(
    (p) => (p.status === 'present' || p.status === 'delegated') && p.role !== 'guest'
  );

  const hasShares = eligibleAttendees.some((p) => p.sharesCount && p.sharesCount > 0);
  const hasCapital = eligibleAttendees.some((p) => p.capitalRatio && p.capitalRatio > 0);
  const unitLabel = hasShares ? 'Cổ phần (CP)' : hasCapital ? '% Vốn điều lệ' : 'Phiếu đại biểu';

  const [memberVotes, setMemberVotes] = useState<MemberVoteRecord[]>(() => {
    if (initialVote?.memberVotes && initialVote.memberVotes.length > 0) {
      return initialVote.memberVotes;
    }
    return eligibleAttendees.map((p) => ({
      participantId: p.id,
      participantName: p.name,
      voteChoice: undefined as any,
    }));
  });

  const [inFavor, setInFavor] = useState<number>(initialVote?.inFavor ?? 0);
  const [against, setAgainst] = useState<number>(initialVote?.against ?? 0);
  const [abstain, setAbstain] = useState<number>(initialVote?.abstain ?? 0);
  const [invalid] = useState<number>(initialVote?.invalid ?? 0);

  const calculatedTotalEligible =
    eligibleAttendees.reduce((sum, p) => {
      const weight = Math.max(
        0,
        hasShares ? p.sharesCount || 0 : hasCapital ? p.capitalRatio || 0 : 1
      );
      return sum + weight;
    }, 0) ||
    defaultEligibleVotes ||
    1;

  const [totalEligible, setTotalEligible] = useState<number>(
    initialVote?.totalEligible ?? calculatedTotalEligible
  );
  const [thresholdPercent, setThresholdPercent] = useState<number>(
    initialVote?.thresholdPercent ?? 50
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (voteMode === 'rollcall' && memberVotes.length > 0) {
      let calcInFavor = 0;
      let calcAgainst = 0;
      let calcAbstain = 0;
      let calcTotal = 0;

      eligibleAttendees.forEach((p) => {
        const mv = memberVotes.find((m) => m.participantId === p.id);
        const weight = Math.max(
          0,
          hasShares ? p.sharesCount || 0 : hasCapital ? p.capitalRatio || 0 : 1
        );
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

  if (!isOpen) return null;

  const handleMemberVoteChoice = (
    participantId: string,
    choice: 'in_favor' | 'against' | 'abstain'
  ) => {
    setMemberVotes((prev) =>
      prev.map((item) =>
        item.participantId === participantId ? { ...item, voteChoice: choice } : item
      )
    );
  };

  const handleApproveAll = () => {
    setMemberVotes(
      eligibleAttendees.map((p) => ({
        participantId: p.id,
        participantName: p.name,
        voteChoice: 'in_favor',
      }))
    );
    toast.success('Đã ghi nhận 100% đại biểu Tán thành');
  };

  const handleResetVotes = () => {
    setMemberVotes(
      eligibleAttendees.map((p) => ({
        participantId: p.id,
        participantName: p.name,
        voteChoice: undefined as any,
      }))
    );
    setInFavor(0);
    setAgainst(0);
    setAbstain(0);
  };

  const totalCast = inFavor + against + abstain + invalid;
  const isOvervoted = totalCast > totalEligible && totalEligible > 0;
  const ratioPassed =
    totalEligible > 0 ? Number(((inFavor / totalEligible) * 100).toFixed(1)) : 0;

  const hasAnyVote = totalCast > 0;
  const isPassed = hasAnyVote && ratioPassed >= thresholdPercent && !isOvervoted;

  const handleSave = () => {
    if (!hasAnyVote) {
      toast.warning('Chưa có phiếu biểu quyết nào được ghi nhận');
      return;
    }

    if (isOvervoted) {
      toast.error('Tổng số phiếu biểu quyết không được vượt quá tổng quyền hợp lệ');
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
    <div
      className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-modal-enter flex max-h-[92vh] w-full max-w-lg flex-col space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
              <VoteIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Thiết lập biểu quyết nghị quyết
              </h3>
              <p className="text-[11px] text-slate-500">
                Ghi nhận theo Điều 148, 158 Luật DN 2020 • Đơn vị:{' '}
                <strong className="text-slate-700">{unitLabel}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex shrink-0 select-none rounded-xl border border-slate-200/80 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setVoteMode('rollcall')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
              voteMode === 'rollcall'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Từng đại biểu ({eligibleAttendees.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setVoteMode('aggregate')}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
              voteMode === 'aggregate'
                ? 'bg-white font-semibold text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            <span>Đếm số phiếu tổng hợp</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
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
                  onClick={() => setMethod(m.id as Vote['method'])}
                  className={`cursor-pointer rounded-lg border p-2 text-left font-medium transition-colors ${
                    method === m.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
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
              <span className="font-mono text-xs font-semibold text-slate-900">
                {thresholdPercent}%
              </span>
            </div>
            <div className="flex gap-2">
              {[50, 65, 75].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setThresholdPercent(pct)}
                  className={`flex-1 cursor-pointer rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                    thresholdPercent === pct
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pct}%{' '}
                  {pct === 50 ? '(Đa số)' : pct === 65 ? '(HĐTV/ĐHĐCĐ)' : '(Đặc biệt)'}
                </button>
              ))}
            </div>
          </div>

          {/* ROLLCALL MODE */}
          {voteMode === 'rollcall' && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">
                  Ghi nhận biểu quyết từng đại biểu
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    className="press-subtle inline-flex cursor-pointer items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Tất cả tán thành</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetVotes}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100"
                    title="Đặt lại toàn bộ phiếu"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Đặt lại</span>
                  </button>
                </div>
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                {eligibleAttendees.map((p) => {
                  const currentVote = memberVotes.find((m) => m.participantId === p.id)?.voteChoice;

                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${getAvatarTone(
                            p.name
                          )}`}
                        >
                          {getInitials(p.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-slate-900">
                            {p.name}
                          </div>
                          <div className="truncate text-[10px] text-slate-500">
                            {p.title}
                            {p.sharesCount ? ` • ${p.sharesCount.toLocaleString()} CP` : ''}
                            {p.capitalRatio ? ` • ${p.capitalRatio}% vốn` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'in_favor')}
                          className={`cursor-pointer rounded px-2 py-1 text-[10px] font-medium transition-all ${
                            currentVote === 'in_favor'
                              ? 'bg-emerald-600 font-semibold text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Tán thành
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'against')}
                          className={`cursor-pointer rounded px-2 py-1 text-[10px] font-medium transition-all ${
                            currentVote === 'against'
                              ? 'bg-rose-600 font-semibold text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Bác bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberVoteChoice(p.id, 'abstain')}
                          className={`cursor-pointer rounded px-2 py-1 text-[10px] font-medium transition-all ${
                            currentVote === 'abstain'
                              ? 'bg-amber-600 font-semibold text-white shadow-xs'
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none disabled:opacity-75"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none disabled:opacity-75"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none disabled:opacity-75"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none disabled:opacity-75"
              />
            </div>
          </div>

          {isOvervoted && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Tổng số phiếu ({totalCast.toLocaleString()}) vượt quá tổng quyền hợp lệ (
                {totalEligible.toLocaleString()})!
              </span>
            </div>
          )}

          {/* Live Calculation preview */}
          <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tỷ lệ biểu quyết tán thành:</span>
              <span className="font-mono text-base font-semibold text-slate-900">
                {ratioPassed}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Kết luận pháp lý:</span>
              <span
                className={`rounded px-2.5 py-0.5 text-[11px] font-semibold ${
                  !hasAnyVote
                    ? 'bg-slate-200 text-slate-700'
                    : isPassed
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-rose-200 bg-rose-50 text-rose-800'
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
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isOvervoted || !hasAnyVote}
            className="press-subtle cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lưu kết quả biểu quyết
          </button>
        </div>
      </div>
    </div>
  );
};
