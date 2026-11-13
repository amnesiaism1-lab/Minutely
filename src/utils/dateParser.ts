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

export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface ParsedSlashCommand {
  type: 'opinion' | 'counter' | 'proposal' | 'clarify' | 'decision' | 'action' | 'vote' | 'unknown';
  explicitType: boolean; // Người dùng có gõ lệnh trực tiếp như /dx, /pb, /yk không
  cleanedText: string;
  mention?: string;
  speakerOverride?: { id?: string; name: string };
  deadline?: string;
  hasSubstantiveContent: boolean;
}

export function parseNoteInput(
  rawText: string,
  participants: { id: string; name: string }[] = []
): ParsedSlashCommand {
  let text = rawText.trim();
  let type: ParsedSlashCommand['type'] = 'opinion';
  let explicitType = false;
  let mention: string | undefined;
  let speakerOverride: { id?: string; name: string } | undefined;
  let deadline: string | undefined;

  // Vòng lặp bóc tách đa tầng: cho phép kết hợp tự do không phân biệt thứ tự
  // Ví dụ: "@Sarah /dx avbc", "/dx @Sarah avbc", "@Hùng /pb abc", "/yk @Michael abc", "/viec @Hà !thứ sáu nộp bài"
  let changed = true;
  while (changed && text.length > 0) {
    changed = false;
    text = text.trim();

    // 1. Kiểm tra lệnh gõ tắt ở đầu chuỗi (/dx, /pb, /lr, /yk, /viec, /qd, /bq)
    const slashMatch = text.match(
      /^\/(phanbien|pb|dexuat|dx|lamro|lr|quyetdinh|qd|viec|action|bq|vote|ykien|yk)(?:[:\s]+|$)/i
    );
    if (slashMatch) {
      const cmd = slashMatch[1].toLowerCase();
      if (cmd === 'pb' || cmd === 'phanbien') type = 'counter';
      else if (cmd === 'dx' || cmd === 'dexuat') type = 'proposal';
      else if (cmd === 'lr' || cmd === 'lamro') type = 'clarify';
      else if (cmd === 'qd' || cmd === 'quyetdinh') type = 'decision';
      else if (cmd === 'viec' || cmd === 'action') type = 'action';
      else if (cmd === 'bq' || cmd === 'vote') type = 'vote';
      else if (cmd === 'yk' || cmd === 'ykien') type = 'opinion';

      explicitType = true;
      text = text.slice(slashMatch[0].length).trim();
      changed = true;
      continue;
    }

    // 2. Kiểm tra gán người phát biểu @ ở đầu chuỗi (hỗ trợ cả @Tên:, @Tên /dx, @Tên)
    if (text.startsWith('@')) {
      let matched = false;

      // 2A: Khớp tên đầy đủ trong danh sách đại biểu (tên dài nhất ưu tiên trước, hỗ trợ cả có dấu và không dấu)
      if (participants && participants.length > 0) {
        const sorted = [...participants].sort((a, b) => b.name.length - a.name.length);
        const textNorm = removeVietnameseDiacritics(text);
        for (const p of sorted) {
          const pName = p.name.trim().toLowerCase();
          const pNameNorm = removeVietnameseDiacritics(p.name);

          let matchedLen = 0;
          if (text.toLowerCase().startsWith('@' + pName)) {
            matchedLen = 1 + pName.length;
          } else if (textNorm.startsWith('@' + pNameNorm)) {
            matchedLen = 1 + pNameNorm.length;
          }

          if (matchedLen > 0) {
            const nextChar = text.charAt(matchedLen);
            if (!nextChar || nextChar === ' ' || nextChar === ':' || nextChar === '/' || nextChar === '-') {
              speakerOverride = p;
              mention = p.name;
              text = text.slice(matchedLen).replace(/^[:\s-]+/, '').trim();
              matched = true;
              break;
            }
          }
        }
      }

      // 2B: Khớp từ đầu hoặc từ cuối của tên đại biểu (ví dụ: @tu -> Tú Phạm, @ha -> Thu Hà, @Hùng, @Sarah)
      if (!matched && participants && participants.length > 0) {
        const textNorm = removeVietnameseDiacritics(text);
        for (const p of participants) {
          const parts = p.name.trim().split(/\s+/);
          const firstWord = parts[0];
          const lastName = parts[parts.length - 1];

          for (const alias of [lastName, firstWord]) {
            const aliasRaw = alias.toLowerCase();
            const aliasNorm = removeVietnameseDiacritics(alias);

            let matchedLen = 0;
            if (text.toLowerCase().startsWith('@' + aliasRaw)) {
              matchedLen = 1 + aliasRaw.length;
            } else if (textNorm.startsWith('@' + aliasNorm)) {
              matchedLen = 1 + aliasNorm.length;
            }

            if (matchedLen > 0) {
              const nextChar = text.charAt(matchedLen);
              if (!nextChar || nextChar === ' ' || nextChar === ':' || nextChar === '/' || nextChar === '-') {
                speakerOverride = p;
                mention = p.name;
                text = text.slice(matchedLen).replace(/^[:\s-]+/, '').trim();
                matched = true;
                break;
              }
            }
          }
          if (matched) break;
        }
      }

      // 2C: Khớp định dạng có dấu hai chấm @Tên:
      if (!matched) {
        const colonMatch = text.match(/^@([^:\n/]+)[:]\s*(.*)$/u);
        if (colonMatch) {
          const cand = colonMatch[1].trim();
          const candNorm = removeVietnameseDiacritics(cand);
          const found = participants.find((p) => {
            const pNorm = removeVietnameseDiacritics(p.name);
            const parts = p.name.trim().split(/\s+/);
            const firstNorm = removeVietnameseDiacritics(parts[0]);
            const lastNorm = removeVietnameseDiacritics(parts[parts.length - 1]);
            return (
              p.name.toLowerCase().includes(cand.toLowerCase()) ||
              pNorm.includes(candNorm) ||
              firstNorm === candNorm ||
              lastNorm === candNorm
            );
          });
          speakerOverride = found || { name: cand };
          mention = speakerOverride.name;
          text = colonMatch[2].trim();
          matched = true;
        }
      }

      // 2D: Khớp token từ đơn @alias
      if (!matched) {
        const tokenMatch = text.match(/^@([^\s:/]+)(?:[:\s-]\s*(.*)|$)/u);
        if (tokenMatch) {
          const cand = tokenMatch[1].trim();
          const candNorm = removeVietnameseDiacritics(cand);
          const found = participants.find((p) => {
            const pNorm = removeVietnameseDiacritics(p.name);
            const parts = p.name.trim().split(/\s+/);
            const firstNorm = removeVietnameseDiacritics(parts[0]);
            const lastNorm = removeVietnameseDiacritics(parts[parts.length - 1]);
            return (
              p.name.toLowerCase().includes(cand.toLowerCase()) ||
              pNorm.includes(candNorm) ||
              firstNorm === candNorm ||
              lastNorm === candNorm
            );
          });
          speakerOverride = found || { name: cand };
          mention = speakerOverride.name;
          text = (tokenMatch[2] || '').trim();
          matched = true;
        }
      }

      if (matched) {
        changed = true;
        continue;
      }
    }

    // 3. Kiểm tra token ngày !date ở đầu chuỗi (ví dụ: !thứ sáu, !ngày mai)
    const dateAtStart = text.match(/^(![^\s]+(?:\s+[^\s]+)?)(?:\s+|$)/);
    if (dateAtStart) {
      const parsedDate = parseVietnameseDate(dateAtStart[1]);
      if (parsedDate) {
        deadline = parsedDate;
      }
      text = text.slice(dateAtStart[0].length).trim();
      changed = true;
      continue;
    }
  }

  // 4. Kiểm tra token ngày !date nằm ở bất kỳ đâu trong nội dung còn lại
  const anyDate = text.match(/(![^\s]+(?:\s+[^\s]+)?)/);
  if (anyDate && !deadline) {
    const parsedDate = parseVietnameseDate(anyDate[1]);
    if (parsedDate) {
      deadline = parsedDate;
      text = text.replace(anyDate[1], '').trim();
    }
  }

  // 5. Kiểm tra lệnh gõ tắt nằm kẹp giữa nội dung nếu chưa nhận diện được type
  if (!explicitType) {
    const embeddedSlash = text.match(
      /\/(phanbien|pb|dexuat|dx|lamro|lr|quyetdinh|qd|viec|action|bq|vote|ykien|yk)(?:[:\s]+|$)/i
    );
    if (embeddedSlash) {
      const cmd = embeddedSlash[1].toLowerCase();
      if (cmd === 'pb' || cmd === 'phanbien') type = 'counter';
      else if (cmd === 'dx' || cmd === 'dexuat') type = 'proposal';
      else if (cmd === 'lr' || cmd === 'lamro') type = 'clarify';
      else if (cmd === 'qd' || cmd === 'quyetdinh') type = 'decision';
      else if (cmd === 'viec' || cmd === 'action') type = 'action';
      else if (cmd === 'bq' || cmd === 'vote') type = 'vote';
      else if (cmd === 'yk' || cmd === 'ykien') type = 'opinion';

      explicitType = true;
      text = text.replace(embeddedSlash[0], ' ').trim();
    }
  }

  // 6. Nhận diện mention nằm giữa câu để đánh dấu
  if (!mention) {
    const inlineMention = text.match(/@([\p{L}\w]+(?:\s+[\p{L}\w]+){0,2})/u);
    if (inlineMention) {
      mention = inlineMention[1].trim();
    }
  }

  const cleanedText = text.trim();

  return {
    type,
    explicitType,
    cleanedText,
    mention,
    speakerOverride,
    deadline,
    hasSubstantiveContent: cleanedText.length > 0,
  };
}
