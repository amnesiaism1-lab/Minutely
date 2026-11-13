import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { Decree30View } from './Decree30View';
import { ModernView } from './ModernView';
import { ExtractModal } from './ExtractModal';
import { VersionDiffModal } from './VersionDiffModal';
import { exportMeetingToDocx } from '../../utils/docxExport';
import { exportMeetingToPdf } from '../../utils/pdfExport';
import {
  Printer,
  Download,
  FileCheck2,
  Sparkles,
  GitCompare,
  FileSearch,
  CheckCircle,
  XCircle,
  Send,
  Lock,
  Edit,
  RotateCcw,
  Link as LinkIcon,
  Check,
  FileDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MinutesPreview: React.FC = () => {
  const {
    currentMeeting,
    previewMode,
    setPreviewMode,
    currentUser,
    approveMeeting,
    rejectMeeting,
    publishMeeting,
    createRevision,
    setActiveTab,
    meetings,
  } = useMeetingContext();

  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  if (!currentMeeting) {
    return (
      <div className="p-12 text-center text-slate-500">
        Chưa chọn biên bản nào. Vui lòng quay lại danh sách cuộc họp.
      </div>
    );
  }

  const previousMeeting = currentMeeting.previousVersionId
    ? meetings.find((m) => m.id === currentMeeting.previousVersionId) || null
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportMeetingToPdf(currentMeeting, previewMode);
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
      alert('Đã xảy ra lỗi khi tạo file PDF. Bạn có thể sử dụng nút In để lưu dưới dạng PDF qua trình duyệt.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'preview');
      url.searchParams.set('id', currentMeeting.id);
      navigator.clipboard.writeText(url.toString());
      setIsCopiedLink(true);
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Lỗi copy link:', err);
    }
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const blob = await exportMeetingToDocx(currentMeeting, previewMode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bien-Ban-${currentMeeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất file docx:', err);
      alert('Đã xảy ra lỗi khi tạo file Word (.docx).');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleApprove = () => {
    approveMeeting(currentMeeting.id, currentUser.name);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do trả lại biên bản!');
      return;
    }
    rejectMeeting(currentMeeting.id, rejectReason.trim());
    setIsRejectModalOpen(false);
  };

  const handleConfirmRevision = () => {
    if (!revisionReason.trim()) {
      alert('Vui lòng nhập lý do tạo phiên bản sửa đổi!');
      return;
    }
    createRevision(currentMeeting.id, revisionReason.trim());
    setIsRevisionModalOpen(false);
  };

  const isLocked = currentMeeting.status === 'approved' || currentMeeting.status === 'published';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Action Toolbar (Hidden in print) */}
      <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center select-none">
            <button
              onClick={() => setPreviewMode('decree30')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                previewMode === 'decree30'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Nghị định 30</span>
            </button>
            <button
              onClick={() => setPreviewMode('modern')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                previewMode === 'modern'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hiện đại</span>
            </button>
          </div>

          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
            {isLocked ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã khóa nội dung (v{currentMeeting.version})</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                Trạng thái: {currentMeeting.status === 'pending_review' ? 'Chờ duyệt' : 'Bản nháp'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Export & Workflow Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          {/* Real PDF Export (P0-7) */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Tải về file PDF khổ A4 hoàn chỉnh"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Đang tạo PDF...' : 'Xuất PDF (.pdf)'}</span>
          </button>

          {/* Export Word (.docx) */}
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="Tải về file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExportingDocx ? 'Đang tạo Word...' : 'Xuất Word (.docx)'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="In ấn qua máy in hoặc hộp thoại trình duyệt"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="Sao chép đường dẫn trực tiếp tới biên bản này"
          >
            {isCopiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Đã chép link</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép link</span>
              </>
            )}
          </button>

          {/* Excerpt extraction */}
          <button
            onClick={() => setIsExtractModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="Trích lục có kiểm soát theo Điều 150 Luật Doanh nghiệp"
          >
            <FileSearch className="w-3.5 h-3.5 text-slate-500" />
            <span>Trích lục</span>
          </button>

          {/* Version Diff */}
          <button
            onClick={() => setIsDiffModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            title="So sánh phiên bản"
          >
            <GitCompare className="w-3.5 h-3.5 text-slate-500" />
            <span>So sánh</span>
          </button>

          {/* Member Read-Only Notice */}
          {currentUser.role === 'member' && (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Chế độ xem (Thành viên)
            </span>
          )}

          {/* Approval Controls */}
          {currentMeeting.status === 'pending_review' && currentUser.role === 'chairperson' && (
            <>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Trả lại</span>
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ký duyệt & Khóa</span>
              </button>
            </>
          )}

          {/* Publish Button */}
          {currentMeeting.status === 'approved' && (currentUser.role === 'chairperson' || currentUser.role === 'admin') && (
            <button
              onClick={() => publishMeeting(currentMeeting.id)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Phát hành chính thức</span>
            </button>
          )}

          {/* New Revision Button if locked */}
          {isLocked && (currentUser.role === 'chairperson' || currentUser.role === 'admin') && (
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Tạo phiên bản sửa đổi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo bản sửa đổi</span>
            </button>
          )}

          {/* Return to live mode */}
          {!isLocked && currentUser.role !== 'member' && (
            <button
              onClick={() => setActiveTab('live')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs cursor-pointer transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Tiếp tục chỉnh sửa</span>
            </button>
          )}
        </div>
      </div>

      {/* Render Document */}
      <div className="print:m-0">
        {previewMode === 'decree30' ? (
          <Decree30View meeting={currentMeeting} />
        ) : (
          <ModernView meeting={currentMeeting} />
        )}
      </div>

      {/* Excerpt Modal */}
      {isExtractModalOpen && (
        <ExtractModal
          isOpen={isExtractModalOpen}
          onClose={() => setIsExtractModalOpen(false)}
          meeting={currentMeeting}
          userName={currentUser.name}
        />
      )}

      {/* Version Diff Modal */}
      {isDiffModalOpen && (
        <VersionDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          currentMeeting={currentMeeting}
          previousMeeting={previousMeeting}
        />
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95">
            <h3 className="font-semibold text-base text-rose-700">Trả lại biên bản cho Thư ký</h3>
            <p className="text-xs text-slate-600">
              Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc bổ sung trước khi phê duyệt.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Cần điều chỉnh lại phần trăm biểu quyết ở Mục 2 và bổ sung sản phẩm đầu ra cho Action #3..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Xác nhận trả lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95">
            <h3 className="font-semibold text-base text-slate-900">Tạo phiên bản sửa đổi mới</h3>
            <p className="text-xs text-slate-600">
              Biên bản hiện tại đã duyệt và khóa. Hệ thống sẽ tạo phiên bản mới (v
              {parseInt(currentMeeting.version) + 1}.0) và lưu vết lý do sửa đổi theo Luật Doanh nghiệp 2020.
            </p>
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do tạo bản sửa đổi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Tạo phiên bản mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
