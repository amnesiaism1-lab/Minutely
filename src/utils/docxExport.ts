import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  Packer,
} from 'docx';
import { Meeting } from '../types';

export async function exportMeetingToDocx(meeting: Meeting, mode: 'decree30' | 'modern' = 'decree30'): Promise<Blob> {
  const isDecree30 = mode === 'decree30';
  const defaultFont = isDecree30 ? 'Times New Roman' : 'Arial';

  const sections: any[] = [];

  if (isDecree30) {
    // 1. Header Thể thức Nghị định 30
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 45, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: (meeting.organization.governingBody || meeting.organization.name).toUpperCase(),
                      bold: true,
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: meeting.organization.department ? meeting.organization.department.toUpperCase() : '---***---',
                      bold: true,
                      font: defaultFont,
                      size: 20,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Số: ${meeting.code}`,
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 55, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                      bold: true,
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Độc lập - Tự do - Hạnh phúc',
                      bold: true,
                      underline: {},
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${meeting.locationCity || 'Hà Nội'}, ngày ${new Date(meeting.date).getDate()} tháng ${new Date(meeting.date).getMonth() + 1} năm ${new Date(meeting.date).getFullYear()}`,
                      italics: true,
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    sections.push(headerTable);
    sections.push(new Paragraph({ text: '', spacing: { before: 200, after: 200 } }));

    // Title
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'BIÊN BẢN CUỘC HỌP',
            bold: true,
            font: defaultFont,
            size: 28,
          }),
        ],
      })
    );
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Về việc: ${meeting.title}`,
            bold: true,
            italics: true,
            font: defaultFont,
            size: 24,
          }),
        ],
        spacing: { after: 300 },
      })
    );
  } else {
    // Modern Header
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: meeting.title,
            bold: true,
            font: defaultFont,
            size: 32,
          }),
        ],
      })
    );
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Mã cuộc họp: ${meeting.code} | Ngày: ${meeting.date} | Thời gian: ${meeting.startTime} - ${meeting.endTime}`,
            font: defaultFont,
            color: '666666',
            size: 20,
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  // 2. Thông tin chung
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'I. THỜI GIAN VÀ ĐỊA ĐIỂM', bold: true, font: defaultFont, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '- Thời gian: ', bold: true, font: defaultFont, size: 22 }),
        new TextRun({ text: `Bắt đầu lúc ${meeting.startTime}, kết thúc lúc ${meeting.endTime}, ngày ${meeting.date}.`, font: defaultFont, size: 22 }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '- Địa điểm / Hình thức: ', bold: true, font: defaultFont, size: 22 }),
        new TextRun({ text: `${meeting.venue} (${meeting.meetingMode === 'online' ? 'Trực tuyến' : meeting.meetingMode === 'hybrid' ? 'Kết hợp trực tiếp và trực tuyến' : 'Trực tiếp'})`, font: defaultFont, size: 22 }),
      ],
      spacing: { after: 200 },
    })
  );

  // 3. Thành phần tham dự
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'II. THÀNH PHẦN THAM DỰ', bold: true, font: defaultFont, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  meeting.participants.forEach((p) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `• ${p.name}`, bold: true, font: defaultFont, size: 22 }),
          new TextRun({ text: ` - Chức vụ: ${p.title || 'Thành viên'} | Vai trò: ${p.role === 'chairperson' ? 'Chủ tọa' : p.role === 'secretary' ? 'Thư ký' : 'Đại biểu'}`, font: defaultFont, size: 22 }),
          new TextRun({ text: ` [${p.status === 'present' ? 'Có mặt' : p.status === 'absent_permitted' ? 'Vắng có phép' : p.status === 'delegated' ? `Ủy quyền cho ${p.delegatedTo}` : 'Vắng'}]`, italics: true, font: defaultFont, size: 20 }),
        ],
      })
    );
  });

  // Túc số nếu có
  if (meeting.quorum) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `* Kiểm tra túc số: `, bold: true, font: defaultFont, size: 22 }),
          new TextRun({ text: `Đạt ${meeting.quorum.actualPercentage}% (Yêu cầu tối thiểu: ${meeting.quorum.requiredPercentage}%). Cuộc họp ${meeting.quorum.isMet ? 'đủ điều kiện tiến hành hợp lệ.' : 'không đủ túc số theo quy định.'}`, font: defaultFont, size: 22 }),
        ],
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // 4. Nội dung và Diễn biến
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'III. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP', bold: true, font: defaultFont, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  meeting.agendaItems.forEach((item, idx) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}. ${item.title}`, bold: true, font: defaultFont, size: 22 }),
          new TextRun({ text: item.durationMinutes ? ` (${item.durationMinutes} phút)` : '', italics: true, font: defaultFont, size: 20 }),
        ],
        spacing: { before: 150, after: 50 },
      })
    );

    if (item.description) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Mục đích/Bối cảnh: ${item.description}`, font: defaultFont, size: 20, italics: true }),
          ],
        })
      );
    }

    // Ý kiến thảo luận
    if (item.opinions.length > 0) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: 'Ý kiến phát biểu:', bold: true, italics: true, font: defaultFont, size: 20 })],
        })
      );
      item.opinions.forEach((op) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `- ${op.speakerName} (${op.type === 'opinion' ? 'Ý kiến' : op.type === 'counter' ? 'Phản biện' : op.type === 'proposal' ? 'Đề xuất' : 'Làm rõ'}): `, bold: true, font: defaultFont, size: 20 }),
              new TextRun({ text: op.content, font: defaultFont, size: 20 }),
            ],
          })
        );
      });
    }

    // Quyết nghị / Kết luận
    if (item.decision) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: '=> Kết luận & Quyết nghị: ', bold: true, font: defaultFont, size: 22 }),
            new TextRun({ text: item.decision.content, font: defaultFont, size: 22, bold: true }),
            new TextRun({ text: ` [Trạng thái: ${item.decision.status === 'agreed' ? 'Thống nhất' : item.decision.status === 'disagreed' ? 'Chưa thống nhất' : 'Hoãn'}]`, italics: true, font: defaultFont, size: 20 }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      // Biểu quyết nếu có
      if (item.decision.vote) {
        const v = item.decision.vote;
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `* Kết quả biểu quyết: Tán thành ${v.inFavor} phiếu (${v.ratioPassed}%), Không tán thành ${v.against} phiếu, Không ý kiến ${v.abstain} phiếu. Kết quả: ${v.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'}.`, font: defaultFont, size: 20, italics: true }),
            ],
          })
        );
      }
    }
  });

  // 5. Action Items
  const allActions = meeting.agendaItems.flatMap(i => i.actionItems);
  if (allActions.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'IV. PHÂN CÔNG THỰC HIỆN (ACTION ITEMS)', bold: true, font: defaultFont, size: 24 }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    allActions.forEach((act, idx) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. ${act.title}`, bold: true, font: defaultFont, size: 22 }),
            new TextRun({ text: ` | Người chủ trì: ${act.ownerName}`, bold: true, font: defaultFont, size: 22 }),
            new TextRun({ text: ` | Hạn chót: ${act.deadline}`, font: defaultFont, size: 20 }),
            new TextRun({ text: ` | Sản phẩm đầu ra: ${act.deliverable}`, font: defaultFont, size: 20 }),
          ],
        })
      );
    });
  }

  // 6. Chữ ký (Signatures) & Nơi nhận (Decree 30)
  sections.push(new Paragraph({ text: '', spacing: { before: 300, after: 200 } }));

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'THƯ KÝ / NGƯỜI GHI BIÊN BẢN',
                    bold: true,
                    font: defaultFont,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(Ký, ghi rõ họ tên)',
                    italics: true,
                    font: defaultFont,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: meeting.signatures.find(s => s.role === 'secretary')?.signerName || 'Thư ký cuộc họp',
                    bold: true,
                    font: defaultFont,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'CHỦ TỌA CUỘC HỌP',
                    bold: true,
                    font: defaultFont,
                    size: 22,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '(Ký, ghi rõ họ tên)',
                    italics: true,
                    font: defaultFont,
                    size: 18,
                  }),
                ],
              }),
              new Paragraph({ text: '', spacing: { before: 800 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: meeting.signatures.find(s => s.role === 'chairperson')?.signerName || 'Chủ tọa cuộc họp',
                    bold: true,
                    font: defaultFont,
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  sections.push(sigTable);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
