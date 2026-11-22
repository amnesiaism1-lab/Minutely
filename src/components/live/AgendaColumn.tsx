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
    <div className="flex h-full w-full shrink-0 select-none flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-well)] xl:w-80">
      {/* Header + Progress */}
      <div className="space-y-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface-panel)] p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-[#1d4ed8]" strokeWidth={1.9} />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Chương trình nghị sự
            </h2>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={onAddItem}
              className="press-subtle inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
              title="Thêm vấn đề thảo luận mới"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm mục</span>
            </button>
          )}
        </div>

        {/* Agenda Progress Strip */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Tiến độ kết luận</span>
            <span className="font-semibold tabular-nums text-slate-800">
              {decidedCount}/{agendaItems.length} mục ({progressPercent}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                progressPercent === 100 ? 'bg-emerald-600' : 'bg-[#1d4ed8]'
              }`}
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
                className="space-y-2 rounded-xl border border-indigo-500 bg-white p-3 shadow-sm ring-2 ring-indigo-500/15"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
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
                      className="w-14 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-[11px] text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Tiêu đề mục nghị sự..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
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
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
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
              className={`group relative cursor-pointer overflow-hidden rounded-xl border p-3 transition-all ${
                isActive
                  ? 'border-indigo-300 bg-white text-slate-900 shadow-sm ring-2 ring-indigo-500/15'
                  : 'border-slate-200/80 bg-white/80 text-slate-800 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {isActive && (
                <span
                  className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-indigo-600"
                  aria-hidden
                />
              )}

              {/* Order and Status Pill */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-200/70 bg-slate-100 text-slate-600'
                  }`}
                >
                  Mục #{index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center gap-1 font-mono text-[10px] ${
                      isActive ? 'text-indigo-700 font-medium' : 'text-slate-500'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {item.durationMinutes}p
                  </span>
                  {hasDecision ? (
                    <span
                      className="flex items-center gap-0.5 text-[10px] text-emerald-600"
                      title="Đã có kết luận"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-0.5 text-[10px] text-amber-600"
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
                  isActive ? 'text-indigo-950' : 'text-slate-900'
                }`}
              >
                {item.title}
              </h3>

              {/* Foot badges & Quick hover actions */}
              <div
                className={`mt-2 flex items-center justify-between border-t pt-2 text-[10px] ${
                  isActive
                    ? 'border-indigo-100 text-slate-600'
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
                        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
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
                        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
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
                        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
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
                        className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
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
