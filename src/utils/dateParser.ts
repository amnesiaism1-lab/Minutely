// Smart Vietnamese Date & Slash Command Parser for Minutely Meeting Assistant

export function parseVietnameseDate(input: string): string | null {
  const clean = input.trim().toLowerCase();
  const today = new Date();

  if (clean === '!hôm nay' || clean === '!today') {
    return formatDate(today);
  }

  if (clean === '!ngày mai' || clean === '!ngay mai' || clean === '!tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return formatDate(tomorrow);
  }

  if (clean === '!ngày kia' || clean === '!ngay kia') {
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(today.getDate() + 2);
    return formatDate(afterTomorrow);
  }

  if (clean === '!tuần sau' || clean === '!tuan sau' || clean === '!next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return formatDate(nextWeek);
  }

  if (clean === '!cuối tuần' || clean === '!cuoi tuan') {
    const currentDay = today.getDay(); // 0 is Sunday, 5 is Friday
    const daysUntilFriday = (5 - currentDay + 7) % 7 || 7;
    const friday = new Date(today);
    friday.setDate(today.getDate() + daysUntilFriday);
    return formatDate(friday);
  }

  // Days of week: !thứ hai, !thứ ba, !thứ tư, !thứ năm, !thứ sáu, !thứ bảy, !chủ nhật
  const dayMap: { [key: string]: number } = {
    'thứ 2': 1, 'thu 2': 1, 'thứ hai': 1, 'thu hai': 1, 'mon': 1,
    'thứ 3': 2, 'thu 3': 2, 'thứ ba': 2, 'thu ba': 2, 'tue': 2,
    'thứ 4': 3, 'thu 4': 3, 'thứ tư': 3, 'thu tu': 3, 'wed': 3,
    'thứ 5': 4, 'thu 5': 4, 'thứ năm': 4, 'thu nam': 4, 'thu': 4,
    'thứ 6': 5, 'thu 6': 5, 'thứ sáu': 5, 'thu sau': 5, 'fri': 5,
    'thứ 7': 6, 'thu 7': 6, 'thứ bảy': 6, 'thu bay': 6, 'sat': 6,
    'chủ nhật': 0, 'chu nhat': 0, 'cn': 0, 'sun': 0
  };

  for (const [key, targetDay] of Object.entries(dayMap)) {
    if (clean.includes(key)) {
      const currentDay = today.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      return formatDate(targetDate);
    }
  }

  // Patterns like !20/11, !20/11/2026, !20-11-2026
  const dateMatch = clean.match(/!(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : today.getFullYear();
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return formatDate(d);
    }
  }

  return null;
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface ParsedSlashCommand {
  type: 'opinion' | 'counter' | 'proposal' | 'clarify' | 'decision' | 'action' | 'vote' | 'unknown';
  cleanedText: string;
  mention?: string;
  deadline?: string;
}

export function parseNoteInput(rawText: string, participantNames: string[] = []): ParsedSlashCommand {
  let text = rawText.trim();
  let type: ParsedSlashCommand['type'] = 'opinion';
  let mention: string | undefined;
  let deadline: string | undefined;

  // Extract !date
  const dateTokenMatch = text.match(/(![^\s]+(?:\s+[^\s]+)?)/);
  if (dateTokenMatch) {
    const candidate = dateTokenMatch[1];
    const parsedDate = parseVietnameseDate(candidate);
    if (parsedDate) {
      deadline = parsedDate;
      text = text.replace(candidate, '').trim();
    }
  }

  // Extract @mention
  const mentionMatch = text.match(/@([\p{L}\w\s]+?)(?=\s+[/!]|$)/u);
  if (mentionMatch) {
    mention = mentionMatch[1].trim();
  }

  // Check prefix commands
  if (text.startsWith('/phanbien') || text.startsWith('/pb')) {
    type = 'counter';
    text = text.replace(/^\/(?:phanbien|pb)\s*/, '');
  } else if (text.startsWith('/dexuat') || text.startsWith('/dx')) {
    type = 'proposal';
    text = text.replace(/^\/(?:dexuat|dx)\s*/, '');
  } else if (text.startsWith('/lamro') || text.startsWith('/lr')) {
    type = 'clarify';
    text = text.replace(/^\/(?:lamro|lr)\s*/, '');
  } else if (text.startsWith('/qd') || text.startsWith('/quyetdinh')) {
    type = 'decision';
    text = text.replace(/^\/(?:qd|quyetdinh)\s*/, '');
  } else if (text.startsWith('/viec') || text.startsWith('/action')) {
    type = 'action';
    text = text.replace(/^\/(?:viec|action)\s*/, '');
  } else if (text.startsWith('/bq') || text.startsWith('/vote')) {
    type = 'vote';
    text = text.replace(/^\/(?:bq|vote)\s*/, '');
  } else if (text.startsWith('/ykien') || text.startsWith('/yk')) {
    type = 'opinion';
    text = text.replace(/^\/(?:ykien|yk)\s*/, '');
  }

  return {
    type,
    cleanedText: text.trim(),
    mention,
    deadline,
  };
}
