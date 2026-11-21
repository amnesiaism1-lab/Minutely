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
import { formatAttendanceStatus, formatParticipantRole } from './uiHelpers';

export async function exportMeetingToDocx(
  meeting: Meeting,
  mode: 'decree30' | 'modern' = 'decree30'
): Promise<Blob> {
  const isDecree30 = mode === 'decree30';
  const defaultFont = isDecree30 ? 'Times New Roman' : 'Arial';

  const sections: any[] = [];
  const adjournedTime = meeting.archiveDetails?.adjournedAt || meeting.endTime;

  if (isDecree30) {
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
                      text: (
                        meeting.organization.governingBody || meeting.organization.name
                      ).toUpperCase(),
                      bold: true,
                      font: defaultFont,
                      size: 22,
                    }),
                  ],
                }),
                ...(meeting.organization.governingBody
                  ? [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: meeting.organization.name.toUpperCase(),
                            bold: true,
                            font: defaultFont,
                            size: 22,
                          }),
                        ],
                      }),
                    ]
                  : []),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: meeting.organization.department
                        ? meeting.organization.department.toUpperCase()
                        : '---***---',
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
                      text: `${meeting.locationCity || 'Hà Nội'}, ngày ${new Date(
                        meeting.date
                      ).getDate()} tháng ${
                        new Date(meeting.date).getMonth() + 1
                      } năm ${new Date(meeting.date).getFullYear()}`,
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
        spacing: { after: meeting.isInquorateMinutes ? 80 : 300 },
      })
    );
    if (meeting.isInquorateMinutes) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: '(Biên bản ghi nhận cuộc họp không đủ điều kiện tiến hành theo Điều 145 Luật Doanh nghiệp 2020)',
              bold: true,
              italics: true,
              font: defaultFont,
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );
    }
  } else {
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
            text: `Mã cuộc họp: ${meeting.code} | Ngày: ${meeting.date} | Thời gian: ${meeting.startTime} - ${adjournedTime}`,
            font: defaultFont,
            color: '666666',
            size: 20,
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  let secIdx = 1;
  const toRoman = (n: number) =>
    ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n] || String(n);

  // I. Thời gian, địa điểm & pháp nhân
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${toRoman(secIdx++)}. THỜI GIAN, ĐỊA ĐIỂM VÀ THÔNG TIN PHÁP NHÂN`,
          bold: true,
          font: defaultFont,
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );
  if (meeting.organization.enterpriseCode) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: '- Mã số doanh nghiệp: ', bold: true, font: defaultFont, size: 22 }),
          new TextRun({ text: meeting.organization.enterpriseCode, font: defaultFont, size: 22 }),
        ],
      })
    );
  }
  if (meeting.organization.address) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: '- Trụ sở chính: ', bold: true, font: defaultFont, size: 22 }),
          new TextRun({ text: meeting.organization.address, font: defaultFont, size: 22 }),
        ],
      })
    );
  }
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '- Thời gian: ', bold: true, font: defaultFont, size: 22 }),
        new TextRun({
          text: `Khai mạc lúc ${meeting.startTime}, bế mạc lúc ${adjournedTime}, ngày ${meeting.date}.`,
          font: defaultFont,
          size: 22,
        }),
      ],
    })
  );
  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: '- Địa điểm / Hình thức: ', bold: true, font: defaultFont, size: 22 }),
        new TextRun({
          text: `${meeting.venue} (${
            meeting.meetingMode === 'online'
              ? 'Trực tuyến'
              : meeting.meetingMode === 'hybrid'
              ? 'Kết hợp trực tiếp và trực tuyến'
              : 'Trực tiếp'
          })`,
          font: defaultFont,
          size: 22,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // II. Thành phần tham dự
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${toRoman(secIdx++)}. THÀNH PHẦN THAM DỰ`,
          bold: true,
          font: defaultFont,
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  meeting.participants.forEach((p) => {
    const sharesText =
      p.sharesCount !== undefined ? ` | Cổ phần: ${p.sharesCount.toLocaleString()}` : '';
    const capText = p.capitalRatio !== undefined ? ` | Vốn góp: ${p.capitalRatio}%` : '';

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `• ${p.name}`, bold: true, font: defaultFont, size: 22 }),
          new TextRun({
            text: ` - Chức vụ: ${p.title || 'Thành viên'} | Vai trò: ${formatParticipantRole(
              p.role
            )}${sharesText}${capText}`,
            font: defaultFont,
            size: 22,
          }),
          new TextRun({
            text: ` [${formatAttendanceStatus(p.status, p.delegatedTo)}]`,
            italics: true,
            font: defaultFont,
            size: 20,
          }),
        ],
      })
    );
  });

  if (meeting.quorum) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `* Kiểm tra túc số: `, bold: true, font: defaultFont, size: 22 }),
          new TextRun({
            text: `Đạt ${meeting.quorum.actualPercentage}% (Yêu cầu tối thiểu: ${
              meeting.quorum.requiredPercentage
            }%). Cuộc họp ${
              meeting.quorum.isMet
                ? 'đủ điều kiện tiến hành hợp lệ.'
                : 'không đủ túc số theo quy định.'
            }`,
            font: defaultFont,
            size: 22,
          }),
        ],
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // Tài liệu đính kèm (nếu có)
  if (meeting.attachments && meeting.attachments.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${toRoman(secIdx++)}. TÀI LIỆU VÀ PHỤ LỤC ĐÍNH KÈM`,
            bold: true,
            font: defaultFont,
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );
    meeting.attachments.forEach((att) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `- ${att.title} [${att.fileType.toUpperCase()}${
                att.fileSizeKb ? `, ${att.fileSizeKb} KB` : ''
              }]`,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
    });
  }

  // Nội dung và diễn biến
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${toRoman(secIdx++)}. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP`,
          bold: true,
          font: defaultFont,
          size: 24,
        }),
      ],
      spacing: { before: 200, after: 100 },
    })
  );

  meeting.agendaItems.forEach((item, idx) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${idx + 1}. ${item.title}`,
            bold: true,
            font: defaultFont,
            size: 22,
          }),
          new TextRun({
            text: item.durationMinutes ? ` (${item.durationMinutes} phút)` : '',
            italics: true,
            font: defaultFont,
            size: 20,
          }),
        ],
        spacing: { before: 150, after: 50 },
      })
    );

    if (item.description) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Mục đích/Bối cảnh: ${item.description}`,
              font: defaultFont,
              size: 20,
              italics: true,
            }),
          ],
        })
      );
    }

    if (item.opinions.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Ý kiến phát biểu:',
              bold: true,
              italics: true,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
      item.opinions.forEach((op) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `- ${op.speakerName} (${
                  op.type === 'opinion'
                    ? 'Ý kiến'
                    : op.type === 'counter'
                    ? 'Phản biện'
                    : op.type === 'proposal'
                    ? 'Đề xuất'
                    : 'Làm rõ'
                }): `,
                bold: true,
                font: defaultFont,
                size: 20,
              }),
              new TextRun({ text: op.content, font: defaultFont, size: 20 }),
            ],
          })
        );
      });
    }

    if (item.decision) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '=> Kết luận & Quyết nghị: ',
              bold: true,
              font: defaultFont,
              size: 22,
            }),
            new TextRun({
              text: item.decision.content || 'Hoãn xem xét',
              font: defaultFont,
              size: 22,
              bold: true,
            }),
            new TextRun({
              text: ` [Trạng thái: ${
                item.decision.status === 'agreed'
                  ? 'Thống nhất'
                  : item.decision.status === 'disagreed'
                  ? 'Chưa thống nhất'
                  : 'Hoãn'
              }]`,
              italics: true,
              font: defaultFont,
              size: 20,
            }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );

      if (item.decision.deferredReason) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `* Lý do hoãn xem xét: ${item.decision.deferredReason}`,
                font: defaultFont,
                size: 20,
                italics: true,
              }),
            ],
          })
        );
      }

      if (item.decision.vote) {
        const v = item.decision.vote;
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `* Kết quả biểu quyết: Tán thành ${v.inFavor.toLocaleString()} phiếu (${
                  v.ratioPassed
                }%), Không tán thành ${v.against.toLocaleString()} phiếu, Không ý kiến ${v.abstain.toLocaleString()} phiếu. Kết quả: ${
                  v.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG THÔNG QUA'
                }.`,
                font: defaultFont,
                size: 20,
                italics: true,
              }),
            ],
          })
        );
      }

      if (item.decision.reservedOpinions && item.decision.reservedOpinions.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `* Ý kiến bảo lưu: ${item.decision.reservedOpinions.join('; ')}`,
                font: defaultFont,
                size: 20,
                bold: true,
              }),
            ],
          })
        );
      }
    }
  });

  // Khối nghiệp vụ chuyên biệt
  if (meeting.bilateral || meeting.postMortem || meeting.scrumRetro) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${toRoman(secIdx++)}. NỘI DUNG NGHIỆP VỤ CHUYÊN BIỆT`,
            bold: true,
            font: defaultFont,
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    if (meeting.bilateral) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• Bên A: ${meeting.bilateral.partyA.companyName} — Đại diện: ${meeting.bilateral.partyA.representative} (${meeting.bilateral.partyA.title})`,
              bold: true,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
      meeting.bilateral.commitmentsA.forEach((c) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  - Cam kết Bên A: ${c}`, font: defaultFont, size: 20 })],
          })
        );
      });
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• Bên B: ${meeting.bilateral.partyB.companyName} — Đại diện: ${meeting.bilateral.partyB.representative} (${meeting.bilateral.partyB.title})`,
              bold: true,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
      meeting.bilateral.commitmentsB.forEach((c) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  - Cam kết Bên B: ${c}`, font: defaultFont, size: 20 })],
          })
        );
      });
      if (meeting.bilateral.pendingPoints.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• Các điểm chờ thống nhất: ${meeting.bilateral.pendingPoints.join('; ')}`,
                italics: true,
                font: defaultFont,
                size: 20,
              }),
            ],
          })
        );
      }
    }

    if (meeting.postMortem) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• Phân tích sự cố (${meeting.postMortem.impactLevel} | Gián đoạn ${meeting.postMortem.downtimeMinutes} phút): ${meeting.postMortem.summary}`,
              font: defaultFont,
              size: 20,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `• Nguyên nhân gốc rễ (Blameless): ${meeting.postMortem.rootCause}`,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
      meeting.postMortem.preventionActions.forEach((pa) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  - Phòng ngừa: ${pa}`, font: defaultFont, size: 20 })],
          })
        );
      });
    }

    if (meeting.scrumRetro) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• Sprint Retrospective (${meeting.scrumRetro.sprintName}): ${meeting.scrumRetro.sprintGoal}`,
              bold: true,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
      meeting.scrumRetro.whatWentWell.forEach((w) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  + Làm tốt: ${w}`, font: defaultFont, size: 20 })],
          })
        );
      });
      meeting.scrumRetro.whatWentWrong.forEach((w) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  - Chưa tốt: ${w}`, font: defaultFont, size: 20 })],
          })
        );
      });
      meeting.scrumRetro.actionImprovements.forEach((w) => {
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: `  -> Cải tiến: ${w}`, font: defaultFont, size: 20 })],
          })
        );
      });
    }
  }

  // Action Items
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);
  if (allActions.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${toRoman(secIdx++)}. PHÂN CÔNG THỰC HIỆN (ACTION ITEMS)`,
            bold: true,
            font: defaultFont,
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    allActions.forEach((act, idx) => {
      const sup =
        act.supporterNames && act.supporterNames.length > 0
          ? ` (Phối hợp: ${act.supporterNames.join(', ')})`
          : '';
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${act.title}`,
              bold: true,
              font: defaultFont,
              size: 22,
            }),
            new TextRun({
              text: ` | Chủ trì: ${act.ownerName}${sup}`,
              bold: true,
              font: defaultFont,
              size: 20,
            }),
            new TextRun({
              text: ` | Hạn chót: ${act.deadline} | Đầu ra: ${act.deliverable}`,
              font: defaultFont,
              size: 20,
            }),
          ],
        })
      );
    });
  }

  if (meeting.conclusionSummary || meeting.nextMeetingDate) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: meeting.conclusionSummary
              ? `Kết luận chung: ${meeting.conclusionSummary}`
              : '',
            font: defaultFont,
            size: 21,
            italics: true,
          }),
        ],
        spacing: { before: 180, after: 80 },
      })
    );
    if (meeting.nextMeetingDate) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Dự kiến cuộc họp tiếp theo: ${meeting.nextMeetingDate}${
                meeting.nextMeetingAgenda ? ` — ${meeting.nextMeetingAgenda}` : ''
              }`,
              font: defaultFont,
              size: 20,
              italics: true,
            }),
          ],
        })
      );
    }
  }

  // Nơi nhận (Decree 30)
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Nơi nhận:', bold: true, font: defaultFont, size: 20 })],
      spacing: { before: 200, after: 40 },
    })
  );
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '- Như Thành phần tham dự;', font: defaultFont, size: 19 })],
    })
  );
  meeting.distribution?.forAction?.forEach((fa) => {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `- ${fa} (để thực hiện);`, font: defaultFont, size: 19 }),
        ],
      })
    );
  });
  meeting.distribution?.forInfo?.forEach((fi) => {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: `- ${fi} (để biết);`, font: defaultFont, size: 19 })],
      })
    );
  });
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '- Lưu: VT, Hồ sơ cuộc họp.', font: defaultFont, size: 19 })],
    })
  );

  // Chữ ký
  sections.push(new Paragraph({ text: '', spacing: { before: 260, after: 160 } }));

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
              new Paragraph({ text: '', spacing: { before: 700 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text:
                      meeting.signatures.find((s) => s.role === 'secretary')?.signerName ||
                      'Thư ký cuộc họp',
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
              new Paragraph({ text: '', spacing: { before: 700 } }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text:
                      meeting.signatures.find((s) => s.role === 'chairperson')?.signerName ||
                      'Chủ tọa cuộc họp',
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

  if (meeting.group === 'D' && meeting.bilateral) {
    sections.push(new Paragraph({ text: '', spacing: { before: 240, after: 120 } }));
    sections.push(
      new Table({
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
                        text: `ĐẠI DIỆN BÊN A (${meeting.bilateral.partyA.companyName})`,
                        bold: true,
                        font: defaultFont,
                        size: 20,
                      }),
                    ],
                  }),
                  new Paragraph({ text: '', spacing: { before: 600 } }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: meeting.bilateral.partyA.representative,
                        bold: true,
                        font: defaultFont,
                        size: 21,
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
                        text: `ĐẠI DIỆN BÊN B (${meeting.bilateral.partyB.companyName})`,
                        bold: true,
                        font: defaultFont,
                        size: 20,
                      }),
                    ],
                  }),
                  new Paragraph({ text: '', spacing: { before: 600 } }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: meeting.bilateral.partyB.representative,
                        bold: true,
                        font: defaultFont,
                        size: 21,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // Ghi nhận từ chối ký theo Điều 158
  const refused = meeting.participants.filter((p) => p.refusedSign);
  if (refused.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Ghi nhận từ chối ký theo Điều 158 Luật DN: ${refused
              .map((p) => `${p.name} (${p.title}): ${p.refusalReason}`)
              .join(' | ')}`,
            bold: true,
            italics: true,
            font: defaultFont,
            size: 19,
          }),
        ],
        spacing: { before: 200 },
      })
    );
  }

  if (meeting.contentHash) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `Mã băm xác thực toàn vẹn (SHA-256): ${meeting.contentHash}`,
            color: '666666',
            font: defaultFont,
            size: 16,
          }),
        ],
        spacing: { before: 200 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // Khổ A4 chuẩn (mm -> twips)
            margin: {
              top: 1134, // 20mm
              bottom: 1134, // 20mm
              left: 1701, // 30mm chuẩn Nghị định 30
              right: 850, // 15mm chuẩn Nghị định 30
            },
          },
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
