import React from 'react';
import { Meeting } from '../../types';

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

  // Phân nhóm thành phần tham dự
  const chairpersons = meeting.participants.filter((p) => p.role === 'chairperson');
  const secretaries = meeting.participants.filter((p) => p.role === 'secretary');
  const scrutineers = meeting.participants.filter((p) => p.role === 'scrutineer');
  const members = meeting.participants.filter((p) => p.role === 'member');
  const guests = meeting.participants.filter((p) => p.role === 'guest');

  const adjournedTime = meeting.archiveDetails?.adjournedAt || meeting.endTime;
  const totalCopies = meeting.archiveDetails?.totalCopies || 2;
  const storageLocs = meeting.archiveDetails?.storageLocations?.join(', ') || 'Văn thư đơn vị và Hồ sơ lưu trữ cuộc họp';

  return (
    <div className="a4-page bg-white font-decree text-black p-[25mm_15mm_20mm_30mm] max-w-[210mm] min-h-[297mm] mx-auto shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 leading-relaxed text-[13pt] selection:bg-slate-200">
      {/* 1. Header Thể thức Nghị định 30/2020/NĐ-CP */}
      <div className="grid grid-cols-2 gap-4 text-center items-start">
        {/* Bên trái: Tên cơ quan, tổ chức & Số ký hiệu */}
        <div>
          {meeting.organization.governingBody && (
            <div className="font-bold text-[11.5pt] uppercase tracking-normal">
              {meeting.organization.governingBody}
            </div>
          )}
          <div className="font-bold text-[12pt] uppercase tracking-normal">
            {meeting.organization.name}
          </div>
          {meeting.organization.department && (
            <div className="font-bold text-[11.5pt] uppercase tracking-normal border-b border-black inline-block pb-0.5 max-w-[85%]">
              {meeting.organization.department}
            </div>
          )}
          <div className="text-[12pt] mt-1 font-normal">
            Số: {meeting.code}
          </div>
        </div>

        {/* Bên phải: Quốc hiệu, Tiêu ngữ & Địa danh ngày tháng */}
        <div>
          <div className="font-bold text-[12pt] uppercase tracking-normal">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div className="font-bold text-[12.5pt] border-b border-black inline-block pb-0.5">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="text-[12pt] italic mt-1.5">
            {meeting.locationCity || 'Hà Nội'}, ngày {day} tháng {month} năm {year}
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề Biên bản */}
      <div className="text-center mt-7 mb-5">
        <h1 className="font-bold text-[15pt] uppercase tracking-wide">
          BIÊN BẢN CUỘC HỌP
        </h1>
        <p className="font-bold text-[13pt] mt-1">
          Về việc: {meeting.title}
        </p>
        {meeting.seriesName && (
          <p className="text-[11pt] italic text-slate-700 mt-0.5">
            (Thuộc chuỗi: {meeting.seriesName} {meeting.sequenceNumber ? `- Kỳ họp thứ ${meeting.sequenceNumber}` : ''})
          </p>
        )}
      </div>

      {/* 3. Phần I: Thời gian và địa điểm */}
      <div className="space-y-2 mt-4 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">I. THỜI GIAN VÀ ĐỊA ĐIỂM</h2>
        <div className="pl-4 space-y-1">
          <p>
            <span className="font-bold">• Thời gian:</span> Khai mạc vào hồi {meeting.startTime}, bế mạc vào hồi {adjournedTime}, ngày {day} tháng {month} năm {year}.
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
            <p className="italic text-[11pt]">
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
      <div className="space-y-2 mt-5 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">II. THÀNH PHẦN THAM DỰ</h2>
        <div className="pl-4 space-y-2">
          {/* Chủ tọa & Thư ký */}
          <div>
            <p className="font-bold underline text-[12.5pt]">1. Chủ tọa và Ban Thư ký:</p>
            <div className="pl-3 space-y-0.5">
              {chairpersons.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ: {p.title || 'Chủ tọa'} (Chủ trì cuộc họp).
                </p>
              ))}
              {secretaries.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ: {p.title || 'Thư ký'} (Thư ký ghi biên bản).
                </p>
              ))}
              {scrutineers.map((p) => (
                <p key={p.id}>
                  - Ông/Bà: <span className="font-bold">{p.name}</span> - Chức vụ: {p.title || 'Ban Kiểm phiếu'} (Giám sát và kiểm phiếu).
                </p>
              ))}
            </div>
          </div>

          {/* Thành viên tham dự */}
          {members.length > 0 && (
            <div>
              <p className="font-bold underline text-[12.5pt]">2. Đại biểu và Thành viên tham dự:</p>
              <div className="pl-3 space-y-0.5">
                {members.map((p, idx) => (
                  <p key={p.id}>
                    {idx + 1}. Ông/Bà <span className="font-bold">{p.name}</span> - Chức vụ: {p.title || 'Thành viên'} - Trạng thái:{' '}
                    <span className="italic">
                      {p.status === 'present'
                        ? 'Có mặt'
                        : p.status === 'absent_permitted'
                        ? 'Vắng có phép'
                        : p.status === 'delegated'
                        ? `Ủy quyền hợp lệ cho ${p.delegatedTo}`
                        : 'Vắng mặt'}
                    </span>
                    {p.sharesCount !== undefined && ` [Cổ phần sở hữu/đại diện: ${p.sharesCount.toLocaleString()}]`}
                    {p.capitalRatio !== undefined && ` [Tỷ lệ vốn góp: ${p.capitalRatio}%]`}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Khách mời nếu có */}
          {guests.length > 0 && (
            <div>
              <p className="font-bold underline text-[12.5pt]">3. Khách mời tham dự:</p>
              <div className="pl-3 space-y-0.5">
                {guests.map((p, idx) => (
                  <p key={p.id}>
                    {idx + 1}. Ông/Bà {p.name} - {p.title} ({p.organizationName || 'Đại biểu khách mời'}).
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Quorum Notice if applicable */}
          {meeting.quorum && (
            <div className="mt-2 text-[12pt] bg-slate-50 p-2.5 border-l-4 border-slate-700 space-y-0.5">
              <p className="font-bold italic">
                * Kiểm tra túc số theo quy định pháp luật và Điều lệ:
              </p>
              <p>
                Tổng số đại biểu có mặt và đại diện ủy quyền hợp lệ đạt{' '}
                <span className="font-bold">{meeting.quorum.actualPercentage}%</span> tổng số cổ phần / vốn có quyền biểu quyết (Ngưỡng yêu cầu luật định: {meeting.quorum.requiredPercentage}%).
              </p>
              <p className="font-semibold italic text-slate-800">
                ➔ Căn cứ quy định, cuộc họp {meeting.quorum.isMet ? 'hợp lệ và đủ điều kiện tiến hành quyết nghị các vấn đề.' : 'không đủ điều kiện túc số để tiến hành theo luật định.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Phần III: Tài liệu & Phụ lục đính kèm cuộc họp */}
      {meeting.attachments && meeting.attachments.length > 0 && (
        <div className="space-y-2 mt-5 text-[13pt] print-avoid-break">
          <h2 className="font-bold uppercase text-[13pt]">
            III. TÀI LIỆU VÀ PHỤ LỤC ĐÍNH KÈM
          </h2>
          <div className="pl-4 space-y-1">
            <p className="italic text-[12pt]">
              Các tài liệu, tờ trình và báo cáo sau đây được gửi trước và lưu kèm theo biên bản này:
            </p>
            {meeting.attachments.map((att, idx) => (
              <p key={att.id} className="pl-2">
                - <span className="font-bold">{att.title}</span>{' '}
                <span className="text-[11pt] italic text-slate-600">
                  [{att.fileType.toUpperCase()}{att.fileSizeKb ? `, ${att.fileSizeKb} KB` : ''}]
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 6. Phần IV: Nội dung và Diễn biến cuộc họp */}
      <div className="space-y-4 mt-5 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">
          {meeting.attachments && meeting.attachments.length > 0 ? 'IV' : 'III'}. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP
        </h2>

        {meeting.agendaItems.map((item, idx) => (
          <div key={item.id} className="pl-4 space-y-2 print-avoid-break">
            <h3 className="font-bold text-[13pt]">
              {idx + 1}. {item.title} {item.durationMinutes ? `(${item.durationMinutes} phút)` : ''}
            </h3>

            {item.presenterName && (
              <p className="italic text-[12pt] pl-4">• Người trình bày / báo cáo: <span className="font-semibold">{item.presenterName}</span></p>
            )}

            {item.description && (
              <p className="text-[12pt] pl-4">• Tóm tắt nội dung vấn đề: {item.description}</p>
            )}

            {/* Ý kiến thảo luận */}
            {item.opinions.length > 0 && (
              <div className="pl-4 space-y-1 mt-1">
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

            {/* Quyết nghị / Kết luận */}
            {item.decision && (
              <div className="pl-4 mt-2 p-3 bg-slate-50/80 border-l-4 border-black space-y-1">
                <p className="text-justify">
                  <span className="font-bold">➔ Quyết nghị / Kết luận: </span>
                  {item.decision.content} (
                  <span className="font-bold italic">
                    {item.decision.status === 'agreed'
                      ? 'Thống nhất thông qua'
                      : item.decision.status === 'disagreed'
                      ? 'Bác bỏ'
                      : 'Hoãn xem xét'}
                  </span>
                  )
                </p>

                {/* Biểu quyết */}
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
                      <p className="text-[11pt] text-slate-700 italic pl-3 mt-0.5">
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

                {/* Bảo lưu ý kiến nếu có */}
                {item.decision.reservedOpinions && item.decision.reservedOpinions.length > 0 && (
                  <div className="text-[11.5pt] text-rose-900 mt-1 pl-2 border-l-2 border-rose-600">
                    <span className="font-bold">Ghi nhận ý kiến bảo lưu: </span>
                    {item.decision.reservedOpinions.join('; ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 7. Phần V: Phân công thực hiện (Action Items) */}
      {allActions.length > 0 && (
        <div className="space-y-2 mt-5 text-[13pt] print-avoid-break">
          <h2 className="font-bold uppercase text-[13pt]">
            {meeting.attachments && meeting.attachments.length > 0 ? 'V' : 'IV'}. PHÂN CÔNG THỰC HIỆN VÀ TRÁCH NHIỆM GIẢI TRÌNH
          </h2>
          <table className="w-full border-collapse border border-black mt-2 text-[11pt]">
            <thead>
              <tr className="bg-slate-100 text-center font-bold">
                <th className="border border-black p-2 w-10">STT</th>
                <th className="border border-black p-2">Nội dung nhiệm vụ</th>
                <th className="border border-black p-2 w-36">Người chủ trì</th>
                <th className="border border-black p-2 w-28">Hạn chót</th>
                <th className="border border-black p-2">Sản phẩm đầu ra (DoD)</th>
              </tr>
            </thead>
            <tbody>
              {allActions.map((act, idx) => (
                <tr key={act.id}>
                  <td className="border border-black p-2 text-center">{idx + 1}</td>
                  <td className="border border-black p-2 font-semibold">{act.title}</td>
                  <td className="border border-black p-2 text-center">{act.ownerName}</td>
                  <td className="border border-black p-2 text-center">{act.deadline}</td>
                  <td className="border border-black p-2">{act.deliverable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. Phần VI: Nghi thức bế mạc và cam kết trách nhiệm */}
      <div className="mt-6 text-[12pt] leading-relaxed text-justify print-avoid-break">
        <p className="italic">
          Biên bản này được lập thành <strong>{totalCopies}</strong> bản có giá trị pháp lý như nhau, lưu tại <strong>{storageLocs}</strong>. Toàn văn nội dung biên bản đã được Thư ký đọc lại công khai cho toàn thể cuộc họp cùng nghe, mọi thành viên tham dự đều nhất trí 100% thông qua, không có ý kiến sửa đổi, bổ sung và cùng thống nhất ký tên xác nhận dưới đây. Chủ tọa và Thư ký chịu trách nhiệm liên đới về tính trung thực, chính xác của nội dung biên bản theo quy định của pháp luật. Cuộc họp bế mạc vào hồi <strong>{adjournedTime}</strong> cùng ngày.
        </p>
      </div>

      {/* 9. Phần VII: Nơi nhận & Chữ ký */}
      <div className="grid grid-cols-2 gap-4 mt-7 pt-2 items-start print-avoid-break">
        {/* Bên trái: Nơi nhận */}
        <div className="text-[11pt] space-y-1">
          <p className="font-bold text-[11.5pt] uppercase border-b border-black inline-block pb-0.5">
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

        {/* Bên phải: Chữ ký Thư ký & Chủ tọa */}
        <div className="grid grid-cols-2 gap-2 text-center">
          {/* Thư ký */}
          <div>
            <div className="font-bold text-[12pt] uppercase">
              {secretarySig?.roleTitle || 'THƯ KÝ'}
            </div>
            <div className="text-[10pt] italic">(Ký, ghi rõ họ tên)</div>
            <div className="h-16 flex items-center justify-center">
              {secretarySig?.signedAt && (
                <div className="text-[9pt] text-emerald-700 border border-emerald-600 px-2 py-0.5 rounded font-mono">
                  ĐÃ KÝ SỐ
                </div>
              )}
            </div>
            <div className="font-bold text-[12pt]">
              {secretarySig?.signerName || 'Trần Thị Thu Hà'}
            </div>
          </div>

          {/* Chủ tọa */}
          <div>
            <div className="font-bold text-[12pt] uppercase">
              {chairpersonSig?.roleTitle || 'CHỦ TỌA'}
            </div>
            <div className="text-[10pt] italic">(Ký, ghi rõ họ tên)</div>
            <div className="h-16 flex items-center justify-center">
              {chairpersonSig?.signedAt && (
                <div className="text-[9pt] text-emerald-700 border border-emerald-600 px-2 py-0.5 rounded font-mono">
                  ĐÃ KÝ SỐ
                </div>
              )}
            </div>
            <div className="font-bold text-[12pt]">
              {chairpersonSig?.signerName || 'Nguyễn Văn Hùng'}
            </div>
          </div>
        </div>
      </div>

      {/* Ghi nhận trường hợp từ chối ký theo Điều 158 */}
      {meeting.participants.some((p) => p.refusedSign) && (
        <div className="mt-5 p-3 border border-rose-400 bg-rose-50/50 text-[11pt] text-rose-900 rounded print-avoid-break">
          <span className="font-bold">Ghi nhận việc từ chối ký theo Điều 158 Luật Doanh nghiệp: </span>
          {meeting.participants
            .filter((p) => p.refusedSign)
            .map((p) => `${p.name} (${p.title}): ${p.refusalReason}`)
            .join(' | ')}
        </div>
      )}

      {/* Content Hash Footer */}
      {meeting.contentHash && (
        <div className="mt-8 pt-2 border-t border-slate-300 text-[9pt] text-slate-500 font-mono text-right print:hidden">
          Mã băm xác thực tính toàn vẹn tài liệu (SHA-256): {meeting.contentHash}
        </div>
      )}
    </div>
  );
};
