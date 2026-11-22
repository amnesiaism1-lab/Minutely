import React, { useState, useEffect, useRef } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { Decree30View } from './Decree30View';
import { ModernView } from './ModernView';
import { ExtractModal } from './ExtractModal';
import { VersionDiffModal } from './VersionDiffModal';
import { exportActionItemsToDocx, exportMeetingToDocx } from '../../utils/docxExport';
import { exportMeetingToPdf } from '../../utils/pdfExport';
import { verifyMeetingIntegrity } from '../../utils/hash';
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
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  X,
  Archive,
  ShieldCheck,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MinutesPreview: React.FC = () => {
  const {
    currentMeeting,
    setCurrentMeetingId,
    previewMode,
    setPreviewMode,
    currentUser,
    approveMeeting,
    rejectMeeting,
    publishMeeting,
    archiveMeeting,
    createRevision,
    setActiveTab,
    meetings,
  } = useMeetingContext();

  const { toast } = useToast();

  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionError, setRevisionError] = useState('');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedSigType, setSelectedSigType] = useState<
    'digital_cert' | 'electronic_confirm' | 'wet_scan'
  >('electronic_confirm');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [pageZoom, setPageZoom] = useState<90 | 100 | 110>(100);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRejectModalOpen) setIsRejectModalOpen(false);
        if (isRevisionModalOpen) setIsRevisionModalOpen(false);
        if (isApproveModalOpen) setIsApproveModalOpen(false);
        if (isMoreMenuOpen) setIsMoreMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRejectModalOpen, isRevisionModalOpen, isApproveModalOpen, isMoreMenuOpen]);

  if (!currentMeeting) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-12 text-center text-slate-500">
        <p className="text-sm font-semibold text-slate-800">Chưa chọn biên bản nào</p>
        <p className="text-xs text-slate-500">
          Vui lòng chọn một hồ sơ biên bản từ Kho biên bản để xem trước và xuất bản.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('meetings')}
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          Mở Kho biên bản
        </button>
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
    const prevZoom = pageZoom;
    try {
      setIsExportingPdf(true);
      if (prevZoom !== 100) {
        setPageZoom(100);
        await new Promise((r) => setTimeout(r, 60));
      }
      await exportMeetingToPdf(currentMeeting, 'minutes-print-container');
      toast.success('Đã xuất file PDF chuẩn A4', `Bien-Ban-${currentMeeting.code}.pdf`);
    } catch (err) {
      console.error('Lỗi khi xuất PDF:', err);
      toast.error(
        'Không thể tạo file PDF trực tiếp',
        'Bạn có thể bấm nút "In" và chọn "Lưu dưới dạng PDF".'
      );
    } finally {
      setIsExportingPdf(false);
      if (prevZoom !== 100) setPageZoom(prevZoom);
    }
  };

  const handleCopyLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'preview');
      url.searchParams.set('id', currentMeeting.id);
      navigator.clipboard.writeText(url.toString());
      setIsCopiedLink(true);
      toast.success('Đã sao chép đường dẫn biên bản');
      setTimeout(() => setIsCopiedLink(false), 2000);
    } catch (err) {
      console.warn('Lỗi copy link:', err);
      toast.error('Không thể sao chép liên kết');
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
      toast.success('Đã xuất file Microsoft Word (.docx)');
    } catch (err) {
      console.error('Lỗi khi xuất file docx:', err);
      toast.error('Đã xảy ra lỗi khi tạo file Word (.docx)');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleApproveConfirm = () => {
    approveMeeting(currentMeeting.id, currentUser.name, selectedSigType);
    setIsApproveModalOpen(false);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nêu rõ lý do trả lại biên bản cho Thư ký!');
      return;
    }
    rejectMeeting(currentMeeting.id, rejectReason.trim());
    setRejectReason('');
    setRejectError('');
    setIsRejectModalOpen(false);
  };

  const handleConfirmRevision = () => {
    if (!revisionReason.trim()) {
      setRevisionError('Vui lòng nhập lý do tạo phiên bản sửa đổi!');
      return;
    }
    createRevision(currentMeeting.id, revisionReason.trim());
    setRevisionReason('');
    setRevisionError('');
    setIsRevisionModalOpen(false);
  };

  const isLocked =
    currentMeeting.status === 'approved' ||
    currentMeeting.status === 'published' ||
    currentMeeting.status === 'archived';

  const integrity = verifyMeetingIntegrity(currentMeeting);
  const currentMeetingActions = currentMeeting.agendaItems.flatMap((i) =>
    i.actionItems.map((a) => ({ ...a, meetingCode: currentMeeting.code }))
  );

  const handleExportMeetingActionsDocx = async () => {
    if (currentMeetingActions.length === 0) {
      toast.warning('Biên bản hiện tại chưa có nhiệm vụ phân công nào');
      return;
    }
    try {
      const blob = await exportActionItemsToDocx({
        actions: currentMeetingActions,
        filterLabel: `Biên bản ${currentMeeting.code} — ${currentMeeting.title}`,
        orgName: currentMeeting.organization.name || 'ĐƠN VỊ CHỦ TRÌ',
        exportedBy: currentUser.name,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phan-Cong-Nhiem-Vu-${currentMeeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất Bảng phân công nhiệm vụ (.docx)');
    } catch (err) {
      console.error('Lỗi xuất bảng việc:', err);
      toast.error('Không thể tạo file Word phân công nhiệm vụ');
    }
  };

  const lifecycleSteps = [
    { key: 'draft', label: '1. Soạn thảo', done: true },
    {
      key: 'pending_review',
      label: '2. Trình duyệt',
      done: currentMeeting.status !== 'draft',
    },
    {
      key: 'approved',
      label: '3. Ký khóa SHA-256',
      done:
        currentMeeting.status === 'approved' ||
        currentMeeting.status === 'published' ||
        currentMeeting.status === 'archived',
    },
    {
      key: 'published',
      label: '4. Phát hành',
      done: currentMeeting.status === 'published' || currentMeeting.status === 'archived',
    },
    {
      key: 'archived',
      label: '5. Lưu trữ',
      done: currentMeeting.status === 'archived',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      {/* Legal Lifecycle Stepper + Rejection Alert */}
      <div className="no-print flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-[var(--surface-panel)] px-4 py-3 shadow-2xs lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Vòng đời pháp lý:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {lifecycleSteps.map((step, i) => {
              const isCurrent = currentMeeting.status === step.key;
              return (
                <React.Fragment key={step.key}>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      isCurrent
                        ? 'border-[#1d4ed8] bg-[#1d4ed8] text-white shadow-2xs'
                        : step.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {step.done && !isCurrent && <Check className="h-3 w-3 text-emerald-600" />}
                    <span>{step.label}</span>
                  </span>
                  {i < lifecycleSteps.length - 1 && (
                    <span className="text-slate-300" aria-hidden>
                      ›
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Quick Meeting Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="preview-meeting-select" className="text-[11px] font-medium text-slate-500">
            Hồ sơ:
          </label>
          <select
            id="preview-meeting-select"
            value={currentMeeting.id}
            onChange={(e) => setCurrentMeetingId(e.target.value)}
            className="max-w-[260px] cursor-pointer truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.code}] {m.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rejection Notice */}
      {currentMeeting.rejectionReason && (
        <div className="no-print flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Biên bản vừa được Chủ tọa trả lại để chỉnh sửa:</span>{' '}
            <span>{currentMeeting.rejectionReason}</span>
          </div>
        </div>
      )}

      {/* Sticky Action Toolbar (Hidden in print) */}
      <div className="no-print sticky top-3 z-20 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-[var(--surface-panel)]/92 p-3 shadow-sm backdrop-blur-md md:flex-row">
        {/* Left: Mode Switcher & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex select-none items-center rounded-xl border border-slate-200 bg-[var(--surface-well)] p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('decree30')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                previewMode === 'decree30'
                  ? 'bg-white font-semibold text-[#0b3d91] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Nghị định 30</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('modern')}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                previewMode === 'modern'
                  ? 'bg-white font-semibold text-[#0b3d91] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Hiện đại</span>
            </button>
          </div>

          {/* Reading Zoom Controls (Desktop) */}
          <div className="hidden items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:flex">
            <button
              type="button"
              onClick={() => setPageZoom((z) => (z === 110 ? 100 : 90))}
              disabled={pageZoom === 90}
              className="cursor-pointer rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-35"
              title="Thu nhỏ trang xem"
              aria-label="Thu nhỏ"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[10px] font-semibold tabular-nums text-slate-700">
              {pageZoom}%
            </span>
            <button
              type="button"
              onClick={() => setPageZoom((z) => (z === 90 ? 100 : 110))}
              disabled={pageZoom === 110}
              className="cursor-pointer rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-35"
              title="Phóng to trang xem"
              aria-label="Phóng to"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Lock & Cryptographic Integrity badge */}
          <div className="hidden items-center gap-1.5 border-l border-slate-200 pl-2 sm:flex">
            {isLocked ? (
              integrity.isValid ? (
                <span
                  className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                  title={
                    currentMeeting.contentHash
                      ? `Niêm phong toàn vẹn SHA-256 hợp lệ: ${currentMeeting.contentHash}`
                      : 'Biên bản đã khóa chỉnh sửa'
                  }
                >
                  <Lock className="h-3 w-3 text-emerald-600" />
                  <span>Khóa SHA-256 (v{currentMeeting.version})</span>
                </span>
              ) : (
                <span
                  className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800"
                  title="Phát hiện dữ liệu nội dung khác với mã băm SHA-256 lúc ký duyệt!"
                >
                  <AlertTriangle className="h-3 w-3 text-rose-600" />
                  <span>Sai lệch băm SHA-256!</span>
                </span>
              )
            ) : (
              <span className="rounded-full border border-slate-200/70 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {currentMeeting.status === 'pending_review' ? 'Chờ duyệt' : 'Bản nháp'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Focused Export & Workflow Actions + Overflow Utilities */}
        <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
          {currentUser.role === 'member' && (
            <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
              Chế độ xem
            </span>
          )}

          {!isLocked && currentUser.role !== 'member' && (
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-[#0b3d91] shadow-2xs transition-colors hover:bg-blue-100"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Ghi chép tiếp</span>
            </button>
          )}

          {currentMeeting.status === 'pending_review' && currentUser.role === 'chairperson' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setRejectError('');
                  setIsRejectModalOpen(true);
                }}
                className="press-subtle flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Trả lại</span>
              </button>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(true)}
                className="press-subtle flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-500"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Ký duyệt & Khóa</span>
              </button>
            </>
          )}

          {currentMeeting.status === 'approved' &&
            (currentUser.role === 'chairperson' || currentUser.role === 'admin') && (
              <button
                type="button"
                onClick={() => publishMeeting(currentMeeting.id)}
                className="press-subtle flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Phát hành</span>
              </button>
            )}

          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300/85 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-60"
            title="Tải về file Microsoft Word (.docx)"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" />
            <span>{isExportingDocx ? 'Đang tạo Word…' : 'Word'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-2xs transition-colors hover:bg-[#1e40af] disabled:opacity-60"
            title="Tải về file PDF khổ A4 hoàn chỉnh"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>{isExportingPdf ? 'Đang tạo PDF…' : 'Xuất PDF'}</span>
          </button>

          {/* Overflow Utilities Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              aria-expanded={isMoreMenuOpen}
              className="press-subtle flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
              title="In, Chia sẻ link, Trích lục, So sánh phiên bản & Lưu trữ"
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tiện ích</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isMoreMenuOpen && (
              <div className="animate-in zoom-in-95 absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    handlePrint();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>In trực tiếp (Ctrl+P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyLink();
                    setIsMoreMenuOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                >
                  {isCopiedLink ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
                  )}
                  <span>{isCopiedLink ? 'Đã sao chép đường dẫn' : 'Sao chép liên kết'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsExtractModalOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                >
                  <FileSearch className="h-3.5 w-3.5 text-slate-500" />
                  <span>Trích lục biên bản (Điều 150)</span>
                </button>
                {currentMeetingActions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      handleExportMeetingActionsDocx();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>Xuất bảng phân công việc (.docx)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsDiffModalOpen(true);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                >
                  <GitCompare className="h-3.5 w-3.5 text-slate-500" />
                  <span>So sánh phiên bản</span>
                </button>

                {isLocked && (currentUser.role === 'chairperson' || currentUser.role === 'admin') && (
                  <>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        setRevisionError('');
                        setIsRevisionModalOpen(true);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Tạo bản sửa đổi</span>
                    </button>
                  </>
                )}

                {currentMeeting.status === 'published' &&
                  (currentUser.role === 'chairperson' || currentUser.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        archiveMeeting(currentMeeting.id);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-slate-700 hover:bg-slate-100"
                    >
                      <Archive className="h-3.5 w-3.5 text-slate-500" />
                      <span>Đưa vào Lưu trữ hồ sơ</span>
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render Document with safe reading scale */}
      <div className="overflow-x-auto pb-8 print:overflow-visible print:pb-0">
        <div
          className="origin-top transition-transform duration-200 print:!transform-none"
          style={{
            transform: pageZoom === 100 || isExportingPdf ? undefined : `scale(${pageZoom / 100})`,
          }}
        >
          <div id="minutes-print-container">
            {previewMode === 'decree30' ? (
              <Decree30View meeting={currentMeeting} />
            ) : (
              <ModernView meeting={currentMeeting} />
            )}
          </div>
        </div>
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
        <div
          className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setIsRejectModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-modal-enter w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-rose-700">
                Trả lại biên bản cho Thư ký
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc bổ sung trước khi phê duyệt.
            </p>
            <div className="space-y-1.5">
              <textarea
                value={rejectReason}
                autoFocus
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError('');
                }}
                rows={4}
                placeholder="Ví dụ: Cần điều chỉnh lại phần trăm biểu quyết ở Mục 2 và bổ sung sản phẩm đầu ra cho nhiệm vụ #3..."
                className={`w-full rounded-xl border p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  rejectError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {rejectError && <p className="text-[11px] font-medium text-rose-600">{rejectError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="press-subtle cursor-pointer rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-500"
              >
                Xác nhận trả lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Approval & Liability Confirmation Modal */}
      {isApproveModalOpen && (
        <div
          className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setIsApproveModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-modal-enter w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-semibold text-slate-900">
                  Xác nhận Ký duyệt & Khóa biên bản
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-950">
              <p className="font-semibold">Lưu ý trách nhiệm pháp lý (Điều 150 & 158 Luật DN 2020):</p>
              <p className="mt-1">
                Chủ tọa và Thư ký liên đới chịu trách nhiệm về tính trung thực, chính xác của nội
                dung biên bản. Sau khi ký duyệt, hệ thống sẽ tạo mã băm SHA-256 và khóa cứng mọi
                chỉnh sửa trực tiếp.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Chọn hình thức ký xác nhận:
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  {
                    id: 'electronic_confirm' as const,
                    label: 'Xác nhận điện tử nội bộ (Electronic Confirmation)',
                    desc: 'Lưu vết định danh Chủ tọa & mã kiểm toàn vẹn SHA-256',
                  },
                  {
                    id: 'digital_cert' as const,
                    label: 'Chữ ký số Doanh nghiệp (USB Token / HSM)',
                    desc: 'Ghi nhận dấu ký số chuyên dùng theo Nghị định 30/2020/NĐ-CP',
                  },
                  {
                    id: 'wet_scan' as const,
                    label: 'Đối chiếu bản quét chữ ký tươi (Wet Signature Scan)',
                    desc: 'Xác nhận đã đối chiếu bản giấy có chữ ký tay & dấu đỏ',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedSigType(opt.id)}
                    className={`w-full cursor-pointer rounded-xl border p-2.5 text-left transition-colors ${
                      selectedSigType === opt.id
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-semibold">{opt.label}</p>
                    <p className="mt-0.5 text-[11px] opacity-80">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Xác nhận Ký & Khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Revision Modal */}
      {isRevisionModalOpen && (
        <div
          className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setIsRevisionModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="animate-modal-enter w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Tạo phiên bản sửa đổi mới</h3>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Biên bản hiện tại đã duyệt và khóa. Hệ thống sẽ tạo phiên bản mới (v
              {parseInt(currentMeeting.version, 10) + 1}.0) và lưu vết lý do sửa đổi theo Luật Doanh
              nghiệp 2020.
            </p>
            <div className="space-y-1.5">
              <textarea
                value={revisionReason}
                autoFocus
                onChange={(e) => {
                  setRevisionReason(e.target.value);
                  if (revisionError) setRevisionError('');
                }}
                rows={4}
                placeholder="Nhập lý do tạo bản sửa đổi..."
                className={`w-full rounded-xl border p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
                  revisionError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {revisionError && (
                <p className="text-[11px] font-medium text-rose-600">{revisionError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="press-subtle cursor-pointer rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
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
