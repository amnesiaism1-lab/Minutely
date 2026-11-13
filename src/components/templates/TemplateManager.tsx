import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { TemplateDefinition } from '../../types';
import {
  BookOpen,
  Scale,
  Building,
  Terminal,
  Handshake,
  Users,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const TemplateManager: React.FC = () => {
  const { createMeeting, setCurrentMeetingId, setActiveTab } = useMeetingContext();
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const filteredTemplates = TEMPLATE_DEFINITIONS.filter((t) => {
    if (selectedGroup !== 'ALL' && t.group !== selectedGroup) return false;
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

  const groupTabs: { id: string; label: string; icon: any }[] = [
    { id: 'ALL', label: 'Tất cả (14 Mẫu)', icon: BookOpen },
    { id: 'B', label: 'B. Pháp lý DN (Luật DN 2020)', icon: Scale },
    { id: 'A', label: 'A. Nội bộ điều hành', icon: Building },
    { id: 'C', label: 'C. Kỹ thuật & Dự án', icon: Terminal },
    { id: 'D', label: 'D. Đối ngoại & Khách hàng', icon: Handshake },
    { id: 'E', label: 'E. Đoàn thể & Sự kiện', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Thư viện mẫu biên bản chuẩn hóa
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Khung mẫu cấu trúc khối (block-based) theo Luật Doanh nghiệp 2020 và thể thức Nghị định 30/2020/NĐ-CP.
        </p>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {groupTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedGroup === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedGroup(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all p-4 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                  Nhóm {tpl.group} • {tpl.type}
                </span>
                {tpl.defaultQuorum && (
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Túc số {tpl.defaultQuorum}%
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-sm text-slate-900 leading-snug">
                {tpl.name}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>

              {/* Legal Basis */}
              {tpl.legalBasis && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                  <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-medium truncate">{tpl.legalBasis}</span>
                </div>
              )}

              {/* Required blocks checklist */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                  Khối nghiệp vụ bắt buộc:
                </p>
                <div className="flex flex-wrap gap-1">
                  {tpl.requiredBlocks.map((blk, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-medium bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60"
                    >
                      ✓ {blk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch button */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleUseTemplate(tpl)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <span>Sử dụng mẫu này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
