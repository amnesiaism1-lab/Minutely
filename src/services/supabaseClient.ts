import { createClient } from '@supabase/supabase-js';
import { Meeting } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ewztorukxapprldbybit.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = Boolean(
  supabaseAnonKey &&
  supabaseAnonKey !== 'placeholder' &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const DatabaseService = {
  isCloudConnected: (): boolean => {
    return isConfigured && supabase !== null;
  },

  // Đồng bộ toàn bộ cuộc họp lên Supabase
  syncMeetingToCloud: async (meeting: Meeting): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('meetings').upsert({
        id: meeting.id,
        code: meeting.code,
        title: meeting.title,
        template_id: meeting.templateId,
        group_type: meeting.group,
        type_name: meeting.typeName,
        organization_snapshot: meeting.organization,
        location_city: meeting.locationCity,
        meeting_date: meeting.date,
        start_time: meeting.startTime,
        end_time: meeting.endTime,
        venue: meeting.venue,
        meeting_mode: meeting.meetingMode,
        meeting_url: meeting.meetingUrl,
        quorum: meeting.quorum,
        bilateral_info: meeting.bilateral,
        post_mortem: meeting.postMortem,
        scrum_retro: meeting.scrumRetro,
        distribution: meeting.distribution,
        status: meeting.status,
        version: meeting.version,
        content_hash: meeting.contentHash,
        approved_at: meeting.approvedAt,
        approved_by: meeting.approvedBy,
        rejection_reason: meeting.rejectionReason,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Supabase sync warning:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Cloud sync error (fallback in-memory):', e);
      return false;
    }
  },

  // Tải danh sách cuộc họp từ Supabase
  fetchMeetingsFromCloud: async (): Promise<Meeting[] | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (error || !data) return null;
      return data as any;
    } catch {
      return null;
    }
  },
};
