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
} from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMeetingModalInner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { createMeeting, setCurrentMeetingId, setActiveTab, currentUser, meetings } =
    useMeetingContext();
  const { toast } = useToast();

  const defaultTpl = TEMPLATE_DEFINITIONS[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('vi-VN');

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(defaultTpl);
  const [templateGroupFilter, setTemplateGroupFilter] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState('');

  // Pre-filled core fields for 1-click creation
  const [title, setTitle] = useState(`${defaultTpl.name} - ${todayDisplay}`);
  const [isCustomTitle, setIsCustomTitle] = useState(false);
  const [code, setCode] = useState(
    `${String(meetings.length + 1).padStart(2, '0')}/${new Date().getFullYear()}/BB-${defaultTpl.group}`
  );
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [venue, setVenue] = useState('Phòng họp chính');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('offline');

  // Optional legal / organization snapshot (Accordion A - collapsed by default)
  const [showLegalAccordion, setShowLegalAccordion] = useState(false);
  const [orgName, setOrgName] = useState('CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY');
  const [department, setDepartment] = useState('Ban Điều hành');
  const [enterpriseCode, setEnterpriseCode] = useState('0109887766');
  const [orgAddress, setOrgAddress] = useState(
    'Tầng 18, Tòa nhà Keangnam Landmark 72, Q. Nam Từ Liêm, TP. Hà Nội'
  );
  const [carryOverActions, setCarryOverActions] = useState(true);

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    code?: string;
    time?: string;
    participants?: string;
  }>({});

  // Optional participants & quorum (Accordion B - collapsed by default)
  const [showParticipantsAccordion, setShowParticipantsAccordion] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: `p-${Date.now()}-1`,
      name: currentUser.name,
      email: currentUser.email,
      role: 'chairperson',
      title: currentUser.title || 'Chủ tọa cuộc họp',
      status: 'present',
      votingPower: 1,
    },
    {
      id: `p-${Date.now()}-2`,
      name: 'Trần Thị Thu Hà',
      email: 'ha.tran@vinacorp.vn',
      role: 'secretary',
      title: 'Trưởng ban Pháp chế kiêm Thư ký',
      status: 'present',
    },
    {
      id: `p-${Date.now()}-3`,
      name: 'Lê Hoàng Minh',
      email: 'minh.le@dragoncapital.com',
      role: 'member',
      title: 'Đại diện Thành viên',
      status: 'present',
    },
  ]);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Thành viên tham dự');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');

  const unfinishedActionsCount = meetings
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
      const match =
        removeVietnameseDiacritics(t.name).includes(qNorm) ||
        removeVietnameseDiacritics(t.description).includes(qNorm) ||
        (t.legalBasis && removeVietnameseDiacritics(t.legalBasis).includes(qNorm));
      if (!match) return false;
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

    if (t.group === 'B') {
      if (t.type === 'B1_DH_CO_DONG') {
        setParticipants([
          {
            id: `p-${Date.now()}-1`,
            name: currentUser.name,
            email: currentUser.email,
            role: 'chairperson',
            title: 'Chủ tịch HĐQT kiêm Chủ tọa',
            status: 'present',
            sharesCount: 25400000,
            votingPower: 25400000,
          },
          {
            id: `p-${Date.now()}-2`,
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@vinacorp.vn',
            role: 'secretary',
            title: 'Thư ký Đại hội',
            status: 'present',
            votingPower: 0,
          },
          {
            id: `p-${Date.now()}-3`,
            name: 'Lê Hoàng Minh',
            email: 'minh.le@dragoncapital.com',
            role: 'member',
            title: 'Đại diện Quỹ Dragon Capital (Cổ đông lớn)',
            status: 'present',
            sharesCount: 18500000,
            votingPower: 18500000,
          },
          {
            id: `p-${Date.now()}-4`,
            name: 'Phạm Quang Thắng',
            email: 'thang.pq@vietcap.com',
            role: 'member',
            title: 'Cổ đông Tổ chức VietCap',
            status: 'delegated',
            delegatedTo: 'Lê Hoàng Minh',
            sharesCount: 5200000,
            votingPower: 5200000,
          },
        ]);
      } else if (t.type === 'B2_HD_QUAN_TRI') {
        setParticipants([
          {
            id: `p-${Date.now()}-1`,
            name: currentUser.name,
            email: currentUser.email,
            role: 'chairperson',
            title: 'Chủ tịch HĐQT',
            status: 'present',
            votingPower: 1,
          },
          {
            id: `p-${Date.now()}-2`,
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@vinacorp.vn',
            role: 'secretary',
            title: 'Thư ký HĐQT',
            status: 'present',
          },
          {
            id: `p-${Date.now()}-3`,
            name: 'Vũ Hải Đăng',
            email: 'dang.vu@vinacorp.vn',
            role: 'member',
            title: 'Thành viên HĐQT kiêm Tổng Giám đốc',
            status: 'present',
            votingPower: 1,
          },
          {
            id: `p-${Date.now()}-4`,
            name: 'Lê Hoàng Minh',
            email: 'minh.le@dragoncapital.com',
            role: 'member',
            title: 'Thành viên HĐQT độc lập',
            status: 'present',
            votingPower: 1,
          },
        ]);
      } else if (t.type === 'B3_HD_THANH_VIEN') {
        setParticipants([
          {
            id: `p-${Date.now()}-1`,
            name: currentUser.name,
            email: currentUser.email,
            role: 'chairperson',
            title: 'Chủ tịch Hội đồng Thành viên',
            status: 'present',
            capitalRatio: 45,
          },
          {
            id: `p-${Date.now()}-2`,
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@vinacorp.vn',
            role: 'secretary',
            title: 'Thư ký cuộc họp',
            status: 'present',
          },
          {
            id: `p-${Date.now()}-3`,
            name: 'Lê Hoàng Minh',
            email: 'minh.le@investcorp.vn',
            role: 'member',
            title: 'Thành viên góp vốn (30%)',
            status: 'present',
            capitalRatio: 30,
          },
          {
            id: `p-${Date.now()}-4`,
            name: 'Nguyễn Thị Bích Ngọc',
            email: 'ngoc.ntb@investcorp.vn',
            role: 'member',
            title: 'Thành viên góp vốn (25%)',
            status: 'present',
            capitalRatio: 25,
          },
        ]);
      }
    } else if (t.group === 'D') {
      setParticipants([
        {
          id: `p-${Date.now()}-1`,
          name: currentUser.name,
          email: currentUser.email,
          role: 'chairperson',
          title: 'Giám đốc Dự án - Bên A',
          affiliation: 'party_a',
          status: 'present',
        },
        {
          id: `p-${Date.now()}-2`,
          name: 'Trần Thị Thu Hà',
          email: 'ha.tran@vinacorp.vn',
          role: 'secretary',
          title: 'Thư ký cuộc họp',
          affiliation: 'party_a',
          status: 'present',
        },
        {
          id: `p-${Date.now()}-3`,
          name: 'Michael Chen',
          email: 'm.chen@partner-global.com',
          role: 'member',
          title: 'Giám đốc Công nghệ - Bên B (Đối tác)',
          affiliation: 'party_b',
          status: 'present',
        },
      ]);
    }
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;

    const isDuplicate = participants.some(
      (p) => p.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.warning(`Đã có đại biểu trùng tên "${newName.trim()}"`);
      return;
    }

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName.trim(),
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@company.vn`,
      role: newRole,
      title: newTitle.trim() || 'Thành viên',
      affiliation: selectedTemplate.group === 'D' ? newAffiliation : 'internal',
      status: 'present',
      sharesCount: typeof newShares === 'number' ? Math.max(0, newShares) : undefined,
      capitalRatio:
        typeof newCapitalRatio === 'number'
          ? Math.min(100, Math.max(0, newCapitalRatio))
          : undefined,
      votingPower: newRole === 'guest' ? 0 : 1,
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
        errors.participants = 'Cuộc họp song phương (Nhóm D) cần đại diện cả Bên A và Bên B.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.code) setShowLegalAccordion(true);
      if (errors.participants) setShowParticipantsAccordion(true);
      toast.warning('Vui lòng kiểm tra các trường được đánh dấu đỏ');
      return;
    }

    const chairPerson = participants.find((p) => p.role === 'chairperson') || participants[0];
    const secretaryPerson =
      participants.find((p) => p.role === 'secretary') || participants[1] || chairPerson;

    const newMeeting = createMeeting(
      {
        title: title.trim(),
        code: code.trim(),
        templateId: selectedTemplate.id,
        group: selectedTemplate.group,
        type: selectedTemplate.type,
        typeName: selectedTemplate.name,
        organization: {
          name: orgName.trim() || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
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
        participants,
        quorum: currentQuorum,
        signatures: [
          {
            role: 'chairperson',
            roleTitle: 'CHỦ TỌA CUỘC HỌP',
            signerName: chairPerson.name,
            refused: false,
            signatureType: 'electronic_confirm',
          },
          {
            role: 'secretary',
            roleTitle: 'THƯ KÝ GHI BIÊN BẢN',
            signerName: secretaryPerson.name,
            refused: false,
            signatureType: 'electronic_confirm',
          },
        ],
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
        className="animate-modal-enter flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                Khởi tạo biên bản nhanh (1 màn hình)
              </h2>
              <p className="text-[11px] text-slate-500">
                Chọn mẫu nghiệp vụ và bấm tạo ngay — cấu trúc Nghị định 30 & túc số tự động nạp sẵn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Single-Screen Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {/* Section 1: Quick Template Selector */}
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1">
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
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        templateGroupFilter === g.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-48">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Lọc nhanh 14 mẫu…"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid max-h-44 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-slate-200/90 bg-slate-50/70 p-2 sm:grid-cols-2">
                {filteredTemplates.map((t) => {
                  const isSelected = selectedTemplate.id === t.id;
                  const gMeta = GROUP_META[t.group] || GROUP_META.A;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t)}
                      className={`flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-2.5 text-left text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 shadow-2xs ring-1 ring-indigo-600'
                          : 'border-slate-200/80 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{t.name}</p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                          {t.legalBasis || t.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${gMeta.badgeClass}`}
                      >
                        Nhóm {t.group}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Essential Core Details */}
            <div className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/40 p-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Tiêu đề cuộc họp <span className="text-rose-500">*</span>
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
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 ${
                    formErrors.title ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'
                  }`}
                />
                {formErrors.title && (
                  <p className="text-[11px] font-medium text-rose-600">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Ngày họp</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (formErrors.time) setFormErrors((p) => ({ ...p, time: undefined }));
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      if (formErrors.time) setFormErrors((p) => ({ ...p, time: undefined }));
                    }}
                    className={`w-full rounded-lg border px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none ${
                      formErrors.time ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Hình thức</label>
                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="offline">Trực tiếp</option>
                    <option value="online">Trực tuyến</option>
                    <option value="hybrid">Kết hợp</option>
                  </select>
                </div>
              </div>
              {formErrors.time && (
                <p className="text-[11px] font-medium text-rose-600">{formErrors.time}</p>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Địa điểm / Link phòng họp
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Phòng họp chính hoặc link Google Meet / Zoom..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {selectedTemplate.group !== 'B' && unfinishedActionsCount > 0 && (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-950">
                  <input
                    type="checkbox"
                    checked={carryOverActions}
                    onChange={(e) => setCarryOverActions(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span>
                    Tự động mang tối đa 5 việc tồn đọng (hiện có <strong>{unfinishedActionsCount}</strong>{' '}
                    việc) vào Mục #1 để rà soát
                  </span>
                </label>
              )}
            </div>

            {/* Section 3: Collapsible Progressive Disclosure Accordions */}
            <div className="space-y-2">
              {/* Accordion A: Legal & Document Code */}
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                <button
                  type="button"
                  onClick={() => setShowLegalAccordion((prev) => !prev)}
                  className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Pháp nhân & Số hiệu văn bản</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                      {code}
                    </span>
                  </span>
                  {showLegalAccordion ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showLegalAccordion && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3.5 text-xs">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">
                          Số & Ký hiệu biên bản *
                        </label>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                            if (formErrors.code) setFormErrors((p) => ({ ...p, code: undefined }));
                          }}
                          className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none ${
                            formErrors.code ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'
                          }`}
                        />
                        {formErrors.code && (
                          <p className="text-[10px] font-medium text-rose-600">{formErrors.code}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">
                          Tên cơ quan / Doanh nghiệp
                        </label>
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">
                          Phòng ban / Đơn vị
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {selectedTemplate.group === 'B' && (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-600">
                            Mã số doanh nghiệp (MSDN)
                          </label>
                          <input
                            type="text"
                            value={enterpriseCode}
                            onChange={(e) => setEnterpriseCode(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-medium text-slate-600">
                            Địa chỉ trụ sở chính
                          </label>
                          <input
                            type="text"
                            value={orgAddress}
                            onChange={(e) => setOrgAddress(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion B: Participants & Quorum */}
              <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
                <button
                  type="button"
                  onClick={() => setShowParticipantsAccordion((prev) => !prev)}
                  className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-slate-50"
                >
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Đại biểu & Túc số ({participants.length} người)</span>
                    {currentQuorum && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          currentQuorum.isMet
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {currentQuorum.isMet ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        Túc số {currentQuorum.actualPercentage}%/{currentQuorum.requiredPercentage}%
                      </span>
                    )}
                  </span>
                  {showParticipantsAccordion ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {showParticipantsAccordion && (
                  <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-3.5 text-xs">
                    {formErrors.participants && (
                      <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-800">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>{formErrors.participants}</span>
                      </div>
                    )}

                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-[11px]">
                        <tbody className="divide-y divide-slate-100">
                          {participants.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/70">
                              <td className="px-2.5 py-1.5">
                                <span className="font-semibold text-slate-900">{p.name}</span>
                                <span className="ml-1.5 text-[10px] text-slate-400">({p.title})</span>
                              </td>
                              <td className="px-2 py-1.5">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                    p.role === 'chairperson'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {formatParticipantRole(p.role)}
                                </span>
                              </td>
                              <td className="px-2 py-1.5">
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
                                  className="cursor-pointer rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px]"
                                >
                                  <option value="present">Có mặt</option>
                                  <option value="delegated">Ủy quyền</option>
                                  <option value="absent_permitted">Vắng có phép</option>
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setParticipants((prev) => prev.filter((item) => item.id !== p.id))
                                  }
                                  className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-600"
                                  aria-label="Xóa đại biểu"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
                      <input
                        type="text"
                        placeholder="Thêm tên đại biểu…"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:col-span-2"
                      />
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as ParticipantRole)}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="member">Thành viên</option>
                        <option value="chairperson">Chủ tọa</option>
                        <option value="secretary">Thư ký</option>
                        <option value="scrutineer">Ban kiểm phiếu</option>
                        <option value="guest">Khách mời</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Chức danh…"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                      />
                      {selectedTemplate.type === 'B1_DH_CO_DONG' ? (
                        <input
                          type="number"
                          min={0}
                          placeholder="Cổ phần"
                          value={newShares}
                          onChange={(e) =>
                            setNewShares(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
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
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        />
                      ) : selectedTemplate.group === 'D' ? (
                        <select
                          value={newAffiliation}
                          onChange={(e) => setNewAffiliation(e.target.value as PartyAffiliation)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
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
                        className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
