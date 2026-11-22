import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { TEMPLATE_DEFINITIONS } from '../../data/templates';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import { GROUP_META, MEETING_STATUS_META } from '../../utils/uiHelpers';
import {
  Search,
  X,
  FileText,
  CheckSquare,
  PlusCircle,
  LayoutDashboard,
  FolderKanban,
  Edit3,
  FileSearch,
  BookOpen,
  Eye,
  Sparkles,
  FileCheck2,
  CornerDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: () => void;
  comfortMode: boolean;
  onToggleComfortMode: () => void;
}

interface PaletteEntry {
  id: string;
  section: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeClass?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenCreateModal,
  comfortMode,
  onToggleComfortMode,
}) => {
  const {
    meetings,
    setCurrentMeetingId,
    setActiveTab,
    previewMode,
    setPreviewMode,
    createMeeting,
    currentUser,
  } = useMeetingContext();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const qNorm = removeVietnameseDiacritics(query);
    const hasQuery = qNorm.length > 0;
    const result: PaletteEntry[] = [];

    const matches = (...fields: (string | undefined)[]) => {
      if (!hasQuery) return true;
      return fields.some((f) => f && removeVietnameseDiacritics(f).includes(qNorm));
    };

    // 1. Quick Actions & Navigation
    const quickActions: PaletteEntry[] = [
      ...(currentUser.role !== 'member'
        ? [
            {
              id: 'act-new-meeting',
              section: 'Thao tác nhanh',
              title: 'Khởi tạo cuộc họp mới',
              subtitle: 'Mở trình thiết lập 3 bước chuẩn Nghị định 30 & Luật DN',
              badge: 'Mới',
              badgeClass: 'bg-indigo-600 text-white',
              icon: <PlusCircle className="h-4 w-4 text-indigo-600" strokeWidth={1.75} />,
              onSelect: () => {
                onClose();
                onOpenCreateModal();
              },
            },
          ]
        : []),
      {
        id: 'act-comfort-mode',
        section: 'Thao tác nhanh',
        title: comfortMode
          ? 'Tắt chế độ Dịu mắt (Chuyển nền sáng chuẩn)'
          : 'Bật chế độ Dịu mắt (Giấy ấm chống mỏi)',
        subtitle: 'Điều chỉnh tông nền dịu nhẹ cho các phiên họp kéo dài',
        badge: comfortMode ? 'Đang bật' : 'Tùy chọn',
        badgeClass: comfortMode
          ? 'bg-amber-50 text-amber-800 border border-amber-200'
          : 'bg-slate-100 text-slate-600',
        icon: <Eye className="h-4 w-4 text-amber-600" strokeWidth={1.75} />,
        onSelect: () => {
          onToggleComfortMode();
          onClose();
        },
      },
      {
        id: 'act-toggle-preview-mode',
        section: 'Thao tác nhanh',
        title:
          previewMode === 'decree30'
            ? 'Chuyển xem bản Hiện đại'
            : 'Chuyển xem chuẩn Nghị định 30/2020/NĐ-CP',
        subtitle: 'Đổi nhanh thể thức trình bày biên bản khi xem trước & xuất file',
        icon:
          previewMode === 'decree30' ? (
            <Sparkles className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
          ) : (
            <FileCheck2 className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
          ),
        onSelect: () => {
          setPreviewMode(previewMode === 'decree30' ? 'modern' : 'decree30');
          onClose();
        },
      },
      {
        id: 'nav-dashboard',
        section: 'Điều hướng không gian',
        title: 'Tổng quan điều hành',
        subtitle: 'Số liệu tổng hợp, mẫu khởi tạo nhanh và việc trọng tâm',
        icon: <LayoutDashboard className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('dashboard');
          onClose();
        },
      },
      {
        id: 'nav-meetings',
        section: 'Điều hướng không gian',
        title: 'Kho biên bản cuộc họp',
        subtitle: `Tra cứu ${meetings.length} hồ sơ biên bản các nhóm A–E`,
        icon: <FolderKanban className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('meetings');
          onClose();
        },
      },
      {
        id: 'nav-live',
        section: 'Điều hướng không gian',
        title: 'Phòng ghi trực tiếp',
        subtitle: 'Ghi tốc ký 3 cột với lệnh /dx, /pb, /qd, /viec',
        icon: <Edit3 className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('live');
          onClose();
        },
      },
      {
        id: 'nav-preview',
        section: 'Điều hướng không gian',
        title: 'Duyệt, Ký & Xuất bản',
        subtitle: 'Xem trước trang A4, xuất PDF/Word, trích lục & so sánh phiên bản',
        icon: <FileSearch className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('preview');
          onClose();
        },
      },
      {
        id: 'nav-actions',
        section: 'Điều hướng không gian',
        title: 'Bảng việc & Giải trình',
        subtitle: 'Theo dõi tiến độ thực thi sau họp dạng Kanban & Danh sách',
        icon: <CheckSquare className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('actions');
          onClose();
        },
      },
      {
        id: 'nav-directory',
        section: 'Điều hướng không gian',
        title: 'Danh bạ Nhân sự, Nhóm họp & Cấu hình Đơn vị',
        subtitle: 'Quản lý tập trung đại biểu, nhóm họp 1 chạm, phòng họp và hồ sơ pháp nhân',
        icon: <BookOpen className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('directory');
          onClose();
        },
      },
      {
        id: 'nav-templates',
        section: 'Điều hướng không gian',
        title: 'Mở trình tạo nhanh (14 biểu mẫu chuẩn)',
        subtitle: 'Chọn khung cấu trúc pháp lý theo Luật Doanh nghiệp 2020 & NĐ 30',
        icon: <BookOpen className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          onClose();
          onOpenCreateModal();
        },
      },
    ];

    quickActions
      .filter((a) => matches(a.title, a.subtitle, a.section))
      .slice(0, hasQuery ? 5 : 4)
      .forEach((a) => result.push(a));

    // 2. Meetings
    const matchedMeetings = meetings.filter((m) =>
      matches(
        m.title,
        m.code,
        m.organization.name,
        m.typeName,
        ...m.agendaItems.map((ag) => `${ag.title} ${ag.decision?.content || ''}`)
      )
    );

    matchedMeetings.slice(0, hasQuery ? 6 : 4).forEach((m) => {
      const statusMeta = MEETING_STATUS_META[m.status] || MEETING_STATUS_META.draft;
      result.push({
        id: `mtg-${m.id}`,
        section: 'Biên bản cuộc họp',
        title: m.title,
        subtitle: `${m.code} · ${m.date} · Nhóm ${m.group}`,
        badge: statusMeta.shortLabel,
        badgeClass: statusMeta.badgeClass,
        icon: <FileText className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setCurrentMeetingId(m.id);
          setActiveTab(m.status === 'draft' ? 'live' : 'preview');
          onClose();
        },
      });
    });

    // 3. Action Items (show when searching, or top 2 pending when idle)
    const allActions = meetings.flatMap((m) =>
      m.agendaItems.flatMap((i) =>
        i.actionItems.map((act) => ({ ...act, meetingCode: m.code }))
      )
    );
    const matchedActions = allActions.filter((act) =>
      matches(act.title, act.ownerName, act.deliverable, act.meetingCode)
    );

    matchedActions.slice(0, hasQuery ? 5 : 2).forEach((act) => {
      result.push({
        id: `act-${act.id}`,
        section: 'Nhiệm vụ sau họp',
        title: act.title,
        subtitle: `${act.ownerName} · Hạn ${act.deadline} · ${act.meetingCode || ''}`,
        badge: act.status === 'completed' ? 'Hoàn thành' : 'Theo dõi',
        badgeClass:
          act.status === 'completed'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-600',
        icon: <CheckSquare className="h-4 w-4 text-slate-500" strokeWidth={1.75} />,
        onSelect: () => {
          setActiveTab('actions');
          onClose();
        },
      });
    });

    // 4. Templates (when searching)
    if (hasQuery) {
      TEMPLATE_DEFINITIONS.filter((t) =>
        matches(t.name, t.description, t.legalBasis, `nhom ${t.group}`)
      )
        .slice(0, 4)
        .forEach((tpl) => {
          result.push({
            id: `tpl-${tpl.id}`,
            section: 'Khởi tạo từ mẫu chuẩn',
            title: `Tạo nhanh: ${tpl.name}`,
            subtitle: `${tpl.legalBasis || `Nhóm ${tpl.group}`} · Mở ngay phòng ghi trực tiếp`,
            badge: `Nhóm ${tpl.group}`,
            badgeClass: GROUP_META[tpl.group]?.badgeClass || 'bg-slate-100 text-slate-700',
            icon: <BookOpen className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />,
            onSelect: () => {
              const created = createMeeting({
                title: `${tpl.name} - ${new Date().toLocaleDateString('vi-VN')}`,
                templateId: tpl.id,
                group: tpl.group,
                type: tpl.type,
                typeName: tpl.name,
              });
              setCurrentMeetingId(created.id);
              setActiveTab('live');
              onClose();
            },
          });
        });
    }

    return result;
  }, [
    query,
    meetings,
    comfortMode,
    previewMode,
    currentUser.role,
    onClose,
    onOpenCreateModal,
    onToggleComfortMode,
    setPreviewMode,
    setActiveTab,
    setCurrentMeetingId,
    createMeeting,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (entries.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % entries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + entries.length) % entries.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      entries[selectedIndex]?.onSelect();
    }
  };

  // Group entries by section preserving order
  const sections: { name: string; items: { entry: PaletteEntry; globalIndex: number }[] }[] = [];
  entries.forEach((entry, idx) => {
    let sec = sections.find((s) => s.name === entry.section);
    if (!sec) {
      sec = { name: entry.section, items: [] };
      sections.push(sec);
    }
    sec.items.push({ entry, globalIndex: idx });
  });

  return (
    <div
      className="no-print animate-backdrop-enter fixed inset-0 z-[65] flex items-start justify-center bg-slate-900/40 px-4 pt-[10vh] backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm và điều hướng nhanh"
    >
      <div
        className="animate-modal-enter w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm biên bản, nhiệm vụ, biểu mẫu hoặc lệnh nhanh (gõ không dấu cũng được)…"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              Xóa
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng bảng lệnh"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-2">
          {entries.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs font-medium text-slate-600">
                Không tìm thấy kết quả phù hợp với "{query}"
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Thử tìm theo mã biên bản (vd: HĐQT), tên người phụ trách hoặc tên biểu mẫu.
              </p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {sections.map((section) => (
                <div key={section.name}>
                  <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.name}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map(({ entry, globalIndex }) => {
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          data-index={globalIndex}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          onClick={entry.onSelect}
                          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                                isSelected
                                  ? 'border-white/20 bg-white/15 text-white [&_svg]:text-white'
                                  : 'border-slate-200/80 bg-slate-50'
                              }`}
                            >
                              {entry.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-xs font-semibold ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {entry.title}
                              </p>
                              {entry.subtitle && (
                                <p
                                  className={`truncate text-[11px] ${
                                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                                  }`}
                                >
                                  {entry.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {entry.badge && (
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : entry.badgeClass || 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {entry.badge}
                              </span>
                            )}
                            <ArrowUpRight
                              className={`h-3.5 w-3.5 ${
                                isSelected ? 'text-indigo-100' : 'text-slate-400'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer keyboard hints */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
                ↑ ↓
              </kbd>
              Di chuyển
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
                <CornerDownLeft className="h-2.5 w-2.5" />
              </kbd>
              Mở chọn
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
              Esc
            </kbd>
            Đóng
          </span>
        </div>
      </div>
    </div>
  );
};
