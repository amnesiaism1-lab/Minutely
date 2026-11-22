import { Meeting } from '../types';

const KEEPALIVE_STORAGE_KEY = 'minutely_last_keepalive_ts';
const CLIENT_KEEPALIVE_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 giờ tối đa 1 lần từ trình duyệt

export const ApiService = {
  async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getMeetings failed, falling back:', err);
      return [];
    }
  },

  async createMeeting(meetingData: Partial<Meeting>): Promise<{ id: string } | null> {
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API createMeeting error:', err);
      return null;
    }
  },

  async updateMeeting(
    id: string,
    updates: Partial<Meeting>,
    fullMeeting?: Meeting
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          code: fullMeeting?.code || updates.code,
          updates,
          meetingPayload: fullMeeting,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('API updateMeeting error:', err);
      return false;
    }
  },

  async deleteMeeting(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/meetings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn('API deleteMeeting error:', err);
      return false;
    }
  },

  async syncGoogleUser(user: {
    googleId?: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API syncGoogleUser error:', err);
      return null;
    }
  },

  async pingKeepAlive(
    source: string = 'client-visit'
  ): Promise<{ ok: boolean; status?: string; heartbeat?: any } | null> {
    try {
      if (source === 'client-visit') {
        const lastRaw = localStorage.getItem(KEEPALIVE_STORAGE_KEY);
        const lastTs = lastRaw ? Number(lastRaw) : 0;
        if (lastTs && Date.now() - lastTs < CLIENT_KEEPALIVE_INTERVAL_MS) {
          return { ok: true, status: 'cached' };
        }
      }

      const res = await fetch(`/api/keepalive?source=${encodeURIComponent(source)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.ok) {
        try {
          localStorage.setItem(KEEPALIVE_STORAGE_KEY, String(Date.now()));
        } catch {}
      }
      return data;
    } catch {
      return null;
    }
  },
};
