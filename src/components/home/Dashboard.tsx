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
    <div className="mx-auto max-w-[1360px] space-y-5 p-5 sm:p-7">
      {/* Executive Header — Calm Weight & Generous Breathing Room */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-normal capitalize text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
            <span>{todayFormatted}</span>
          </p>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 sm:text-[24px]">
            Xin chào, {currentUser.name}
          </h1>
          <p className="mt-0.5 max-w-xl text-[13.5px] font-normal text-slate-500">
            Điều hành biên bản cuộc họp, theo dõi tiến độ giải trình và chuẩn hóa pháp lý đơn vị.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
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
            className="press-subtle inline-flex h-9.5 cursor-pointer items-center gap-2 rounded-xl border border-slate-200/95 bg-white px-3.5 text-[13px] font-medium text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            {draftMeeting && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />}
            <Play className="h-3.5 w-3.5 text-[#1d4ed8]" strokeWidth={1.85} />
            <span>{draftMeeting ? 'Tiếp tục phiên ghi' : 'Phòng ghi trực tiếp'}</span>
          </button>

          {currentUser.role !== 'member' && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="press-subtle inline-flex h-9.5 cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 text-[13px] font-medium text-white shadow-2xs transition-colors hover:bg-[#1e40af]"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={1.85} />
              <span>Tạo cuộc họp mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 1-Click Instant Minutes Strip — Clean Soft Pills */}
      {currentUser.role !== 'member' && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-2.5 shadow-2xs">
          <span className="inline-flex items-center gap-1.5 pr-1 text-[12.5px] font-medium text-slate-600">
            <Zap className="h-3.5 w-3.5 text-[#1d4ed8]" strokeWidth={1.85} />
            Khởi tạo nhanh:
          </span>
          {memberGroups.slice(0, 3).map((grp) => {
            const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === grp.defaultTemplateId);
            const gMeta = GROUP_META[tpl?.group || 'A'];
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => handleLaunchGroup(grp)}
                className="press-subtle inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--surface-well)] px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#0b3d91]"
                title={`Khởi tạo ngay với ${grp.memberIds.length} thành viên đã thiết lập`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${gMeta.dotClass}`} aria-hidden />
                <span>{grp.name}</span>
                <span className="text-[11.5px] font-normal tabular-nums text-slate-400">
                  ({grp.memberIds.length})
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
                className="press-subtle inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--surface-well)] px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-[#0b3d91]"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${gMeta.dotClass}`} aria-hidden />
                <span>{chip.label}</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('format-word')}
              className="cursor-pointer rounded-lg border border-blue-200/80 bg-blue-50/70 px-2.5 py-1 text-[12.5px] font-medium text-[#0b3d91] transition-colors hover:bg-blue-100/80"
            >
              Chuẩn hóa Word & VB
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              Danh bạ & Nhóm
            </button>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex cursor-pointer items-center gap-0.5 rounded-lg px-2.5 py-1 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:bg-blue-50"
            >
              <span>14 mẫu chuẩn</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.85} />
            </button>
          </div>
        </div>
      )}

      {/* Smart Context Alert Banner */}
      {(pendingMeetings.length > 0 || overdueActions.length > 0) && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-[13px] text-amber-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 sm:items-center">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:mt-0" strokeWidth={1.85} />
            <span className="font-normal text-slate-700">
              {pendingMeetings.length > 0 && overdueActions.length > 0 ? (
                <>
                  Cần xử lý:{' '}
                  <span className="font-medium text-slate-900">
                    {pendingMeetings.length} biên bản chờ phê duyệt
                  </span>{' '}
                  và{' '}
                  <span className="font-medium text-rose-700">
                    {overdueActions.length} nhiệm vụ đã quá hạn
                  </span>
                  .
                </>
              ) : pendingMeetings.length > 0 ? (
                <>
                  Hiện có{' '}
                  <span className="font-medium text-slate-900">
                    {pendingMeetings.length} biên bản cuộc họp
                  </span>{' '}
                  đang chờ Chủ tọa ký xác nhận.
                </>
              ) : (
                <>
                  Bạn có{' '}
                  <span className="font-medium text-rose-700">
                    {overdueActions.length} nhiệm vụ sau họp đã quá hạn
                  </span>{' '}
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
            className="press-subtle inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 self-end rounded-lg bg-white px-3 text-[12.5px] font-medium text-amber-900 ring-1 ring-amber-200/90 transition-colors hover:bg-amber-50 sm:self-auto"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.85} />
          </button>
        </div>
      )}

      {/* 4 Executive KPI Cards — Stripe / Linear Minimalist Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('ALL');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4.5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-500">Tổng số biên bản</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50/80 text-[#1d4ed8]">
              <FileText className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
              {meetings.length}
            </span>
            <span className="text-[12.5px] font-normal text-slate-500">hồ sơ lưu trữ</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('pending_review');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4.5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-500">Chờ Chủ tọa duyệt</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
              {pendingMeetings.length}
            </span>
            <span
              className={`text-[12.5px] font-normal ${
                pendingMeetings.length > 0 ? 'font-medium text-amber-700' : 'text-slate-500'
              }`}
            >
              {pendingMeetings.length > 0 ? 'chờ ký duyệt' : 'đã xử lý hết'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className="group interactive-card cursor-pointer space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4.5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-500">Nhiệm vụ sau họp</span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                overdueActions.length > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-blue-50/80 text-[#1d4ed8]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
              {allActions.length}
            </span>
            <span
              className={`text-[12.5px] ${
                overdueActions.length > 0
                  ? 'font-medium text-rose-600'
                  : 'font-normal text-emerald-700'
              }`}
            >
              {overdueActions.length > 0 ? `${overdueActions.length} trễ hạn` : 'đúng tiến độ'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedGroupFilter('ALL');
            setSelectedStatusFilter('approved');
            setActiveTab('meetings');
          }}
          className="group interactive-card cursor-pointer space-y-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4.5 text-left shadow-2xs hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-500">Đã ký khóa SHA-256</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
              {approvedCount}
            </span>
            <span className="text-[12.5px] font-normal text-emerald-700">hồ sơ hiệu lực</span>
          </div>
        </button>
      </div>

      {/* Primary Operational Workspace: 7-Col Recent Meetings + 5-Col Key Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 cols: Recent Meetings — Calm Title-First Rhythm */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs lg:col-span-7">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Biên bản cuộc họp gần đây
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('meetings')}
              className="inline-flex cursor-pointer items-center gap-0.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-[#1d4ed8]"
            >
              <span>Xem tất cả ({meetings.length})</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="space-y-3 p-10 text-center">
              <p className="text-[13.5px] font-normal text-slate-500">
                Chưa có biên bản cuộc họp nào trong hệ thống
              </p>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="cursor-pointer rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1e40af]"
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
                    className="group flex cursor-pointer flex-col justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-well)]/70 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[14px] font-medium text-slate-900 transition-colors group-hover:text-[#1d4ed8]">
                          {mtg.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${badge.badgeClass}`}
                        >
                          {badge.shortLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] font-normal tabular-nums text-slate-500">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className={`h-1.5 w-1.5 rounded-full ${groupMeta.dotClass}`} aria-hidden />
                          {mtg.code}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{groupMeta.shortLabel}</span>
                        <span className="text-slate-300">·</span>
                        <span>
                          {mtg.date} ({mtg.startTime}–{mtg.endTime})
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>{mtg.participants.length} đại biểu</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('live');
                        }}
                        className="press-subtle inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-50/75 px-2.5 text-[12px] font-medium text-[#1d4ed8] transition-colors hover:bg-blue-100/80"
                      >
                        <Play className="h-3 w-3" strokeWidth={1.85} />
                        <span>Ghi chép</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('preview');
                        }}
                        className="press-subtle inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/90 transition-colors hover:bg-white hover:text-slate-900"
                      >
                        <FileCheck2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                        <span>Xem</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 5 cols: Key Actions — Airy, Balanced Weight, Zero Pill Clutter */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
                Nhiệm vụ trọng tâm
              </h2>
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11.5px] font-medium">
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`cursor-pointer rounded-md px-2 py-0.5 transition-colors ${
                    taskFilter === 'all'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tất cả ({allActions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('overdue')}
                  className={`cursor-pointer rounded-md px-2 py-0.5 transition-colors ${
                    taskFilter === 'overdue'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : overdueActions.length > 0
                      ? 'text-rose-600 hover:text-rose-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Trễ ({overdueActions.length})
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className="inline-flex cursor-pointer items-center gap-0.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-[#1d4ed8]"
            >
              <span>Bảng việc</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {displayedActions.length === 0 ? (
            <div className="p-8 text-center text-[13px] font-normal text-slate-500">
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
                    className="space-y-1.5 px-5 py-3.5 transition-colors hover:bg-[var(--surface-well)]/70"
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
                          className="mt-0.5 shrink-0 cursor-pointer text-slate-300 transition-colors hover:text-emerald-600"
                          title={
                            act.status === 'completed'
                              ? 'Mở lại nhiệm vụ'
                              : 'Đánh dấu hoàn thành nhanh'
                          }
                        >
                          {act.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.85} />
                          ) : (
                            <Circle className="h-4 w-4" strokeWidth={1.75} />
                          )}
                        </button>
                        <h4
                          className={`line-clamp-2 text-[13.5px] font-medium leading-snug ${
                            act.status === 'completed'
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {act.title}
                        </h4>
                      </div>

                      {act.priority !== 'medium' && act.priority !== 'low' && (
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityMeta.badgeClass}`}
                        >
                          {priorityMeta.label}
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-1 pl-6.5 text-[12px] font-normal text-slate-500">
                      Đầu ra: {act.deliverable}
                    </p>

                    <div className="flex items-center justify-between pl-6.5 pt-0.5 text-xs">
                      <span className="inline-flex max-w-[175px] items-center gap-1.5 truncate font-normal text-slate-600">
                        <span
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${getAvatarTone(
                            act.ownerName
                          )}`}
                        >
                          {getInitials(act.ownerName)}
                        </span>
                        <span className="truncate text-[12px]">{act.ownerName}</span>
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[11.5px] tabular-nums ${deadlineInfo.toneClass}`}
                        title={`Hạn hoàn thành: ${act.deadline}`}
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
