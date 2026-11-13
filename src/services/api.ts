import { Meeting } from '../types';

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

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<boolean> {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      return res.ok;
    } catch (err) {
      console.warn('API updateMeeting error:', err);
      return false;
    }
  },

  async deleteMeeting(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/meetings?id=${id}`, {
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
};
