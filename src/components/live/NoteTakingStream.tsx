import React, { useState, useRef, useEffect } from 'react';
import { AgendaItem, Participant, OpinionType } from '../../types';
import { parseNoteInput } from '../../utils/dateParser';
import {
  MessageSquare,
  Send,
  HelpCircle,
  Shield,
  Lightbulb,
  User,
  Zap,
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
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    participants[0]?.id || ''
  );
  const [opinionType, setOpinionType] = useState<OpinionType>('opinion');
  const [showHelper, setShowHelper] = useState(false);
  const streamBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentAgenda.opinions.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const parsed = parseNoteInput(inputText);

    // If slash command is decision
    if (parsed.type === 'decision') {
      onCreateDecisionFromStream(parsed.cleanedText);
      setInputText('');
      return;
    }

    // If slash command is action
    if (parsed.type === 'action') {
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

    // Regular opinion with potential overridden type
    const finalType: OpinionType =
      parsed.type === 'counter' || parsed.type === 'proposal' || parsed.type === 'clarify'
        ? parsed.type
        : opinionType;

    // Detect speaker from @mention if present
    let speakerId = selectedSpeakerId;
    let speakerName = participants.find((p) => p.id === selectedSpeakerId)?.name || 'Đại biểu';

    if (parsed.mention) {
      const matched = participants.find((p) =>
        p.name.toLowerCase().includes(parsed.mention!.toLowerCase())
      );
      if (matched) {
        speakerId = matched.id;
        speakerName = matched.name;
      }
    }

    onAddOpinion(currentAgenda.id, {
      speakerId,
      speakerName,
      type: finalType,
      content: parsed.cleanedText,
    });

    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-slate-900 font-bold">@tên</span>: Gán người nói
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-rose-600 font-bold">/pb</span>: Phản biện
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-amber-600 font-bold">/dx</span>: Đề xuất
            </div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/70">
              <span className="text-emerald-600 font-bold">/viec !thứ sáu</span>: Giao việc
            </div>
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
                Gõ nội dung bên dưới và nhấn Enter. Hỗ trợ cú pháp @tên, /pb, /dx, /viec.
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
                {op.content}
              </p>
            </div>
          ))
        )}
        <div ref={streamBottomRef} />
      </div>

      {/* Input Box with Slash Controls */}
      <div className="p-3.5 border-t border-slate-200/80 bg-white select-none">
        {/* Controls row: Speaker & Type buttons */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Speaker select */}
          <select
            value={selectedSpeakerId}
            onChange={(e) => setSelectedSpeakerId(e.target.value)}
            className="bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role === 'chairperson' ? 'Chủ tọa' : p.role === 'secretary' ? 'Thư ký' : 'Đại biểu'})
              </option>
            ))}
          </select>

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

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập nội dung... (Gõ @tên, /pb, /dx, /viec, !thứ sáu để ghi nhanh)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all pr-10"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-white transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
