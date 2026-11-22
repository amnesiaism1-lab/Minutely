import React, { useState, useEffect } from 'react';
import { Meeting, MeetingAttachment } from '../../types';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Building2,
  Paperclip,
  Layers,
  Plus,
  Trash2,
  Save,
  Handshake,
  AlertTriangle,
  Repeat,
  Sparkles,
} from 'lucide-react';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  readOnly?: boolean;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  isOpen,
  onClose,
  meeting,
  readOnly = false,
}) => {
  const { updateMeeting } = useMeetingContext();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'legal' | 'attachments' | 'specialized'>('legal');

  // Tab 1: Organization & Distribution & Conclusion
  const [orgName, setOrgName] = useState(meeting.organization.name || '');
  const [governingBody, setGoverningBody] = useState(meeting.organization.governingBody || '');
  const [department, setDepartment] = useState(meeting.organization.department || '');
  const [enterpriseCode, setEnterpriseCode] = useState(meeting.organization.enterpriseCode || '');
  const [address, setAddress] = useState(meeting.organization.address || '');
  const [locationCity, setLocationCity] = useState(meeting.locationCity || 'Hà Nội');
  const [totalCopies, setTotalCopies] = useState<number>(
    meeting.archiveDetails?.totalCopies || 2
  );
  const [forActionText, setForActionText] = useState(
    (meeting.distribution?.forAction || []).join(', ')
  );
  const [forInfoText, setForInfoText] = useState(
    (meeting.distribution?.forInfo || []).join(', ')
  );
  const [conclusionSummary, setConclusionSummary] = useState(meeting.conclusionSummary || '');
  const [nextMeetingDate, setNextMeetingDate] = useState(meeting.nextMeetingDate || '');
  const [nextMeetingAgenda, setNextMeetingAgenda] = useState(meeting.nextMeetingAgenda || '');

  // Tab 2: Attachments
  const [attachments, setAttachments] = useState<MeetingAttachment[]>(meeting.attachments || []);
  const [attTitle, setAttTitle] = useState('');
  const [attType, setAttType] = useState<MeetingAttachment['fileType']>('pdf');
  const [attSize, setAttSize] = useState<number | ''>('');

  // Tab 3: Specialized blocks
  const [bilateral, setBilateral] = useState(meeting.bilateral);
  const [newCommitA, setNewCommitA] = useState('');
  const [newCommitB, setNewCommitB] = useState('');
  const [newPendingPoint, setNewPendingPoint] = useState('');

  const [postMortem, setPostMortem] = useState(meeting.postMortem);
  const [newPrevention, setNewPrevention] = useState('');

  const [scrumRetro, setScrumRetro] = useState(meeting.scrumRetro);
  const [newWell, setNewWell] = useState('');
  const [newWrong, setNewWrong] = useState('');
  const [newImprove, setNewImprove] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setOrgName(meeting.organization.name || '');
    setGoverningBody(meeting.organization.governingBody || '');
    setDepartment(meeting.organization.department || '');
    setEnterpriseCode(meeting.organization.enterpriseCode || '');
    setAddress(meeting.organization.address || '');
    setLocationCity(meeting.locationCity || 'Hà Nội');
    setTotalCopies(meeting.archiveDetails?.totalCopies || 2);
    setForActionText((meeting.distribution?.forAction || []).join(', '));
    setForInfoText((meeting.distribution?.forInfo || []).join(', '));
    setConclusionSummary(meeting.conclusionSummary || '');
    setNextMeetingDate(meeting.nextMeetingDate || '');
    setNextMeetingAgenda(meeting.nextMeetingAgenda || '');
    setAttachments(meeting.attachments || []);
    setBilateral(meeting.bilateral);
    setPostMortem(meeting.postMortem);
    setScrumRetro(meeting.scrumRetro);
  }, [isOpen, meeting.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleAutoSynthesizeConclusion = () => {
    const agreedItems = meeting.agendaItems.filter(
      (i) => i.decision?.status === 'agreed' && i.decision.content.trim()
    );
    const deferredItems = meeting.agendaItems.filter((i) => i.decision?.status === 'deferred');
    const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);

    const parts: string[] = [];
    if (agreedItems.length > 0) {
      parts.push(
        `Cuộc họp đã thảo luận và thống nhất thông qua ${agreedItems.length}/${meeting.agendaItems.length} nội dung nghị sự trọng tâm: ${agreedItems
          .map((item, i) => `(${i + 1}) ${item.decision!.content.trim().replace(/\.$/, '')}`)
          .join('; ')}.`
      );
    }
    if (deferredItems.length > 0) {
      parts.push(
        `Tạm hoãn ${deferredItems.length} nội dung để bổ sung hồ sơ trình kỳ họp kế tiếp.`
      );
    }
    if (allActions.length > 0) {
      parts.push(
        `Giao các cá nhân, đơn vị chủ trì triển khai ${allActions.length} nhiệm vụ cụ thể theo đúng thời hạn và sản phẩm đầu ra đã cam kết, báo cáo kết quả về Thư ký cuộc họp.`
      );
    }

    if (parts.length === 0) {
      toast.warning('Chưa có quyết nghị nào để tổng hợp tự động');
      return;
    }

    setConclusionSummary(parts.join(' '));
    toast.success('Đã tự động tổng hợp kết luận chung từ các quyết nghị');
  };

  if (!isOpen) return null;

  const handleAddAttachment = () => {
    if (!attTitle.trim()) return;
    const item: MeetingAttachment = {
      id: `att-${Date.now()}`,
      meetingId: meeting.id,
      title: attTitle.trim(),
      fileType: attType,
      fileSizeKb: typeof attSize === 'number' && attSize > 0 ? attSize : undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setAttachments((prev) => [...prev, item]);
    setAttTitle('');
    setAttSize('');
  };

  const handleEnableBilateral = () => {
    setBilateral({
      partyA: {
        companyName: orgName || 'CÔNG TY BÊN A',
        representative: 'Đại diện Bên A',
        title: 'Giám đốc',
      },
      partyB: {
        companyName: 'ĐỐI TÁC / BÊN B',
        representative: 'Đại diện Bên B',
        title: 'Đại diện ủy quyền',
      },
      commitmentsA: ['Thực hiện bàn giao đúng tiến độ cam kết.'],
      commitmentsB: ['Phối hợp nghiệm thu và thanh toán theo hợp đồng.'],
      pendingPoints: [],
    });
  };

  const handleEnablePostMortem = () => {
    setPostMortem({
      summary: 'Tóm tắt phạm vi ảnh hưởng của sự cố.',
      impactLevel: 'P2 - Major',
      startTime: `${meeting.date} 08:00`,
      resolvedTime: `${meeting.date} 08:45`,
      downtimeMinutes: 45,
      rootCause: 'Nguyên nhân gốc rễ (Blameless - không quy lỗi cá nhân).',
      whatWentWell: ['Phát hiện cảnh báo sớm.'],
      whatToImprove: ['Cải thiện kịch bản ứng phó tự động.'],
      preventionActions: ['Thiết lập cảnh báo ngưỡng và kiểm thử định kỳ.'],
    });
  };

  const handleEnableScrumRetro = () => {
    setScrumRetro({
      sprintName: 'Sprint hiện tại',
      sprintGoal: 'Hoàn thành các hạng mục cam kết đúng tiêu chí nghiệm thu.',
      whatWentWell: ['Phối hợp nhóm nhịp nhàng.'],
      whatWentWrong: ['Phát sinh thay đổi yêu cầu giữa kỳ.'],
      actionImprovements: ['Khóa phạm vi Sprint trước khi khởi chạy.'],
    });
  };

  const handleSaveAll = () => {
    if (readOnly) {
      onClose();
      return;
    }

    updateMeeting(meeting.id, {
      organization: {
        ...meeting.organization,
        name: orgName.trim() || meeting.organization.name,
        governingBody: governingBody.trim() || undefined,
        department: department.trim() || undefined,
        enterpriseCode: enterpriseCode.trim() || undefined,
        address: address.trim() || undefined,
      },
      locationCity: locationCity.trim() || 'Hà Nội',
      distribution: {
        forAction: forActionText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        forInfo: forInfoText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      archiveDetails: {
        ...(meeting.archiveDetails || {
          storageLocations: ['Văn thư đơn vị', 'Hồ sơ lưu trữ cuộc họp'],
          approvedWithoutObjection: true,
        }),
        totalCopies: Math.max(1, Number(totalCopies) || 2),
      },
      conclusionSummary: conclusionSummary.trim() || undefined,
      nextMeetingDate: nextMeetingDate || undefined,
      nextMeetingAgenda: nextMeetingAgenda.trim() || undefined,
      attachments,
      bilateral,
      postMortem,
      scrumRetro,
    });

    toast.success('Đã cập nhật hồ sơ pháp nhân, phụ lục & khối chuyên biệt');
    onClose();
  };

  return (
    <div
      className="animate-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-modal-enter flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Hồ sơ Pháp nhân, Phụ lục & Nghiệp vụ Chuyên biệt
              </h3>
              <p className="text-[11px] text-slate-500">
                Đồng bộ trực tiếp lên bản in Nghị định 30, bản Hiện đại và file Word (.docx)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex shrink-0 gap-1 border-b border-slate-200/80 bg-slate-50 px-4 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'legal'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Pháp nhân & Nơi nhận</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'attachments'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>Tài liệu đính kèm ({attachments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specialized')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'specialized'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Khối chuyên biệt</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Tên cơ quan / Doanh nghiệp</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Cơ quan chủ quản (nếu có)
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={governingBody}
                    onChange={(e) => setGoverningBody(e.target.value)}
                    placeholder="VD: ỦY BAN CHỨNG KHOÁN..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Đơn vị / Phòng ban chủ trì</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Mã số doanh nghiệp (MSDN - Nhóm B)
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={enterpriseCode}
                    onChange={(e) => setEnterpriseCode(e.target.value)}
                    placeholder="VD: 0109887766"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-medium text-slate-700">Địa chỉ trụ sở chính</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Địa danh ban hành</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={locationCity}
                    onChange={(e) => setLocationCity(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-medium text-slate-700">
                    Nơi nhận để thực hiện (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={forActionText}
                    onChange={(e) => setForActionText(e.target.value)}
                    placeholder="Phòng Tài chính, Ban Pháp chế..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Số bản chính lập lưu</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    disabled={readOnly}
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Nơi nhận để biết / báo cáo (phân cách bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={forInfoText}
                  onChange={(e) => setForInfoText(e.target.value)}
                  placeholder="Ban Lãnh đạo, Lưu Văn thư..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-medium text-slate-700">
                    Tóm tắt kết luận chung cuộc họp (tùy chọn)
                  </label>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleAutoSynthesizeConclusion}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Tổng hợp tự động từ các quyết nghị</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  value={conclusionSummary}
                  onChange={(e) => setConclusionSummary(e.target.value)}
                  placeholder="Tóm tắt định hướng chỉ đạo chung sau khi kết thúc phiên họp..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4ed8] disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Ngày họp kỳ kế tiếp</label>
                  <input
                    type="date"
                    disabled={readOnly}
                    value={nextMeetingDate}
                    onChange={(e) => setNextMeetingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-medium text-slate-700">Nội dung dự kiến kỳ tới</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={nextMeetingAgenda}
                    onChange={(e) => setNextMeetingAgenda(e.target.value)}
                    placeholder="Nghiệm thu kết quả triển khai các nhiệm vụ..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-6">
                  <input
                    type="text"
                    value={attTitle}
                    onChange={(e) => setAttTitle(e.target.value)}
                    placeholder="Tên tài liệu / phụ lục (VD: Phụ lục 01 - Tờ trình ngân sách Q4)..."
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 sm:col-span-3"
                  />
                  <select
                    value={attType}
                    onChange={(e) => setAttType(e.target.value as MeetingAttachment['fileType'])}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="pptx">PowerPoint</option>
                    <option value="other">Khác</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    placeholder="KB (tùy chọn)"
                    value={attSize}
                    onChange={(e) =>
                      setAttSize(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    disabled={!attTitle.trim()}
                    className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                  Chưa có tài liệu hoặc phụ lục nào được đính kèm vào biên bản này.
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-700">
                          {att.fileType}
                        </span>
                        <span className="truncate font-semibold text-slate-900">{att.title}</span>
                        {att.fileSizeKb && (
                          <span className="font-mono text-[11px] text-slate-400">
                            ({att.fileSizeKb} KB)
                          </span>
                        )}
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                          }
                          className="cursor-pointer rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Xóa tài liệu"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specialized' && (
            <div className="space-y-4">
              {/* Quick enable controls if none attached yet */}
              {!readOnly && !bilateral && !postMortem && !scrumRetro && (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-center">
                  <p className="text-slate-600">
                    Biên bản hiện tại chưa kích hoạt khối nghiệp vụ chuyên biệt. Bạn có thể bật khối
                    phù hợp bên dưới:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleEnableBilateral}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100"
                    >
                      <Handshake className="h-3.5 w-3.5 text-amber-600" />
                      <span>Khối Song phương (Bên A & B)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEnablePostMortem}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Khối Phân tích Sự cố (Post-Mortem)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEnableScrumRetro}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100"
                    >
                      <Repeat className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Khối Scrum Retrospective</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bilateral Block Editor */}
              {bilateral && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <Handshake className="h-4 w-4 text-amber-600" />
                      Cam kết Song phương (Bên A & Bên B)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-800">Thông tin Bên A</p>
                      <input
                        type="text"
                        disabled={readOnly}
                        value={bilateral.partyA.companyName}
                        onChange={(e) =>
                          setBilateral({
                            ...bilateral,
                            partyA: { ...bilateral.partyA, companyName: e.target.value },
                          })
                        }
                        placeholder="Tên pháp nhân Bên A"
                        className="w-full rounded border border-slate-200 px-2.5 py-1 text-slate-900"
                      />
                      <input
                        type="text"
                        disabled={readOnly}
                        value={bilateral.partyA.representative}
                        onChange={(e) =>
                          setBilateral({
                            ...bilateral,
                            partyA: { ...bilateral.partyA, representative: e.target.value },
                          })
                        }
                        placeholder="Người đại diện Bên A"
                        className="w-full rounded border border-slate-200 px-2.5 py-1 text-slate-900"
                      />
                      <div className="space-y-1 pt-1">
                        <p className="text-[11px] font-medium text-slate-500">Cam kết Bên A:</p>
                        {bilateral.commitmentsA.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="truncate">• {c}</span>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() =>
                                  setBilateral({
                                    ...bilateral,
                                    commitmentsA: bilateral.commitmentsA.filter((_, i) => i !== idx),
                                  })
                                }
                                className="cursor-pointer text-slate-400 hover:text-rose-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!readOnly && (
                          <div className="flex gap-1 pt-1">
                            <input
                              type="text"
                              value={newCommitA}
                              onChange={(e) => setNewCommitA(e.target.value)}
                              placeholder="Thêm cam kết Bên A..."
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newCommitA.trim()) return;
                                setBilateral({
                                  ...bilateral,
                                  commitmentsA: [...bilateral.commitmentsA, newCommitA.trim()],
                                });
                                setNewCommitA('');
                              }}
                              className="cursor-pointer rounded bg-slate-900 px-2 py-1 text-[10px] text-white"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="font-semibold text-slate-800">Thông tin Bên B</p>
                      <input
                        type="text"
                        disabled={readOnly}
                        value={bilateral.partyB.companyName}
                        onChange={(e) =>
                          setBilateral({
                            ...bilateral,
                            partyB: { ...bilateral.partyB, companyName: e.target.value },
                          })
                        }
                        placeholder="Tên pháp nhân Bên B"
                        className="w-full rounded border border-slate-200 px-2.5 py-1 text-slate-900"
                      />
                      <input
                        type="text"
                        disabled={readOnly}
                        value={bilateral.partyB.representative}
                        onChange={(e) =>
                          setBilateral({
                            ...bilateral,
                            partyB: { ...bilateral.partyB, representative: e.target.value },
                          })
                        }
                        placeholder="Người đại diện Bên B"
                        className="w-full rounded border border-slate-200 px-2.5 py-1 text-slate-900"
                      />
                      <div className="space-y-1 pt-1">
                        <p className="text-[11px] font-medium text-slate-500">Cam kết Bên B:</p>
                        {bilateral.commitmentsB.map((c, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="truncate">• {c}</span>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() =>
                                  setBilateral({
                                    ...bilateral,
                                    commitmentsB: bilateral.commitmentsB.filter((_, i) => i !== idx),
                                  })
                                }
                                className="cursor-pointer text-slate-400 hover:text-rose-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {!readOnly && (
                          <div className="flex gap-1 pt-1">
                            <input
                              type="text"
                              value={newCommitB}
                              onChange={(e) => setNewCommitB(e.target.value)}
                              placeholder="Thêm cam kết Bên B..."
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newCommitB.trim()) return;
                                setBilateral({
                                  ...bilateral,
                                  commitmentsB: [...bilateral.commitmentsB, newCommitB.trim()],
                                });
                                setNewCommitB('');
                              }}
                              className="cursor-pointer rounded bg-slate-900 px-2 py-1 text-[10px] text-white"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pending Points */}
                  <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3">
                    <p className="font-semibold text-slate-800">Điểm chưa thống nhất / Chờ xin ý kiến</p>
                    {bilateral.pendingPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                        <span>• {pt}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setBilateral({
                                ...bilateral,
                                pendingPoints: bilateral.pendingPoints.filter((_, i) => i !== idx),
                              })
                            }
                            className="cursor-pointer text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newPendingPoint}
                          onChange={(e) => setNewPendingPoint(e.target.value)}
                          placeholder="Thêm điều khoản cần xin ý kiến cấp trên..."
                          className="flex-1 rounded border border-slate-200 px-2.5 py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPendingPoint.trim()) return;
                            setBilateral({
                              ...bilateral,
                              pendingPoints: [...bilateral.pendingPoints, newPendingPoint.trim()],
                            });
                            setNewPendingPoint('');
                          }}
                          className="cursor-pointer rounded bg-slate-900 px-3 py-1 text-[11px] font-medium text-white"
                        >
                          Thêm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Post-Mortem Editor */}
              {postMortem && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Phân tích Sự cố (Blameless Post-Mortem)
                  </span>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <select
                      disabled={readOnly}
                      value={postMortem.impactLevel}
                      onChange={(e) =>
                        setPostMortem({
                          ...postMortem,
                          impactLevel: e.target.value as typeof postMortem.impactLevel,
                        })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    >
                      <option value="P1 - Critical">P1 - Critical</option>
                      <option value="P2 - Major">P2 - Major</option>
                      <option value="P3 - Moderate">P3 - Moderate</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      disabled={readOnly}
                      value={postMortem.downtimeMinutes}
                      onChange={(e) =>
                        setPostMortem({
                          ...postMortem,
                          downtimeMinutes: Number(e.target.value) || 0,
                        })
                      }
                      placeholder="Số phút gián đoạn"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      disabled={readOnly}
                      value={postMortem.resolvedTime}
                      onChange={(e) =>
                        setPostMortem({ ...postMortem, resolvedTime: e.target.value })
                      }
                      placeholder="Thời điểm khắc phục"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>
                  <textarea
                    rows={2}
                    disabled={readOnly}
                    value={postMortem.summary}
                    onChange={(e) => setPostMortem({ ...postMortem, summary: e.target.value })}
                    placeholder="Tóm tắt sự cố..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5"
                  />
                  <textarea
                    rows={2}
                    disabled={readOnly}
                    value={postMortem.rootCause}
                    onChange={(e) => setPostMortem({ ...postMortem, rootCause: e.target.value })}
                    placeholder="Nguyên nhân gốc rễ (Blameless)..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5"
                  />
                  <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2.5">
                    <p className="font-medium text-slate-700">Biện pháp phòng ngừa tái diễn:</p>
                    {postMortem.preventionActions.map((pa, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span>• {pa}</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              setPostMortem({
                                ...postMortem,
                                preventionActions: postMortem.preventionActions.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                            className="cursor-pointer text-slate-400 hover:text-rose-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newPrevention}
                          onChange={(e) => setNewPrevention(e.target.value)}
                          placeholder="Thêm hành động phòng ngừa..."
                          className="flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPrevention.trim()) return;
                            setPostMortem({
                              ...postMortem,
                              preventionActions: [
                                ...postMortem.preventionActions,
                                newPrevention.trim(),
                              ],
                            });
                            setNewPrevention('');
                          }}
                          className="cursor-pointer rounded bg-slate-900 px-2.5 py-1 text-[11px] text-white"
                        >
                          Thêm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Scrum Retro Editor */}
              {scrumRetro && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Repeat className="h-4 w-4 text-emerald-600" />
                    Bảng Scrum Retrospective (3 cột)
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      disabled={readOnly}
                      value={scrumRetro.sprintName}
                      onChange={(e) =>
                        setScrumRetro({ ...scrumRetro, sprintName: e.target.value })
                      }
                      placeholder="Tên Sprint..."
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      disabled={readOnly}
                      value={scrumRetro.sprintGoal}
                      onChange={(e) =>
                        setScrumRetro({ ...scrumRetro, sprintGoal: e.target.value })
                      }
                      placeholder="Mục tiêu Sprint..."
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                    {/* Well */}
                    <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-white p-2.5">
                      <p className="font-semibold text-emerald-800">Làm tốt</p>
                      {scrumRetro.whatWentWell.map((w, idx) => (
                        <div key={idx} className="flex justify-between gap-1 text-[11px]">
                          <span>• {w}</span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setScrumRetro({
                                  ...scrumRetro,
                                  whatWentWell: scrumRetro.whatWentWell.filter((_, i) => i !== idx),
                                })
                              }
                              className="cursor-pointer text-slate-400 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!readOnly && (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newWell}
                            onChange={(e) => setNewWell(e.target.value)}
                            placeholder="Thêm..."
                            className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newWell.trim()) return;
                              setScrumRetro({
                                ...scrumRetro,
                                whatWentWell: [...scrumRetro.whatWentWell, newWell.trim()],
                              });
                              setNewWell('');
                            }}
                            className="cursor-pointer rounded bg-emerald-600 px-2 text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Wrong */}
                    <div className="space-y-1.5 rounded-lg border border-rose-200 bg-white p-2.5">
                      <p className="font-semibold text-rose-800">Chưa tốt</p>
                      {scrumRetro.whatWentWrong.map((w, idx) => (
                        <div key={idx} className="flex justify-between gap-1 text-[11px]">
                          <span>• {w}</span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setScrumRetro({
                                  ...scrumRetro,
                                  whatWentWrong: scrumRetro.whatWentWrong.filter(
                                    (_, i) => i !== idx
                                  ),
                                })
                              }
                              className="cursor-pointer text-slate-400 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!readOnly && (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newWrong}
                            onChange={(e) => setNewWrong(e.target.value)}
                            placeholder="Thêm..."
                            className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newWrong.trim()) return;
                              setScrumRetro({
                                ...scrumRetro,
                                whatWentWrong: [...scrumRetro.whatWentWrong, newWrong.trim()],
                              });
                              setNewWrong('');
                            }}
                            className="cursor-pointer rounded bg-rose-600 px-2 text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Improve */}
                    <div className="space-y-1.5 rounded-lg border border-sky-200 bg-white p-2.5">
                      <p className="font-semibold text-sky-800">Cải tiến</p>
                      {scrumRetro.actionImprovements.map((w, idx) => (
                        <div key={idx} className="flex justify-between gap-1 text-[11px]">
                          <span>• {w}</span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setScrumRetro({
                                  ...scrumRetro,
                                  actionImprovements: scrumRetro.actionImprovements.filter(
                                    (_, i) => i !== idx
                                  ),
                                })
                              }
                              className="cursor-pointer text-slate-400 hover:text-rose-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                      {!readOnly && (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={newImprove}
                            onChange={(e) => setNewImprove(e.target.value)}
                            placeholder="Thêm..."
                            className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newImprove.trim()) return;
                              setScrumRetro({
                                ...scrumRetro,
                                actionImprovements: [
                                  ...scrumRetro.actionImprovements,
                                  newImprove.trim(),
                                ],
                              });
                              setNewImprove('');
                            }}
                            className="cursor-pointer rounded bg-sky-600 px-2 text-white"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/70"
          >
            {readOnly ? 'Đóng' : 'Hủy bỏ'}
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1d4ed8] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Lưu thay đổi hồ sơ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
