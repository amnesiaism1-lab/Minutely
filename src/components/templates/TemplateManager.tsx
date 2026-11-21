import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { TemplateDefinition } from '../../types';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import {
  BookOpen,
  Scale,
  Building,
  Terminal,
  Handshake,
  Users,
  ArrowRight,
  Shield,
  Search,
  Check,
} from 'lucide-react';

export const TemplateManager: React.FC = () => {
  const { createMeeting, setCurrentMeetingId, setActiveTab } = useMeetingContext();
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = TEMPLATE_DEFINITIONS.filter((t) => {
    if (selectedGroup !== 'ALL' && t.group !== selectedGroup) return false;
    if (searchTerm.trim()) {
      const qNorm = removeVietnameseDiacritics(searchTerm);
      const match =
        removeVietnameseDiacritics(t.name).includes(qNorm) ||
        removeVietnameseDiacritics(t.description).includes(qNorm) ||
        (t.legalBasis && removeVietnameseDiacritics(t.legalBasis).includes(qNorm));
      if (!match) return false;
    }
    return true;
  });

  const handleUseTemplate = (tpl: TemplateDefinition) => {
    const newMeeting = createMeeting({
      title: `${tpl.name} - ${new Date().toLocaleDateString('vi-VN')}`,
      templateId: tpl.id,
      group: tpl.group,
      type: tpl.type,
      typeName: tpl.name,
      quorum:
        tpl.group === 'B'
          ? {
              requiredPercentage: tpl.defaultQuorum || 50,
              actualPercentage: 100,
              isMet: true,
              totalCapitalOrShares: 10,
              presentCapitalOrShares: 10,
            }
          : undefined,
    });
    setCurrentMeetingId(newMeeting.id);
    setActiveTab('live');
  };

  const groupTabs: { id: string; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'ALL', label: 'Tất cả (14 Mẫu)', icon: BookOpen },
    { id: 'B', label: 'B. Pháp lý DN', icon: Scale },
    { id: 'A', label: 'A. Nội bộ điều hành', icon: Building },
    { id: 'C', label: 'C. Kỹ thuật & Dự án', icon: Terminal },
    { id: 'D', label: 'D. Đối ngoại', icon: Handshake },
    { id: 'E', label: 'E. Đoàn thể', icon: Users },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-5 sm:p-6">
      {/* Title + Search */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Thư viện mẫu biên bản chuẩn hóa
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Khung mẫu cấu trúc khối (block-based) theo Luật Doanh nghiệp 2020 và thể thức Nghị định
            30/2020/NĐ-CP.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mẫu biên bản, điều luật..."
            className="w-full rounded-lg border border-slate-200 bg-[var(--surface-panel)] py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {groupTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedGroup === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedGroup(tab.id)}
              className={`press-subtle flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200/80 bg-[var(--surface-panel)] text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-[var(--surface-panel)] p-10 text-center text-xs text-slate-500">
          Không tìm thấy biểu mẫu nào khớp với từ khóa "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="interactive-card flex flex-col justify-between rounded-xl border border-slate-200/80 bg-[var(--surface-panel)] p-4 shadow-2xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    Nhóm {tpl.group} • {tpl.type}
                  </span>
                  {tpl.defaultQuorum && (
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                      Túc số {tpl.defaultQuorum}%
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold leading-snug text-slate-900">{tpl.name}</h3>

                <p className="text-xs leading-relaxed text-slate-600">{tpl.description}</p>

                {tpl.legalBasis && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50 p-2 text-[11px] text-slate-600">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span className="truncate font-medium">{tpl.legalBasis}</span>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2">
                  <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Khối nghiệp vụ bắt buộc:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {tpl.requiredBlocks.map((blk, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 rounded border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600"
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                        {blk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleUseTemplate(tpl)}
                  className="press-subtle flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2 text-xs font-medium text-white shadow-2xs transition-colors hover:bg-slate-800"
                >
                  <span>Sử dụng mẫu này</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
