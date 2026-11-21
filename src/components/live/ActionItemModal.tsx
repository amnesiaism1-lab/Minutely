import React, { useState, useEffect } from 'react';
import { ActionItem, Participant, PriorityLevel } from '../../types';
import { parseVietnameseDate } from '../../utils/dateParser';
import { useToast } from '../../context/ToastContext';
import { CheckSquare, X, AlertTriangle } from 'lucide-react';

interface ActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAction: (actionData: Omit<ActionItem, 'id'>) => void;
  meetingId: string;
  meetingTitle: string;
  agendaItemId?: string;
  participants: Participant[];
  initialValues?: Partial<ActionItem>;
}

export const ActionItemModal: React.FC<ActionItemModalProps> = ({
  isOpen,
  onClose,
  onSaveAction,
  meetingId,
  meetingTitle,
  agendaItemId,
  participants,
  initialValues,
}) => {
  const { toast } = useToast();

  const [title, setTitle] = useState(initialValues?.title || '');
  const [ownerId, setOwnerId] = useState(initialValues?.ownerId || participants[0]?.id || '');
  const [deliverable, setDeliverable] = useState(initialValues?.deliverable || '');
  const [deadline, setDeadline] = useState(
    initialValues?.deadline || new Date().toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<PriorityLevel>(initialValues?.priority || 'medium');
  const [approverId, setApproverId] = useState(initialValues?.approverId || '');
  const [supporterIds, setSupporterIds] = useState<string[]>(initialValues?.supporterIds || []);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialValues?.title || '');
    setOwnerId(initialValues?.ownerId || participants[0]?.id || '');
    setDeliverable(initialValues?.deliverable || '');
    setDeadline(initialValues?.deadline || new Date().toISOString().split('T')[0]);
    setPriority(initialValues?.priority || 'medium');
    setApproverId(initialValues?.approverId || '');
    setSupporterIds(initialValues?.supporterIds || []);
    setFormError('');
  }, [isOpen, initialValues, participants]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuickDate = (vietnameseToken: string) => {
    const parsed = parseVietnameseDate(vietnameseToken);
    if (parsed) {
      setDeadline(parsed);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Vui lòng nhập tên công việc!');
      toast.warning('Vui lòng nhập tên công việc');
      return;
    }
    if (!ownerId) {
      setFormError('Vui lòng chọn Người phụ trách!');
      toast.warning('Vui lòng chọn Người phụ trách');
      return;
    }
    if (!deliverable.trim()) {
      setFormError('Sản phẩm đầu ra (Deliverable) là bắt buộc để nghiệm thu!');
      toast.warning('Vui lòng nhập Sản phẩm đầu ra (DoD)');
      return;
    }

    const owner = participants.find((p) => p.id === ownerId);
    const approver = participants.find((p) => p.id === approverId);
    const supporters = participants.filter((p) => supporterIds.includes(p.id) && p.id !== ownerId);

    onSaveAction({
      meetingId,
      meetingTitle,
      agendaItemId,
      title: title.trim(),
      ownerId,
      ownerName: owner?.name || 'Thành viên',
      supporterIds: supporters.length > 0 ? supporters.map((s) => s.id) : undefined,
      supporterNames: supporters.length > 0 ? supporters.map((s) => s.name) : undefined,
      deliverable: deliverable.trim(),
      deadline,
      priority,
      status: 'not_started',
      approverId: approverId || undefined,
      approverName: approver?.name || undefined,
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
        className="animate-modal-enter w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900">
              Phân công nhiệm vụ (Action Item)
            </h3>
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

        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Action Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Tên công việc / Nhiệm vụ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Ví dụ: Hoàn thiện hồ sơ pháp lý gửi cơ quan có thẩm quyền..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Owner & Approver */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Người phụ trách <span className="text-rose-500">*</span>
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title || 'Thành viên'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Người nghiệm thu (tùy chọn)
              </label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">-- Không yêu cầu --</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Supporters (Người phối hợp - Mục 6.4 đặc tả) */}
          {participants.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Người phối hợp thực hiện (Supporters - tùy chọn)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {participants
                  .filter((p) => p.id !== ownerId)
                  .map((p) => {
                    const selected = supporterIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSupporterIds((prev) =>
                            selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          selected
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '}
                        {p.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Deliverable - Mandatory */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Sản phẩm đầu ra (DoD / Deliverable) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Tiêu chuẩn nghiệm thu</span>
            </div>
            <input
              type="text"
              required
              value={deliverable}
              onChange={(e) => {
                setDeliverable(e.target.value);
                if (formError) setFormError('');
              }}
              placeholder="Ví dụ: File biên bản ký số hoàn chỉnh, báo cáo phân tích đính kèm..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Deadline & Quick Vietnamese Date buttons */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-medium text-slate-700">
                Thời hạn hoàn thành <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[
                  { token: '!hôm nay', label: 'Hôm nay' },
                  { token: '!ngày mai', label: 'Ngày mai' },
                  { token: '!thứ sáu', label: 'Thứ 6' },
                  { token: '!tuần sau', label: '+7 ngày' },
                ].map((q) => (
                  <button
                    key={q.token}
                    type="button"
                    onClick={() => handleQuickDate(q.token)}
                    className="cursor-pointer rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            {deadline < new Date().toISOString().split('T')[0] && (
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Hạn chót rơi vào ngày trong quá khứ (Nhiệm vụ hồi tố hoặc ghi nhận sau)</span>
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Mức độ ưu tiên</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'urgent' as const, label: 'Khẩn cấp', activeColor: 'bg-rose-600 text-white' },
                { id: 'high' as const, label: 'Cao', activeColor: 'bg-amber-600 text-white' },
                { id: 'medium' as const, label: 'Trung bình', activeColor: 'bg-slate-900 text-white' },
                { id: 'low' as const, label: 'Thấp', activeColor: 'bg-slate-600 text-white' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`cursor-pointer rounded-lg border py-1.5 text-xs font-medium transition-all ${
                    priority === p.id
                      ? `${p.activeColor} border-transparent shadow-xs`
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="press-subtle cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
            >
              Lưu nhiệm vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
