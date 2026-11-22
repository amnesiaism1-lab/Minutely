import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { ActionItem, Meeting, Participant, Vote } from '../types';
import {
  ACTION_STATUS_META,
  OPINION_TYPE_META,
  PRIORITY_META,
  formatAttendanceStatus,
  formatParticipantRole,
} from './uiHelpers';

// A4 Portrait Dimensions & Nghị định 30/2020/NĐ-CP Appendix I Margins (in DXA: 1mm ≈ 56.7 DXA)
const PAGE_WIDTH_DXA = 11906; // 210mm
const PAGE_HEIGHT_DXA = 16838; // 297mm
const MARGIN_TOP_DXA = 1134; // 20mm
const MARGIN_BOTTOM_DXA = 1134; // 20mm
const MARGIN_LEFT_DXA = 1701; // 30mm (binding margin per Decree 30)
const MARGIN_RIGHT_DXA = 850; // 15mm
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_LEFT_DXA - MARGIN_RIGHT_DXA; // 9355 DXA

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

function parseSafeDateParts(dateStr?: string): { day: string; month: string; year: string } {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return {
      day: d.padStart(2, '0'),
      month: m.padStart(2, '0'),
      year: y,
    };
  }
  const now = new Date();
  return {
    day: String(now.getDate()).padStart(2, '0'),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
  };
}

function formatVoteMethodLabel(method: Vote['method']): string {
  switch (method) {
    case 'show_of_hands':
      return 'biểu quyết giơ tay công khai';
    case 'secret_ballot':
      return 'bỏ phiếu kín';
    case 'electronic':
      return 'biểu quyết điện tử';
    case 'written':
      return 'lấy ý kiến bằng văn bản';
    default:
      return 'biểu quyết trực tiếp';
  }
}

function formatVoteChoiceLabel(choice?: string): string {
  if (choice === 'in_favor') return 'Tán thành';
  if (choice === 'against') return 'Không tán thành';
  if (choice === 'abstain') return 'Không có ý kiến';
  return 'Chưa biểu quyết';
}

function getSignatureStampLabel(sigType?: string): string {
  if (sigType === 'digital_cert') return 'ĐÃ KÝ SỐ DOANH NGHIỆP';
  if (sigType === 'wet_scan') return 'ĐÃ KÝ TƯƠI (LƯU BẢN QUÉT)';
  return 'ĐÃ XÁC NHẬN ĐIỆN TỬ';
}

function formatMeetingModeLabel(mode: Meeting['meetingMode']): string {
  if (mode === 'online') return 'Trực tuyến';
  if (mode === 'hybrid') return 'Trực tiếp kết hợp trực tuyến';
  return 'Trực tiếp';
}

function toRoman(n: number): string {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
}

function makeSolidBorders(color = '334155', size = 4) {
  const b = { style: BorderStyle.SINGLE, size, color };
  return { top: b, bottom: b, left: b, right: b };
}

function createPageFooter(leftText: string, fontFamily: string): Footer {
  const topBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  return new Footer({
    children: [
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: [6555, 2800],
        borders: {
          top: topBorder,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 6555, type: WidthType.DXA },
                borders: { ...NO_BORDERS, top: topBorder },
                margins: { top: 80, bottom: 0, left: 0, right: 80 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: leftText,
                        font: fontFamily,
                        size: 18, // 9pt
                        italics: true,
                        color: '64748B',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: { ...NO_BORDERS, top: topBorder },
                margins: { top: 80, bottom: 0, left: 80, right: 0 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        children: ['Trang ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                        font: fontFamily,
                        size: 18,
                        color: '475569',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildDecreeHeaderTable(
  meeting: Meeting,
  fontFamily: string,
  docCodeText: string
): Table {
  const { day, month, year } = parseSafeDateParts(meeting.date);
  const leftColW = 4210;
  const rightColW = CONTENT_WIDTH_DXA - leftColW; // 5145 DXA

  const leftChildren: Paragraph[] = [];
  if (meeting.organization.governingBody) {
    leftChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: meeting.organization.governingBody.toUpperCase(),
            font: fontFamily,
            size: 23, // 11.5pt
            bold: false,
            color: '000000',
          }),
        ],
      })
    );
  }

  leftChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: meeting.organization.department ? 20 : 40 },
      children: [
        new TextRun({
          text: (meeting.organization.name || 'TÊN CƠ QUAN, DOANH NGHIỆP').toUpperCase(),
          font: fontFamily,
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    })
  );

  if (meeting.organization.department) {
    leftChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: meeting.organization.department.toUpperCase(),
            font: fontFamily,
            size: 23,
            bold: true,
            color: '000000',
          }),
        ],
      })
    );
  }

  // Short horizontal separator rule per Decree 30 Appendix I (approx 1/3 width)
  leftChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: '────────────',
          font: fontFamily,
          size: 20,
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: docCodeText,
          font: fontFamily,
          size: 24, // 12pt
          color: '000000',
        }),
      ],
    })
  );

  const rightChildren: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [
        new TextRun({
          text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
          font: fontFamily,
          size: 24, // 12pt
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: 'Độc lập - Tự do - Hạnh phúc',
          font: fontFamily,
          size: 26, // 13pt per Decree 30
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 90 },
      children: [
        new TextRun({
          text: '──────────────────────',
          font: fontFamily,
          size: 20,
          bold: true,
          color: '000000',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${meeting.locationCity || 'Hà Nội'}, ngày ${day} tháng ${month} năm ${year}`,
          font: fontFamily,
          size: 24, // 12pt italic
          italics: true,
          color: '000000',
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [leftColW, rightColW],
    borders: {
      ...NO_BORDERS,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: leftColW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 40, left: 0, right: 80 },
            children: leftChildren,
          }),
          new TableCell({
            width: { size: rightColW, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 40, left: 80, right: 0 },
            children: rightChildren,
          }),
        ],
      }),
    ],
  });
}

function buildActionItemsTable(
  actions: ActionItem[],
  fontFamily: string,
  bodySize: number,
  isDecree30: boolean
): Table {
  // Exact column widths summing to 9355 DXA
  const colWidths = [620, 2935, 2050, 1350, 2400];
  const borderColor = isDecree30 ? '000000' : 'CBD5E1';
  const cellBorders = makeSolidBorders(borderColor, 4);
  const headerFill = isDecree30 ? 'F1F5F9' : 'EFF6FF';
  const headerColor = isDecree30 ? '000000' : '0F172A';
  const tableTextSize = Math.max(22, bodySize - 2); // 11.5pt–12pt for crisp table fit

  const headers = [
    'STT',
    'Nội dung nhiệm vụ',
    'Chủ trì & Phối hợp',
    'Hạn chót',
    'Sản phẩm đầu ra (DoD)',
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((label, idx) => {
      return new TableCell({
        width: { size: colWidths[idx], type: WidthType.DXA },
        borders: cellBorders,
        shading: { fill: headerFill, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 90, bottom: 90, left: 90, right: 90 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: label,
                font: fontFamily,
                size: tableTextSize,
                bold: true,
                color: headerColor,
              }),
            ],
          }),
        ],
      });
    }),
  });

  const dataRows = actions.map((act, idx) => {
    const priorityNote =
      act.priority === 'urgent'
        ? ' [Khẩn cấp]'
        : act.priority === 'high'
        ? ' [Ưu tiên cao]'
        : '';

    const ownerParagraphs: Paragraph[] = [
      new Paragraph({
        spacing: { after: act.supporterNames?.length || act.approverName ? 30 : 0 },
        children: [
          new TextRun({
            text: act.ownerName,
            font: fontFamily,
            size: tableTextSize,
            bold: true,
            color: isDecree30 ? '000000' : '0F172A',
          }),
        ],
      }),
    ];

    if (act.supporterNames && act.supporterNames.length > 0) {
      ownerParagraphs.push(
        new Paragraph({
          spacing: { after: act.approverName ? 20 : 0 },
          children: [
            new TextRun({
              text: `Phối hợp: ${act.supporterNames.join(', ')}`,
              font: fontFamily,
              size: tableTextSize - 2,
              italics: true,
              color: isDecree30 ? '1E293B' : '475569',
            }),
          ],
        })
      );
    }

    if (act.approverName) {
      ownerParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Nghiệm thu: ${act.approverName}`,
              font: fontFamily,
              size: tableTextSize - 2,
              italics: true,
              color: isDecree30 ? '1E293B' : '475569',
            }),
          ],
        })
      );
    }

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: colWidths[0], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: String(idx + 1),
                  font: fontFamily,
                  size: tableTextSize,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[1], type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 95, right: 95 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: act.title,
                  font: fontFamily,
                  size: tableTextSize,
                  bold: act.carriedFromPrevious,
                }),
                ...(priorityNote
                  ? [
                      new TextRun({
                        text: priorityNote,
                        font: fontFamily,
                        size: tableTextSize - 2,
                        bold: true,
                        color: isDecree30 ? '000000' : '9F1239',
                      }),
                    ]
                  : []),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[2], type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 95, right: 95 },
          children: ownerParagraphs,
        }),
        new TableCell({
          width: { size: colWidths[3], type: WidthType.DXA },
          borders: cellBorders,
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 70, right: 70 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: act.deadline || '—',
                  font: fontFamily,
                  size: tableTextSize,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: colWidths[4], type: WidthType.DXA },
          borders: cellBorders,
          margins: { top: 80, bottom: 80, left: 95, right: 95 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: act.deliverable || '—',
                  font: fontFamily,
                  size: tableTextSize,
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function formatParticipantLine(p: Participant, prefix: string, fontFamily: string, size: number, textColor: string): Paragraph {
  const sharesOrCap =
    p.sharesCount !== undefined && p.sharesCount > 0
      ? ` — Đại diện: ${p.sharesCount.toLocaleString('vi-VN')} cổ phần`
      : p.capitalRatio !== undefined && p.capitalRatio > 0
      ? ` — Đại diện: ${p.capitalRatio}% vốn góp`
      : '';

  const partyNote =
    p.affiliation === 'party_a'
      ? ' [Bên A]'
      : p.affiliation === 'party_b'
      ? ` [Bên B${p.organizationName ? ` - ${p.organizationName}` : ''}]`
      : p.organizationName
      ? ` (${p.organizationName})`
      : '';

  return new Paragraph({
    indent: { left: 280 },
    spacing: { after: 65 },
    alignment: AlignmentType.BOTH,
    children: [
      new TextRun({
        text: prefix,
        font: fontFamily,
        size,
        color: textColor,
      }),
      new TextRun({
        text: p.name,
        font: fontFamily,
        size,
        bold: true,
        color: textColor,
      }),
      new TextRun({
        text: ` — ${p.title || formatParticipantRole(p.role)}${partyNote}${sharesOrCap} (${formatAttendanceStatus(
          p.status,
          p.delegatedTo
        )}).`,
        font: fontFamily,
        size,
        color: textColor,
      }),
    ],
  });
}

function buildCalloutBox(
  paragraphs: Paragraph[],
  options: { fill: string; leftBorderColor: string; borderColor?: string }
): Table {
  const outerColor = options.borderColor || 'DCE4F0';
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH_DXA],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
            shading: { fill: options.fill, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: outerColor },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: outerColor },
              right: { style: BorderStyle.SINGLE, size: 4, color: outerColor },
              left: { style: BorderStyle.SINGLE, size: 18, color: options.leftBorderColor },
            },
            margins: { top: 100, bottom: 100, left: 160, right: 140 },
            children: paragraphs,
          }),
        ],
      }),
    ],
  });
}

/**
 * 1. FULL MEETING MINUTES EXPORT (.docx)
 * Supports both `decree30` (strict Nghị định 30/2020/NĐ-CP & Luật Doanh nghiệp 2020)
 * and `modern` (clean executive corporate document).
 */
export async function exportMeetingToDocx(
  meeting: Meeting,
  mode: 'decree30' | 'modern' = 'decree30'
): Promise<Blob> {
  const isDecree30 = mode === 'decree30';
  const fontFamily = isDecree30 ? 'Times New Roman' : 'Arial';
  const bodySize = isDecree30 ? 26 : 22; // 13pt Decree 30 vs 11pt Modern
  const subSize = isDecree30 ? 24 : 21; // 12pt vs 10.5pt
  const primaryInk = isDecree30 ? '000000' : '0F172A';
  const secondaryInk = isDecree30 ? '1E293B' : '475569';
  const accentColor = isDecree30 ? '000000' : '1D4ED8';

  const { day, month, year } = parseSafeDateParts(meeting.date);
  const adjournedTime = meeting.archiveDetails?.adjournedAt || meeting.endTime;
  const totalCopies = meeting.archiveDetails?.totalCopies || 2;
  const storageLocs =
    meeting.archiveDetails?.storageLocations?.join(', ') ||
    'Văn thư đơn vị và Hồ sơ lưu trữ cuộc họp';

  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);
  const chairpersons = meeting.participants.filter((p) => p.role === 'chairperson');
  const secretaries = meeting.participants.filter((p) => p.role === 'secretary');
  const scrutineers = meeting.participants.filter((p) => p.role === 'scrutineer');
  const members = meeting.participants.filter((p) => p.role === 'member');
  const guests = meeting.participants.filter((p) => p.role === 'guest');

  const chairpersonSig = meeting.signatures.find((s) => s.role === 'chairperson');
  const secretarySig = meeting.signatures.find((s) => s.role === 'secretary');
  const chairDisplayName =
    chairpersonSig?.signerName || chairpersons[0]?.name || 'Chủ tọa cuộc họp';
  const secDisplayName =
    secretarySig?.signerName || secretaries[0]?.name || 'Thư ký ghi biên bản';

  // Dynamic Roman Numeral Section Numbering (matches Decree30View 100%)
  let secCounter = 1;
  const secTimeVenue = toRoman(secCounter++);
  const secParticipants = toRoman(secCounter++);
  const secAttachments =
    meeting.attachments && meeting.attachments.length > 0 ? toRoman(secCounter++) : null;
  const secAgenda = toRoman(secCounter++);
  const secSpecialized =
    meeting.bilateral || meeting.postMortem || meeting.scrumRetro
      ? toRoman(secCounter++)
      : null;
  const secActions = allActions.length > 0 ? toRoman(secCounter++) : null;

  const children: (Paragraph | Table)[] = [];

  // =========================================================================
  // 1. HEADER & TITLE BLOCK
  // =========================================================================
  if (isDecree30) {
    children.push(buildDecreeHeaderTable(meeting, fontFamily, `Số: ${meeting.code}`));
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 280, after: 80 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'BIÊN BẢN CUỘC HỌP',
            font: fontFamily,
            size: 30, // 15pt bold uppercase
            bold: true,
            color: primaryInk,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: meeting.isInquorateMinutes || meeting.seriesName ? 60 : 200 },
        keepNext: true,
        children: [
          new TextRun({
            text: `Về việc: ${meeting.title}`,
            font: fontFamily,
            size: 27, // 13.5pt bold
            bold: true,
            color: primaryInk,
          }),
        ],
      })
    );
  } else {
    // Modern Executive Masthead Box
    const mastheadParas: Paragraph[] = [
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `${meeting.code}  •  Nhóm ${meeting.group}: ${meeting.typeName}  •  Phiên bản v${meeting.version}`,
            font: fontFamily,
            size: 20,
            bold: true,
            color: '1D4ED8',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: meeting.title,
            font: fontFamily,
            size: 32, // 16pt
            bold: true,
            color: '0F172A',
          }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${meeting.organization.name}  |  Ngày ${day}/${month}/${year} (${meeting.startTime} - ${adjournedTime})  |  ${meeting.venue}`,
            font: fontFamily,
            size: 20,
            color: '475569',
          }),
        ],
      }),
    ];
    children.push(
      buildCalloutBox(mastheadParas, {
        fill: 'F8FAFC',
        leftBorderColor: '1D4ED8',
        borderColor: 'CBD5E1',
      }),
      new Paragraph({ spacing: { after: 140 }, children: [new TextRun({ text: '' })] })
    );
  }

  if (meeting.isInquorateMinutes) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: '(Biên bản ghi nhận cuộc họp không đủ điều kiện tiến hành theo Điều 145 Luật Doanh nghiệp 2020)',
            font: fontFamily,
            size: subSize,
            bold: true,
            italics: true,
            color: '9F1239',
          }),
        ],
      })
    );
  }

  if (meeting.seriesName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: `(Thuộc chuỗi: ${meeting.seriesName}${
              meeting.sequenceNumber ? ` — Kỳ họp thứ ${meeting.sequenceNumber}` : ''
            })`,
            font: fontFamily,
            size: subSize - 1,
            italics: true,
            color: secondaryInk,
          }),
        ],
      })
    );
  }

  // =========================================================================
  // 2. SECTION I: THỜI GIAN, ĐỊA ĐIỂM VÀ THÔNG TIN PHÁP NHÂN
  // =========================================================================
  children.push(
    new Paragraph({
      spacing: { before: 160, after: 100 },
      keepNext: true,
      children: [
        new TextRun({
          text: `${secTimeVenue}. THỜI GIAN, ĐỊA ĐIỂM VÀ THÔNG TIN PHÁP NHÂN`,
          font: fontFamily,
          size: bodySize,
          bold: true,
          color: accentColor,
        }),
      ],
    })
  );

  if (meeting.organization.enterpriseCode) {
    children.push(
      new Paragraph({
        indent: { left: 240 },
        spacing: { after: 65 },
        children: [
          new TextRun({ text: '• Mã số doanh nghiệp: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
          new TextRun({ text: meeting.organization.enterpriseCode, font: fontFamily, size: bodySize, color: primaryInk }),
        ],
      })
    );
  }

  if (meeting.organization.address) {
    children.push(
      new Paragraph({
        indent: { left: 240 },
        spacing: { after: 65 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: '• Trụ sở chính: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
          new TextRun({ text: meeting.organization.address, font: fontFamily, size: bodySize, color: primaryInk }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 65 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({ text: '• Thời gian: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
        new TextRun({
          text: `Khai mạc vào hồi ${meeting.startTime}, bế mạc vào hồi ${adjournedTime}, ngày ${day} tháng ${month} năm ${year}.`,
          font: fontFamily,
          size: bodySize,
          color: primaryInk,
        }),
      ],
    }),
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 65 },
      alignment: AlignmentType.BOTH,
      children: [
        new TextRun({ text: '• Địa điểm: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
        new TextRun({
          text: `${meeting.venue} (Hình thức tổ chức: ${formatMeetingModeLabel(meeting.meetingMode)}${
            meeting.meetingUrl ? ` — Đường dẫn trực tuyến: ${meeting.meetingUrl}` : ''
          }).`,
          font: fontFamily,
          size: bodySize,
          color: primaryInk,
        }),
      ],
    })
  );

  if (meeting.previousMeetingTitle) {
    children.push(
      new Paragraph({
        indent: { left: 240 },
        spacing: { after: 65 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: '• Căn cứ biên bản kỳ trước: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
          new TextRun({ text: meeting.previousMeetingTitle, font: fontFamily, size: bodySize, color: primaryInk }),
        ],
      })
    );
  }

  // =========================================================================
  // 3. SECTION II: THÀNH PHẦN THAM DỰ & KIỂM TRA TÚC SỐ
  // =========================================================================
  children.push(
    new Paragraph({
      spacing: { before: 180, after: 100 },
      keepNext: true,
      children: [
        new TextRun({
          text: `${secParticipants}. THÀNH PHẦN THAM DỰ`,
          font: fontFamily,
          size: bodySize,
          bold: true,
          color: accentColor,
        }),
      ],
    })
  );

  if (chairpersons.length > 0 || secretaries.length > 0 || scrutineers.length > 0) {
    children.push(
      new Paragraph({
        indent: { left: 160 },
        spacing: { after: 70 },
        keepNext: true,
        children: [
          new TextRun({
            text: '1. Chủ tọa, Ban Thư ký và Ban Kiểm phiếu:',
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: primaryInk,
          }),
        ],
      })
    );

    chairpersons.forEach((p) => {
      children.push(formatParticipantLine(p, '- Chủ tọa: ', fontFamily, bodySize, primaryInk));
    });
    secretaries.forEach((p) => {
      children.push(formatParticipantLine(p, '- Thư ký ghi biên bản: ', fontFamily, bodySize, primaryInk));
    });
    scrutineers.forEach((p) => {
      children.push(formatParticipantLine(p, '- Ban kiểm phiếu: ', fontFamily, bodySize, primaryInk));
    });
  }

  if (members.length > 0) {
    children.push(
      new Paragraph({
        indent: { left: 160 },
        spacing: { before: 70, after: 70 },
        keepNext: true,
        children: [
          new TextRun({
            text: `2. Đại biểu và Thành viên tham dự (${members.length} thành viên):`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: primaryInk,
          }),
        ],
      })
    );

    members.forEach((p, idx) => {
      children.push(formatParticipantLine(p, `2.${idx + 1}. `, fontFamily, bodySize, primaryInk));
    });
  }

  if (guests.length > 0) {
    children.push(
      new Paragraph({
        indent: { left: 160 },
        spacing: { before: 70, after: 70 },
        keepNext: true,
        children: [
          new TextRun({
            text: `3. Khách mời tham dự (${guests.length} khách mời):`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: primaryInk,
          }),
        ],
      })
    );

    guests.forEach((p) => {
      children.push(formatParticipantLine(p, '- ', fontFamily, bodySize, primaryInk));
    });
  }

  if (meeting.quorum) {
    const q = meeting.quorum;
    const quorumText = q.isMet
      ? `ĐỦ ĐIỀU KIỆN TIẾN HÀNH HỢP LỆ theo quy định pháp luật và Điều lệ đơn vị.`
      : meeting.isInquorateMinutes
      ? `KHÔNG ĐỦ ĐIỀU KIỆN TIẾN HÀNH — Lập Biên bản ghi nhận cuộc họp không thành theo Điều 145 Luật Doanh nghiệp 2020 để triệu tập lần tiếp theo.`
      : `CHƯA ĐẠT TỶ LỆ TỐI THIỂU LUẬT ĐỊNH.`;

    children.push(
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: '' })] }),
      buildCalloutBox(
        [
          new Paragraph({
            alignment: AlignmentType.BOTH,
            children: [
              new TextRun({
                text: 'Xác nhận điều kiện tiến hành cuộc họp (Túc số): ',
                font: fontFamily,
                size: subSize,
                bold: true,
                color: primaryInk,
              }),
              new TextRun({
                text: `Tổng tỷ lệ đại diện tham dự (bao gồm trực tiếp và ủy quyền hợp lệ) đạt ${q.actualPercentage}% (tương đương ${q.presentCapitalOrShares.toLocaleString(
                  'vi-VN'
                )} / ${q.totalCapitalOrShares.toLocaleString(
                  'vi-VN'
                )} quyền biểu quyết), so với ngưỡng tối thiểu ${q.requiredPercentage}%. Kết luận: `,
                font: fontFamily,
                size: subSize,
                color: primaryInk,
              }),
              new TextRun({
                text: quorumText,
                font: fontFamily,
                size: subSize,
                bold: true,
                color: q.isMet ? (isDecree30 ? '000000' : '065F46') : '9F1239',
              }),
            ],
          }),
        ],
        {
          fill: q.isMet ? 'F8FAFC' : 'FFF1F2',
          leftBorderColor: q.isMet ? (isDecree30 ? '1E293B' : '059669') : 'E11D48',
          borderColor: q.isMet ? 'CBD5E1' : 'FECDD3',
        }
      )
    );
  }

  // =========================================================================
  // 4. OPTIONAL SECTION: TÀI LIỆU & PHỤ LỤC ĐÍNH KÈM
  // =========================================================================
  if (secAttachments && meeting.attachments && meeting.attachments.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${secAttachments}. DANH MỤC TÀI LIỆU VÀ PHỤ LỤC ĐÍNH KÈM`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: accentColor,
          }),
        ],
      })
    );

    meeting.attachments.forEach((att, idx) => {
      children.push(
        new Paragraph({
          indent: { left: 240 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${idx + 1}. ${att.title} `,
              font: fontFamily,
              size: bodySize,
              bold: true,
              color: primaryInk,
            }),
            new TextRun({
              text: `[Định dạng: ${att.fileType.toUpperCase()}${
                att.fileSizeKb ? ` — ${(att.fileSizeKb / 1024).toFixed(2)} MB` : ''
              }]`,
              font: fontFamily,
              size: subSize - 1,
              italics: true,
              color: secondaryInk,
            }),
          ],
        })
      );
    });
  }

  // =========================================================================
  // 5. MAIN SECTION: NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP
  // =========================================================================
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 120 },
      keepNext: true,
      children: [
        new TextRun({
          text: `${secAgenda}. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP`,
          font: fontFamily,
          size: bodySize,
          bold: true,
          color: accentColor,
        }),
      ],
    })
  );

  meeting.agendaItems.forEach((item, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 70 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${idx + 1}. ${item.title}`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: primaryInk,
          }),
          ...(item.presenterName
            ? [
                new TextRun({
                  text: ` (Người trình bày: ${item.presenterName})`,
                  font: fontFamily,
                  size: subSize,
                  italics: true,
                  color: secondaryInk,
                }),
              ]
            : []),
        ],
      })
    );

    if (item.description) {
      children.push(
        new Paragraph({
          indent: { left: 240 },
          spacing: { after: 70 },
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({
              text: 'Tóm tắt tờ trình / đề xuất: ',
              font: fontFamily,
              size: bodySize,
              bold: true,
              italics: true,
              color: primaryInk,
            }),
            new TextRun({
              text: item.description,
              font: fontFamily,
              size: bodySize,
              italics: true,
              color: primaryInk,
            }),
          ],
        })
      );
    }

    if (item.opinions.length > 0) {
      children.push(
        new Paragraph({
          indent: { left: 240 },
          spacing: { after: 55 },
          keepNext: true,
          children: [
            new TextRun({
              text: 'Diễn biến thảo luận:',
              font: fontFamily,
              size: bodySize,
              bold: true,
              underline: {},
              color: primaryInk,
            }),
          ],
        })
      );

      item.opinions.forEach((op) => {
        const typeLabel =
          op.type && op.type !== 'opinion' && OPINION_TYPE_META[op.type]
            ? ` [${OPINION_TYPE_META[op.type].label}]`
            : '';

        children.push(
          new Paragraph({
            indent: { left: 360 },
            spacing: { after: 65 },
            alignment: AlignmentType.BOTH,
            children: [
              new TextRun({
                text: `- Ông/Bà ${op.speakerName}${typeLabel}: `,
                font: fontFamily,
                size: bodySize,
                bold: true,
                color: primaryInk,
              }),
              new TextRun({
                text: op.content,
                font: fontFamily,
                size: bodySize,
                color: primaryInk,
              }),
            ],
          })
        );
      });
    }

    if (item.decision) {
      const dec = item.decision;
      const decisionHeading =
        dec.status === 'deferred'
          ? 'KẾT LUẬN: TẠM HOÃN XEM XÉT — '
          : dec.status === 'disagreed'
          ? 'QUYẾT NGHỊ (KHÔNG THÔNG QUA): '
          : 'QUYẾT NGHỊ / KẾT LUẬN: ';

      const decisionParas: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: {
            after:
              dec.deferredReason || dec.vote || (dec.reservedOpinions && dec.reservedOpinions.length > 0)
                ? 70
                : 0,
          },
          children: [
            new TextRun({
              text: decisionHeading,
              font: fontFamily,
              size: bodySize,
              bold: true,
              color: dec.status === 'disagreed' && !isDecree30 ? '9F1239' : primaryInk,
            }),
            new TextRun({
              text: dec.content || 'Chưa ghi nhận nội dung quyết nghị.',
              font: fontFamily,
              size: bodySize,
              bold: dec.status === 'agreed',
              color: primaryInk,
            }),
          ],
        }),
      ];

      if (dec.status === 'deferred' && dec.deferredReason) {
        decisionParas.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { after: dec.vote ? 60 : 0 },
            children: [
              new TextRun({
                text: 'Lý do tạm hoãn: ',
                font: fontFamily,
                size: subSize,
                bold: true,
                italics: true,
                color: secondaryInk,
              }),
              new TextRun({
                text: dec.deferredReason,
                font: fontFamily,
                size: subSize,
                italics: true,
                color: secondaryInk,
              }),
            ],
          })
        );
      }

      if (dec.vote) {
        const v = dec.vote;
        const invalidNote = v.invalid && v.invalid > 0 ? ` | Không hợp lệ: ${v.invalid.toLocaleString('vi-VN')}` : '';

        decisionParas.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { after: v.memberVotes && v.memberVotes.length > 0 ? 55 : 0 },
            children: [
              new TextRun({
                text: `Kết quả kiểm phiếu (${formatVoteMethodLabel(v.method)}): `,
                font: fontFamily,
                size: subSize,
                bold: true,
                color: primaryInk,
              }),
              new TextRun({
                text: `Tán thành: ${v.inFavor.toLocaleString('vi-VN')} | Không tán thành: ${v.against.toLocaleString(
                  'vi-VN'
                )} | Không có ý kiến: ${v.abstain.toLocaleString('vi-VN')}${invalidNote} (Tổng quyền hợp lệ: ${v.totalEligible.toLocaleString(
                  'vi-VN'
                )}). Tỷ lệ đạt: `,
                font: fontFamily,
                size: subSize,
                color: primaryInk,
              }),
              new TextRun({
                text: `${v.ratioPassed}% / ngưỡng ${v.thresholdPercent}% → ${
                  v.isPassed ? 'ĐÃ THÔNG QUA' : 'KHÔNG ĐẠT NGƯỠNG THÔNG QUA'
                }.`,
                font: fontFamily,
                size: subSize,
                bold: true,
                color: v.isPassed ? (isDecree30 ? '000000' : '065F46') : '9F1239',
              }),
            ],
          })
        );

        // Roll-call individual votes (Điều 158 Luật Doanh nghiệp 2020)
        if (v.memberVotes && v.memberVotes.some((mv) => mv.voteChoice)) {
          const rollcallText = v.memberVotes
            .filter((mv) => mv.voteChoice)
            .map((mv) => `${mv.participantName}: ${formatVoteChoiceLabel(mv.voteChoice)}`)
            .join('; ');

          decisionParas.push(
            new Paragraph({
              alignment: AlignmentType.BOTH,
              spacing: { after: dec.reservedOpinions && dec.reservedOpinions.length > 0 ? 50 : 0 },
              children: [
                new TextRun({
                  text: 'Chi tiết biểu quyết từng đại biểu (Điều 158 Luật DN): ',
                  font: fontFamily,
                  size: subSize - 1,
                  bold: true,
                  italics: true,
                  color: secondaryInk,
                }),
                new TextRun({
                  text: `${rollcallText}.`,
                  font: fontFamily,
                  size: subSize - 1,
                  italics: true,
                  color: secondaryInk,
                }),
              ],
            })
          );
        }
      }

      if (dec.reservedOpinions && dec.reservedOpinions.length > 0) {
        decisionParas.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            children: [
              new TextRun({
                text: 'Ý kiến bảo lưu được ghi nhận vào biên bản: ',
                font: fontFamily,
                size: subSize,
                bold: true,
                italics: true,
                color: '92400E',
              }),
              new TextRun({
                text: dec.reservedOpinions.join('; '),
                font: fontFamily,
                size: subSize,
                italics: true,
                color: primaryInk,
              }),
            ],
          })
        );
      }

      children.push(
        buildCalloutBox(decisionParas, {
          fill: isDecree30 ? 'F8FAFC' : dec.status === 'disagreed' ? 'FFF1F2' : 'EFF6FF',
          leftBorderColor: isDecree30
            ? '0F172A'
            : dec.status === 'disagreed'
            ? 'E11D48'
            : '1D4ED8',
          borderColor: isDecree30 ? 'CBD5E1' : 'BFDBFE',
        }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: '' })] })
      );
    }
  });

  // =========================================================================
  // 6. SPECIALIZED BLOCKS (STRUCTURED WORD TABLES)
  // =========================================================================
  if (secSpecialized) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${secSpecialized}. NỘI DUNG CHUYÊN BIỆT THEO LOẠI HÌNH CUỘC HỌP`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: accentColor,
          }),
        ],
      })
    );

    const specBorder = makeSolidBorders(isDecree30 ? '000000' : 'CBD5E1', 4);
    const cellTextSz = Math.max(22, bodySize - 2);

    // 6A. Bilateral Commitments Table (Group D)
    if (meeting.bilateral) {
      const b = meeting.bilateral;
      const halfW = 4677;
      const rightW = CONTENT_WIDTH_DXA - halfW; // 4678 DXA

      children.push(
        new Table({
          width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
          columnWidths: [halfW, rightW],
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: halfW, type: WidthType.DXA },
                  borders: specBorder,
                  shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                  margins: { top: 85, bottom: 85, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `CAM KẾT CỦA BÊN A (${b.partyA.companyName})`,
                          font: fontFamily,
                          size: cellTextSz,
                          bold: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Đại diện: ${b.partyA.representative} — ${b.partyA.title}`,
                          font: fontFamily,
                          size: cellTextSz - 2,
                          italics: true,
                          color: secondaryInk,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: rightW, type: WidthType.DXA },
                  borders: specBorder,
                  shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                  margins: { top: 85, bottom: 85, left: 100, right: 100 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `CAM KẾT CỦA BÊN B (${b.partyB.companyName})`,
                          font: fontFamily,
                          size: cellTextSz,
                          bold: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Đại diện: ${b.partyB.representative} — ${b.partyB.title}`,
                          font: fontFamily,
                          size: cellTextSz - 2,
                          italics: true,
                          color: secondaryInk,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: halfW, type: WidthType.DXA },
                  borders: specBorder,
                  margins: { top: 85, bottom: 85, left: 100, right: 100 },
                  children:
                    b.commitmentsA.length > 0
                      ? b.commitmentsA.map(
                          (c) =>
                            new Paragraph({
                              spacing: { after: 50 },
                              children: [new TextRun({ text: `• ${c}`, font: fontFamily, size: cellTextSz })],
                            })
                        )
                      : [new Paragraph({ children: [new TextRun({ text: '—', font: fontFamily, size: cellTextSz })] })],
                }),
                new TableCell({
                  width: { size: rightW, type: WidthType.DXA },
                  borders: specBorder,
                  margins: { top: 85, bottom: 85, left: 100, right: 100 },
                  children:
                    b.commitmentsB.length > 0
                      ? b.commitmentsB.map(
                          (c) =>
                            new Paragraph({
                              spacing: { after: 50 },
                              children: [new TextRun({ text: `• ${c}`, font: fontFamily, size: cellTextSz })],
                            })
                        )
                      : [new Paragraph({ children: [new TextRun({ text: '—', font: fontFamily, size: cellTextSz })] })],
                }),
              ],
            }),
          ],
        })
      );

      if (b.pendingPoints && b.pendingPoints.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 90, after: 45 },
            children: [
              new TextRun({
                text: 'Các nội dung tồn đọng / chờ cấp có thẩm quyền phê duyệt thêm:',
                font: fontFamily,
                size: bodySize,
                bold: true,
                italics: true,
              }),
            ],
          }),
          ...b.pendingPoints.map(
            (pt) =>
              new Paragraph({
                indent: { left: 240 },
                spacing: { after: 45 },
                children: [new TextRun({ text: `- ${pt}`, font: fontFamily, size: bodySize })],
              })
          )
        );
      }
    }

    // 6B. Incident Post-Mortem Block
    if (meeting.postMortem) {
      const pm = meeting.postMortem;
      const pmCols = [2200, 2200, 2455, 2500]; // 9355 DXA

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 70 },
          keepNext: true,
          children: [
            new TextRun({
              text: 'Hồ sơ Phân tích Sự cố (Blameless Post-Mortem):',
              font: fontFamily,
              size: bodySize,
              bold: true,
            }),
          ],
        }),
        new Table({
          width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
          columnWidths: pmCols,
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: ['Mức độ sự cố', 'Thời gian gián đoạn', 'Bắt đầu ghi nhận', 'Khắc phục hoàn tất'].map(
                (label, i) =>
                  new TableCell({
                    width: { size: pmCols[i], type: WidthType.DXA },
                    borders: specBorder,
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    margins: { top: 70, bottom: 70, left: 80, right: 80 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: label, font: fontFamily, size: cellTextSz, bold: true })],
                      }),
                    ],
                  })
              ),
            }),
            new TableRow({
              cantSplit: true,
              children: [
                pm.impactLevel,
                `${pm.downtimeMinutes} phút`,
                pm.startTime || '—',
                pm.resolvedTime || '—',
              ].map(
                (val, i) =>
                  new TableCell({
                    width: { size: pmCols[i], type: WidthType.DXA },
                    borders: specBorder,
                    margins: { top: 70, bottom: 70, left: 80, right: 80 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: val, font: fontFamily, size: cellTextSz, bold: i === 0 })],
                      }),
                    ],
                  })
              ),
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 90, after: 55 },
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({ text: '• Tóm tắt diễn biến: ', font: fontFamily, size: bodySize, bold: true }),
            new TextRun({ text: pm.summary, font: fontFamily, size: bodySize }),
          ],
        }),
        new Paragraph({
          spacing: { after: 65 },
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({ text: '• Nguyên nhân gốc rễ (Root Cause): ', font: fontFamily, size: bodySize, bold: true }),
            new TextRun({ text: pm.rootCause, font: fontFamily, size: bodySize }),
          ],
        })
      );

      if (pm.whatWentWell.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 45 },
            children: [
              new TextRun({
                text: `• Điểm ứng phó hiệu quả: `,
                font: fontFamily,
                size: bodySize,
                bold: true,
              }),
              new TextRun({
                text: pm.whatWentWell.join('; ') + '.',
                font: fontFamily,
                size: bodySize,
              }),
            ],
          })
        );
      }

      if (pm.whatToImprove.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 45 },
            children: [
              new TextRun({
                text: `• Khâu cần rút kinh nghiệm: `,
                font: fontFamily,
                size: bodySize,
                bold: true,
              }),
              new TextRun({
                text: pm.whatToImprove.join('; ') + '.',
                font: fontFamily,
                size: bodySize,
              }),
            ],
          })
        );
      }

      if (pm.preventionActions.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 65 },
            children: [
              new TextRun({
                text: `• Biện pháp phòng ngừa tái diễn: `,
                font: fontFamily,
                size: bodySize,
                bold: true,
              }),
              new TextRun({
                text: pm.preventionActions.join('; ') + '.',
                font: fontFamily,
                size: bodySize,
              }),
            ],
          })
        );
      }
    }

    // 6C. Scrum Retrospective 3-Column Table
    if (meeting.scrumRetro) {
      const sr = meeting.scrumRetro;
      const srCols = [3118, 3118, 3119]; // 9355 DXA

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 70 },
          keepNext: true,
          children: [
            new TextRun({
              text: `Tổng kết Sprint Retrospective (${sr.sprintName}): `,
              font: fontFamily,
              size: bodySize,
              bold: true,
            }),
            new TextRun({
              text: sr.sprintGoal,
              font: fontFamily,
              size: bodySize,
              italics: true,
            }),
          ],
        }),
        new Table({
          width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
          columnWidths: srCols,
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: ['Điểm làm tốt (Went Well)', 'Điểm chưa tốt (Went Wrong)', 'Hành động cải tiến (Actions)'].map(
                (label, i) =>
                  new TableCell({
                    width: { size: srCols[i], type: WidthType.DXA },
                    borders: specBorder,
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 90, right: 90 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: label, font: fontFamily, size: cellTextSz, bold: true })],
                      }),
                    ],
                  })
              ),
            }),
            new TableRow({
              cantSplit: true,
              children: [sr.whatWentWell, sr.whatWentWrong, sr.actionImprovements].map(
                (items, i) =>
                  new TableCell({
                    width: { size: srCols[i], type: WidthType.DXA },
                    borders: specBorder,
                    margins: { top: 80, bottom: 80, left: 90, right: 90 },
                    children:
                      items.length > 0
                        ? items.map(
                            (line) =>
                              new Paragraph({
                                spacing: { after: 45 },
                                children: [new TextRun({ text: `• ${line}`, font: fontFamily, size: cellTextSz })],
                              })
                          )
                        : [new Paragraph({ children: [new TextRun({ text: '—', font: fontFamily, size: cellTextSz })] })],
                  })
              ),
            }),
          ],
        })
      );
    }
  }

  // =========================================================================
  // 7. ACTION ITEMS TABLE (PHÂN CÔNG THỰC HIỆN)
  // =========================================================================
  if (secActions && allActions.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${secActions}. PHÂN CÔNG THỰC HIỆN VÀ TRÁCH NHIỆM GIẢI TRÌNH`,
            font: fontFamily,
            size: bodySize,
            bold: true,
            color: accentColor,
          }),
        ],
      }),
      buildActionItemsTable(allActions, fontFamily, bodySize, isDecree30)
    );
  }

  // =========================================================================
  // 8. CONCLUSION SUMMARY & NEXT MEETING
  // =========================================================================
  if (meeting.conclusionSummary || meeting.nextMeetingDate) {
    const summaryParas: Paragraph[] = [];
    if (meeting.conclusionSummary) {
      summaryParas.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: meeting.nextMeetingDate ? 60 : 0 },
          children: [
            new TextRun({ text: 'Kết luận chung: ', font: fontFamily, size: bodySize, bold: true, color: primaryInk }),
            new TextRun({ text: meeting.conclusionSummary, font: fontFamily, size: bodySize, color: primaryInk }),
          ],
        })
      );
    }
    if (meeting.nextMeetingDate) {
      summaryParas.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Dự kiến phiên họp kế tiếp: ',
              font: fontFamily,
              size: subSize,
              bold: true,
              italics: true,
              color: primaryInk,
            }),
            new TextRun({
              text: `ngày ${meeting.nextMeetingDate}${
                meeting.nextMeetingAgenda ? ` — Nội dung trọng tâm: ${meeting.nextMeetingAgenda}` : ''
              }.`,
              font: fontFamily,
              size: subSize,
              italics: true,
              color: primaryInk,
            }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: '' })] }),
      buildCalloutBox(summaryParas, {
        fill: 'F8FAFC',
        leftBorderColor: isDecree30 ? '1E293B' : '1D4ED8',
      })
    );
  }

  // =========================================================================
  // 9. MANDATORY CLOSING ATTESTATION (NGHI THỨC BẾ MẠC & CAM KẾT TRÁCH NHIỆM)
  // =========================================================================
  const approvalClause =
    meeting.archiveDetails?.approvedWithoutObjection !== false
      ? 'Toàn văn nội dung biên bản đã được Thư ký đọc lại công khai cho toàn thể cuộc họp cùng nghe, mọi thành viên tham dự đều nhất trí thông qua, không có ý kiến phản đối và cùng thống nhất ký tên xác nhận dưới đây.'
      : 'Toàn văn nội dung biên bản đã được Thư ký đọc lại công khai trước cuộc họp, ghi nhận đầy đủ các ý kiến thảo luận và ý kiến bảo lưu (nếu có).';

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 180 },
      alignment: AlignmentType.BOTH,
      keepNext: true,
      children: [
        new TextRun({
          text: `Biên bản này được lập thành ${totalCopies} bản chính có giá trị pháp lý như nhau, lưu tại ${storageLocs}. ${approvalClause} Chủ tọa và Thư ký chịu trách nhiệm liên đới về tính trung thực, chính xác của nội dung biên bản theo quy định của pháp luật. Cuộc họp bế mạc vào hồi ${adjournedTime} cùng ngày.`,
          font: fontFamily,
          size: subSize + 1,
          italics: true,
          color: primaryInk,
        }),
      ],
    })
  );

  // =========================================================================
  // 10. DECREE 30 FOOTER GRID: NƠI NHẬN (LEFT) + THƯ KÝ & CHỦ TỌA (RIGHT)
  // =========================================================================
  const distColW = 3755;
  const sigColW = 2800; // 3755 + 2800 + 2800 = 9355 DXA

  const distributionParas: Paragraph[] = [
    new Paragraph({
      spacing: { after: 55 },
      children: [
        new TextRun({
          text: 'Nơi nhận:',
          font: fontFamily,
          size: 23, // 11.5pt bold italic/underline per Decree 30
          bold: true,
          italics: true,
          underline: {},
          color: primaryInk,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 35 },
      children: [
        new TextRun({
          text: '- Như Thành phần tham dự;',
          font: fontFamily,
          size: 22, // 11pt per Decree 30 Nơi nhận standard
          bold: true,
          color: primaryInk,
        }),
      ],
    }),
    ...(meeting.distribution?.forAction || []).map(
      (fa) =>
        new Paragraph({
          spacing: { after: 35 },
          children: [
            new TextRun({ text: `- ${fa} (để thực hiện);`, font: fontFamily, size: 22, color: primaryInk }),
          ],
        })
    ),
    ...(meeting.distribution?.forInfo || []).map(
      (fi) =>
        new Paragraph({
          spacing: { after: 35 },
          children: [
            new TextRun({ text: `- ${fi} (để biết);`, font: fontFamily, size: 22, color: primaryInk }),
          ],
        })
    ),
    new Paragraph({
      children: [
        new TextRun({ text: '- Lưu: VT, Hồ sơ cuộc họp.', font: fontFamily, size: 22, color: primaryInk }),
      ],
    }),
  ];

  const buildSignerCell = (
    roleHeader: string,
    signerName: string,
    signedAt?: string,
    signatureType?: string
  ): TableCell => {
    const paras: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: roleHeader.toUpperCase(),
            font: fontFamily,
            size: 24, // 12pt bold
            bold: true,
            color: primaryInk,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: signedAt ? 220 : 860 },
        children: [
          new TextRun({
            text: '(Ký, ghi rõ họ tên)',
            font: fontFamily,
            size: 20, // 10pt italic
            italics: true,
            color: secondaryInk,
          }),
        ],
      }),
    ];

    if (signedAt) {
      paras.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [
            new TextRun({
              text: `[${getSignatureStampLabel(signatureType)}]`,
              font: fontFamily,
              size: 18,
              bold: true,
              color: '065F46',
            }),
          ],
        })
      );
    }

    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: signerName,
            font: fontFamily,
            size: 24,
            bold: true,
            color: primaryInk,
          }),
        ],
      })
    );

    return new TableCell({
      width: { size: sigColW, type: WidthType.DXA },
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 40, left: 40, right: 40 },
      children: paras,
    });
  };

  children.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [distColW, sigColW, sigColW],
      borders: {
        ...NO_BORDERS,
        insideHorizontal: NO_BORDER,
        insideVertical: NO_BORDER,
      },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: distColW, type: WidthType.DXA },
              borders: NO_BORDERS,
              margins: { top: 0, bottom: 40, left: 0, right: 80 },
              children: distributionParas,
            }),
            buildSignerCell(
              secretarySig?.roleTitle || 'THƯ KÝ GHI BIÊN BẢN',
              secDisplayName,
              secretarySig?.signedAt,
              secretarySig?.signatureType
            ),
            buildSignerCell(
              chairpersonSig?.roleTitle || 'CHỦ TỌA CUỘC HỌP',
              chairDisplayName,
              chairpersonSig?.signedAt,
              chairpersonSig?.signatureType
            ),
          ],
        }),
      ],
    })
  );

  // =========================================================================
  // 11. BILATERAL SIGNATURES (GROUP D) & ĐIỀU 158 REFUSAL RECORD & SHA-256 SEAL
  // =========================================================================
  if (meeting.group === 'D' && meeting.bilateral) {
    const halfSigW = 4677;
    const rightSigW = CONTENT_WIDTH_DXA - halfSigW;
    const topSep = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };

    children.push(
      new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: '' })] }),
      new Table({
        width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
        columnWidths: [halfSigW, rightSigW],
        borders: {
          ...NO_BORDERS,
          top: topSep,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              {
                header: 'ĐẠI DIỆN HỢP PHÁP BÊN A',
                org: meeting.bilateral.partyA.companyName,
                rep: meeting.bilateral.partyA.representative,
                w: halfSigW,
              },
              {
                header: 'ĐẠI DIỆN HỢP PHÁP BÊN B',
                org: meeting.bilateral.partyB.companyName,
                rep: meeting.bilateral.partyB.representative,
                w: rightSigW,
              },
            ].map(
              (col) =>
                new TableCell({
                  width: { size: col.w, type: WidthType.DXA },
                  borders: { ...NO_BORDERS, top: topSep },
                  margins: { top: 120, bottom: 40, left: 60, right: 60 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 25 },
                      children: [new TextRun({ text: col.header, font: fontFamily, size: 23, bold: true })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 25 },
                      children: [new TextRun({ text: col.org, font: fontFamily, size: 21, bold: true, color: secondaryInk })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 760 },
                      children: [
                        new TextRun({
                          text: '(Ký, đóng dấu pháp nhân và ghi rõ họ tên)',
                          font: fontFamily,
                          size: 20,
                          italics: true,
                          color: secondaryInk,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: col.rep, font: fontFamily, size: 23, bold: true })],
                    }),
                  ],
                })
            ),
          }),
        ],
      })
    );
  }

  // Ghi nhận việc từ chối ký biên bản theo Điều 158 Luật Doanh nghiệp 2020
  const refusedParticipants = meeting.participants.filter((p) => p.refusedSign);
  if (refusedParticipants.length > 0) {
    children.push(
      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: '' })] }),
      buildCalloutBox(
        [
          new Paragraph({
            alignment: AlignmentType.BOTH,
            children: [
              new TextRun({
                text: 'Ghi nhận trường hợp từ chối ký biên bản (Điều 158 Luật Doanh nghiệp 2020): ',
                font: fontFamily,
                size: subSize,
                bold: true,
                color: '9F1239',
              }),
              new TextRun({
                text: refusedParticipants
                  .map((p) => `${p.name} (${p.title}): ${p.refusalReason || 'Không nêu lý do cụ thể'}`)
                  .join(' | '),
                font: fontFamily,
                size: subSize,
                color: primaryInk,
              }),
            ],
          }),
        ],
        {
          fill: 'FFF1F2',
          leftBorderColor: 'E11D48',
          borderColor: 'FECDD3',
        }
      )
    );
  }

  if (meeting.contentHash) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: `Mã băm xác thực tính toàn vẹn tài liệu (SHA-256): ${meeting.contentHash}`,
            font: fontFamily,
            size: 18,
            italics: true,
            color: '64748B',
          }),
        ],
      })
    );
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
            size: bodySize,
            color: primaryInk,
          },
          paragraph: {
            spacing: { line: isDecree30 ? 292 : 300 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
            margin: {
              top: MARGIN_TOP_DXA,
              right: MARGIN_RIGHT_DXA,
              bottom: MARGIN_BOTTOM_DXA,
              left: MARGIN_LEFT_DXA,
            },
          },
        },
        footers: {
          default: createPageFooter(
            `Biên bản số: ${meeting.code}  •  Phiên bản v${meeting.version}  •  ${meeting.organization.name}`,
            fontFamily
          ),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * 2. OFFICIAL MEETING EXTRACT EXPORT (.docx)
 * Generates a formal Nghị định 30 & Điều 150 Luật Doanh nghiệp 2020
 * "BẢN TRÍCH LỤC BIÊN BẢN CUỘC HỌP" for banks, regulators, shareholders, or departments.
 */
export async function exportExtractToDocx(params: {
  meeting: Meeting;
  selectedAgendaIds: string[];
  reason: string;
  actorName: string;
  extractHash: string;
  timestamp: string;
}): Promise<Blob> {
  const { meeting, selectedAgendaIds, reason, actorName, extractHash, timestamp } = params;
  const fontFamily = 'Times New Roman';
  const bodySize = 26; // 13pt
  const subSize = 24; // 12pt
  const { day, month, year } = parseSafeDateParts(meeting.date);

  const selectedItems = meeting.agendaItems.filter((i) => selectedAgendaIds.includes(i.id));
  const selectedActions = selectedItems.flatMap((i) => i.actionItems);

  const chairSig = meeting.signatures.find((s) => s.role === 'chairperson');
  const secSig = meeting.signatures.find((s) => s.role === 'secretary');
  const chairName =
    chairSig?.signerName ||
    meeting.participants.find((p) => p.role === 'chairperson')?.name ||
    'Chủ tọa cuộc họp';
  const secName =
    secSig?.signerName ||
    meeting.participants.find((p) => p.role === 'secretary')?.name ||
    'Thư ký cuộc họp';

  const children: (Paragraph | Table)[] = [
    buildDecreeHeaderTable(meeting, fontFamily, `Số: ${meeting.code}/TL-BB`),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 280, after: 60 },
      keepNext: true,
      children: [
        new TextRun({
          text: 'TRÍCH LỤC BIÊN BẢN CUỘC HỌP',
          font: fontFamily,
          size: 30,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      keepNext: true,
      children: [
        new TextRun({
          text: `Về việc: ${meeting.title}`,
          font: fontFamily,
          size: 26,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '(Căn cứ Điều 150 Luật Doanh nghiệp 2020 và Nghị định 30/2020/NĐ-CP)',
          font: fontFamily,
          size: 22,
          italics: true,
          color: '334155',
        }),
      ],
    }),

    // Section I: Origin Metadata
    new Paragraph({
      spacing: { before: 120, after: 90 },
      keepNext: true,
      children: [
        new TextRun({
          text: 'I. THÔNG TIN HỒ SƠ BIÊN BẢN GỐC',
          font: fontFamily,
          size: bodySize,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 60 },
      children: [
        new TextRun({ text: '• Biên bản gốc số: ', font: fontFamily, size: bodySize, bold: true }),
        new TextRun({
          text: `${meeting.code} (Phiên bản v${meeting.version}), lập ngày ${day}/${month}/${year} (${meeting.startTime} - ${
            meeting.archiveDetails?.adjournedAt || meeting.endTime
          }).`,
          font: fontFamily,
          size: bodySize,
        }),
      ],
    }),
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 60 },
      children: [
        new TextRun({ text: '• Cơ quan / Pháp nhân ban hành: ', font: fontFamily, size: bodySize, bold: true }),
        new TextRun({
          text: `${meeting.organization.name}${
            meeting.organization.enterpriseCode ? ` (MSDN: ${meeting.organization.enterpriseCode})` : ''
          }.`,
          font: fontFamily,
          size: bodySize,
        }),
      ],
    }),
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 60 },
      children: [
        new TextRun({ text: '• Mục đích cấp bản trích lục: ', font: fontFamily, size: bodySize, bold: true }),
        new TextRun({ text: `${reason}.`, font: fontFamily, size: bodySize }),
      ],
    }),
    new Paragraph({
      indent: { left: 240 },
      spacing: { after: 120 },
      children: [
        new TextRun({ text: '• Người lập trích lục & Thời điểm: ', font: fontFamily, size: bodySize, bold: true }),
        new TextRun({ text: `${actorName} — lúc ${timestamp}.`, font: fontFamily, size: bodySize }),
      ],
    }),

    // Section II: Extracted Resolutions
    new Paragraph({
      spacing: { before: 120, after: 100 },
      keepNext: true,
      children: [
        new TextRun({
          text: `II. NỘI DUNG QUYẾT NGHỊ ĐƯỢC TRÍCH LỤC (${selectedItems.length}/${meeting.agendaItems.length} MỤC NGHỊ SỰ)`,
          font: fontFamily,
          size: bodySize,
          bold: true,
        }),
      ],
    }),
  ];

  selectedItems.forEach((item, idx) => {
    const dec = item.decision;
    const statusLabel =
      dec?.status === 'agreed'
        ? 'ĐÃ THÔNG QUA'
        : dec?.status === 'deferred'
        ? 'TẠM HOÃN XEM XÉT'
        : 'KHÔNG THÔNG QUA';

    children.push(
      new Paragraph({
        spacing: { before: 110, after: 65 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${idx + 1}. Mục số ${item.order} trong Biên bản gốc: ${item.title}`,
            font: fontFamily,
            size: bodySize,
            bold: true,
          }),
        ],
      })
    );

    const boxParas: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { after: dec?.vote || dec?.deferredReason ? 60 : 0 },
        children: [
          new TextRun({
            text: `Quyết nghị (${statusLabel}): `,
            font: fontFamily,
            size: bodySize,
            bold: true,
          }),
          new TextRun({
            text: dec?.content || 'Chưa ghi nhận quyết nghị.',
            font: fontFamily,
            size: bodySize,
          }),
        ],
      }),
    ];

    if (dec?.status === 'deferred' && dec.deferredReason) {
      boxParas.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Lý do hoãn: ', font: fontFamily, size: subSize, bold: true, italics: true }),
            new TextRun({ text: dec.deferredReason, font: fontFamily, size: subSize, italics: true }),
          ],
        })
      );
    }

    if (dec?.vote) {
      const v = dec.vote;
      boxParas.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          children: [
            new TextRun({
              text: `Kết quả biểu quyết (${formatVoteMethodLabel(v.method)}): `,
              font: fontFamily,
              size: subSize,
              bold: true,
            }),
            new TextRun({
              text: `Tán thành ${v.inFavor.toLocaleString('vi-VN')} / ${v.totalEligible.toLocaleString(
                'vi-VN'
              )} quyền hợp lệ (Đạt tỷ lệ ${v.ratioPassed}% so với ngưỡng ${v.thresholdPercent}%).`,
              font: fontFamily,
              size: subSize,
            }),
          ],
        })
      );
    }

    children.push(
      buildCalloutBox(boxParas, {
        fill: 'F8FAFC',
        leftBorderColor: '0F172A',
        borderColor: 'CBD5E1',
      })
    );
  });

  if (selectedActions.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 90 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'III. NHIỆM VỤ TRIỂN KHAI THUỘC PHẠM VI TRÍCH LỤC',
            font: fontFamily,
            size: bodySize,
            bold: true,
          }),
        ],
      }),
      buildActionItemsTable(selectedActions, fontFamily, bodySize, true)
    );
  }

  // Legal Attestation of True Extract
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 180 },
      alignment: AlignmentType.BOTH,
      keepNext: true,
      children: [
        new TextRun({
          text: `Cam kết sao trích lục: Nội dung nêu trên được trích xuất nguyên văn, trung thực và chính xác từ Biên bản gốc số ${meeting.code} đang lưu trữ tại đơn vị. Các nội dung khác nằm ngoài phạm vi trích lục không được hiển thị trong văn bản này. Mọi hành vi chỉnh sửa trái phép làm thay đổi nội dung sẽ làm mất hiệu lực của mã kiểm tra SHA-256 đi kèm.`,
          font: fontFamily,
          size: subSize,
          italics: true,
        }),
      ],
    })
  );

  // Certification Signatures
  const halfW = 4677;
  const rightW = CONTENT_WIDTH_DXA - halfW;
  children.push(
    new Table({
      width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
      columnWidths: [halfW, rightW],
      borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            { title: 'NGƯỜI LẬP TRÍCH LỤC / THƯ KÝ', name: secName, w: halfW },
            { title: 'XÁC NHẬN CỦA CHỦ TỌA / THỦ TRƯỞNG ĐƠN VỊ', name: chairName, w: rightW },
          ].map(
            (col) =>
              new TableCell({
                width: { size: col.w, type: WidthType.DXA },
                borders: NO_BORDERS,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 30 },
                    children: [new TextRun({ text: col.title, font: fontFamily, size: 23, bold: true })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 780 },
                    children: [
                      new TextRun({
                        text: '(Ký, ghi rõ họ tên và đóng dấu nếu có)',
                        font: fontFamily,
                        size: 20,
                        italics: true,
                        color: '475569',
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: col.name, font: fontFamily, size: 24, bold: true })],
                  }),
                ],
              })
          ),
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: `Mã xác thực bản trích lục (SHA-256): ${extractHash}`,
          font: fontFamily,
          size: 18,
          italics: true,
          color: '64748B',
        }),
      ],
    })
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: bodySize, color: '000000' },
          paragraph: { spacing: { line: 292 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
            margin: {
              top: MARGIN_TOP_DXA,
              right: MARGIN_RIGHT_DXA,
              bottom: MARGIN_BOTTOM_DXA,
              left: MARGIN_LEFT_DXA,
            },
          },
        },
        footers: {
          default: createPageFooter(
            `Trích lục Biên bản số: ${meeting.code}/TL-BB  •  Mã SHA-256: ${extractHash.slice(0, 16)}...`,
            fontFamily
          ),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/**
 * 3. ACTION ACCOUNTABILITY REPORT EXPORT (.docx)
 * Exports filtered post-meeting Action Items from ActionBoard into an executive Word table report.
 */
export async function exportActionItemsToDocx(params: {
  actions: (ActionItem & { meetingCode?: string })[];
  filterLabel: string;
  orgName: string;
  exportedBy: string;
}): Promise<Blob> {
  const { actions, filterLabel, orgName, exportedBy } = params;
  const fontFamily = 'Times New Roman';
  const nowStr = new Date().toLocaleString('vi-VN');
  const colWidths = [520, 1380, 2455, 1550, 1150, 1300, 1000]; // Sums to 9355 DXA
  const cellBorders = makeSolidBorders('000000', 4);

  const completedCount = actions.filter((a) => a.status === 'completed').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = actions.filter((a) => a.status !== 'completed' && a.deadline < todayStr).length;

  const headers = [
    'STT',
    'Biên bản',
    'Nội dung nhiệm vụ',
    'Người chủ trì',
    'Hạn chót',
    'Sản phẩm đầu ra',
    'Trạng thái',
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(
      (h, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          borders: cellBorders,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 70, right: 70 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: h, font: fontFamily, size: 21, bold: true })],
            }),
          ],
        })
    ),
  });

  const rows = actions.map((act, idx) => {
    const statusLabel = ACTION_STATUS_META[act.status]?.label || act.status;
    const prioLabel =
      act.priority === 'urgent' || act.priority === 'high'
        ? ` [${PRIORITY_META[act.priority]?.label}]`
        : '';

    const cells = [
      { text: String(idx + 1), align: AlignmentType.CENTER, bold: false },
      { text: act.meetingCode || '—', align: AlignmentType.CENTER, bold: false },
      { text: `${act.title}${prioLabel}`, align: AlignmentType.LEFT, bold: false },
      { text: act.ownerName, align: AlignmentType.LEFT, bold: true },
      { text: act.deadline || '—', align: AlignmentType.CENTER, bold: false },
      { text: act.deliverable || '—', align: AlignmentType.LEFT, bold: false },
      { text: statusLabel, align: AlignmentType.CENTER, bold: act.status === 'completed' },
    ];

    return new TableRow({
      cantSplit: true,
      children: cells.map(
        (c, i) =>
          new TableCell({
            width: { size: colWidths[i], type: WidthType.DXA },
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 75, bottom: 75, left: 70, right: 70 },
            children: [
              new Paragraph({
                alignment: c.align,
                children: [new TextRun({ text: c.text, font: fontFamily, size: 21, bold: c.bold })],
              }),
            ],
          })
      ),
    });
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: 24, color: '000000' },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
            margin: {
              top: MARGIN_TOP_DXA,
              right: MARGIN_RIGHT_DXA,
              bottom: MARGIN_BOTTOM_DXA,
              left: MARGIN_LEFT_DXA,
            },
          },
        },
        footers: {
          default: createPageFooter(
            `${orgName}  •  Báo cáo theo dõi nhiệm vụ sau họp (${nowStr})`,
            fontFamily
          ),
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: orgName.toUpperCase(), font: fontFamily, size: 24, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'BÁO CÁO THEO DÕI NHIỆM VỤ & TRÁCH NHIỆM GIẢI TRÌNH SAU HỌP',
                font: fontFamily,
                size: 28,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Phạm vi lọc: ${filterLabel}  |  Tổng số: ${actions.length} việc (Hoàn thành: ${completedCount}, Quá hạn: ${overdueCount})  |  Người xuất: ${exportedBy}`,
                font: fontFamily,
                size: 22,
                italics: true,
                color: '334155',
              }),
            ],
          }),
          new Table({
            width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
            columnWidths: colWidths,
            rows: [headerRow, ...rows],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
