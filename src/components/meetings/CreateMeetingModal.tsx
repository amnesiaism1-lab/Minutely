import React, { useState, useEffect } from 'react';
import { useMeetingContext, recalculateQuorum } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import {
  TemplateDefinition,
  MeetingGroup,
  MeetingMode,
  Participant,
  ParticipantRole,
  PartyAffiliation,
  AttendanceStatus,
} from '../../types';
import {
  PlusCircle,
  X,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  Users,
  Scale,
  Sparkles,
  Trash2,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { createMeeting, setCurrentMeetingId, setActiveTab, currentUser } = useMeetingContext();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(
    TEMPLATE_DEFINITIONS[0]
  );
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

  // Dynamic Participants State
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

  // Form input for adding a new participant
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Thành viên tham dự');
  const [newDept, setNewDept] = useState('');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');

  // Pre-populate realistic attendees when template changes
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
            title: 'Chủ tịch HĐQT',
            status: 'present',
            sharesCount: 15000000,
            votingPower: 15000000,
          },
          {
            id: `p-${Date.now()}-2`,
            name: 'Trần Thị Thu Hà',
            email: 'ha.tran@vinacorp.vn',
            role: 'secretary',
            title: 'Thư ký HĐQT',
            status: 'present',
            sharesCount: 200000,
            votingPower: 200000,
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
            capitalRatio: 5,
          },
          {
            id: `p-${Date.now()}-3`,
            name: 'Nguyễn Tiến Dũng',
            email: 'dung.nguyen@vinacorp.vn',
            role: 'member',
            title: 'Thành viên góp vốn',
            status: 'present',
            capitalRatio: 30,
          },
          {
            id: `p-${Date.now()}-4`,
            name: 'Phạm Thanh Hương',
            email: 'huong.pham@invest.vn',
            role: 'member',
            title: 'Thành viên góp vốn',
            status: 'present',
            capitalRatio: 20,
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
          title: 'Đại diện Bên A - Giám đốc Đối tác',
          affiliation: 'party_a',
          status: 'present',
        },
        {
          id: `p-${Date.now()}-2`,
          name: 'Trần Thị Thu Hà',
          email: 'ha.tran@vinacorp.vn',
          role: 'secretary',
          title: 'Thư ký cuộc họp Bên A',
          affiliation: 'party_a',
          status: 'present',
        },
        {
          id: `p-${Date.now()}-3`,
          name: 'David Johnson',
          email: 'david.j@partnercorp.global',
          role: 'member',
          title: 'Đại diện Bên B - Phó Chủ tịch Khu vực APAC',
          affiliation: 'party_b',
          organizationName: 'Global Cloud Solutions Pte Ltd',
          status: 'present',
        },
        {
          id: `p-${Date.now()}-4`,
          name: 'Nguyễn Minh Trang',
          email: 'trang.nguyen@partnercorp.global',
          role: 'member',
          title: 'Cố vấn Pháp lý Bên B',
          affiliation: 'party_b',
          organizationName: 'Global Cloud Solutions Pte Ltd',
          status: 'present',
        },
      ]);
    }
  };

  const handleAddParticipant = () => {
    if (!newName.trim()) return;

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      role: newRole,
      title: newTitle.trim() || 'Thành viên tham dự',
      department: newDept.trim() || undefined,
      affiliation: selectedTemplate.group === 'D' ? newAffiliation : 'internal',
      status: 'present',
      sharesCount: typeof newShares === 'number' ? newShares : undefined,
      capitalRatio: typeof newCapitalRatio === 'number' ? newCapitalRatio : undefined,
      votingPower: newRole === 'guest' ? 0 : 1,
    };

    setParticipants([...participants, newP]);
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
      participants.map((p) => (p.id === id ? { ...p, status, delegatedTo: delegatedTo ?? p.delegatedTo } : p))
    );
  };

  // Quorum calculation helper for the modal preview
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

    const hasChair = participants.some((p) => p.role === 'chairperson');
    const hasSec = participants.some((p) => p.role === 'secretary');

    if (!hasChair) {
      alert('Vui lòng chỉ định ít nhất một người giữ vai trò Chủ tọa cuộc họp!');
      setActiveStep(3);
      return;
    }

    if (['B', 'D'].includes(selectedTemplate.group) && !hasSec) {
      alert('Cuộc họp pháp lý / đối ngoại bắt buộc phải có ít nhất một Thư ký ghi biên bản!');
      setActiveStep(3);
      return;
    }

    const chairPerson = participants.find((p) => p.role === 'chairperson') || participants[0];
    const secretaryPerson = participants.find((p) => p.role === 'secretary') || participants[1] || chairPerson;

    const newMeeting = createMeeting({
      title: title.trim() || `${selectedTemplate.name} - ${date}`,
      code: code.trim(),
      templateId: selectedTemplate.id,
      group: selectedTemplate.group,
      type: selectedTemplate.type,
      typeName: selectedTemplate.name,
      organization: {
        name: orgName,
        department,
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
    });

    setCurrentMeetingId(newMeeting.id);
    setActiveTab('live');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-white animate-in zoom-in-95 overflow-hidden">
        {/* Header with Step Tracker */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Khởi Tạo Cuộc Họp Mới</h2>
              <p className="text-[11px] text-slate-400">Thiết lập mẫu nghiệp vụ, túc số và thành phần tham gia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Navigation Pills */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
              activeStep === 1
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Chọn Biểu Mẫu ({selectedTemplate.group})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
              activeStep === 2
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Thông Tin Cuộc Họp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all cursor-pointer ${
              activeStep === 3
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-slate-900/60 text-[10px] flex items-center justify-center font-bold">3</span>
            <span>Thành Phần Tham Dự ({participants.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: SELECT TEMPLATE */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Thư viện 14 Biểu Mẫu Chuẩn Hóa</h3>
                  <p className="text-xs text-slate-400">Chọn mẫu phù hợp để tự động áp dụng quy tắc pháp lý và khối bắt buộc</p>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  Mẫu đã chọn: {selectedTemplate.name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto p-1.5 border border-slate-800 rounded-xl bg-slate-950/60">
                {TEMPLATE_DEFINITIONS.map((t) => {
                  const isSelected = selectedTemplate.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-md ring-1 ring-indigo-500/50'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-bold text-slate-100 text-[13px]">{t.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${t.badgeColor}`}>
                            Nhóm {t.group}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{t.description}</p>
                      </div>

                      {t.legalBasis && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-amber-300/90 font-mono">
                          <Scale className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{t.legalBasis}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer transition-colors"
                >
                  <span>Tiếp tục bước 2: Thông tin cuộc họp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INFORMATION */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tiêu đề cuộc họp</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Ví dụ: ${selectedTemplate.name}...`}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Số & Ký hiệu biên bản (Nghị định 30)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Organization & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Tên cơ quan / Doanh nghiệp</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Phòng ban / Đơn vị tổ chức</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Ngày họp</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Mode & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Hình thức họp</label>
                  <select
                    value={meetingMode}
                    onChange={(e) => setMeetingMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="offline">Trực tiếp (Tại văn phòng)</option>
                    <option value="online">Trực tuyến (Meet / Zoom)</option>
                    <option value="hybrid">Kết hợp Trực tiếp & Trực tuyến</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Địa điểm / Đường dẫn họp</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Phòng họp Boardroom tầng 18 hoặc link họp..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer transition-colors"
                >
                  <span>Tiếp tục bước 3: Thành phần tham dự</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DYNAMIC PARTICIPANTS & ATTENDANCE */}
          {activeStep === 3 && (
            <div className="space-y-4">
              {/* Quorum status banner */}
              {currentQuorum && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    currentQuorum.isMet
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {currentQuorum.isMet ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        Túc số tham dự: {currentQuorum.actualPercentage}%{' '}
                        {currentQuorum.isMet ? '(Hợp lệ tiến hành họp)' : `(Chưa đạt yêu cầu ${currentQuorum.requiredPercentage}%)`}
                      </span>
                      <p className="text-[11px] opacity-80">
                        {selectedTemplate.group === 'B'
                          ? `Tuân thủ Luật Doanh nghiệp 2020 (${selectedTemplate.legalBasis || 'Quy chuẩn pháp lý'})`
                          : 'Tỷ lệ đại biểu có mặt theo quy chế'}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700">
                    {currentQuorum.actualPercentage}% / {currentQuorum.requiredPercentage}%
                  </span>
                </div>
              )}

              {/* Participant List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Danh Sách Thành Phần Tham Dự ({participants.length} người)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Đã có {participants.filter((p) => p.status === 'present').length} có mặt,{' '}
                    {participants.filter((p) => p.status === 'delegated').length} ủy quyền
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2.5 pl-3">Họ và tên</th>
                        <th className="p-2.5">Vai trò</th>
                        <th className="p-2.5">Trạng thái</th>
                        {selectedTemplate.type === 'B1_DH_CO_DONG' && <th className="p-2.5">Cổ phần</th>}
                        {selectedTemplate.type === 'B3_HD_THANH_VIEN' && <th className="p-2.5">Tỷ lệ vốn (%)</th>}
                        {selectedTemplate.group === 'D' && <th className="p-2.5">Bên đại diện</th>}
                        <th className="p-2.5 text-right pr-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-2.5 pl-3">
                            <div className="font-bold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{p.title}</div>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                p.role === 'chairperson'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : p.role === 'secretary'
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                  : p.role === 'guest'
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {p.role === 'chairperson'
                                ? 'Chủ tọa'
                                : p.role === 'secretary'
                                ? 'Thư ký'
                                : p.role === 'guest'
                                ? 'Khách mời'
                                : 'Thành viên'}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <select
                              value={p.status}
                              onChange={(e) => handleUpdateStatus(p.id, e.target.value as any)}
                              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] focus:outline-none cursor-pointer"
                            >
                              <option value="present">Có mặt</option>
                              <option value="absent_permitted">Vắng có phép</option>
                              <option value="absent_unexcused">Vắng không phép</option>
                              <option value="delegated">Ủy quyền</option>
                              <option value="late">Đến muộn</option>
                            </select>
                            {p.status === 'delegated' && (
                              <input
                                type="text"
                                placeholder="Ủy quyền cho ai..."
                                value={p.delegatedTo || ''}
                                onChange={(e) => handleUpdateStatus(p.id, 'delegated', e.target.value)}
                                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-white"
                              />
                            )}
                          </td>
                          {selectedTemplate.type === 'B1_DH_CO_DONG' && (
                            <td className="p-2.5 font-mono text-[11px] text-indigo-300">
                              {p.sharesCount ? p.sharesCount.toLocaleString() : '-'}
                            </td>
                          )}
                          {selectedTemplate.type === 'B3_HD_THANH_VIEN' && (
                            <td className="p-2.5 font-mono text-[11px] text-emerald-300">
                              {p.capitalRatio ? `${p.capitalRatio}%` : '-'}
                            </td>
                          )}
                          {selectedTemplate.group === 'D' && (
                            <td className="p-2.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  p.affiliation === 'party_a'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : p.affiliation === 'party_b'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {p.affiliation === 'party_a' ? 'Bên A' : p.affiliation === 'party_b' ? 'Bên B' : 'Nội bộ'}
                              </span>
                            </td>
                          )}
                          <td className="p-2.5 text-right pr-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(p.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                              title="Xóa đại biểu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Participant Form */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Thêm người tham gia mới vào cuộc họp</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Họ và tên đại biểu..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="member">Thành viên</option>
                      <option value="chairperson">Chủ tọa</option>
                      <option value="secretary">Thư ký</option>
                      <option value="guest">Khách mời</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Chức vụ / Chức danh..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      placeholder="Email liên hệ (nếu có)..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {selectedTemplate.type === 'B1_DH_CO_DONG' && (
                    <div>
                      <input
                        type="number"
                        placeholder="Số cổ phần sở hữu..."
                        value={newShares}
                        onChange={(e) => setNewShares(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedTemplate.type === 'B3_HD_THANH_VIEN' && (
                    <div>
                      <input
                        type="number"
                        placeholder="Tỷ lệ vốn %..."
                        value={newCapitalRatio}
                        onChange={(e) => setNewCapitalRatio(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {selectedTemplate.group === 'D' && (
                    <div>
                      <select
                        value={newAffiliation}
                        onChange={(e) => setNewAffiliation(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
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
                      className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-colors"
                    >
                      + Thêm vào danh sách
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
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
