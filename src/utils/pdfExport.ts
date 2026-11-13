import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Meeting } from '../types';

/**
 * Xuất biên bản cuộc họp ra file PDF (.pdf) chuẩn A4
 * Sử dụng html2canvas để render element hiển thị (Decree 30 hoặc Modern) thành canvas chất lượng cao,
 * sau đó phân trang A4 (210mm x 297mm) bằng jsPDF và kích hoạt tải về trực tiếp.
 */
export async function exportMeetingToPdf(
  meeting: Meeting,
  elementId: string = 'minutes-print-container'
): Promise<boolean> {
  const targetElement = document.getElementById(elementId) || document.querySelector('.a4-page') as HTMLElement;
  
  if (!targetElement) {
    console.error('Không tìm thấy vùng văn bản để xuất PDF');
    alert('Không tìm thấy vùng văn bản để xuất PDF. Vui lòng mở trang Xem trước.');
    return false;
  }

  try {
    // Tạm thời đảm bảo element hiển thị rõ nét
    const originalShadow = targetElement.style.boxShadow;
    targetElement.style.boxShadow = 'none';

    const canvas = await html2canvas(targetElement, {
      scale: 2, // Độ phân giải cao cho văn bản sắc nét
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    targetElement.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210; // A4 mm
    const pageHeight = 297; // A4 mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Trang 1
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Các trang tiếp theo nếu văn bản dài
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const safeFilename = `Bien-Ban-${meeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (err) {
    console.error('Lỗi trong quá trình tạo PDF:', err);
    alert('Đã xảy ra lỗi khi tạo file PDF. Vui lòng thử lại.');
    return false;
  }
}
