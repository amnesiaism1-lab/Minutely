import React, { useState, useEffect } from 'react';
import { Meeting } from '../../types';
import { generateContentHash } from '../../utils/hash';
import { useToast } from '../../context/ToastContext';
import { FileSearch, X, Download, Copy, Check } from 'lucide-react';

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
  const { toast } = useToast();
  const [selectedAgendaIds, setSelectedAgendaIds] = useState<string[]>(
    meeting.agendaItems.map((i) => i.id)
  );
  const [extractedReason, setExtractedReason] = useState(
    'Phục vụ cung cấp tài liệu cho cổ đông / đối tác'
  );
  const [copied, setCopied] = useState(false);

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
  const extractHash = generateContentHash(
    `${meeting.id}-${selectedAgendaIds.join(',')}-${timestamp}`
  );

  const filteredItems = meeting.agendaItems.filter((i) => selectedAgendaIds.includes(i.id));

  const generateExtractText = () => {
    return `=====================================================
BẢN TRÍCH LỤC BIÊN BẢN CUỘC HỌP
Căn cứ Điều 150 Luật Doanh nghiệp 2020 & Nghị định 30/2020/NĐ-CP
=====================================================
• Biên bản gốc: ${meeting.title}
• Mã số biên bản: ${meeting.code}
• Ngày họp: ${meeting.date} (${meeting.startTime} - ${meeting.endTime})
• Đơn vị: ${meeting.organization.name}
• Người yêu cầu trích lục: ${userName}
• Lý do trích lục: ${extractedReason}
• Thời điểm trích lục: ${timestamp}
• Mã xác thực tính toàn vẹn (SHA-256): ${extractHash}

NỘI DUNG ĐƯỢC TRÍCH LỤC:
-----------------------------------------------------
${filteredItems
  .map(
    (item, idx) => `Mục #${idx + 1}: ${item.title}
- Quyết nghị: ${item.decision?.content || 'Chưa có'}
- Trạng thái: ${item.decision?.status === 'agreed' ? 'Đã thông qua' : 'Bác bỏ'}
${
  item.decision?.vote
    ? `- Biểu quyết: ${item.decision.vote.inFavor} tán thành (${item.decision.vote.ratioPassed}%)`
    : ''
}`
  )
  .join('\n\n')}

XÁC THỰC BẢN TRÍCH LỤC ĐIỆN TỬ
Trích xuất tự động từ hệ thống Minutely. Mọi sửa đổi văn bản này đều làm mất hiệu lực của mã kiểm tra ${extractHash}.
=====================================================`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateExtractText());
    setCopied(true);
    toast.success('Đã sao chép nội dung bản trích lục');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900">Trích lục biên bản cuộc họp</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Lý do trích lục</label>
          <input
            type="text"
            value={extractedReason}
            onChange={(e) => setExtractedReason(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-700">
              Chọn các nội dung nghị sự cần trích lục:
            </label>
            <button
              type="button"
              onClick={() =>
                setSelectedAgendaIds(allSelected ? [] : meeting.agendaItems.map((i) => i.id))
              }
              className="cursor-pointer text-[11px] font-semibold text-slate-600 hover:text-slate-900"
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50 p-2.5">
            {meeting.agendaItems.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 hover:text-slate-900"
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
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span className="truncate">{item.title}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-700">Bản xem trước trích lục:</label>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700">
            {generateExtractText()}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="font-mono text-[10px] text-slate-500">Mã hash: {extractHash}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
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
              onClick={handleDownload}
              className="press-subtle flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải file trích lục (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
