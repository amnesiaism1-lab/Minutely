import React, { useState, useEffect } from 'react';
import { Meeting } from '../../types';
import { generateContentHash } from '../../utils/hash';
import { exportExtractToDocx } from '../../utils/docxExport';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { FileSearch, X, Download, Copy, Check, FileText } from 'lucide-react';

interface ExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  userName: string;
}

export const ExtractModal: React.FC<ExtractModalProps> = ({
  isOpen,
  onClose,
  meeting,
  userName,
}) => {
  const { recordAuditLog } = useMeetingContext();
  const { toast } = useToast();
  const [selectedAgendaIds, setSelectedAgendaIds] = useState<string[]>(
    meeting.agendaItems.map((i) => i.id)
  );
  const [extractedReason, setExtractedReason] = useState(
    'Phục vụ cung cấp tài liệu pháp lý cho cổ đông / ngân hàng / đối tác'
  );
  const [copied, setCopied] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedAgendaIds(meeting.agendaItems.map((i) => i.id));
  }, [isOpen, meeting.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const timestamp = new Date().toLocaleString('vi-VN');
  const filteredItems = meeting.agendaItems.filter((i) => selectedAgendaIds.includes(i.id));
  const extractHash = generateContentHash(
    `${meeting.id}|${meeting.version}|${selectedAgendaIds.join(',')}|${extractedReason}|${filteredItems
      .map((i) => i.decision?.content || '')
      .join('|')}`
  );

  const formatDecisionStatus = (status?: string) => {
    if (status === 'agreed') return 'Đã thông qua';
    if (status === 'deferred') return 'Tạm hoãn xem xét';
    return 'Không thông qua';
  };

  const generateExtractText = () => {
    return `=====================================================
BẢN TRÍCH LỤC BIÊN BẢN CUỘC HỌP
Căn cứ Điều 150 Luật Doanh nghiệp 2020 & Nghị định 30/2020/NĐ-CP
=====================================================
• Biên bản gốc: ${meeting.title}
• Số trích lục: ${meeting.code}/TL-BB (Gốc: ${meeting.code} • v${meeting.version})
• Ngày họp: ${meeting.date} (${meeting.startTime} - ${meeting.archiveDetails?.adjournedAt || meeting.endTime})
• Pháp nhân ban hành: ${meeting.organization.name}${
      meeting.organization.enterpriseCode ? ` (MSDN: ${meeting.organization.enterpriseCode})` : ''
    }
• Người lập trích lục: ${userName}
• Mục đích trích lục: ${extractedReason}
• Thời điểm trích lục: ${timestamp}
• Mã xác thực tính toàn vẹn (SHA-256): ${extractHash}

NỘI DUNG ĐƯỢC TRÍCH LỤC (${filteredItems.length}/${meeting.agendaItems.length} MỤC):
-----------------------------------------------------
${filteredItems
  .map((item, idx) => {
    const lines = [
      `Mục #${idx + 1} (Mục ${item.order} bản gốc): ${item.title}`,
      `- Quyết nghị: ${item.decision?.content || 'Chưa ghi nhận'}`,
      `- Trạng thái: ${formatDecisionStatus(item.decision?.status)}`,
    ];
    if (item.decision?.status === 'deferred' && item.decision.deferredReason) {
      lines.push(`- Lý do hoãn: ${item.decision.deferredReason}`);
    }
    if (item.decision?.vote) {
      const v = item.decision.vote;
      lines.push(
        `- Biểu quyết: Tán thành ${v.inFavor.toLocaleString('vi-VN')}/${v.totalEligible.toLocaleString(
          'vi-VN'
        )} (${v.ratioPassed}% / ngưỡng ${v.thresholdPercent}%)`
      );
    }
    if (item.actionItems.length > 0) {
      lines.push(
        `- Nhiệm vụ giao thực hiện: ${item.actionItems
          .map((a) => `${a.title} (Chủ trì: ${a.ownerName}, Hạn: ${a.deadline})`)
          .join('; ')}`
      );
    }
    return lines.join('\n');
  })
  .join('\n\n')}

XÁC THỰC BẢN TRÍCH LỤC ĐIỆN TỬ
Sao trích lục trung thực từ Biên bản gốc số ${meeting.code}. Mọi sửa đổi văn bản này làm mất hiệu lực của mã kiểm tra SHA-256: ${extractHash}.
=====================================================`;
  };

  const handleCopy = () => {
    if (filteredItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 01 mục nghị sự để trích lục');
      return;
    }
    navigator.clipboard.writeText(generateExtractText());
    setCopied(true);
    toast.success('Đã sao chép nội dung bản trích lục');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (filteredItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 01 mục nghị sự để trích lục');
      return;
    }
    const text = generateExtractText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Trich-luc-${meeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải về bản trích lục (.txt)');
  };

  const handleDownloadDocx = async () => {
    if (filteredItems.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 01 mục nghị sự để trích lục');
      return;
    }
    try {
      setIsExportingWord(true);
      const blob = await exportExtractToDocx({
        meeting,
        selectedAgendaIds,
        reason: extractedReason.trim() || 'Cung cấp bản trích lục theo yêu cầu công tác',
        actorName: userName,
        extractHash,
        timestamp,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Trich-Luc-Bien-Ban-${meeting.code.replace(/[/\\?%*:|"<>]/g, '-')}.docx`;
      link.click();
      URL.revokeObjectURL(url);

      recordAuditLog(
        meeting.id,
        'Cấp bản Trích lục biên bản (.docx)',
        `Trích lục ${filteredItems.length}/${meeting.agendaItems.length} mục nghị sự • Lý do: ${extractedReason} • Mã SHA-256: ${extractHash.slice(0, 16)}...`
      );
      toast.success('Đã xuất Bản trích lục chuẩn Nghị định 30 (.docx)');
    } catch (err) {
      console.error('Lỗi xuất Word trích lục:', err);
      toast.error('Không thể tạo file Word trích lục');
    } finally {
      setIsExportingWord(false);
    }
  };

  const allSelected = selectedAgendaIds.length === meeting.agendaItems.length;

  return (
    <div
      className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-modal-enter max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#1d4ed8]">
              <FileSearch className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Trích lục biên bản cuộc họp (Điều 150 Luật DN)
              </h3>
              <p className="text-xs text-slate-500">
                Chọn các mục nghị sự được phép cung cấp ra bên ngoài để xuất bản Word chuẩn Nghị định 30
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Mục đích / Lý do cấp trích lục</label>
          <input
            type="text"
            value={extractedReason}
            onChange={(e) => setExtractedReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">
              Chọn các nội dung nghị sự cần trích lục ({selectedAgendaIds.length}/
              {meeting.agendaItems.length}):
            </label>
            <button
              type="button"
              onClick={() =>
                setSelectedAgendaIds(allSelected ? [] : meeting.agendaItems.map((i) => i.id))
              }
              className="cursor-pointer text-xs font-semibold text-[#1d4ed8] hover:text-[#1e40af]"
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50 p-2.5">
            {meeting.agendaItems.map((item, idx) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={selectedAgendaIds.includes(item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAgendaIds([...selectedAgendaIds, item.id]);
                    } else {
                      setSelectedAgendaIds(selectedAgendaIds.filter((id) => id !== item.id));
                    }
                  }}
                  className="rounded border-slate-300 text-[#1d4ed8] focus:ring-0"
                />
                <span className="font-medium text-slate-500 tabular-nums">#{idx + 1}</span>
                <span className="flex-1 truncate font-medium text-slate-900">{item.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Bản xem trước nội dung trích lục:</label>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs leading-relaxed text-slate-700">
            {generateExtractText()}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="text-[11px] text-slate-500 tabular-nums">
            SHA-256: <span className="font-medium text-slate-700">{extractHash.slice(0, 18)}…</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              <span>Tải .txt</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isExportingWord || filteredItems.length === 0}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1d4ed8] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isExportingWord ? 'Đang tạo Word…' : 'Xuất Word Trích lục (.docx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
