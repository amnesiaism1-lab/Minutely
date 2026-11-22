import React from 'react';
import { Meeting } from '../../types';
import {
  GROUP_META,
  OPINION_TYPE_META,
  PRIORITY_META,
  formatAttendanceStatus,
  formatParticipantRole,
} from '../../utils/uiHelpers';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Paperclip,
  Link2,
  Archive,
  Clock,
  User,
  Target,
  Building2,
  Handshake,
  AlertTriangle,
  Repeat,
} from 'lucide-react';

interface ModernViewProps {
  meeting: Meeting;
}

export const ModernView: React.FC<ModernViewProps> = ({ meeting }) => {
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);
  const groupMeta = GROUP_META[meeting.group] || GROUP_META.A;

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xl">
      {/* Executive Masthead Header */}
      <div className="space-y-3.5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-7 text-white print:border-b print:border-slate-300 print:bg-none print:bg-white print:text-slate-900 sm:px-10 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold text-white print:border-slate-300 print:bg-slate-100 print:text-slate-800">
            {meeting.code}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/35 bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-100 print:border-slate-300 print:bg-slate-100 print:text-slate-700">
            <span className={`h-1.5 w-1.5 rounded-full ${groupMeta.dotClass}`} />
            Nhóm {meeting.group} • {meeting.typeName}
          </span>
          <span className="rounded border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-200 print:border-slate-300 print:bg-slate-50 print:text-slate-600">
            v{meeting.version}
          </span>
          {meeting.isInquorateMinutes && (
            <span className="rounded-md border border-rose-400/40 bg-rose-500/25 px-2.5 py-0.5 text-xs font-semibold text-rose-100 print:border-rose-200 print:bg-rose-50 print:text-rose-800">
              BB Họp không thành (Điều 145 Luật DN)
            </span>
          )}
          {meeting.contentHash && (
            <span className="rounded border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-xs text-emerald-200 print:border-slate-200 print:bg-slate-50 print:text-slate-600">
              SHA256: {meeting.contentHash.substring(0, 12)}...
            </span>
          )}
          {meeting.seriesName && (
            <span className="flex items-center gap-1 rounded border border-sky-400/35 bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-100 print:border-blue-200 print:bg-blue-50 print:text-blue-800">
              <Link2 className="h-3 w-3" />
              <span>
                {meeting.seriesName} {meeting.sequenceNumber ? `(#${meeting.sequenceNumber})` : ''}
              </span>
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight tracking-tight text-white print:text-slate-900 sm:text-3xl">
          {meeting.title}
        </h1>

        {(meeting.organization.name || meeting.organization.enterpriseCode) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-100/90 print:text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white print:text-slate-800">
              <Building2 className="h-3.5 w-3.5 text-indigo-300 print:text-slate-400" />
              {meeting.organization.name}
            </span>
            {meeting.organization.enterpriseCode && (
              <span className="font-mono text-[11px] text-slate-300 print:text-slate-500">
                MSDN: {meeting.organization.enterpriseCode}
              </span>
            )}
            {meeting.organization.address && (
              <span className="text-[11px] text-slate-300 print:text-slate-500">
                Trụ sở: {meeting.organization.address}
              </span>
            )}
          </div>
        )}

        {meeting.previousMeetingTitle && (
          <p className="flex items-center gap-1.5 text-xs text-slate-300 print:text-slate-500">
            <span className="font-semibold text-white print:text-slate-700">Kỳ trước:</span>
            <span>{meeting.previousMeetingTitle}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs text-slate-200 print:border-slate-200 print:text-slate-600">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="h-4 w-4 text-indigo-300 print:text-slate-500" />
            {meeting.date} ({meeting.startTime} -{' '}
            {meeting.archiveDetails?.adjournedAt || meeting.endTime})
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-4 w-4 text-indigo-300 print:text-slate-500" />
            {meeting.venue} (
            {meeting.meetingMode === 'online'
              ? 'Trực tuyến'
              : meeting.meetingMode === 'hybrid'
              ? 'Hybrid'
              : 'Trực tiếp'}
            )
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="h-4 w-4 text-indigo-300 print:text-slate-500" />
            {meeting.participants.length} Đại biểu
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="space-y-8 p-6 sm:p-10">

      {/* Quorum Info */}
      {meeting.quorum && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 ${
            meeting.quorum.isMet
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {meeting.quorum.isMet ? (
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-6 w-6 shrink-0 text-rose-600" />
            )}
            <div>
              <h4 className="text-sm font-semibold">
                Kiểm tra túc số tham dự (Quorum Verification)
              </h4>
              <p className="mt-0.5 text-xs text-slate-600">
                Đạt <span className="font-semibold">{meeting.quorum.actualPercentage}%</span> trên
                tổng số cổ phần / vốn có quyền biểu quyết (Yêu cầu luật định:{' '}
                {meeting.quorum.requiredPercentage}%).
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              meeting.quorum.isMet ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {meeting.quorum.isMet ? 'HỢP LỆ' : 'KHÔNG ĐỦ TÚC SỐ'}
          </span>
        </div>
      )}

      {/* Participants Grid */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
          <Users className="h-4 w-4 text-slate-700" />
          <span>Thành phần tham dự</span>
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {meeting.participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{p.name}</p>
                <p className="truncate text-[11px] text-slate-500">{p.title || 'Đại biểu'}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase text-slate-700">
                    {formatParticipantRole(p.role)}
                  </span>
                  {p.affiliation && p.affiliation !== 'internal' && (
                    <span className="rounded border border-amber-200 bg-amber-50 px-1 py-0.2 text-[9px] font-semibold text-amber-800">
                      {p.affiliation === 'party_a' ? 'Bên A' : 'Bên B'}
                    </span>
                  )}
                </div>
                {(p.sharesCount !== undefined || p.capitalRatio !== undefined) && (
                  <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                    {p.sharesCount !== undefined && `${p.sharesCount.toLocaleString()} CP`}
                    {p.capitalRatio !== undefined && `${p.capitalRatio}% vốn`}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  p.status === 'present'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : p.status === 'delegated' || p.status === 'late' || p.status === 'left_early'
                    ? 'border border-slate-200 bg-slate-100 text-slate-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.status === 'delegated' ? 'Ủy quyền' : formatAttendanceStatus(p.status, p.delegatedTo)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda & Decisions */}
      <div className="space-y-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
          <FileText className="h-4 w-4 text-slate-700" />
          <span>Nội dung thảo luận & Quyết nghị</span>
        </h2>

        {meeting.agendaItems.map((item, idx) => (
          <div
            key={item.id}
            className="space-y-4 rounded-2xl border border-slate-200 p-5 transition-colors hover:border-slate-300"
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
                  #{idx + 1}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{item.title}</h3>
              </div>
              {item.durationMinutes && (
                <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {item.durationMinutes} phút
                </span>
              )}
            </div>

            {item.description && (
              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                {item.description}
              </p>
            )}

            {item.opinions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Ý kiến thảo luận ({item.opinions.length}):
                </p>
                <div className="space-y-2 pl-2">
                  {item.opinions.map((op) => {
                    const opMeta = OPINION_TYPE_META[op.type] || OPINION_TYPE_META.opinion;
                    return (
                      <div
                        key={op.id}
                        className={`space-y-1 rounded-xl border border-slate-200/70 border-l-4 ${opMeta.borderLeftClass} bg-slate-50/70 p-3 text-xs`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{op.speakerName}</span>
                            <span className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${opMeta.badgeClass}`}>
                              {opMeta.label}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {op.timestamp}
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-600">{op.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {item.decision && (
              <div className="space-y-2 rounded-xl border border-indigo-100 border-l-4 border-l-indigo-600 bg-indigo-50/35 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                    Quyết nghị chính thức
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      item.decision.status === 'agreed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : item.decision.status === 'disagreed'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {item.decision.status === 'agreed'
                      ? 'Thống nhất'
                      : item.decision.status === 'disagreed'
                      ? 'Bác bỏ'
                      : 'Hoãn lại'}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-900 sm:text-sm">
                  {item.decision.content}
                </p>
                {item.decision.deferredReason && (
                  <p className="text-xs italic text-amber-800">
                    Lý do hoãn: {item.decision.deferredReason}
                  </p>
                )}

                {item.decision.vote && (
                  <div className="space-y-1.5 border-t border-slate-200 pt-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        Tán thành:{' '}
                        <strong className="text-emerald-700">
                          {item.decision.vote.inFavor.toLocaleString()}
                        </strong>{' '}
                        ({item.decision.vote.ratioPassed}%) | Bác bỏ:{' '}
                        {item.decision.vote.against.toLocaleString()} | Không ý kiến:{' '}
                        {item.decision.vote.abstain.toLocaleString()}
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
                      <div className="rounded border border-slate-200 bg-white p-2 text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">
                          Biểu quyết từng thành viên (Điều 158 Luật DN):{' '}
                        </span>
                        {item.decision.vote.memberVotes.map((mv) => (
                          <span
                            key={mv.participantId}
                            className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
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

                {item.decision.reservedOpinions && item.decision.reservedOpinions.length > 0 && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-xs text-rose-900">
                    <span className="font-semibold">Bảo lưu ý kiến: </span>
                    {item.decision.reservedOpinions.join('; ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Specialized Blocks */}
      {meeting.bilateral && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
            <Handshake className="h-4 w-4 text-slate-700" />
            <span>Cam kết song phương (Bên A & Bên B)</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
              <p className="font-bold text-slate-900">BÊN A: {meeting.bilateral.partyA.companyName}</p>
              <p className="text-slate-600">
                Đại diện: {meeting.bilateral.partyA.representative} ({meeting.bilateral.partyA.title})
              </p>
              <ul className="list-disc space-y-1 pl-4 text-slate-700">
                {meeting.bilateral.commitmentsA.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
              <p className="font-bold text-slate-900">BÊN B: {meeting.bilateral.partyB.companyName}</p>
              <p className="text-slate-600">
                Đại diện: {meeting.bilateral.partyB.representative} ({meeting.bilateral.partyB.title})
              </p>
              <ul className="list-disc space-y-1 pl-4 text-slate-700">
                {meeting.bilateral.commitmentsB.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          {meeting.bilateral.pendingPoints.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900">
              <span className="font-semibold">Điểm chờ thống nhất: </span>
              {meeting.bilateral.pendingPoints.join('; ')}
            </div>
          )}
        </div>
      )}

      {meeting.postMortem && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Phân tích sự cố (Blameless Post-Mortem)</span>
          </h2>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">
                {meeting.postMortem.impactLevel}
              </span>
              <span className="text-slate-600">
                Gián đoạn: <strong>{meeting.postMortem.downtimeMinutes} phút</strong> (
                {meeting.postMortem.startTime} – {meeting.postMortem.resolvedTime})
              </span>
            </div>
            <p className="text-slate-800">
              <strong>Tóm tắt:</strong> {meeting.postMortem.summary}
            </p>
            <p className="text-slate-800">
              <strong>Nguyên nhân gốc rễ:</strong> {meeting.postMortem.rootCause}
            </p>
            {meeting.postMortem.preventionActions.length > 0 && (
              <div className="pt-1">
                <strong>Phòng ngừa tái diễn:</strong>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-700">
                  {meeting.postMortem.preventionActions.map((pa, i) => (
                    <li key={i}>{pa}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {meeting.scrumRetro && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
            <Repeat className="h-4 w-4 text-emerald-600" />
            <span>Sprint Retrospective — {meeting.scrumRetro.sprintName}</span>
          </h2>
          <p className="text-xs text-slate-600">
            <strong>Mục tiêu:</strong> {meeting.scrumRetro.sprintGoal}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs">
              <p className="mb-1.5 font-semibold text-emerald-900">Làm tốt</p>
              <ul className="list-disc space-y-1 pl-4 text-emerald-800">
                {meeting.scrumRetro.whatWentWell.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-xs">
              <p className="mb-1.5 font-semibold text-rose-900">Chưa tốt</p>
              <ul className="list-disc space-y-1 pl-4 text-rose-800">
                {meeting.scrumRetro.whatWentWrong.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-xs">
              <p className="mb-1.5 font-semibold text-sky-900">Hành động cải tiến</p>
              <ul className="list-disc space-y-1 pl-4 text-sky-800">
                {meeting.scrumRetro.actionImprovements.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Action Items Board Summary */}
      {allActions.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-slate-700" />
            <span>Phân công hành động ({allActions.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allActions.map((act) => {
              const priorityMeta = PRIORITY_META[act.priority] || PRIORITY_META.medium;
              return (
                <div
                  key={act.id}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{act.title}</span>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        <strong>Phụ trách:</strong> {act.ownerName}
                        {act.supporterNames && act.supporterNames.length > 0
                          ? ` (Phối hợp: ${act.supporterNames.join(', ')})`
                          : ''}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        <strong>Thời hạn:</strong> {act.deadline}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        <strong>Đầu ra:</strong> {act.deliverable}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments Section */}
      {meeting.attachments && meeting.attachments.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-900">
            <Paperclip className="h-4 w-4 text-slate-700" />
            <span>Tài liệu & Phụ lục đính kèm ({meeting.attachments.length})</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {meeting.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs transition-colors hover:bg-slate-100/70"
              >
                <div className="flex min-w-0 items-center gap-2.5 pr-2">
                  <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-800">
                    {att.fileType}
                  </span>
                  <span className="truncate font-medium text-slate-900" title={att.title}>
                    {att.title}
                  </span>
                </div>
                {att.fileSizeKb && (
                  <span className="shrink-0 font-mono text-[11px] text-slate-500">
                    {att.fileSizeKb} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conclusion & Next Meeting */}
      {(meeting.conclusionSummary || meeting.nextMeetingDate) && (
        <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-800">
          {meeting.conclusionSummary && (
            <p className="leading-relaxed">
              <strong>Kết luận chung:</strong> {meeting.conclusionSummary}
            </p>
          )}
          {meeting.nextMeetingDate && (
            <p className="text-slate-600">
              <strong>Cuộc họp tiếp theo:</strong> {meeting.nextMeetingDate}
              {meeting.nextMeetingAgenda ? ` — ${meeting.nextMeetingAgenda}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Archive & Adjournment Section */}
      {meeting.archiveDetails && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Archive className="h-4 w-4 text-slate-600" />
            <span>Nghi thức bế mạc & Hồ sơ lưu trữ:</span>
          </div>
          <div className="grid grid-cols-1 gap-3 pl-6 text-[11px] text-slate-600 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-slate-700">Giờ bế mạc thực tế:</span>{' '}
              {meeting.archiveDetails.adjournedAt || meeting.endTime}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Số bản lập:</span>{' '}
              {meeting.archiveDetails.totalCopies} bản gốc
            </div>
            <div>
              <span className="font-semibold text-slate-700">Nơi lưu trữ:</span>{' '}
              {meeting.archiveDetails.storageLocations.join(', ')}
            </div>
          </div>
          {meeting.archiveDetails.approvedWithoutObjection && (
            <p className="pl-6 text-[11px] font-medium italic text-emerald-700">
              ✓ Toàn văn biên bản đã được đọc công khai và nhất trí thông qua 100% trước khi bế mạc.
            </p>
          )}
        </div>
      )}

      {/* Ghi nhận từ chối ký theo Điều 158 */}
      {meeting.participants.some((p) => p.refusedSign) && (
        <div className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Ghi nhận từ chối ký biên bản (Điều 158 Luật Doanh nghiệp):</span>
          </div>
          <div className="space-y-0.5 pl-5">
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
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-6 text-center">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">THƯ KÝ CUỘC HỌP</p>
          <div className="flex h-14 items-center justify-center font-mono text-xs font-semibold text-emerald-600">
            {meeting.signatures.find((s) => s.role === 'secretary')?.signedAt
              ? '✓ ĐÃ XÁC NHẬN'
              : 'CHỜ XÁC NHẬN'}
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {meeting.signatures.find((s) => s.role === 'secretary')?.signerName || 'Thư ký'}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">CHỦ TỌA CUỘC HỌP</p>
          <div className="flex h-14 items-center justify-center font-mono text-xs font-semibold text-emerald-600">
            {meeting.signatures.find((s) => s.role === 'chairperson')?.signedAt
              ? '✓ ĐÃ KÝ DUYỆT'
              : 'CHỜ PHÊ DUYỆT'}
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {meeting.signatures.find((s) => s.role === 'chairperson')?.signerName || 'Chủ tọa'}
          </p>
        </div>
      </div>

      {meeting.group === 'D' && meeting.bilateral && (
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-center">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">ĐẠI DIỆN BÊN A</p>
            <p className="text-[11px] text-slate-500">{meeting.bilateral.partyA.companyName}</p>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {meeting.bilateral.partyA.representative}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">ĐẠI DIỆN BÊN B</p>
            <p className="text-[11px] text-slate-500">{meeting.bilateral.partyB.companyName}</p>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {meeting.bilateral.partyB.representative}
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
