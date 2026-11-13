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
  Handshake,
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
    <div className="space-y-6 p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 capitalize mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xin chào, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Không gian điều hành biên bản cuộc họp, theo dõi trách nhiệm giải trình và chuẩn hóa pháp lý.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              if (meetings.length > 0) {
                setCurrentMeetingId(meetings[0].id);
                setActiveTab('live');
              } else {
                onOpenCreateModal();
              }
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-slate-600" />
            <span>Phòng ghi trực tiếp</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tạo cuộc họp mới</span>
          </button>
        </div>
      </div>

      {/* Context Alert Strip (Quiet, tasteful notification) */}
      {(pendingMeetings.length > 0 || overdueActions.length > 0) && (
        <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn hiện có{' '}
              <strong className="font-semibold text-amber-950">
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
              . Toàn bộ quyết nghị đều được ràng buộc trách nhiệm theo từng cá nhân.
            </span>
          </div>
          <button
            onClick={() => setActiveTab(pendingMeetings.length > 0 ? 'meetings' : 'actions')}
            className="text-xs font-semibold text-amber-950 hover:underline flex items-center gap-1 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <span>Xử lý ngay</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 4 Minimalist Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Tổng số biên bản</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {meetings.length}
            </span>
            <span className="text-xs text-slate-400">hồ sơ lưu trữ</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Đầy đủ nhóm A, B, C, D, E
          </p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Chờ Chủ tọa duyệt</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {pendingMeetings.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">chờ ký xác nhận</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Khóa văn bản sau khi ký
          </p>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Nhiệm vụ sau họp</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {allActions.length}
            </span>
            <span className="text-xs text-slate-500">
              ({overdueActions.length > 0 ? `${overdueActions.length} trễ hạn` : 'đúng hạn'})
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Một việc - Một người chịu trách nhiệm
          </p>
        </div>

        {/* Legal Compliance */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Chuẩn hóa thể thức</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              NĐ 30/2020
            </span>
            <span className="text-xs text-emerald-700 font-medium">Đạt 100%</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Túc số & Biểu quyết Luật DN
          </p>
        </div>
      </div>

      {/* Fast Template Launchpad (Clean, dignified cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Khởi tạo theo biểu mẫu chuẩn
            </h2>
            <p className="text-xs text-slate-500">
              Tự động áp dụng quy tắc túc số, biểu quyết và các khối bắt buộc
            </p>
          </div>
          <button
            onClick={() => setActiveTab('templates')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Tất cả 14 mẫu</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              id: 'tpl-b1',
              title: 'Đại Hội Đồng Cổ Đông',
              group: 'Nhóm B • Pháp lý',
              icon: Building,
              desc: 'Điều 150 Luật DN: Túc số cổ phần, biểu quyết theo tỷ lệ sở hữu, lưu trữ trụ sở.',
            },
            {
              id: 'tpl-b2',
              title: 'Hội Đồng Quản Trị',
              group: 'Nhóm B • Pháp lý',
              icon: ShieldCheck,
              desc: 'Điều 158 Luật DN: Túc số 3/4, biểu quyết từng thành viên, ghi nhận từ chối ký.',
            },
            {
              id: 'tpl-a1',
              title: 'Họp Giao Ban Định Kỳ',
              group: 'Nhóm A • Nội bộ',
              icon: Calendar,
              desc: 'Báo cáo theo đơn vị, tự động chuyển giao các việc chưa xong từ kỳ trước.',
            },
            {
              id: 'tpl-c3',
              title: 'Sprint Retrospective',
              group: 'Nhóm C • Phần mềm',
              icon: Terminal,
              desc: 'Blameless: Đánh giá tốt, chưa tốt, hành động cải tiến gắn kết quả sprint sau.',
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => handleLaunchTemplate(t.id)}
                className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {t.group}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {t.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 group-hover:text-indigo-600">
                  <span>Mở biên bản</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Balance: Recent Meetings & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
        {/* Recent Meetings (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Biên bản cuộc họp gần đây
            </h2>
            <button
              onClick={() => setActiveTab('meetings')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem kho biên bản ({meetings.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-500">
                Chưa có biên bản cuộc họp nào trong hệ thống
              </p>
              <button
                onClick={onOpenCreateModal}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                + Bấm vào đây để tạo cuộc họp mới
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {meetings.slice(0, 5).map((mtg) => {
                const statusBadges: Record<string, { label: string; color: string }> = {
                  draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                  pending_review: {
                    label: 'Chờ duyệt',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                  },
                  approved: {
                    label: 'Đã duyệt',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  },
                  published: {
                    label: 'Đã phát hành',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
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
                    onClick={() => {
                      setCurrentMeetingId(mtg.id);
                      setActiveTab('preview');
                    }}
                    className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          {mtg.code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Nhóm {mtg.group} • v{mtg.version}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm truncate hover:text-indigo-600 transition-colors">
                        {mtg.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {mtg.date} ({mtg.startTime} - {mtg.endTime})
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          {mtg.participants.length} đại biểu
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('live');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Ghi chép</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('preview');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Xem & Xuất</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Items Column (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Nhiệm vụ trọng tâm
            </h2>
            <button
              onClick={() => setActiveTab('actions')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem bảng việc ({allActions.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {allActions.slice(0, 5).map((act) => {
              const isOverdue =
                act.status !== 'completed' &&
                act.deadline < new Date().toISOString().split('T')[0];

              return (
                <div
                  key={act.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-xs leading-snug">
                      {act.title}
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        act.priority === 'urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : act.priority === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {act.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    🎯 Đầu ra: {act.deliverable}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-700 truncate max-w-[120px]">
                      👤 {act.ownerName}
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
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
