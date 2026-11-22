import React, { useState } from 'react';
import { useMeetingContext, recalculateQuorum } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { MeetingGroup, MemberGroup } from '../../types';
import {
  GROUP_META,
  PRIORITY_META,
  MEETING_STATUS_META,
  formatRelativeDeadline,
  getInitials,
  getAvatarTone,
} from '../../utils/uiHelpers';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  PlusCircle,
  FileCheck2,
  Calendar,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Zap,
  Circle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Dashboard: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const {
    meetings,
    setCurrentMeetingId,
    setActiveTab,
    setSelectedStatusFilter,
    setSelectedGroupFilter,
    currentUser,
    createMeeting,
    updateActionItem,
    memberGroups,
    workspaceSettings,
    buildParticipantsFromGroup,
    buildDefaultParticipants,
  } = useMeetingContext();
  const { toast } = useToast();
  const [taskFilter, setTaskFilter] = useState<'all' | 'overdue'>('all');

  const allActions = meetings.flatMap((m) =>
    m.agendaItems.flatMap((i) =>
      i.actionItems.map((a) => ({ ...a, meetingCode: m.code }))
    )
  );
  const pendingMeetings = meetings.filter((m) => m.status === 'pending_review');
  const approvedCount = meetings.filter((m) =>
    ['approved', 'published', 'archived'].includes(m.status)
  ).length;
  const draftMeeting = meetings.find((m) => m.status === 'draft');
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueActions = allActions.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled' && a.deadline < todayStr
  );

  const prioritizedActions = [...allActions].sort((a, b) => {
    const aDone = a.status === 'completed' || a.status === 'cancelled' ? 1 : 0;
    const bDone = b.status === 'completed' || b.status === 'cancelled' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return a.deadline.localeCompare(b.deadline);
  });

  const displayedActions =
    taskFilter === 'overdue' ? overdueActions.slice(0, 5) : prioritizedActions.slice(0, 5);

  const handleLaunchTemplate = (tplId: string) => {
    const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === tplId);
    if (!tpl) return;
    const matchedGroup = memberGroups.find((g) => g.defaultTemplateId === tpl.id);
    if (matchedGroup) {
      handleLaunchGroup(matchedGroup);
      return;
    }
    const defaultParts = buildDefaultParticipants(tpl.group);
    const mockForQuorum: any = {
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
        title: `${tpl.name} - ${new Date().toLocaleDateString('vi-VN')}`,
        templateId: tpl.id,
        group: tpl.group,
        type: tpl.type,
        typeName: tpl.name,
        participants: defaultParts,
        quorum: tpl.group === 'B' ? recalculateQuorum(mockForQuorum, defaultParts) : undefined,
      },
      tpl.group !== 'B'
    );
    setCurrentMeetingId(newMtg.id);
    setActiveTab('live');
  };

  const handleLaunchGroup = (grp: MemberGroup) => {
    const tpl =
      TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId) || TEMPLATE_DEFINITIONS[0];
    const parts = buildParticipantsFromGroup(grp.id);
    const matchedVenue = workspaceSettings.venues.find((v) => v.name === grp.defaultVenue);
    const nowTs = Date.now();
    const customAgendas =
      grp.defaultAgendas && grp.defaultAgendas.length > 0
        ? grp.defaultAgendas.map((agTitle, idx) => {
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
                thresholdPercent: tpl.defaultQuorum || 50,
              },
              actionItems: [],
            };
          })
        : undefined;
    const mockForQuorum: any = {
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
        venue: grp.defaultVenue || matchedVenue?.name || workspaceSettings.venues[0]?.name,
        meetingMode: matchedVenue?.mode || 'offline',
        meetingUrl: matchedVenue?.url || '',
        participants: parts,
        quorum: tpl.group === 'B' ? recalculateQuorum(mockForQuorum, parts) : undefined,
        agendaItems: customAgendas,
      },
      tpl.group !== 'B'
    );
    setCurrentMeetingId(newMtg.id);
    setActiveTab('live');
  };

  const todayFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 p-5 sm:p-7 lg:p-8">
      {/* Executive Header — Apple HIG & Atlassian Clear Hierarchy */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium capitalize text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.85} />
            <span>{todayFormatted}</span>
          </p>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Xin chào, {currentUser.name}
          </h1>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Không gian điều hành biên bản cuộc họp, theo dõi trách nhiệm giải trình và chuẩn hóa
            pháp lý doanh nghiệp.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (draftMeeting) {
                setCurrentMeetingId(draftMeeting.id);
                setActiveTab('live');
              } else if (meetings.length > 0) {
                setCurrentMeetingId(meetings[0].id);
                setActiveTab('live');
              } else {
                onOpenCreateModal();
              }
            }}
            className="press-subtle inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300/90 bg-white px-4 text-[13.5px] font-semibold text-slate-800 shadow-2xs transition-colors hover:border-slate-400 hover:bg-slate-50"
          >
            {draftMeeting && (
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            )}
            <Play className="h-4 w-4 text-[#1d4ed8]" strokeWidth={2} />
            <span>{draftMeeting ? 'Tiếp tục phiên ghi' : 'Phòng ghi trực tiếp'}</span>
          </button>

          {currentUser.role !== 'member' && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="press-subtle inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#1d4ed8] px-4 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={2} />
              <span>Tạo cuộc họp mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Instant Minutes Strip — Dynamic Roster Groups + Quick Templates */}
      {currentUser.role !== 'member' && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-3 shadow-2xs">
          <span className="inline-flex items-center gap-1.5 pr-1.5 text-[12.5px] font-bold text-slate-800">
            <Zap className="h-4 w-4 text-[#1d4ed8]" strokeWidth={2} />
            Lập biên bản 1 chạm:
          </span>
          {memberGroups.slice(0, 3).map((grp) => {
            const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId);
            const gMeta = GROUP_META[tpl?.group || 'A'];
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => handleLaunchGroup(grp)}
                className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-2 rounded-xl border border-slate-200/90 bg-[var(--surface-well)] px-3.5 text-[13px] font-medium text-slate-800 transition-colors hover:border-[#1d4ed8]/40 hover:bg-blue-50/70 hover:text-[#0b3d91]"
                title={`Khởi tạo ngay với ${grp.memberIds.length} thành viên đã thiết lập`}
              >
                <span className={`h-2 w-2 rounded-full ${gMeta.dotClass}`} aria-hidden />
                <span>{grp.name}</span>
                <span className="rounded-md bg-white px-1.5 py-0.2 text-[11px] font-semibold tabular-nums text-slate-600">
                  {grp.memberIds.length}
                </span>
              </button>
            );
          })}
          {[
            { id: 'tpl-b1', label: 'ĐHĐCĐ', group: 'B' as MeetingGroup },
            { id: 'tpl-d1', label: 'Họp Hai Bên', group: 'D' as MeetingGroup },
          ].map((chip) => {
            const gMeta = GROUP_META[chip.group];
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleLaunchTemplate(chip.id)}
                className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-2 rounded-xl border border-slate-200/90 bg-[var(--surface-well)] px-3.5 text-[13px] font-medium text-slate-800 transition-colors hover:border-[#1d4ed8]/40 hover:bg-blue-50/70 hover:text-[#0b3d91]"
              >
                <span className={`h-2 w-2 rounded-full ${gMeta.dotClass}`} aria-hidden />
                <span>{chip.label}</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1 rounded-xl px-2.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <span>Danh bạ & Nhóm</span>
            </button>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1 rounded-xl px-3 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:bg-blue-50"
            >
              <span>14 mẫu & tùy chọn</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Smart Context Alert Banner — Human-Friendly Copy (Never prints "0 items") */}
      {(pendingMeetings.length > 0 || overdueActions.length > 0) && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3.5 text-[13.5px] text-amber-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertCircle className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <span className="leading-relaxed">
              {pendingMeetings.length > 0 && overdueActions.length > 0 ? (
                <>
                  Cần xử lý:{' '}
                  <strong className="font-semibold text-amber-950">
                    {pendingMeetings.length} biên bản chờ phê duyệt
                  </strong>{' '}
                  và{' '}
                  <strong className="font-semibold text-rose-800">
                    {overdueActions.length} nhiệm vụ đã quá hạn
                  </strong>
                  .
                </>
              ) : pendingMeetings.length > 0 ? (
                <>
                  Cần phê duyệt: Hiện có{' '}
                  <strong className="font-semibold text-amber-950">
                    {pendingMeetings.length} biên bản cuộc họp
                  </strong>{' '}
                  đang chờ Chủ tọa ký xác nhận.
                </>
              ) : (
                <>
                  Cần đôn đốc: Bạn có{' '}
                  <strong className="font-semibold text-rose-800">
                    {overdueActions.length} nhiệm vụ sau họp đã quá hạn
                  </strong>{' '}
                  cần cập nhật tiến độ giải trình.
                </>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (pendingMeetings.length > 0) {
                setSelectedStatusFilter('pending_review');
                setActiveTab('meetings');
              } else {
                setActiveTab('actions');
              }
            }}
            className="press-subtle inline-flex h-8.5 shrink-0 cursor-pointer items-center gap-1.5 self-end rounded-xl border border-amber-300 bg-white px-3.5 text-[13px] font-semibold text-amber-950 shadow-2xs transition-colors hover:bg-amber-100/50 sm:self-auto"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {/* 4 Executive KPI Cards — Stripe / Linear Clean Cards (No Rainbow Border Clutter) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('ALL');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-slate-600">Tổng số biên bản</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1d4ed8]">
              <FileText className="h-4.5 w-4.5" strokeWidth={1.9} />
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
              {meetings.length}
            </span>
            <span className="text-[13px] font-medium text-slate-600">hồ sơ lưu trữ</span>
          </div>
          <p className="border-t border-slate-100 pt-2.5 text-[12.5px] font-medium text-slate-600 transition-colors group-hover:text-[#1d4ed8]">
            Tra cứu nhóm A, B, C, D, E →
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('pending_review');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-slate-600">Chờ Chủ tọa duyệt</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-4.5 w-4.5" strokeWidth={1.9} />
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
              {pendingMeetings.length}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                pendingMeetings.length > 0
                  ? 'bg-amber-50 text-amber-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pendingMeetings.length > 0 ? 'chờ ký duyệt' : 'đã xử lý hết'}
            </span>
          </div>
          <p className="border-t border-slate-100 pt-2.5 text-[12.5px] font-medium text-slate-600 transition-colors group-hover:text-[#1d4ed8]">
            Lọc hồ sơ chờ ký duyệt →
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className="group interactive-card cursor-pointer space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-slate-600">Nhiệm vụ sau họp</span>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                overdueActions.length > 0
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-blue-50 text-[#1d4ed8]'
              }`}
            >
              <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={1.9} />
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
              {allActions.length}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                overdueActions.length > 0
                  ? 'bg-rose-50 text-rose-900'
                  : 'bg-emerald-50 text-emerald-900'
              }`}
            >
              {overdueActions.length > 0 ? `${overdueActions.length} trễ hạn` : 'đúng tiến độ'}
            </span>
          </div>
          <p className="border-t border-slate-100 pt-2.5 text-[12.5px] font-medium text-slate-600 transition-colors group-hover:text-[#1d4ed8]">
            Mở bảng Kanban & giải trình →
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('approved');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-semibold text-slate-600">Đã ký khóa SHA-256</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.9} />
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-slate-900">
              {approvedCount}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">
              hồ sơ hiệu lực
            </span>
          </div>
          <p className="border-t border-slate-100 pt-2.5 text-[12.5px] font-medium text-slate-600 transition-colors group-hover:text-[#1d4ed8]">
            Xem biên bản đã khóa sổ →
          </p>
        </button>
      </div>

      {/* Primary Operational Workspace: 7-Col Recent Meetings + 5-Col Key Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 cols: Recent Meetings — Linear Clean Divided Rows */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                Biên bản cuộc họp gần đây
              </h2>
              <p className="mt-0.5 text-[12.5px] text-slate-600">
                Bấm vào dòng để xem bản in A4 hoặc tiếp tục ghi chép trực tiếp
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('meetings')}
              className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[12.5px] font-semibold text-slate-700 transition-colors hover:border-[#1d4ed8]/40 hover:bg-blue-50 hover:text-[#0b3d91]"
            >
              <span>Kho ({meetings.length})</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="space-y-3 p-10 text-center">
              <p className="text-[13.5px] font-medium text-slate-600">
                Chưa có biên bản cuộc họp nào trong hệ thống
              </p>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="cursor-pointer rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#1e40af]"
              >
                Tạo cuộc họp mới
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {meetings.slice(0, 5).map((mtg) => {
                const badge = MEETING_STATUS_META[mtg.status] || MEETING_STATUS_META.draft;
                const groupMeta = GROUP_META[mtg.group] || GROUP_META.A;

                return (
                  <div
                    key={mtg.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setCurrentMeetingId(mtg.id);
                      setActiveTab('preview');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setCurrentMeetingId(mtg.id);
                        setActiveTab('preview');
                      }
                    }}
                    className="group flex cursor-pointer flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-well)]/75 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums text-slate-700">
                          <span className={`h-2 w-2 rounded-full ${groupMeta.dotClass}`} aria-hidden />
                          {mtg.code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${badge.badgeClass}`}
                        >
                          {badge.shortLabel}
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          {groupMeta.shortLabel} · v{mtg.version}
                        </span>
                      </div>
                      <h3 className="truncate text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
                        {mtg.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-slate-600">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.85} />
                          {mtg.date} ({mtg.startTime} – {mtg.endTime})
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.85} />
                          {mtg.participants.length} đại biểu
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('live');
                        }}
                        className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 text-[12.5px] font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
                      >
                        <Play className="h-3.5 w-3.5" strokeWidth={2} />
                        <span>Ghi chép</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('preview');
                        }}
                        className="press-subtle inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300/80 bg-white px-3 text-[12.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <FileCheck2 className="h-3.5 w-3.5 text-slate-600" strokeWidth={1.85} />
                        <span>Xem</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 5 cols: Key Actions — Linear Clean Divided Rows */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[16px] font-bold tracking-tight text-slate-900">
                Nhiệm vụ trọng tâm
              </h2>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 transition-colors ${
                    taskFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({allActions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('overdue')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 transition-colors ${
                    taskFilter === 'overdue'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : overdueActions.length > 0
                      ? 'text-rose-800 hover:text-rose-950'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Trễ ({overdueActions.length})
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-[#1d4ed8] hover:text-[#1e40af]"
            >
              <span>Bảng việc</span>
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          {displayedActions.length === 0 ? (
            <div className="p-8 text-center text-[13.5px] text-slate-600">
              {taskFilter === 'overdue'
                ? 'Không có nhiệm vụ nào bị quá hạn — tiến độ đang tốt!'
                : 'Chưa có nhiệm vụ sau họp nào được phân công.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedActions.map((act) => {
                const priorityMeta = PRIORITY_META[act.priority] || PRIORITY_META.medium;
                const deadlineInfo = formatRelativeDeadline(act.deadline, act.status);

                return (
                  <div
                    key={act.id}
                    className="space-y-2 px-5 py-3.5 transition-colors hover:bg-[var(--surface-well)]/75"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const next = act.status === 'completed' ? 'in_progress' : 'completed';
                            updateActionItem(act.id, { status: next });
                            if (next === 'completed') {
                              confetti({ particleCount: 30, spread: 45, origin: { y: 0.75 } });
                              toast.success('Đã hoàn thành nhiệm vụ', act.title);
                            }
                          }}
                          className="mt-0.5 shrink-0 cursor-pointer text-slate-400 transition-colors hover:text-emerald-600"
                          title={
                            act.status === 'completed'
                              ? 'Mở lại nhiệm vụ'
                              : 'Đánh dấu hoàn thành nhanh'
                          }
                        >
                          {act.status === 'completed' ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <Circle className="h-4.5 w-4.5" />
                          )}
                        </button>
                        <h4
                          className={`text-[14px] font-semibold leading-snug ${
                            act.status === 'completed'
                              ? 'text-slate-500 line-through'
                              : 'text-slate-900'
                          }`}
                        >
                          {act.title}
                        </h4>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${priorityMeta.badgeClass}`}
                      >
                        {priorityMeta.label}
                      </span>
                    </div>

                    <p className="line-clamp-1 pl-7 text-[12.5px] text-slate-600">
                      Đầu ra: {act.deliverable}
                    </p>

                    <div className="flex items-center justify-between pl-7 text-xs">
                      <span className="inline-flex max-w-[165px] items-center gap-1.5 truncate font-medium text-slate-700">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9.5px] font-bold ${getAvatarTone(
                            act.ownerName
                          )}`}
                        >
                          {getInitials(act.ownerName)}
                        </span>
                        <span className="truncate text-[12.5px]">{act.ownerName}</span>
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11.5px] tabular-nums ${deadlineInfo.toneClass}`}
                      >
                        {deadlineInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
