import React from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
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
  Building,
  Terminal,
  Users,
} from 'lucide-react';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';

export const Dashboard: React.FC<{ onOpenCreateModal: () => void }> = ({ onOpenCreateModal }) => {
  const {
    meetings,
    setCurrentMeetingId,
    setActiveTab,
    currentUser,
    createMeeting,
  } = useMeetingContext();

  const allActions = meetings.flatMap((m) =>
    m.agendaItems.flatMap((i) =>
      i.actionItems.map((a) => ({ ...a, meetingCode: m.code }))
    )
  );
  const pendingMeetings = meetings.filter((m) => m.status === 'pending_review');
  const myPendingActions = allActions.filter(
    (a) => a.ownerId === currentUser.id && a.status !== 'completed'
  );
  const overdueActions = allActions.filter((a) => {
    if (a.status === 'completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return a.deadline < today;
  });

  const handleLaunchTemplate = (tplId: string) => {
    const tpl = TEMPLATE_DEFINITIONS.find((t) => t.id === tplId);
    if (!tpl) return;
    const newMtg = createMeeting({
      title: `${tpl.name} - ${new Date().toLocaleDateString('vi-VN')}`,
      templateId: tpl.id,
      group: tpl.group,
      type: tpl.type,
      typeName: tpl.name,
    });
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
    <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      {/* Executive Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium capitalize text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xin chào, {currentUser.name}
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
            Không gian điều hành biên bản cuộc họp, theo dõi trách nhiệm giải trình và chuẩn hóa pháp lý.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (meetings.length > 0) {
                setCurrentMeetingId(meetings[0].id);
                setActiveTab('live');
              } else {
                onOpenCreateModal();
              }
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Play className="h-3.5 w-3.5 text-slate-600" strokeWidth={1.75} />
            <span>Phòng ghi trực tiếp</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Tạo cuộc họp mới</span>
          </button>
        </div>
      </div>

      {/* Context Alert Strip (Quiet, tasteful notification) */}
      {(pendingMeetings.length > 0 || overdueActions.length > 0) && (
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 text-xs text-amber-950 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5 sm:items-center">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:mt-0" strokeWidth={1.75} />
            <span className="leading-relaxed">
              Bạn hiện có{' '}
              <strong className="font-semibold">
                {pendingMeetings.length} biên bản chờ phê duyệt
              </strong>
              {overdueActions.length > 0 && (
                <>
                  {' '}
                  và{' '}
                  <strong className="font-semibold text-rose-700">
                    {overdueActions.length} nhiệm vụ đã quá hạn
                  </strong>
                </>
              )}
              . Quyết nghị được gắn trách nhiệm theo từng cá nhân.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab(pendingMeetings.length > 0 ? 'meetings' : 'actions')}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 self-end text-xs font-semibold text-amber-950 hover:underline sm:self-auto"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="h-3 w-3" strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng số biên bản</span>
            <FileText className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {meetings.length}
            </span>
            <span className="text-xs text-slate-400">hồ sơ lưu trữ</span>
          </div>
          <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            Đầy đủ nhóm A, B, C, D, E
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Chờ Chủ tọa duyệt</span>
            <Clock className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {pendingMeetings.length}
            </span>
            <span className="text-xs font-medium text-amber-700">chờ ký xác nhận</span>
          </div>
          <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            Khóa văn bản sau khi ký
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Nhiệm vụ sau họp</span>
            <CheckCircle2 className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {allActions.length}
            </span>
            <span className="text-xs text-slate-500">
              ({overdueActions.length > 0 ? `${overdueActions.length} trễ hạn` : 'đúng hạn'})
            </span>
          </div>
          <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            Một việc — một người chịu trách nhiệm
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Chuẩn hóa thể thức</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              NĐ 30/2020
            </span>
            <span className="text-xs font-medium text-emerald-700">Đạt 100%</span>
          </div>
          <p className="border-t border-slate-100 pt-2 text-[11px] text-slate-500">
            Túc số & biểu quyết Luật DN
          </p>
        </div>
      </div>

      {/* Fast Template Launchpad (Clean, dignified cards) */}
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Khởi tạo theo biểu mẫu chuẩn
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tự động áp dụng quy tắc túc số, biểu quyết và các khối bắt buộc
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span>Tất cả 14 mẫu</span>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: 'tpl-b1',
              title: 'Đại Hội Đồng Cổ Đông',
              group: 'Nhóm B · Pháp lý',
              icon: Building,
              desc: 'Điều 150 Luật DN: Túc số cổ phần, biểu quyết theo tỷ lệ sở hữu, lưu trữ trụ sở.',
            },
            {
              id: 'tpl-b2',
              title: 'Hội Đồng Quản Trị',
              group: 'Nhóm B · Pháp lý',
              icon: ShieldCheck,
              desc: 'Điều 158 Luật DN: Túc số 3/4, biểu quyết từng thành viên, ghi nhận từ chối ký.',
            },
            {
              id: 'tpl-a1',
              title: 'Họp Giao Ban Định Kỳ',
              group: 'Nhóm A · Nội bộ',
              icon: Calendar,
              desc: 'Báo cáo theo đơn vị, tự động chuyển giao các việc chưa xong từ kỳ trước.',
            },
            {
              id: 'tpl-c3',
              title: 'Sprint Retrospective',
              group: 'Nhóm C · Phần mềm',
              icon: Terminal,
              desc: 'Blameless: Đánh giá tốt, chưa tốt, hành động cải tiến gắn kết quả sprint sau.',
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleLaunchTemplate(t.id)}
                className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {t.group}
                    </span>
                    <Icon
                      className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-700"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                    {t.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-600 transition-colors group-hover:text-slate-900">
                  <span>Mở biên bản</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={1.75}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent meetings + tasks */}
      <div className="grid grid-cols-1 gap-6 pt-1 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Biên bản cuộc họp gần đây
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('meetings')}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>Kho biên bản ({meetings.length})</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-xs font-medium text-slate-500">
                Chưa có biên bản cuộc họp nào trong hệ thống
              </p>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="cursor-pointer text-xs font-semibold text-slate-900 underline-offset-2 hover:underline"
              >
                Tạo cuộc họp mới
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {meetings.slice(0, 5).map((mtg) => {
                const statusBadges: Record<string, { label: string; color: string }> = {
                  draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                  pending_review: {
                    label: 'Chờ duyệt',
                    color: 'bg-amber-50 text-amber-800 border-amber-200',
                  },
                  approved: {
                    label: 'Đã duyệt',
                    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  },
                  published: {
                    label: 'Đã phát hành',
                    color: 'bg-sky-50 text-sky-800 border-sky-200',
                  },
                  archived: {
                    label: 'Lưu trữ',
                    color: 'bg-slate-100 text-slate-600 border-slate-200',
                  },
                };
                const badge = statusBadges[mtg.status] || statusBadges.draft;

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
                    className="flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-500">
                          {mtg.code}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Nhóm {mtg.group} · v{mtg.version}
                        </span>
                      </div>
                      <h3 className="truncate text-sm font-bold text-slate-900">
                        {mtg.title}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                          {mtg.date} ({mtg.startTime} – {mtg.endTime})
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
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
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        <Play className="h-3 w-3" strokeWidth={1.75} />
                        <span>Ghi chép</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('preview');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <FileCheck2 className="h-3 w-3" strokeWidth={1.75} />
                        <span>Xem & Xuất</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              Nhiệm vụ trọng tâm
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>Bảng việc ({allActions.length})</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="space-y-2">
            {allActions.slice(0, 5).map((act) => {
              const isOverdue =
                act.status !== 'completed' &&
                act.deadline < new Date().toISOString().split('T')[0];

              return (
                <div
                  key={act.id}
                  className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold leading-snug text-slate-900">
                      {act.title}
                    </h4>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        act.priority === 'urgent'
                          ? 'border border-rose-200 bg-rose-50 text-rose-700'
                          : act.priority === 'high'
                            ? 'border border-amber-200 bg-amber-50 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {act.priority}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-[11px] text-slate-500">
                    Đầu ra: {act.deliverable}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500">
                    <span className="inline-flex max-w-[140px] items-center gap-1 truncate font-medium text-slate-700">
                      <Users className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={1.75} />
                      {act.ownerName}
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        isOverdue ? 'font-bold text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {isOverdue ? `Trễ: ${act.deadline}` : act.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
