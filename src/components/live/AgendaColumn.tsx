import React, { useState } from 'react';
import { AgendaItem } from '../../types';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';

interface AgendaColumnProps {
  agendaItems: AgendaItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
  onUpdateItem?: (id: string, updates: Partial<AgendaItem>) => void;
  onDeleteItem?: (id: string) => void;
  onReorderItem?: (id: string, direction: 'up' | 'down') => void;
  readOnly?: boolean;
}

export const AgendaColumn: React.FC<AgendaColumnProps> = ({
  agendaItems,
  activeItemId,
  onSelectItem,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItem,
  readOnly = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState<number>(20);

  const decidedCount = agendaItems.filter(
    (item) => item.decision && item.decision.content.trim().length > 0
  ).length;
  const progressPercent =
    agendaItems.length > 0 ? Math.round((decidedCount / agendaItems.length) * 100) : 0;

  const startEdit = (item: AgendaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditDuration(item.durationMinutes || 20);
  };

  const commitEdit = (id: string, e?: React.FormEvent | React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!editTitle.trim()) return;
    onUpdateItem?.(id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      durationMinutes: Math.max(5, Number(editDuration) || 20),
    });
    setEditingId(null);
  };

  return (
    <div className="flex h-full w-full shrink-0 select-none flex-col border-r border-slate-200/80 bg-[var(--surface-panel)] xl:w-80">
      {/* Header + Progress */}
      <div className="space-y-2.5 border-b border-slate-200/80 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-slate-700" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Chương trình nghị sự
            </h2>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={onAddItem}
              className="press-subtle inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              title="Thêm vấn đề thảo luận mới"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm mục</span>
            </button>
          )}
        </div>

        {/* Agenda Progress Strip */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Tiến độ kết luận</span>
            <span className="font-semibold tabular-nums text-slate-700">
              {decidedCount}/{agendaItems.length} mục ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agenda Items List */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {agendaItems.map((item, index) => {
          const isActive = item.id === activeItemId;
          const isEditing = editingId === item.id;
          const hasDecision = item.decision && item.decision.content.trim().length > 0;
          const opinionsCount = item.opinions.length;
          const actionsCount = item.actionItems.length;

          if (isEditing) {
            return (
              <form
                key={item.id}
                onSubmit={(e) => commitEdit(item.id, e)}
                onClick={(e) => e.stopPropagation()}
                className="space-y-2 rounded-xl border border-slate-900 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sửa Mục #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-slate-500" htmlFor={`dur-${item.id}`}>
                      Phút:
                    </label>
                    <input
                      id={`dur-${item.id}`}
                      type="number"
                      min={5}
                      max={240}
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="w-14 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-[11px] text-slate-800 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề mục nghị sự..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <X className="h-3 w-3" />
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!editTitle.trim()}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                  >
                    <Check className="h-3 w-3" />
                    Lưu
                  </button>
                </div>
              </form>
            );
          }

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectItem(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectItem(item.id);
                }
              }}
              className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200/80 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              {/* Order and Status Pill */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'border border-slate-200/70 bg-slate-100 text-slate-600'
                  }`}
                >
                  Mục #{index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center gap-1 font-mono text-[10px] ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {item.durationMinutes}p
                  </span>
                  {hasDecision ? (
                    <span
                      className={`flex items-center gap-0.5 text-[10px] ${
                        isActive ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                      title="Đã có kết luận"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span
                      className={`flex items-center gap-0.5 text-[10px] ${
                        isActive ? 'text-amber-400' : 'text-amber-600'
                      }`}
                      title="Chưa kết luận"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3
                className={`line-clamp-2 text-xs font-semibold leading-snug ${
                  isActive ? 'text-white' : 'text-slate-900'
                }`}
              >
                {item.title}
              </h3>

              {/* Foot badges & Quick hover actions */}
              <div
                className={`mt-2 flex items-center justify-between border-t pt-2 text-[10px] ${
                  isActive
                    ? 'border-slate-800 text-slate-300'
                    : 'border-slate-100 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5 tabular-nums">
                  <span>{opinionsCount} ý kiến</span>
                  <span>{actionsCount} việc</span>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-0.5 opacity-90 transition-opacity xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-within:opacity-100">
                    {onReorderItem && index > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderItem(item.id, 'up');
                        }}
                        className={`cursor-pointer rounded p-1 transition-colors ${
                          isActive
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-800'
                        }`}
                        title="Đẩy lên trên"
                        aria-label="Đẩy mục lên trên"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                    )}
                    {onReorderItem && index < agendaItems.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderItem(item.id, 'down');
                        }}
                        className={`cursor-pointer rounded p-1 transition-colors ${
                          isActive
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-800'
                        }`}
                        title="Đẩy xuống dưới"
                        aria-label="Đẩy mục xuống dưới"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    )}
                    {onUpdateItem && (
                      <button
                        type="button"
                        onClick={(e) => startEdit(item, e)}
                        className={`cursor-pointer rounded p-1 transition-colors ${
                          isActive
                            ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-800'
                        }`}
                        title="Sửa tiêu đề, mô tả & thời lượng"
                        aria-label="Sửa mục nghị sự"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {onDeleteItem && agendaItems.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className={`cursor-pointer rounded p-1 transition-colors ${
                          isActive
                            ? 'text-slate-300 hover:bg-rose-500/20 hover:text-rose-300'
                            : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="Xóa mục nghị sự này"
                        aria-label="Xóa mục nghị sự"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
