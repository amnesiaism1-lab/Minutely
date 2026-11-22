import React, { useState, useEffect } from 'react';
import { useMeetingContext, recalculateQuorum } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import { formatParticipantRole, GROUP_META } from '../../utils/uiHelpers';
import {
  TemplateDefinition,
  MeetingMode,
  Participant,
  ParticipantRole,
  PartyAffiliation,
  AttendanceStatus,
  DirectoryMember,
  MemberGroup,
} from '../../types';
import {
  Zap,
  X,
  Scale,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Search,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  UserPlus,
  Layers,
  Settings2,
} from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMeetingModalInner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    createMeeting,
    setCurrentMeetingId,
    setActiveTab,
    meetings,
    workspaceSettings,
    directoryMembers,
    memberGroups,
    upsertDirectoryMember,
    buildParticipantsFromGroup,
    buildDefaultParticipants,
  } = useMeetingContext();
  const { toast } = useToast();

  const defaultTpl = TEMPLATE_DEFINITIONS[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('vi-VN');
  const firstVenue = workspaceSettings.venues[0];

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(defaultTpl);
  const [templateGroupFilter, setTemplateGroupFilter] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState('');

  // Pre-filled core fields from Workspace Master Settings
  const [title, setTitle] = useState(`${defaultTpl.name} - ${todayDisplay}`);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [code, setCode] = useState(
    `${String(meetings.length + 1).padStart(2, '0')}/${new Date().getFullYear()}/BB-${defaultTpl.group}`
  );
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [venue, setVenue] = useState(firstVenue?.name || 'Phòng họp chính');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>(firstVenue?.mode || 'offline');
  const [meetingUrl, setMeetingUrl] = useState(firstVenue?.url || '');

  // Legal / Organization snapshot inherited from workspaceSettings
  const [showLegalAccordion, setShowLegalAccordion] = useState(false);
  const [orgName, setOrgName] = useState(workspaceSettings.orgName);
  const [department, setDepartment] = useState(workspaceSettings.departments[0] || 'Ban Điều hành');
  const [enterpriseCode, setEnterpriseCode] = useState(workspaceSettings.enterpriseCode || '');
  const [orgAddress, setOrgAddress] = useState(workspaceSettings.address || '');
  const [carryOverActions, setCarryOverActions] = useState(true);

  // Participants & Smart Roster Picker
  const [activePresetGroupId, setActivePresetGroupId] = useState<string>('minimal');
  const [presetAgendas, setPresetAgendas] = useState<string[] | undefined>(undefined);
  const [participants, setParticipants] = useState<Participant[]>(() =>
    buildDefaultParticipants(defaultTpl.group)
  );
  const [dirSearch, setDirSearch] = useState('');

  // Inline Quick-Add New Person + Progressive Directory Capture
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Thành viên tham dự');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');
  const [saveNewToDirectory, setSaveNewToDirectory] = useState(true);

  const [formErrors, setFormErrors] = useState<{
    title?: string;
    code?: string;
    time?: string;
    participants?: string;
  }>({});

  const unfinishedActionsCount = meetings
    .filter((m) => m.type === selectedTemplate.type || m.group === selectedTemplate.group)
    .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const filteredTemplates = TEMPLATE_DEFINITIONS.filter((t) => {
    if (templateGroupFilter !== 'ALL' && t.group !== templateGroupFilter) return false;
    if (templateSearch.trim()) {
      const qNorm = removeVietnameseDiacritics(templateSearch);
      return (
        removeVietnameseDiacritics(t.name).includes(qNorm) ||
        removeVietnameseDiacritics(t.description).includes(qNorm) ||
        (t.legalBasis && removeVietnameseDiacritics(t.legalBasis).includes(qNorm))
      );
    }
    return true;
  });

  const handleSelectTemplate = (t: TemplateDefinition) => {
    setSelectedTemplate(t);
    if (!isCustomTitle) {
      setTitle(`${t.name} - ${todayDisplay}`);
    }
    setCode(
      `${String(meetings.length + 1).padStart(2, '0')}/${new Date().getFullYear()}/BB-${t.group}-${Date.now().toString().slice(-3)}`
    );
    setFormErrors((prev) => ({ ...prev, participants: undefined }));

    // Nếu có Nhóm họp gắn đúng template này, gợi ý nạp tự động; nếu không giữ danh sách hiện có (cập nhật affiliation cho Nhóm D)
    const matchingGroup = memberGroups.find((g) => g.defaultTemplateId === t.id);
    if (matchingGroup) {
      handleApplyGroupPreset(matchingGroup, false);
    } else if (t.group === 'D') {
      setParticipants((prev) =>
        prev.map((p, idx) => ({
          ...p,
          affiliation: p.affiliation || (idx === 0 ? 'party_a' : p.affiliation || 'party_a'),
        }))
      );
    }
  };

  const handleApplyMinimalPreset = () => {
    setActivePresetGroupId('minimal');
    setPresetAgendas(undefined);
    setParticipants(buildDefaultParticipants(selectedTemplate.group));
  };

  const handleApplyGroupPreset = (grp: MemberGroup, syncTemplate: boolean = true) => {
    setActivePresetGroupId(grp.id);
    setParticipants(buildParticipantsFromGroup(grp.id));
    setPresetAgendas(grp.defaultAgendas && grp.defaultAgendas.length > 0 ? grp.defaultAgendas : undefined);
    if (grp.defaultVenue) {
      setVenue(grp.defaultVenue);
      const matchedV = workspaceSettings.venues.find((v) => v.name === grp.defaultVenue);
      if (matchedV) {
        setMeetingMode(matchedV.mode);
        setMeetingUrl(matchedV.url || '');
      }
    }
    if (syncTemplate && grp.defaultTemplateId) {
      const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId);
      if (tpl) {
        setSelectedTemplate(tpl);
        if (!isCustomTitle) {
          setTitle(`${grp.name} - ${todayDisplay}`);
        }
      }
    }
    setFormErrors((prev) => ({ ...prev, participants: undefined }));
  };

  const isDirMemberSelected = (dm: DirectoryMember) =>
    participants.some(
      (p) =>
        p.directoryMemberId === dm.id ||
        (dm.email && p.email && p.email.toLowerCase() === dm.email.toLowerCase()) ||
        p.name.toLowerCase() === dm.name.toLowerCase()
    );

  const handleToggleDirectoryMember = (dm: DirectoryMember) => {
    setActivePresetGroupId('custom');
    const exists = isDirMemberSelected(dm);
    if (exists) {
      setParticipants((prev) =>
        prev.filter(
          (p) =>
            p.directoryMemberId !== dm.id &&
            p.name.toLowerCase() !== dm.name.toLowerCase()
        )
      );
      return;
    }

    const hasChairAlready = participants.some((p) => p.role === 'chairperson');
    const hasSecAlready = participants.some((p) => p.role === 'secretary');
    let assignedRole: ParticipantRole = dm.defaultRole;
    if (assignedRole === 'chairperson' && hasChairAlready) assignedRole = 'member';
    if (assignedRole === 'secretary' && hasSecAlready) assignedRole = 'member';

    const added: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      directoryMemberId: dm.id,
      name: dm.name,
      email: dm.email,
      role: assignedRole,
      title: dm.title,
      department: dm.department,
      organizationName: dm.organizationName,
      affiliation:
        selectedTemplate.group === 'D'
          ? dm.memberType === 'external'
            ? 'party_b'
            : 'party_a'
          : 'internal',
      status: 'present',
      sharesCount: dm.sharesCount,
      capitalRatio: dm.capitalRatio,
      votingPower: assignedRole === 'guest' ? 0 : dm.sharesCount || 1,
    };
    setParticipants((prev) => [...prev, added]);
    setFormErrors((prev) => ({ ...prev, participants: undefined }));
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;

    const isDuplicate = participants.some(
      (p) => p.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.warning(`Đã có đại biểu "${newName.trim()}" trong cuộc họp này`);
      return;
    }

    const dirId = `dir-${Date.now()}`;
    const generatedEmail = `${removeVietnameseDiacritics(newName.trim()).replace(/\s+/g, '.')}@company.vn`;

    if (saveNewToDirectory) {
      upsertDirectoryMember({
        id: dirId,
        name: newName.trim(),
        email: generatedEmail,
        title: newTitle.trim() || 'Thành viên',
        department,
        memberType:
          selectedTemplate.group === 'D' && newAffiliation === 'party_b'
            ? 'external'
            : selectedTemplate.group === 'B'
            ? 'board'
            : 'internal',
        defaultRole: newRole,
        sharesCount: typeof newShares === 'number' ? Math.max(0, newShares) : undefined,
        capitalRatio:
          typeof newCapitalRatio === 'number'
            ? Math.min(100, Math.max(0, newCapitalRatio))
            : undefined,
      });
    }

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      directoryMemberId: saveNewToDirectory ? dirId : undefined,
      name: newName.trim(),
      email: generatedEmail,
      role: newRole,
      title: newTitle.trim() || 'Thành viên',
      affiliation: selectedTemplate.group === 'D' ? newAffiliation : 'internal',
      status: 'present',
      sharesCount: typeof newShares === 'number' ? Math.max(0, newShares) : undefined,
      capitalRatio:
        typeof newCapitalRatio === 'number'
          ? Math.min(100, Math.max(0, newCapitalRatio))
          : undefined,
      votingPower: newRole === 'guest' ? 0 : typeof newShares === 'number' && newShares > 0 ? newShares : 1,
    };

    setParticipants((prev) => [...prev, newP]);
    setFormErrors((prev) => ({ ...prev, participants: undefined }));
    setNewName('');
    setNewTitle('Thành viên tham dự');
    setNewShares('');
    setNewCapitalRatio('');
  };

  const mockMeetingObj = {
    group: selectedTemplate.group,
    type: selectedTemplate.type,
    quorum: selectedTemplate.defaultQuorum
      ? {
          requiredPercentage: selectedTemplate.defaultQuorum,
          actualPercentage: 0,
          isMet: false,
          totalCapitalOrShares: 0,
          presentCapitalOrShares: 0,
        }
      : undefined,
  } as any;
  const currentQuorum = recalculateQuorum(mockMeetingObj, participants);

  const filteredDirectoryForPicker = directoryMembers.filter((dm) => {
    if (!dirSearch.trim()) return true;
    const q = removeVietnameseDiacritics(dirSearch);
    return (
      removeVietnameseDiacritics(dm.name).includes(q) ||
      removeVietnameseDiacritics(dm.title).includes(q) ||
      (dm.department && removeVietnameseDiacritics(dm.department).includes(q))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof formErrors = {};
    if (!title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề cuộc họp';
    }
    if (!code.trim()) {
      errors.code = 'Số & ký hiệu biên bản không được để trống';
    } else if (meetings.some((m) => m.code.trim().toLowerCase() === code.trim().toLowerCase())) {
      errors.code = `Mã "${code.trim()}" đã tồn tại. Vui lòng chọn số hiệu khác.`;
    }
    if (startTime && endTime && startTime >= endTime) {
      errors.time = 'Giờ kết thúc phải sau giờ bắt đầu';
    }

    const hasChair = participants.some((p) => p.role === 'chairperson');
    const hasSec = participants.some((p) => p.role === 'secretary');

    if (!hasChair) {
      errors.participants = 'Cần ít nhất một đại biểu giữ vai trò Chủ tọa.';
    } else if (['B', 'D'].includes(selectedTemplate.group) && !hasSec) {
      errors.participants = 'Cuộc họp pháp lý / đối ngoại cần có ít nhất một Thư ký.';
    } else if (selectedTemplate.group === 'D') {
      const hasPartyA = participants.some((p) => p.affiliation === 'party_a');
      const hasPartyB = participants.some((p) => p.affiliation === 'party_b');
      if (!hasPartyA || !hasPartyB) {
        errors.participants =
          'Cuộc họp song phương (Nhóm D) cần gán ít nhất 1 đại diện Bên A và 1 đại diện Bên B.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.code) setShowLegalAccordion(true);
      toast.warning('Vui lòng kiểm tra các thông tin được đánh dấu đỏ');
      return;
    }

    const nowTs = Date.now();
    const builtAgendas =
      presetAgendas && presetAgendas.length > 0
        ? presetAgendas.map((agTitle, idx) => {
            const agId = `ag-${nowTs}-${idx + 1}`;
            return {
              id: agId,
              order: idx + 1,
              title: agTitle,
              description: 'Trình bày báo cáo, thảo luận và thống nhất quyết nghị.',
              durationMinutes: 25,
              opinions: [],
              decision: {
                id: `dec-${nowTs}-${idx + 1}`,
                agendaItemId: agId,
                content: '',
                status: 'agreed' as const,
                thresholdPercent: selectedTemplate.defaultQuorum || 50,
              },
              actionItems: [],
            };
          })
        : undefined;

    const newMeeting = createMeeting(
      {
        title: title.trim(),
        code: code.trim(),
        templateId: selectedTemplate.id,
        group: selectedTemplate.group,
        type: selectedTemplate.type,
        typeName: selectedTemplate.name,
        organization: {
          governingBody: workspaceSettings.governingBody || undefined,
          name: orgName.trim() || workspaceSettings.orgName,
          department: department.trim() || undefined,
          enterpriseCode:
            selectedTemplate.group === 'B' ? enterpriseCode.trim() || undefined : undefined,
          address: selectedTemplate.group === 'B' ? orgAddress.trim() || undefined : undefined,
        },
        date,
        startTime,
        endTime,
        venue: venue.trim() || 'Phòng họp chính',
        meetingMode,
        meetingUrl: meetingUrl || undefined,
        participants,
        quorum: currentQuorum,
        agendaItems: builtAgendas,
      },
      carryOverActions && selectedTemplate.group !== 'B'
    );

    setCurrentMeetingId(newMeeting.id);
    setActiveTab('live');
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
        className="animate-modal-enter flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1d4ed8]">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">
                Khởi tạo biên bản cuộc họp mới
              </h2>
              <p className="text-xs text-slate-600">
                Kế thừa tự động pháp nhân đơn vị, phòng họp và chọn linh hoạt đại biểu từ Danh bạ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {/* Section 1: Quick Template Selector */}
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'ALL', label: 'Tất cả (14)' },
                    { id: 'B', label: 'B. Pháp lý' },
                    { id: 'A', label: 'A. Nội bộ' },
                    { id: 'C', label: 'C. Dự án' },
                    { id: 'D', label: 'D. Đối ngoại' },
                    { id: 'E', label: 'E. Đoàn thể' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTemplateGroupFilter(g.id)}
                      className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        templateGroupFilter === g.id
                          ? 'bg-[#1d4ed8] font-semibold text-white'
                          : 'bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="search"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Lọc nhanh 14 mẫu…"
                    className="h-8.5 w-full rounded-xl border border-slate-300/85 bg-[var(--surface-well)] pl-8.5 pr-2.5 text-xs text-slate-900 placeholder-slate-500 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-well)] p-2 sm:grid-cols-2">
                {filteredTemplates.map((t) => {
                  const isSelected = selectedTemplate.id === t.id;
                  const gMeta = GROUP_META[t.group] || GROUP_META.A;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t)}
                      className={`flex cursor-pointer items-start justify-between gap-2 rounded-xl border p-2.5 text-left text-[13px] transition-all ${
                        isSelected
                          ? 'border-[#1d4ed8] bg-white text-slate-900 shadow-2xs ring-1 ring-[#1d4ed8]'
                          : 'border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{t.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-600">
                          {t.legalBasis || t.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${gMeta.badgeClass}`}
                      >
                        Nhóm {t.group}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Core Meeting Info + Saved Venue Chips */}
            <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-well)]/60 p-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Tiêu đề cuộc họp <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsCustomTitle(true);
                    if (formErrors.title) setFormErrors((p) => ({ ...p, title: undefined }));
                  }}
                  placeholder={`Ví dụ: ${selectedTemplate.name}...`}
                  className={`h-9.5 w-full rounded-xl border px-3 text-[13.5px] font-medium text-slate-900 placeholder-slate-400 focus:border-[#1d4ed8] focus:bg-white focus:outline-none ${
                    formErrors.title ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300/85 bg-white'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-xs font-medium text-rose-700">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Ngày họp</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 text-[13px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (formErrors.time) setFormErrors((p) => ({ ...p, time: undefined }));
                    }}
                    className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 text-[13px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      if (formErrors.time) setFormErrors((p) => ({ ...p, time: undefined }));
                    }}
                    className={`h-9 w-full rounded-xl border px-2.5 text-[13px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none ${
                      formErrors.time ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300/85 bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Hình thức</label>
                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
                    className="h-9 w-full cursor-pointer rounded-xl border border-slate-300/85 bg-white px-2.5 text-[13px] text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  >
                    <option value="offline">Trực tiếp</option>
                    <option value="online">Trực tuyến</option>
                    <option value="hybrid">Kết hợp</option>
                  </select>
                </div>
              </div>
              {formErrors.time && (
                <p className="text-xs font-medium text-rose-700">{formErrors.time}</p>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Địa điểm / Phòng họp
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Phòng họp hoặc link Google Meet / Zoom..."
                  className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-3 text-[13px] text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                />
                {workspaceSettings.venues.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11.5px] text-slate-600">Chọn nhanh:</span>
                    {workspaceSettings.venues.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVenue(v.name);
                          setMeetingMode(v.mode);
                          setMeetingUrl(v.url || '');
                        }}
                        className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors ${
                          venue === v.name
                            ? 'border-[#1d4ed8] bg-blue-50 font-semibold text-[#0b3d91]'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedTemplate.group !== 'B' && unfinishedActionsCount > 0 && (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                  <input
                    type="checkbox"
                    checked={carryOverActions}
                    onChange={(e) => setCarryOverActions(e.target.checked)}
                    className="rounded text-[#1d4ed8]"
                  />
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-800" />
                  <span>
                    Tự động mang tối đa 5 việc tồn kỳ trước cùng nhóm (hiện có{' '}
                    <strong>{unfinishedActionsCount}</strong> việc) vào Mục #1 để rà soát
                  </span>
                </label>
              )}
            </div>

            {/* Section 3: Smart Participant Roster & Directory Picker (Direct, Flexible, Never Static!) */}
            <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Users className="h-4 w-4 text-[#1d4ed8]" />
                  <span className="text-[13.5px] font-bold text-slate-900">
                    Thành phần tham dự ({participants.length} người)
                  </span>
                  {currentQuorum && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tabular-nums ${
                        currentQuorum.isMet
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-rose-200 bg-rose-50 text-rose-900'
                      }`}
                    >
                      {currentQuorum.isMet ? (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      Túc số {currentQuorum.actualPercentage}%/{currentQuorum.requiredPercentage}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('directory');
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#1d4ed8] hover:underline"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Quản lý Danh bạ & Nhóm họp</span>
                </button>
              </div>

              {/* 1-Click Roster Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Nạp theo nhóm:
                </span>
                <button
                  type="button"
                  onClick={handleApplyMinimalPreset}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    activePresetGroupId === 'minimal'
                      ? 'border-[#1d4ed8] bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                      : 'border-slate-200 bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  Chỉ Chủ tọa & Thư ký
                </button>
                {memberGroups.map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => handleApplyGroupPreset(grp, false)}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      activePresetGroupId === grp.id
                        ? 'border-[#1d4ed8] bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                        : 'border-slate-200 bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {grp.name} ({grp.memberIds.length})
                  </button>
                ))}
              </div>

              {/* Quick-Toggle Pills from Master Directory */}
              {directoryMembers.length > 0 && (
                <div className="space-y-2 rounded-xl border border-slate-200/80 bg-[var(--surface-well)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Tích chọn nhanh từ Danh bạ ({directoryMembers.length} người):
                    </span>
                    <input
                      type="search"
                      value={dirSearch}
                      onChange={(e) => setDirSearch(e.target.value)}
                      placeholder="Tìm tên trong danh bạ…"
                      className="h-7.5 w-44 rounded-lg border border-slate-300/80 bg-white px-2.5 text-xs text-slate-900 placeholder-slate-500 focus:border-[#1d4ed8] focus:outline-none"
                    />
                  </div>
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                    {filteredDirectoryForPicker.map((dm) => {
                      const active = isDirMemberSelected(dm);
                      return (
                        <button
                          key={dm.id}
                          type="button"
                          onClick={() => handleToggleDirectoryMember(dm)}
                          className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs transition-all ${
                            active
                              ? 'border-[#1d4ed8] bg-white font-semibold text-[#0b3d91] shadow-2xs'
                              : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {dm.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formErrors.participants && (
                <div className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formErrors.participants}</span>
                </div>
              )}

              {/* Active Participants Table with Inline Role / Party Switching */}
              {participants.length > 0 && (
                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2">
                            <span className="font-semibold text-slate-900">{p.name}</span>
                            <span className="ml-1.5 text-slate-600">({p.title})</span>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={p.role}
                              onChange={(e) =>
                                setParticipants((prev) =>
                                  prev.map((item) =>
                                    item.id === p.id
                                      ? { ...item, role: e.target.value as ParticipantRole }
                                      : item
                                  )
                                )
                              }
                              className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800"
                            >
                              <option value="chairperson">Chủ tọa</option>
                              <option value="secretary">Thư ký</option>
                              <option value="member">Thành viên</option>
                              <option value="scrutineer">Kiểm phiếu</option>
                              <option value="guest">Khách mời</option>
                            </select>
                          </td>
                          {selectedTemplate.group === 'D' && (
                            <td className="px-2 py-2">
                              <select
                                value={p.affiliation || 'party_a'}
                                onChange={(e) =>
                                  setParticipants((prev) =>
                                    prev.map((item) =>
                                      item.id === p.id
                                        ? {
                                            ...item,
                                            affiliation: e.target.value as PartyAffiliation,
                                          }
                                        : item
                                    )
                                  )
                                }
                                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800"
                              >
                                <option value="party_a">Bên A</option>
                                <option value="party_b">Bên B</option>
                              </select>
                            </td>
                          )}
                          <td className="px-2 py-2">
                            <select
                              value={p.status}
                              onChange={(e) =>
                                setParticipants((prev) =>
                                  prev.map((item) =>
                                    item.id === p.id
                                      ? { ...item, status: e.target.value as AttendanceStatus }
                                      : item
                                  )
                                )
                              }
                              className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                            >
                              <option value="present">Có mặt</option>
                              <option value="delegated">Ủy quyền</option>
                              <option value="absent_permitted">Vắng có phép</option>
                            </select>
                          </td>
                          <td className="px-2.5 py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setParticipants((prev) => prev.filter((item) => item.id !== p.id))
                              }
                              className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-600"
                              aria-label={`Bỏ ${p.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quick Add New Person + Progressive Save to Directory */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
                  <input
                    type="text"
                    placeholder="Thêm người mới ngoài danh bạ…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-9 rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs text-slate-900 sm:col-span-2"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as ParticipantRole)}
                    className="h-9 cursor-pointer rounded-xl border border-slate-300/85 bg-white px-2 text-xs text-slate-800"
                  >
                    <option value="member">Thành viên</option>
                    <option value="chairperson">Chủ tọa</option>
                    <option value="secretary">Thư ký</option>
                    <option value="scrutineer">Kiểm phiếu</option>
                    <option value="guest">Khách mời</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Chức danh…"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-9 rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs text-slate-900"
                  />
                  {selectedTemplate.type === 'B1_DH_CO_DONG' ? (
                    <input
                      type="number"
                      min={0}
                      placeholder="Số cổ phần"
                      value={newShares}
                      onChange={(e) =>
                        setNewShares(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="h-9 rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs tabular-nums"
                    />
                  ) : selectedTemplate.type === 'B3_HD_THANH_VIEN' ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="% vốn"
                      value={newCapitalRatio}
                      onChange={(e) =>
                        setNewCapitalRatio(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="h-9 rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs tabular-nums"
                    />
                  ) : selectedTemplate.group === 'D' ? (
                    <select
                      value={newAffiliation}
                      onChange={(e) => setNewAffiliation(e.target.value as PartyAffiliation)}
                      className="h-9 rounded-xl border border-slate-300/85 bg-white px-2 text-xs"
                    >
                      <option value="party_a">Bên A</option>
                      <option value="party_b">Bên B</option>
                    </select>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    disabled={!newName.trim()}
                    className="inline-flex h-9 cursor-pointer items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-[#0b3d91] hover:bg-blue-100 disabled:opacity-40"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={saveNewToDirectory}
                    onChange={(e) => setSaveNewToDirectory(e.target.checked)}
                    className="rounded text-[#1d4ed8]"
                  />
                  <span>Tự động lưu người mới thêm vào Danh bạ đơn vị cho các kỳ họp sau</span>
                </label>
              </div>
            </div>

            {/* Section 4: Collapsible Legal & Document Code Override */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white">
              <button
                type="button"
                onClick={() => setShowLegalAccordion((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-xs transition-colors hover:bg-slate-50"
              >
                <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                  <Building2 className="h-4 w-4 text-[#1d4ed8]" />
                  <span>Pháp nhân & Số hiệu ({orgName})</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-slate-700">
                    {code}
                  </span>
                </span>
                {showLegalAccordion ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {showLegalAccordion && (
                <div className="space-y-3 border-t border-slate-100 bg-[var(--surface-well)]/60 p-4 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Số & Ký hiệu biên bản *
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          if (formErrors.code) setFormErrors((p) => ({ ...p, code: undefined }));
                        }}
                        className={`h-9 w-full rounded-xl border px-2.5 font-mono text-xs tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none ${
                          formErrors.code ? 'border-rose-300 bg-rose-50/40' : 'border-slate-300/85 bg-white'
                        }`}
                      />
                      {formErrors.code && (
                        <p className="text-[11px] font-medium text-rose-700">{formErrors.code}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Tên cơ quan / Doanh nghiệp (bản chụp kỳ này)
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Phòng ban / Đơn vị chủ trì
                      </label>
                      <input
                        type="text"
                        list="modal-dept-list"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                      />
                      <datalist id="modal-dept-list">
                        {workspaceSettings.departments.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {selectedTemplate.group === 'B' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          Mã số doanh nghiệp (MSDN)
                        </label>
                        <input
                          type="text"
                          value={enterpriseCode}
                          onChange={(e) => setEnterpriseCode(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 font-mono text-xs tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-slate-700">
                          Địa chỉ trụ sở chính
                        </label>
                        <input
                          type="text"
                          value={orgAddress}
                          onChange={(e) => setOrgAddress(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-300/85 bg-white px-2.5 text-xs text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--surface-well)] px-5 py-3.5">
            <span className="hidden items-center gap-1.5 text-xs text-slate-600 sm:inline-flex">
              <Scale className="h-3.5 w-3.5 text-[#1d4ed8]" />
              Đang áp dụng: <strong className="text-slate-900">{selectedTemplate.name}</strong>
            </span>
            <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-200/70"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
              >
                <Zap className="h-4 w-4" />
                <span>Bắt đầu ghi biên bản ngay</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <CreateMeetingModalInner onClose={onClose} />;
};
