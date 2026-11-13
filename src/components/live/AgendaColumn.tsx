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
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Chương Trình Nghị Sự
          </h2>
        </div>
        <button
          onClick={onAddItem}
          className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Thêm vấn đề thảo luận"
        >
          <Plus className="w-4 h-4" />
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
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {/* Order and Status Pill */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Mục #{index + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.durationMinutes}p
                  </span>
                  {hasDecision ? (
                    <span
                      className="text-[10px] text-emerald-400 flex items-center gap-0.5"
                      title="Đã có kết luận"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span
                      className="text-[10px] text-amber-400 flex items-center gap-0.5"
                      title="Chưa kết luận"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3
                className={`text-xs font-semibold leading-snug line-clamp-2 ${
                  isActive ? 'text-white' : 'text-slate-300'
                }`}
              >
                {item.title}
              </h3>

              {/* Foot badges */}
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
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
