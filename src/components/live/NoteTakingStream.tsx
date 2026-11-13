import React, { useState, useRef, useEffect } from 'react';
import { AgendaItem, Participant, OpinionType } from '../../types';
import { parseNoteInput } from '../../utils/dateParser';
import {
  MessageSquare,
  Send,
  HelpCircle,
  Shield,
  Lightbulb,
  CheckCircle,
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const getOpinionBadge = (type: OpinionType) => {
    switch (type) {
      case 'counter':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Shield className="w-3 h-3" />
            <span>Phản biện</span>
          </span>
        );
      case 'proposal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Lightbulb className="w-3 h-3" />
            <span>Đề xuất</span>
          </span>
        );
      case 'clarify':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <HelpCircle className="w-3 h-3" />
            <span>Làm rõ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <MessageSquare className="w-3 h-3" />
            <span>Ý kiến</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Banner for Current Topic */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Đang thảo luận Mục #{currentAgenda.order}
          </span>
          <h1 className="text-base font-bold text-white truncate mt-0.5">
            {currentAgenda.title}
          </h1>
          {currentAgenda.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{currentAgenda.description}</p>
          )}
        </div>

        {/* Quick Helper Trigger */}
        <button
          onClick={() => setShowHelper(!showHelper)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 transition-colors shrink-0 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Phím tắt & Lệnh gõ nhanh</span>
        </button>
      </div>

      {/* Helper Box if toggled */}
      {showHelper && (
        <div className="bg-slate-900 border-b border-indigo-500/30 p-3 text-xs text-slate-300 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-indigo-400 font-bold">@tên</span>: Gán người phát biểu
            </div>
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-rose-400 font-bold">/pb</span>: Đổi sang Phản biện
            </div>
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-amber-400 font-bold">/dx</span>: Đổi sang Đề xuất
            </div>
            <div className="bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="text-emerald-400 font-bold">/viec !thứ sáu</span>: Tạo action
            </div>
          </div>
        </div>
      )}

      {/* Stream of Opinions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentAgenda.opinions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 py-12">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-slate-600" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-sm font-semibold text-slate-400">Chưa có ý kiến nào được ghi</p>
              <p className="text-xs text-slate-600 mt-1">
                Gõ nội dung bên dưới và nhấn Enter. Hỗ trợ cú pháp @tên, /pb, /dx, /viec, !thứ sáu.
              </p>
            </div>
          </div>
        ) : (
          currentAgenda.opinions.map((op) => (
            <div
              key={op.id}
              className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 hover:border-slate-700 transition-colors shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">{op.speakerName}</span>
                  {getOpinionBadge(op.type)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{op.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8 whitespace-pre-wrap">
                {op.content}
              </p>
            </div>
          ))
        )}
        <div ref={streamBottomRef} />
      </div>

      {/* Input Box with Slash Controls */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        {/* Controls row: Speaker & Type buttons */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Speaker select */}
          <select
            value={selectedSpeakerId}
            onChange={(e) => setSelectedSpeakerId(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
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
            placeholder="Nhập nội dung... (Gõ @tên, /pb, /dx, /viec, !thứ sáu, /qd để ghi nhanh)"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
