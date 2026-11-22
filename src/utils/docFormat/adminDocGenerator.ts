import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import {
  CirculationScope,
  ConfidentialityLevel,
  DOC_TYPES_DICTIONARY,
  FontScalePreset,
  UrgencyLevel,
  VTC_ORGANIZATION_DEFAULTS,
  formatDecree30DateLine,
} from './vtcRegulationRules';
import {
  PORTRAIT_CONTENT_DXA,
  calculateOptimalColumnWidthsDxa,
  isNumericOrCurrencyText,
  parseSpreadsheetPasteToMatrix,
} from './openXmlTableEngine';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

export interface PartyFormBlock {
  roleTitle: string; // VD: "BÊN A (BÊN GIAO)"
  companyName: string;
  representative: string; // VD: "Ông Trần Quốc Sơn"
  position: string; // VD: "Chủ tịch Công ty"
  authNote?: string; // VD: "Theo Giấy ủy quyền số 02/GUQ-VTS ngày 16/04/2026"
  address: string;
  taxCode: string;
  bankAccount: string;
  bankName: string;
  phone?: string;
}

export interface AdminDocumentFormState {
  docTypeCode: string; // TTr, BC, QĐ, CV, HĐ, TB...
  fontScale: FontScalePreset; // '12_13' | '13_14'
  governingBody: string; // Ô 2 dòng 1
  issuerOrgName: string; // Ô 2 dòng 2
  draftingDeptName: string; // Ô 2 dòng 3 (nếu cấp đơn vị)
  draftingDeptCode: string; // TCHC, KD, VTS...
  docCodeText: string; // Ô 3: Số: 07/QĐ-VTS
  locationCity: string; // Ô 4: Hà Nội
  issueDate: string; // YYYY-MM-DD
  subject: string; // Ô 5a/5b: Trích yếu
  decisionAuthorityLines?: string[]; // Riêng QĐ: ["CHỦ TỊCH", "CÔNG TY TNHH MTV VIỄN THÔNG SỐ VTC"]
  recipientsKinhGui: string[]; // Ô 9a: Danh sách Kính gửi
  basisLines: string[]; // Phần Căn cứ
  bodyParagraphs: string[]; // Nội dung chính (mỗi dòng 1 đoạn / Điều / Mục)
  closingCourtesy: string; // VD: "Trân trọng./."
  receiversNoinhan: string[]; // Ô 9b: Nơi nhận
  drafterInitialsAndCopies?: string; // Ô 12: VD "TK(03)"
  signerTopAuthorityLine: string; // Ô 7a dòng trên: KT. GIÁM ĐỐC / TL. GIÁM ĐỐC / ""
  signerRoleTitle: string; // Ô 7a dòng chính: CHỦ TỊCH / PHÓ GIÁM ĐỐC / TRƯỞNG ĐƠN VỊ
  signerFullName: string; // Ô 7b: Trần Quốc Sơn
  approvalLayoutMode: 'none' | 'footer_3col_vtc' | 'top_left_box'; // Cho Tờ trình nội bộ
  confidentiality: ConfidentialityLevel; // Ô 10a
  urgency: UrgencyLevel; // Ô 10b
  circulationScope: CirculationScope; // Ô 11
  includeContactFooterPage1: boolean; // Ô 13
  contactFooterText: string;
  electronicCopyStamp?: string; // Ô 14: SAO Y + ISO 8601
  // Dành cho Hợp đồng (HĐ)
  partyA?: PartyFormBlock;
  partyB?: PartyFormBlock;
  // Bảng dữ liệu đính kèm tùy chọn (dán từ Excel/TSV)
  embeddedTableTsv?: string;
  embeddedTableTitle?: string;
}

function makeThinRuleParagraph(indentEachSideDxa: number, afterDxa = 90): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: indentEachSideDxa, right: indentEachSideDxa },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: '000000' },
    },
    spacing: { before: 0, after: afterDxa, line: 20 },
    children: [],
  });
}

function buildPartyBlockTable(party: PartyFormBlock, fontSizeHalfPt: number): (Paragraph | Table)[] {
  const col1W = 2041; // 3.6cm
  const col2W = PORTRAIT_CONTENT_DXA - col1W;

  const rowsRaw: { label: string; val: string; isAuth?: boolean; boldName?: boolean }[] = [
    { label: 'Đại diện', val: party.representative, boldName: true },
    { label: 'Chức vụ', val: party.position },
    ...(party.authNote?.trim()
      ? [{ label: '', val: `(${party.authNote.trim().replace(/^\(|\)$/g, '')})`, isAuth: true }]
      : []),
    { label: 'Địa chỉ', val: party.address },
    ...(party.phone?.trim() ? [{ label: 'Điện thoại', val: party.phone }] : []),
    { label: 'Mã số thuế', val: party.taxCode },
    ...(party.bankAccount?.trim() ? [{ label: 'Tài khoản', val: party.bankAccount }] : []),
    ...(party.bankName?.trim() ? [{ label: 'Mở tại', val: party.bankName }] : []),
  ];

  const headerP = new Paragraph({
    spacing: { before: 90, after: 30 },
    keepNext: true,
    children: [
      new TextRun({
        text: `${party.roleTitle.toUpperCase()}: ${party.companyName.toUpperCase()}`,
        font: 'Times New Roman',
        size: fontSizeHalfPt,
        bold: true,
      }),
    ],
  });

  const tbl = new Table({
    width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
    columnWidths: [col1W, col2W],
    borders: {
      ...NO_BORDERS,
      insideHorizontal: NO_BORDER,
      insideVertical: NO_BORDER,
    },
    rows: rowsRaw.map((r) => {
      let valRuns: TextRun[];
      if (r.isAuth) {
        valRuns = [
          new TextRun({
            text: r.val,
            font: 'Times New Roman',
            size: fontSizeHalfPt,
            italics: true,
          }),
        ];
      } else if (r.boldName) {
        const m = r.val.match(/^(Ông|Bà)\s+(.+)$/i);
        if (m) {
          valRuns = [
            new TextRun({ text: `: ${m[1]} `, font: 'Times New Roman', size: fontSizeHalfPt }),
            new TextRun({ text: m[2], font: 'Times New Roman', size: fontSizeHalfPt, bold: true }),
          ];
        } else {
          valRuns = [
            new TextRun({ text: ': ', font: 'Times New Roman', size: fontSizeHalfPt }),
            new TextRun({ text: r.val, font: 'Times New Roman', size: fontSizeHalfPt, bold: true }),
          ];
        }
      } else {
        valRuns = [
          new TextRun({
            text: `: ${r.val}`,
            font: 'Times New Roman',
            size: fontSizeHalfPt,
          }),
        ];
      }

      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: col1W, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 15, bottom: 15, left: 0, right: 20 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: r.label
                  ? [new TextRun({ text: r.label, font: 'Times New Roman', size: fontSizeHalfPt })]
                  : [],
              }),
            ],
          }),
          new TableCell({
            width: { size: col2W, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 15, bottom: 15, left: 0, right: 0 },
            children: [
              new Paragraph({
                alignment: AlignmentType.BOTH,
                indent: r.isAuth ? { left: 198 } : { left: 198, hanging: 198 },
                children: valRuns,
              }),
            ],
          }),
        ],
      });
    }),
  });

  return [headerP, tbl];
}

function buildEmbeddedSmartTable(tsv: string, title?: string): (Paragraph | Table)[] {
  const matrix = parseSpreadsheetPasteToMatrix(tsv);
  if (matrix.length === 0) return [];
  const totalCols = matrix[0].length;
  const headers = matrix[0];
  const dataRows = matrix.slice(1);
  const isCol0Index = /^(stt|tt|no\.?)$/i.test((headers[0] || '').trim());

  const { widths, kinds } = calculateOptimalColumnWidthsDxa({
    headers,
    totalCols,
    isCol0Index,
    totalWidthDxa: PORTRAIT_CONTENT_DXA,
    isLandscape: false,
    rowsMatrix: dataRows,
  });

  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const borders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };
  const sz = totalCols >= 6 ? 22 : 24;

  const out: (Paragraph | Table)[] = [];
  if (title?.trim()) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 80 },
        keepNext: true,
        children: [
          new TextRun({
            text: title.trim(),
            font: 'Times New Roman',
            size: 26,
            bold: true,
          }),
        ],
      })
    );
  }

  out.push(
    new Table({
      width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({
          tableHeader: true,
          cantSplit: true,
          children: headers.map(
            (h, i) =>
              new TableCell({
                width: { size: widths[i], type: WidthType.DXA },
                borders,
                shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: h, font: 'Times New Roman', size: sz, bold: true }),
                    ],
                  }),
                ],
              })
          ),
        }),
        ...dataRows.map(
          (row) =>
            new TableRow({
              cantSplit: true,
              children: row.map((val, cIdx) => {
                const kind = kinds[cIdx] || 'text_main';
                const align =
                  kind === 'index' || kind === 'unit' || kind === 'quantity'
                    ? AlignmentType.CENTER
                    : kind === 'unit_price' ||
                      kind === 'total_price' ||
                      isNumericOrCurrencyText(val)
                    ? AlignmentType.RIGHT
                    : AlignmentType.LEFT;
                return new TableCell({
                  width: { size: widths[cIdx], type: WidthType.DXA },
                  borders,
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 55, bottom: 55, left: 60, right: 60 },
                  children: [
                    new Paragraph({
                      alignment: align,
                      children: [new TextRun({ text: val, font: 'Times New Roman', size: sz })],
                    }),
                  ],
                });
              }),
            })
        ),
      ],
    })
  );

  return out;
}

/**
 * Sinh file Microsoft Word (.docx) chuẩn 14 Ô Thể thức Quy chế 07/QĐ-VTS & Nghị định 30/2020/NĐ-CP
 */
export async function exportAdminDocumentToDocx(state: AdminDocumentFormState): Promise<Blob> {
  const meta =
    DOC_TYPES_DICTIONARY.find((d) => d.code === state.docTypeCode) || DOC_TYPES_DICTIONARY[0];

  const quocHieuSz = state.fontScale === '13_14' ? 26 : 24; // 13pt vs 12pt
  const bodySz = state.fontScale === '13_14' ? 28 : 26; // 14pt vs 13pt
  const dateLine = formatDecree30DateLine(state.locationCity, state.issueDate);

  const children: (Paragraph | Table)[] = [];

  // =========================================================================
  // 1. BẢNG ĐẦU TRANG: Ô 1, Ô 2, Ô 3, Ô 4, Ô 5b (Công văn), Ô 10a/b, Ô 11, Ô 14
  // =========================================================================
  const leftW = 4255;
  const rightW = PORTRAIT_CONTENT_DXA - leftW; // 5100 DXA

  const leftCellParas: Paragraph[] = [];
  if (state.governingBody.trim()) {
    leftCellParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: state.governingBody.trim().toUpperCase(),
            font: 'Times New Roman',
            size: quocHieuSz,
            bold: false,
          }),
        ],
      })
    );
  }

  leftCellParas.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: state.draftingDeptName.trim() ? 20 : 30 },
      children: [
        new TextRun({
          text: (state.issuerOrgName || VTC_ORGANIZATION_DEFAULTS.companyName).trim().toUpperCase(),
          font: 'Times New Roman',
          size: quocHieuSz,
          bold: !state.draftingDeptName.trim(),
        }),
      ],
    })
  );

  if (state.draftingDeptName.trim()) {
    leftCellParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 25 },
        children: [
          new TextRun({
            text: state.draftingDeptName.trim().toUpperCase(),
            font: 'Times New Roman',
            size: quocHieuSz,
            bold: true,
          }),
        ],
      })
    );
  }

  // Đường kẻ ngang Ô 2 dài bằng ~1/3 - 1/2 dòng tên cơ quan
  leftCellParas.push(makeThinRuleParagraph(1350, 80));

  // Ô 3: Số & Ký hiệu văn bản
  leftCellParas.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: state.docTypeCode === 'CV' ? 120 : 40 },
      children: [
        new TextRun({
          text: state.docCodeText.trim(),
          font: 'Times New Roman',
          size: 26, // 13pt chuẩn Ô 3
        }),
      ],
    })
  );

  // Ô 5b: Trích yếu Công văn (nằm ngay dưới Số/Ký hiệu, căn giữa Ô 3, không kẻ ngang dưới)
  if (state.docTypeCode === 'CV' && state.subject.trim()) {
    const cleanVv = state.subject.trim().replace(/^(V\/v|Về việc)\s*:?\s*/i, '');
    leftCellParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `V/v ${cleanVv}`,
            font: 'Times New Roman',
            size: 25, // 12.5pt
          }),
        ],
      })
    );
  }

  // Ô 10a: Dấu chỉ độ mật
  if (state.confidentiality !== 'none') {
    const confLabel =
      state.confidentiality === 'TUYET_MAT'
        ? 'TUYỆT MẬT'
        : state.confidentiality === 'TOI_MAT'
        ? 'TỐI MẬT'
        : 'MẬT';
    leftCellParas.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 40 },
        children: [
          new TextRun({
            text: confLabel,
            font: 'Times New Roman',
            size: 26,
            bold: true,
            color: 'B91C1C',
          }),
        ],
      })
    );
  }

  // Ô 10b: Dấu chỉ mức độ khẩn (khung chữ nhật viền đơn màu đỏ tươi)
  if (state.urgency !== 'none') {
    const urgLabel =
      state.urgency === 'HOA_TOC'
        ? 'HỎA TỐC'
        : state.urgency === 'THUONG_KHAN'
        ? 'THƯỢNG KHẨN'
        : 'KHẨN';
    leftCellParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        indent: { right: 2200 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: 'DC2626' },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: 'DC2626' },
          left: { style: BorderStyle.SINGLE, size: 8, color: 'DC2626' },
          right: { style: BorderStyle.SINGLE, size: 8, color: 'DC2626' },
        },
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: urgLabel,
            font: 'Times New Roman',
            size: 26,
            bold: true,
            color: 'DC2626',
          }),
        ],
      })
    );
  }

  const rightCellParas: Paragraph[] = [];

  // Ô 14: Chữ ký số bản sao điện tử (10pt góc trên phải)
  if (state.electronicCopyStamp?.trim()) {
    rightCellParas.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: state.electronicCopyStamp.trim(),
            font: 'Times New Roman',
            size: 20, // 10pt
          }),
        ],
      })
    );
  }

  // Ô 11: Chỉ dẫn phạm vi lưu hành
  if (state.circulationScope !== 'none') {
    const circLabel =
      state.circulationScope === 'TAI_LIEU_THU_HOI'
        ? 'TÀI LIỆU THU HỒI'
        : state.circulationScope === 'XEM_XONG_TRA_LAI'
        ? 'XEM XONG TRẢ LẠI'
        : 'LƯU HÀNH NỘI BỘ';
    rightCellParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        indent: { left: 1600 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
        },
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: circLabel,
            font: 'Times New Roman',
            size: 24,
            bold: true,
          }),
        ],
      })
    );
  }

  // Ô 1: Quốc hiệu & Tiêu ngữ (đường kẻ dưới bằng 100% độ dài Tiêu ngữ)
  rightCellParas.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
          font: 'Times New Roman',
          size: quocHieuSz,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: 'Độc lập - Tự do - Hạnh phúc',
          font: 'Times New Roman',
          size: bodySz,
          bold: true,
        }),
      ],
    }),
    makeThinRuleParagraph(950, 90),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: dateLine,
          font: 'Times New Roman',
          size: bodySz,
          italics: true,
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
      columnWidths: [leftW, rightW],
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
              width: { size: leftW, type: WidthType.DXA },
              borders: NO_BORDERS,
              margins: { top: 0, bottom: 40, left: 0, right: 60 },
              children: leftCellParas,
            }),
            new TableCell({
              width: { size: rightW, type: WidthType.DXA },
              borders: NO_BORDERS,
              margins: { top: 0, bottom: 40, left: 60, right: 0 },
              children: rightCellParas,
            }),
          ],
        }),
      ],
    })
  );

  // Tùy chọn Mẫu 9 Phụ lục III: Khung PHÊ DUYỆT góc trái trên
  if (state.docTypeCode === 'TTr' && state.approvalLayoutMode === 'top_left_box') {
    const boxBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
    children.push(
      new Table({
        width: { size: 4200, type: WidthType.DXA },
        columnWidths: [4200],
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 4200, type: WidthType.DXA },
                borders: { top: boxBorder, bottom: boxBorder, left: boxBorder, right: boxBorder },
                margins: { top: 70, bottom: 70, left: 100, right: 100 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 360 },
                    children: [
                      new TextRun({
                        text: 'Ý KIẾN PHÊ DUYỆT CỦA LÃNH ĐẠO',
                        font: 'Times New Roman',
                        size: 24,
                        bold: true,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Ngày ..../..../20....',
                        font: 'Times New Roman',
                        size: 22,
                        italics: true,
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

  // =========================================================================
  // 2. Ô 5a: TÊN LOẠI & TRÍCH YẾU VĂN BẢN (Trừ Công văn)
  // =========================================================================
  if (meta.hasTypeHeader) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: state.subject.trim() ? 40 : 140 },
        keepNext: true,
        children: [
          new TextRun({
            text:
              state.docTypeCode === 'HĐ' && state.subject.trim()
                ? state.subject.trim().toUpperCase()
                : meta.upperTitle,
            font: 'Times New Roman',
            size: state.docTypeCode === 'HĐ' ? 30 : bodySz + 2,
            bold: true,
          }),
        ],
      })
    );

    if (state.docTypeCode !== 'HĐ' && state.subject.trim()) {
      const cleanSubj = state.subject.trim().replace(/^(Về việc|V\/v)\s*:?\s*/i, '');
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 30 },
          keepNext: true,
          children: [
            new TextRun({
              text: `Về việc ${cleanSubj}`,
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
          ],
        }),
        makeThinRuleParagraph(3100, 140)
      );
    }
  } else {
    children.push(new Paragraph({ spacing: { before: 140 }, children: [] }));
  }

  // =========================================================================
  // 3. Ô 9a: KÍNH GỬI (Tờ trình, Báo cáo, Công văn, Giấy mời...)
  // =========================================================================
  const validKinhGui = state.recipientsKinhGui.map((r) => r.trim()).filter(Boolean);
  if (meta.hasKinhGui && validKinhGui.length > 0) {
    if (validKinhGui.length === 1) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 140 },
          keepNext: true,
          children: [
            new TextRun({
              text: 'Kính gửi: ',
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
            new TextRun({
              text: validKinhGui[0].replace(/[.;]+$/, ''),
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
          ],
        })
      );
    } else {
      children.push(
        new Paragraph({
          indent: { left: 1800 },
          spacing: { before: 40, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: 'Kính gửi:',
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
          ],
        }),
        ...validKinhGui.map((kg, idx) => {
          const isLast = idx === validKinhGui.length - 1;
          const cleanKg = kg.replace(/^-\s*/, '').replace(/[.;]+$/, '');
          return new Paragraph({
            indent: { left: 2400 },
            spacing: { after: isLast ? 140 : 40 },
            keepNext: true,
            children: [
              new TextRun({
                text: `- ${cleanKg}${isLast ? '.' : ';'}`,
                font: 'Times New Roman',
                size: bodySz,
                bold: true,
              }),
            ],
          });
        })
      );
    }
  }

  // =========================================================================
  // 4. THẨM QUYỀN BAN HÀNH (Riêng Quyết định / Nghị quyết theo phôi VTC Digicom)
  // =========================================================================
  if (state.docTypeCode === 'QĐ' && state.decisionAuthorityLines && state.decisionAuthorityLines.length > 0) {
    state.decisionAuthorityLines
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line, idx, arr) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: idx === 0 ? 40 : 0, after: idx === arr.length - 1 ? 140 : 25 },
            keepNext: true,
            children: [
              new TextRun({
                text: line.toUpperCase(),
                font: 'Times New Roman',
                size: bodySz,
                bold: true,
              }),
            ],
          })
        );
      });
  }

  // =========================================================================
  // 5. PHẦN CĂN CỨ (Ô 6 — Nghiêng cho QĐ/NQ/QC/QyĐ/HĐ, Đứng cho TTr/BC/CV)
  // =========================================================================
  const validBasis = state.basisLines.map((b) => b.trim()).filter(Boolean);
  validBasis.forEach((bLine, idx) => {
    const isLast = idx === validBasis.length - 1;
    const stripped = bLine.replace(/[.,;:\s]+$/, '');
    const withPrefix = /^(-|\s*Căn cứ)/i.test(stripped) ? stripped : `Căn cứ ${stripped}`;
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: 720 }, // 1.27cm chuẩn NĐ30
        spacing: { after: isLast ? 120 : 60 },
        children: [
          new TextRun({
            text: `${withPrefix}${isLast ? '.' : ';'}`,
            font: 'Times New Roman',
            size: bodySz,
            italics: meta.italicBasis,
          }),
        ],
      })
    );
  });

  // Riêng Quyết định có dòng "QUYẾT ĐỊNH:" căn giữa trước Điều 1
  if (state.docTypeCode === 'QĐ') {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 120 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'QUYẾT ĐỊNH:',
            font: 'Times New Roman',
            size: bodySz,
            bold: true,
          }),
        ],
      })
    );
  }

  // Riêng Hợp đồng: Render khối BÊN A & BÊN B dạng bảng 2 cột ẩn viền
  if (state.docTypeCode === 'HĐ' && state.partyA && state.partyB) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: 720 },
        spacing: { after: 60 },
        keepNext: true,
        children: [
          new TextRun({
            text: `Hôm nay, ${dateLine.replace(/^[^,]+,\s*/, '')}, tại ${
              state.locationCity || 'Hà Nội'
            }, chúng tôi gồm có:`,
            font: 'Times New Roman',
            size: bodySz,
          }),
        ],
      }),
      ...buildPartyBlockTable(state.partyA, bodySz),
      new Paragraph({
        indent: { firstLine: 0 },
        spacing: { before: 20, after: 60 },
        children: [
          new TextRun({ text: '(Sau đây gọi tắt là ', font: 'Times New Roman', size: bodySz, italics: true }),
          new TextRun({ text: '“Bên A”', font: 'Times New Roman', size: bodySz, bold: true, italics: true }),
          new TextRun({ text: ')', font: 'Times New Roman', size: bodySz, italics: true }),
        ],
      }),
      ...buildPartyBlockTable(state.partyB, bodySz),
      new Paragraph({
        indent: { firstLine: 0 },
        spacing: { before: 20, after: 80 },
        children: [
          new TextRun({ text: '(Sau đây gọi tắt là ', font: 'Times New Roman', size: bodySz, italics: true }),
          new TextRun({ text: '“Bên B”', font: 'Times New Roman', size: bodySz, bold: true, italics: true }),
          new TextRun({ text: ')', font: 'Times New Roman', size: bodySz, italics: true }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: 720 },
        spacing: { before: 40, after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'Hai Bên thống nhất thỏa thuận và ký kết Hợp đồng với các điều khoản cụ thể sau đây:',
            font: 'Times New Roman',
            size: bodySz,
          }),
        ],
      })
    );
  }

  // =========================================================================
  // 6. Ô 6: NỘI DUNG VĂN BẢN (Tự động nhận diện Điều, Khoản, Điểm & Chống mồ côi chữ ký)
  // =========================================================================
  const bodyLines = state.bodyParagraphs.map((p) => p.trim()).filter(Boolean);
  bodyLines.forEach((line, idx) => {
    const isNearSignature = idx >= bodyLines.length - 2;
    const dieuMatch = line.match(/^(Điều\s+\d+\.(?:\s+[^:.\n]{1,70}[.:]?)?)(.*)$/i);
    const mucMatch = line.match(/^([IVX]+\.\s+.+)$/);

    if (mucMatch) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          indent: { firstLine: 720 },
          spacing: { before: 100, after: 60 },
          keepNext: true,
          keepLines: true,
          children: [
            new TextRun({
              text: mucMatch[1],
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
          ],
        })
      );
    } else if (dieuMatch) {
      const boldPart = dieuMatch[1];
      const restPart = dieuMatch[2];
      children.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          indent: { firstLine: 720 },
          spacing: { before: 90, after: 80 },
          keepNext: isNearSignature || !restPart.trim(),
          keepLines: isNearSignature,
          children: [
            new TextRun({ text: boldPart, font: 'Times New Roman', size: bodySz, bold: true }),
            ...(restPart
              ? [new TextRun({ text: restPart, font: 'Times New Roman', size: bodySz })]
              : []),
          ],
        })
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          indent: { firstLine: 720 },
          spacing: { after: 100 }, // >= 5pt-6pt chuẩn NĐ30
          keepNext: isNearSignature,
          keepLines: isNearSignature,
          children: [new TextRun({ text: line, font: 'Times New Roman', size: bodySz })],
        })
      );
    }
  });

  // Bảng dữ liệu nhúng trực tiếp (FormatBang) nếu có
  if (state.embeddedTableTsv?.trim()) {
    children.push(...buildEmbeddedSmartTable(state.embeddedTableTsv, state.embeddedTableTitle));
  }

  // Dòng kết xã giao (Trân trọng./.) cho Tờ trình, Báo cáo, Công văn
  if (state.closingCourtesy.trim() && state.docTypeCode !== 'QĐ' && state.docTypeCode !== 'HĐ') {
    children.push(
      new Paragraph({
        alignment: AlignmentType.BOTH,
        indent: { firstLine: 720 },
        spacing: { before: 60, after: 140 },
        keepNext: true,
        children: [
          new TextRun({
            text: state.closingCourtesy.trim().replace(/\s+\.\/\./, './.'),
            font: 'Times New Roman',
            size: bodySz,
            italics: true,
          }),
        ],
      })
    );
  }

  // =========================================================================
  // 7. CHÂN TRANG: Ô 9b (NƠI NHẬN) + Ô 7a/7b (CHỨC VỤ & HỌ TÊN NGƯỜI KÝ) + Ô 12
  // =========================================================================
  if (state.docTypeCode === 'HĐ' && state.partyA && state.partyB) {
    const halfW = 4677;
    const rightHalfW = PORTRAIT_CONTENT_DXA - halfW;
    const cleanRepA = state.partyA.representative.replace(/^(Ông|Bà)\s+/i, '');
    const cleanRepB = state.partyB.representative.replace(/^(Ông|Bà)\s+/i, '');

    children.push(
      new Paragraph({ spacing: { before: 140 }, keepNext: true, children: [] }),
      new Table({
        width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
        columnWidths: [halfW, rightHalfW],
        borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              { title: 'ĐẠI DIỆN BÊN A', pos: state.partyA.position, name: cleanRepA, w: halfW },
              { title: 'ĐẠI DIỆN BÊN B', pos: state.partyB.position, name: cleanRepB, w: rightHalfW },
            ].map(
              (col) =>
                new TableCell({
                  width: { size: col.w, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 20 },
                      children: [
                        new TextRun({ text: col.title, font: 'Times New Roman', size: bodySz, bold: true }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 20 },
                      children: [
                        new TextRun({
                          text: col.pos.toUpperCase(),
                          font: 'Times New Roman',
                          size: bodySz - 2,
                          bold: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 880 },
                      children: [
                        new TextRun({
                          text: '(Ký, ghi rõ họ tên và đóng dấu)',
                          font: 'Times New Roman',
                          size: 22,
                          italics: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: col.name, font: 'Times New Roman', size: bodySz, bold: true }),
                      ],
                    }),
                  ],
                })
            ),
          }),
        ],
      })
    );
  } else {
    // Danh sách Nơi nhận (Ô 9b: Chữ "Nơi nhận:" 12pt đậm nghiêng; danh sách 11pt đứng)
    const noiNhanParas: Paragraph[] = [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: 'Nơi nhận:',
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
            italics: true,
          }),
        ],
      }),
      ...state.receiversNoinhan
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const clean = r.replace(/^-\s*/, '').replace(/[.;]+$/, '');
          return new Paragraph({
            spacing: { after: 25 },
            children: [
              new TextRun({
                text: `- ${clean}${isLast ? '.' : ';'}`,
                font: 'Times New Roman',
                size: 22, // 11pt chuẩn Ô 9b
              }),
            ],
          });
        }),
    ];

    // Ô 12: Ký hiệu người soạn thảo và số lượng bản phát hành (VD: TK(03))
    if (state.drafterInitialsAndCopies?.trim()) {
      noiNhanParas.push(
        new Paragraph({
          spacing: { before: 40 },
          children: [
            new TextRun({
              text: state.drafterInitialsAndCopies.trim().toUpperCase(),
              font: 'Times New Roman',
              size: 22, // 11pt
            }),
          ],
        })
      );
    }

    const cleanSignerName = state.signerFullName
      .trim()
      .replace(/^(TS|ThS|PGS|GS|KS|CN|BS)\.?\s+/i, '');

    const signerParas: Paragraph[] = [];
    if (state.signerTopAuthorityLine.trim()) {
      signerParas.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 25 },
          children: [
            new TextRun({
              text: state.signerTopAuthorityLine.trim().toUpperCase(),
              font: 'Times New Roman',
              size: bodySz,
              bold: true,
            }),
          ],
        })
      );
    }
    signerParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 920 }, // Khoảng trống ký tên & đóng dấu (Ô 7c & Ô 8)
        children: [
          new TextRun({
            text: state.signerRoleTitle.trim().toUpperCase(),
            font: 'Times New Roman',
            size: bodySz,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: cleanSignerName,
            font: 'Times New Roman',
            size: bodySz,
            bold: true,
          }),
        ],
      })
    );

    if (state.docTypeCode === 'TTr' && state.approvalLayoutMode === 'footer_3col_vtc') {
      // Bảng 3 cột chuẩn thực tế VTC Digicom: | Nơi nhận | PHÊ DUYỆT | TRƯỞNG ĐƠN VỊ |
      const wLeft = 3655;
      const wMid = 2850;
      const wRight = PORTRAIT_CONTENT_DXA - wLeft - wMid; // 2850 DXA
      children.push(
        new Table({
          width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
          columnWidths: [wLeft, wMid, wRight],
          borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: wLeft, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: noiNhanParas,
                }),
                new TableCell({
                  width: { size: wMid, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 920 },
                      children: [
                        new TextRun({
                          text: 'PHÊ DUYỆT',
                          font: 'Times New Roman',
                          size: bodySz,
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: wRight, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: signerParas,
                }),
              ],
            }),
          ],
        })
      );
    } else {
      const wLeft = 4355;
      const wRight = PORTRAIT_CONTENT_DXA - wLeft; // 5000 DXA
      children.push(
        new Table({
          width: { size: PORTRAIT_CONTENT_DXA, type: WidthType.DXA },
          columnWidths: [wLeft, wRight],
          borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
          rows: [
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: wLeft, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: noiNhanParas,
                }),
                new TableCell({
                  width: { size: wRight, type: WidthType.DXA },
                  borders: NO_BORDERS,
                  children: signerParas,
                }),
              ],
            }),
          ],
        })
      );
    }
  }

  // Ô 13: Footer thông tin liên hệ trang 1 (nếu bật) + Header đánh số trang từ trang 2 (ẩn trang 1)
  const firstPageFooter = state.includeContactFooterPage1
    ? new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, space: 4, color: '000000' } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: state.contactFooterText,
                font: 'Times New Roman',
                size: 22, // 11pt chuẩn Ô 13
              }),
            ],
          }),
        ],
      })
    : new Footer({ children: [new Paragraph({ children: [] })] });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: bodySz, color: '000000' },
          paragraph: { spacing: { line: 288 } }, // ~1.2x giãn dòng chuẩn
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: true, // Ẩn số trang ở Trang 1 theo Mục I.9 Phụ lục I NĐ30 & Quy chế 07/QĐ-VTS
          page: {
            size: {
              width: 11906,
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: 1134, // 20mm
              bottom: 1134, // 20mm
              left: 1701, // 30mm
              right: 850, // 15mm
            },
          },
        },
        headers: {
          first: new Header({ children: [new Paragraph({ children: [] })] }),
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: bodySz,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          first: firstPageFooter,
          default: new Footer({ children: [new Paragraph({ children: [] })] }),
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
