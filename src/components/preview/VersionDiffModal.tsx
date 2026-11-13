import React from 'react';
import { Meeting } from '../../types';
import { GitCompare, X, ArrowRight } from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMeeting: Meeting;
  previousMeeting?: Meeting | null;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({
  isOpen,
  onClose,
  currentMeeting,
  previousMeeting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">
              So Sánh Phiên Bản (Diff Comparison)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versions header */}
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400">Phiên bản trước:</span>{' '}
            <strong className="text-amber-400">v{previousMeeting ? previousMeeting.version : '1.0'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400">Phiên bản hiện tại:</span>{' '}
            <strong className="text-emerald-400">v{currentMeeting.version}</strong>
          </div>
        </div>

        {/* Diff content comparison */}
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
            Chi tiết các thay đổi giữa 2 phiên bản
          </h4>

          <div className="space-y-3 font-mono">
            {/* Example diff rows */}
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <span className="font-bold text-rose-400">[-] BẢN CŨ:</span> Thế chấp toàn bộ tài sản hữu hình và quyền sở hữu trí tuệ gồm mã nguồn và bằng sáng chế phần mềm.
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="font-bold text-emerald-400">[+] BẢN MỚI:</span> Chỉ thế chấp quyền đòi nợ từ hợp đồng dịch vụ lớn và tiền gửi, tuyệt đối không thế chấp tài sản trí tuệ và mã nguồn.
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <span className="font-bold text-emerald-400">[+] BẢN MỚI:</span> Ghi nhận bảo lưu ý kiến phản đối của Thành viên HĐQT Độc lập Bùi Thanh Tùng theo Điều 158 Luật Doanh nghiệp 2020.
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">Nhật ký chỉnh sửa (Audit Trail):</p>
          {currentMeeting.auditLogs.map((log) => (
            <p key={log.id} className="text-[11px]">
              • [{log.timestamp}] <span className="font-semibold text-slate-200">{log.actor}</span>: {log.action} - {log.details}
            </p>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            Đóng so sánh
          </button>
        </div>
      </div>
    </div>
  );
};
