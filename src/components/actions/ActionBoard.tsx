import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { ActionItem, ActionStatus, PriorityLevel } from '../../types';
import {
  CheckSquare,
  List,
  Columns3,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Filter,
  ArrowRight,
  RotateCcw,
  Plus,
} from 'lucide-react';

export const ActionBoard: React.FC = () => {
  const { meetings, updateActionItem, currentUser, setCurrentMeetingId, setActiveTab } =
    useMeetingContext();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterType, setFilterType] = useState<'all' | 'my' | 'overdue' | 'week'>('all');
  const [selectedMeetingFilter, setSelectedMeetingFilter] = useState<string>('ALL');

  // Collect all action items across meetings
  const allActions: (ActionItem & { meetingCode?: string })[] = meetings.flatMap((m) =>
    m.agendaItems.flatMap((i) =>
      i.actionItems.map((a) => ({
        ...a,
        meetingCode: m.code,
      }))
    )
  );

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredActions = allActions.filter((a) => {
    // Meeting filter
    if (selectedMeetingFilter !== 'ALL' && a.meetingId !== selectedMeetingFilter) {
      return false;
    }

    // Quick filter
    if (filterType === 'my') {
      return a.ownerId === currentUser.id;
    }
    if (filterType === 'overdue') {
      return a.status !== 'completed' && a.deadline < todayStr;
    }
    if (filterType === 'week') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      return a.deadline >= todayStr && a.deadline <= nextWeekStr;
    }

    return true;
  });

  const columns: { status: ActionStatus; label: string; color: string }[] = [
    { status: 'not_started', label: 'Chưa bắt đầu', color: 'border-slate-300 bg-slate-50' },
    { status: 'in_progress', label: 'Đang thực hiện', color: 'border-blue-300 bg-blue-50/50' },
    { status: 'blocked', label: 'Bị nghẽn / Chặn', color: 'border-rose-300 bg-rose-50/50' },
    { status: 'pending_approval', label: 'Chờ duyệt đầu ra', color: 'border-amber-300 bg-amber-50/50' },
    { status: 'completed', label: 'Đã hoàn thành', color: 'border-emerald-300 bg-emerald-50/50' },
  ];

  const handleStatusChange = (actionId: string, newStatus: ActionStatus) => {
    updateActionItem(actionId, { status: newStatus });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bảng Theo Dõi Hành Động (Action Board)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị trách nhiệm giải trình (Accountability) sau cuộc họp. Một việc - Một người chịu trách nhiệm chính.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Tất cả nhiệm vụ', count: allActions.length },
            {
              id: 'my',
              label: 'Việc của tôi',
              count: allActions.filter((a) => a.ownerId === currentUser.id).length,
            },
            {
              id: 'overdue',
              label: 'Trễ hạn (Gấp)',
              count: allActions.filter((a) => a.status !== 'completed' && a.deadline < todayStr)
                .length,
            },
            {
              id: 'week',
              label: 'Đến hạn trong tuần',
              count: allActions.filter(
                (a) =>
                  a.deadline >= todayStr &&
                  a.deadline <=
                    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
              ).length,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === f.id ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Meeting Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Theo cuộc họp:</span>
          <select
            value={selectedMeetingFilter}
            onChange={(e) => setSelectedMeetingFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả cuộc họp</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const colActions = filteredActions.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-2xl border ${col.color} p-3 min-h-[500px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {colActions.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colActions.map((act) => {
                    const isOverdue = act.status !== 'completed' && act.deadline < todayStr;
                    return (
                      <div
                        key={act.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-2.5 text-xs"
                      >
                        {/* Header: Code & Priority */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            onClick={() => {
                              setCurrentMeetingId(act.meetingId);
                              setActiveTab('preview');
                            }}
                            className="text-[10px] font-mono font-bold text-indigo-600 hover:underline cursor-pointer truncate max-w-[120px]"
                            title={act.meetingTitle}
                          >
                            {act.meetingCode}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              act.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700'
                                : act.priority === 'high'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 leading-snug">{act.title}</h4>

                        {/* Deliverable */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700">🎯 Đầu ra:</span>{' '}
                          {act.deliverable}
                        </div>

                        {/* Owner & Deadline */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            👤 {act.ownerName}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isOverdue ? 'text-rose-600' : 'text-slate-500'
                            }`}
                          >
                            📅 {act.deadline}
                          </span>
                        </div>

                        {/* Carried over tag */}
                        {act.carriedFromPrevious && (
                          <div className="text-[10px] text-amber-600 flex items-center gap-1 font-medium">
                            <RotateCcw className="w-3 h-3" />
                            <span>Tồn kỳ trước mang sang</span>
                          </div>
                        )}

                        {/* Quick Status Select */}
                        <select
                          value={act.status}
                          onChange={(e) => handleStatusChange(act.id, e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-medium text-slate-700 cursor-pointer"
                        >
                          <option value="not_started">Chưa bắt đầu</option>
                          <option value="in_progress">Đang làm</option>
                          <option value="blocked">Bị nghẽn</option>
                          <option value="pending_approval">Chờ duyệt</option>
                          <option value="completed">Đã hoàn thành</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Table View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Hành động</th>
                <th className="p-3.5">Sản phẩm đầu ra (DoD)</th>
                <th className="p-3.5">Chủ trì (Owner)</th>
                <th className="p-3.5">Hạn chót</th>
                <th className="p-3.5">Mức độ</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Cuộc họp gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map((act) => {
                const isOverdue = act.status !== 'completed' && act.deadline < todayStr;
                return (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 max-w-xs">{act.title}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{act.deliverable}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{act.ownerName}</td>
                    <td className="p-3.5 font-mono">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                        {act.deadline} {isOverdue && '(Quá hạn)'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          act.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : act.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {act.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={act.status}
                        onChange={(e) => handleStatusChange(act.id, e.target.value as any)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 cursor-pointer"
                      >
                        <option value="not_started">Chưa bắt đầu</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="blocked">Bị chặn</option>
                        <option value="pending_approval">Chờ duyệt</option>
                        <option value="completed">Đã hoàn thành</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => {
                          setCurrentMeetingId(act.meetingId);
                          setActiveTab('preview');
                        }}
                        className="font-mono text-indigo-600 hover:underline font-bold"
                      >
                        {act.meetingCode}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
