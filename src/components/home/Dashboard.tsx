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
  TrendingUp,
  Sparkles,
  ChevronRight,
  ShieldCheck,
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

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Hệ thống biên bản thông minh chuẩn pháp lý số 1 Việt Nam</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {currentUser.name}
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Hôm nay bạn có{' '}
            <span className="font-bold text-amber-300">{pendingMeetings.length} biên bản</span> chờ
            phê duyệt và{' '}
            <span className="font-bold text-amber-300">{myPendingActions.length} nhiệm vụ</span> cần
            thực hiện. Mọi biểu mẫu đều tích hợp tự động kiểm tra túc số và chuẩn Nghị định 30.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                if (meetings.length > 0) {
                  setCurrentMeetingId(meetings[0].id);
                  setActiveTab('live');
                } else {
                  onOpenCreateModal();
                }
              }}
              className="flex items-center gap-2 bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-indigo-900 text-indigo-900" />
              <span>Ghi chép trực tiếp cuộc họp</span>
            </button>
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm border border-indigo-400/40 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo cuộc họp mới</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-violet-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số biên bản
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{meetings.length}</span>
            <span className="text-xs text-slate-500">cuộc họp</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pháp lý & Nội bộ</span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chờ Chủ tọa duyệt
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{pendingMeetings.length}</span>
            <span className="text-xs text-slate-500">bản ghi</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Khóa nội dung sau duyệt</span>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hành động cần làm
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{allActions.length}</span>
            <span className="text-xs text-slate-500">
              ({overdueActions.length > 0 ? `${overdueActions.length} trễ hạn` : 'Đúng hạn'})
            </span>
          </div>
          <div className="mt-2 text-xs text-rose-500 font-medium">
            {overdueActions.length > 0 ? `Cần xử lý gấp ${overdueActions.length} việc` : 'Tiến độ đảm bảo'}
          </div>
        </div>

        {/* Compliance / Quorum */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tuân thủ pháp lý
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">100%</span>
            <span className="text-xs text-slate-500">Đạt chuẩn NĐ 30</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            Túc số & Biểu quyết hợp lệ
          </div>
        </div>
      </div>

      {/* Fast Template Launchpad */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Khởi tạo nhanh theo mẫu chuẩn</h2>
            <p className="text-xs text-slate-500">Chọn mẫu để tạo cuộc họp với các khối bắt buộc được định sẵn</p>
          </div>
          <button
            onClick={() => setActiveTab('templates')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Xem tất cả 14 mẫu</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'tpl-b1',
              title: 'Đại Hội Đồng Cổ Đông',
              group: 'Nhóm B - Pháp lý',
              desc: 'Điều 150 Luật DN: Túc số cổ đông, bầu dồn phiếu, biểu quyết theo cổ phần.',
              color: 'border-purple-200 hover:border-purple-400 bg-purple-50/50',
            },
            {
              id: 'tpl-b2',
              title: 'Hội Đồng Quản Trị',
              group: 'Nhóm B - Pháp lý',
              desc: 'Điều 158 Luật DN: Túc số 3/4 thành viên, ghi nhận từ chối ký kèm lý do.',
              color: 'border-amber-200 hover:border-amber-400 bg-amber-50/50',
            },
            {
              id: 'tpl-a1',
              title: 'Họp Giao Ban Tuần',
              group: 'Nhóm A - Nội bộ',
              desc: 'Đã làm, Đang làm, Vướng mắc. Tự động mang việc tồn kỳ trước sang.',
              color: 'border-blue-200 hover:border-blue-400 bg-blue-50/50',
            },
            {
              id: 'tpl-c3',
              title: 'Sprint Retrospective',
              group: 'Nhóm C - Phần mềm',
              desc: 'Blameless: Điều làm tốt, Chưa tốt, Hành động cải tiến gắn với Sprint sau.',
              color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50',
            },
          ].map((t) => (
            <div
              key={t.id}
              onClick={() => handleLaunchTemplate(t.id)}
              className={`p-4 rounded-xl border ${t.color} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t.group}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{t.title}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{t.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-indigo-600">
                <span>Dùng mẫu này</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Recent Meetings & Urgent Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Meetings (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Cuộc họp & Biên bản gần đây</h2>
            <button
              onClick={() => setActiveTab('meetings')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Xem tất cả ({meetings.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
              <p className="text-xs font-semibold text-slate-500">Chưa có biên bản cuộc họp nào trong hệ thống</p>
              <button
                onClick={onOpenCreateModal}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                + Bấm vào đây để tạo cuộc họp mới
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.slice(0, 5).map((mtg) => {
                const statusBadges: Record<string, { label: string; color: string }> = {
                  draft: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-300' },
                  pending_review: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-800 border-amber-300' },
                  approved: { label: 'Đã duyệt (Khóa)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                  published: { label: 'Đã phát hành', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                  archived: { label: 'Lưu trữ', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                };
                const badge = statusBadges[mtg.status] || statusBadges.draft;

                return (
                  <div
                    key={mtg.id}
                    onClick={() => {
                      setCurrentMeetingId(mtg.id);
                      setActiveTab('preview');
                    }}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[11px] font-bold text-slate-500 font-mono">
                          {mtg.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Nhóm {mtg.group}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">v{mtg.version}</span>
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
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Ghi trực tiếp</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMeetingId(mtg.id);
                          setActiveTab('preview');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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

        {/* Urgent Action Items (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Hành động cần làm</h2>
            <button
              onClick={() => setActiveTab('actions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Xem Kanban</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            {allActions
              .filter((a) => a.status !== 'completed')
              .slice(0, 5)
              .map((act) => {
                const isOverdue = act.deadline < new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 font-mono">
                        {act.meetingCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isOverdue ? 'Trễ hạn' : act.deadline}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{act.title}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>👤 {act.ownerName}</span>
                      <span className="font-medium text-slate-400 truncate max-w-[120px]">
                        🎯 {act.deliverable}
                      </span>
                    </div>
                  </div>
                );
              })}

            {allActions.filter((a) => a.status !== 'completed').length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tuyệt vời! Không có nhiệm vụ nào còn tồn đọng.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
