import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Meeting,
  ActionItem,
  Opinion,
  Decision,
  ValidationIssue,
  Participant,
  QuorumInfo,
} from '../types';
import { ApiService } from '../services/api';
import { validateMeeting } from '../utils/validation';
import { generateContentHash } from '../utils/hash';
import { INITIAL_MEETINGS } from '../data/mockData';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'chairperson' | 'secretary' | 'member' | 'admin';
  title: string;
  avatarUrl?: string;
  isGoogleAuth?: boolean;
}

const DEFAULT_USER: CurrentUser = {
  id: 'p1',
  name: 'Nguyễn Văn Hùng',
  email: 'hung.nguyen@vinacorp.vn',
  role: 'chairperson',
  title: 'Chủ tịch HĐQT',
  isGoogleAuth: false,
};

export function recalculateQuorum(meeting: Meeting, updatedParticipants: Participant[]): QuorumInfo | undefined {
  if (!meeting.quorum && meeting.group !== 'B') {
    return meeting.quorum;
  }

  const required = meeting.quorum?.requiredPercentage || (meeting.type === 'B2_HD_QUAN_TRI' ? 75 : meeting.type === 'B3_HD_THANH_VIEN' ? 65 : 50);

  if (meeting.type === 'B1_DH_CO_DONG') {
    const totalShares = meeting.quorum?.totalCapitalOrShares || updatedParticipants.reduce((sum, p) => sum + (p.sharesCount || 0), 0) || 100;
    const presentShares = updatedParticipants
      .filter((p) => p.status === 'present' || p.status === 'delegated')
      .reduce((sum, p) => sum + (p.sharesCount || 0), 0);
    const actualPercentage = totalShares > 0 ? Number(((presentShares / totalShares) * 100).toFixed(1)) : 0;
    return {
      requiredPercentage: required,
      actualPercentage,
      isMet: actualPercentage >= required,
      totalCapitalOrShares: totalShares,
      presentCapitalOrShares: presentShares,
    };
  }

  if (meeting.type === 'B3_HD_THANH_VIEN') {
    const totalCap = meeting.quorum?.totalCapitalOrShares || 100;
    const presentCap = updatedParticipants
      .filter((p) => p.status === 'present' || p.status === 'delegated')
      .reduce((sum, p) => sum + (p.capitalRatio || 0), 0);
    const actualPercentage = Number(presentCap.toFixed(1));
    return {
      requiredPercentage: required,
      actualPercentage,
      isMet: actualPercentage >= required,
      totalCapitalOrShares: totalCap,
      presentCapitalOrShares: presentCap,
    };
  }

  // B2_HD_QUAN_TRI or general
  const eligibleMembers = updatedParticipants.filter((p) => p.role !== 'guest');
  const totalCount = eligibleMembers.length || updatedParticipants.length || 1;
  const presentCount = eligibleMembers.filter((p) => p.status === 'present' || p.status === 'delegated').length;
  const actualPercentage = Number(((presentCount / totalCount) * 100).toFixed(1));

  return {
    requiredPercentage: required,
    actualPercentage,
    isMet: actualPercentage >= required,
    totalCapitalOrShares: totalCount,
    presentCapitalOrShares: presentCount,
  };
}

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
  isLoadingDb: boolean;
  
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
  refreshFromDatabase: () => Promise<void>;
  
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
  addParticipant: (meetingId: string, participant: Omit<Participant, 'id'>) => Participant;
  removeParticipant: (meetingId: string, participantId: string) => void;
  updateParticipant: (meetingId: string, participantId: string, updates: Partial<Participant>) => void;
  batchUpdateAttendance: (meetingId: string, participants: Participant[]) => void;

  // Guest & Demo Sandbox Management
  isGuest: boolean;
  isDemoActive: boolean;
  clearAllDemoData: () => void;
  restoreDemoData: () => void;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved Google User from LocalStorage if present
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    try {
      const savedGoogle = localStorage.getItem('minutely_google_user');
      if (savedGoogle) {
        return JSON.parse(savedGoogle);
      }
    } catch {}
    return DEFAULT_USER;
  });

  const isGuest = !currentUser.isGoogleAuth;
  const [isDemoActive, setIsDemoActive] = useState<boolean>(() => {
    return localStorage.getItem('minutely_cleared_demo') !== 'true';
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    if (localStorage.getItem('minutely_cleared_demo') === 'true') {
      return [];
    }
    return INITIAL_MEETINGS;
  });
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(() => {
    if (localStorage.getItem('minutely_cleared_demo') === 'true') {
      return null;
    }
    return INITIAL_MEETINGS[0]?.id || null;
  });
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'live' | 'actions' | 'templates' | 'preview'>('dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [previewMode, setPreviewMode] = useState<'decree30' | 'modern'>('decree30');

  // Load real meetings from Supabase PostgreSQL Database on mount
  const refreshFromDatabase = async () => {
    try {
      setIsLoadingDb(true);
      const dbMeetings = await ApiService.getMeetings();
      if (dbMeetings && dbMeetings.length > 0) {
        setMeetings(dbMeetings);
        if (!currentMeetingId) {
          setCurrentMeetingId(dbMeetings[0].id);
        }
      } else {
        // Fallback to rich initial meetings if database has no rows and user hasn't explicitly cleared demo
        if (localStorage.getItem('minutely_cleared_demo') !== 'true') {
          setMeetings((prev) => (prev.length > 0 ? prev : INITIAL_MEETINGS));
          if (!currentMeetingId && INITIAL_MEETINGS.length > 0) {
            setCurrentMeetingId(INITIAL_MEETINGS[0].id);
          }
        } else {
          setMeetings([]);
        }
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu từ database thật, sử dụng dữ liệu mẫu:', err);
      if (localStorage.getItem('minutely_cleared_demo') !== 'true') {
        setMeetings((prev) => (prev.length > 0 ? prev : INITIAL_MEETINGS));
      }
    } finally {
      setIsLoadingDb(false);
    }
  };

  const clearAllDemoData = () => {
    localStorage.setItem('minutely_cleared_demo', 'true');
    setIsDemoActive(false);
    setMeetings([]);
    setCurrentMeetingId(null);
  };

  const restoreDemoData = () => {
    localStorage.removeItem('minutely_cleared_demo');
    setIsDemoActive(true);
    setMeetings(INITIAL_MEETINGS);
    setCurrentMeetingId(INITIAL_MEETINGS[0]?.id || null);
  };

  useEffect(() => {
    refreshFromDatabase();
  }, []);

  const currentMeeting = meetings.find((m) => m.id === currentMeetingId) || (meetings.length > 0 ? meetings[0] : null);

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
      auditLogs: [],
    };

    // Optimistic state update
    setMeetings((prev) => [newMeeting, ...prev]);
    setCurrentMeetingId(newMeeting.id);

    // Save to real PostgreSQL Database in background
    ApiService.createMeeting(newMeeting).then((savedRes) => {
      if (savedRes?.id) {
        setMeetings((prev) =>
          prev.map((m) => (m.id === newId ? { ...m, id: savedRes.id } : m))
        );
        setCurrentMeetingId(savedRes.id);
      }
    }).catch((e) => console.warn('Error saving meeting to DB:', e));

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

    // Sync updates to real database
    ApiService.updateMeeting(id, updates);
  };

  const deleteMeeting = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (currentMeetingId === id) {
      setCurrentMeetingId(meetings.find((m) => m.id !== id)?.id || null);
    }
    // Delete from real database
    ApiService.deleteMeeting(id);
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
      auditLogs: [],
    };

    setMeetings((prev) => [copy, ...prev]);
    setCurrentMeetingId(copyId);
    ApiService.createMeeting(copy);
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
    });
  };

  const rejectMeeting = (id: string, reason: string) => {
    updateMeeting(id, {
      status: 'draft',
      rejectionReason: reason,
    });
  };

  const publishMeeting = (id: string) => {
    updateMeeting(id, {
      status: 'published',
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
      auditLogs: [],
    };

    setMeetings((prev) => [revised, ...prev]);
    setCurrentMeetingId(revId);
    ApiService.createMeeting(revised);
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

        const updatedAgenda = m.agendaItems.map((item) => {
          if (actionData.agendaItemId && item.id === actionData.agendaItemId) {
            return {
              ...item,
              actionItems: [...item.actionItems, newAction],
            };
          }
          return item;
        });

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

  const addParticipant = (meetingId: string, participantData: Omit<Participant, 'id'>): Participant => {
    const newId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newParticipant: Participant = {
      ...participantData,
      id: newId,
    };

    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updated = [...m.participants, newParticipant];
        const newQuorum = recalculateQuorum(m, updated);
        return {
          ...m,
          participants: updated,
          quorum: newQuorum,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    return newParticipant;
  };

  const removeParticipant = (meetingId: string, participantId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updated = m.participants.filter((p) => p.id !== participantId);
        const newQuorum = recalculateQuorum(m, updated);
        return {
          ...m,
          participants: updated,
          quorum: newQuorum,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const updateParticipant = (meetingId: string, participantId: string, updates: Partial<Participant>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updated = m.participants.map((p) => {
          if (p.id !== participantId) return p;
          return { ...p, ...updates };
        });
        const newQuorum = recalculateQuorum(m, updated);
        return {
          ...m,
          participants: updated,
          quorum: newQuorum,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const batchUpdateAttendance = (meetingId: string, updatedParticipants: Participant[]) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const newQuorum = recalculateQuorum(m, updatedParticipants);
        return {
          ...m,
          participants: updatedParticipants,
          quorum: newQuorum,
          updatedAt: new Date().toISOString(),
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
        isLoadingDb,
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
        refreshFromDatabase,
        submitForReview,
        approveMeeting,
        rejectMeeting,
        publishMeeting,
        createRevision,
        addOpinion,
        updateDecision,
        addActionItem,
        updateActionItem,
        addParticipant,
        removeParticipant,
        updateParticipant,
        batchUpdateAttendance,
        isGuest,
        isDemoActive,
        clearAllDemoData,
        restoreDemoData,
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
