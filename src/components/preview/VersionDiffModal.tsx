import React from 'react';
import { Meeting } from '../../types';
import { GitCompare, X } from 'lucide-react';

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
            <span className="text-slate-500">Phiên bản trước:</span>{' '}
            <strong className="text-amber-700">v{previousMeeting ? previousMeeting.version : '1.0'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500">Phiên bản hiện tại:</span>{' '}
            <strong className="text-emerald-700">v{currentMeeting.version}</strong>
          </div>
        </div>

        {/* Diff content comparison */}
        <div className="space-y-3 text-xs">
          <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
            Chi tiết các thay đổi giữa 2 phiên bản
          </h4>

          <div className="space-y-2.5 font-mono">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed">
              <span className="font-bold text-rose-700">[-] BẢN CŨ:</span> Thế chấp toàn bộ tài sản hữu hình và quyền sở hữu trí tuệ gồm mã nguồn và bằng sáng chế phần mềm.
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
              <span className="font-bold text-emerald-700">[+] BẢN MỚI:</span> Chỉ thế chấp quyền đòi nợ từ hợp đồng dịch vụ lớn và tiền gửi, tuyệt đối không thế chấp tài sản trí tuệ và mã nguồn.
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
              <span className="font-bold text-emerald-700">[+] BẢN MỚI:</span> Ghi nhận bảo lưu ý kiến phản đối của Thành viên HĐQT Độc lập Bùi Thanh Tùng theo Điều 158 Luật Doanh nghiệp 2020.
            </div>
          </div>
        </div>

        {/* Audit trail */}
        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-800">Nhật ký chỉnh sửa (Audit Trail):</p>
          {currentMeeting.auditLogs.map((log) => (
            <p key={log.id} className="text-[11px]">
              • [{log.timestamp}] <span className="font-medium text-slate-800">{log.actor}</span>: {log.action} - {log.details}
            </p>
          ))}
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
