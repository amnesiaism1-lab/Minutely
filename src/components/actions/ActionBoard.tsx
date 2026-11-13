import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { ActionItem, ActionStatus } from '../../types';
import {
  List,
  Columns3,
  RotateCcw,
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

  const columns: { status: ActionStatus; label: string; dotColor: string }[] = [
    { status: 'not_started', label: 'Chưa bắt đầu', dotColor: 'bg-slate-400' },
    { status: 'in_progress', label: 'Đang thực hiện', dotColor: 'bg-sky-500' },
    { status: 'blocked', label: 'Đang vướng mắc', dotColor: 'bg-rose-500' },
    { status: 'pending_approval', label: 'Chờ nghiệm thu', dotColor: 'bg-amber-500' },
    { status: 'completed', label: 'Đã hoàn thành', dotColor: 'bg-emerald-500' },
  ];

  const handleStatusChange = (actionId: string, newStatus: ActionStatus) => {
    updateActionItem(actionId, { status: newStatus });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bảng theo dõi hành động & nhiệm vụ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản trị trách nhiệm giải trình sau cuộc họp. Một nhiệm vụ - Một người phụ trách chính - Một sản phẩm bàn giao.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 select-none">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
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
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterType === f.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterType === f.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
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
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
          {columns.map((col) => {
            const colActions = filteredActions.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-3 min-h-[500px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-semibold text-slate-800">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 shadow-2xs">
                    {colActions.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colActions.map((act) => {
                    const isOverdue = act.status !== 'completed' && act.deadline < todayStr;
                    return (
                      <div
                        key={act.id}
                        className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all space-y-2 text-xs"
                      >
                        {/* Header: Code & Priority */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            onClick={() => {
                              setCurrentMeetingId(act.meetingId);
                              setActiveTab('preview');
                            }}
                            className="text-[10px] font-mono font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer truncate max-w-[120px]"
                            title={act.meetingTitle}
                          >
                            {act.meetingCode}
                          </span>
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${
                              act.priority === 'urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : act.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-slate-900 leading-snug">{act.title}</h4>

                        {/* Deliverable */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                          <span className="font-medium text-slate-800">Đầu ra:</span>{' '}
                          {act.deliverable}
                        </div>

                        {/* Owner & Deadline */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            {act.ownerName}
                          </span>
                          <span
                            className={`font-mono text-[10px] ${
                              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                            }`}
                          >
                            {act.deadline}
                          </span>
                        </div>

                        {/* Carried over tag */}
                        {act.carriedFromPrevious && (
                          <div className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                            <RotateCcw className="w-3 h-3" />
                            <span>Tồn kỳ trước chuyển sang</span>
                          </div>
                        )}

                        {/* Quick Status Select */}
                        <select
                          value={act.status}
                          onChange={(e) => handleStatusChange(act.id, e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[11px] font-medium text-slate-700 cursor-pointer focus:outline-none"
                        >
                          <option value="not_started">Chưa bắt đầu</option>
                          <option value="in_progress">Đang thực hiện</option>
                          <option value="blocked">Đang vướng mắc</option>
                          <option value="pending_approval">Chờ nghiệm thu</option>
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
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Hành động</th>
                <th className="p-3.5">Sản phẩm đầu ra (DoD)</th>
                <th className="p-3.5">Phụ trách</th>
                <th className="p-3.5">Thời hạn</th>
                <th className="p-3.5">Mức độ</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5">Cuộc họp gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map((act) => {
                const isOverdue = act.status !== 'completed' && act.deadline < todayStr;
                return (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-900 max-w-xs">{act.title}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs">{act.deliverable}</td>
                    <td className="p-3.5 font-medium text-slate-800">{act.ownerName}</td>
                    <td className="p-3.5 font-mono">
                      <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                        {act.deadline} {isOverdue && '(Quá hạn)'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded uppercase ${
                          act.priority === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : act.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                        <option value="in_progress">Đang thực hiện</option>
                        <option value="blocked">Đang vướng mắc</option>
                        <option value="pending_approval">Chờ nghiệm thu</option>
                        <option value="completed">Đã hoàn thành</option>
                      </select>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => {
                          setCurrentMeetingId(act.meetingId);
                          setActiveTab('preview');
                        }}
                        className="font-mono text-slate-700 hover:text-slate-900 hover:underline font-medium"
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
