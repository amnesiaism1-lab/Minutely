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
  AlertTriangle,
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

  const { updateParticipant, addParticipant, removeParticipant } = useMeetingContext();

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
      alert('Vui lòng nhập lý do từ chối ký theo quy định Điều 158 Luật Doanh nghiệp 2020!');
      return;
    }
    updateParticipant(meeting.id, participantId, {
      refusedSign: true,
      refusalReason: refusalReason.trim(),
      hasSigned: false,
    });
    setSelectedParticipantForRefusal(null);
    setRefusalReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl text-slate-900 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">
                Quản lý đại biểu, điểm danh & túc số
              </h3>
              <p className="text-[11px] text-slate-500">
                Tuân thủ Điều 141, 148, 158 Luật Doanh nghiệp 2020
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quorum and Summary Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Tổng số đại biểu:</span>
            <span className="font-mono font-semibold text-slate-800 px-2 py-0.5 rounded bg-white border border-slate-200">
              {participants.length} người
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-medium">
              Có mặt & Ủy quyền: {presentCount} / {participants.length}
            </span>
          </div>

          {meeting.quorum && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                meeting.quorum.isMet
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {meeting.quorum.isMet ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              )}
              <span>
                Túc số thực tế: {meeting.quorum.actualPercentage}% / {meeting.quorum.requiredPercentage}% (
                {meeting.quorum.isMet ? 'Đạt' : 'Chưa đạt'})
              </span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Danh sách chi tiết đại biểu
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Ẩn form thêm' : '+ Thêm đại biểu mới'}</span>
            </button>
          </div>

          {/* Add Form (Collapsible) */}
          {showAddForm && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 animate-in fade-in">
              <h4 className="text-xs font-semibold text-slate-800">Thêm đại biểu tham dự cuộc họp</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Họ và tên..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <input
                  type="email"
                  placeholder="Email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
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
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />

                {meeting.type === 'B1_DH_CO_DONG' && (
                  <input
                    type="number"
                    placeholder="Số cổ phần sở hữu..."
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                )}

                {meeting.type === 'B3_HD_THANH_VIEN' && (
                  <input
                    type="number"
                    placeholder="Tỷ lệ vốn góp (%)"
                    value={newCapitalRatio}
                    onChange={(e) => setNewCapitalRatio(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                )}

                {meeting.group === 'D' && (
                  <select
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
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
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  >
                    Xác nhận thêm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Participant Cards */}
          <div className="space-y-2.5">
            {participants.map((p) => {
              const isSelectedRefusal = selectedParticipantForRefusal === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  {/* Left: Info */}
                  <div className="space-y-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">{p.name}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          p.role === 'chairperson'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : p.role === 'secretary'
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : p.role === 'guest'
                            ? 'bg-slate-50 text-slate-600 border-slate-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
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
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {p.affiliation === 'party_a' ? 'Bên A' : 'Bên B'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      {p.title} {p.department && `• ${p.department}`}
                    </div>

                    {/* Legal stats (Shares / Capital) */}
                    {(p.sharesCount !== undefined || p.capitalRatio !== undefined) && (
                      <div className="flex items-center gap-2 text-[11px] font-mono pt-0.5">
                        {p.sharesCount !== undefined && (
                          <span className="text-slate-600">
                            Cổ phần: {p.sharesCount.toLocaleString()}
                          </span>
                        )}
                        {p.capitalRatio !== undefined && (
                          <span className="text-emerald-700">
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
                                ? 'bg-slate-900 text-white font-medium shadow-2xs'
                                : st.id === 'delegated'
                                ? 'bg-slate-800 text-white font-medium shadow-2xs'
                                : 'bg-rose-700 text-white font-medium shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {p.status === 'delegated' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Người nhận ủy quyền:</span>
                        <input
                          type="text"
                          value={p.delegatedTo || ''}
                          placeholder="Họ tên người nhận..."
                          onChange={(e) => handleDelegatedToChange(p.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
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
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        p.hasSigned
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={p.hasSigned ? 'Bấm để hủy ký' : 'Xác nhận chữ ký'}
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
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        p.refusedSign
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-rose-700'
                      }`}
                      title="Ghi nhận từ chối ký theo Điều 158 Luật DN"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{p.refusedSign ? 'Từ chối ký' : 'Từ chối?'}</span>
                    </button>

                    {/* Remove participant */}
                    <button
                      type="button"
                      onClick={() => removeParticipant(meeting.id, p.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                      title="Xóa khỏi cuộc họp"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Collapsible Refusal reason input */}
                  {isSelectedRefusal && (
                    <div className="w-full pt-2 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Lý do từ chối ký biên bản (Bắt buộc theo Luật Doanh nghiệp)..."
                        value={refusalReason}
                        onChange={(e) => setRefusalReason(e.target.value)}
                        className="flex-1 bg-slate-50 border border-rose-300 rounded px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRefusal(p.id)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-medium cursor-pointer"
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Dữ liệu điểm danh và túc số được đồng bộ tự động vào biên bản và cơ sở dữ liệu.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-colors"
          >
            Đóng & Tiếp tục cuộc họp
          </button>
        </div>
      </div>
    </div>
  );
};
