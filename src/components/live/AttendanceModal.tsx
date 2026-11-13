import React, { useState } from 'react';
import { Participant, AttendanceStatus, ParticipantRole, PartyAffiliation, Meeting } from '../../types';
import { useMeetingContext } from '../../context/MeetingContext';
import {
  Users,
  X,
  UserPlus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  FileSignature,
  AlertTriangle,
  UserCheck,
  Clock,
  Building,
} from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  meeting,
}) => {
  if (!isOpen) return null;

  const { updateParticipant, addParticipant, removeParticipant, batchUpdateAttendance } = useMeetingContext();

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Đại biểu');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');
  const [showAddForm, setShowAddForm] = useState(false);

  // Refusal to sign state
  const [selectedParticipantForRefusal, setSelectedParticipantForRefusal] = useState<string | null>(null);
  const [refusalReason, setRefusalReason] = useState('');

  const participants = meeting.participants;
  const presentCount = participants.filter((p) => p.status === 'present' || p.status === 'delegated').length;

  const handleStatusChange = (participantId: string, status: AttendanceStatus) => {
    updateParticipant(meeting.id, participantId, { status });
  };

  const handleDelegatedToChange = (participantId: string, delegatedTo: string) => {
    updateParticipant(meeting.id, participantId, { delegatedTo, status: 'delegated' });
  };

  const handleAddPerson = () => {
    if (!newName.trim()) return;

    addParticipant(meeting.id, {
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      role: newRole,
      title: newTitle.trim() || 'Đại biểu',
      affiliation: meeting.group === 'D' ? newAffiliation : 'internal',
      status: 'present',
      sharesCount: typeof newShares === 'number' ? newShares : undefined,
      capitalRatio: typeof newCapitalRatio === 'number' ? newCapitalRatio : undefined,
      votingPower: newRole === 'guest' ? 0 : 1,
    });

    setNewName('');
    setNewEmail('');
    setNewTitle('Đại biểu');
    setNewShares('');
    setNewCapitalRatio('');
    setShowAddForm(false);
  };

  const handleToggleSign = (participantId: string, currentlySigned?: boolean) => {
    updateParticipant(meeting.id, participantId, {
      hasSigned: !currentlySigned,
      signedAt: !currentlySigned ? new Date().toISOString() : undefined,
      refusedSign: false,
      refusalReason: undefined,
    });
  };

  const handleSaveRefusal = (participantId: string) => {
    if (!refusalReason.trim()) {
      alert('Vui lòng nhập lý do từ chối ký theo Điều 158 Luật Doanh nghiệp!');
      return;
    }
    updateParticipant(meeting.id, participantId, {
      hasSigned: false,
      signedAt: undefined,
      refusedSign: true,
      refusalReason: refusalReason.trim(),
    });
    setSelectedParticipantForRefusal(null);
    setRefusalReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-white animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Quản Lý Thành Phần Tham Dự & Điểm Danh</h2>
              <p className="text-[11px] text-slate-400">
                Ghi nhận hiện diện, túc số pháp lý và quyền biểu quyết của từng đại biểu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quorum and Summary Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Tổng số đại biểu:</span>
            <span className="font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-slate-800">
              {participants.length} người
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-bold">
              Có mặt & Ủy quyền: {presentCount} / {participants.length}
            </span>
          </div>

          {meeting.quorum && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                meeting.quorum.isMet
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {meeting.quorum.isMet ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span>
                Túc số thực tế: {meeting.quorum.actualPercentage}% / {meeting.quorum.requiredPercentage}% (
                {meeting.quorum.isMet ? 'Đạt' : 'Chưa đạt'})
              </span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách chi tiết đại biểu
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ẩn form thêm' : '+ Thêm đại biểu mới'}</span>
            </button>
          </div>

          {/* Add Form (Collapsible) */}
          {showAddForm && (
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-300">Thêm đại biểu tham dự cuộc họp</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Họ và tên..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="member">Thành viên tham dự</option>
                  <option value="chairperson">Chủ tọa</option>
                  <option value="secretary">Thư ký</option>
                  <option value="guest">Khách mời</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Chức vụ / Chức danh..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />

                {meeting.type === 'B1_DH_CO_DONG' && (
                  <input
                    type="number"
                    placeholder="Số cổ phần sở hữu..."
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                )}

                {meeting.type === 'B3_HD_THANH_VIEN' && (
                  <input
                    type="number"
                    placeholder="Tỷ lệ vốn góp (%)"
                    value={newCapitalRatio}
                    onChange={(e) => setNewCapitalRatio(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                )}

                {meeting.group === 'D' && (
                  <select
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="party_a">Đại diện Bên A</option>
                    <option value="party_b">Đại diện Bên B</option>
                    <option value="internal">Quan sát viên</option>
                  </select>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddPerson}
                    disabled={!newName.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    Xác nhận thêm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participant Cards / Table */}
          <div className="space-y-3">
            {participants.map((p) => {
              const isSelectedRefusal = selectedParticipantForRefusal === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Info */}
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{p.name}</span>
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
                      {p.affiliation && p.affiliation !== 'internal' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {p.affiliation === 'party_a' ? 'Bên A' : 'Bên B'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400">
                      {p.title} {p.department && `• ${p.department}`}
                    </div>

                    {/* Legal stats (Shares / Capital) */}
                    {(p.sharesCount !== undefined || p.capitalRatio !== undefined) && (
                      <div className="flex items-center gap-2 text-[11px] font-mono pt-0.5">
                        {p.sharesCount !== undefined && (
                          <span className="text-indigo-300">
                            Cổ phần: {p.sharesCount.toLocaleString()}
                          </span>
                        )}
                        {p.capitalRatio !== undefined && (
                          <span className="text-emerald-300">
                            Tỷ lệ vốn: {p.capitalRatio}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Middle: Attendance Selector */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(
                        [
                          { id: 'present', label: 'Có mặt' },
                          { id: 'absent_permitted', label: 'Vắng có phép' },
                          { id: 'absent_unexcused', label: 'Vắng không phép' },
                          { id: 'delegated', label: 'Ủy quyền' },
                          { id: 'late', label: 'Đến muộn' },
                        ] as { id: AttendanceStatus; label: string }[]
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(p.id, st.id)}
                          className={`px-2 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer ${
                            p.status === st.id
                              ? st.id === 'present'
                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                : st.id === 'delegated'
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'bg-rose-600 text-white font-bold shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {p.status === 'delegated' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Người nhận ủy quyền:</span>
                        <input
                          type="text"
                          value={p.delegatedTo || ''}
                          placeholder="Họ tên người nhận..."
                          onChange={(e) => handleDelegatedToChange(p.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Signature & Refusal (Điều 158) */}
                  <div className="flex items-center gap-2 justify-end">
                    {/* Signed badge / button */}
                    <button
                      type="button"
                      onClick={() => handleToggleSign(p.id, p.hasSigned)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        p.hasSigned
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title={p.hasSigned ? 'Bấm để hủy ký' : 'Xác nhận chữ ký điện tử'}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{p.hasSigned ? 'Đã ký' : 'Chưa ký'}</span>
                    </button>

                    {/* Refusal indicator button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipantForRefusal(isSelectedRefusal ? null : p.id);
                        setRefusalReason(p.refusalReason || '');
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        p.refusedSign
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-rose-300'
                      }`}
                      title="Ghi nhận từ chối ký theo Điều 158 Luật DN"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{p.refusedSign ? 'Từ chối ký' : 'Từ chối?'}</span>
                    </button>

                    {/* Remove participant */}
                    <button
                      type="button"
                      onClick={() => removeParticipant(meeting.id, p.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer transition-colors"
                      title="Xóa khỏi cuộc họp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Collapsible Refusal reason input */}
                  {isSelectedRefusal && (
                    <div className="w-full pt-2 border-t border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Lý do từ chối ký biên bản (Bắt buộc theo Luật Doanh nghiệp)..."
                        value={refusalReason}
                        onChange={(e) => setRefusalReason(e.target.value)}
                        className="flex-1 bg-slate-900 border border-rose-500/40 rounded px-2.5 py-1 text-xs text-white placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRefusal(p.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        Lưu lý do
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Dữ liệu điểm danh và túc số được đồng bộ tự động vào biên bản và cơ sở dữ liệu.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer transition-colors"
          >
            Đóng & Tiếp tục cuộc họp
          </button>
        </div>
      </div>
    </div>
  );
};
