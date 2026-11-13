import React, { useState } from 'react';
import { Meeting } from '../../types';
import { generateContentHash } from '../../utils/hash';
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
  if (!isOpen) return null;

  const [selectedAgendaIds, setSelectedAgendaIds] = useState<string[]>(
    meeting.agendaItems.map((i) => i.id)
  );
  const [extractedReason, setExtractedReason] = useState('Phục vụ cung cấp tài liệu cho cổ đông / đối tác');
  const [copied, setCopied] = useState(false);

  const timestamp = new Date().toLocaleString('vi-VN');
  const extractHash = generateContentHash(
    `${meeting.id}-${selectedAgendaIds.join(',')}-${timestamp}`
  );

  const filteredItems = meeting.agendaItems.filter((i) =>
    selectedAgendaIds.includes(i.id)
  );

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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-base text-slate-900">Trích lục biên bản cuộc họp</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label className="text-xs text-slate-700 font-medium">Lý do trích lục</label>
          <input
            type="text"
            value={extractedReason}
            onChange={(e) => setExtractedReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Agenda selection */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-700 font-medium">
            Chọn các nội dung nghị sự cần trích lục:
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
            {meeting.agendaItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 text-xs text-slate-700 hover:text-slate-900 cursor-pointer"
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

        {/* Preview of extract */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-700 font-medium">Bản xem trước trích lục:</label>
          <pre className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {generateExtractText()}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-500 font-mono">
            Mã hash: {extractHash}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file trích lục (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
