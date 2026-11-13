import React from 'react';
import { Meeting } from '../../types';
import { GitCompare, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeeting: Meeting;
  previousMeeting?: Meeting | null;
}

interface DiffItem {
  category: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  currentMeeting,
  previousMeeting,
}) => {
  if (!isOpen) return null;

  // Compute real dynamic diffs between previousMeeting and currentMeeting
  const diffs: DiffItem[] = [];

  if (previousMeeting) {
    if (previousMeeting.title !== currentMeeting.title) {
      diffs.push({
        category: 'Thông tin chung',
        field: 'Tiêu đề cuộc họp',
        oldValue: previousMeeting.title,
        newValue: currentMeeting.title,
      });
    }

    if (previousMeeting.code !== currentMeeting.code) {
      diffs.push({
        category: 'Thông tin chung',
        field: 'Số & Ký hiệu biên bản',
        oldValue: previousMeeting.code,
        newValue: currentMeeting.code,
      });
    }

    const prevTime = `${previousMeeting.date} (${previousMeeting.startTime} - ${previousMeeting.endTime})`;
    const currTime = `${currentMeeting.date} (${currentMeeting.startTime} - ${currentMeeting.endTime})`;
    if (prevTime !== currTime) {
      diffs.push({
        category: 'Thời gian & Địa điểm',
        field: 'Thời gian tổ chức',
        oldValue: prevTime,
        newValue: currTime,
      });
    }

    if (previousMeeting.venue !== currentMeeting.venue) {
      diffs.push({
        category: 'Thời gian & Địa điểm',
        field: 'Địa điểm / Đường link họp',
        oldValue: previousMeeting.venue,
        newValue: currentMeeting.venue,
      });
    }

    // Quorum
    if (previousMeeting.quorum || currentMeeting.quorum) {
      const prevQuorum = previousMeeting.quorum ? `${previousMeeting.quorum.actualPercentage}%` : 'Không xác định';
      const currQuorum = currentMeeting.quorum ? `${currentMeeting.quorum.actualPercentage}%` : 'Không xác định';
      if (prevQuorum !== currQuorum) {
        diffs.push({
          category: 'Túc số & Điểm danh',
          field: 'Tỷ lệ túc số tham dự',
          oldValue: prevQuorum,
          newValue: currQuorum,
        });
      }
    }

    // Participants count
    if (previousMeeting.participants.length !== currentMeeting.participants.length) {
      diffs.push({
        category: 'Túc số & Điểm danh',
        field: 'Tổng số lượng đại biểu',
        oldValue: `${previousMeeting.participants.length} đại biểu`,
        newValue: `${currentMeeting.participants.length} đại biểu`,
      });
    }

    // Decisions in Agenda Items
    currentMeeting.agendaItems.forEach((currItem, idx) => {
      const prevItem = previousMeeting.agendaItems[idx];
      if (!prevItem) {
        diffs.push({
          category: 'Nội dung & Quyết nghị',
          field: `Nội dung thảo luận #${idx + 1}`,
          oldValue: '(Chưa tồn tại)',
          newValue: `${currItem.title}: ${currItem.decision?.content || 'Chưa có quyết nghị'}`,
        });
      } else {
        if (prevItem.title !== currItem.title) {
          diffs.push({
            category: 'Nội dung & Quyết nghị',
            field: `Tiêu đề nội dung #${idx + 1}`,
            oldValue: prevItem.title,
            newValue: currItem.title,
          });
        }
        const prevDec = prevItem.decision?.content || '';
        const currDec = currItem.decision?.content || '';
        if (prevDec !== currDec) {
          diffs.push({
            category: 'Nội dung & Quyết nghị',
            field: `Quyết nghị nội dung #${idx + 1}`,
            oldValue: prevDec || '(Chưa ban hành)',
            newValue: currDec || '(Chưa ban hành)',
          });
        }
      }
    });

    // Action items count
    const prevActionCount = previousMeeting.agendaItems.reduce((acc, a) => acc + a.actionItems.length, 0);
    const currActionCount = currentMeeting.agendaItems.reduce((acc, a) => acc + a.actionItems.length, 0);
    if (prevActionCount !== currActionCount) {
      diffs.push({
        category: 'Nhiệm vụ',
        field: 'Tổng số nhiệm vụ phân công',
        oldValue: `${prevActionCount} nhiệm vụ`,
        newValue: `${currActionCount} nhiệm vụ`,
      });
    }

    // Conclusion Summary
    if ((previousMeeting.conclusionSummary || '') !== (currentMeeting.conclusionSummary || '')) {
      diffs.push({
        category: 'Kết luận',
        field: 'Tóm tắt kết luận',
        oldValue: previousMeeting.conclusionSummary || '(Trống)',
        newValue: currentMeeting.conclusionSummary || '(Trống)',
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-base text-slate-900">
              So sánh phiên bản (Diff Comparison)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions header */}
        <div className="grid grid-cols-2 gap-3 text-xs font-medium">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Phiên bản gốc / trước:</span>{' '}
            <strong className="text-amber-700">v{previousMeeting ? previousMeeting.version : '1.0'}</strong>
            {previousMeeting && (
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{previousMeeting.code}</p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Phiên bản hiện tại:</span>{' '}
            <strong className="text-emerald-700">v{currentMeeting.version}</strong>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{currentMeeting.code}</p>
          </div>
        </div>

        {/* Diff content comparison */}
        <div className="space-y-3 text-xs">
          <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Chi tiết các thay đổi giữa 2 phiên bản
          </h4>

          {!previousMeeting ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-slate-800">
                  Đây là phiên bản khởi tạo đầu tiên (v{currentMeeting.version}).
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chưa có phiên bản tiền nhiệm để so sánh khác biệt. Mọi chỉnh sửa được ghi nhận trong nhật ký bên dưới.
                </p>
              </div>
            </div>
          ) : diffs.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-900">
                  Không phát hiện sự khác biệt cấu trúc giữa 2 phiên bản.
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Nội dung cuộc họp, quyết nghị và phân công nhiệm vụ tương đồng.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {diffs.map((diff, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{diff.field}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {diff.category}
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed">
                      <span className="font-bold text-rose-700">[-] v{previousMeeting.version}:</span> {diff.oldValue}
                    </div>
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
                      <span className="font-bold text-emerald-700">[+] v{currentMeeting.version}:</span> {diff.newValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit trail */}
        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-800">Nhật ký chỉnh sửa (Audit Trail):</p>
          {currentMeeting.auditLogs && currentMeeting.auditLogs.length > 0 ? (
            currentMeeting.auditLogs.map((log) => (
              <p key={log.id} className="text-[11px]">
                • [{log.timestamp}] <span className="font-medium text-slate-800">{log.actor}</span>: {log.action} - {log.details}
              </p>
            ))
          ) : (
            <p className="text-[11px] text-slate-400 italic">Chưa có nhật ký ghi nhận chỉnh sửa.</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
