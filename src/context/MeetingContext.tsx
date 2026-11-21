import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Meeting,
  ActionItem,
  Opinion,
  Decision,
  ValidationIssue,
  Participant,
  QuorumInfo,
  AgendaItem,
} from '../types';
import { ApiService } from '../services/api';
import { validateMeeting } from '../utils/validation';
import { generateContentHash } from '../utils/hash';
import { INITIAL_MEETINGS } from '../data/mockData';
import { useToast } from './ToastContext';

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

  const required =
    meeting.quorum?.requiredPercentage ||
    (meeting.type === 'B2_HD_QUAN_TRI' ? 75 : meeting.type === 'B3_HD_THANH_VIEN' ? 65 : 50);

  if (meeting.type === 'B1_DH_CO_DONG') {
    const totalShares =
      meeting.quorum?.totalCapitalOrShares ||
      updatedParticipants.reduce((sum, p) => sum + (p.sharesCount || 0), 0) ||
      100;
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
  createMeeting: (newMeetingData: Partial<Meeting>, carryOverActions?: boolean) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  duplicateMeeting: (id: string) => Meeting;
  refreshFromDatabase: () => Promise<void>;

  // Workflow
  submitForReview: (id: string) => { success: boolean; issues: ValidationIssue[] };
  approveMeeting: (
    id: string,
    approverName: string,
    signatureType?: 'digital_cert' | 'electronic_confirm' | 'wet_scan'
  ) => void;
  rejectMeeting: (id: string, reason: string) => void;
  publishMeeting: (id: string) => void;
  archiveMeeting: (id: string) => void;
  markAsInquorateMinutes: (id: string) => void;
  createRevision: (id: string, reason: string) => Meeting;

  // Agenda CRUD
  updateAgendaItem: (meetingId: string, agendaItemId: string, updates: Partial<AgendaItem>) => void;
  deleteAgendaItem: (meetingId: string, agendaItemId: string) => void;
  reorderAgendaItem: (meetingId: string, agendaItemId: string, direction: 'up' | 'down') => void;

  // Live Note & Minutes Helpers
  addOpinion: (meetingId: string, agendaItemId: string, opinion: Omit<Opinion, 'id' | 'timestamp'>) => void;
  updateOpinion: (meetingId: string, agendaItemId: string, opinionId: string, updates: Partial<Opinion>) => void;
  deleteOpinion: (meetingId: string, agendaItemId: string, opinionId: string) => void;
  updateDecision: (meetingId: string, agendaItemId: string, decision: Partial<Decision>) => void;
  addActionItem: (actionItem: Omit<ActionItem, 'id'>) => void;
  updateActionItem: (actionId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (actionId: string) => void;
  postponeActionItem: (actionId: string, newDeadline: string, reason: string) => void;
  addParticipant: (meetingId: string, participant: Omit<Participant, 'id'>) => Participant;
  removeParticipant: (meetingId: string, participantId: string) => void;
  updateParticipant: (meetingId: string, participantId: string, updates: Partial<Participant>) => void;
  batchUpdateAttendance: (meetingId: string, participants: Participant[]) => void;

  // Guest & Demo Sandbox Management
  isGuest: boolean;
  isDemoActive: boolean;
  clearAllDemoData: () => void;
  restoreDemoData: () => void;
  copyCurrentMeetingLink: () => boolean;
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
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

  const STORAGE_KEY = 'minutely_meetings';

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu cuộc họp từ localStorage:', e);
    }
    if (localStorage.getItem('minutely_cleared_demo') === 'true') {
      return [];
    }
    return INITIAL_MEETINGS;
  });

  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('id');
      if (idFromUrl) return idFromUrl;
    } catch {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch {}

    if (localStorage.getItem('minutely_cleared_demo') === 'true') {
      return null;
    }
    return INITIAL_MEETINGS[0]?.id || null;
  });

  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meetings' | 'live' | 'actions' | 'templates' | 'preview'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get('tab') as any;
      const validTabs = ['dashboard', 'meetings', 'live', 'actions', 'templates', 'preview'];
      if (tabFromUrl && validTabs.includes(tabFromUrl)) {
        return tabFromUrl;
      }
      const pathSeg = window.location.pathname.replace(/^\//, '').split('/')[0];
      if (pathSeg && validTabs.includes(pathSeg)) {
        return pathSeg as any;
      }
    } catch {}
    return 'dashboard';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [previewMode, setPreviewMode] = useState<'decree30' | 'modern'>('decree30');

  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabFromUrl = urlParams.get('tab') as any;
        const idFromUrl = urlParams.get('id');
        const validTabs = ['dashboard', 'meetings', 'live', 'actions', 'templates', 'preview'];

        let targetTab = tabFromUrl;
        if (!targetTab) {
          const pathSeg = window.location.pathname.replace(/^\//, '').split('/')[0];
          if (validTabs.includes(pathSeg)) {
            targetTab = pathSeg;
          }
        }

        if (targetTab && validTabs.includes(targetTab)) {
          setActiveTab(targetTab);
        }
        if (idFromUrl) {
          setCurrentMeetingId(idFromUrl);
        }
      } catch {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
    } catch (e) {
      console.warn('Không thể lưu meetings vào localStorage:', e);
    }
  }, [meetings]);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const currentTab = url.searchParams.get('tab');
      const currentId = url.searchParams.get('id');

      let changed = false;
      if (currentTab !== activeTab) {
        url.searchParams.set('tab', activeTab);
        changed = true;
      }

      if (currentMeetingId && (activeTab === 'live' || activeTab === 'preview')) {
        if (currentId !== currentMeetingId) {
          url.searchParams.set('id', currentMeetingId);
          changed = true;
        }
      } else if (currentId && activeTab !== 'live' && activeTab !== 'preview') {
        url.searchParams.delete('id');
        changed = true;
      }

      if (changed) {
        window.history.pushState({ tab: activeTab, id: currentMeetingId }, '', url.toString());
      }
    } catch {}
  }, [activeTab, currentMeetingId]);

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
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved && localStorage.getItem('minutely_cleared_demo') !== 'true') {
          setMeetings(INITIAL_MEETINGS);
          if (!currentMeetingId && INITIAL_MEETINGS.length > 0) {
            setCurrentMeetingId(INITIAL_MEETINGS[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi tải dữ liệu từ database thật, sử dụng dữ liệu cục bộ:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  const clearAllDemoData = () => {
    localStorage.setItem('minutely_cleared_demo', 'true');
    setIsDemoActive(false);
    setMeetings((prev) => {
      const nonSampleMeetings = prev.filter((m) => !m.isSample);
      if (currentMeetingId && prev.find((m) => m.id === currentMeetingId)?.isSample) {
        setCurrentMeetingId(nonSampleMeetings[0]?.id || null);
      }
      return nonSampleMeetings;
    });
    toast.info('Đã ẩn các biên bản mẫu', 'Bạn đang làm việc trên kho dữ liệu sạch.');
  };

  const restoreDemoData = () => {
    localStorage.removeItem('minutely_cleared_demo');
    setIsDemoActive(true);
    setMeetings((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const toAdd = INITIAL_MEETINGS.filter((m) => !existingIds.has(m.id));
      return [...toAdd, ...prev];
    });
    if (!currentMeetingId && INITIAL_MEETINGS.length > 0) {
      setCurrentMeetingId(INITIAL_MEETINGS[0].id);
    }
    toast.success('Đã khôi phục bộ biên bản mẫu', 'Sẵn sàng trải nghiệm đầy đủ các nhóm A–E.');
  };

  const copyCurrentMeetingLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      if (currentMeetingId) {
        url.searchParams.set('id', currentMeetingId);
      }
      navigator.clipboard.writeText(url.toString());
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    refreshFromDatabase();
  }, []);

  const currentMeeting =
    meetings.find((m) => m.id === currentMeetingId) || (meetings.length > 0 ? meetings[0] : null);

  const createMeeting = (newMeetingData: Partial<Meeting>, carryOverActions: boolean = false): Meeting => {
    const newId = `mtg-${Date.now()}`;
    const type = newMeetingData.type || 'A1_GIAO_BAN';
    const group = newMeetingData.group || 'A';

    // Collect unfinished actions if carryOverActions is requested
    const unfinishedToCarry: ActionItem[] = carryOverActions
      ? meetings
          .flatMap((m) => m.agendaItems.flatMap((i) => i.actionItems))
          .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
          .slice(0, 5)
          .map((a, idx) => ({
            ...a,
            id: `act-carry-${Date.now()}-${idx}`,
            meetingId: newId,
            meetingTitle: newMeetingData.title || 'Biên bản cuộc họp mới',
            title: a.title.startsWith('[Tồn') ? a.title : `[Tồn kỳ trước] ${a.title}`,
            carriedFromPrevious: true,
          }))
      : [];

    const firstAgendaId = `ag-${Date.now()}-1`;

    // Build default agenda items tailored to meeting type
    const defaultAgendaItems: AgendaItem[] = newMeetingData.agendaItems || [
      {
        id: firstAgendaId,
        order: 1,
        title:
          type === 'B1_DH_CO_DONG'
            ? 'Báo cáo kết quả hoạt động kinh doanh và phương án phân phối lợi nhuận'
            : type === 'B2_HD_QUAN_TRI'
            ? 'Thảo luận và thông qua tờ trình chiến lược của Ban Điều hành'
            : type === 'A1_GIAO_BAN'
            ? 'Rà soát tiến độ công việc kỳ trước và báo cáo theo từng đơn vị'
            : type === 'A3_XU_LY_SU_CO' || type === 'C5_POST_MORTEM'
            ? 'Xác định dòng thời gian sự cố, nguyên nhân gốc rễ (Root Cause) và giải pháp khắc phục'
            : type === 'D1_HAI_BEN' || type === 'D2_DAM_PHAN'
            ? 'Thống nhất phạm vi hợp tác và các điều khoản cam kết giữa Bên A và Bên B'
            : 'Nội dung thảo luận trọng tâm #1',
        description:
          carryOverActions && unfinishedToCarry.length > 0
            ? `Đã tự động chuyển tiếp ${unfinishedToCarry.length} công việc chưa hoàn thành từ kỳ trước để rà soát trách nhiệm giải trình.`
            : 'Trình bày báo cáo, thảo luận phương án và biểu quyết thông qua quyết nghị.',
        durationMinutes: 30,
        presenterName: currentUser.name,
        opinions: [],
        decision: {
          id: `dec-${Date.now()}-1`,
          agendaItemId: firstAgendaId,
          content: 'Thống nhất chủ trương thực hiện theo nội dung tờ trình và giao đầu mối triển khai.',
          status: 'agreed',
          thresholdPercent: group === 'B' ? (type === 'B2_HD_QUAN_TRI' ? 75 : type === 'B3_HD_THANH_VIEN' ? 65 : 50) : 50,
        },
        actionItems: unfinishedToCarry.map((a) => ({ ...a, agendaItemId: firstAgendaId })),
      },
    ];

    const defaultParticipants: Participant[] = newMeetingData.participants || [
      {
        id: `p-${Date.now()}-1`,
        name: currentUser.name,
        email: currentUser.email,
        role: 'chairperson',
        title: currentUser.title,
        status: 'present',
        votingPower: 1,
      },
      {
        id: `p-${Date.now()}-2`,
        name: 'Trần Thị Thu Hà',
        email: 'ha.tran@vinacorp.vn',
        role: 'secretary',
        title: 'Thư ký cuộc họp',
        status: 'present',
        votingPower: 1,
      },
    ];

    const newMeeting: Meeting = {
      id: newId,
      code:
        newMeetingData.code ||
        `${String(meetings.length + 1).padStart(2, '0')}/${new Date().getFullYear()}/BB-${group}`,
      title: newMeetingData.title || 'Biên bản cuộc họp mới',
      templateId: newMeetingData.templateId || 'tpl-a1',
      group,
      type,
      typeName: newMeetingData.typeName || 'Họp Giao Ban Định Kỳ',
      organization: newMeetingData.organization || {
        name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
        department: 'Văn phòng Điều hành',
      },
      locationCity: newMeetingData.locationCity || 'Hà Nội',
      date: newMeetingData.date || new Date().toISOString().split('T')[0],
      startTime: newMeetingData.startTime || '09:00',
      endTime: newMeetingData.endTime || '10:30',
      venue: newMeetingData.venue || 'Phòng họp chính',
      meetingMode: newMeetingData.meetingMode || 'offline',
      meetingUrl: newMeetingData.meetingUrl || '',
      participants: defaultParticipants,
      quorum: newMeetingData.quorum,
      agendaItems: defaultAgendaItems,
      bilateral:
        newMeetingData.bilateral ||
        (group === 'D'
          ? {
              partyA: {
                companyName: newMeetingData.organization?.name || 'CÔNG TY CỔ PHẦN CÔNG NGHỆ MINUTELY',
                representative: currentUser.name,
                title: currentUser.title || 'Đại diện Bên A',
              },
              partyB: {
                companyName: 'ĐỐI TÁC / KHÁCH HÀNG (BÊN B)',
                representative:
                  defaultParticipants.find((p) => p.affiliation === 'party_b')?.name || 'Đại diện Bên B',
                title:
                  defaultParticipants.find((p) => p.affiliation === 'party_b')?.title || 'Giám đốc Đại diện',
              },
              commitmentsA: ['Đảm bảo tiến độ bàn giao và chất lượng kỹ thuật theo thỏa thuận.'],
              commitmentsB: ['Phối hợp nghiệm thu và thanh toán đúng thời hạn cam kết.'],
              pendingPoints: [],
            }
          : undefined),
      postMortem:
        newMeetingData.postMortem ||
        (type === 'A3_XU_LY_SU_CO' || type === 'C5_POST_MORTEM'
          ? {
              summary: 'Tóm tắt diễn biến và phạm vi ảnh hưởng của sự cố kỹ thuật / vận hành.',
              impactLevel: 'P2 - Major',
              startTime: `${newMeetingData.date || new Date().toISOString().split('T')[0]} 08:00`,
              resolvedTime: `${newMeetingData.date || new Date().toISOString().split('T')[0]} 08:45`,
              downtimeMinutes: 45,
              rootCause: 'Phân tích nguyên nhân gốc rễ (5 Whys) không quy lỗi cá nhân (Blameless).',
              whatWentWell: ['Phát hiện cảnh báo sớm và cô lập phạm vi ảnh hưởng kịp thời.'],
              whatToImprove: ['Cần bổ sung kịch bản kiểm thử tải tự động trước khi phát hành.'],
              preventionActions: ['Thiết lập cơ chế tự động dự phòng (Failover) và giám sát ngưỡng tải.'],
            }
          : undefined),
      scrumRetro:
        newMeetingData.scrumRetro ||
        (type === 'C3_SPRINT_RETRO'
          ? {
              sprintName: 'Sprint hiện tại',
              sprintGoal: 'Hoàn thành các hạng mục cam kết trong Sprint Backlog đảm bảo chất lượng DoD.',
              whatWentWell: ['Phối hợp chặt chẽ giữa các thành viên phát triển và kiểm thử.'],
              whatWentWrong: ['Một số yêu cầu thay đổi phát sinh giữa chừng làm ảnh hưởng tiến độ.'],
              actionImprovements: ['Chuẩn hóa tiêu chí nghiệm thu (Deliverable) trước khi đưa vào Sprint.'],
            }
          : undefined),
      signatures: newMeetingData.signatures || [
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
      distribution: newMeetingData.distribution || {
        forAction: ['Các phòng ban / cá nhân liên quan'],
        forInfo: ['Ban Lãnh đạo', 'Lưu: VT, Hồ sơ cuộc họp'],
      },
      archiveDetails: newMeetingData.archiveDetails || {
        totalCopies: 2,
        storageLocations: ['Văn thư đơn vị', 'Hồ sơ lưu trữ cuộc họp'],
        approvedWithoutObjection: true,
      },
      status: 'draft',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-init-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Khởi tạo hồ sơ biên bản cuộc họp',
          details: `Biểu mẫu: ${newMeetingData.typeName || 'Họp Giao Ban'} (${group})${
            unfinishedToCarry.length > 0 ? ` • Mang sang ${unfinishedToCarry.length} việc tồn kỳ trước` : ''
          }`,
        },
      ],
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    setCurrentMeetingId(newMeeting.id);
    toast.success('Đã khởi tạo biên bản cuộc họp', `${newMeeting.code} · ${newMeeting.title}`);

    ApiService.createMeeting(newMeeting)
      .then((savedRes) => {
        if (savedRes?.id) {
          setMeetings((prev) => prev.map((m) => (m.id === newId ? { ...m, id: savedRes.id } : m)));
          setCurrentMeetingId(savedRes.id);
        }
      })
      .catch((e) => console.warn('Error saving meeting to DB:', e));

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

    ApiService.updateMeeting(id, updates);
  };

  const deleteMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (currentMeetingId === id) {
      setCurrentMeetingId(meetings.find((m) => m.id !== id)?.id || null);
    }
    ApiService.deleteMeeting(id);
    toast.info('Đã xóa biên bản cuộc họp', target ? `${target.code} · ${target.title}` : undefined);
  };

  const duplicateMeeting = (id: string): Meeting => {
    const source = meetings.find((m) => m.id === id);
    if (!source) throw new Error('Không tìm thấy cuộc họp gốc');

    const copyId = `mtg-${Date.now()}`;
    const nowTs = Date.now();
    const clonedAgenda = source.agendaItems.map((item, idx) => {
      const itemNewId = `ag-copy-${nowTs}-${idx}`;
      return {
        ...item,
        id: itemNewId,
        opinions: item.opinions.map((op, oIdx) => ({
          ...op,
          id: `op-copy-${nowTs}-${idx}-${oIdx}`,
          agendaItemId: itemNewId,
        })),
        decision: item.decision
          ? {
              ...item.decision,
              id: `dec-copy-${nowTs}-${idx}`,
              agendaItemId: itemNewId,
            }
          : undefined,
        actionItems: item.actionItems.map((act, aIdx) => ({
          ...act,
          id: `act-copy-${nowTs}-${idx}-${aIdx}`,
          meetingId: copyId,
          agendaItemId: itemNewId,
        })),
      };
    });

    const copy: Meeting = {
      ...source,
      id: copyId,
      code: `${source.code}-BẢN_SAO`,
      title: `${source.title} (Bản sao)`,
      status: 'draft',
      version: '1.0',
      contentHash: undefined,
      rejectionReason: undefined,
      agendaItems: clonedAgenda,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        {
          id: `log-dup-${nowTs}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Nhân bản biên bản cuộc họp',
          details: `Sao chép từ biên bản gốc ${source.code}`,
        },
      ],
    };

    setMeetings((prev) => [copy, ...prev]);
    setCurrentMeetingId(copyId);
    ApiService.createMeeting(copy);
    toast.success('Đã nhân bản biên bản', `Bản sao mới: ${copy.code}`);
    return copy;
  };

  // Workflow Handlers
  const submitForReview = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return { success: false, issues: [] };

    const validation = validateMeeting(target);
    if (!validation.isValid) {
      toast.error('Biên bản chưa đủ điều kiện gửi duyệt', `Còn ${validation.blockers.length} lỗi chặn cần xử lý.`);
      return { success: false, issues: validation.blockers };
    }

    updateMeeting(id, {
      status: 'pending_review',
      rejectionReason: undefined,
      auditLogs: [
        ...(target.auditLogs || []),
        {
          id: `log-sub-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Gửi trình Chủ tọa phê duyệt',
          details: 'Đã vượt qua toàn bộ quy tắc kiểm tra tính hợp lệ và khối bắt buộc.',
        },
      ],
    });

    toast.success('Đã gửi trình Chủ tọa phê duyệt', `${target.code} đã chuyển sang trạng thái Chờ duyệt.`);
    return { success: true, issues: validation.warnings };
  };

  const approveMeeting = (
    id: string,
    approverName: string,
    signatureType: 'digital_cert' | 'electronic_confirm' | 'wet_scan' = 'electronic_confirm'
  ) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;

    const nowDisplay = new Date().toLocaleString('vi-VN');
    const hash = generateContentHash(JSON.stringify(target));
    const updatedSignatures = target.signatures.map((s) => ({
      ...s,
      signedAt: s.signedAt || nowDisplay,
      signatureType,
    }));

    const sigTypeLabel =
      signatureType === 'digital_cert'
        ? 'Chữ ký số Doanh nghiệp'
        : signatureType === 'wet_scan'
        ? 'Đối chiếu bản quét chữ ký tươi'
        : 'Xác nhận điện tử nội bộ';

    updateMeeting(id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: approverName,
      contentHash: hash,
      rejectionReason: undefined,
      signatures: updatedSignatures,
      auditLogs: [
        ...(target.auditLogs || []),
        {
          id: `log-app-${Date.now()}`,
          timestamp: nowDisplay,
          actor: approverName,
          action: `Ký duyệt & Khóa biên bản (${sigTypeLabel})`,
          details: `Mã băm toàn vẹn SHA-256: ${hash}`,
        },
      ],
    });
    toast.success(
      'Đã ký duyệt & khóa toàn vẹn SHA-256',
      `Chủ tọa ${approverName} đã xác nhận biên bản ${target.code}.`
    );
  };

  const rejectMeeting = (id: string, reason: string) => {
    const target = meetings.find((m) => m.id === id);
    updateMeeting(id, {
      status: 'draft',
      rejectionReason: reason,
      auditLogs: [
        ...(target?.auditLogs || []),
        {
          id: `log-rej-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Hoàn trả biên bản yêu cầu chỉnh sửa',
          details: `Lý do: ${reason}`,
        },
      ],
    });
    toast.warning('Đã hoàn trả biên bản cho Thư ký', reason);
  };

  const publishMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    updateMeeting(id, {
      status: 'published',
      auditLogs: [
        ...(target?.auditLogs || []),
        {
          id: `log-pub-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Phát hành biên bản chính thức',
          details: 'Đã gửi phân phối tới danh sách Nơi nhận và lưu trữ hồ sơ.',
        },
      ],
    });
    toast.success(
      'Đã phát hành biên bản chính thức',
      target ? `${target.code} đã được phân phối theo nơi nhận.` : undefined
    );
  };

  const archiveMeeting = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    updateMeeting(id, {
      status: 'archived',
      auditLogs: [
        ...(target?.auditLogs || []),
        {
          id: `log-arch-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Đưa biên bản vào Lưu trữ hồ sơ',
          details: 'Hồ sơ đã hoàn tất phân phối và lưu trữ dài hạn tại trụ sở.',
        },
      ],
    });
    toast.success(
      'Đã đưa biên bản vào Lưu trữ hồ sơ',
      target ? `${target.code} đã chuyển sang trạng thái Lưu trữ.` : undefined
    );
  };

  const markAsInquorateMinutes = (id: string) => {
    const target = meetings.find((m) => m.id === id);
    if (!target) return;
    const actualPct = target.quorum?.actualPercentage ?? 0;
    const requiredPct = target.quorum?.requiredPercentage ?? 50;
    const summaryText = `Căn cứ Điều 145 Luật Doanh nghiệp 2020 và Điều lệ doanh nghiệp: Tại thời điểm khai mạc, tổng tỷ lệ đại biểu có mặt và ủy quyền hợp lệ chỉ đạt ${actualPct}% (chưa đạt ngưỡng tối thiểu ${requiredPct}%). Cuộc họp không đủ điều kiện túc số để tiến hành. Biên bản này ghi nhận sự kiện họp không thành để làm căn cứ triệu tập cuộc họp lần tiếp theo.`;

    const updatedAgenda = target.agendaItems.map((item) => {
      if (item.decision?.content?.trim()) return item;
      return {
        ...item,
        decision: {
          id: item.decision?.id || `dec-inq-${Date.now()}-${item.order}`,
          agendaItemId: item.id,
          content: 'Hoãn xem xét do cuộc họp không đủ điều kiện túc số theo luật định.',
          status: 'deferred' as const,
          thresholdPercent: item.decision?.thresholdPercent || 50,
          deferredReason: `Không đủ túc số (${actualPct}% / ${requiredPct}%) theo Điều 145 Luật DN 2020`,
        },
      };
    });

    updateMeeting(id, {
      isInquorateMinutes: true,
      conclusionSummary: summaryText,
      agendaItems: updatedAgenda,
      auditLogs: [
        ...(target.auditLogs || []),
        {
          id: `log-inq-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: 'Chuyển sang Biên bản Họp không thành (Điều 145)',
          details: `Túc số thực tế: ${actualPct}% / Yêu cầu: ${requiredPct}%`,
        },
      ],
    });
    toast.warning(
      'Đã chuyển sang Biên bản Họp không thành (Điều 145)',
      'Bạn có thể gửi trình Chủ tọa ký xác nhận để làm căn cứ triệu tập lần 2.'
    );
  };

  const createRevision = (id: string, reason: string): Meeting => {
    const source = meetings.find((m) => m.id === id);
    if (!source) throw new Error('Meeting not found');

    const currentMajor = parseInt(source.version.split('.')[0], 10) || 1;
    const nextVersion = `${currentMajor + 1}.0`;
    const revId = `mtg-rev-${Date.now()}`;

    const baseCode = source.code.replace(/\/SĐ\d+$/i, '').replace(/-V\d+$/i, '');
    const revisionCode = `${baseCode}/SĐ${currentMajor}`;

    const revised: Meeting = {
      ...source,
      id: revId,
      code: revisionCode,
      version: nextVersion,
      status: 'draft',
      previousVersionId: source.id,
      contentHash: undefined,
      rejectionReason: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditLogs: [
        ...(source.auditLogs || []),
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          actor: currentUser.name,
          action: `Tạo phiên bản sửa đổi v${nextVersion}`,
          details: `Lý do: ${reason}`,
        },
      ],
    };

    setMeetings((prev) => [revised, ...prev]);
    setCurrentMeetingId(revId);
    ApiService.createMeeting(revised);
    toast.success(`Đã tạo bản sửa đổi v${nextVersion}`, `Mã hiệu mới: ${revisionCode}`);
    return revised;
  };

  // Agenda CRUD
  const updateAgendaItem = (meetingId: string, agendaItemId: string, updates: Partial<AgendaItem>) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updatedAgenda = m.agendaItems.map((item) =>
          item.id === agendaItemId ? { ...item, ...updates } : item
        );
        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteAgendaItem = (meetingId: string, agendaItemId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const filtered = m.agendaItems
          .filter((item) => item.id !== agendaItemId)
          .map((item, idx) => ({ ...item, order: idx + 1 }));
        return {
          ...m,
          agendaItems: filtered,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const reorderAgendaItem = (meetingId: string, agendaItemId: string, direction: 'up' | 'down') => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const items = [...m.agendaItems];
        const idx = items.findIndex((i) => i.id === agendaItemId);
        if (idx === -1) return m;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= items.length) return m;
        const temp = items[idx];
        items[idx] = items[targetIdx];
        items[targetIdx] = temp;
        const reordered = items.map((item, i) => ({ ...item, order: i + 1 }));
        return {
          ...m,
          agendaItems: reordered,
          updatedAt: new Date().toISOString(),
        };
      })
    );
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

  const updateOpinion = (
    meetingId: string,
    agendaItemId: string,
    opinionId: string,
    updates: Partial<Opinion>
  ) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updatedAgenda = m.agendaItems.map((item) => {
          if (item.id !== agendaItemId) return item;
          return {
            ...item,
            opinions: item.opinions.map((op) => (op.id === opinionId ? { ...op, ...updates } : op)),
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

  const deleteOpinion = (meetingId: string, agendaItemId: string, opinionId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== meetingId) return m;
        const updatedAgenda = m.agendaItems.map((item) => {
          if (item.id !== agendaItemId) return item;
          return {
            ...item,
            opinions: item.opinions.filter((op) => op.id !== opinionId),
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
      createdById: actionData.createdById || currentUser.id,
      createdByName: actionData.createdByName || currentUser.name,
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
          updatedAgenda[0] = {
            ...updatedAgenda[0],
            actionItems: [...updatedAgenda[0].actionItems, newAction],
          };
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
                completedAt:
                  updates.status === 'completed' ? new Date().toISOString().split('T')[0] : a.completedAt,
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

  const deleteActionItem = (actionId: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        let modified = false;
        const updatedAgenda = m.agendaItems.map((item) => {
          if (!item.actionItems.some((a) => a.id === actionId)) return item;
          modified = true;
          return {
            ...item,
            actionItems: item.actionItems.filter((a) => a.id !== actionId),
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

  const postponeActionItem = (actionId: string, newDeadline: string, reason: string) => {
    setMeetings((prev) =>
      prev.map((m) => {
        let modified = false;
        let oldDeadline = '';
        let actionTitle = '';

        const updatedAgenda = m.agendaItems.map((item) => {
          const target = item.actionItems.find((a) => a.id === actionId);
          if (!target) return item;
          modified = true;
          oldDeadline = target.deadline;
          actionTitle = target.title;
          return {
            ...item,
            actionItems: item.actionItems.map((a) =>
              a.id === actionId
                ? {
                    ...a,
                    deadline: newDeadline,
                    postponedReason: reason,
                  }
                : a
            ),
          };
        });

        if (!modified) return m;
        return {
          ...m,
          agendaItems: updatedAgenda,
          updatedAt: new Date().toISOString(),
          auditLogs: [
            ...(m.auditLogs || []),
            {
              id: `log-postpone-${Date.now()}`,
              timestamp: new Date().toLocaleString('vi-VN'),
              actor: currentUser.name,
              action: `Dời hạn nhiệm vụ "${actionTitle}"`,
              details: `Từ ${oldDeadline} sang ${newDeadline} • Lý do: ${reason}`,
              previousValue: oldDeadline,
              newValue: newDeadline,
            },
          ],
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
        archiveMeeting,
        markAsInquorateMinutes,
        createRevision,
        updateAgendaItem,
        deleteAgendaItem,
        reorderAgendaItem,
        addOpinion,
        updateOpinion,
        deleteOpinion,
        updateDecision,
        addActionItem,
        updateActionItem,
        deleteActionItem,
        postponeActionItem,
        addParticipant,
        removeParticipant,
        updateParticipant,
        batchUpdateAttendance,
        isGuest,
        isDemoActive,
        clearAllDemoData,
        restoreDemoData,
        copyCurrentMeetingLink,
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
