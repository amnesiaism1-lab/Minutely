import React, { useState, useEffect } from 'react';
import {
  AttendanceStatus,
  ParticipantRole,
  PartyAffiliation,
  Meeting,
} from '../../types';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { getInitials, getAvatarTone, formatParticipantRole } from '../../utils/uiHelpers';
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
  const { updateParticipant, addParticipant, removeParticipant } = useMeetingContext();
  const { toast } = useToast();

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ParticipantRole>('member');
  const [newTitle, setNewTitle] = useState('Đại biểu');
  const [newShares, setNewShares] = useState<number | ''>('');
  const [newCapitalRatio, setNewCapitalRatio] = useState<number | ''>('');
  const [newAffiliation, setNewAffiliation] = useState<PartyAffiliation>('internal');
  const [showAddForm, setShowAddForm] = useState(false);

  const [selectedParticipantForRefusal, setSelectedParticipantForRefusal] = useState<string | null>(
    null
  );
  const [refusalReason, setRefusalReason] = useState('');
  const [refusalError, setRefusalError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const participants = meeting.participants;
  const presentCount = participants.filter(
    (p) => p.status === 'present' || p.status === 'delegated'
  ).length;

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

    toast.success(`Đã thêm đại biểu ${newName.trim()}`);
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
      setRefusalError('Vui lòng nhập lý do từ chối ký theo quy định Điều 158 Luật DN 2020.');
      toast.warning('Cần nhập lý do từ chối ký');
      return;
    }
    updateParticipant(meeting.id, participantId, {
      refusedSign: true,
      refusalReason: refusalReason.trim(),
      hasSigned: false,
    });
    toast.info('Đã ghi nhận lý do từ chối ký vào biên bản');
    setSelectedParticipantForRefusal(null);
    setRefusalReason('');
    setRefusalError('');
  };

  return (
    <div
      className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-modal-enter flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Quản lý đại biểu, điểm danh & túc số
              </h3>
              <p className="text-[11px] text-slate-500">
                Tuân thủ Điều 141, 148, 158 Luật Doanh nghiệp 2020
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quorum Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Tổng số đại biểu:</span>
            <span className="rounded border border-slate-200 bg-white px-2 py-0.5 font-mono font-semibold text-slate-800">
              {participants.length} người
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-emerald-700">
              Có mặt & Ủy quyền: {presentCount} / {participants.length}
            </span>
          </div>

          {meeting.quorum && (
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                meeting.quorum.isMet
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              {meeting.quorum.isMet ? (
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              )}
              <span>
                Túc số thực tế: {meeting.quorum.actualPercentage}% /{' '}
                {meeting.quorum.requiredPercentage}% ({meeting.quorum.isMet ? 'Đạt' : 'Chưa đạt'})
              </span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Danh sách chi tiết đại biểu
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{showAddForm ? 'Ẩn form thêm' : 'Thêm đại biểu mới'}</span>
            </button>
          </div>

          {showAddForm && (
            <div className="animate-in fade-in space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-semibold text-slate-800">
                Thêm đại biểu tham dự cuộc họp
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Họ và tên..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <input
                  type="email"
                  placeholder="Email..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ParticipantRole)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="member">Thành viên tham dự</option>
                  <option value="chairperson">Chủ tọa</option>
                  <option value="secretary">Thư ký</option>
                  <option value="scrutineer">Ban kiểm phiếu</option>
                  <option value="guest">Khách mời</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <input
                  type="text"
                  placeholder="Chức vụ / Chức danh..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />

                {meeting.type === 'B1_DH_CO_DONG' && (
                  <input
                    type="number"
                    placeholder="Số cổ phần sở hữu..."
                    value={newShares}
                    onChange={(e) =>
                      setNewShares(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                )}

                {meeting.type === 'B3_HD_THANH_VIEN' && (
                  <input
                    type="number"
                    placeholder="Tỷ lệ vốn góp (%)"
                    value={newCapitalRatio}
                    onChange={(e) =>
                      setNewCapitalRatio(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                )}

                {meeting.group === 'D' && (
                  <select
                    value={newAffiliation}
                    onChange={(e) => setNewAffiliation(e.target.value as PartyAffiliation)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
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
                    className="press-subtle cursor-pointer rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
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
                  className="flex flex-col flex-wrap justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300 md:flex-row md:items-center"
                >
                  {/* Left: Info */}
                  <div className="flex min-w-[200px] items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${getAvatarTone(
                        p.name
                      )}`}
                    >
                      {getInitials(p.name)}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            p.role === 'chairperson'
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : p.role === 'secretary'
                              ? 'border-slate-200 bg-slate-100 text-slate-700'
                              : p.role === 'guest'
                              ? 'border-slate-200 bg-slate-50 text-slate-600'
                              : 'border-slate-200 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {formatParticipantRole(p.role)}
                        </span>
                        {p.affiliation && p.affiliation !== 'internal' && (
                          <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                            {p.affiliation === 'party_a' ? 'Bên A' : 'Bên B'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        {p.title} {p.department && `• ${p.department}`}
                      </div>

                      {(p.sharesCount !== undefined || p.capitalRatio !== undefined) && (
                        <div className="flex items-center gap-2 pt-0.5 font-mono text-[11px]">
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
                  </div>

                  {/* Middle: Attendance Selector */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        [
                          { id: 'present', label: 'Có mặt' },
                          { id: 'absent_permitted', label: 'Vắng có phép' },
                          { id: 'absent_unexcused', label: 'Vắng không phép' },
                          { id: 'delegated', label: 'Ủy quyền' },
                          { id: 'late', label: 'Đến muộn' },
                          { id: 'left_early', label: 'Về sớm' },
                        ] as { id: AttendanceStatus; label: string }[]
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleStatusChange(p.id, st.id)}
                          className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                            p.status === st.id
                              ? st.id === 'present'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : st.id === 'delegated'
                                ? 'bg-slate-800 text-white shadow-2xs'
                                : 'bg-rose-700 text-white shadow-2xs'
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
                          className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Signature & Refusal */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSign(p.id, p.hasSigned)}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        p.hasSigned
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={p.hasSigned ? 'Bấm để hủy ký' : 'Xác nhận chữ ký'}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>{p.hasSigned ? 'Đã ký' : 'Chưa ký'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParticipantForRefusal(isSelectedRefusal ? null : p.id);
                        setRefusalReason(p.refusalReason || '');
                        setRefusalError('');
                      }}
                      className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${
                        p.refusedSign
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-rose-700'
                      }`}
                      title="Ghi nhận từ chối ký theo Điều 158 Luật DN"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span>{p.refusedSign ? 'Từ chối ký' : 'Từ chối?'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeParticipant(meeting.id, p.id)}
                      className="cursor-pointer rounded p-1 text-slate-400 transition-colors hover:text-rose-600"
                      title="Xóa khỏi cuộc họp"
                      aria-label="Xóa đại biểu"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Collapsible Refusal reason input */}
                  {isSelectedRefusal && (
                    <div className="w-full space-y-1.5 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Lý do từ chối ký biên bản (Bắt buộc theo Luật Doanh nghiệp)..."
                          value={refusalReason}
                          onChange={(e) => {
                            setRefusalReason(e.target.value);
                            if (refusalError) setRefusalError('');
                          }}
                          className="flex-1 rounded border border-rose-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRefusal(p.id)}
                          className="cursor-pointer rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500"
                        >
                          Lưu lý do
                        </button>
                      </div>
                      {refusalError && (
                        <p className="text-[11px] font-medium text-rose-600">{refusalError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
          <span className="text-xs text-slate-500">
            Dữ liệu điểm danh và túc số được đồng bộ tự động vào biên bản và cơ sở dữ liệu.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="press-subtle cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
          >
            Đóng & Tiếp tục cuộc họp
          </button>
        </div>
      </div>
    </div>
  );
};
