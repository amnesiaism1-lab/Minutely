import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { TemplateDefinition, MeetingGroup } from '../../types';
import {
  BookOpen,
  Scale,
  Building,
  Terminal,
  Handshake,
  Users,
  CheckCircle,
  PlusCircle,
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
    { id: 'A', label: 'A. Nội bộ doanh nghiệp', icon: Building },
    { id: 'C', label: 'C. Dự án & Phần mềm', icon: Terminal },
    { id: 'D', label: 'D. Đối ngoại & Khách hàng', icon: Handshake },
    { id: 'E', label: 'E. Đoàn thể, cộng đồng', icon: Users },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Thư Viện Mẫu Biên Bản Chuẩn Pháp Lý (Template Catalogue)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Được thiết kế dựa trên triết lý khối (block-based) và chuẩn hóa theo Luật Doanh nghiệp 2020, Nghị định 30/2020/NĐ-CP và thông lệ quốc tế.
        </p>
      </div>

      {/* Group Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {groupTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedGroup === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedGroup(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all p-5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tpl.badgeColor}`}
                >
                  Nhóm {tpl.group} • {tpl.type}
                </span>
                {tpl.defaultQuorum && (
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    Túc số {tpl.defaultQuorum}%
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                {tpl.name}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>

              {/* Legal Basis */}
              {tpl.legalBasis && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-medium truncate">{tpl.legalBasis}</span>
                </div>
              )}

              {/* Required blocks checklist */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Khối nghiệp vụ bắt buộc:
                </p>
                <div className="flex flex-wrap gap-1">
                  {tpl.requiredBlocks.map((blk, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      ✓ {blk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleUseTemplate(tpl)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
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
