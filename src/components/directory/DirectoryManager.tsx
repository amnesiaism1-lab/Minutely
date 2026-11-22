import React, { useState } from 'react';
import { useMeetingContext, recalculateQuorum } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import { getInitials, getAvatarTone, formatParticipantRole } from '../../utils/uiHelpers';
import {
  DirectoryMember,
  DirectoryMemberType,
  MeetingMode,
  MemberGroup,
  ParticipantRole,
  VenuePreset,
} from '../../types';
import {
  Users,
  Layers,
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Play,
  Check,
  X,
  Eraser,
  Star,
  MapPin,
  Briefcase,
  Mail,
  Video,
  Save,
} from 'lucide-react';

type SubTab = 'members' | 'groups' | 'organization';

const MEMBER_TYPE_META: Record<
  DirectoryMemberType,
  { label: string; badgeClass: string }
> = {
  internal: {
    label: 'Nhân sự nội bộ',
    badgeClass: 'border border-sky-200 bg-sky-50 text-sky-900',
  },
  board: {
    label: 'Thành viên HĐQT / Ban ĐH',
    badgeClass: 'border border-blue-200 bg-blue-50 text-blue-900',
  },
  shareholder: {
    label: 'Cổ đông / Góp vốn',
    badgeClass: 'border border-indigo-200 bg-indigo-50 text-indigo-900',
  },
  external: {
    label: 'Đối tác / Khách mời',
    badgeClass: 'border border-amber-200 bg-amber-50 text-amber-900',
  },
};

export const DirectoryManager: React.FC = () => {
  const {
    workspaceSettings,
    directoryMembers,
    memberGroups,
    updateWorkspaceSettings,
    upsertDirectoryMember,
    deleteDirectoryMember,
    upsertMemberGroup,
    deleteMemberGroup,
    clearSampleDirectory,
    buildParticipantsFromGroup,
    createMeeting,
    setCurrentMeetingId,
    setActiveTab,
  } = useMeetingContext();
  const { toast } = useToast();

  const [subTab, setSubTab] = useState<SubTab>('members');

  // --- TAB 1: MEMBERS STATE ---
  const [memberSearch, setMemberSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState<'ALL' | DirectoryMemberType>('ALL');
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [mName, setMName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mDepartment, setMDepartment] = useState('');
  const [mOrgName, setMOrgName] = useState('');
  const [mType, setMType] = useState<DirectoryMemberType>('internal');
  const [mRole, setMRole] = useState<ParticipantRole>('member');
  const [mShares, setMShares] = useState<number | ''>('');
  const [mCapital, setMCapital] = useState<number | ''>('');

  // --- TAB 2: GROUPS STATE ---
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gTemplateId, setGTemplateId] = useState('tpl-a1');
  const [gVenue, setGVenue] = useState('');
  const [gMemberIds, setGMemberIds] = useState<string[]>([]);
  const [gChairId, setGChairId] = useState('');
  const [gSecId, setGSecId] = useState('');
  const [gAgendasText, setGAgendasText] = useState('');

  // --- TAB 3: ORG SETTINGS STATE ---
  const [orgName, setOrgName] = useState(workspaceSettings.orgName);
  const [governingBody, setGoverningBody] = useState(workspaceSettings.governingBody || '');
  const [enterpriseCode, setEnterpriseCode] = useState(workspaceSettings.enterpriseCode || '');
  const [address, setAddress] = useState(workspaceSettings.address || '');
  const [defaultCity, setDefaultCity] = useState(workspaceSettings.defaultCity || 'Hà Nội');
  const [defaultSecId, setDefaultSecId] = useState(workspaceSettings.defaultSecretaryId || '');
  const [distAction, setDistAction] = useState(
    workspaceSettings.defaultDistributionAction.join(', ')
  );
  const [distInfo, setDistInfo] = useState(workspaceSettings.defaultDistributionInfo.join(', '));
  const [newDept, setNewDept] = useState('');
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueMode, setNewVenueMode] = useState<MeetingMode>('offline');
  const [newVenueUrl, setNewVenueUrl] = useState('');

  const hasSamples =
    directoryMembers.some((m) => m.isSample) || memberGroups.some((g) => g.isSample);

  // --- HANDLERS: MEMBERS ---
  const openCreateMember = () => {
    setEditingMemberId(null);
    setMName('');
    setMEmail('');
    setMTitle('Chuyên viên / Thành viên');
    setMDepartment(workspaceSettings.departments[0] || '');
    setMOrgName('');
    setMType('internal');
    setMRole('member');
    setMShares('');
    setMCapital('');
    setIsMemberFormOpen(true);
  };

  const openEditMember = (m: DirectoryMember) => {
    setEditingMemberId(m.id);
    setMName(m.name);
    setMEmail(m.email);
    setMTitle(m.title);
    setMDepartment(m.department || '');
    setMOrgName(m.organizationName || '');
    setMType(m.memberType);
    setMRole(m.defaultRole);
    setMShares(m.sharesCount ?? '');
    setMCapital(m.capitalRatio ?? '');
    setIsMemberFormOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) {
      toast.warning('Vui lòng nhập họ và tên nhân sự / đại biểu');
      return;
    }

    const payload: DirectoryMember = {
      id: editingMemberId || `dir-${Date.now()}`,
      name: mName.trim(),
      email: mEmail.trim(),
      title: mTitle.trim() || 'Thành viên',
      department: mDepartment.trim() || undefined,
      organizationName: mOrgName.trim() || undefined,
      memberType: mType,
      defaultRole: mRole,
      sharesCount: typeof mShares === 'number' && mShares > 0 ? mShares : undefined,
      capitalRatio: typeof mCapital === 'number' && mCapital > 0 ? mCapital : undefined,
      isSample: false,
    };

    upsertDirectoryMember(payload);
    toast.success(
      editingMemberId ? 'Đã cập nhật hồ sơ nhân sự' : 'Đã thêm vào Danh bạ đơn vị',
      payload.name
    );
    setIsMemberFormOpen(false);
  };

  // --- HANDLERS: GROUPS ---
  const openCreateGroup = () => {
    setEditingGroupId(null);
    setGName('');
    setGDesc('');
    setGTemplateId('tpl-a1');
    setGVenue(workspaceSettings.venues[0]?.name || 'Phòng họp chính');
    const initialIds = directoryMembers.slice(0, 3).map((m) => m.id);
    setGMemberIds(initialIds);
    setGChairId(initialIds[0] || '');
    setGSecId(workspaceSettings.defaultSecretaryId || initialIds[1] || '');
    setGAgendasText('Rà soát tiến độ kỳ trước\nThảo luận nội dung trọng tâm kỳ này');
    setIsGroupFormOpen(true);
  };

  const openEditGroup = (g: MemberGroup) => {
    setEditingGroupId(g.id);
    setGName(g.name);
    setGDesc(g.description || '');
    setGTemplateId(g.defaultTemplateId || 'tpl-a1');
    setGVenue(g.defaultVenue || '');
    setGMemberIds(g.memberIds);
    setGChairId(g.chairpersonId || '');
    setGSecId(g.secretaryId || '');
    setGAgendasText((g.defaultAgendas || []).join('\n'));
    setIsGroupFormOpen(true);
  };

  const handleToggleGroupMember = (id: string) => {
    setGMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) {
      toast.warning('Vui lòng nhập tên Nhóm họp nhanh');
      return;
    }
    if (gMemberIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 thành viên trong nhóm');
      return;
    }

    const agendas = gAgendasText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: MemberGroup = {
      id: editingGroupId || `grp-${Date.now()}`,
      name: gName.trim(),
      description: gDesc.trim() || undefined,
      defaultTemplateId: gTemplateId,
      defaultVenue: gVenue.trim() || undefined,
      memberIds: gMemberIds,
      chairpersonId: gChairId && gMemberIds.includes(gChairId) ? gChairId : gMemberIds[0],
      secretaryId: gSecId && gMemberIds.includes(gSecId) ? gSecId : undefined,
      defaultAgendas: agendas,
      isSample: false,
    };

    upsertMemberGroup(payload);
    toast.success(
      editingGroupId ? 'Đã cập nhật Nhóm họp nhanh' : 'Đã tạo Nhóm họp mới',
      payload.name
    );
    setIsGroupFormOpen(false);
  };

  const handleLaunchGroupMeeting = (grp: MemberGroup) => {
    const tpl =
      TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId) || TEMPLATE_DEFINITIONS[0];
    const participants = buildParticipantsFromGroup(grp.id);
    const matchedVenue = workspaceSettings.venues.find((v) => v.name === grp.defaultVenue);

    const nowTs = Date.now();
    const customAgendas =
      grp.defaultAgendas && grp.defaultAgendas.length > 0
        ? grp.defaultAgendas.map((title, idx) => {
            const agId = `ag-${nowTs}-${idx + 1}`;
            return {
              id: agId,
              order: idx + 1,
              title,
              description: 'Trình bày báo cáo, thảo luận và thống nhất kết luận.',
              durationMinutes: 25,
              opinions: [],
              decision: {
                id: `dec-${nowTs}-${idx + 1}`,
                agendaItemId: agId,
                content: '',
                status: 'agreed' as const,
                thresholdPercent: tpl.defaultQuorum || 50,
              },
              actionItems: [],
            };
          })
        : undefined;

    const mockMtgForQuorum: any = {
      group: tpl.group,
      type: tpl.type,
      quorum: tpl.defaultQuorum
        ? {
            requiredPercentage: tpl.defaultQuorum,
            actualPercentage: 100,
            isMet: true,
            totalCapitalOrShares: 0,
            presentCapitalOrShares: 0,
          }
        : undefined,
    };

    const newMtg = createMeeting(
      {
        title: `${grp.name} - ${new Date().toLocaleDateString('vi-VN')}`,
        templateId: tpl.id,
        group: tpl.group,
        type: tpl.type,
        typeName: tpl.name,
        venue: grp.defaultVenue || matchedVenue?.name || workspaceSettings.venues[0]?.name || 'Phòng họp chính',
        meetingMode: matchedVenue?.mode || 'offline',
        meetingUrl: matchedVenue?.url || '',
        participants,
        quorum: tpl.group === 'B' ? recalculateQuorum(mockMtgForQuorum, participants) : undefined,
        agendaItems: customAgendas,
      },
      tpl.group !== 'B'
    );
    setCurrentMeetingId(newMtg.id);
    setActiveTab('live');
  };

  // --- HANDLERS: ORGANIZATION SETTINGS ---
  const handleSaveOrgProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.warning('Tên Cơ quan / Doanh nghiệp không được để trống');
      return;
    }
    updateWorkspaceSettings({
      orgName: orgName.trim(),
      governingBody: governingBody.trim(),
      enterpriseCode: enterpriseCode.trim(),
      address: address.trim(),
      defaultCity: defaultCity.trim() || 'Hà Nội',
      defaultSecretaryId: defaultSecId || undefined,
      defaultDistributionAction: distAction
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      defaultDistributionInfo: distInfo
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    toast.success('Đã lưu Hồ sơ Pháp nhân & Cấu hình mặc định', 'Tự động áp dụng cho các biên bản mới.');
  };

  const handleAddDepartment = () => {
    if (!newDept.trim()) return;
    if (workspaceSettings.departments.includes(newDept.trim())) {
      setNewDept('');
      return;
    }
    updateWorkspaceSettings({
      departments: [...workspaceSettings.departments, newDept.trim()],
    });
    setNewDept('');
  };

  const handleRemoveDepartment = (dept: string) => {
    updateWorkspaceSettings({
      departments: workspaceSettings.departments.filter((d) => d !== dept),
    });
  };

  const handleAddVenue = () => {
    if (!newVenueName.trim()) return;
    const preset: VenuePreset = {
      id: `ven-${Date.now()}`,
      name: newVenueName.trim(),
      mode: newVenueMode,
      url: newVenueUrl.trim() || undefined,
    };
    updateWorkspaceSettings({
      venues: [...workspaceSettings.venues, preset],
    });
    setNewVenueName('');
    setNewVenueUrl('');
    toast.success('Đã thêm địa điểm phòng họp', preset.name);
  };

  const handleRemoveVenue = (id: string) => {
    updateWorkspaceSettings({
      venues: workspaceSettings.venues.filter((v) => v.id !== id),
    });
  };

  const filteredMembers = directoryMembers.filter((m) => {
    if (memberTypeFilter !== 'ALL' && m.memberType !== memberTypeFilter) return false;
    if (memberSearch.trim()) {
      const q = removeVietnameseDiacritics(memberSearch);
      return (
        removeVietnameseDiacritics(m.name).includes(q) ||
        removeVietnameseDiacritics(m.title).includes(q) ||
        removeVietnameseDiacritics(m.email).includes(q) ||
        (m.department && removeVietnameseDiacritics(m.department).includes(q)) ||
        (m.organizationName && removeVietnameseDiacritics(m.organizationName).includes(q))
      );
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 p-5 sm:p-7 lg:p-8">
      {/* Executive Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">
            Danh bạ Nhân sự & Cấu hình Đơn vị
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Quản lý tập trung nhân sự, cổ đông, nhóm họp thường kỳ và pháp nhân đơn vị. Mọi biên bản
            mới sẽ kế thừa tự động mà không cần nhập lại hay dùng danh sách tĩnh cố định.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {hasSamples && (
            <button
              type="button"
              onClick={clearSampleDirectory}
              className="press-subtle inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 text-[13px] font-semibold text-amber-950 transition-colors hover:bg-amber-100"
              title="Xóa toàn bộ nhân sự và nhóm họp mẫu để chỉ giữ dữ liệu thực của công ty bạn"
            >
              <Eraser className="h-4 w-4 text-amber-700" />
              <span>Xóa nhân sự mẫu</span>
            </button>
          )}

          {subTab === 'members' && (
            <button
              type="button"
              onClick={openCreateMember}
              className="press-subtle inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm nhân sự / đại biểu</span>
            </button>
          )}

          {subTab === 'groups' && (
            <button
              type="button"
              onClick={openCreateGroup}
              className="press-subtle inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo nhóm họp nhanh</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Navigation Bar (Google M3 / Linear Tabs) */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-1.5 shadow-2xs">
        {[
          {
            id: 'members' as const,
            label: 'Danh bạ Nhân sự & Đối tác',
            count: directoryMembers.length,
            icon: Users,
          },
          {
            id: 'groups' as const,
            label: 'Nhóm Họp Nhanh (1 chạm)',
            count: memberGroups.length,
            icon: Layers,
          },
          {
            id: 'organization' as const,
            label: 'Hồ sơ Pháp nhân & Phòng họp',
            count: undefined,
            icon: Building2,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`press-subtle flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-[13.5px] transition-all ${
                active
                  ? 'bg-[var(--brand-container)] font-semibold text-[var(--on-brand-container)]'
                  : 'font-medium text-slate-600 hover:bg-[var(--surface-well)] hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-[#1d4ed8]' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    active ? 'bg-white text-[#0b3d91]' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: DIRECTORY MEMBERS ================= */}
      {subTab === 'members' && (
        <div className="space-y-5">
          {/* Inline Member Create/Edit Card */}
          {isMemberFormOpen && (
            <form
              onSubmit={handleSaveMember}
              className="space-y-4 rounded-2xl border border-blue-200 bg-[var(--surface-panel)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[15px] font-bold text-slate-900">
                  {editingMemberId ? 'Cập nhật thông tin nhân sự / đại biểu' : 'Thêm nhân sự · cổ đông · đối tác mới'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMemberFormOpen(false)}
                  className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Chức danh / Chức vụ *</label>
                  <input
                    type="text"
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="Trưởng phòng Kỹ thuật..."
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email (để lọc Việc của tôi)</label>
                  <input
                    type="email"
                    value={mEmail}
                    onChange={(e) => setMEmail(e.target.value)}
                    placeholder="ten@congty.vn"
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phòng ban / Bộ phận</label>
                  <input
                    type="text"
                    list="dept-suggestions"
                    value={mDepartment}
                    onChange={(e) => setMDepartment(e.target.value)}
                    placeholder="Ban Điều hành..."
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                  <datalist id="dept-suggestions">
                    {workspaceSettings.departments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phân nhóm danh bạ</label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value as DirectoryMemberType)}
                    className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  >
                    <option value="internal">Nhân sự nội bộ</option>
                    <option value="board">Thành viên HĐQT / Ban ĐH</option>
                    <option value="shareholder">Cổ đông / Thành viên góp vốn</option>
                    <option value="external">Đối tác / Khách mời ngoài</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Vai trò họp mặc định</label>
                  <select
                    value={mRole}
                    onChange={(e) => setMRole(e.target.value as ParticipantRole)}
                    className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  >
                    <option value="member">Thành viên</option>
                    <option value="chairperson">Chủ tọa</option>
                    <option value="secretary">Thư ký ghi biên bản</option>
                    <option value="scrutineer">Ban kiểm phiếu</option>
                    <option value="guest">Khách mời</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Số cổ phần (ĐHĐCĐ) / Tên công ty đối tác
                  </label>
                  {mType === 'external' ? (
                    <input
                      type="text"
                      value={mOrgName}
                      onChange={(e) => setMOrgName(e.target.value)}
                      placeholder="Tên công ty đối tác (Bên B)"
                      className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                    />
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={mShares}
                      onChange={(e) =>
                        setMShares(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="Số cổ phần (nếu có)"
                      className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Tỷ lệ vốn góp % (HĐTV)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={mCapital}
                    onChange={(e) =>
                      setMCapital(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Ví dụ: 30"
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMemberFormOpen(false)}
                  className="cursor-pointer rounded-xl px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#1e40af]"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingMemberId ? 'Lưu cập nhật' : 'Lưu vào Danh bạ'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-2xs md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL' as const, label: 'Tất cả' },
                { id: 'internal' as const, label: 'Nội bộ' },
                { id: 'board' as const, label: 'HĐQT & Lãnh đạo' },
                { id: 'shareholder' as const, label: 'Cổ đông / Góp vốn' },
                { id: 'external' as const, label: 'Đối tác ngoài' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMemberTypeFilter(f.id)}
                  className={`cursor-pointer rounded-full border px-3.5 py-1 text-[12.5px] font-medium transition-colors ${
                    memberTypeFilter === f.id
                      ? 'border-[#1d4ed8] bg-[#1d4ed8] font-semibold text-white'
                      : 'border-slate-200 bg-[var(--surface-well)] text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm tên, chức vụ, phòng ban, email…"
                className="h-9.5 w-full rounded-xl border border-slate-300/85 bg-[var(--surface-well)] pl-9.5 pr-3 text-[13px] text-slate-900 placeholder-slate-500 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Members Divided List */}
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs">
            {filteredMembers.length === 0 ? (
              <div className="space-y-3 p-10 text-center">
                <p className="text-[14px] font-medium text-slate-600">
                  Chưa có nhân sự / đại biểu nào khớp điều kiện tìm kiếm.
                </p>
                <button
                  type="button"
                  onClick={openCreateMember}
                  className="cursor-pointer rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1e40af]"
                >
                  + Thêm nhân sự đầu tiên
                </button>
              </div>
            ) : (
              filteredMembers.map((m) => {
                const typeMeta = MEMBER_TYPE_META[m.memberType] || MEMBER_TYPE_META.internal;
                const isDefaultSec = workspaceSettings.defaultSecretaryId === m.id;
                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-well)]/75 md:flex-row md:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${getAvatarTone(
                          m.name
                        )}`}
                      >
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold text-slate-900">{m.name}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${typeMeta.badgeClass}`}
                          >
                            {typeMeta.label}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11.5px] font-medium text-slate-700">
                            Mặc định: {formatParticipantRole(m.defaultRole)}
                          </span>
                          {isDefaultSec && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-emerald-900">
                              <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                              Thư ký mặc định
                            </span>
                          )}
                          {m.isSample && (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                              Mẫu thử
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                            {m.title}
                            {m.department ? ` · ${m.department}` : ''}
                            {m.organizationName ? ` (${m.organizationName})` : ''}
                          </span>
                          {m.email && (
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-500" />
                              {m.email}
                            </span>
                          )}
                          {(m.sharesCount || m.capitalRatio) && (
                            <span className="font-mono text-xs font-semibold tabular-nums text-[#0b3d91]">
                              {m.sharesCount
                                ? `${m.sharesCount.toLocaleString('vi-VN')} cổ phần`
                                : ''}
                              {m.sharesCount && m.capitalRatio ? ' · ' : ''}
                              {m.capitalRatio ? `${m.capitalRatio}% vốn góp` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          updateWorkspaceSettings({
                            defaultSecretaryId: isDefaultSec ? undefined : m.id,
                          });
                          toast.info(
                            isDefaultSec
                              ? 'Đã bỏ gán Thư ký mặc định'
                              : `Đã chọn ${m.name} làm Thư ký mặc định cho các biên bản mới`
                          );
                        }}
                        className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isDefaultSec
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                        title="Tự động điền làm Thư ký ghi biên bản khi khởi tạo cuộc họp mới"
                      >
                        {isDefaultSec ? 'Đang là Thư ký mặc định' : 'Đặt làm Thư ký'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditMember(m)}
                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          deleteDirectoryMember(m.id);
                          toast.info(`Đã xóa ${m.name} khỏi Danh bạ`);
                        }}
                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        title="Xóa khỏi Danh bạ (các biên bản cũ đã lập vẫn giữ nguyên lịch sử)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MEMBER GROUPS (ROSTER PRESETS) ================= */}
      {subTab === 'groups' && (
        <div className="space-y-5">
          {isGroupFormOpen && (
            <form
              onSubmit={handleSaveGroup}
              className="space-y-4 rounded-2xl border border-blue-200 bg-[var(--surface-panel)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-[15px] font-bold text-slate-900">
                  {editingGroupId ? 'Chỉnh sửa Nhóm họp nhanh' : 'Thiết lập Nhóm thành phần họp thường kỳ'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsGroupFormOpen(false)}
                  className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tên nhóm họp *</label>
                  <input
                    type="text"
                    required
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    placeholder="Ví dụ: Giao ban Ban Giám đốc sáng Thứ Hai"
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Biểu mẫu gắn kèm</label>
                  <select
                    value={gTemplateId}
                    onChange={(e) => setGTemplateId(e.target.value)}
                    className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  >
                    {TEMPLATE_DEFINITIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        [Nhóm {t.group}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phòng họp mặc định</label>
                  <input
                    type="text"
                    list="venue-suggestions"
                    value={gVenue}
                    onChange={(e) => setGVenue(e.target.value)}
                    placeholder="Phòng họp Hội đồng..."
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                  <datalist id="venue-suggestions">
                    {workspaceSettings.venues.map((v) => (
                      <option key={v.id} value={v.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Chọn thành viên tham gia từ Danh bạ ({gMemberIds.length} người đã chọn)
                </label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-[var(--surface-well)] p-3">
                  {directoryMembers.map((dm) => {
                    const checked = gMemberIds.includes(dm.id);
                    return (
                      <button
                        key={dm.id}
                        type="button"
                        onClick={() => handleToggleGroupMember(dm.id)}
                        className={`cursor-pointer rounded-xl border px-3 py-1.5 text-left text-[12.5px] transition-all ${
                          checked
                            ? 'border-[#1d4ed8] bg-blue-50 font-semibold text-[#0b3d91] shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {checked ? '✓ ' : '+ '}
                        {dm.name} <span className="text-[11px] opacity-75">({dm.title})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Chủ tọa mặc định của nhóm</label>
                  <select
                    value={gChairId}
                    onChange={(e) => setGChairId(e.target.value)}
                    className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Chọn từ thành viên nhóm --</option>
                    {directoryMembers
                      .filter((m) => gMemberIds.includes(m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.title})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Thư ký mặc định của nhóm</label>
                  <select
                    value={gSecId}
                    onChange={(e) => setGSecId(e.target.value)}
                    className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Không cố định --</option>
                    {directoryMembers
                      .filter((m) => gMemberIds.includes(m.id))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.title})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Mô tả ngắn</label>
                  <input
                    type="text"
                    value={gDesc}
                    onChange={(e) => setGDesc(e.target.value)}
                    placeholder="Ghi chú mục đích nhóm họp..."
                    className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Khung chương trình nghị sự thường kỳ (mỗi dòng 1 mục — tự tạo sẵn khi mở họp)
                </label>
                <textarea
                  rows={3}
                  value={gAgendasText}
                  onChange={(e) => setGAgendasText(e.target.value)}
                  placeholder="Mỗi dòng là một mục thảo luận..."
                  className="w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] p-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsGroupFormOpen(false)}
                  className="cursor-pointer rounded-xl px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#1e40af]"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingGroupId ? 'Lưu nhóm họp' : 'Tạo nhóm họp'}</span>
                </button>
              </div>
            </form>
          )}

          {memberGroups.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-12 text-center shadow-2xs">
              <p className="text-[14px] font-medium text-slate-600">
                Chưa có Nhóm họp nhanh nào. Hãy gom các thành phần hay họp chung (Ban Giám đốc, HĐQT,
                Dự án…) để lập biên bản 1 chạm!
              </p>
              <button
                type="button"
                onClick={openCreateGroup}
                className="cursor-pointer rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#1e40af]"
              >
                + Tạo nhóm họp đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {memberGroups.map((grp) => {
                const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId);
                const resolvedMembers = grp.memberIds
                  .map((id) => directoryMembers.find((m) => m.id === id))
                  .filter(Boolean) as DirectoryMember[];

                return (
                  <div
                    key={grp.id}
                    className="flex flex-col justify-between space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[16px] font-bold text-slate-900">{grp.name}</h3>
                            {tpl && (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-blue-900">
                                Nhóm {tpl.group} · {tpl.name}
                              </span>
                            )}
                            {grp.isSample && (
                              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                Mẫu
                              </span>
                            )}
                          </div>
                          {grp.description && (
                            <p className="mt-1 text-[13px] text-slate-600">{grp.description}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditGroup(grp)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Sửa nhóm họp"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteMemberGroup(grp.id);
                              toast.info(`Đã xóa nhóm "${grp.name}"`);
                            }}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            title="Xóa nhóm họp"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Members Preview */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {resolvedMembers.map((rm) => {
                          const isChair = grp.chairpersonId === rm.id;
                          const isSec = grp.secretaryId === rm.id;
                          return (
                            <span
                              key={rm.id}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                isChair
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                  : isSec
                                  ? 'border-sky-200 bg-sky-50 text-sky-900'
                                  : 'border-slate-200 bg-[var(--surface-well)] text-slate-700'
                              }`}
                            >
                              <span>{rm.name}</span>
                              {isChair && <strong className="text-[10.5px]">(Chủ tọa)</strong>}
                              {isSec && <strong className="text-[10.5px]">(Thư ký)</strong>}
                            </span>
                          );
                        })}
                      </div>

                      {grp.defaultAgendas && grp.defaultAgendas.length > 0 && (
                        <div className="rounded-xl border border-slate-100 bg-[var(--surface-well)] px-3.5 py-2.5 text-[12.5px] text-slate-600">
                          <p className="mb-1 font-semibold text-slate-800">
                            Nghị sự dựng sẵn ({grp.defaultAgendas.length} mục):
                          </p>
                          <ul className="list-inside list-disc space-y-0.5">
                            {grp.defaultAgendas.slice(0, 3).map((ag, idx) => (
                              <li key={idx} className="truncate">
                                {ag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        {grp.defaultVenue || 'Phòng họp mặc định'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleLaunchGroupMeeting(grp)}
                        className="press-subtle inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 text-[13px] font-semibold text-white shadow-2xs transition-colors hover:bg-[#1e40af]"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Lập biên bản nhóm này</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: WORKSPACE / ORGANIZATION SETTINGS ================= */}
      {subTab === 'organization' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Legal Entity Form */}
          <form
            onSubmit={handleSaveOrgProfile}
            className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-2xs lg:col-span-7"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-[16px] font-bold text-slate-900">
                Hồ sơ Pháp nhân Cơ quan / Doanh nghiệp
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-600">
                Thông tin này tự động in lên phần tiêu đề trái chuẩn Nghị định 30/2020/NĐ-CP và đóng
                băng theo từng biên bản tại thời điểm họp.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Tên Cơ quan / Doanh nghiệp (in hoa chuẩn NĐ 30) *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="VD: CÔNG TY CỔ PHẦN..."
                  className="h-10 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3.5 text-[14px] font-semibold text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Cơ quan chủ quản cấp trên (nếu có)
                </label>
                <input
                  type="text"
                  value={governingBody}
                  onChange={(e) => setGoverningBody(e.target.value)}
                  placeholder="Để trống nếu là doanh nghiệp độc lập"
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mã số doanh nghiệp (MSDN)
                </label>
                <input
                  type="text"
                  value={enterpriseCode}
                  onChange={(e) => setEnterpriseCode(e.target.value)}
                  placeholder="010xxxxxxx"
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 font-mono text-[13.5px] tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Địa danh hành chính mặc định (dòng ngày tháng)
                </label>
                <input
                  type="text"
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  placeholder="Hà Nội, TP. Hồ Chí Minh..."
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Thư ký ghi biên bản mặc định
                </label>
                <select
                  value={defaultSecId}
                  onChange={(e) => setDefaultSecId(e.target.value)}
                  className="h-9.5 w-full cursor-pointer rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                >
                  <option value="">-- Không gán sẵn (tự chọn từng cuộc họp) --</option>
                  {directoryMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Địa chỉ trụ sở chính</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, tòa nhà, quận/huyện, tỉnh/thành phố..."
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Nơi nhận mặc định — Để thực hiện (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={distAction}
                  onChange={(e) => setDistAction(e.target.value)}
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Nơi nhận mặc định — Để biết / Lưu văn thư (ngăn cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={distInfo}
                  onChange={(e) => setDistInfo(e.target.value)}
                  className="h-9.5 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13.5px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="press-subtle inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 text-[13.5px] font-semibold text-white shadow-xs hover:bg-[#1e40af]"
              >
                <Save className="h-4 w-4" />
                <span>Lưu hồ sơ pháp nhân</span>
              </button>
            </div>
          </form>

          {/* Right 5 Cols: Departments & Meeting Venues */}
          <div className="space-y-6 lg:col-span-5">
            {/* Venues Card */}
            <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">
                  Danh mục Phòng họp & Link Trực tuyến
                </h3>
                <p className="mt-0.5 text-[12.5px] text-slate-600">
                  Chọn nhanh 1 chạm khi tạo biên bản thay vì phải gõ lại địa điểm.
                </p>
              </div>

              <div className="space-y-2">
                {workspaceSettings.venues.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-[var(--surface-well)] px-3.5 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        {v.mode === 'online' ? (
                          <Video className="h-3.5 w-3.5 text-[#1d4ed8]" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        <span className="truncate">{v.name}</span>
                      </div>
                      {v.url && (
                        <p className="truncate text-[11.5px] text-slate-600">{v.url}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVenue(v.id)}
                      className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa phòng họp"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="Tên phòng họp mới..."
                    className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                  <select
                    value={newVenueMode}
                    onChange={(e) => setNewVenueMode(e.target.value as MeetingMode)}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-[12.5px] text-slate-800"
                  >
                    <option value="offline">Trực tiếp</option>
                    <option value="online">Trực tuyến</option>
                    <option value="hybrid">Kết hợp</option>
                  </select>
                </div>
                {newVenueMode !== 'offline' && (
                  <input
                    type="url"
                    value={newVenueUrl}
                    onChange={(e) => setNewVenueUrl(e.target.value)}
                    placeholder="Link Google Meet / Zoom cố định..."
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[12.5px] text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                )}
                <button
                  type="button"
                  onClick={handleAddVenue}
                  disabled={!newVenueName.trim()}
                  className="inline-flex h-8.5 w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm phòng họp</span>
                </button>
              </div>
            </div>

            {/* Departments Card */}
            <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Danh mục Phòng ban / Đơn vị</h3>
                <p className="mt-0.5 text-[12.5px] text-slate-600">
                  Dùng để gợi ý nhanh đơn vị chủ trì và phòng ban của nhân sự.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {workspaceSettings.departments.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[var(--surface-well)] px-3 py-1 text-[12.5px] font-medium text-slate-800"
                  >
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(d)}
                      className="cursor-pointer text-slate-400 hover:text-rose-600"
                      aria-label={`Xóa ${d}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDepartment();
                    }
                  }}
                  placeholder="Thêm phòng ban mới..."
                  className="h-9 flex-1 rounded-xl border border-slate-300 bg-[var(--surface-well)] px-3 text-[13px] text-slate-900 focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddDepartment}
                  disabled={!newDept.trim()}
                  className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
