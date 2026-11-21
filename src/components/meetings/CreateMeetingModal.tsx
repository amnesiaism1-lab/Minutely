import React, { useState, useEffect } from 'react';
import { useMeetingContext, recalculateQuorum } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import { formatParticipantRole } from '../../utils/uiHelpers';
import {
  TemplateDefinition,
  MeetingMode,
  Participant,
  ParticipantRole,
  PartyAffiliation,
  AttendanceStatus,
} from '../../types';
import {
  PlusCircle,
  X,
  Scale,
  Trash2,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  ShieldAlert,
  Search,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateMeetingModalInner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { createMeeting, setCurrentMeetingId, setActiveTab, currentUser, meetings } =
    useMeetingContext();
  const { toast } = useToast();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(
    TEMPLATE_DEFINITIONS[0]
  );
  const [templateGroupFilter, setTemplateGroupFilter] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState('');

  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`0${Math.floor(Math.random() * 90) + 10}/2026/BB`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [venue, setVenue] = useState('Phòng họp chính');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('offline');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [orgName, setOrgName] = useState('CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY');
  const [department, setDepartment] = useState('Ban Điều hành');
  const [enterpriseCode, setEnterpriseCode] = useState('0109887766');
  const [orgAddress, setOrgAddress] = useState(
    'Tầng 18, Tòa nhà Keangnam Landmark 72, Q. Nam Từ Liêm, TP. Hà Nội'
  );
  const [carryOverActions, setCarryOverActions] = useState(true);
  const [step2Errors, setStep2Errors] = useState<{
    title?: string;
    code?: string;
    time?: string;
  }>({});
  const [step3Error, setStep3Error] = useState('');

  const unfinishedActionsCount = meetings
    .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;

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
      title: 'Đại diện Cổ đông lớn / Thành viên',
      status: 'present',
    },
  ]);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Thành viên tham dự');
  const [newDept, setNewDept] = useState('');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');

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
    if (!title || title.includes('Biên Bản') || title.includes('Họp')) {
      setTitle(`${t.name} - ${date}`);
    }

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
          {
            id: `p-${Date.now()}-5`,
            name: 'Đỗ Thị Lan Phương',
            email: 'lanphuong@kpmg.com.vn',
            role: 'guest',
            title: 'Kiểm toán viên độc lập (KPMG)',
            status: 'present',
            votingPower: 0,
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
          {
            id: `p-${Date.now()}-5`,
            name: 'Hoàng Quốc Bảo',
            email: 'bao.hoang@investcorp.vn',
            role: 'member',
            title: 'Thành viên HĐQT',
            status: 'absent_permitted',
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
        {
          id: `p-${Date.now()}-4`,
          name: 'Sarah Jenkins',
          email: 'sarah.j@partner-global.com',
          role: 'member',
          title: 'Cố vấn Pháp lý Hợp đồng - Bên B',
          affiliation: 'party_b',
          status: 'present',
        },
      ]);
    }
  };

  const validateStep2 = () => {
    const errors: { title?: string; code?: string; time?: string } = {};
    if (!title.trim()) {
      errors.title = 'Vui lòng nhập tiêu đề cuộc họp (không được để trống)';
    }
    if (!code.trim()) {
      errors.code = 'Vui lòng nhập số hiệu / mã biên bản';
    } else if (meetings.some((m) => m.code.trim().toLowerCase() === code.trim().toLowerCase())) {
      errors.code = `Mã biên bản "${code.trim()}" đã tồn tại. Vui lòng chọn số hiệu khác.`;
    }
    if (startTime && endTime && startTime >= endTime) {
      errors.time = 'Giờ kết thúc phải diễn ra sau giờ bắt đầu cuộc họp.';
    }
    setStep2Errors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;

    const isDuplicate = participants.some(
      (p) => p.name.trim().toLowerCase() === newName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.warning(
        `Đã có đại biểu trùng tên "${newName.trim()}"`,
        'Vui lòng kiểm tra để tránh điểm danh nhầm hai lần.'
      );
      return;
    }

    const shares = typeof newShares === 'number' ? Math.max(0, newShares) : undefined;
    const capRatio =
      typeof newCapitalRatio === 'number'
        ? Math.min(100, Math.max(0, newCapitalRatio))
        : undefined;

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      role: newRole,
      title: newTitle.trim() || 'Thành viên',
      department: newDept.trim() || undefined,
      affiliation: selectedTemplate.group === 'D' ? newAffiliation : 'internal',
      status: 'present',
      sharesCount: shares,
      capitalRatio: capRatio,
      votingPower: newRole === 'guest' ? 0 : 1,
    };

    setParticipants([...participants, newP]);
    setStep3Error('');
    setNewName('');
    setNewEmail('');
    setNewTitle('Thành viên tham dự');
    setNewDept('');
    setNewShares('');
    setNewCapitalRatio('');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleUpdateStatus = (id: string, status: AttendanceStatus, delegatedTo?: string) => {
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, status, delegatedTo: delegatedTo ?? p.delegatedTo } : p
      )
    );
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

    if (!validateStep2()) {
      setActiveStep(2);
      toast.warning('Vui lòng kiểm tra lại thông tin cuộc họp ở Bước 2');
      return;
    }

    const hasChair = participants.some((p) => p.role === 'chairperson');
    const hasSec = participants.some((p) => p.role === 'secretary');

    if (!hasChair) {
      const msg = 'Vui lòng chỉ định ít nhất một người giữ vai trò Chủ tọa cuộc họp!';
      setStep3Error(msg);
      toast.error(msg);
      setActiveStep(3);
      return;
    }

    if (['B', 'D'].includes(selectedTemplate.group) && !hasSec) {
      const msg = 'Cuộc họp pháp lý / đối ngoại bắt buộc phải có ít nhất một Thư ký ghi biên bản!';
      setStep3Error(msg);
      toast.error(msg);
      setActiveStep(3);
      return;
    }

    if (selectedTemplate.group === 'D') {
      const hasPartyA = participants.some((p) => p.affiliation === 'party_a');
      const hasPartyB = participants.some((p) => p.affiliation === 'party_b');
      if (!hasPartyA || !hasPartyB) {
        const msg =
          'Biên bản cuộc họp song phương (Nhóm D) bắt buộc phải có đại diện của cả Bên A và Bên B!';
        setStep3Error(msg);
        toast.error(msg);
        setActiveStep(3);
        return;
      }
    }

    const chairPerson = participants.find((p) => p.role === 'chairperson') || participants[0];
    const secretaryPerson =
      participants.find((p) => p.role === 'secretary') || participants[1] || chairPerson;

    const newMeeting = createMeeting(
      {
        title: title.trim() || `${selectedTemplate.name} - ${date}`,
        code: code.trim(),
        templateId: selectedTemplate.id,
        group: selectedTemplate.group,
        type: selectedTemplate.type,
        typeName: selectedTemplate.name,
        organization: {
          name: orgName,
          department,
          enterpriseCode:
            selectedTemplate.group === 'B' ? enterpriseCode.trim() || undefined : undefined,
          address: selectedTemplate.group === 'B' ? orgAddress.trim() || undefined : undefined,
        },
        date,
        startTime,
        endTime,
        venue,
        meetingMode,
        meetingUrl: meetingUrl.trim() || undefined,
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
        className="animate-modal-enter flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
              <PlusCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Khởi tạo cuộc họp mới</h2>
              <p className="text-[11px] text-slate-500">
                Thiết lập mẫu nghiệp vụ, túc số và thành phần tham gia
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

        {/* 3 Step Navigation Pills */}
        <div className="flex select-none items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50 px-4 py-2 text-xs sm:px-6">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-all sm:px-3 ${
              activeStep === 1
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
              1
            </span>
            <span className="truncate">Chọn Biểu Mẫu ({selectedTemplate.group})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-all sm:px-3 ${
              activeStep === 2
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
              2
            </span>
            <span className="truncate">Thông Tin Cuộc Họp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-1.5 font-medium transition-all sm:px-3 ${
              activeStep === 3
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-white">
              3
            </span>
            <span className="truncate">Thành Phần ({participants.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {/* STEP 1: SELECT TEMPLATE */}
          {activeStep === 1 && (
            <div className="space-y-3.5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">
                    Thư viện 14 biểu mẫu chuẩn hóa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chọn mẫu phù hợp để tự động áp dụng quy tắc pháp lý và khối bắt buộc
                  </p>
                </div>
                <span className="self-start rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 sm:self-auto">
                  Đang chọn: {selectedTemplate.name}
                </span>
              </div>

              {/* Search & Group Pills */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'ALL', label: 'Tất cả' },
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
                      className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        templateGroupFilter === g.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-52">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Tìm biểu mẫu…"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid max-h-[44vh] grid-cols-1 gap-2.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 sm:grid-cols-2">
                {filteredTemplates.map((t) => {
                  const isSelected = selectedTemplate.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-xs transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-white text-slate-900 shadow-xs ring-1 ring-slate-900'
                          : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">{t.name}</span>
                          <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                            Nhóm {t.group}
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          {t.description}
                        </p>
                      </div>

                      {t.legalBasis && (
                        <div className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-1.5 font-mono text-[10px] text-slate-600">
                          <Scale className="h-3 w-3 shrink-0 text-slate-500" />
                          <span className="truncate">{t.legalBasis}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
                >
                  <span>Tiếp tục: Thông tin cuộc họp</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INFORMATION */}
          {activeStep === 2 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">
                    Tiêu đề cuộc họp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (step2Errors.title)
                        setStep2Errors((prev) => ({ ...prev, title: undefined }));
                    }}
                    placeholder={`Ví dụ: ${selectedTemplate.name}...`}
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                      step2Errors.title
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {step2Errors.title && (
                    <p className="text-[11px] font-medium text-rose-600">{step2Errors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Số & Ký hiệu biên bản <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (step2Errors.code)
                        setStep2Errors((prev) => ({ ...prev, code: undefined }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                      step2Errors.code
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                  {step2Errors.code && (
                    <p className="text-[11px] font-medium text-rose-600">{step2Errors.code}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Tên cơ quan / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    Phòng ban / Đơn vị tổ chức
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {selectedTemplate.group === 'B' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Mã số doanh nghiệp (Điều 150)
                    </label>
                    <input
                      type="text"
                      value={enterpriseCode}
                      onChange={(e) => setEnterpriseCode(e.target.value)}
                      placeholder="VD: 0109887766"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-700">
                      Địa chỉ trụ sở chính
                    </label>
                    <input
                      type="text"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      placeholder="Địa chỉ theo Giấy chứng nhận ĐKDN..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Ngày họp</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (step2Errors.time)
                        setStep2Errors((prev) => ({ ...prev, time: undefined }));
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      if (step2Errors.time)
                        setStep2Errors((prev) => ({ ...prev, time: undefined }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                      step2Errors.time
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>

                {step2Errors.time && (
                  <p className="text-[11px] font-medium text-rose-600 sm:col-span-3">
                    {step2Errors.time}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Hình thức họp</label>
                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as MeetingMode)}
                    className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="offline">Trực tiếp (Tại văn phòng)</option>
                    <option value="online">Trực tuyến (Meet / Zoom)</option>
                    <option value="hybrid">Kết hợp Trực tiếp & Trực tuyến</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-700">
                    Địa điểm / Đường dẫn họp
                  </label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Phòng họp Boardroom tầng 18 hoặc link họp..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {selectedTemplate.group !== 'B' && unfinishedActionsCount > 0 && (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-950">
                  <input
                    type="checkbox"
                    checked={carryOverActions}
                    onChange={(e) => setCarryOverActions(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                  <span>
                    Tự động mang tối đa 5 việc tồn đọng chưa xong (hiện có{' '}
                    <strong>{unfinishedActionsCount}</strong> việc) vào Mục #1 để rà soát tiếp
                  </span>
                </label>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      setActiveStep(3);
                    }
                  }}
                  className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
                >
                  <span>Tiếp tục: Thành phần tham dự</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DYNAMIC PARTICIPANTS & ATTENDANCE */}
          {activeStep === 3 && (
            <div className="space-y-4">
              {step3Error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{step3Error}</span>
                </div>
              )}

              {currentQuorum && (
                <div
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                    currentQuorum.isMet
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-rose-200 bg-rose-50 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {currentQuorum.isMet ? (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <div>
                      <span className="font-semibold">
                        Túc số tham dự: {currentQuorum.actualPercentage}%{' '}
                        {currentQuorum.isMet
                          ? '(Đạt điều kiện tiến hành họp)'
                          : `(Chưa đạt yêu cầu ${currentQuorum.requiredPercentage}%)`}
                      </span>
                      <p className="text-[11px] opacity-90">
                        {selectedTemplate.group === 'B'
                          ? `Tuân thủ Luật Doanh nghiệp 2020 (${
                              selectedTemplate.legalBasis || 'Quy chuẩn pháp lý'
                            })`
                          : 'Tỷ lệ đại biểu có mặt theo quy chế'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-semibold">
                    {currentQuorum.actualPercentage}% / {currentQuorum.requiredPercentage}%
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Danh sách thành phần tham dự ({participants.length} người)
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {participants.filter((p) => p.status === 'present').length} có mặt,{' '}
                    {participants.filter((p) => p.status === 'delegated').length} ủy quyền
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-600">
                      <tr>
                        <th className="p-2.5 pl-3">Họ và tên</th>
                        <th className="p-2.5">Vai trò</th>
                        <th className="p-2.5">Trạng thái</th>
                        {selectedTemplate.type === 'B1_DH_CO_DONG' && (
                          <th className="p-2.5">Cổ phần</th>
                        )}
                        {selectedTemplate.type === 'B3_HD_THANH_VIEN' && (
                          <th className="p-2.5">Tỷ lệ vốn (%)</th>
                        )}
                        {selectedTemplate.group === 'D' && (
                          <th className="p-2.5">Bên đại diện</th>
                        )}
                        <th className="p-2.5 pr-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {participants.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="p-2.5 pl-3">
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="max-w-[150px] truncate text-[10px] text-slate-500">
                              {p.title}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                p.role === 'chairperson'
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-slate-100 text-slate-700'
                              }`}
                            >
                              {formatParticipantRole(p.role)}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={p.status}
                              onChange={(e) =>
                                handleUpdateStatus(p.id, e.target.value as AttendanceStatus)
                              }
                              className="cursor-pointer rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-700 focus:outline-none"
                            >
                              <option value="present">Có mặt</option>
                              <option value="absent_permitted">Vắng có phép</option>
                              <option value="absent_unexcused">Vắng không phép</option>
                              <option value="delegated">Ủy quyền</option>
                              <option value="late">Đến muộn</option>
                              <option value="left_early">Về sớm</option>
                            </select>
                            {p.status === 'delegated' && (
                              <input
                                type="text"
                                placeholder="Ủy quyền cho ai..."
                                value={p.delegatedTo || ''}
                                onChange={(e) =>
                                  handleUpdateStatus(p.id, 'delegated', e.target.value)
                                }
                                className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-800"
                              />
                            )}
                          </td>
                          {selectedTemplate.type === 'B1_DH_CO_DONG' && (
                            <td className="p-2.5 font-mono text-[11px] text-slate-700">
                              {p.sharesCount ? p.sharesCount.toLocaleString() : '-'}
                            </td>
                          )}
                          {selectedTemplate.type === 'B3_HD_THANH_VIEN' && (
                            <td className="p-2.5 font-mono text-[11px] text-emerald-700">
                              {p.capitalRatio ? `${p.capitalRatio}%` : '-'}
                            </td>
                          )}
                          {selectedTemplate.group === 'D' && (
                            <td className="p-2.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  p.affiliation === 'party_a'
                                    ? 'border border-blue-200 bg-blue-50 text-blue-700'
                                    : p.affiliation === 'party_b'
                                    ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {p.affiliation === 'party_a'
                                  ? 'Bên A'
                                  : p.affiliation === 'party_b'
                                  ? 'Bên B'
                                  : 'Nội bộ'}
                              </span>
                            </td>
                          )}
                          <td className="p-2.5 pr-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(p.id)}
                              className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:text-rose-600"
                              title="Xóa đại biểu"
                              aria-label="Xóa đại biểu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Participant Form */}
              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <User className="h-3.5 w-3.5 text-slate-600" />
                  <span>Thêm người tham gia mới vào cuộc họp</span>
                </span>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Họ và tên đại biểu..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as ParticipantRole)}
                      className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="member">Thành viên</option>
                      <option value="chairperson">Chủ tọa</option>
                      <option value="secretary">Thư ký</option>
                      <option value="scrutineer">Ban kiểm phiếu</option>
                      <option value="guest">Khách mời</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Chức vụ / Chức danh..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      placeholder="Email liên hệ (nếu có)..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {selectedTemplate.type === 'B1_DH_CO_DONG' && (
                    <div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Số cổ phần sở hữu..."
                        value={newShares}
                        onChange={(e) => {
                          const val =
                            e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                          setNewShares(val);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedTemplate.type === 'B3_HD_THANH_VIEN' && (
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Tỷ lệ vốn %..."
                        value={newCapitalRatio}
                        onChange={(e) => {
                          const val =
                            e.target.value === ''
                              ? ''
                              : Math.min(100, Math.max(0, Number(e.target.value)));
                          setNewCapitalRatio(val);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedTemplate.group === 'D' && (
                    <div>
                      <select
                        value={newAffiliation}
                        onChange={(e) => setNewAffiliation(e.target.value as PartyAffiliation)}
                        className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                      >
                        <option value="party_a">Đại diện Bên A</option>
                        <option value="party_b">Đại diện Bên B</option>
                        <option value="internal">Nội bộ / Quan sát</option>
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddParticipant}
                      disabled={!newName.trim()}
                      className="press-subtle w-full cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
                    >
                      + Thêm vào danh sách
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Quay lại</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-all hover:bg-slate-800"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Hoàn tất & Mở phòng ghi trực tiếp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <CreateMeetingModalInner onClose={onClose} />;
};
