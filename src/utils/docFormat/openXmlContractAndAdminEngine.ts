import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  LANDSCAPE_CONTENT_DXA,
  PORTRAIT_CONTENT_DXA,
  W_NS,
  cmToDxa,
  createW,
  extractOpenXmlTableMeta,
  formatOpenXmlTableDynamic,
  getElementText,
  getWAttr,
  setWAttr,
  wChildren,
  wDescendants,
  wFirst,
} from './openXmlTableEngine';
import { FontScalePreset, LinterIssue, autoFixAdministrativeText } from './vtcRegulationRules';

export type FormatWordProfile = 'auto' | 'contract' | 'table_only' | 'admin_vtc';

export interface FormatDocxReport {
  detectedType: 'contract' | 'table_heavy' | 'admin_decision' | 'admin_general';
  detectedLabel: string;
  paragraphsFormatted: number;
  partyBlocksConverted: number;
  tablesFormatted: number;
  landscapeSectionsCount: number;
  textFixesApplied: number;
  headerPaginationApplied: boolean;
  highlights: string[];
  warnings: LinterIssue[];
}

const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const R_ATTR_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';

const BULLET_CHARS = [
  '•',
  '\uF0B7',
  '\u2022',
  '▪',
  '▫',
  '■',
  '□',
  '➢',
  '',
  '\uF0A7',
  '\uF071',
  '\uF06F',
  '\uF0FC',
  '\uF0D8',
  '\uF0A8',
];

const ONG_BA_REGEX =
  /(?<![\p{L}\p{N}])(Ông|Bà)\s+([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+){1,4})/gu;

const TITLE_STOP_PREFIXES = ['Giám ', 'Tổng ', 'Chủ ', 'Phó ', 'Trưởng ', 'Kế '];

function createRunXml(
  doc: XMLDocument,
  text: string,
  fontSizeHalfPt: number,
  bold = false,
  italic = false
): Element {
  const r = createW(doc, 'r');
  const rPr = createW(doc, 'rPr');

  const rFonts = createW(doc, 'rFonts');
  setWAttr(rFonts, 'ascii', 'Times New Roman');
  setWAttr(rFonts, 'hAnsi', 'Times New Roman');
  setWAttr(rFonts, 'cs', 'Times New Roman');
  rPr.appendChild(rFonts);

  const sz = createW(doc, 'sz');
  setWAttr(sz, 'val', String(fontSizeHalfPt));
  rPr.appendChild(sz);

  const szCs = createW(doc, 'szCs');
  setWAttr(szCs, 'val', String(fontSizeHalfPt));
  rPr.appendChild(szCs);

  const color = createW(doc, 'color');
  setWAttr(color, 'val', '000000');
  rPr.appendChild(color);

  if (bold) rPr.appendChild(createW(doc, 'b'));
  if (italic) rPr.appendChild(createW(doc, 'i'));

  r.appendChild(rPr);

  const t = createW(doc, 't');
  t.setAttribute('xml:space', 'preserve');
  t.textContent = text;
  r.appendChild(t);
  return r;
}

function applyParagraphPropsXml(
  doc: XMLDocument,
  p: Element,
  opts: {
    align: 'left' | 'center' | 'right' | 'both';
    firstLineDxa?: number;
    hangingDxa?: number;
    leftDxa?: number;
    rightDxa?: number;
    beforeDxa: number;
    afterDxa: number;
    lineDxa?: number;
    keepNext?: boolean;
    keepLines?: boolean;
    pageBreakBefore?: boolean;
  }
): void {
  let pPr = wFirst(p, 'pPr');
  if (!pPr) {
    pPr = createW(doc, 'pPr');
    p.insertBefore(pPr, p.firstChild);
  }

  const tabs = wFirst(pPr, 'tabs');
  if (tabs) pPr.removeChild(tabs);

  let jc = wFirst(pPr, 'jc');
  if (!jc) {
    jc = createW(doc, 'jc');
    pPr.appendChild(jc);
  }
  setWAttr(jc, 'val', opts.align);

  let ind = wFirst(pPr, 'ind');
  if (!ind) {
    ind = createW(doc, 'ind');
    pPr.appendChild(ind);
  }
  setWAttr(ind, 'left', String(opts.leftDxa ?? 0));
  setWAttr(ind, 'right', String(opts.rightDxa ?? 0));

  if (opts.hangingDxa && opts.hangingDxa > 0) {
    ind.removeAttributeNS(W_NS, 'firstLine');
    ind.removeAttribute('w:firstLine');
    setWAttr(ind, 'hanging', String(opts.hangingDxa));
  } else {
    ind.removeAttributeNS(W_NS, 'hanging');
    ind.removeAttribute('w:hanging');
    setWAttr(ind, 'firstLine', String(opts.firstLineDxa ?? 0));
  }

  let sp = wFirst(pPr, 'spacing');
  if (!sp) {
    sp = createW(doc, 'spacing');
    pPr.appendChild(sp);
  }
  setWAttr(sp, 'before', String(opts.beforeDxa));
  setWAttr(sp, 'after', String(opts.afterDxa));
  setWAttr(sp, 'line', String(opts.lineDxa ?? 276)); // 1.15x
  setWAttr(sp, 'lineRule', 'auto');

  const setFlag = (name: string, active?: boolean) => {
    const existing = wFirst(pPr!, name);
    if (active && !existing) pPr!.appendChild(createW(doc, name));
    if (!active && existing) pPr!.removeChild(existing);
  };

  setFlag('keepNext', opts.keepNext);
  setFlag('keepLines', opts.keepLines);
  setFlag('pageBreakBefore', opts.pageBreakBefore);
  setFlag('widowControl', true);
}

function setParagraphRunsStyleXml(
  doc: XMLDocument,
  p: Element,
  fontSizeHalfPt: number,
  opts?: { bold?: boolean; italic?: boolean; removeUnderline?: boolean }
): void {
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
    setWAttr(sz, 'val', String(fontSizeHalfPt));

    let szCs = wFirst(rPr, 'szCs');
    if (!szCs) {
      szCs = createW(doc, 'szCs');
      rPr.appendChild(szCs);
    }
    setWAttr(szCs, 'val', String(fontSizeHalfPt));

    let col = wFirst(rPr, 'color');
    if (!col) {
      col = createW(doc, 'color');
      rPr.appendChild(col);
    }
    setWAttr(col, 'val', '000000');

    if (opts?.bold !== undefined) {
      const b = wFirst(rPr, 'b');
      const bCs = wFirst(rPr, 'bCs');
      if (opts.bold && !b) rPr.appendChild(createW(doc, 'b'));
      if (!opts.bold) {
        if (b) rPr.removeChild(b);
        if (bCs) rPr.removeChild(bCs);
      }
    }

    if (opts?.italic !== undefined) {
      const iEl = wFirst(rPr, 'i');
      if (opts.italic && !iEl) rPr.appendChild(createW(doc, 'i'));
      if (!opts.italic && iEl) rPr.removeChild(iEl);
    }

    if (opts?.removeUnderline) {
      const u = wFirst(rPr, 'u');
      if (u) rPr.removeChild(u);
    }
  });
}

/**
 * Tách các thuộc tính Bên A / Bên B bị gõ dính trên cùng 1 dòng (từ OpenXmlContractEngine.cs)
 */
function splitMashedPartyProperties(rawLine: string): string[] {
  const splitMarkers = [
    /(?=\b(?:Chức vụ|Chức danh|Fax|Email|Điện thoại|Tel|Mã số thuế|MST|Số tài khoản|Tài khoản số|STK|Mở tại ngân hàng|Mở tại|Tại ngân hàng)\s*[:\-])/gi,
    /(?=\(\s*(?:Theo|Căn cứ|Giấy|Văn bản|Quyết định)\s+.*?(?:ủy|uỷ)\s*quyền)/gi,
    /(?=\s+tại\s+(?:Ngân hàng|NH\b|Kho bạc|Vietcombank|Vietinbank|Agribank|Techcombank|MB\b|BIDV|VPBank|ACB\b))/gi,
  ];

  let segments = [rawLine.trim()];
  splitMarkers.forEach((rx) => {
    const next: string[] = [];
    segments.forEach((seg) => {
      const parts = seg.split(rx).map((s) => s.trim().replace(/^[-–—/,;•]+\s*/, ''));
      parts.filter(Boolean).forEach((p) => next.push(p));
    });
    if (next.length > 0) segments = next;
  });

  return segments;
}

function extractPartyLabelAndValue(rawItem: string): { label: string; value: string } {
  const item = rawItem
    .trim()
    .replace(/^[-–—•*+\s]+/, '')
    .replace(/:{2,}/g, ':');

  if (
    /^[\(\[]?\s*(?:Theo|Căn cứ|Giấy|Văn bản|Quyết định|GƯQ|GUQ)\b.*?(?:ủy|uỷ)\s*quyền/i.test(item)
  ) {
    let auth = item.replace(/^[\(\[]\s*/, '').replace(/\s*[\)\]]$/, '').trim();
    if (!/^(Theo|Căn cứ)/i.test(auth)) {
      auth = `Theo ${auth.charAt(0).toLowerCase()}${auth.slice(1)}`;
    }
    return { label: '', value: `(${auth})` };
  }

  if (/^tại\s+(?:Ngân hàng|NH\b|Kho bạc)/i.test(item)) {
    return {
      label: 'Mở tại',
      value: item.replace(/^tại\s+/i, '').trim(),
    };
  }

  const colonIdx = item.indexOf(':');
  if (colonIdx >= 0) {
    let lbl = item.slice(0, colonIdx).trim();
    const val = item.slice(colonIdx + 1).replace(/^[:\s]+/, '').trim();

    if (/^(?:Người\s+)?đại\s+diện(?:\s+là)?$/i.test(lbl)) lbl = 'Đại diện';
    else if (/^(?:Số\s+tài\s+khoản|Tài\s+khoản\s+số|Số\s+TK|STK)$/i.test(lbl)) lbl = 'Tài khoản';
    else if (/^(?:Mở\s+tại\s+ngân\s+hàng|Tại\s+ngân\s+hàng)$/i.test(lbl)) lbl = 'Mở tại';

    if (lbl && lbl[0] === lbl[0].toLowerCase()) {
      lbl = lbl[0].toUpperCase() + lbl.slice(1);
    }
    return { label: lbl, value: val };
  }

  return { label: '', value: item };
}

function buildPartyTwoColTableXml(
  doc: XMLDocument,
  rowsData: { label: string; value: string }[],
  bodyFontSizeHalfPt: number
): Element {
  const col1W = 2041; // 3.6cm
  const col2W = PORTRAIT_CONTENT_DXA - col1W; // 7314 dxa (~12.9cm)

  const tbl = createW(doc, 'tbl');
  const tblPr = createW(doc, 'tblPr');

  const tblW = createW(doc, 'tblW');
  setWAttr(tblW, 'w', String(PORTRAIT_CONTENT_DXA));
  setWAttr(tblW, 'type', 'dxa');
  tblPr.appendChild(tblW);

  const jc = createW(doc, 'jc');
  setWAttr(jc, 'val', 'left');
  tblPr.appendChild(jc);

  const tblBorders = createW(doc, 'tblBorders');
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].forEach((bName) => {
    const b = createW(doc, bName);
    setWAttr(b, 'val', 'none');
    tblBorders.appendChild(b);
  });
  tblPr.appendChild(tblBorders);

  const tblLayout = createW(doc, 'tblLayout');
  setWAttr(tblLayout, 'type', 'fixed');
  tblPr.appendChild(tblLayout);

  const tblCellMar = createW(doc, 'tblCellMar');
  ['top', 'bottom', 'left', 'right'].forEach((side) => {
    const m = createW(doc, side);
    setWAttr(m, 'w', '0');
    setWAttr(m, 'type', 'dxa');
    tblCellMar.appendChild(m);
  });
  tblPr.appendChild(tblCellMar);
  tbl.appendChild(tblPr);

  const tblGrid = createW(doc, 'tblGrid');
  [col1W, col2W].forEach((cw) => {
    const gc = createW(doc, 'gridCol');
    setWAttr(gc, 'w', String(cw));
    tblGrid.appendChild(gc);
  });
  tbl.appendChild(tblGrid);

  rowsData.forEach((item, idx) => {
    const tr = createW(doc, 'tr');
    const trPr = createW(doc, 'trPr');
    trPr.appendChild(createW(doc, 'cantSplit'));
    tr.appendChild(trPr);

    const isAuth = !item.label && /^\(?(?:Theo|Căn cứ).*(?:ủy|uỷ)\s*quyền/i.test(item.value);
    const nextItem = rowsData[idx + 1];
    const nextIsAuth =
      Boolean(nextItem) &&
      !nextItem.label &&
      /^\(?(?:Theo|Căn cứ).*(?:ủy|uỷ)\s*quyền/i.test(nextItem.value);

    const bef = isAuth ? 0 : 12;
    const aft = nextIsAuth ? 0 : 16;

    // Cột 1: Nhãn thuộc tính sạch dấu hai chấm, chữ thường chuẩn NĐ30
    const tc1 = createW(doc, 'tc');
    const tcPr1 = createW(doc, 'tcPr');
    const tcW1 = createW(doc, 'tcW');
    setWAttr(tcW1, 'w', String(col1W));
    setWAttr(tcW1, 'type', 'dxa');
    tcPr1.appendChild(tcW1);
    tc1.appendChild(tcPr1);

    const p1 = createW(doc, 'p');
    applyParagraphPropsXml(doc, p1, {
      align: 'left',
      beforeDxa: bef,
      afterDxa: aft,
    });
    if (item.label) {
      p1.appendChild(createRunXml(doc, item.label.replace(/:+$/, '').trim(), bodyFontSizeHalfPt, false, false));
    }
    tc1.appendChild(p1);
    tr.appendChild(tc1);

    // Cột 2: Thụt treo dấu ": " (-198 / 198 dxa), in đậm tên người sau Ông/Bà, nghiêng Giấy ủy quyền
    const tc2 = createW(doc, 'tc');
    const tcPr2 = createW(doc, 'tcPr');
    const tcW2 = createW(doc, 'tcW');
    setWAttr(tcW2, 'w', String(col2W));
    setWAttr(tcW2, 'type', 'dxa');
    tcPr2.appendChild(tcW2);
    tc2.appendChild(tcPr2);

    const p2 = createW(doc, 'p');
    if (isAuth) {
      applyParagraphPropsXml(doc, p2, {
        align: 'both',
        leftDxa: 198,
        beforeDxa: bef,
        afterDxa: aft,
      });
      p2.appendChild(createRunXml(doc, item.value, bodyFontSizeHalfPt, false, true));
    } else {
      applyParagraphPropsXml(doc, p2, {
        align: 'both',
        leftDxa: 198,
        hangingDxa: 198,
        beforeDxa: bef,
        afterDxa: aft,
      });

      const cleanVal = item.value.replace(/^[:\s]+/, '').trim();
      const fullVal = (item.label ? ': ' : '') + cleanVal;

      // In đậm tên người sau Ông / Bà
      ONG_BA_REGEX.lastIndex = 0;
      const m = ONG_BA_REGEX.exec(fullVal);
      if (m && !TITLE_STOP_PREFIXES.some((pre) => m[2].startsWith(pre))) {
        const nameStart = m.index + m[0].indexOf(m[2]);
        const nameLen = m[2].length;
        p2.appendChild(
          createRunXml(doc, fullVal.slice(0, nameStart), bodyFontSizeHalfPt, false, false)
        );
        p2.appendChild(
          createRunXml(doc, fullVal.slice(nameStart, nameStart + nameLen), bodyFontSizeHalfPt, true, false)
        );
        if (nameStart + nameLen < fullVal.length) {
          p2.appendChild(
            createRunXml(doc, fullVal.slice(nameStart + nameLen), bodyFontSizeHalfPt, false, false)
          );
        }
      } else {
        p2.appendChild(createRunXml(doc, fullVal, bodyFontSizeHalfPt, false, false));
      }
    }

    tc2.appendChild(p2);
    tr.appendChild(tc2);
    tbl.appendChild(tr);
  });

  return tbl;
}

function insertShortCenteredRuleAfterXml(
  doc: XMLDocument,
  targetP: Element,
  ruleWidthDxa: number,
  afterDxa = 120
): void {
  const indentSide = Math.max(400, Math.round((PORTRAIT_CONTENT_DXA - ruleWidthDxa) / 2));
  const pLine = createW(doc, 'p');
  const pPr = createW(doc, 'pPr');

  const jc = createW(doc, 'jc');
  setWAttr(jc, 'val', 'center');
  pPr.appendChild(jc);

  const ind = createW(doc, 'ind');
  setWAttr(ind, 'left', String(indentSide));
  setWAttr(ind, 'right', String(indentSide));
  pPr.appendChild(ind);

  const pBdr = createW(doc, 'pBdr');
  const bottom = createW(doc, 'bottom');
  setWAttr(bottom, 'val', 'single');
  setWAttr(bottom, 'sz', '6'); // 0.75pt thanh mảnh sắc nét
  setWAttr(bottom, 'space', '1');
  setWAttr(bottom, 'color', '000000');
  pBdr.appendChild(bottom);
  pPr.appendChild(pBdr);

  const sp = createW(doc, 'spacing');
  setWAttr(sp, 'before', '0');
  setWAttr(sp, 'after', String(afterDxa));
  setWAttr(sp, 'line', '20');
  setWAttr(sp, 'lineRule', 'exact');
  pPr.appendChild(sp);

  pLine.appendChild(pPr);
  targetP.parentNode?.insertBefore(pLine, targetP.nextSibling);
}

function createSectionPropertiesXml(
  doc: XMLDocument,
  opts: {
    isLandscape: boolean;
    isNextPage: boolean;
    firstHeaderRelId?: string;
    defaultHeaderRelId?: string;
    hideFirstPageNum?: boolean;
  }
): Element {
  const sectPr = createW(doc, 'sectPr');

  if (opts.defaultHeaderRelId) {
    const hDef = createW(doc, 'headerReference');
    setWAttr(hDef, 'type', 'default');
    hDef.setAttributeNS(R_ATTR_NS, 'r:id', opts.defaultHeaderRelId);
    sectPr.appendChild(hDef);
  }
  if (opts.hideFirstPageNum && opts.firstHeaderRelId) {
    const hFirst = createW(doc, 'headerReference');
    setWAttr(hFirst, 'type', 'first');
    hFirst.setAttributeNS(R_ATTR_NS, 'r:id', opts.firstHeaderRelId);
    sectPr.appendChild(hFirst);
  }

  if (opts.isNextPage) {
    const typ = createW(doc, 'type');
    setWAttr(typ, 'val', 'nextPage');
    sectPr.appendChild(typ);
  }

  const pgSz = createW(doc, 'pgSz');
  if (opts.isLandscape) {
    setWAttr(pgSz, 'w', '16838');
    setWAttr(pgSz, 'h', '11906');
    setWAttr(pgSz, 'orient', 'landscape');
  } else {
    setWAttr(pgSz, 'w', '11906');
    setWAttr(pgSz, 'h', '16838');
    setWAttr(pgSz, 'orient', 'portrait');
  }
  sectPr.appendChild(pgSz);

  const pgMar = createW(doc, 'pgMar');
  setWAttr(pgMar, 'top', String(cmToDxa(2.0))); // 20mm
  setWAttr(pgMar, 'bottom', String(cmToDxa(2.0))); // 20mm
  if (opts.isLandscape) {
    setWAttr(pgMar, 'left', String(cmToDxa(2.5))); // 25mm gáy đóng ngang
    setWAttr(pgMar, 'right', String(cmToDxa(2.0))); // 20mm
  } else {
    setWAttr(pgMar, 'left', String(cmToDxa(3.0))); // 30mm gáy đóng dọc NĐ30
    setWAttr(pgMar, 'right', String(cmToDxa(1.5))); // 15mm
  }
  setWAttr(pgMar, 'header', '708');
  setWAttr(pgMar, 'footer', '708');
  setWAttr(pgMar, 'gutter', '0');
  sectPr.appendChild(pgMar);

  if (opts.hideFirstPageNum) {
    sectPr.appendChild(createW(doc, 'titlePg'));
  }

  return sectPr;
}

function injectDecree30HeaderParts(
  files: Record<string, Uint8Array>,
  headerFontSizeHalfPt: number
): { firstRelId: string; defaultRelId: string } {
  const firstHeaderXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p/>
</w:hdr>`;

  const defaultHeaderXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:fldSimple w:instr="PAGE">
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          <w:sz w:val="${headerFontSizeHalfPt}"/>
          <w:szCs w:val="${headerFontSizeHalfPt}"/>
        </w:rPr>
        <w:t>2</w:t>
      </w:r>
    </w:fldSimple>
  </w:p>
</w:hdr>`;

  files['word/header_nd30_first.xml'] = strToU8(firstHeaderXml);
  files['word/header_nd30_default.xml'] = strToU8(defaultHeaderXml);

  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  // Cập nhật word/_rels/document.xml.rels
  const relsPath = 'word/_rels/document.xml.rels';
  const relsRaw = files[relsPath]
    ? strFromU8(files[relsPath])
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${REL_NS}"/>`;
  const relsDoc = parser.parseFromString(relsRaw, 'application/xml');
  const relsRoot = relsDoc.documentElement;

  const firstRelId = 'rIdNd30HdrFirst';
  const defaultRelId = 'rIdNd30HdrDefault';

  Array.from(relsRoot.childNodes).forEach((n) => {
    if (n.nodeType === 1) {
      const id = (n as Element).getAttribute('Id');
      if (id === firstRelId || id === defaultRelId) relsRoot.removeChild(n);
    }
  });

  const addRel = (id: string, target: string) => {
    const rel = relsDoc.createElementNS(REL_NS, 'Relationship');
    rel.setAttribute('Id', id);
    rel.setAttribute(
      'Type',
      'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
    );
    rel.setAttribute('Target', target);
    relsRoot.appendChild(rel);
  };

  addRel(firstRelId, 'header_nd30_first.xml');
  addRel(defaultRelId, 'header_nd30_default.xml');
  files[relsPath] = strToU8(serializer.serializeToString(relsDoc));

  // Cập nhật [Content_Types].xml
  const ctPath = '[Content_Types].xml';
  if (files[ctPath]) {
    const ctDoc = parser.parseFromString(strFromU8(files[ctPath]), 'application/xml');
    const ctRoot = ctDoc.documentElement;
    const ensureOverride = (partName: string) => {
      const exists = Array.from(ctRoot.getElementsByTagName('Override')).some(
        (el) => el.getAttribute('PartName') === partName
      );
      if (!exists) {
        const ov = ctDoc.createElementNS(CT_NS, 'Override');
        ov.setAttribute('PartName', partName);
        ov.setAttribute(
          'ContentType',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'
        );
        ctRoot.appendChild(ov);
      }
    };
    ensureOverride('/word/header_nd30_first.xml');
    ensureOverride('/word/header_nd30_default.xml');
    files[ctPath] = strToU8(serializer.serializeToString(ctDoc));
  }

  return { firstRelId, defaultRelId };
}

/**
 * ĐỘNG CƠ TỔNG HỢP: Xử lý & chuẩn hóa trực tiếp file .docx tải lên (FormatHopDong + FormatBang + FormatHanhChinh)
 */
export async function processUploadedDocxBuffer(params: {
  arrayBuffer: ArrayBuffer;
  profile: FormatWordProfile;
  fontScale: FontScalePreset;
}): Promise<{ blob: Blob; report: FormatDocxReport }> {
  const { arrayBuffer, profile, fontScale } = params;
  const bodySizeHalfPt = fontScale === '13_14' ? 28 : 26; // 14pt vs 13pt
  const quocHieuSizeHalfPt = fontScale === '13_14' ? 26 : 24; // 13pt vs 12pt
  const tieuNguSizeHalfPt = fontScale === '13_14' ? 28 : 26; // 14pt vs 13pt

  const unzipped = unzipSync(new Uint8Array(arrayBuffer));
  const files: Record<string, Uint8Array> = { ...unzipped };

  if (!files['word/document.xml']) {
    throw new Error('File không đúng cấu trúc Microsoft Word (.docx — thiếu word/document.xml).');
  }

  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const xmlDoc = parser.parseFromString(strFromU8(files['word/document.xml']), 'application/xml');
  const body = wDescendants(xmlDoc.documentElement, 'body')[0];

  if (!body) {
    throw new Error('Không tìm thấy phần thân tài liệu (w:body) trong file Word.');
  }

  const fullRawText = getElementText(body);
  const allTablesInitial = wChildren(body, 'tbl');

  // Nhận diện thông minh loại tài liệu
  let detectedType: FormatDocxReport['detectedType'] = 'admin_general';
  if (
    /\b(HỢP ĐỒNG|BÊN A|BÊN B|BÊN MUA|BÊN BÁN|CHỦ ĐẦU TƯ|NHÀ THẦU)\b/i.test(fullRawText)
  ) {
    detectedType = 'contract';
  } else if (/\b(QUYẾT ĐỊNH|NGHỊ QUYẾT|QUY CHẾ|QUY ĐỊNH)\b/i.test(fullRawText)) {
    detectedType = 'admin_decision';
  } else if (allTablesInitial.length > 0 && fullRawText.length < 2500) {
    detectedType = 'table_heavy';
  }

  const effectiveMode: Exclude<FormatWordProfile, 'auto'> =
    profile !== 'auto'
      ? profile
      : detectedType === 'contract'
      ? 'contract'
      : detectedType === 'table_heavy'
      ? 'table_only'
      : 'admin_vtc';

  const detectedLabelMap: Record<FormatDocxReport['detectedType'], string> = {
    contract: 'Hợp đồng / Thỏa thuận song phương',
    table_heavy: 'Tài liệu Bảng biểu & Phụ lục dữ liệu',
    admin_decision: 'Quyết định / Nghị quyết / Quy chế',
    admin_general: 'Văn bản Hành chính (Tờ trình / Báo cáo / Công văn)',
  };

  let textFixesApplied = 0;
  let paragraphsFormatted = 0;
  let partyBlocksConverted = 0;
  let tablesFormatted = 0;
  let landscapeSectionsCount = 0;
  const highlights: string[] = [];
  const warnings: LinterIssue[] = [];

  // 1. Làm sạch ký tự rác, Tab, Bullet symbols & chuẩn hóa câu chữ NĐ30 (trừ khi chỉ chọn table_only)
  if (effectiveMode !== 'table_only') {
    wDescendants(body, 'tab').forEach((tab) => {
      const parentRun = tab.parentNode;
      if (parentRun) {
        const sp = createW(xmlDoc, 't');
        sp.setAttribute('xml:space', 'preserve');
        sp.textContent = ' ';
        parentRun.insertBefore(sp, tab);
        parentRun.removeChild(tab);
      }
    });

    wDescendants(body, 't').forEach((tNode) => {
      const before = tNode.textContent || '';
      if (!before) return;
      let cleaned = before;
      BULLET_CHARS.forEach((b) => {
        cleaned = cleaned.split(`${b} `).join('- ').split(b).join('- ');
      });
      cleaned = autoFixAdministrativeText(cleaned);
      // Xóa khoảng trắng quanh dấu "/" trong số hiệu văn bản (VD: 03 /QĐ -> 03/QĐ)
      cleaned = cleaned.replace(/(\d+)\s+\/\s*([A-Za-zÀ-ỹĐđ])/g, '$1/$2');

      if (cleaned !== before) {
        textFixesApplied++;
        tNode.textContent = cleaned;
        tNode.setAttribute('xml:space', 'preserve');
      }
    });

    // Dọn dẹp dòng phân cách rác (---o0o---, ***, ___) và đoạn trống liên tiếp
    const topChildren = Array.from(body.childNodes).filter((n) => n.nodeType === 1) as Element[];
    let prevWasEmpty = false;
    topChildren.forEach((el) => {
      if (el.localName !== 'p') {
        prevWasEmpty = false;
        return;
      }
      const pPr = wFirst(el, 'pPr');
      const hasBorder = pPr && wFirst(pPr, 'pBdr') !== null;
      const hasSect = pPr && wFirst(pPr, 'sectPr') !== null;
      if (hasBorder || hasSect) {
        prevWasEmpty = false;
        return;
      }

      const txt = getElementText(el).trim();
      const isJunk =
        /^[-_—–.*\s]+(o0o|ooo|0o0|oOo)?[-_—–.*\s]+$/i.test(txt) && txt.length >= 3;
      if (isJunk) {
        body.removeChild(el);
        textFixesApplied++;
        return;
      }

      if (!txt) {
        if (prevWasEmpty) {
          body.removeChild(el);
        }
        prevWasEmpty = true;
      } else {
        prevWasEmpty = false;
      }
    });
  }

  // 2. Xử lý Máy trạng thái Hợp đồng (Bên A / Bên B, Căn cứ, Điều khoản) hoặc Văn bản Hành chính
  if (effectiveMode === 'contract') {
    const elements = Array.from(body.childNodes).filter((n) => n.nodeType === 1) as Element[];
    let state: 0 | 1 | 2 | 3 | 4 = 0; // 0: Header, 1: Căn cứ & Bên A/B, 2: Điều khoản, 3: Chữ ký, 4: Phụ lục
    let inPartyDetails = false;
    const partyBlocks: Element[][] = [];
    let currentParty: Element[] = [];
    let currentCanCu: Element[] = [];

    const flushCanCu = () => {
      if (currentCanCu.length === 0) return;
      currentCanCu.forEach((cp, idx) => {
        const isLast = idx === currentCanCu.length - 1;
        const expectedEnd = isLast ? '.' : ';';
        const tList = wDescendants(cp, 't');
        const lastT = tList[tList.length - 1];
        if (lastT && lastT.textContent) {
          lastT.textContent = lastT.textContent.trimEnd().replace(/[.,;:\s]+$/, '') + expectedEnd;
        }
      });
      currentCanCu = [];
    };

    const flushParty = () => {
      if (currentParty.length > 0) {
        partyBlocks.push([...currentParty]);
        currentParty = [];
      }
      inPartyDetails = false;
    };

    elements.forEach((el) => {
      if (el.localName !== 'p') {
        flushParty();
        flushCanCu();
        return;
      }

      const txt = getElementText(el).trim();
      if (!txt) return;
      paragraphsFormatted++;

      const isTransitionToClauses =
        /^Điều\s+\d+[.:]/i.test(txt) ||
        /^(Hai\s+bên|Các\s+bên)\s+(?:thỏa\s+thuận|thống\s+nhất|ký\s+kết|cam\s+kết)/i.test(txt);

      const isPartyHeader =
        partyBlocks.length < 5 &&
        !/^(Hai bên|Các bên|Bên Mua và Bên Bán)/i.test(txt) &&
        (/^([IVX0-9]+[.)]\s*)?(?:BÊN\s+[AB12]|BÊN\s+MUA|BÊN\s+BÁN|BÊN\s+GIAO|BÊN\s+NHẬN|CHỦ\s+ĐẦU\s+TƯ|NHÀ\s+THẦU)\b/i.test(
          txt
        ) ||
          /\(\s*sau đây gọi (?:tắt )?là Bên [AB]/i.test(txt));

      if (state === 0 && (/^-?\s*Căn cứ/i.test(txt) || /^Hôm nay,?\s*ngày/i.test(txt) || isPartyHeader)) {
        state = 1;
      } else if (state <= 1 && isTransitionToClauses) {
        flushParty();
        flushCanCu();
        state = 2;
      } else if (/^PHỤ\s*LỤC\b/i.test(txt)) {
        flushParty();
        flushCanCu();
        state = 4;
      } else if (/^(ĐẠI\s+DIỆN\s+(?:BÊN|CÁC\s+BÊN)|BÊN\s+A\s+BÊN\s+B)/i.test(txt)) {
        flushParty();
        flushCanCu();
        state = 3;
      }

      if (state === 0) {
        if (/^CỘNG\s+H[ÒO][ÀA]\s+XÃ\s+HỘI/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, { align: 'center', beforeDxa: 0, afterDxa: 0, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, quocHieuSizeHalfPt, { bold: true, italic: false });
        } else if (/^Độc\s*lập/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, { align: 'center', beforeDxa: 0, afterDxa: 20, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, tieuNguSizeHalfPt, {
            bold: true,
            italic: false,
            removeUnderline: true,
          });
          insertShortCenteredRuleAfterXml(xmlDoc, el, 3150, 120);
        } else if (/^(HỢP ĐỒNG|BIÊN BẢN|THỎA THUẬN)/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, { align: 'center', beforeDxa: 140, afterDxa: 60, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, 30, { bold: true, italic: false });
        } else if (/^\(?Số\s*:/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, { align: 'center', beforeDxa: 20, afterDxa: 120, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: true });
        } else {
          applyParagraphPropsXml(xmlDoc, el, { align: 'center', beforeDxa: 0, afterDxa: 80, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt);
        }
      } else if (state === 1) {
        if (txt.toUpperCase() === 'VÀ') {
          flushParty();
          applyParagraphPropsXml(xmlDoc, el, { align: 'both', beforeDxa: 60, afterDxa: 60 });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
        } else if (isPartyHeader) {
          flushParty();
          flushCanCu();
          applyParagraphPropsXml(xmlDoc, el, { align: 'both', beforeDxa: 80, afterDxa: 30, keepNext: true });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
          inPartyDetails = true;
        } else if (inPartyDetails) {
          if (/^[\(\[]?\s*Sau đây gọi/i.test(txt)) {
            flushParty();
            applyParagraphPropsXml(xmlDoc, el, { align: 'both', beforeDxa: 20, afterDxa: 60 });
            setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: true });
          } else {
            currentParty.push(el);
          }
        } else if (/^-?\s*Căn cứ/i.test(txt)) {
          currentCanCu.push(el);
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'both',
            firstLineDxa: 720,
            beforeDxa: 0,
            afterDxa: 40,
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: true });
        } else {
          flushCanCu();
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'both',
            firstLineDxa: 720,
            beforeDxa: 20,
            afterDxa: 60,
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: false });
        }
      } else if (state === 2) {
        if (/^Điều\s+\d+[.:]/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'both',
            firstLineDxa: 720,
            beforeDxa: 90,
            afterDxa: 45,
            keepNext: true,
            keepLines: true,
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, {
            bold: true,
            italic: false,
            removeUnderline: true,
          });
        } else {
          const isShortHeading = /^\d+(\.\d+)+\.?\s+[^:]{2,55}:?$/.test(txt);
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'both',
            firstLineDxa: 720,
            beforeDxa: 0,
            afterDxa: 60,
            keepNext: isShortHeading || txt.endsWith(':'),
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, {
            bold: isShortHeading ? true : undefined,
          });
        }
      } else if (state === 4) {
        if (/^PHỤ\s*LỤC\b/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'center',
            beforeDxa: 120,
            afterDxa: 40,
            keepNext: true,
          });
          setParagraphRunsStyleXml(xmlDoc, el, 28, { bold: true, italic: false });
        } else if (txt.startsWith('(') || /(kèm theo|hợp đồng số)/i.test(txt)) {
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'center',
            beforeDxa: 0,
            afterDxa: 120,
            keepNext: true,
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: true });
          if (txt.endsWith(')')) state = 2;
        } else {
          state = 2;
          applyParagraphPropsXml(xmlDoc, el, {
            align: 'both',
            firstLineDxa: 720,
            beforeDxa: 0,
            afterDxa: 60,
          });
          setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt);
        }
      }
    });

    flushParty();
    flushCanCu();

    // Chuyển các khối thông tin Bên A / Bên B thành bảng 2 cột ẩn viền chuẩn NĐ30
    partyBlocks.forEach((block) => {
      if (block.length === 0 || block.length > 15) return;
      const rowsData: { label: string; value: string }[] = [];
      block.forEach((p) => {
        const raw = getElementText(p).trim();
        splitMashedPartyProperties(raw).forEach((seg) => {
          const parsed = extractPartyLabelAndValue(seg);
          if (parsed.label || parsed.value) rowsData.push(parsed);
        });
      });

      const hasPartyField = rowsData.some((r) =>
        /^(Địa chỉ|Điện thoại|Mã số thuế|MST|Tài khoản|Mở tại|Đại diện|Chức vụ|Email|Fax)/i.test(
          r.label
        )
      );
      if (!hasPartyField) return;

      const tbl = buildPartyTwoColTableXml(xmlDoc, rowsData, bodySizeHalfPt);
      const anchor = block[0];
      anchor.parentNode?.insertBefore(tbl, anchor);
      block.forEach((p) => p.parentNode?.removeChild(p));
      partyBlocksConverted++;
    });

    if (partyBlocksConverted > 0) {
      highlights.push(
        `Đã tái cấu trúc ${partyBlocksConverted} khối thông tin pháp nhân (Bên A / Bên B) thành bảng 2 cột ẩn viền thụt treo dấu hai chấm chuẩn Nghị định 30.`
      );
    }
  } else if (effectiveMode === 'admin_vtc') {
    const isItalicBasisDoc = detectedType === 'admin_decision';
    const elements = Array.from(body.childNodes).filter((n) => n.nodeType === 1) as Element[];
    let basisBucket: Element[] = [];

    const flushBasis = () => {
      if (basisBucket.length === 0) return;
      basisBucket.forEach((bp, idx) => {
        const isLast = idx === basisBucket.length - 1;
        const expected = isLast ? '.' : ';';
        const ts = wDescendants(bp, 't');
        const lastT = ts[ts.length - 1];
        if (lastT && lastT.textContent) {
          lastT.textContent = lastT.textContent.trimEnd().replace(/[.,;:\s]+$/, '') + expected;
        }
      });
      basisBucket = [];
    };

    elements.forEach((el) => {
      if (el.localName !== 'p') {
        flushBasis();
        return;
      }
      const txt = getElementText(el).trim();
      if (!txt) return;
      paragraphsFormatted++;

      if (
        /^(TỜ TRÌNH|BÁO CÁO|QUYẾT ĐỊNH|NGHỊ QUYẾT|THÔNG BÁO|KẾ HOẠCH|CHƯƠNG TRÌNH|PHƯƠNG ÁN|BIÊN BẢN|GIẤY MỜI|HƯỚNG DẪN)$/i.test(
          txt
        )
      ) {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'center',
          beforeDxa: 180,
          afterDxa: 40,
          keepNext: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt + 2, { bold: true, italic: false });
      } else if (/^(Về việc|V\/v)\b/i.test(txt)) {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'center',
          beforeDxa: 0,
          afterDxa: 40,
          keepNext: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
        if (/^Về việc/i.test(txt)) {
          insertShortCenteredRuleAfterXml(xmlDoc, el, 2600, 140);
        }
      } else if (/^Kính gửi\s*:/i.test(txt)) {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'center',
          beforeDxa: 80,
          afterDxa: 120,
          keepNext: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
      } else if (/^-?\s*Căn cứ\b/i.test(txt)) {
        basisBucket.push(el);
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'both',
          firstLineDxa: 720,
          beforeDxa: 0,
          afterDxa: 60,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, {
          bold: false,
          italic: isItalicBasisDoc,
        });
      } else if (/^(QUYẾT ĐỊNH|NGHỊ QUYẾT)\s*:/i.test(txt)) {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'center',
          beforeDxa: 120,
          afterDxa: 100,
          keepNext: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
      } else if (/^(Điều|Mục|Phần|Chương)\s+[0-9IVX]+[.:]?/i.test(txt)) {
        flushBasis();
        const isCenteredPart = /^(Phần|Chương)\s+[IVX0-9]+/i.test(txt);
        applyParagraphPropsXml(xmlDoc, el, {
          align: isCenteredPart ? 'center' : 'both',
          firstLineDxa: isCenteredPart ? 0 : 720,
          beforeDxa: 90,
          afterDxa: 50,
          keepNext: true,
          keepLines: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: true, italic: false });
      } else if (/^Trân trọng\.?\/\.?$/i.test(txt)) {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'both',
          firstLineDxa: 720,
          beforeDxa: 60,
          afterDxa: 100,
          keepNext: true,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt, { bold: false, italic: true });
      } else {
        flushBasis();
        applyParagraphPropsXml(xmlDoc, el, {
          align: 'both',
          firstLineDxa: 720,
          beforeDxa: 0,
          afterDxa: 90,
        });
        setParagraphRunsStyleXml(xmlDoc, el, bodySizeHalfPt);
      }
    });

    flushBasis();
    highlights.push(
      `Đã chuẩn hóa phân cấp đoạn văn bản hành chính (thụt đầu dòng 1.27cm, căn đều 2 bên, giãn đoạn 6pt, chuẩn hóa dấu chấm phẩy phần Căn cứ).`
    );
  }

  // 3. Chống mồ côi tiêu đề trước bảng & khóa cứng 3 đoạn cuối đi liền bảng Chữ ký (Anti-Orphan Binding)
  const bodyElems = Array.from(body.childNodes).filter((n) => n.nodeType === 1) as Element[];
  bodyElems.forEach((el, idx) => {
    if (el.localName === 'p') {
      const pTxt = getElementText(el).trim();
      const nextEl = bodyElems[idx + 1];
      const isHeading = /^(PHỤ\s*LỤC|ĐIỀU|MỤC|CHƯƠNG|BẢNG)\b/i.test(pTxt);
      const isPreTableIntro = nextEl?.localName === 'tbl' && pTxt.length > 0 && pTxt.length <= 140;
      if (isHeading || isPreTableIntro) {
        let pPr = wFirst(el, 'pPr');
        if (!pPr) {
          pPr = createW(xmlDoc, 'pPr');
          el.insertBefore(pPr, el.firstChild);
        }
        if (!wFirst(pPr, 'keepNext')) pPr.appendChild(createW(xmlDoc, 'keepNext'));
        if (!wFirst(pPr, 'keepLines')) pPr.appendChild(createW(xmlDoc, 'keepLines'));
        // Gỡ bỏ ngắt trang cứng ngay trước bảng dữ liệu
        const pbb = wFirst(pPr, 'pageBreakBefore');
        if (pbb && !/^PHỤ\s*LỤC\b/i.test(pTxt)) pPr.removeChild(pbb);
      }
    } else if (el.localName === 'tbl') {
      const tblTxt = getElementText(el);
      if (/(ĐẠI DIỆN BÊN|Nơi nhận:|CHỦ TỊCH|GIÁM ĐỐC|TRƯỞNG ĐƠN VỊ)/i.test(tblTxt)) {
        // Khóa 3 đoạn văn trước bảng chữ ký để không bao giờ rớt chữ ký mồ côi sang trang trắng
        let bound = 0;
        for (let k = idx - 1; k >= 0 && bound < 3; k--) {
          const prev = bodyElems[k];
          if (prev.localName !== 'p') break;
          if (getElementText(prev).trim()) {
            let pPr = wFirst(prev, 'pPr');
            if (!pPr) {
              pPr = createW(xmlDoc, 'pPr');
              prev.insertBefore(pPr, prev.firstChild);
            }
            if (!wFirst(pPr, 'keepNext')) pPr.appendChild(createW(xmlDoc, 'keepNext'));
            if (!wFirst(pPr, 'keepLines')) pPr.appendChild(createW(xmlDoc, 'keepLines'));
            bound++;
          }
        }
      }
    }
  });

  // 4. Kiến trúc Hybrid Orientation + Section Break cho Phụ lục + Đánh số trang Header ẩn trang 1
  const { firstRelId, defaultRelId } = injectDecree30HeaderParts(files, bodySizeHalfPt);

  // Xóa các FooterReference cũ bằng cách làm sạch sectPr và xây dựng lại chuẩn NĐ30
  wDescendants(body, 'p').forEach((p) => {
    const pPr = wFirst(p, 'pPr');
    const oldSect = pPr ? wFirst(pPr, 'sectPr') : null;
    if (oldSect && pPr) pPr.removeChild(oldSect);
  });
  const oldFinalSect = wFirst(body, 'sectPr');
  if (oldFinalSect) body.removeChild(oldFinalSect);

  const refreshedChildren = Array.from(body.childNodes).filter((n) => n.nodeType === 1) as Element[];
  const annexIndices: number[] = [];
  refreshedChildren.forEach((el, idx) => {
    if (el.localName === 'p' && /^PHỤ\s*LỤC\b/i.test(getElementText(el).trim())) {
      annexIndices.push(idx);
    }
  });

  const bounds = [0, ...annexIndices, refreshedChildren.length];
  const sectionLandscapeFlags: boolean[] = [];

  for (let s = 0; s < bounds.length - 1; s++) {
    let maxCols = 0;
    for (let k = bounds[s]; k < bounds[s + 1]; k++) {
      const el = refreshedChildren[k];
      if (el?.localName === 'tbl') {
        const { totalCols } = extractOpenXmlTableMeta(el);
        if (totalCols > maxCols) maxCols = totalCols;
      }
    }
    const shouldLandscape =
      effectiveMode === 'table_only' ? maxCols >= 8 : s > 0 && maxCols >= 8;
    if (shouldLandscape) landscapeSectionsCount++;
    sectionLandscapeFlags.push(shouldLandscape);
  }

  for (let k = 0; k < annexIndices.length; k++) {
    const annexPara = refreshedChildren[annexIndices[k]];
    const prevIsLand = sectionLandscapeFlags[k];
    const sepPara = createW(xmlDoc, 'p');
    const sepPr = createW(xmlDoc, 'pPr');
    sepPr.appendChild(
      createSectionPropertiesXml(xmlDoc, {
        isLandscape: prevIsLand,
        isNextPage: true,
        firstHeaderRelId: firstRelId,
        defaultHeaderRelId: defaultRelId,
        hideFirstPageNum: k === 0,
      })
    );
    sepPara.appendChild(sepPr);
    body.insertBefore(sepPara, annexPara);
  }

  // 5. Định dạng toàn bộ Bảng biểu bằng động cơ FormatBang
  const currentBodyElements = Array.from(body.childNodes).filter(
    (n) => n.nodeType === 1
  ) as Element[];

  currentBodyElements.forEach((el, idx) => {
    if (el.localName !== 'tbl') return;
    // Xác định bảng thuộc section Dọc hay Ngang
    let isLand = sectionLandscapeFlags[sectionLandscapeFlags.length - 1] || false;
    for (let j = idx + 1; j < currentBodyElements.length; j++) {
      const pPr = wFirst(currentBodyElements[j], 'pPr');
      const sect = pPr ? wFirst(pPr, 'sectPr') : null;
      if (sect) {
        const pgSz = wFirst(sect, 'pgSz');
        isLand = getWAttr(pgSz, 'orient') === 'landscape';
        break;
      }
    }
    const res = formatOpenXmlTableDynamic(xmlDoc, el, isLand);
    if (res.formatted) tablesFormatted++;
  });

  // Đính sectPr cuối cùng cho body
  body.appendChild(
    createSectionPropertiesXml(xmlDoc, {
      isLandscape: sectionLandscapeFlags[sectionLandscapeFlags.length - 1] || false,
      isNextPage: false,
      firstHeaderRelId: firstRelId,
      defaultHeaderRelId: defaultRelId,
      hideFirstPageNum: annexIndices.length === 0,
    })
  );

  if (tablesFormatted > 0) {
    highlights.push(
      `Đã chuẩn hóa ${tablesFormatted} bảng dữ liệu theo chuẩn FormatBang (căn phải tiền tệ, lặp tiêu đề qua trang tblHeader, chống gãy dòng cantSplit${
        landscapeSectionsCount > 0 ? `, tự động xoay ngang ${landscapeSectionsCount} phụ lục >= 8 cột` : ''
      }).`
    );
  }

  highlights.push(
    'Đã thiết lập khổ giấy A4 chuẩn Nghị định 30 (Lề trái 30mm, phải 15mm, trên/dưới 20mm) và đánh số trang căn giữa lề trên ẩn Trang 1.'
  );

  if (textFixesApplied > 0) {
    highlights.push(
      `Đã tự động sửa ${textFixesApplied} điểm lỗi chính tả, khoảng trắng, dấu hai chấm lặp, ngoặc kép cong và định dạng ngày tháng.`
    );
  }

  files['word/document.xml'] = strToU8(serializer.serializeToString(xmlDoc));
  const zipped = zipSync(files, { level: 6 });

  const blob = new Blob([zipped as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return {
    blob,
    report: {
      detectedType,
      detectedLabel: detectedLabelMap[detectedType],
      paragraphsFormatted,
      partyBlocksConverted,
      tablesFormatted,
      landscapeSectionsCount,
      textFixesApplied,
      headerPaginationApplied: true,
      highlights,
      warnings,
    },
  };
}

/**
 * Tạo file .docx mẫu "chưa chuẩn hóa" (gồm Hợp đồng gõ dính dòng + dấu :: + Phụ lục bảng giá 9 cột)
 * để người dùng có thể bấm thử nghiệm tính năng Upload & Format ngay lập tức trong 1 cú nhấp!
 */
export async function generateSampleUnformattedContractDocx(): Promise<File> {
  const sampleRows = [
    [
      'STT',
      'Danh mục thiết bị & bản quyền phần mềm',
      'Xuất xứ',
      'ĐVT',
      'Số lượng',
      'Đơn giá (VNĐ)',
      'Thuế VAT',
      'Thành tiền (VNĐ)',
      'Bảo hành',
    ],
    [
      '1',
      'Máy chủ xử lý dữ liệu tập trung VTC Cloud Node Gen11',
      'Singapore',
      'Bộ',
      '2',
      '185.000.000',
      '10%',
      '407.000.000',
      '36 tháng',
    ],
    [
      '2',
      'Thiết bị tường lửa an toàn thông tin chuyên dụng Next-Gen HA',
      'Mỹ',
      'Bộ',
      '1',
      '210.000.000',
      '10%',
      '231.000.000',
      '24 tháng',
    ],
    ['Tổng cộng đã bao gồm thuế GTGT', '', '', '', '', '', '', '638.000.000', ''],
    ['(Bằng chữ: Sáu trăm ba mươi tám triệu đồng chẵn./.)', '', '', '', '', '', '', '', ''],
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM')] }),
          new Paragraph({ children: [new TextRun('Độc Lập - Tự Do - Hạnh Phúc')] }),
          new Paragraph({ children: [new TextRun('---o0o---')] }),
          new Paragraph({ children: [new TextRun('HỢP ĐỒNG CUNG CẤP THIẾT BỊ VÀ DỊCH VỤ KỸ THUẬT')] }),
          new Paragraph({ children: [new TextRun('Số: 5 / 2026 / HĐKT-VTS')] }),
          new Paragraph({
            children: [
              new TextRun(
                '- Căn cứ Bộ luật Dân sự số 91/2015/QH13 của Quốc hội nước Cộng hoà Xã hội Chủ nghĩa Việt Nam,'
              ),
            ],
          }),
          new Paragraph({
            children: [new TextRun('- Căn cứ nhu cầu và năng lực của hai bên,')],
          }),
          new Paragraph({
            children: [
              new TextRun('Hôm nay, ngày 5 tháng 1 năm 2026, tại Hà Nội, chúng tôi gồm có:'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('BÊN A: CÔNG TY TNHH MỘT THÀNH VIÊN VIỄN THÔNG SỐ VTC'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Đại diện :: Ông Trần Quốc Sơn    Chức vụ: Chủ tịch Công ty'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Địa chỉ : Số 65 Lạc Trung, phường Vĩnh Tuy, thành phố Hà Nội'),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Mã số thuế: 0105431099   Số tài khoản: 950798888 tại Ngân hàng TMCP Quân Đội (MB) - CN Hai Bà Trưng'
              ),
            ],
          }),
          new Paragraph({ children: [new TextRun('(Sau đây gọi tắt là "Bên A")')] }),
          new Paragraph({
            children: [new TextRun('BÊN B: CÔNG TY CỔ PHẦN GIẢI PHÁP SỐ ĐÔNG ĐÔ')],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Đại diện: Bà Nguyễn Minh Trang   Chức vụ: Phó Giám đốc (Theo giấy ủy quyền số 12/GUQ-ĐĐ ngày 2 tháng 1 năm 2026)'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun('Địa chỉ: Tầng 12, Tòa nhà Peakview, phố Hoàng Cầu, Hà Nội   MST:: 0108899112'),
            ],
          }),
          new Paragraph({ children: [new TextRun('(Sau đây gọi tắt là "Bên B")')] }),
          new Paragraph({
            children: [
              new TextRun(
                'Hai bên thống nhất ký kết "Hợp đồng" với các điều khoản cụ thể sau đây:'
              ),
            ],
          }),
          new Paragraph({
            children: [new TextRun('Điều 1. Phạm vi cung cấp và giá trị hợp đồng')],
          }),
          new Paragraph({
            children: [
              new TextRun(
                '1.1 Đối tượng hợp đồng: Bên B cung cấp trọn gói thiết bị máy chủ và bản quyền tường lửa theo Phụ lục 01 đính kèm.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                '1.2 Giá trị hợp đồng: Tổng giá trị thanh toán là 638.000.000 đồng (Đã bao gồm thuế GTGT).'
              ),
            ],
          }),
          new Paragraph({ children: [new TextRun('Điều 2. Điều khoản chung')] }),
          new Paragraph({
            children: [
              new TextRun(
                'Hợp đồng này được lập thành 04 bản có giá trị pháp lý như nhau, mỗi bên giữ 02 bản và có hiệu lực kể từ ngày ký.'
              ),
            ],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun('ĐẠI DIỆN BÊN A')] }),
                      new Paragraph({ children: [new TextRun('(Ký, đóng dấu, ghi rõ họ tên)')] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [new TextRun('Trần Quốc Sơn')] }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun('ĐẠI DIỆN BÊN B')] }),
                      new Paragraph({ children: [new TextRun('(Ký, đóng dấu, ghi rõ họ tên)')] }),
                      new Paragraph({ children: [] }),
                      new Paragraph({ children: [new TextRun('Nguyễn Minh Trang')] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun('PHỤ LỤC 01: BẢNG GIÁ CHI TIẾT THIẾT BỊ')] }),
          new Paragraph({
            children: [
              new TextRun('(Kèm theo Hợp đồng số 05/2026/HĐKT-VTS ngày 05 tháng 01 năm 2026)'),
            ],
          }),
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: sampleRows.map(
              (r) =>
                new TableRow({
                  children: r.map(
                    (c) =>
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun(c)] })],
                      })
                  ),
                })
            ),
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return new File([blob], 'Hop_Dong_Mau_Chua_Chuan_Hoa.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}
