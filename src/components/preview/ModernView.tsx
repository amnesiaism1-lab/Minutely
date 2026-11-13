import React from 'react';
import { Meeting } from '../../types';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface ModernViewProps {
  meeting: Meeting;
}

export const ModernView: React.FC<ModernViewProps> = ({ meeting }) => {
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-4xl mx-auto overflow-hidden p-6 sm:p-10 space-y-8 text-slate-900">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-6 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
            {meeting.code}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            Nhóm {meeting.group} • {meeting.typeName}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60">
            v{meeting.version}
          </span>
          {meeting.contentHash && (
            <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              SHA256: {meeting.contentHash.substring(0, 12)}...
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
          {meeting.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-slate-500" />
            {meeting.date} ({meeting.startTime} - {meeting.endTime})
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-4 h-4 text-slate-500" />
            {meeting.venue} ({meeting.meetingMode === 'online' ? 'Trực tuyến' : meeting.meetingMode === 'hybrid' ? 'Hybrid' : 'Trực tiếp'})
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-slate-500" />
            {meeting.participants.length} Đại biểu
          </span>
        </div>
      </div>

      {/* Quorum Info if present */}
      {meeting.quorum && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            meeting.quorum.isMet
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {meeting.quorum.isMet ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                Kiểm tra túc số tham dự (Quorum Verification)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Đạt <span className="font-semibold">{meeting.quorum.actualPercentage}%</span> trên tổng số cổ phần / vốn có quyền biểu quyết (Yêu cầu luật định: {meeting.quorum.requiredPercentage}%).
              </p>
            </div>
          </div>
          <span
            className={`font-semibold text-xs px-3 py-1 rounded-full uppercase ${
              meeting.quorum.isMet
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {meeting.quorum.isMet ? 'HỢP LỆ' : 'KHÔNG ĐỦ TÚC SỐ'}
          </span>
        </div>
      )}

      {/* Participants Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <Users className="w-4 h-4 text-slate-700" />
          <span>Thành phần tham dự</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {meeting.participants.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="text-[11px] text-slate-500">{p.title || 'Đại biểu'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-700 font-medium uppercase">
                    {p.role === 'chairperson'
                      ? 'Chủ tọa'
                      : p.role === 'secretary'
                      ? 'Thư ký'
                      : p.role === 'guest'
                      ? 'Khách mời'
                      : 'Thành viên'}
                  </span>
                  {p.affiliation && p.affiliation !== 'internal' && (
                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      {p.affiliation === 'party_a' ? 'Bên A' : 'Bên B'}
                    </span>
                  )}
                </div>
                {(p.sharesCount !== undefined || p.capitalRatio !== undefined) && (
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {p.sharesCount !== undefined && `${p.sharesCount.toLocaleString()} CP`}
                    {p.capitalRatio !== undefined && `${p.capitalRatio}% vốn`}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  p.status === 'present'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : p.status === 'delegated'
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.status === 'present'
                  ? 'Có mặt'
                  : p.status === 'delegated'
                  ? 'Ủy quyền'
                  : 'Vắng'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda & Decisions */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Nội dung thảo luận & Quyết nghị</span>
        </h2>

        {meeting.agendaItems.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                  #{idx + 1}
                </span>
                <h3 className="font-semibold text-sm sm:text-base text-slate-900">{item.title}</h3>
              </div>
              {item.durationMinutes && (
                <span className="text-xs font-mono text-slate-500">
                  ⏱️ {item.durationMinutes} phút
                </span>
              )}
            </div>

            {item.description && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Opinions list */}
            {item.opinions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Ý kiến thảo luận ({item.opinions.length}):
                </p>
                <div className="space-y-2 pl-2">
                  {item.opinions.map((op) => (
                    <div
                      key={op.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{op.speakerName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {op.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{op.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision card */}
            {item.decision && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Quyết nghị chính thức
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      item.decision.status === 'agreed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.decision.status === 'disagreed'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {item.decision.status === 'agreed'
                      ? 'Thống nhất'
                      : item.decision.status === 'disagreed'
                      ? 'Bác bỏ'
                      : 'Hoãn lại'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed">
                  {item.decision.content}
                </p>

                {/* Vote stats */}
                {item.decision.vote && (
                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        Tán thành: <strong className="text-emerald-700">{item.decision.vote.inFavor.toLocaleString()}</strong> ({item.decision.vote.ratioPassed}%) | Bác bỏ: {item.decision.vote.against.toLocaleString()} | Không ý kiến: {item.decision.vote.abstain.toLocaleString()}
                      </span>
                      <span
                        className={`font-semibold ${
                          item.decision.vote.isPassed ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.decision.vote.isPassed ? '✓ ĐÃ THÔNG QUA' : '✕ KHÔNG THÔNG QUA'}
                      </span>
                    </div>

                    {item.decision.vote.memberVotes && item.decision.vote.memberVotes.length > 0 && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                        <span className="font-semibold text-slate-700">Biểu quyết từng thành viên (Điều 158 Luật DN): </span>
                        {item.decision.vote.memberVotes.map((mv) => (
                          <span
                            key={mv.participantId}
                            className={`inline-block mr-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              mv.voteChoice === 'in_favor'
                                ? 'bg-emerald-50 text-emerald-700'
                                : mv.voteChoice === 'against'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {mv.participantName}:{' '}
                            {mv.voteChoice === 'in_favor'
                              ? 'Tán thành'
                              : mv.voteChoice === 'against'
                              ? 'Bác bỏ'
                              : 'Không ý kiến'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Items Board Summary */}
      {allActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>Phân công hành động ({allActions.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allActions.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{act.title}</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase border border-slate-200/60">
                    {act.priority}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>👤 <strong>Phụ trách:</strong> {act.ownerName}</p>
                  <p>📅 <strong>Thời hạn:</strong> {act.deadline}</p>
                  <p>🎯 <strong>Đầu ra:</strong> {act.deliverable}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ghi nhận từ chối ký theo Điều 158 */}
      {meeting.participants.some((p) => p.refusedSign) && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Ghi nhận từ chối ký biên bản (Điều 158 Luật Doanh nghiệp):</span>
          </div>
          <div className="pl-5 space-y-0.5">
            {meeting.participants
              .filter((p) => p.refusedSign)
              .map((p) => (
                <p key={p.id}>
                  • <span className="font-semibold">{p.name}</span> ({p.title}): {p.refusalReason}
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">THƯ KÝ CUỘC HỌP</p>
          <div className="h-14 flex items-center justify-center font-mono text-emerald-600 text-xs font-semibold">
            ✓ ĐÃ XÁC NHẬN
          </div>
          <p className="font-semibold text-sm text-slate-900">
            {meeting.signatures.find((s) => s.role === 'secretary')?.signerName || 'Thư ký'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">CHỦ TỌA CUỘC HỌP</p>
          <div className="h-14 flex items-center justify-center font-mono text-emerald-600 text-xs font-semibold">
            ✓ ĐÃ KÝ DUYỆT
          </div>
          <p className="font-semibold text-sm text-slate-900">
            {meeting.signatures.find((s) => s.role === 'chairperson')?.signerName || 'Chủ tọa'}
          </p>
        </div>
      </div>
    </div>
  );
};
