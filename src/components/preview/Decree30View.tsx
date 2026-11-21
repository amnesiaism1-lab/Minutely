import React from 'react';
import { Meeting } from '../../types';
import { formatAttendanceStatus, formatParticipantRole } from '../../utils/uiHelpers';

interface Decree30ViewProps {
  meeting: Meeting;
}

export const Decree30View: React.FC<Decree30ViewProps> = ({ meeting }) => {
  const meetingDate = new Date(meeting.date);
  const day = meetingDate.getDate();
  const month = meetingDate.getMonth() + 1;
  const year = meetingDate.getFullYear();

  const chairpersonSig = meeting.signatures.find((s) => s.role === 'chairperson');
  const secretarySig = meeting.signatures.find((s) => s.role === 'secretary');
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);

  const chairpersons = meeting.participants.filter((p) => p.role === 'chairperson');
  const secretaries = meeting.participants.filter((p) => p.role === 'secretary');
  const scrutineers = meeting.participants.filter((p) => p.role === 'scrutineer');
  const members = meeting.participants.filter((p) => p.role === 'member');
  const guests = meeting.participants.filter((p) => p.role === 'guest');

  const adjournedTime = meeting.archiveDetails?.adjournedAt || meeting.endTime;
  const totalCopies = meeting.archiveDetails?.totalCopies || 2;
  const storageLocs =
    meeting.archiveDetails?.storageLocations?.join(', ') ||
    'Văn thư đơn vị và Hồ sơ lưu trữ cuộc họp';

  const getSignatureStamp = (sigType?: string) => {
    if (sigType === 'digital_cert') return 'ĐÃ KÝ SỐ';
    if (sigType === 'wet_scan') return 'ĐÃ KÝ TƯƠI (LƯU BẢN QUÉT)';
    return 'ĐÃ XÁC NHẬN ĐIỆN TỬ';
  };

  let sectionNum = 1;
  const toRoman = (n: number) =>
    ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] || String(n);

  const secTimeVenue = toRoman(sectionNum++);
  const secParticipants = toRoman(sectionNum++);
  const secAttachments =
    meeting.attachments && meeting.attachments.length > 0 ? toRoman(sectionNum++) : null;
  const secAgenda = toRoman(sectionNum++);
  const secSpecialized =
    meeting.bilateral || meeting.postMortem || meeting.scrumRetro
      ? toRoman(sectionNum++)
      : null;
  const secActions = allActions.length > 0 ? toRoman(sectionNum++) : null;

  return (
    <div className="a4-page font-decree mx-auto min-h-[297mm] max-w-[210mm] border border-slate-300 bg-white p-[20mm_15mm_20mm_30mm] text-[13pt] leading-relaxed text-black shadow-xl selection:bg-slate-200 print:m-0 print:border-none print:p-0 print:shadow-none">
      {/* 1. Header Thể thức Nghị định 30/2020/NĐ-CP */}
      <div className="grid grid-cols-2 items-start gap-4 text-center">
        <div>
          {meeting.organization.governingBody && (
            <div className="text-[11.5pt] font-bold uppercase tracking-normal">
              {meeting.organization.governingBody}
            </div>
          )}
          <div className="text-[12pt] font-bold uppercase tracking-normal">
            {meeting.organization.name}
          </div>
          {meeting.organization.department && (
            <div className="inline-block max-w-[85%] border-b border-black pb-0.5 text-[11.5pt] font-bold uppercase tracking-normal">
              {meeting.organization.department}
            </div>
          )}
          <div className="mt-1 text-[12pt] font-normal">Số: {meeting.code}</div>
        </div>

        <div>
          <div className="text-[12pt] font-bold uppercase tracking-normal">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div className="inline-block border-b border-black pb-0.5 text-[12.5pt] font-bold">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="mt-1.5 text-[12pt] italic">
            {meeting.locationCity || 'Hà Nội'}, ngày {day} tháng {month} năm {year}
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề Biên bản */}
      <div className="mt-7 mb-5 text-center">
        <h1 className="text-[15pt] font-bold uppercase tracking-wide">BIÊN BẢN CUỘC HỌP</h1>
        <p className="mt-1 text-[13pt] font-bold">Về việc: {meeting.title}</p>
        {meeting.isInquorateMinutes && (
          <p className="mt-1 text-[11.5pt] font-bold italic text-rose-900">
            (Biên bản ghi nhận cuộc họp không đủ điều kiện tiến hành theo Điều 145 Luật Doanh nghiệp
            2020)
          </p>
        )}
        {meeting.seriesName && (
          <p className="mt-0.5 text-[11pt] italic text-slate-700">
            (Thuộc chuỗi: {meeting.seriesName}{' '}
            {meeting.sequenceNumber ? `- Kỳ họp thứ ${meeting.sequenceNumber}` : ''})
          </p>
        )}
      </div>

      {/* 3. Phần I: Thời gian, Địa điểm & Thông tin pháp nhân */}
      <div className="mt-4 space-y-2 text-[13pt]">
        <h2 className="text-[13pt] font-bold uppercase">
          {secTimeVenue}. THỜI GIAN, ĐỊA ĐIỂM VÀ THÔNG TIN PHÁP NHÂN
        </h2>
        <div className="space-y-1 pl-4">
          {meeting.organization.enterpriseCode && (
            <p>
              <span className="font-bold">• Mã số doanh nghiệp:</span>{' '}
              {meeting.organization.enterpriseCode}
            </p>
          )}
          {meeting.organization.address && (
            <p>
              <span className="font-bold">• Trụ sở chính:</span> {meeting.organization.address}
            </p>
          )}
          <p>
            <span className="font-bold">• Thời gian:</span> Khai mạc vào hồi {meeting.startTime},
            bế mạc vào hồi {adjournedTime}, ngày {day} tháng {month} năm {year}.
          </p>
          <p>
            <span className="font-bold">• Địa điểm:</span> {meeting.venue} (Hình thức tổ chức:{' '}
            {meeting.meetingMode === 'online'
              ? 'Trực tuyến'
              : meeting.meetingMode === 'hybrid'
              ? 'Trực tiếp kết hợp trực tuyến'
              : 'Trực tiếp'}
            ).
          </p>
          {meeting.meetingUrl && (
            <p className="text-[11pt] italic">
              • Đường dẫn phòng họp trực tuyến: {meeting.meetingUrl}
            </p>
          )}
          {meeting.previousMeetingTitle && (
            <p className="text-[12pt] italic">
              • Liên kết phiên họp kỳ trước: {meeting.previousMeetingTitle}
            </p>
          )}
        </div>
      </div>

      {/* 4. Phần II: Thành phần tham dự */}
      <div className="mt-5 space-y-2 text-[13pt]">
        <h2 className="text-[13pt] font-bold uppercase">{secParticipants}. THÀNH PHẦN THAM DỰ</h2>
        <div className="space-y-2 pl-4">
          <div>
            <p className="text-[12.5pt] font-bold underline">
              1. Chủ tọa, Ban Thư ký và Ban Kiểm phiếu:
            </p>
            <div className="space-y-0.5 pl-3">
              {chairpersons.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ:{' '}
                  {p.title || 'Chủ tọa'} (Chủ trì cuộc họp ·{' '}
                  {formatAttendanceStatus(p.status, p.delegatedTo)}).
                </p>
              ))}
              {secretaries.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ:{' '}
                  {p.title || 'Thư ký'} (Thư ký ghi biên bản ·{' '}
                  {formatAttendanceStatus(p.status, p.delegatedTo)}).
                </p>
              ))}
              {scrutineers.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ:{' '}
                  {p.title || 'Ban Kiểm phiếu'} ({formatParticipantRole(p.role)} ·{' '}
                  {formatAttendanceStatus(p.status, p.delegatedTo)}).
                </p>
              ))}
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <p className="text-[12.5pt] font-bold underline">
                2. Đại biểu và Thành viên tham dự:
              </p>
              <div className="space-y-0.5 pl-3">
                {members.map((p, idx) => (
                  <p key={p.id}>
                    {idx + 1}. Ông/Bà <span className="font-bold">{p.name}</span> - Chức vụ:{' '}
                    {p.title || 'Thành viên'} - Trạng thái:{' '}
                    <span className="italic">
                      {formatAttendanceStatus(p.status, p.delegatedTo)}
                    </span>
                    {p.sharesCount !== undefined &&
                      ` [Cổ phần sở hữu/đại diện: ${p.sharesCount.toLocaleString()}]`}
                    {p.capitalRatio !== undefined && ` [Tỷ lệ vốn góp: ${p.capitalRatio}%]`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {guests.length > 0 && (
            <div>
              <p className="text-[12.5pt] font-bold underline">3. Khách mời tham dự:</p>
              <div className="space-y-0.5 pl-3">
                {guests.map((p, idx) => (
                  <p key={p.id}>
                    {idx + 1}. Ông/Bà {p.name} - {p.title} (
                    {p.organizationName || 'Đại biểu khách mời'} ·{' '}
                    {formatAttendanceStatus(p.status, p.delegatedTo)}).
                  </p>
                ))}
              </div>
            </div>
          )}

          {meeting.quorum && (
            <div className="mt-2 space-y-0.5 border-l-4 border-slate-700 bg-slate-50 p-2.5 text-[12pt]">
              <p className="font-bold italic">
                * Kiểm tra túc số theo quy định pháp luật và Điều lệ:
              </p>
              <p>
                Tổng số đại biểu có mặt và đại diện ủy quyền hợp lệ đạt{' '}
                <span className="font-bold">{meeting.quorum.actualPercentage}%</span> tổng số cổ
                phần / vốn có quyền biểu quyết (Ngưỡng yêu cầu luật định:{' '}
                {meeting.quorum.requiredPercentage}%).
              </p>
              <p className="font-semibold italic text-slate-800">
                ➔ Căn cứ quy định, cuộc họp{' '}
                {meeting.quorum.isMet
                  ? 'hợp lệ và đủ điều kiện tiến hành quyết nghị các vấn đề.'
                  : 'không đủ điều kiện túc số để tiến hành theo luật định.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Phần III (tùy chọn): Tài liệu & Phụ lục đính kèm */}
      {secAttachments && meeting.attachments && (
        <div className="print-avoid-break mt-5 space-y-2 text-[13pt]">
          <h2 className="text-[13pt] font-bold uppercase">
            {secAttachments}. TÀI LIỆU VÀ PHỤ LỤC ĐÍNH KÈM
          </h2>
          <div className="space-y-1 pl-4">
            <p className="text-[12pt] italic">
              Các tài liệu, tờ trình và báo cáo sau đây được gửi trước và lưu kèm theo biên bản này:
            </p>
            {meeting.attachments.map((att) => (
              <p key={att.id} className="pl-2">
                - <span className="font-bold">{att.title}</span>{' '}
                <span className="text-[11pt] italic text-slate-600">
                  [{att.fileType.toUpperCase()}
                  {att.fileSizeKb ? `, ${att.fileSizeKb} KB` : ''}]
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 6. Phần Nội dung và Diễn biến cuộc họp */}
      <div className="mt-5 space-y-4 text-[13pt]">
        <h2 className="text-[13pt] font-bold uppercase">
          {secAgenda}. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP
        </h2>

        {meeting.agendaItems.map((item, idx) => (
          <div key={item.id} className="print-avoid-break space-y-2 pl-4">
            <h3 className="text-[13pt] font-bold">
              {idx + 1}. {item.title}{' '}
              {item.durationMinutes ? `(${item.durationMinutes} phút)` : ''}
            </h3>

            {item.presenterName && (
              <p className="pl-4 text-[12pt] italic">
                • Người trình bày / báo cáo:{' '}
                <span className="font-semibold">{item.presenterName}</span>
              </p>
            )}

            {item.description && (
              <p className="pl-4 text-[12pt]">• Tóm tắt nội dung vấn đề: {item.description}</p>
            )}

            {item.opinions.length > 0 && (
              <div className="mt-1 space-y-1 pl-4">
                <p className="font-bold italic">• Tóm tắt diễn biến ý kiến phát biểu:</p>
                {item.opinions.map((op) => (
                  <p key={op.id} className="pl-4 text-justify">
                    - Ông/Bà <span className="font-bold">{op.speakerName}</span> (
                    {op.type === 'opinion'
                      ? 'Ý kiến'
                      : op.type === 'counter'
                      ? 'Phản biện'
                      : op.type === 'proposal'
                      ? 'Đề xuất'
                      : 'Làm rõ'}
                    ): {op.content}
                  </p>
                ))}
              </div>
            )}

            {item.decision && (
              <div className="mt-2 space-y-1 border-l-4 border-black bg-slate-50/80 p-3 pl-4">
                <p className="text-justify">
                  <span className="font-bold">➔ Quyết nghị / Kết luận: </span>
                  {item.decision.content || 'Hoãn xem xét'}{' '}
                  <span className="font-bold italic">
                    (
                    {item.decision.status === 'agreed'
                      ? 'Thống nhất thông qua'
                      : item.decision.status === 'disagreed'
                      ? 'Bác bỏ'
                      : 'Hoãn xem xét'}
                    )
                  </span>
                </p>

                {item.decision.deferredReason && (
                  <p className="text-[12pt] italic text-slate-800">
                    • Lý do hoãn xem xét: {item.decision.deferredReason}
                  </p>
                )}

                {item.decision.vote && (
                  <div className="mt-1 text-[12pt]">
                    <p className="italic">
                      * Kết quả biểu quyết: Tán thành {item.decision.vote.inFavor.toLocaleString()}{' '}
                      phiếu ({item.decision.vote.ratioPassed}%), Không tán thành{' '}
                      {item.decision.vote.against.toLocaleString()} phiếu, Không ý kiến{' '}
                      {item.decision.vote.abstain.toLocaleString()} phiếu. Kết luận:{' '}
                      <span className="font-bold uppercase">
                        {item.decision.vote.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}
                      </span>
                    </p>
                    {item.decision.vote.memberVotes && item.decision.vote.memberVotes.length > 0 && (
                      <p className="mt-0.5 pl-3 text-[11pt] italic text-slate-700">
                        - Chi tiết biểu quyết từng thành viên (Điều 158 Luật Doanh nghiệp):{' '}
                        {item.decision.vote.memberVotes
                          .map(
                            (mv) =>
                              `${mv.participantName} (${
                                mv.voteChoice === 'in_favor'
                                  ? 'Tán thành'
                                  : mv.voteChoice === 'against'
                                  ? 'Không tán thành'
                                  : 'Không ý kiến'
                              })`
                          )
                          .join('; ')}
                      </p>
                    )}
                  </div>
                )}

                {item.decision.reservedOpinions && item.decision.reservedOpinions.length > 0 && (
                  <div className="mt-1 border-l-2 border-rose-600 pl-2 text-[11.5pt] text-rose-900">
                    <span className="font-bold">Ghi nhận ý kiến bảo lưu: </span>
                    {item.decision.reservedOpinions.join('; ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Khối Chuyên Biệt (Nhóm D Song phương / Nhóm A3-C5 Sự cố / Nhóm C3 Scrum Retro) */}
      {secSpecialized && (
        <div className="print-avoid-break mt-5 space-y-3 text-[13pt]">
          <h2 className="text-[13pt] font-bold uppercase">
            {secSpecialized}. NỘI DUNG NGHIỆP VỤ CHUYÊN BIỆT
          </h2>

          {meeting.bilateral && (
            <div className="space-y-2 pl-4">
              <div className="grid grid-cols-2 gap-3 border border-black p-3 text-[12pt]">
                <div>
                  <p className="font-bold uppercase">ĐẠI DIỆN BÊN A</p>
                  <p className="font-bold">{meeting.bilateral.partyA.companyName}</p>
                  <p>
                    Người đại diện: {meeting.bilateral.partyA.representative} (
                    {meeting.bilateral.partyA.title})
                  </p>
                  {meeting.bilateral.commitmentsA.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="font-bold italic underline">Cam kết thực hiện của Bên A:</p>
                      {meeting.bilateral.commitmentsA.map((c, i) => (
                        <p key={i}>- {c}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-l border-black pl-3">
                  <p className="font-bold uppercase">ĐẠI DIỆN BÊN B</p>
                  <p className="font-bold">{meeting.bilateral.partyB.companyName}</p>
                  <p>
                    Người đại diện: {meeting.bilateral.partyB.representative} (
                    {meeting.bilateral.partyB.title})
                  </p>
                  {meeting.bilateral.commitmentsB.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="font-bold italic underline">Cam kết thực hiện của Bên B:</p>
                      {meeting.bilateral.commitmentsB.map((c, i) => (
                        <p key={i}>- {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {meeting.bilateral.pendingPoints.length > 0 && (
                <div className="text-[12pt]">
                  <p className="font-bold italic">
                    * Các điều khoản còn bảo lưu / chờ xin ý kiến cấp trên:
                  </p>
                  {meeting.bilateral.pendingPoints.map((pt, i) => (
                    <p key={i} className="pl-3">
                      - {pt}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {meeting.postMortem && (
            <div className="space-y-2 pl-4 text-[12pt]">
              <p className="font-bold italic">
                Báo cáo phân tích sự cố (Không quy lỗi cá nhân - Blameless Post-Mortem):
              </p>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="w-44 border border-black bg-slate-100 p-2 font-bold">
                      Mức độ ảnh hưởng
                    </td>
                    <td className="border border-black p-2">{meeting.postMortem.impactLevel}</td>
                    <td className="w-40 border border-black bg-slate-100 p-2 font-bold">
                      Gián đoạn
                    </td>
                    <td className="border border-black p-2">
                      {meeting.postMortem.downtimeMinutes} phút ({meeting.postMortem.startTime} –{' '}
                      {meeting.postMortem.resolvedTime})
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black bg-slate-100 p-2 font-bold">
                      Tóm tắt sự cố
                    </td>
                    <td colSpan={3} className="border border-black p-2">
                      {meeting.postMortem.summary}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black bg-slate-100 p-2 font-bold">
                      Nguyên nhân gốc rễ
                    </td>
                    <td colSpan={3} className="border border-black p-2">
                      {meeting.postMortem.rootCause}
                    </td>
                  </tr>
                </tbody>
              </table>
              {meeting.postMortem.preventionActions.length > 0 && (
                <div>
                  <p className="font-bold">Biện pháp phòng ngừa tái diễn:</p>
                  {meeting.postMortem.preventionActions.map((pa, i) => (
                    <p key={i} className="pl-3">
                      - {pa}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {meeting.scrumRetro && (
            <div className="space-y-2 pl-4 text-[12pt]">
              <p>
                <span className="font-bold">Chu kỳ / Sprint:</span> {meeting.scrumRetro.sprintName}{' '}
                — <span className="italic">Mục tiêu: {meeting.scrumRetro.sprintGoal}</span>
              </p>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="w-1/3 border border-black p-2">Điểm làm tốt</th>
                    <th className="w-1/3 border border-black p-2">Điểm chưa tốt / Tồn tại</th>
                    <th className="w-1/3 border border-black p-2">Hành động cải tiến</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="align-top border border-black p-2">
                      {meeting.scrumRetro.whatWentWell.map((w, i) => (
                        <p key={i}>• {w}</p>
                      ))}
                    </td>
                    <td className="align-top border border-black p-2">
                      {meeting.scrumRetro.whatWentWrong.map((w, i) => (
                        <p key={i}>• {w}</p>
                      ))}
                    </td>
                    <td className="align-top border border-black p-2">
                      {meeting.scrumRetro.actionImprovements.map((w, i) => (
                        <p key={i}>• {w}</p>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Phân công thực hiện (Action Items) */}
      {secActions && (
        <div className="print-avoid-break mt-5 space-y-2 text-[13pt]">
          <h2 className="text-[13pt] font-bold uppercase">
            {secActions}. PHÂN CÔNG THỰC HIỆN VÀ TRÁCH NHIỆM GIẢI TRÌNH
          </h2>
          <table className="mt-2 w-full border-collapse border border-black text-[11pt]">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="w-10 border border-black p-2">STT</th>
                <th className="border border-black p-2">Nội dung nhiệm vụ</th>
                <th className="w-40 border border-black p-2">Chủ trì & Phối hợp</th>
                <th className="w-28 border border-black p-2">Hạn chót</th>
                <th className="border border-black p-2">Sản phẩm đầu ra (DoD)</th>
              </tr>
            </thead>
            <tbody>
              {allActions.map((act, idx) => (
                <tr key={act.id}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 font-semibold">{act.title}</td>
                  <td className="border border-black p-2 text-center">
                    <div className="font-semibold">{act.ownerName}</div>
                    {act.supporterNames && act.supporterNames.length > 0 && (
                      <div className="text-[9.5pt] italic text-slate-700">
                        Phối hợp: {act.supporterNames.join(', ')}
                      </div>
                    )}
                    {act.approverName && (
                      <div className="text-[9.5pt] italic text-slate-700">
                        Duyệt: {act.approverName}
                      </div>
                    )}
                  </td>
                  <td className="border border-black p-2 text-center">{act.deadline}</td>
                  <td className="border border-black p-2">{act.deliverable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kết luận tổng hợp & Cuộc họp kế tiếp */}
      {(meeting.conclusionSummary || meeting.nextMeetingDate) && (
        <div className="print-avoid-break mt-5 space-y-1.5 border-l-4 border-slate-800 bg-slate-50/70 p-3 text-[12pt]">
          {meeting.conclusionSummary && (
            <p className="text-justify">
              <span className="font-bold">Kết luận chung: </span>
              {meeting.conclusionSummary}
            </p>
          )}
          {meeting.nextMeetingDate && (
            <p className="italic">
              <span className="font-bold">Dự kiến phiên họp kế tiếp:</span> ngày{' '}
              {meeting.nextMeetingDate}
              {meeting.nextMeetingAgenda ? ` — Nội dung: ${meeting.nextMeetingAgenda}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Nghi thức bế mạc và cam kết trách nhiệm */}
      <div className="print-avoid-break mt-6 text-justify text-[12pt] leading-relaxed">
        <p className="italic">
          Biên bản này được lập thành <strong>{totalCopies}</strong> bản có giá trị pháp lý như
          nhau, lưu tại <strong>{storageLocs}</strong>. Toàn văn nội dung biên bản đã được Thư ký
          đọc lại công khai cho toàn thể cuộc họp cùng nghe, mọi thành viên tham dự đều nhất trí
          100% thông qua, không có ý kiến sửa đổi, bổ sung và cùng thống nhất ký tên xác nhận dưới
          đây. Chủ tọa và Thư ký chịu trách nhiệm liên đới về tính trung thực, chính xác của nội
          dung biên bản theo quy định của pháp luật. Cuộc họp bế mạc vào hồi{' '}
          <strong>{adjournedTime}</strong> cùng ngày.
        </p>
      </div>

      {/* Nơi nhận & Chữ ký */}
      <div className="print-avoid-break mt-7 grid grid-cols-2 items-start gap-4 pt-2">
        <div className="space-y-1 text-[11pt]">
          <p className="inline-block border-b border-black pb-0.5 text-[11.5pt] font-bold uppercase">
            Nơi nhận:
          </p>
          <div className="pl-1">
            <p className="font-bold">- Như Thành phần tham dự;</p>
            {meeting.distribution?.forAction?.map((fa, i) => (
              <p key={i}>- {fa} (để thực hiện);</p>
            ))}
            {meeting.distribution?.forInfo?.map((fi, i) => (
              <p key={i}>- {fi} (để biết);</p>
            ))}
            <p>- Lưu: VT, Hồ sơ cuộc họp.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-[12pt] font-bold uppercase">
              {secretarySig?.roleTitle || 'THƯ KÝ'}
            </div>
            <div className="text-[10pt] italic">(Ký, ghi rõ họ tên)</div>
            <div className="flex h-16 items-center justify-center">
              {secretarySig?.signedAt && (
                <div className="rounded border border-emerald-600 px-2 py-0.5 font-mono text-[8.5pt] text-emerald-700">
                  {getSignatureStamp(secretarySig.signatureType)}
                </div>
              )}
            </div>
            <div className="text-[12pt] font-bold">
              {secretarySig?.signerName || 'Trần Thị Thu Hà'}
            </div>
          </div>

          <div>
            <div className="text-[12pt] font-bold uppercase">
              {chairpersonSig?.roleTitle || 'CHỦ TỌA'}
            </div>
            <div className="text-[10pt] italic">(Ký, ghi rõ họ tên)</div>
            <div className="flex h-16 items-center justify-center">
              {chairpersonSig?.signedAt && (
                <div className="rounded border border-emerald-600 px-2 py-0.5 font-mono text-[8.5pt] text-emerald-700">
                  {getSignatureStamp(chairpersonSig.signatureType)}
                </div>
              )}
            </div>
            <div className="text-[12pt] font-bold">
              {chairpersonSig?.signerName || 'Nguyễn Văn Hùng'}
            </div>
          </div>
        </div>
      </div>

      {/* Chữ ký Song phương Bên A & Bên B (Nhóm D Đối ngoại) */}
      {meeting.group === 'D' && meeting.bilateral && (
        <div className="print-avoid-break mt-6 grid grid-cols-2 gap-4 border-t border-slate-300 pt-4 text-center">
          <div>
            <div className="text-[11.5pt] font-bold uppercase">ĐẠI DIỆN BÊN A</div>
            <div className="text-[10.5pt] font-semibold">{meeting.bilateral.partyA.companyName}</div>
            <div className="text-[10pt] italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
            <div className="h-14" />
            <div className="text-[11.5pt] font-bold">
              {meeting.bilateral.partyA.representative}
            </div>
          </div>
          <div>
            <div className="text-[11.5pt] font-bold uppercase">ĐẠI DIỆN BÊN B</div>
            <div className="text-[10.5pt] font-semibold">{meeting.bilateral.partyB.companyName}</div>
            <div className="text-[10pt] italic">(Ký, đóng dấu và ghi rõ họ tên)</div>
            <div className="h-14" />
            <div className="text-[11.5pt] font-bold">
              {meeting.bilateral.partyB.representative}
            </div>
          </div>
        </div>
      )}

      {/* Ghi nhận trường hợp từ chối ký theo Điều 158 */}
      {meeting.participants.some((p) => p.refusedSign) && (
        <div className="print-avoid-break mt-5 rounded border border-rose-400 bg-rose-50/50 p-3 text-[11pt] text-rose-900">
          <span className="font-bold">
            Ghi nhận việc từ chối ký theo Điều 158 Luật Doanh nghiệp:{' '}
          </span>
          {meeting.participants
            .filter((p) => p.refusedSign)
            .map((p) => `${p.name} (${p.title}): ${p.refusalReason}`)
            .join(' | ')}
        </div>
      )}

      {/* Content Hash Footer */}
      {meeting.contentHash && (
        <div className="mt-8 border-t border-slate-300 pt-2 text-right font-mono text-[9pt] text-slate-500 print:hidden">
          Mã băm xác thực tính toàn vẹn tài liệu (SHA-256): {meeting.contentHash}
        </div>
      )}
    </div>
  );
};
