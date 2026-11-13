import React, { useState } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { TemplateDefinition, MeetingGroup, MeetingMode } from '../../types';
import {
  PlusCircle,
  X,
  Calendar,
  Clock,
  MapPin,
  Building,
  User,
  Scale,
  Sparkles,
} from 'lucide-react';

interface CreateMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { createMeeting, setCurrentMeetingId, setActiveTab, currentUser } = useMeetingContext();

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(
    TEMPLATE_DEFINITIONS[0]
  );
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(`0${Math.floor(Math.random() * 90) + 10}/2026/BB`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [venue, setVenue] = useState('Phòng họp chính');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('offline');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [orgName, setOrgName] = useState('CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY');
  const [department, setDepartment] = useState('Ban Điều hành');
  const [chairpersonName, setChairpersonName] = useState(currentUser.name);
  const [secretaryName, setSecretaryName] = useState('Trần Thị Thu Hà');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newMeeting = createMeeting({
      title: title.trim() || `${selectedTemplate.name} - ${date}`,
      code: code.trim(),
      templateId: selectedTemplate.id,
      group: selectedTemplate.group,
      type: selectedTemplate.type,
      typeName: selectedTemplate.name,
      organization: {
        name: orgName,
        department,
      },
      date,
      startTime,
      endTime,
      venue,
      meetingMode,
      meetingUrl: meetingUrl.trim() || undefined,
      participants: [
        {
          id: `p-${Date.now()}-1`,
          name: chairpersonName,
          email: `${chairpersonName.toLowerCase().replace(/\s+/g, '.')}@minutely.vn`,
          role: 'chairperson',
          title: 'Chủ tọa cuộc họp',
          status: 'present',
          votingPower: selectedTemplate.group === 'B' ? 1 : undefined,
        },
        {
          id: `p-${Date.now()}-2`,
          name: secretaryName,
          email: `${secretaryName.toLowerCase().replace(/\s+/g, '.')}@minutely.vn`,
          role: 'secretary',
          title: 'Thư ký cuộc họp',
          status: 'present',
        },
      ],
      quorum:
        selectedTemplate.group === 'B'
          ? {
              requiredPercentage: selectedTemplate.defaultQuorum || 50,
              actualPercentage: 100,
              isMet: true,
              totalCapitalOrShares: 10,
              presentCapitalOrShares: 10,
            }
          : undefined,
    });

    setCurrentMeetingId(newMeeting.id);
    setActiveTab('live');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white space-y-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg">Khởi Tạo Cuộc Họp Mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1: Select Template */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Chọn biểu mẫu biên bản (Template)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-800 rounded-xl bg-slate-950/50">
              {TEMPLATE_DEFINITIONS.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedTemplate.id === t.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{t.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      Nhóm {t.group}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 text-slate-400">{t.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Information */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Thông tin cuộc họp
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Tiêu đề cuộc họp</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Ví dụ: ${selectedTemplate.name}...`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Số & Ký hiệu biên bản</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Ngày họp</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Giờ bắt đầu</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Giờ kết thúc</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Mode & Venue */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Hình thức họp</label>
                <select
                  value={meetingMode}
                  onChange={(e) => setMeetingMode(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="offline">Trực tiếp (Tại văn phòng)</option>
                  <option value="online">Trực tuyến (Google Meet/Zoom)</option>
                  <option value="hybrid">Kết hợp Trực tiếp & Trực tuyến</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Địa điểm / Liên kết cuộc họp</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Phòng họp tầng 12 hoặc link Google Meet..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Chairperson & Secretary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Chủ tọa / Người chủ trì
                </label>
                <input
                  type="text"
                  required
                  value={chairpersonName}
                  onChange={(e) => setChairpersonName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Thư ký / Người ghi biên bản
                </label>
                <input
                  type="text"
                  required
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Tạo & Mở ghi chép ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
