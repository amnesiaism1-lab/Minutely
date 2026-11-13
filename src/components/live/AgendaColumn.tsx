import React from 'react';
import { AgendaItem } from '../../types';
import { ListOrdered, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

interface AgendaColumnProps {
  agendaItems: AgendaItem[];
  activeItemId: string;
  onSelectItem: (id: string) => void;
  onAddItem: () => void;
}

export const AgendaColumn: React.FC<AgendaColumnProps> = ({
  agendaItems,
  activeItemId,
  onSelectItem,
  onAddItem,
}) => {
  return (
    <div className="w-80 bg-white border-r border-slate-200/80 flex flex-col h-full shrink-0 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Chương trình nghị sự
          </h2>
        </div>
        <button
          onClick={onAddItem}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          title="Thêm vấn đề thảo luận"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Agenda Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {agendaItems.map((item, index) => {
          const isActive = item.id === activeItemId;
          const hasDecision = item.decision && item.decision.content.trim().length > 0;
          const opinionsCount = item.opinions.length;
          const actionsCount = item.actionItems.length;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 text-slate-800'
              }`}
            >
              {/* Order and Status Pill */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  Mục #{index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`flex items-center gap-1 text-[10px] font-mono ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {item.durationMinutes}p
                  </span>
                  {hasDecision ? (
                    <span
                      className={`text-[10px] flex items-center gap-0.5 ${
                        isActive ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                      title="Đã có kết luận"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] flex items-center gap-0.5 ${
                        isActive ? 'text-amber-400' : 'text-amber-600'
                      }`}
                      title="Chưa kết luận"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3
                className={`text-xs font-medium leading-snug line-clamp-2 ${
                  isActive ? 'text-white' : 'text-slate-800'
                }`}
              >
                {item.title}
              </h3>

              {/* Foot badges */}
              <div
                className={`mt-2 pt-2 flex items-center justify-between text-[10px] border-t ${
                  isActive ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>{opinionsCount} ý kiến</span>
                <span>{actionsCount} việc</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
