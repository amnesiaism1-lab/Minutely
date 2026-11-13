import React, { useState, useRef, useEffect } from 'react';
import { AgendaItem, Participant, OpinionType } from '../../types';
import { parseNoteInput, removeVietnameseDiacritics } from '../../utils/dateParser';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquare,
  Send,
  HelpCircle,
  Shield,
  Lightbulb,
  User,
  Zap,
  Sparkles,
} from 'lucide-react';

interface NoteTakingStreamProps {
  currentAgenda: AgendaItem;
  participants: Participant[];
  onAddOpinion: (agendaItemId: string, opinion: {
    speakerId: string;
    speakerName: string;
    type: OpinionType;
    content: string;
  }) => void;
  onCreateDecisionFromStream: (text: string) => void;
  onCreateActionFromStream: (title: string, ownerName?: string, deadline?: string) => void;
  onOpenVoteModal: () => void;
}

export const NoteTakingStream: React.FC<NoteTakingStreamProps> = ({
  currentAgenda,
  participants,
  onAddOpinion,
  onCreateDecisionFromStream,
  onCreateActionFromStream,
  onOpenVoteModal,
}) => {
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    participants[0]?.id || ''
  );
  const [opinionType, setOpinionType] = useState<OpinionType>('opinion');
  const [showHelper, setShowHelper] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const streamBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentAgenda.opinions.length]);

  const filteredMentions = participants.filter((p) => {
    if (!mentionFilter.trim()) return true;
    const qRaw = mentionFilter.trim().toLowerCase();
    const qNorm = removeVietnameseDiacritics(mentionFilter);
    const nameNorm = removeVietnameseDiacritics(p.name);
    const titleNorm = p.title ? removeVietnameseDiacritics(p.title) : '';

    return (
      p.name.toLowerCase().includes(qRaw) ||
      nameNorm.includes(qNorm) ||
      (p.title && p.title.toLowerCase().includes(qRaw)) ||
      titleNorm.includes(qNorm)
    );
  });

  // Monitor mention trigger and quick command switching
  const handleInputChange = (val: string) => {
    setInputText(val);

    // Tự động đồng bộ pill button khi gõ lệnh /dx, /pb, /lr, /yk ở bất kỳ vị trí nào (kể cả sau @Tên)
    const quick = parseNoteInput(val, participants);
    if (quick.explicitType) {
      if (quick.type === 'proposal') setOpinionType('proposal');
      else if (quick.type === 'counter') setOpinionType('counter');
      else if (quick.type === 'clarify') setOpinionType('clarify');
      else if (quick.type === 'opinion') setOpinionType('opinion');
    }

    const atIndex = val.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = val.slice(atIndex + 1);
      // Giữ popup mở khi gõ tên tiếng Việt có dấu cách (tối đa 25 ký tự)
      if (query.length <= 25 && !query.includes('\n')) {
        setShowMentionSuggestions(true);
        setMentionFilter(query);
        setSelectedSuggestionIndex(0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (p: Participant) => {
    const atIndex = inputText.lastIndexOf('@');
    if (atIndex !== -1) {
      const prefix = inputText.slice(0, atIndex);
      const isAtStart = prefix.trim() === '';
      if (isAtStart) {
        // Gán tiền tố định dạng @Tên: chuẩn để phân định rõ ràng người phát biểu
        setInputText(`@${p.name}: `);
        setSelectedSpeakerId(p.id);
      } else {
        setInputText(`${prefix}@${p.name} `);
      }
    }
    setShowMentionSuggestions(false);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const parsed = parseNoteInput(inputText, participants);

    // If slash command is decision
    if (parsed.type === 'decision') {
      if (!parsed.cleanedText) {
        toast.info('Vui lòng nhập nội dung quyết nghị sau lệnh /qd');
        return;
      }
      onCreateDecisionFromStream(parsed.cleanedText);
      setInputText('');
      return;
    }

    // If slash command is action
    if (parsed.type === 'action') {
      if (!parsed.cleanedText) {
        toast.info('Vui lòng nhập tên công việc sau lệnh /viec');
        return;
      }
      onCreateActionFromStream(parsed.cleanedText, parsed.mention, parsed.deadline);
      setInputText('');
      return;
    }

    // If slash command is vote
    if (parsed.type === 'vote') {
      onOpenVoteModal();
      setInputText('');
      return;
    }

    // Determine speaker from override or current dropdown
    let speakerId = selectedSpeakerId;
    let speakerName = participants.find((p) => p.id === selectedSpeakerId)?.name || 'Đại biểu';

    if (parsed.speakerOverride) {
      speakerName = parsed.speakerOverride.name;
      if (parsed.speakerOverride.id) {
        speakerId = parsed.speakerOverride.id;
        setSelectedSpeakerId(parsed.speakerOverride.id);
      }
    }

    // Xử lý khi người dùng chỉ gõ @Tên mà không có nội dung: chuyển người nói, không tạo thẻ rác
    if (!parsed.hasSubstantiveContent) {
      if (parsed.speakerOverride) {
        if (parsed.speakerOverride.id) {
          setSelectedSpeakerId(parsed.speakerOverride.id);
        }
        setInputText(`@${parsed.speakerOverride.name}: `);
        setTimeout(() => inputRef.current?.focus(), 10);
        return;
      }
      toast.info(`Vui lòng nhập nội dung ý kiến phát biểu của ${speakerName}`);
      return;
    }

    // Regular opinion with combined overridden type (hỗ trợ cả /yk, /dx, /pb, /lr)
    const finalType: OpinionType = parsed.explicitType
      ? parsed.type === 'counter' || parsed.type === 'proposal' || parsed.type === 'clarify'
        ? parsed.type
        : 'opinion'
      : opinionType;

    onAddOpinion(currentAgenda.id, {
      speakerId,
      speakerName,
      type: finalType,
      content: parsed.cleanedText,
    });

    setInputText('');
    setShowMentionSuggestions(false);
  };

  const handleFormalizeText = () => {
    if (!inputText.trim()) return;
    const parsed = parseNoteInput(inputText, participants);
    const speaker = parsed.speakerOverride?.name || participants.find((p) => p.id === selectedSpeakerId)?.name || 'Đại biểu';
    const text = parsed.cleanedText;

    if (!text) {
      toast.info('Nhập thêm nội dung ý kiến trước khi chuẩn hóa!');
      return;
    }

    let formalized = '';
    const cleanContent = text.charAt(0).toLowerCase() + text.slice(1);

    if (parsed.type === 'proposal' || opinionType === 'proposal') {
      formalized = `Ông/Bà ${speaker} đề xuất phương án: ${cleanContent}.`;
    } else if (parsed.type === 'counter' || opinionType === 'counter') {
      formalized = `Ông/Bà ${speaker} có ý kiến phản biện: ${cleanContent}.`;
    } else if (parsed.type === 'clarify' || opinionType === 'clarify') {
      formalized = `Ông/Bà ${speaker} đề nghị làm rõ nội dung: ${cleanContent}.`;
    } else if (parsed.type === 'decision') {
      formalized = `Cuộc họp thống nhất quyết nghị: ${cleanContent}.`;
    } else if (parsed.type === 'action') {
      formalized = `Giao cho Ông/Bà ${speaker} chủ trì thực hiện: ${cleanContent}${parsed.deadline ? ` trước ngày ${parsed.deadline}` : ''}.`;
    } else {
      formalized = `Ông/Bà ${speaker} phát biểu ý kiến: ${cleanContent}.`;
    }

    setInputText(formalized);
    toast.success('Đã chuẩn hóa câu hành chính!');
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Điều hướng danh sách gợi ý bằng bàn phím siêu tốc (ArrowDown, ArrowUp, Tab, Enter)
    if (showMentionSuggestions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const target = filteredMentions[selectedSuggestionIndex] || filteredMentions[0];
        if (target) {
          handleSelectMention(target);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
    }
  };

  const getOpinionBadge = (type: OpinionType) => {
    switch (type) {
      case 'counter':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80">
            <Shield className="w-3 h-3" />
            <span>Phản biện</span>
          </span>
        );
      case 'proposal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
            <Lightbulb className="w-3 h-3" />
            <span>Đề xuất</span>
          </span>
        );
      case 'clarify':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80">
            <HelpCircle className="w-3 h-3" />
            <span>Làm rõ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
            <MessageSquare className="w-3 h-3" />
            <span>Ý kiến</span>
          </span>
        );
    }
  };

  const renderOpinionContent = (content: string) => {
    // Tự động nhận diện và highlight các thẻ @mention bên trong nội dung ý kiến
    const parts = content.split(/(@[\p{L}\w]+(?:\s+[\p{L}\w]+){0,2})/u);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="inline-flex items-center text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded font-medium border border-sky-200/80 mx-0.5 text-[11px]"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Top Banner for Current Topic */}
      <div className="p-3.5 border-b border-slate-200/80 bg-white flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Đang thảo luận Mục #{currentAgenda.order}
          </span>
          <h1 className="text-sm font-semibold text-slate-900 truncate mt-0.5">
            {currentAgenda.title}
          </h1>
          {currentAgenda.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{currentAgenda.description}</p>
          )}
        </div>

        {/* Quick Helper Trigger */}
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Phím tắt nhanh</span>
        </button>
      </div>

      {/* Helper Box if toggled */}
      {showHelper && (
        <div className="bg-white border-b border-slate-200/80 p-3 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-slate-900 font-bold">@tên</span>: Gán người nói
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-blue-600 font-bold">/yk</span>: Ý kiến
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-amber-600 font-bold">/dx</span>: Đề xuất
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-rose-600 font-bold">/pb</span>: Phản biện
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-sky-600 font-bold">/lr</span>: Làm rõ
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-sans space-y-1">
            <p>
              💡 <strong>Kết hợp tự do không phân biệt thứ tự:</strong> Ví dụ{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">@Sarah /dx nội dung</code> hoặc{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">/dx @Sarah nội dung</code>.
            </p>
            <p>
              ⚡ <strong>Giao việc & hạn chót:</strong>{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">/viec @Hà !thứ sáu nộp báo cáo</code>.
            </p>
          </div>
        </div>
      )}

      {/* Stream of Opinions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentAgenda.opinions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2.5 py-16">
            <div className="w-11 h-11 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-xs font-medium text-slate-700">Chưa có ý kiến nào được ghi</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Gõ nội dung bên dưới và nhấn Enter. Hỗ trợ cú pháp @tên, /pb, /dx, /viec, !thứ sáu.
              </p>
            </div>
          </div>
        ) : (
          currentAgenda.opinions.map((op) => (
            <div
              key={op.id}
              className="bg-white border border-slate-200/80 rounded-xl p-3.5 hover:border-slate-300 transition-colors shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-semibold text-slate-600 border border-slate-200/70">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800">{op.speakerName}</span>
                  {getOpinionBadge(op.type)}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{op.timestamp}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed pl-8 whitespace-pre-wrap">
                {renderOpinionContent(op.content)}
              </p>
            </div>
          ))
        )}
        <div ref={streamBottomRef} />
      </div>

      {/* Mention Auto-suggestions Floating Dropdown */}
      {showMentionSuggestions && filteredMentions.length > 0 && (
        <div className="mx-4 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 max-h-52 overflow-y-auto z-20 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-400 font-semibold uppercase border-b border-slate-100 mb-1">
            <span>Chọn người phát biểu (@)</span>
            <span className="font-normal lowercase text-[10px]">Dùng ↑ ↓ và Tab/Enter</span>
          </div>
          {filteredMentions.map((p, idx) => {
            const isSelected = idx === selectedSuggestionIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectMention(p)}
                onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white font-medium shadow-2xs'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span className="font-medium">{p.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {p.title || (p.role === 'chairperson' ? 'Chủ tọa' : p.role === 'secretary' ? 'Thư ký' : 'Đại biểu')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Box with Slash Controls */}
      <div className="p-3.5 border-t border-slate-200/80 bg-white select-none">
        {/* Controls row: Speaker & Type buttons */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Speaker select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Người nói:</span>
              <select
                value={selectedSpeakerId}
                onChange={(e) => setSelectedSpeakerId(e.target.value)}
                className="bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role === 'chairperson' ? 'Chủ tọa' : p.role === 'secretary' ? 'Thư ký' : 'Đại biểu'})
                  </option>
                ))}
              </select>
            </div>

            {/* Type quick pills */}
            <div className="flex items-center gap-1">
              {(['opinion', 'proposal', 'counter', 'clarify'] as OpinionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setOpinionType(t)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    opinionType === t
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {t === 'opinion'
                    ? 'Ý kiến'
                    : t === 'proposal'
                    ? 'Đề xuất'
                    : t === 'counter'
                    ? 'Phản biện'
                    : 'Làm rõ'}
                </button>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-slate-400 hidden md:inline">
            💡 Gõ trực tiếp rồi Enter (kết hợp tự do: @Tên, /yk, /dx, /pb, /lr)
          </span>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Gõ nội dung phát biểu... (Kết hợp tự do: @Tên, /yk, /dx, /pb, /lr, /viec !thứ sáu)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-16 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              onClick={handleFormalizeText}
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="✨ Chuẩn hóa thành câu hành chính trang trọng (Nghị định 30)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-white transition-all cursor-pointer"
              title="Gửi ý kiến (Enter)"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
