import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Meeting,
  ActionItem,
  Opinion,
  Decision,
  ValidationIssue,
  Participant,
} from '../types';
import { INITIAL_MEETINGS } from '../data/mockData';
import { validateMeeting } from '../utils/validation';
import { generateContentHash } from '../utils/hash';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'chairperson' | 'secretary' | 'member' | 'admin';
  title: string;
}

const DEFAULT_USER: CurrentUser = {
  id: 'p1',
  name: 'Nguyễn Văn Hùng',
  email: 'hung.nguyen@vinacorp.vn',
  role: 'chairperson',
  title: 'Chủ tịch HĐQT',
};

interface MeetingContextType {
  meetings: Meeting[];
  currentMeetingId: string | null;
  currentMeeting: Meeting | null;
  activeTab: 'dashboard' | 'meetings' | 'live' | 'actions' | 'templates' | 'preview';
  currentUser: CurrentUser;
  searchQuery: string;
  selectedGroupFilter: string;
  selectedStatusFilter: string;
  previewMode: 'decree30' | 'modern';
  
  // Setters
  setCurrentMeetingId: (id: string | null) => void;
  setActiveTab: (tab: 'dashboard' | 'meetings' | 'live' | 'actions' | 'templates' | 'preview') => void;
  setCurrentUser: (user: CurrentUser) => void;
  setSearchQuery: (q: string) => void;
  setSelectedGroupFilter: (group: string) => void;
  setSelectedStatusFilter: (status: string) => void;
  setPreviewMode: (mode: 'decree30' | 'modern') => void;

  // Actions
  createMeeting: (newMeetingData: Partial<Meeting>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  duplicateMeeting: (id: string) => Meeting;
  
  // Workflow
  submitForReview: (id: string) => { success: boolean; issues: ValidationIssue[] };
  approveMeeting: (id: string, approverName: string) => void;
  rejectMeeting: (id: string, reason: string) => void;
  publishMeeting: (id: string) => void;
  createRevision: (id: string, reason: string) => Meeting;

  // Live Note & Minutes Helpers
  addOpinion: (meetingId: string, agendaItemId: string, opinion: Omit<Opinion, 'id' | 'timestamp'>) => void;
  updateDecision: (meetingId: string, agendaItemId: string, decision: Partial<Decision>) => void;
  addActionItem: (actionItem: Omit<ActionItem, 'id'>) => void;
  updateActionItem: (actionId: string, updates: Partial<ActionItem>) => void;
  updateParticipant: (meetingId: string, participantId: string, updates: Partial<Participant>) => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

const STORAGE_KEY = 'minutely_meetings_v1';

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load meetings from localStorage', e);
    }
    return INITIAL_MEETINGS;
  });

  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(
    INITIAL_MEETINGS[0].id
  );
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'live' | 'actions' | 'templates' | 'preview'>('dashboard');
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEFAULT_USER);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [previewMode, setPreviewMode] = useState<'decree30' | 'modern'>('decree30');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
    } catch (e) {
      console.error('Failed to save meetings to localStorage', e);
    }
  }, [meetings]);

  const currentMeeting = meetings.find((m) => m.id === currentMeetingId) || null;

  const createMeeting = (newMeetingData: Partial<Meeting>): Meeting => {
    const newId = `mtg-${Date.now()}`;
    const newMeeting: Meeting = {
      id: newId,
      code: newMeetingData.code || `${String(meetings.length + 1).padStart(2, '0')}/${new Date().getFullYear()}/BB`,
      title: newMeetingData.title || 'Biên bản cuộc họp mới',
      templateId: newMeetingData.templateId || 'tpl-a1',
      group: newMeetingData.group || 'A',
      type: newMeetingData.type || 'A1_GIAO_BAN',
      typeName: newMeetingData.typeName || 'Họp Giao Ban',
      organization: newMeetingData.organization || {
        name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
        department: 'Văn phòng',
      },
      locationCity: newMeetingData.locationCity || 'Hà Nội',
      date: newMeetingData.date || new Date().toISOString().split('T')[0],
      startTime: newMeetingData.startTime || '09:00',
      endTime: newMeetingData.endTime || '10:30',
      venue: newMeetingData.venue || 'Phòng họp chính',
      meetingMode: newMeetingData.meetingMode || 'offline',
      meetingUrl: newMeetingData.meetingUrl || '',
      participants: newMeetingData.participants || [
        {
          id: `p-${Date.now()}-1`,
          name: currentUser.name,
          email: currentUser.email,
          role: 'chairperson',
          title: currentUser.title,
          status: 'present',
        },
        {
          id: `p-${Date.now()}-2`,
          name: 'Trần Thị Thu Hà',
          email: 'ha.tran@vinacorp.vn',
          role: 'secretary',
          title: 'Thư ký cuộc họp',
          status: 'present',
        },
      ],
      agendaItems: newMeetingData.agendaItems || [
        {
          id: `ag-${Date.now()}-1`,
          order: 1,
          title: 'Nội dung thảo luận 1',
          description: 'Mô tả vấn đề cần thảo luận và biểu quyết',
          durationMinutes: 30,
          opinions: [],
          decision: {
            id: `dec-${Date.now()}-1`,
            agendaItemId: `ag-${Date.now()}-1`,
            content: 'Thống nhất chủ trương thực hiện',
            status: 'agreed',
            thresholdPercent: 50,
          },
          actionItems: [],
        },
      ],
      signatures: [
        {
          role: 'chairperson',
          roleTitle: 'CHỦ TỌA CUỘC HỌP',
          signerName: currentUser.name,
          refused: false,
          signatureType: 'electronic_confirm',
        },
        {
          role: 'secretary',
          roleTitle: 'THƯ KÝ GHI BIÊN BẢN',
          signerName: 'Trần Thị Thu Hà',
          refused: false,
          signatureType: 'electronic_confirm',
        },
      ],
      distribution: {
        forAction: ['Các phòng ban liên quan'],
        forInfo: ['Ban Lãnh đạo', 'Lưu Văn thư'],
      },
      status: 'draft',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Tạo mới cuộc họp',
          details: 'Khởi tạo bản nháp biên bản',
        },
      ],
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    setCurrentMeetingId(newMeeting.id);
    return newMeeting;
  };

  const updateMeeting = (id: string, updates: Partial<Meeting>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (currentMeetingId === id) {
      setCurrentMeetingId(meetings.find((m) => m.id !== id)?.id || null);
    }
  };

  const duplicateMeeting = (id: string): Meeting => {
    const source = meetings.find((m) => m.id === id);
    if (!source) throw new Error('Không tìm thấy cuộc họp gốc');

    const copyId = `mtg-${Date.now()}`;
    const copy: Meeting = {
      ...source,
      id: copyId,
      code: `${source.code}-BẢN_SAO`,
      title: `${source.title} (Bản sao)`,
      status: 'draft',
      version: '1.0',
      contentHash: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Nhân bản từ cuộc họp',
          details: `Sao chép từ cuộc họp ${source.title} (${source.code})`,
        },
      ],
    };

    setMeetings((prev) => [copy, ...prev]);
    setCurrentMeetingId(copyId);
    return copy;
  };

  // Workflow Handlers
  const submitForReview = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return { success: false, issues: [] };

    const validation = validateMeeting(target);
    if (!validation.isValid) {
      return { success: false, issues: validation.blockers };
    }

    updateMeeting(id, {
      status: 'pending_review',
      auditLogs: [
        ...target.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Gửi duyệt biên bản',
          details: 'Đã hoàn thiện các khối bắt buộc và chuyển Chủ tọa phê duyệt.',
        },
      ],
    });

    return { success: true, issues: validation.warnings };
  };

  const approveMeeting = (id: string, approverName: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;

    const hash = generateContentHash(JSON.stringify(target));
    updateMeeting(id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: approverName,
      contentHash: hash,
      auditLogs: [
        ...target.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: approverName,
          action: 'Phê duyệt & Khóa biên bản',
          details: `Chủ tọa đã ký duyệt. Mã xác thực toàn vẹn: ${hash}`,
        },
      ],
    });
  };

  const rejectMeeting = (id: string, reason: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;

    updateMeeting(id, {
      status: 'draft',
      rejectionReason: reason,
      auditLogs: [
        ...target.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Trả lại biên bản (Yêu cầu chỉnh sửa)',
          details: `Lý do trả lại: ${reason}`,
        },
      ],
    });
  };

  const publishMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;

    updateMeeting(id, {
      status: 'published',
      auditLogs: [
        ...target.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Phát hành chính thức',
          details: 'Đã gửi bản chính thức tới các nơi nhận theo phân phối.',
        },
      ],
    });
  };

  const createRevision = (id: string, reason: string): Meeting => {
    const source = meetings.find((m) => m.id === id);
    if (!source) throw new Error('Meeting not found');

    const currentMajor = parseInt(source.version.split('.')[0], 10) || 1;
    const nextVersion = `${currentMajor + 1}.0`;
    const revId = `mtg-rev-${Date.now()}`;

    const revised: Meeting = {
      ...source,
      id: revId,
      version: nextVersion,
      status: 'draft',
      previousVersionId: source.id,
      contentHash: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        ...source.auditLogs,
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: `Tạo phiên bản sửa đổi ${nextVersion}`,
          details: `Lý do sửa đổi: ${reason}`,
        },
      ],
    };

    setMeetings((prev) => [revised, ...prev]);
    setCurrentMeetingId(revId);
    return revised;
  };

  // Live Note & Action Helpers
  const addOpinion = (meetingId: string, agendaItemId: string, opinionData: Omit<Opinion, 'id' | 'timestamp'>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const newOpinion: Opinion = {
          ...opinionData,
          id: `op-${Date.now()}`,
          timestamp: timeStr,
        };

        const updatedAgenda = m.agendaItems.map((item) => {
          if (item.id !== agendaItemId) return item;
          return {
            ...item,
            opinions: [...item.opinions, newOpinion],
          };
        });

        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateDecision = (meetingId: string, agendaItemId: string, decisionUpdates: Partial<Decision>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;

        const updatedAgenda = m.agendaItems.map((item) => {
          if (item.id !== agendaItemId) return item;
          const currentDec = item.decision || {
            id: `dec-${Date.now()}`,
            agendaItemId,
            content: '',
            status: 'agreed',
            thresholdPercent: 50,
          };

          return {
            ...item,
            decision: {
              ...currentDec,
              ...decisionUpdates,
            },
          };
        });

        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addActionItem = (actionData: Omit<ActionItem, 'id'>) => {
    const newAction: ActionItem = {
      ...actionData,
      id: `act-${Date.now()}`,
    };

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== actionData.meetingId) return m;

        // If agendaItemId provided, put in that agenda item
        const updatedAgenda = m.agendaItems.map((item) => {
          if (actionData.agendaItemId && item.id === actionData.agendaItemId) {
            return {
              ...item,
              actionItems: [...item.actionItems, newAction],
            };
          }
          return item;
        });

        // If no agenda item matches or none specified, attach to first item
        if (!actionData.agendaItemId && updatedAgenda.length > 0) {
          updatedAgenda[0].actionItems = [...updatedAgenda[0].actionItems, newAction];
        }

        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateActionItem = (actionId: string, updates: Partial<ActionItem>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        let modified = false;
        const updatedAgenda = m.agendaItems.map((item) => {
          const hasAction = item.actionItems.some((a) => a.id === actionId);
          if (!hasAction) return item;
          modified = true;
          return {
            ...item,
            actionItems: item.actionItems.map((a) => {
              if (a.id !== actionId) return a;
              return {
                ...a,
                ...updates,
                completedAt: updates.status === 'completed' ? new Date().toISOString().split('T')[0] : a.completedAt,
              };
            }),
          };
        });

        if (!modified) return m;
        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateParticipant = (meetingId: string, participantId: string, updates: Partial<Participant>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        return {
          ...m,
          participants: m.participants.map((p) => {
            if (p.id !== participantId) return p;
            return { ...p, ...updates };
          }),
        };
      })
    );
  };

  return (
    <MeetingContext.Provider
      value={{
        meetings,
        currentMeetingId,
        currentMeeting,
        activeTab,
        currentUser,
        searchQuery,
        selectedGroupFilter,
        selectedStatusFilter,
        previewMode,
        setCurrentMeetingId,
        setActiveTab,
        setCurrentUser,
        setSearchQuery,
        setSelectedGroupFilter,
        setSelectedStatusFilter,
        setPreviewMode,
        createMeeting,
        updateMeeting,
        deleteMeeting,
        duplicateMeeting,
        submitForReview,
        approveMeeting,
        rejectMeeting,
        publishMeeting,
        createRevision,
        addOpinion,
        updateDecision,
        addActionItem,
        updateActionItem,
        updateParticipant,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetingContext = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeetingContext must be used within a MeetingProvider');
  }
  return context;
};
