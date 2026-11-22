import React, { useState, useRef, useEffect } from 'react';
import { AgendaItem, Participant, OpinionType, Opinion } from '../../types';
import { parseNoteInput, removeVietnameseDiacritics } from '../../utils/dateParser';
import { getInitials, getAvatarTone, OPINION_TYPE_META } from '../../utils/uiHelpers';
import { useToast } from '../../context/ToastContext';
import {
  MessageSquare,
  Send,
  HelpCircle,
  Shield,
  Lightbulb,
  Zap,
  Sparkles,
  Pencil,
  Trash2,
  Gavel,
  CheckSquare,
  Check,
  X,
  Command,
} from 'lucide-react';

interface NoteTakingStreamProps {
  currentAgenda: AgendaItem;
  participants: Participant[];
  onAddOpinion: (
    agendaItemId: string,
    opinion: {
      speakerId: string;
      speakerName: string;
      type: OpinionType;
      content: string;
    }
  ) => void;
  onUpdateOpinion?: (
    agendaItemId: string,
    opinionId: string,
    updates: Partial<Opinion>
  ) => void;
  onDeleteOpinion?: (agendaItemId: string, opinionId: string) => void;
  onCreateDecisionFromStream: (text: string) => void;
  onCreateActionFromStream: (title: string, ownerName?: string, deadline?: string) => void;
  onOpenPrefilledAction?: (title: string, ownerId?: string) => void;
  onOpenVoteModal: () => void;
  readOnly?: boolean;
}

const SLASH_COMMANDS = [
  { cmd: '/yk', label: 'Ý kiến phát biểu', desc: 'Ghi nhận ý kiến thảo luận chung', badge: 'text-slate-700 bg-slate-100' },
  { cmd: '/dx', label: 'Đề xuất phương án', desc: 'Đánh dấu đề xuất giải pháp mới', badge: 'text-amber-700 bg-amber-50' },
  { cmd: '/pb', label: 'Ý kiến phản biện', desc: 'Ghi nhận góp ý phản biện / rủi ro', badge: 'text-rose-700 bg-rose-50' },
  { cmd: '/lr', label: 'Đề nghị làm rõ', desc: 'Câu hỏi xác minh thông tin, số liệu', badge: 'text-sky-700 bg-sky-50' },
  { cmd: '/qd', label: 'Chốt Quyết nghị', desc: 'Cập nhật thẳng vào ô Quyết nghị chính thức', badge: 'text-emerald-700 bg-emerald-50' },
  { cmd: '/viec', label: 'Giao nhiệm vụ', desc: 'Vd: /viec @Hà !thứ sáu nộp báo cáo', badge: 'text-indigo-700 bg-indigo-50' },
  { cmd: '/bq', label: 'Mở biểu quyết', desc: 'Bật hộp thoại ghi phiếu biểu quyết', badge: 'text-slate-900 bg-slate-200' },
];

export const NoteTakingStream: React.FC<NoteTakingStreamProps> = ({
  currentAgenda,
  participants,
  onAddOpinion,
  onUpdateOpinion,
  onDeleteOpinion,
  onCreateDecisionFromStream,
  onCreateActionFromStream,
  onOpenPrefilledAction,
  onOpenVoteModal,
  readOnly = false,
}) => {
  const [inputText, setInputText] = useState('');
  const { toast } = useToast();
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    participants[0]?.id || ''
  );
  const [opinionType, setOpinionType] = useState<OpinionType>('opinion');
  const [showHelper, setShowHelper] = useState(false);

  // Mention popup state
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Slash popup state
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  // Inline edit state for existing opinions
  const [editingOpinionId, setEditingOpinionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingType, setEditingType] = useState<OpinionType>('opinion');

  const streamBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentAgenda.opinions.length, currentAgenda.id]);

  // Auto-resize composer textarea cleanly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [inputText]);

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

  const filteredSlashCommands = SLASH_COMMANDS.filter((c) => {
    if (!slashFilter) return true;
    const q = slashFilter.toLowerCase();
    return (
      c.cmd.toLowerCase().includes(q) ||
      removeVietnameseDiacritics(c.label).includes(removeVietnameseDiacritics(q))
    );
  });

  const handleInputChange = (val: string) => {
    setInputText(val);

    // Sync quick type pill automatically
    const quick = parseNoteInput(val, participants);
    if (quick.explicitType) {
      if (quick.type === 'proposal') setOpinionType('proposal');
      else if (quick.type === 'counter') setOpinionType('counter');
      else if (quick.type === 'clarify') setOpinionType('clarify');
      else if (quick.type === 'opinion') setOpinionType('opinion');
    }

    // Check active @mention token at tail
    const atIndex = val.lastIndexOf('@');
    const slashMatch = val.match(/(?:^|\s)(\/[a-zA-Z]*)$/);

    if (slashMatch) {
      setShowSlashSuggestions(true);
      setSlashFilter(slashMatch[1]);
      setSelectedSlashIndex(0);
      setShowMentionSuggestions(false);
      return;
    } else {
      setShowSlashSuggestions(false);
    }

    if (atIndex !== -1) {
      const query = val.slice(atIndex + 1);
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
        setInputText(`@${p.name}: `);
        setSelectedSpeakerId(p.id);
      } else {
        setInputText(`${prefix}@${p.name} `);
      }
    }
    setShowMentionSuggestions(false);
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const handleSelectSlashCommand = (cmd: string) => {
    if (cmd === '/bq') {
      setInputText('');
      setShowSlashSuggestions(false);
      onOpenVoteModal();
      return;
    }
    const nextText = inputText.replace(/(?:^|\s)\/[a-zA-Z]*$/, (match) => {
      const leadingSpace = match.startsWith(' ') ? ' ' : '';
      return `${leadingSpace}${cmd} `;
    });
    setInputText(nextText);
    setShowSlashSuggestions(false);
    if (cmd === '/dx') setOpinionType('proposal');
    if (cmd === '/pb') setOpinionType('counter');
    if (cmd === '/lr') setOpinionType('clarify');
    if (cmd === '/yk') setOpinionType('opinion');
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const handleSend = () => {
    if (readOnly || !inputText.trim()) return;

    const parsed = parseNoteInput(inputText, participants);

    if (parsed.type === 'decision') {
      if (!parsed.cleanedText) {
        toast.info('Vui lòng nhập nội dung quyết nghị sau lệnh /qd');
        return;
      }
      onCreateDecisionFromStream(parsed.cleanedText);
      toast.success('Đã cập nhật vào Quyết nghị chính thức');
      setInputText('');
      return;
    }

    if (parsed.type === 'action') {
      if (!parsed.cleanedText) {
        toast.info('Vui lòng nhập tên công việc sau lệnh /viec');
        return;
      }
      onCreateActionFromStream(parsed.cleanedText, parsed.mention, parsed.deadline);
      toast.success('Đã giao nhiệm vụ mới', parsed.cleanedText);
      setInputText('');
      return;
    }

    if (parsed.type === 'vote') {
      onOpenVoteModal();
      setInputText('');
      return;
    }

    let speakerId = selectedSpeakerId;
    let speakerName = participants.find((p) => p.id === selectedSpeakerId)?.name || 'Đại biểu';

    if (parsed.speakerOverride) {
      speakerName = parsed.speakerOverride.name;
      if (parsed.speakerOverride.id) {
        speakerId = parsed.speakerOverride.id;
        setSelectedSpeakerId(parsed.speakerOverride.id);
      }
    }

    if (!parsed.hasSubstantiveContent) {
      if (parsed.speakerOverride) {
        if (parsed.speakerOverride.id) {
          setSelectedSpeakerId(parsed.speakerOverride.id);
        }
        setInputText(`@${parsed.speakerOverride.name}: `);
        setTimeout(() => textareaRef.current?.focus(), 10);
        return;
      }
      toast.info(`Vui lòng nhập nội dung ý kiến phát biểu của ${speakerName}`);
      return;
    }

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
    setShowSlashSuggestions(false);
  };

  const handleFormalizeText = () => {
    if (!inputText.trim()) return;
    const parsed = parseNoteInput(inputText, participants);
    const speaker =
      parsed.speakerOverride?.name ||
      participants.find((p) => p.id === selectedSpeakerId)?.name ||
      'Đại biểu';
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
      formalized = `Giao cho Ông/Bà ${speaker} chủ trì thực hiện: ${cleanContent}${
        parsed.deadline ? ` trước ngày ${parsed.deadline}` : ''
      }.`;
    } else {
      formalized = `Ông/Bà ${speaker} phát biểu ý kiến: ${cleanContent}.`;
    }

    setInputText(formalized);
    toast.success('Đã chuẩn hóa văn phong Nghị định 30');
    setTimeout(() => textareaRef.current?.focus(), 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashSuggestions && filteredSlashCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex(
          (prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length
        );
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const target = filteredSlashCommands[selectedSlashIndex] || filteredSlashCommands[0];
        if (target) handleSelectSlashCommand(target.cmd);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashSuggestions(false);
        return;
      }
    }

    if (showMentionSuggestions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(
          (prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length
        );
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const target = filteredMentions[selectedSuggestionIndex] || filteredMentions[0];
        if (target) handleSelectMention(target);
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
      setShowSlashSuggestions(false);
    }
  };

  const getOpinionBadge = (type: OpinionType) => {
    switch (type) {
      case 'counter':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
            <Shield className="h-3 w-3" />
            <span>Phản biện</span>
          </span>
        );
      case 'proposal':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <Lightbulb className="h-3 w-3" />
            <span>Đề xuất</span>
          </span>
        );
      case 'clarify':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
            <HelpCircle className="h-3 w-3" />
            <span>Làm rõ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
            <MessageSquare className="h-3 w-3" />
            <span>Ý kiến</span>
          </span>
        );
    }
  };

  const renderOpinionContent = (content: string) => {
    const parts = content.split(/(@[\p{L}\w]+(?:\s+[\p{L}\w]+){0,2})/u);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={idx}
            className="mx-0.5 inline-flex items-center rounded border border-sky-200/80 bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-800"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#f8fafc]">
      {/* Top Banner for Current Topic */}
      <div className="flex items-center justify-between border-b border-slate-200/90 bg-[var(--surface-panel)] px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="mr-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-indigo-200/70 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Đang thảo luận Mục #{currentAgenda.order}
            </span>
            <span className="rounded border border-slate-200/80 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-slate-600">
              {currentAgenda.opinions.length} phát biểu
            </span>
          </div>
          <h1 className="mt-1 truncate text-sm font-bold text-slate-900">
            {currentAgenda.title}
          </h1>
          {currentAgenda.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
              {currentAgenda.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          aria-expanded={showHelper}
          className={`press-subtle flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            showHelper
              ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
              : 'border-amber-200/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70'
          }`}
        >
          <Zap className={`h-3.5 w-3.5 ${showHelper ? 'text-amber-200' : 'text-amber-600'}`} />
          <span className="hidden sm:inline">Lệnh gõ nhanh</span>
        </button>
      </div>

      {/* Helper Box */}
      {showHelper && (
        <div className="animate-in slide-in-from-top-1 border-b border-slate-200/80 bg-white p-3.5 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-5">
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
              <span className="font-bold text-slate-900">@tên</span>: Gán người nói
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
              <span className="font-bold text-slate-700">/yk</span>: Ý kiến
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
              <span className="font-bold text-amber-600">/dx</span>: Đề xuất
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
              <span className="font-bold text-rose-600">/pb</span>: Phản biện
            </div>
            <div className="rounded-lg border border-slate-200/70 bg-slate-50 p-2">
              <span className="font-bold text-sky-600">/lr</span>: Làm rõ
            </div>
          </div>
          <div className="mt-2.5 space-y-1 font-sans text-[11px] text-slate-500">
            <p className="flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                <strong>Kết hợp tự do:</strong> Ví dụ{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                  @Hà /dx bổ sung ngân sách
                </code>{' '}
                hoặc{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                  /qd Thống nhất phương án A
                </code>
                .
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <span>
                <strong>Giao việc tức thì:</strong>{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800">
                  /viec @Hà !thứ sáu nộp báo cáo
                </code>{' '}
                (Nhấn <kbd className="rounded border px-1 font-mono text-[10px]">Shift+Enter</kbd> để
                xuống dòng).
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Stream of Opinions */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {currentAgenda.opinions.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 py-16 text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <MessageSquare className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
            </div>
            <div className="max-w-sm space-y-1 text-center">
              <p className="text-xs font-semibold text-slate-700">
                Chưa có phát biểu nào cho mục nghị sự này
              </p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Gõ nội dung bên dưới rồi nhấn Enter. Bạn có thể gõ{' '}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-slate-700 border border-slate-200">
                  @
                </code>{' '}
                để chọn người phát biểu hoặc{' '}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-slate-700 border border-slate-200">
                  /
                </code>{' '}
                để mở bảng lệnh nhanh.
              </p>
            </div>
          </div>
        ) : (
          currentAgenda.opinions.map((op) => {
            const isEditingThis = editingOpinionId === op.id;
            const speakerObj = participants.find((p) => p.id === op.speakerId);
            const opinionMeta = OPINION_TYPE_META[op.type] || OPINION_TYPE_META.opinion;

            return (
              <div
                key={op.id}
                className={`group rounded-xl border border-slate-200/90 border-l-4 ${opinionMeta.borderLeftClass} bg-[var(--surface-panel)] p-3.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${getAvatarTone(
                        op.speakerName
                      )}`}
                    >
                      {getInitials(op.speakerName)}
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-semibold text-slate-900">
                        {op.speakerName}
                      </span>
                      {speakerObj?.title && (
                        <span className="hidden truncate text-[10px] text-slate-400 sm:inline">
                          · {speakerObj.title}
                        </span>
                      )}
                      {getOpinionBadge(op.type)}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {!readOnly && !isEditingThis && (
                      <div className="flex items-center gap-0.5 opacity-90 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            onCreateDecisionFromStream(op.content);
                            toast.success('Đã chốt ý kiến thành Quyết nghị');
                          }}
                          className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                          title="Chốt ý kiến này thành Quyết nghị chính thức"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                        </button>
                        {onOpenPrefilledAction && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPrefilledAction(op.content, speakerObj?.id || op.speakerId)
                            }
                            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-sky-50 hover:text-sky-700"
                            title="Tạo nhiệm vụ (Action Item) từ ý kiến này"
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onUpdateOpinion && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOpinionId(op.id);
                              setEditingText(op.content);
                              setEditingType(op.type);
                            }}
                            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            title="Chỉnh sửa nội dung phát biểu"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteOpinion && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteOpinion(currentAgenda.id, op.id);
                              toast.info('Đã xóa phát biểu khỏi luồng ghi chép');
                            }}
                            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Xóa phát biểu"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <span className="ml-1 font-mono text-[10px] text-slate-400">
                      {op.timestamp}
                    </span>
                  </div>
                </div>

                {isEditingThis ? (
                  <div className="mt-2 space-y-2 pl-8">
                    <div className="flex flex-wrap gap-1">
                      {(['opinion', 'proposal', 'counter', 'clarify'] as OpinionType[]).map((t) => {
                        const typeMeta = OPINION_TYPE_META[t];
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEditingType(t)}
                            className={`cursor-pointer rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              editingType === t
                                ? typeMeta.activePillClass
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {typeMeta.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      rows={2}
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (editingText.trim()) {
                            onUpdateOpinion?.(currentAgenda.id, op.id, {
                              content: editingText.trim(),
                              type: editingType,
                            });
                            setEditingOpinionId(null);
                            toast.success('Đã cập nhật nội dung phát biểu');
                          }
                        } else if (e.key === 'Escape') {
                          setEditingOpinionId(null);
                        }
                      }}
                      className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingOpinionId(null)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <X className="h-3 w-3" />
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editingText.trim()) return;
                          onUpdateOpinion?.(currentAgenda.id, op.id, {
                            content: editingText.trim(),
                            type: editingType,
                          });
                          setEditingOpinionId(null);
                          toast.success('Đã cập nhật nội dung phát biểu');
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                      >
                        <Check className="h-3 w-3" />
                        Lưu sửa
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap pl-8 text-xs leading-relaxed text-slate-700">
                    {renderOpinionContent(op.content)}
                  </p>
                )}
              </div>
            );
          })
        )}
        <div ref={streamBottomRef} />
      </div>

      {/* Slash Command Auto-suggestions Floating Dropdown */}
      {!readOnly && showSlashSuggestions && filteredSlashCommands.length > 0 && (
        <div className="animate-in zoom-in-95 z-20 mx-4 mb-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="mb-1 flex items-center justify-between border-b border-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <Command className="h-3 w-3" />
              Lệnh ghi chép nhanh (/)
            </span>
            <span className="font-normal lowercase">↑ ↓ chọn · Tab/Enter áp dụng</span>
          </div>
          {filteredSlashCommands.map((item, idx) => {
            const isSelected = idx === selectedSlashIndex;
            return (
              <button
                key={item.cmd}
                type="button"
                onClick={() => handleSelectSlashCommand(item.cmd)}
                onMouseEnter={() => setSelectedSlashIndex(idx)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : item.badge
                    }`}
                  >
                    {item.cmd}
                  </span>
                  <span className="truncate font-semibold">{item.label}</span>
                </div>
                <span
                  className={`hidden truncate text-[10px] sm:inline ${
                    isSelected ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Mention Auto-suggestions Floating Dropdown */}
      {!readOnly && showMentionSuggestions && filteredMentions.length > 0 && (
        <div className="animate-in zoom-in-95 z-20 mx-4 mb-2 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="mb-1 flex items-center justify-between border-b border-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
            <span>Chọn người phát biểu (@)</span>
            <span className="font-normal lowercase">Dùng ↑ ↓ và Tab/Enter</span>
          </div>
          {filteredMentions.map((p, idx) => {
            const isSelected = idx === selectedSuggestionIndex;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectMention(p)}
                onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 font-medium text-white shadow-2xs'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : getAvatarTone(p.name)
                    }`}
                  >
                    {getInitials(p.name)}
                  </span>
                  {p.name}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {p.title ||
                    (p.role === 'chairperson'
                      ? 'Chủ tọa'
                      : p.role === 'secretary'
                      ? 'Thư ký'
                      : 'Đại biểu')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Composer Box */}
      <div className="select-none border-t border-slate-200/90 bg-[var(--surface-panel)] p-3.5 shadow-[0_-4px_16px_-6px_rgba(15,23,42,0.05)]">
        {readOnly ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-center text-xs text-slate-500">
            Bạn đang ở chế độ xem (Thành viên) hoặc biên bản đã khóa — không thể thêm phát biểu mới.
          </div>
        ) : (
          <>
            {/* Controls row */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500">Người nói:</span>
                  <select
                    value={selectedSpeakerId}
                    onChange={(e) => setSelectedSpeakerId(e.target.value)}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {participants.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (
                        {p.role === 'chairperson'
                          ? 'Chủ tọa'
                          : p.role === 'secretary'
                          ? 'Thư ký'
                          : 'Đại biểu'}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type quick pills */}
                <div className="flex items-center gap-1">
                  {(['opinion', 'proposal', 'counter', 'clarify'] as OpinionType[]).map((t) => {
                    const typeMeta = OPINION_TYPE_META[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setOpinionType(t)}
                        className={`press-subtle cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                          opinionType === t
                            ? typeMeta.activePillClass
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        {typeMeta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span className="hidden text-[10px] text-slate-400 md:inline">
                Gõ <code className="font-mono text-indigo-600">@</code> chọn người ·{' '}
                <code className="font-mono text-indigo-600">/</code> chọn lệnh · Enter gửi
              </span>
            </div>

            {/* Auto-expanding Textarea */}
            <div className="relative flex items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Gõ nội dung phát biểu... (@tên, /dx, /pb, /qd, /viec !thứ sáu)"
                className="max-h-28 min-h-[38px] w-full resize-none rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 pl-3.5 pr-20 text-xs leading-relaxed text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
              <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleFormalizeText}
                  disabled={!inputText.trim()}
                  className="press-subtle cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-25"
                  title="Chuẩn hóa thành văn phong hành chính Nghị định 30"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="press-subtle cursor-pointer rounded-lg bg-indigo-600 p-1.5 text-white shadow-2xs transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-30"
                  title="Gửi ý kiến (Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
