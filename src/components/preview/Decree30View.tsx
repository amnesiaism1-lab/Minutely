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

  return (
    <div className="a4-page bg-white font-decree text-black p-[25mm_20mm_25mm_30mm] max-w-[210mm] min-h-[297mm] mx-auto shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-0 leading-relaxed text-[13pt]">
      {/* 1. Header Thể thức Nghị định 30 */}
      <div className="grid grid-cols-2 gap-4 text-center items-start">
        {/* Bên trái: Tên cơ quan, tổ chức & Số ký hiệu */}
        <div>
          <div className="font-bold text-[12pt] uppercase tracking-normal">
            {meeting.organization.governingBody || meeting.organization.name}
          </div>
          <div className="font-bold text-[12pt] uppercase tracking-normal border-b-2 border-black inline-block pb-0.5 max-w-[85%]">
            {meeting.organization.department || meeting.organization.name}
          </div>
          <div className="text-[12pt] mt-1">
            Số: {meeting.code}
          </div>
        </div>

        {/* Bên phải: Quốc hiệu, Tiêu ngữ & Địa danh ngày tháng */}
        <div>
          <div className="font-bold text-[12pt] uppercase tracking-normal">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </div>
          <div className="font-bold text-[12.5pt] border-b-2 border-black inline-block pb-0.5">
            Độc lập - Tự do - Hạnh phúc
          </div>
          <div className="text-[12pt] italic mt-1.5">
            {meeting.locationCity || 'Hà Nội'}, ngày {day} tháng {month} năm {year}
          </div>
        </div>
      </div>

      {/* 2. Tiêu đề Biên bản */}
      <div className="text-center mt-8 mb-6">
        <h1 className="font-bold text-[15pt] uppercase tracking-wide">
          BIÊN BẢN CUỘC HỌP
        </h1>
        <p className="font-bold text-[13pt] italic mt-1">
          Về việc: {meeting.title}
        </p>
      </div>

      {/* 3. Phần I: Thời gian, địa điểm */}
      <div className="space-y-2 mt-4 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">I. THỜI GIAN VÀ ĐỊA ĐIỂM</h2>
        <div className="pl-4 space-y-1">
          <p>
            <span className="font-bold">• Thời gian:</span> Bắt đầu lúc {meeting.startTime}, kết thúc lúc {meeting.endTime}, ngày {day}/{month}/{year}.
          </p>
          <p>
            <span className="font-bold">• Địa điểm:</span> {meeting.venue} (Hình thức: {meeting.meetingMode === 'online' ? 'Trực tuyến' : meeting.meetingMode === 'hybrid' ? 'Trực tiếp kết hợp trực tuyến' : 'Trực tiếp'}).
          </p>
          {meeting.meetingUrl && (
            <p className="italic text-[11pt]">
              • Đường dẫn họp trực tuyến: {meeting.meetingUrl}
            </p>
          )}
        </div>
      </div>

      {/* 4. Phần II: Thành phần tham dự */}
      <div className="space-y-2 mt-5 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">II. THÀNH PHẦN THAM DỰ</h2>
        <div className="pl-4 space-y-1">
          {meeting.participants.map((p, idx) => (
            <p key={p.id}>
              {idx + 1}. <span className="font-bold">{p.name}</span> - Chức vụ:{' '}
              {p.title || 'Đại biểu'} (
              {p.role === 'chairperson'
                ? 'Chủ tọa'
                : p.role === 'secretary'
                ? 'Thư ký ghi biên bản'
                : 'Thành viên tham dự'}
              ) -{' '}
              <span className="italic">
                {p.status === 'present'
                  ? 'Có mặt'
                  : p.status === 'absent_permitted'
                  ? 'Vắng có phép'
                  : p.status === 'delegated'
                  ? `Ủy quyền cho ${p.delegatedTo}`
                  : 'Vắng mặt'}
              </span>
              {p.sharesCount !== undefined && ` [Cổ phần: ${p.sharesCount.toLocaleString()}]`}
              {p.capitalRatio !== undefined && ` [Tỷ lệ vốn: ${p.capitalRatio}%]`}
            </p>
          ))}

          {/* Quorum Notice if applicable */}
          {meeting.quorum && (
            <p className="mt-2 text-[12pt] font-bold italic bg-slate-50 p-2 border border-slate-200">
              * Kiểm tra túc số tham dự: Đạt {meeting.quorum.actualPercentage}% (Yêu cầu luật định:{' '}
              {meeting.quorum.requiredPercentage}%). Cuộc họp{' '}
              {meeting.quorum.isMet
                ? 'hợp lệ và đủ điều kiện tiến hành ra quyết nghị.'
                : 'không đủ túc số theo quy định pháp luật.'}
            </p>
          )}
        </div>
      </div>

      {/* 5. Phần III: Nội dung và Diễn biến */}
      <div className="space-y-4 mt-5 text-[13pt]">
        <h2 className="font-bold uppercase text-[13pt]">
          III. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP
        </h2>

        {meeting.agendaItems.map((item, idx) => (
          <div key={item.id} className="pl-4 space-y-2">
            <h3 className="font-bold text-[13pt]">
              {idx + 1}. {item.title} {item.durationMinutes ? `(${item.durationMinutes} phút)` : ''}
            </h3>

            {item.description && (
              <p className="italic text-[12pt] pl-4">• Tóm tắt vấn đề: {item.description}</p>
            )}

            {/* Ý kiến thảo luận */}
            {item.opinions.length > 0 && (
              <div className="pl-4 space-y-1 mt-1">
                <p className="font-bold italic">• Tóm tắt ý kiến phát biểu thảo luận:</p>
                {item.opinions.map((op) => (
                  <p key={op.id} className="pl-4">
                    - <span className="font-bold">{op.speakerName}</span> (
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
              <div className="pl-4 mt-2 p-3 bg-slate-50/80 border-l-4 border-black">
                <p>
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
                  <p className="text-[12pt] mt-1 italic">
                    * Kết quả biểu quyết: Tán thành {item.decision.vote.inFavor.toLocaleString()}{' '}
                    phiếu ({item.decision.vote.ratioPassed}%), Không tán thành{' '}
                    {item.decision.vote.against.toLocaleString()} phiếu, Không ý kiến{' '}
                    {item.decision.vote.abstain.toLocaleString()} phiếu. Kết luận:{' '}
                    <span className="font-bold uppercase">
                      {item.decision.vote.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}
                    </span>
                  </p>
                )}

                {/* Bảo lưu ý kiến nếu có */}
                {item.decision.reservedOpinions && item.decision.reservedOpinions.length > 0 && (
                  <div className="text-[11.5pt] text-red-900 mt-1 pl-2 border-l border-red-500">
                    <span className="font-bold">Ghi nhận bảo lưu ý kiến: </span>
                    {item.decision.reservedOpinions.join('; ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 6. Phần IV: Phân công thực hiện (Action Items) */}
      {allActions.length > 0 && (
        <div className="space-y-2 mt-5 text-[13pt]">
          <h2 className="font-bold uppercase text-[13pt]">
            IV. PHÂN CÔNG THỰC HIỆN VÀ TRÁCH NHIỆM GIẢI TRÌNH
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

      {/* 7. Lời kết và cam kết trách nhiệm (Luật Doanh nghiệp 2020) */}
      <div className="mt-6 text-[12pt] italic leading-normal">
        Biên bản này được lập thành 02 bản có giá trị pháp lý như nhau, lưu tại Trụ sở chính công ty và thông báo đến các thành viên có liên quan. Chủ tọa và Thư ký chịu trách nhiệm liên đới về tính trung thực, chính xác của nội dung biên bản theo quy định của pháp luật. Cuộc họp bế mạc vào hồi {meeting.endTime} cùng ngày.
      </div>

      {/* 8. Nơi nhận & Chữ ký (Nghị định 30 Chuẩn) */}
      <div className="grid grid-cols-2 gap-4 mt-8 pt-4 items-start">
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

        {/* Bên phải: Chữ ký Chủ tọa & Thư ký */}
        <div className="grid grid-cols-2 gap-2 text-center">
          {/* Thư ký */}
          <div>
            <div className="font-bold text-[12pt] uppercase">THƯ KÝ</div>
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
            <div className="font-bold text-[12pt] uppercase">CHỦ TỌA</div>
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
        <div className="mt-6 p-3 border border-rose-400 bg-rose-50/50 text-[11pt] text-rose-900 rounded">
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
          Mã băm kiểm tra tính toàn vẹn tài liệu: {meeting.contentHash}
        </div>
      )}
    </div>
  );
};
