import React, { useState } from 'react';
import { ActionItem, Participant, PriorityLevel } from '../../types';
import { parseVietnameseDate } from '../../utils/dateParser';
import { CheckSquare, X } from 'lucide-react';

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
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialValues?.title || '');
  const [ownerId, setOwnerId] = useState(initialValues?.ownerId || participants[0]?.id || '');
  const [deliverable, setDeliverable] = useState(initialValues?.deliverable || '');
  const [deadline, setDeadline] = useState(
    initialValues?.deadline || new Date().toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<PriorityLevel>(initialValues?.priority || 'medium');
  const [approverId, setApproverId] = useState(initialValues?.approverId || '');

  const handleQuickDate = (vietnameseToken: string) => {
    const parsed = parseVietnameseDate(vietnameseToken);
    if (parsed) {
      setDeadline(parsed);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên công việc!');
      return;
    }
    if (!ownerId) {
      alert('Vui lòng chọn Người phụ trách!');
      return;
    }
    if (!deliverable.trim()) {
      alert('Sản phẩm đầu ra (Deliverable) là bắt buộc để nghiệm thu!');
      return;
    }

    const owner = participants.find((p) => p.id === ownerId);
    const approver = participants.find((p) => p.id === approverId);

    onSaveAction({
      meetingId,
      meetingTitle,
      agendaItemId,
      title: title.trim(),
      ownerId,
      ownerName: owner?.name || 'Thành viên',
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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 text-slate-900 space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-base text-slate-900">Phân công nhiệm vụ (Action Item)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Action Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Tên công việc / Nhiệm vụ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Hoàn thiện hồ sơ pháp lý gửi cơ quan có thẩm quyền..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Owner & Approver */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Người phụ trách <span className="text-rose-500">*</span>
              </label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title || 'Thành viên'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Người nghiệm thu (tùy chọn)</label>
              <select
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
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
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="Ví dụ: File biên bản ký số hoàn chỉnh, báo cáo phân tích đính kèm..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Deadline & Quick Vietnamese Date buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
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
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 cursor-pointer transition-colors"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">Mức độ ưu tiên</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'urgent' as const, label: 'Khẩn cấp', activeColor: 'bg-rose-600 text-white' },
                { id: 'high' as const, label: 'Cao', activeColor: 'bg-amber-600 text-white' },
                { id: 'medium' as const, label: 'Bình thường', activeColor: 'bg-slate-900 text-white' },
                { id: 'low' as const, label: 'Thấp', activeColor: 'bg-slate-600 text-white' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-1.5 text-xs rounded-lg font-medium border cursor-pointer transition-all ${
                    priority === p.id
                      ? `${p.activeColor} border-transparent shadow-xs`
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-colors"
            >
              Lưu nhiệm vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
