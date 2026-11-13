import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { Decree30View } from './Decree30View';
import { ModernView } from './ModernView';
import { ExtractModal } from './ExtractModal';
import { VersionDiffModal } from './VersionDiffModal';
import { exportMeetingToDocx } from '../../utils/docxExport';
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
      particleCount: 120,
      spread: 80,
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Action Toolbar (Hidden in print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setPreviewMode('decree30')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewMode === 'decree30'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Nghị định 30</span>
            </button>
            <button
              onClick={() => setPreviewMode('modern')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewMode === 'modern'
                  ? 'bg-white text-indigo-700 shadow-xs'
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
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Đã khóa nội dung (v{currentMeeting.version})</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Trạng thái: {currentMeeting.status === 'pending_review' ? 'Chờ duyệt' : 'Bản nháp'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Export & Workflow Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="In ấn trực tiếp hoặc lưu PDF định dạng A4 chuẩn Nghị định 30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / PDF A4</span>
          </button>

          {/* Export Word (.docx) */}
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
            title="Tải về file Microsoft Word (.docx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingDocx ? 'Đang tạo DOCX...' : 'Xuất Word (.docx)'}</span>
          </button>

          {/* Excerpt extraction */}
          <button
            onClick={() => setIsExtractModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="Trích lục có kiểm soát theo Điều 150 Luật Doanh nghiệp"
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Trích lục</span>
          </button>

          {/* Version Diff */}
          <button
            onClick={() => setIsDiffModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            title="So sánh phiên bản"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>So sánh</span>
          </button>

          {/* Approval Controls */}
          {currentMeeting.status === 'pending_review' && currentUser.role === 'chairperson' && (
            <>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Trả lại</span>
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ký duyệt & Khóa</span>
              </button>
            </>
          )}

          {/* Publish Button */}
          {currentMeeting.status === 'approved' && (
            <button
              onClick={() => publishMeeting(currentMeeting.id)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Phát hành chính thức</span>
            </button>
          )}

          {/* New Revision Button if locked */}
          {isLocked && (
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              title="Tạo phiên bản sửa đổi (V2.0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo bản sửa đổi</span>
            </button>
          )}

          {/* Return to live mode */}
          {!isLocked && (
            <button
              onClick={() => setActiveTab('live')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Sửa tiếp</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white space-y-4">
            <h3 className="font-bold text-base text-rose-400">Trả Lại Biên Bản Cho Thư Ký</h3>
            <p className="text-xs text-slate-300">
              Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc bổ sung trước khi phê duyệt.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Cần điều chỉnh lại phần trăm biểu quyết ở Mục 2 và bổ sung sản phẩm đầu ra cho Action #3..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Xác nhận trả lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Revision Modal */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white space-y-4">
            <h3 className="font-bold text-base text-indigo-400">Tạo Phiên Bản Sửa Đổi Mới</h3>
            <p className="text-xs text-slate-300">
              Biên bản hiện tại đã duyệt và bị khóa. Hệ thống sẽ tạo một phiên bản mới (v
              {parseInt(currentMeeting.version) + 1}.0) và lưu vết lý do sửa đổi theo Luật Doanh nghiệp.
            </p>
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do tạo bản sửa đổi..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
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
