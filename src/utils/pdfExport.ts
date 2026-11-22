import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Meeting } from '../types';

/**
 * Scans upward from `idealEndY` on the rendered canvas to find a clean inter-line gap
 * (even inside bordered tables or light-tinted callout boxes) so page breaks never
 * slice horizontally through Vietnamese characters, diacritics, or signatures.
 */
function findSmartPageBreakY(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  startY: number,
  idealEndY: number
): number {
  if (idealEndY >= canvasHeight) return canvasHeight;

  const searchWindow = Math.min(180, Math.floor((idealEndY - startY) * 0.28));
  if (searchWindow < 16) return idealEndY;

  const scanTop = Math.max(startY + 40, idealEndY - searchWindow);
  const scanHeight = idealEndY - scanTop;
  if (scanHeight <= 4) return idealEndY;

  try {
    const imgData = ctx.getImageData(0, scanTop, canvasWidth, scanHeight).data;
    // Allow up to ~0.9% dark pixels per row so thin vertical table borders (5–6px) don't block a clean text gap
    const maxAllowedDarkPixels = Math.max(8, Math.floor(canvasWidth * 0.009));

    const isRowGap = new Uint8Array(scanHeight);
    for (let row = 0; row < scanHeight; row++) {
      let darkPixels = 0;
      const rowOffset = row * canvasWidth * 4;
      for (let x = 12; x < canvasWidth - 12; x++) {
        const idx = rowOffset + x * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        // Luminance < 195 indicates text ink or horizontal rule
        if (r * 0.299 + g * 0.587 + b * 0.114 < 195) {
          darkPixels++;
          if (darkPixels > maxAllowedDarkPixels) break;
        }
      }
      if (darkPixels <= maxAllowedDarkPixels) {
        isRowGap[row] = 1;
      }
    }

    // Search bottom-up for at least 4 consecutive gap rows (middle of inter-line whitespace)
    for (let row = scanHeight - 2; row >= 3; row--) {
      if (isRowGap[row] && isRowGap[row - 1] && isRowGap[row - 2] && isRowGap[row - 3]) {
        return scanTop + row - 1;
      }
    }
  } catch {
    // Fallback to idealEndY if canvas read is restricted
  }

  return idealEndY;
}

/**
 * Xuất biên bản cuộc họp ra file PDF (.pdf) chuẩn khổ A4 (210mm x 297mm)
 * Tự động dò khoảng trắng giữa các dòng để ngắt trang sạch sẽ, giữ lề an toàn
 * cho các trang tiếp theo và đánh số trang khi biên bản dài nhiều trang.
 */
export async function exportMeetingToPdf(
  meeting: Meeting,
  elementId: string = 'minutes-print-container'
): Promise<boolean> {
  const container = document.getElementById(elementId);
  const targetElement =
    (container?.querySelector('.a4-page') as HTMLElement | null) ||
    container ||
    (document.querySelector('.a4-page') as HTMLElement | null);

  if (!targetElement) {
    throw new Error('Không tìm thấy vùng văn bản để xuất PDF. Vui lòng mở trang Xem trước.');
  }

  const canvas = await html2canvas(targetElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const clonedPage = clonedDoc.querySelector('.a4-page') as HTMLElement | null;
      if (clonedPage) {
        clonedPage.style.boxShadow = 'none';
        clonedPage.style.border = 'none';
      }
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const pxPerMm = canvas.width / pageWidthMm;
  const totalHeightMm = canvas.height / pxPerMm;

  // Single-page fast path
  if (totalHeightMm <= pageHeightMm + 1.5) {
    const imgData = canvas.toDataURL('image/jpeg', 0.97);
    const renderHeightMm = Math.min(totalHeightMm, pageHeightMm);
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidthMm, renderHeightMm, undefined, 'FAST');
    const safeFilename = `Bien-Ban-${meeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    pdf.save(safeFilename);
    return true;
  }

  // Multi-page smart whitespace-aware slicing
  const ctx = canvas.getContext('2d');
  const slices: { startY: number; endY: number; topMarginMm: number }[] = [];

  let cursorY = 0;
  let pageIndex = 0;

  while (cursorY < canvas.height - 8) {
    // Page 1 already includes top padding from .a4-page; continuation pages get 14mm top & 14mm bottom margin
    const topMarginMm = pageIndex === 0 ? 0 : 14;
    const bottomMarginMm = 14;
    const usableHeightMm = pageHeightMm - topMarginMm - bottomMarginMm;
    const idealEndY = Math.min(canvas.height, cursorY + Math.floor(usableHeightMm * pxPerMm));

    const breakY =
      ctx && idealEndY < canvas.height
        ? findSmartPageBreakY(ctx, canvas.width, canvas.height, cursorY, idealEndY)
        : idealEndY;

    const safeEndY = breakY > cursorY + 40 ? breakY : idealEndY;
    slices.push({ startY: cursorY, endY: safeEndY, topMarginMm });
    cursorY = safeEndY;
    pageIndex++;
  }

  const sliceCanvas = document.createElement('canvas');
  sliceCanvas.width = canvas.width;
  const sliceCtx = sliceCanvas.getContext('2d');

  slices.forEach((slice, idx) => {
    if (idx > 0) pdf.addPage();
    const sliceHeightPx = slice.endY - slice.startY;
    sliceCanvas.height = sliceHeightPx;

    if (sliceCtx) {
      sliceCtx.fillStyle = '#ffffff';
      sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceHeightPx);
      sliceCtx.drawImage(
        canvas,
        0,
        slice.startY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );
    }

    const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.97);
    const sliceHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(
      sliceImg,
      'JPEG',
      0,
      slice.topMarginMm,
      pageWidthMm,
      sliceHeightMm,
      undefined,
      'FAST'
    );

    // Subtle page numbering at bottom-right (ASCII-safe in standard PDF Helvetica)
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(110, 120, 135);
    pdf.text(`${idx + 1} / ${slices.length}`, pageWidthMm - 15, pageHeightMm - 6, {
      align: 'right',
    });
  });

  const safeFilename = `Bien-Ban-${meeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
  pdf.save(safeFilename);
  return true;
}
