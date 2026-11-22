import {
  AlignmentType,
  BorderStyle,
  Document,
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

export const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export type SemanticColKind =
  | 'index' // STT, TT, No, Số TT
  | 'unit' // Đơn vị tính, ĐVT, Đơn vị
  | 'quantity' // Số lượng, SL, Khối lượng
  | 'origin' // Xuất xứ, Nơi sản xuất, Hãng SX, Version
  | 'unit_price' // Đơn giá, Đơn giá (VNĐ)
  | 'total_price' // Thành tiền, Tổng tiền, Giá trị
  | 'tax' // Thuế, VAT, Thuế suất
  | 'duration' // Thời gian, Tiến độ, Thời hạn
  | 'location' // Địa điểm, Nơi thực hiện, Phương thức
  | 'organization' // Đơn vị thực hiện, Nhân sự, Chủ trì
  | 'warranty' // Bảo hành
  | 'category' // Hạng mục, Phân loại
  | 'system_group' // Nhóm hệ thống, Hệ thống
  | 'ip_url' // IP / URL, Domain
  | 'technical_spec' // Chỉ tiêu kỹ thuật, Yêu cầu kỹ thuật, Tiêu chí
  | 'text_main'; // Nội dung chính, Tên hàng hóa, Mô tả

export const COL_KIND_LABELS: Record<SemanticColKind, string> = {
  index: 'STT',
  unit: 'ĐVT',
  quantity: 'Số lượng',
  origin: 'Xuất xứ / Hãng',
  unit_price: 'Đơn giá (Căn phải)',
  total_price: 'Thành tiền (Căn phải)',
  tax: 'Thuế VAT',
  duration: 'Tiến độ / Thời hạn',
  location: 'Địa điểm',
  organization: 'Đơn vị / Chủ trì',
  warranty: 'Bảo hành',
  category: 'Phân loại',
  system_group: 'Hệ thống',
  ip_url: 'IP / URL',
  technical_spec: 'Chỉ tiêu kỹ thuật',
  text_main: 'Nội dung mở rộng',
};

export function cmToDxa(cm: number): number {
  return Math.round(cm * 567);
}

// Vùng in chuẩn Nghị định 30/2020/NĐ-CP:
// - Khổ A4 Dọc (210mm, Lề trái 30mm, Lề phải 15mm) => Rộng nội dung = 165mm = 9355 DXA
// - Khổ A4 Ngang (297mm, Lề trái 25mm, Lề phải 20mm) => Rộng nội dung = 252mm = 14288 DXA
export const PORTRAIT_CONTENT_DXA = 9355;
export const LANDSCAPE_CONTENT_DXA = 14288;

export function isNumericOrCurrencyText(text: string): boolean {
  if (!text || !text.trim()) return false;
  const t = text.trim();
  if (t === '-' || t === '–' || t === '—') return true;

  let clean = t
    .replace(/(?<![\p{L}\p{N}])(vnđ|vnd|đ|đồng|dong|usd|eur)(?![\p{L}\p{N}])|[đ$€¥]/giu, '')
    .trim();

  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean.startsWith('-') || clean.startsWith('+')) {
    clean = clean.slice(1).trim();
  }

  if (!clean || !/\d/.test(clean)) return false;
  if (/^\d{1,3}([.,\s]\d{3})+([.,]\d+)?$/.test(clean)) return true;
  if (/^\d+([.,]\d+)?$/.test(clean)) return true;

  const digitCount = (clean.match(/\d/g) || []).length;
  if (/^[\d.,\s+-]+$/.test(clean) && digitCount >= 3) return true;
  return false;
}

export function detectColumnKind(header: string): SemanticColKind {
  let h = (header || '').toLowerCase().trim();
  h = h.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/^\(\d+\)\s*/, '');
  if (h.length > 60) return 'text_main';

  if (/^(stt|tt|no\.?|số tt)$/.test(h)) return 'index';
  if (/^(đơn vị tính|đvt|đơn vị)$/.test(h)) return 'unit';
  if (/^(số lượng|sl|khối lượng)$/.test(h)) return 'quantity';
  if (/(?<![\p{L}\p{N}])(đơn giá)(?![\p{L}\p{N}])/u.test(h)) return 'unit_price';
  if (/(?<![\p{L}\p{N}])(thành tiền|tổng tiền)(?![\p{L}\p{N}])/u.test(h) || /^giá trị\s*(\(|$)/u.test(h)) return 'total_price';
  if (/(?<![\p{L}\p{N}])(thuế|thuế,\s*phí|thuế\s*suất|vat)(?![\p{L}\p{N}])/u.test(h)) return 'tax';
  if (/(thời gian|tiến độ|ngày làm việc|thời hạn|hạn chót)/.test(h)) return 'duration';
  if (/(địa điểm|nơi thực hiện|phương thức)/.test(h)) return 'location';
  if (/(đơn vị thực hiện|nhân sự|người liên hệ|chủ trì|người phụ trách)/.test(h))
    return 'organization';
  if (/(bảo hành|thời hạn bảo hành)/.test(h)) return 'warranty';
  if (h.length <= 15 && /\b(ip|url|địa chỉ ip|domain)\b/.test(h)) return 'ip_url';
  if (/(nhóm hệ thống|hệ thống)/.test(h)) return 'system_group';
  if (/(xuất xứ|nơi sản xuất|hãng sản xuất|hãng\s*\/\s*os|version)/.test(h)) return 'origin';
  if (/^(hạng mục|phân loại|loại)$/.test(h)) return 'category';
  if (
    /(chỉ tiêu kỹ thuật|yêu cầu kỹ thuật|tiêu chuẩn kỹ thuật|thông số kỹ thuật|nội dung kiểm tra|tiêu chí đánh giá|tiêu chí|sản phẩm đầu ra)/.test(
      h
    )
  ) {
    return 'technical_spec';
  }
  return 'text_main';
}

export function calculateOptimalColumnWidthsDxa(params: {
  headers: string[];
  totalCols: number;
  isCol0Index: boolean;
  totalWidthDxa: number;
  isLandscape: boolean;
  rowsMatrix?: string[][];
}): { widths: number[]; kinds: SemanticColKind[] } {
  const { headers, totalCols, isCol0Index, totalWidthDxa, isLandscape, rowsMatrix = [] } = params;
  if (totalCols <= 0) return { widths: [], kinds: [] };

  const kinds: SemanticColKind[] = [];
  for (let i = 0; i < totalCols; i++) {
    kinds.push(detectColumnKind(headers[i] || ''));
  }
  if (isCol0Index && kinds.length > 0) {
    kinds[0] = 'index';
  }

  // Trường hợp 1: Bảng 2 cột (Chữ ký, Bên A/B, hoặc Bảng Điều khoản E-ĐKC)
  if (totalCols === 2) {
    let c0Total = 0;
    let c1Total = 0;
    let c0Max = headers[0]?.length || 0;
    let c1Max = headers[1]?.length || 0;
    let count2 = 0;

    rowsMatrix.forEach((r) => {
      if (r.length >= 2) {
        const l0 = (r[0] || '').length;
        const l1 = (r[1] || '').length;
        c0Total += l0;
        c1Total += l1;
        if (l0 > c0Max) c0Max = l0;
        if (l1 > c1Max) c1Max = l1;
        count2++;
      }
    });

    const c0Avg = count2 > 0 ? c0Total / count2 : c0Max;
    const c1Avg = count2 > 0 ? c1Total / count2 : c1Max;
    const sample = headers.join(' ').toLowerCase();

    if (
      rowsMatrix.length <= 4 &&
      /(đại diện|giám đốc|chủ tịch|trưởng phòng|thư ký)/.test(sample)
    ) {
      const half = Math.floor(totalWidthDxa / 2);
      return { widths: [half, totalWidthDxa - half], kinds };
    }

    if (
      rowsMatrix.length <= 8 &&
      /(địa chỉ|mã số thuế|tài khoản|điện thoại)/.test(sample)
    ) {
      const w1 = isLandscape ? cmToDxa(4.5) : cmToDxa(3.6);
      return { widths: [w1, totalWidthDxa - w1], kinds };
    }

    const isClauseTable = headers.some((h) =>
      /^(điều\s+\d+|\d+\.|\d+\.\d+|e-đkc|mục\s+\d+|chương\s+\d+)/i.test((h || '').trim())
    );
    if (isClauseTable || c1Avg > c0Avg * 1.5 || c1Max > 100) {
      const w0 = c0Max <= 15 ? (isLandscape ? cmToDxa(4.0) : cmToDxa(3.3)) : isLandscape ? cmToDxa(5.2) : cmToDxa(4.0);
      return { widths: [w0, totalWidthDxa - w0], kinds };
    }

    const half = Math.floor(totalWidthDxa / 2);
    return { widths: [half, totalWidthDxa - half], kinds };
  }

  // Trường hợp 2: Bảng 3 cột đặc thù (STT | Tiêu chí / Hạng mục | Mô tả chi tiết)
  if (
    totalCols === 3 &&
    isCol0Index &&
    (kinds[1] === 'technical_spec' || kinds[1] === 'category' || kinds[1] === 'text_main')
  ) {
    const w0 = isLandscape ? cmToDxa(1.2) : cmToDxa(1.0);
    const w1 = isLandscape ? cmToDxa(7.0) : cmToDxa(4.5);
    return { widths: [w0, w1, totalWidthDxa - w0 - w1], kinds };
  }

  // Trường hợp 3: Bảng N cột tổng quát — Dynamic Semantic Content-Aware Sizing
  const widths = new Array<number>(totalCols).fill(0);
  let allocatedDxa = 0;
  const flexibleIndices: number[] = [];

  for (let i = 0; i < totalCols; i++) {
    switch (kinds[i]) {
      case 'index':
        widths[i] = isLandscape ? cmToDxa(1.2) : totalCols >= 7 ? cmToDxa(0.9) : cmToDxa(1.0);
        allocatedDxa += widths[i];
        break;
      case 'unit':
        widths[i] = isLandscape ? cmToDxa(1.4) : totalCols >= 8 ? cmToDxa(1.1) : cmToDxa(1.3);
        allocatedDxa += widths[i];
        break;
      case 'quantity':
        widths[i] = isLandscape ? cmToDxa(1.3) : totalCols >= 8 ? cmToDxa(1.0) : cmToDxa(1.2);
        allocatedDxa += widths[i];
        break;
      case 'tax':
        widths[i] = isLandscape ? cmToDxa(2.0) : totalCols >= 8 ? cmToDxa(1.5) : cmToDxa(1.8);
        allocatedDxa += widths[i];
        break;
      case 'unit_price':
        widths[i] = isLandscape ? cmToDxa(2.8) : totalCols >= 8 ? cmToDxa(2.15) : cmToDxa(2.3);
        allocatedDxa += widths[i];
        break;
      case 'total_price':
        widths[i] = isLandscape ? cmToDxa(3.2) : totalCols >= 8 ? cmToDxa(2.45) : cmToDxa(2.6);
        allocatedDxa += widths[i];
        break;
      case 'duration':
      case 'organization':
        widths[i] = isLandscape ? cmToDxa(2.8) : totalCols >= 5 ? cmToDxa(2.1) : cmToDxa(2.5);
        allocatedDxa += widths[i];
        break;
      case 'location':
      case 'ip_url':
        widths[i] = isLandscape ? cmToDxa(3.0) : totalCols >= 5 ? cmToDxa(2.2) : cmToDxa(2.5);
        allocatedDxa += widths[i];
        break;
      case 'warranty':
        widths[i] = isLandscape ? cmToDxa(2.4) : cmToDxa(2.0);
        allocatedDxa += widths[i];
        break;
      case 'origin':
        widths[i] = isLandscape ? cmToDxa(2.5) : cmToDxa(1.8);
        allocatedDxa += widths[i];
        break;
      case 'category':
      case 'system_group':
        widths[i] = isLandscape ? cmToDxa(2.8) : cmToDxa(2.2);
        allocatedDxa += widths[i];
        break;
      default:
        flexibleIndices.push(i);
        break;
    }
  }

  if (flexibleIndices.length === 0 && totalCols > 0) {
    const lastIdx = totalCols - 1;
    allocatedDxa -= widths[lastIdx];
    widths[lastIdx] = 0;
    flexibleIndices.push(lastIdx);
  }

  // Nếu tổng các cột cố định vượt quá 78% chiều rộng trang, co nhẹ tỷ lệ để chừa chỗ cho cột nội dung
  const maxFixedBudget = Math.floor(totalWidthDxa * 0.78);
  if (allocatedDxa > maxFixedBudget && allocatedDxa > 0) {
    const ratio = maxFixedBudget / allocatedDxa;
    allocatedDxa = 0;
    for (let i = 0; i < totalCols; i++) {
      if (widths[i] > 0) {
        widths[i] = Math.max(cmToDxa(0.85), Math.round(widths[i] * ratio));
        allocatedDxa += widths[i];
      }
    }
  }

  const remainingDxa = Math.max(cmToDxa(2.0), totalWidthDxa - allocatedDxa);

  if (flexibleIndices.length === 1) {
    widths[flexibleIndices[0]] = remainingDxa;
  } else {
    const maxLens = flexibleIndices.map((colIdx) => {
      let mLen = Math.max(10, (headers[colIdx] || '').length);
      rowsMatrix.forEach((r) => {
        if (colIdx < r.length) {
          mLen = Math.max(mLen, Math.min(180, (r[colIdx] || '').length));
        }
      });
      return mLen;
    });

    const totalLen = maxLens.reduce((a, b) => a + b, 0) || 1;
    let flexAllocated = 0;
    flexibleIndices.forEach((colIdx, fi) => {
      const minW = isLandscape ? cmToDxa(2.4) : cmToDxa(1.7);
      const w = Math.max(minW, Math.round((remainingDxa * maxLens[fi]) / totalLen));
      widths[colIdx] = w;
      flexAllocated += w;
    });
    widths[flexibleIndices[flexibleIndices.length - 1]] += remainingDxa - flexAllocated;
  }

  const finalSum = widths.reduce((a, b) => a + b, 0);
  const diff = totalWidthDxa - finalSum;
  if (diff !== 0) {
    const targetIdx =
      flexibleIndices.length > 0 ? flexibleIndices[flexibleIndices.length - 1] : totalCols - 1;
    widths[targetIdx] = Math.max(cmToDxa(0.9), widths[targetIdx] + diff);
  }

  return { widths, kinds };
}

// ============================================================================
// OPENXML DOM HELPERS (Browser-Native DOMParser Manipulation for Uploaded .docx)
// ============================================================================

export function wChildren(parent: Element, localName: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      const el = node as Element;
      if (el.localName === localName) out.push(el);
    }
  }
  return out;
}

export function wFirst(parent: Element, localName: string): Element | null {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1 && (node as Element).localName === localName) {
      return node as Element;
    }
  }
  return null;
}

export function wDescendants(parent: Element, localName: string): Element[] {
  const list = parent.getElementsByTagNameNS(W_NS, localName);
  if (list.length > 0) return Array.from(list);
  return Array.from(parent.getElementsByTagName(`w:${localName}`));
}

export function createW(doc: XMLDocument, localName: string): Element {
  return doc.createElementNS(W_NS, `w:${localName}`);
}

export function setWAttr(el: Element, localName: string, value: string): void {
  el.setAttributeNS(W_NS, `w:${localName}`, value);
}

export function getWAttr(el: Element | null, localName: string): string | null {
  if (!el) return null;
  return (
    el.getAttributeNS(W_NS, localName) ??
    el.getAttribute(`w:${localName}`) ??
    el.getAttribute(localName)
  );
}

export function getElementText(el: Element): string {
  return wDescendants(el, 't')
    .map((t) => t.textContent || '')
    .join('');
}

function getGridSpan(tc: Element): number {
  const gs = wFirst(wFirst(tc, 'tcPr') || tc, 'gridSpan');
  const val = parseInt(getWAttr(gs, 'val') || '1', 10);
  return Number.isNaN(val) || val < 1 ? 1 : val;
}

export function extractOpenXmlTableMeta(tbl: Element): {
  headers: string[];
  totalCols: number;
  isCol0Index: boolean;
  headerRowCount: number;
  rowsMatrix: string[][];
} {
  const rows = wChildren(tbl, 'tr');
  if (rows.length === 0) {
    return { headers: [], totalCols: 0, isCol0Index: false, headerRowCount: 0, rowsMatrix: [] };
  }

  let totalCols = 0;
  rows.forEach((r) => {
    const sumSpan = wChildren(r, 'tc').reduce((acc, tc) => acc + getGridSpan(tc), 0);
    if (sumSpan > totalCols) totalCols = sumSpan;
  });

  const colHeaders = new Array<string>(totalCols).fill('');
  const r0Cells = wChildren(rows[0], 'tc');
  const r0HasSubSpans = r0Cells.some((tc) => {
    const sp = getGridSpan(tc);
    return sp > 1 && sp < totalCols;
  });

  let headerRowCount = 1;
  if (rows.length > 1) {
    const r1Cells = wChildren(rows[1], 'tc');
    const r1C0Txt = r1Cells.length > 0 ? getElementText(r1Cells[0]).trim() : '';
    const isColRefRow =
      r1Cells.length >= 3 &&
      r1Cells.filter((c) => /^\(\d+\)/.test(getElementText(c).trim())).length >=
        Math.max(2, Math.floor(r1Cells.length / 2));
    const isR1Data = /^\d+$/.test(r1C0Txt);
    if ((r0HasSubSpans && !isR1Data) || isColRefRow) {
      headerRowCount = 2;
    }
  }

  for (let rIdx = 0; rIdx < Math.min(headerRowCount, rows.length); rIdx++) {
    const cells = wChildren(rows[rIdx], 'tc');
    if (cells.length === 1 && getGridSpan(cells[0]) >= totalCols) continue;

    const rowTxt = getElementText(rows[rIdx]).trim();
    if (/^[IVX]+\s*[-–]/.test(rowTxt) || /^\(?bằng chữ/i.test(rowTxt) || /^\(\d+\)/.test(rowTxt)) {
      continue;
    }

    let cursor = 0;
    cells.forEach((tc) => {
      const span = getGridSpan(tc);
      const txt = getElementText(tc).trim();
      if (txt) {
        for (let k = 0; k < span && cursor + k < totalCols; k++) {
          if (!colHeaders[cursor + k] || (span === 1 && colHeaders[cursor + k] !== txt)) {
            colHeaders[cursor + k] = txt;
          }
        }
      }
      cursor += span;
    });
  }

  let col0NumericCount = 0;
  const rowsMatrix: string[][] = [];

  rows.forEach((r, idx) => {
    const cells = wChildren(r, 'tc');
    const rowArr: string[] = [];
    cells.forEach((tc) => {
      const span = getGridSpan(tc);
      const txt = getElementText(tc).trim();
      rowArr.push(txt);
      for (let s = 1; s < span; s++) rowArr.push('');
    });
    rowsMatrix.push(rowArr);

    if (idx >= headerRowCount && cells.length > 0) {
      const t0 = getElementText(cells[0])
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
      if (/^\d{1,3}(\.\d{1,2})?\.?$/.test(t0) || /^[a-z]\.?$/i.test(t0)) {
        col0NumericCount++;
      }
    }
  });

  const isCol0Index =
    col0NumericCount >= 2 ||
    (colHeaders.length > 0 && /^(stt|tt|no\.?)$/i.test(colHeaders[0].trim()));

  return { headers: colHeaders, totalCols, isCol0Index, headerRowCount, rowsMatrix };
}

function isPartyInfoTableXml(tableFullText: string, rows: Element[]): boolean {
  const hasPartyMarkers =
    /\b(bên a|bên b|chủ đầu tư|nhà thầu|bên giao|bên nhận|bên mua|bên bán|chúng tôi gồm)\b/i.test(
      tableFullText
    );
  const hasPartyFields =
    /(mã số thuế|số tài khoản|tài khoản|địa chỉ|điện thoại|đại diện|chức vụ|ủy quyền)/i.test(
      tableFullText
    );
  const isPricingOrSpec =
    /\b(đơn giá|thành tiền|tiêu chuẩn kỹ thuật|chỉ tiêu kỹ thuật|bảo hành)\b/i.test(tableFullText);
  if (isPricingOrSpec) return false;

  let labelCount = 0;
  rows.forEach((r) => {
    const rowTxt = getElementText(r).trim().toLowerCase();
    if (
      /^(địa chỉ|điện thoại|mã số thuế|tài khoản|số tài khoản|tại|mở tại|đại diện|chức vụ|fax|email|văn phòng|trụ sở)\b/i.test(
        rowTxt
      )
    ) {
      labelCount++;
    }
  });

  return (hasPartyMarkers && hasPartyFields) || labelCount >= 2;
}

function isAdminHeaderOrSignatureLayoutTableXml(tbl: Element, rows: Element[]): boolean {
  if (rows.length > 4) return false;
  const full = getElementText(tbl);
  if (/CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i.test(full)) return true;
  if (/Nơi nhận:/i.test(full) && /(CHỦ TỊCH|GIÁM ĐỐC|TRƯỞNG|THƯ KÝ|CHỦ TỌA)/i.test(full)) {
    return true;
  }
  return false;
}

function cleanCellDuplicateContentXml(tc: Element, isBorderLess: boolean): void {
  if (!isBorderLess) {
    const allParas = wChildren(tc, 'p');
    if (allParas.length > 1) {
      const nonEmpty = allParas.filter((p) => getElementText(p).trim().length > 0);
      if (nonEmpty.length > 0) {
        allParas.forEach((p) => {
          if (!nonEmpty.includes(p)) tc.removeChild(p);
        });
      }
    }
  }

  const pList = wChildren(tc, 'p');
  for (let i = pList.length - 1; i > 0; i--) {
    const t1 = getElementText(pList[i - 1]).trim();
    const t2 = getElementText(pList[i]).trim();
    if (t1 && t1 === t2) {
      tc.removeChild(pList[i]);
    }
  }

  wChildren(tc, 'p').forEach((p) => {
    const runs = wChildren(p, 'r');
    if (runs.length >= 2) {
      const runTexts = runs.map((r) => getElementText(r).trim());
      if (runTexts[0] && runTexts.every((t) => t === runTexts[0])) {
        for (let rIdx = 1; rIdx < runs.length; rIdx++) {
          p.removeChild(runs[rIdx]);
        }
      }
    }

    wDescendants(p, 't').forEach((t) => {
      const val = (t.textContent || '').trim();
      if (val.length >= 4 && val.length % 2 === 0) {
        const half = val.length / 2;
        if (val.slice(0, half) === val.slice(half)) {
          t.textContent = val.slice(0, half);
        }
      }
    });
  });
}

function setCellMarginXml(doc: XMLDocument, tblCellMar: Element, side: string, dxa: number): void {
  let el = wFirst(tblCellMar, side);
  if (!el) {
    el = createW(doc, side);
    tblCellMar.appendChild(el);
  }
  setWAttr(el, 'w', String(dxa));
  setWAttr(el, 'type', 'dxa');
}

/**
 * Chuẩn hóa động 1 bảng OpenXML (<w:tbl>) theo đúng thuật toán dự án FormatBang
 */
export function formatOpenXmlTableDynamic(
  doc: XMLDocument,
  tbl: Element,
  isLandscape: boolean
): { formatted: boolean; cols: number; rows: number } {
  const rows = wChildren(tbl, 'tr');
  if (rows.length === 0) return { formatted: false, cols: 0, rows: 0 };

  // Bỏ qua bảng Quốc hiệu / Nơi nhận & Chữ ký hành chính để bảo toàn bố cục thể thức
  if (isAdminHeaderOrSignatureLayoutTableXml(tbl, rows)) {
    return { formatted: false, cols: 2, rows: rows.length };
  }

  const tableFullText = getElementText(tbl).toLowerCase();
  if (isPartyInfoTableXml(tableFullText, rows)) {
    // Bảng thông tin Bên A / Bên B luôn ẩn viền, không lặp tblHeader
    const tblPr = wFirst(tbl, 'tblPr') || tbl.insertBefore(createW(doc, 'tblPr'), tbl.firstChild);
    let tblBorders = wFirst(tblPr, 'tblBorders');
    if (!tblBorders) {
      tblBorders = createW(doc, 'tblBorders');
      tblPr.appendChild(tblBorders);
    }
    tblBorders.textContent = '';
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach((bName) => {
      const b = createW(doc, bName);
      setWAttr(b, 'val', 'none');
      tblBorders!.appendChild(b);
    });
    rows.forEach((tr) => {
      const trPr = wFirst(tr, 'trPr');
      const th = trPr ? wFirst(trPr, 'tblHeader') : null;
      if (th && trPr) trPr.removeChild(th);
    });
    return { formatted: false, cols: 2, rows: rows.length };
  }

  const totalWidthDxa = isLandscape ? LANDSCAPE_CONTENT_DXA : PORTRAIT_CONTENT_DXA;
  const { headers, totalCols, isCol0Index, headerRowCount, rowsMatrix } =
    extractOpenXmlTableMeta(tbl);
  if (totalCols === 0) return { formatted: false, cols: 0, rows: rows.length };

  const isSignature =
    totalCols === 2 &&
    rows.length <= 4 &&
    /(đại diện bên|chức vụ|giám đốc|chủ tịch)/i.test(tableFullText);
  const isBorderLess = isSignature;

  let hasHeaderRow = false;
  if (rows.length > 0 && !isBorderLess) {
    const r0Cells = wChildren(rows[0], 'tc');
    if (r0Cells.length > 1) {
      const c0Txt = getElementText(r0Cells[0]).trim();
      const c1Txt = getElementText(r0Cells[1]).trim();
      const isClauseOrData =
        /^(điều\s+\d+|\d+\.|\d+\.\d+|e-đkc|mục\s+\d+|chương\s+\d+)/i.test(c0Txt) ||
        c1Txt.length > 80;
      if (!isClauseOrData) hasHeaderRow = true;
    } else if (r0Cells.length === 1) {
      hasHeaderRow = true;
    }
  }

  wDescendants(tbl, 'tc').forEach((tc) => cleanCellDuplicateContentXml(tc, isBorderLess));
  wDescendants(tbl, 'pageBreakBefore').forEach((el) => el.parentNode?.removeChild(el));
  wDescendants(tbl, 'br').forEach((br) => {
    if (getWAttr(br, 'type') === 'page') br.parentNode?.removeChild(br);
  });

  const { widths: colWidthsDxa, kinds } = calculateOptimalColumnWidthsDxa({
    headers,
    totalCols,
    isCol0Index,
    totalWidthDxa,
    isLandscape,
    rowsMatrix,
  });

  // Xây dựng tblPr chuẩn thứ tự XSD CT_TblPr
  let tblPr = wFirst(tbl, 'tblPr');
  if (!tblPr) {
    tblPr = createW(doc, 'tblPr');
    tbl.insertBefore(tblPr, tbl.firstChild);
  }

  const tblStyle = wFirst(tblPr, 'tblStyle');
  const tblLook = wFirst(tblPr, 'tblLook');

  const tblW = createW(doc, 'tblW');
  setWAttr(tblW, 'w', String(totalWidthDxa));
  setWAttr(tblW, 'type', 'dxa');

  const jc = createW(doc, 'jc');
  setWAttr(jc, 'val', 'left');

  const tblBorders = createW(doc, 'tblBorders');
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach((bName) => {
    const b = createW(doc, bName);
    if (isBorderLess) {
      setWAttr(b, 'val', 'none');
    } else {
      setWAttr(b, 'val', 'single');
      setWAttr(b, 'sz', '4'); // 0.5pt sắc nét chuẩn in ấn
      setWAttr(b, 'space', '0');
      setWAttr(b, 'color', 'auto');
    }
    tblBorders.appendChild(b);
  });

  const tblLayout = createW(doc, 'tblLayout');
  setWAttr(tblLayout, 'type', 'fixed');

  const isDenseTable = rows.length >= 7 || totalCols >= 5;
  const tblCellMar = createW(doc, 'tblCellMar');
  const padV = isDenseTable ? 35 : 55;
  const padH = isLandscape ? 55 : totalCols >= 8 ? 35 : 55;
  setCellMarginXml(doc, tblCellMar, 'top', padV);
  setCellMarginXml(doc, tblCellMar, 'bottom', padV);
  setCellMarginXml(doc, tblCellMar, 'left', padH);
  setCellMarginXml(doc, tblCellMar, 'right', padH);

  tblPr.textContent = '';
  if (tblStyle) tblPr.appendChild(tblStyle);
  tblPr.appendChild(tblW);
  tblPr.appendChild(jc);
  tblPr.appendChild(tblBorders);
  tblPr.appendChild(tblLayout);
  tblPr.appendChild(tblCellMar);
  if (tblLook) tblPr.appendChild(tblLook);

  // Cập nhật tblGrid
  let tblGrid = wFirst(tbl, 'tblGrid');
  if (!tblGrid) {
    tblGrid = createW(doc, 'tblGrid');
    tbl.insertBefore(tblGrid, tblPr.nextSibling);
  }
  tblGrid.textContent = '';
  colWidthsDxa.forEach((cw) => {
    const gc = createW(doc, 'gridCol');
    setWAttr(gc, 'w', String(cw));
    tblGrid!.appendChild(gc);
  });

  // Cỡ chữ bảng thích ứng theo Nghị định 30 (10.5pt – 12pt cho bảng biểu)
  const fontSizeHalfPt = isBorderLess
    ? '26'
    : isLandscape
    ? kinds.length >= 9
      ? '21'
      : '22'
    : kinds.length >= 7 || isDenseTable
    ? '22'
    : kinds.length >= 5
    ? '23'
    : '24';

  rows.forEach((tr, rIdx) => {
    let trPr = wFirst(tr, 'trPr');
    if (!trPr) {
      trPr = createW(doc, 'trPr');
      tr.insertBefore(trPr, tr.firstChild);
    }

    const cells = wChildren(tr, 'tc');
    const cellTexts = cells.map((c) => getElementText(c).trim());
    const rowJoined = cellTexts.join(' ').trim().toLowerCase();

    const isTitleRow = cells.length === 1 || /^[ivx]+\s*[-–]/.test(rowJoined);
    const isBangChuRow = /^\(?bằng chữ/i.test(rowJoined);
    const isSummaryRow =
      !isBangChuRow &&
      (/\b(tổng cộng|tổng số|tổng giá trị|tổng chi phí|tổng thanh toán|cộng tiền hàng|cộng tiền|thuế vat|thuế gtgt|tiền thuế|tiền vat)\b/i.test(
        rowJoined
      ) ||
        (cellTexts.length > 0 && /^(tổng|cộng|thuế|vat|thanh toán)\b/i.test(cellTexts[0])));

    const isColRefRow =
      cells.length >= 3 &&
      cells.filter((c) => /^\(\d+\)/.test(getElementText(c).trim())).length >=
        Math.max(2, Math.floor(cells.length / 2));

    let isCategoryRow = false;
    if (cells.length > 1 && !isColRefRow && !isSummaryRow) {
      const c0 = cellTexts[0].replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
      const c1 = cellTexts[1];
      const isRomanOrLetter = /^([IVX]+|[A-Z])[./\-–]?\s*$/i.test(c0);
      const trailingEmpty = cellTexts.slice(2).every((t) => !t);
      if (isRomanOrLetter && c1 && trailingEmpty) isCategoryRow = true;
    }

    // Lặp tiêu đề bảng qua trang (tblHeader)
    const oldTh = wFirst(trPr, 'tblHeader');
    if ((rIdx < headerRowCount || isColRefRow) && !isBorderLess && hasHeaderRow) {
      if (!oldTh) trPr.appendChild(createW(doc, 'tblHeader'));
    } else if (oldTh) {
      trPr.removeChild(oldTh);
    }

    // Chống gãy đôi hàng (cantSplit)
    const oldCs = wFirst(trPr, 'cantSplit');
    if (hasHeaderRow || totalCols > 2 || rowJoined.length < 300) {
      if (!oldCs) trPr.appendChild(createW(doc, 'cantSplit'));
    } else if (oldCs) {
      trPr.removeChild(oldCs);
    }

    const styleSingleCell = (
      tc: Element,
      cIdx: number,
      widthDxa: number,
      spanCount: number,
      flags: { bangChu?: boolean; category?: boolean }
    ) => {
      let tcPr = wFirst(tc, 'tcPr');
      if (!tcPr) {
        tcPr = createW(doc, 'tcPr');
        tc.insertBefore(tcPr, tc.firstChild);
      }
      if (spanCount > 1) {
        let gs = wFirst(tcPr, 'gridSpan');
        if (!gs) {
          gs = createW(doc, 'gridSpan');
          tcPr.appendChild(gs);
        }
        setWAttr(gs, 'val', String(spanCount));
      }

      let tcW = wFirst(tcPr, 'tcW');
      if (!tcW) {
        tcW = createW(doc, 'tcW');
        tcPr.appendChild(tcW);
      }
      setWAttr(tcW, 'w', String(widthDxa));
      setWAttr(tcW, 'type', 'dxa');

      let vAlign = wFirst(tcPr, 'vAlign');
      if (!vAlign) {
        vAlign = createW(doc, 'vAlign');
        tcPr.appendChild(vAlign);
      }
      const cText = getElementText(tc).trim();
      const useTopAlign =
        wFirst(tcPr, 'vMerge') !== null ||
        isSignature ||
        (!hasHeaderRow && totalCols === 2) ||
        (rIdx >= headerRowCount && (wChildren(tc, 'p').length > 2 || cText.length > 100));
      setWAttr(vAlign, 'val', useTopAlign ? 'top' : 'center');

      wChildren(tc, 'p').forEach((p) => {
        let pPr = wFirst(p, 'pPr');
        if (!pPr) {
          pPr = createW(doc, 'pPr');
          p.insertBefore(pPr, p.firstChild);
        }

        // Xóa thụt đầu dòng trong ô bảng để bảng cân đối sạch sẽ
        const ind = wFirst(pPr, 'ind');
        if (ind) pPr.removeChild(ind);

        let sp = wFirst(pPr, 'spacing');
        if (!sp) {
          sp = createW(doc, 'spacing');
          pPr.appendChild(sp);
        }
        setWAttr(sp, 'before', isDenseTable || isColRefRow ? '20' : '40');
        setWAttr(sp, 'after', isDenseTable || isColRefRow ? '20' : '40');
        setWAttr(sp, 'line', isDenseTable || isColRefRow ? '240' : '268');
        setWAttr(sp, 'lineRule', 'auto');

        let pJc = wFirst(pPr, 'jc');
        if (!pJc) {
          pJc = createW(doc, 'jc');
          pPr.appendChild(pJc);
        }

        let bold = false;
        let italic = false;
        let align = 'left';

        if (flags.bangChu) {
          align = 'left';
          italic = true;
        } else if (isColRefRow) {
          align = 'center';
          italic = true;
        } else if ((rIdx < headerRowCount && hasHeaderRow) || isTitleRow) {
          align = 'center';
          bold = true;
        } else if (flags.category) {
          align = cIdx === 0 ? 'center' : 'left';
          bold = true;
        } else if (isSummaryRow) {
          bold = true;
          align = isNumericOrCurrencyText(cText) ? 'right' : 'left';
        } else if (isBorderLess) {
          align = isSignature ? 'center' : 'left';
        } else if (kinds.length === 2 && !hasHeaderRow) {
          if (cIdx === 0) {
            bold = true;
            align =
              cText.length <= 15 && (/^e-đkc\b/i.test(cText) || /^\d+(\.\d+)*\.?$/.test(cText))
                ? 'center'
                : 'left';
          }
        } else {
          const kind = kinds[cIdx] || 'text_main';
          if (
            kind === 'index' ||
            kind === 'unit' ||
            kind === 'quantity' ||
            kind === 'warranty'
          ) {
            align = 'center';
          } else if (kind === 'unit_price' || kind === 'total_price') {
            align = 'right';
          } else if (kind === 'tax') {
            align = /^(kct|không chịu thuế|\d+%)$/i.test(cText)
              ? 'center'
              : isNumericOrCurrencyText(cText)
              ? 'right'
              : 'center';
          } else if (
            (kind === 'duration' || kind === 'location' || kind === 'organization') &&
            cText.length <= 15
          ) {
            align = 'center';
          } else if (isNumericOrCurrencyText(cText) && (cText.match(/\d/g) || []).length >= 3) {
            align = 'right';
          }
        }

        setWAttr(pJc, 'val', align);

        wChildren(p, 'r').forEach((r) => {
          let rPr = wFirst(r, 'rPr');
          if (!rPr) {
            rPr = createW(doc, 'rPr');
            r.insertBefore(rPr, r.firstChild);
          }

          let rFonts = wFirst(rPr, 'rFonts');
          if (!rFonts) {
            rFonts = createW(doc, 'rFonts');
            rPr.appendChild(rFonts);
          }
          setWAttr(rFonts, 'ascii', 'Times New Roman');
          setWAttr(rFonts, 'hAnsi', 'Times New Roman');
          setWAttr(rFonts, 'cs', 'Times New Roman');

          let sz = wFirst(rPr, 'sz');
          if (!sz) {
            sz = createW(doc, 'sz');
            rPr.appendChild(sz);
          }
          setWAttr(sz, 'val', fontSizeHalfPt);

          let szCs = wFirst(rPr, 'szCs');
          if (!szCs) {
            szCs = createW(doc, 'szCs');
            rPr.appendChild(szCs);
          }
          setWAttr(szCs, 'val', fontSizeHalfPt);

          if (bold && !wFirst(rPr, 'b')) rPr.appendChild(createW(doc, 'b'));
          if (italic && !wFirst(rPr, 'i')) rPr.appendChild(createW(doc, 'i'));
        });
      });
    };

    if (isBangChuRow) {
      while (cells.length > 1) {
        const popped = cells.pop()!;
        tr.removeChild(popped);
      }
      styleSingleCell(cells[0], 0, totalWidthDxa, colWidthsDxa.length, { bangChu: true });
      return;
    }

    if (isCategoryRow && cells.length >= 2) {
      while (cells.length > 2) {
        const popped = cells.pop()!;
        tr.removeChild(popped);
      }
      styleSingleCell(cells[0], 0, colWidthsDxa[0], 1, { category: true });
      styleSingleCell(
        cells[1],
        1,
        totalWidthDxa - colWidthsDxa[0],
        colWidthsDxa.length - 1,
        { category: true }
      );
      return;
    }

    let colCursor = 0;
    cells.forEach((tc) => {
      if (isTitleRow) {
        styleSingleCell(tc, 0, totalWidthDxa, colWidthsDxa.length, {});
      } else {
        const span = getGridSpan(tc);
        let cellW = 0;
        for (let k = 0; k < span && colCursor + k < colWidthsDxa.length; k++) {
          cellW += colWidthsDxa[colCursor + k];
        }
        styleSingleCell(tc, colCursor, cellW || colWidthsDxa[0] || 1200, span, {});
        colCursor += span;
      }
    });
  });

  return { formatted: true, cols: totalCols, rows: rows.length };
}

/**
 * Parse dữ liệu bảng dán từ Excel / Google Sheets (TSV hoặc CSV) thành ma trận 2 chiều
 */
export function parseSpreadsheetPasteToMatrix(rawText: string): string[][] {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const hasTabs = lines.some((l) => l.includes('\t'));
  const delimiter = hasTabs ? '\t' : lines[0].includes('|') ? '|' : ',';

  const matrix = lines.map((line) => {
    if (delimiter === '|') {
      const trimmed = line.replace(/^\||\|$/g, '');
      return trimmed.split('|').map((c) => c.trim());
    }
    return line.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());
  });

  // Lọc bỏ dòng phân cách markdown kiểu |---|---|
  const filtered = matrix.filter((row) => !row.every((c) => /^[-:\s]*$/.test(c)));
  const maxCols = filtered.reduce((m, r) => Math.max(m, r.length), 0);
  return filtered.map((r) => {
    const padded = [...r];
    while (padded.length < maxCols) padded.push('');
    return padded;
  });
}

/**
 * Sinh file Word (.docx) hoàn chỉnh từ ma trận bảng Excel/TSV theo chuẩn FormatBang & Nghị định 30
 */
export async function exportSmartTableMatrixToDocx(params: {
  title: string;
  subtitle?: string;
  matrix: string[][];
  forceOrientation?: 'auto' | 'portrait' | 'landscape';
}): Promise<{
  blob: Blob;
  isLandscape: boolean;
  widthsDxa: number[];
  kinds: SemanticColKind[];
}> {
  const { title, subtitle, matrix, forceOrientation = 'auto' } = params;
  const totalCols = matrix[0]?.length || 1;
  const headers = matrix[0] || [];
  const dataRows = matrix.slice(1);

  const isCol0Index =
    /^(stt|tt|no\.?)$/i.test((headers[0] || '').trim()) ||
    dataRows.filter((r) => /^\d+$/.test((r[0] || '').trim())).length >= 2;

  const isLandscape =
    forceOrientation === 'landscape' || (forceOrientation === 'auto' && totalCols >= 8);
  const contentWidthDxa = isLandscape ? LANDSCAPE_CONTENT_DXA : PORTRAIT_CONTENT_DXA;

  const { widths, kinds } = calculateOptimalColumnWidthsDxa({
    headers,
    totalCols,
    isCol0Index,
    totalWidthDxa: contentWidthDxa,
    isLandscape,
    rowsMatrix: dataRows,
  });

  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const borders = {
    top: cellBorder,
    bottom: cellBorder,
    left: cellBorder,
    right: cellBorder,
  };

  const fontSize = isLandscape ? (totalCols >= 9 ? 21 : 22) : totalCols >= 6 ? 22 : 24;

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => {
      return new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        borders,
        shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 70, bottom: 70, left: 65, right: 65 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: h || `Cột ${i + 1}`,
                font: 'Times New Roman',
                size: fontSize,
                bold: true,
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = dataRows.map((row) => {
    const rowJoined = row.join(' ').trim().toLowerCase();
    const isBangChu = /^\(?bằng chữ/i.test(rowJoined);
    const isSummary =
      !isBangChu &&
      (/\b(tổng cộng|tổng số|cộng tiền|thuế vat|thuế gtgt|thành tiền)\b/i.test(rowJoined) ||
        /^(tổng|cộng|thuế|vat)\b/i.test((row[0] || '').trim()));

    if (isBangChu) {
      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: totalCols,
            width: { size: contentWidthDxa, type: WidthType.DXA },
            borders,
            margins: { top: 65, bottom: 65, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: row.filter(Boolean).join(' '),
                    font: 'Times New Roman',
                    size: fontSize,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

    return new TableRow({
      cantSplit: true,
      children: row.map((cellVal, cIdx) => {
        const kind = kinds[cIdx] || 'text_main';
        let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;

        if (isSummary) {
          alignment = isNumericOrCurrencyText(cellVal)
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT;
        } else if (
          kind === 'index' ||
          kind === 'unit' ||
          kind === 'quantity' ||
          kind === 'warranty'
        ) {
          alignment = AlignmentType.CENTER;
        } else if (kind === 'unit_price' || kind === 'total_price') {
          alignment = AlignmentType.RIGHT;
        } else if (isNumericOrCurrencyText(cellVal) && (cellVal.match(/\d/g) || []).length >= 3) {
          alignment = AlignmentType.RIGHT;
        }

        return new TableCell({
          width: { size: widths[cIdx], type: WidthType.DXA },
          borders,
          verticalAlign: cellVal.length > 95 ? VerticalAlign.TOP : VerticalAlign.CENTER,
          margins: { top: 55, bottom: 55, left: 65, right: 65 },
          children: [
            new Paragraph({
              alignment,
              children: [
                new TextRun({
                  text: cellVal,
                  font: 'Times New Roman',
                  size: fontSize,
                  bold: isSummary,
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  const children: (Paragraph | Table)[] = [];
  if (title.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: subtitle ? 40 : 140 },
        keepNext: true,
        children: [
          new TextRun({
            text: title.trim().toUpperCase(),
            font: 'Times New Roman',
            size: 28,
            bold: true,
          }),
        ],
      })
    );
  }
  if (subtitle?.trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        keepNext: true,
        children: [
          new TextRun({
            text: subtitle.trim(),
            font: 'Times New Roman',
            size: 26,
            italics: true,
          }),
        ],
      })
    );
  }

  children.push(
    new Table({
      width: { size: contentWidthDxa, type: WidthType.DXA },
      columnWidths: widths,
      rows: [headerRow, ...bodyRows],
    })
  );

  // Số trang chuẩn Nghị định 30: Căn giữa lề trên (Header), cỡ 13pt, ẩn ở trang 1 (titlePage: true)
  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: isLandscape
              ? { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE }
              : { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: isLandscape
              ? { top: 1134, bottom: 1134, left: 1418, right: 1134 }
              : { top: 1134, bottom: 1134, left: 1701, right: 850 },
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
                    size: 26,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, isLandscape, widthsDxa: widths, kinds };
}
