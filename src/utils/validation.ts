import { Meeting, ValidationIssue } from '../types';

export function validateMeeting(meeting: Meeting): {
  isValid: boolean;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Kiểm tra Chủ tọa và Thư ký
  const hasChairperson = meeting.participants.some(p => p.role === 'chairperson');
  const hasSecretary = meeting.participants.some(p => p.role === 'secretary');

  if (['B', 'D'].includes(meeting.group)) {
    if (!hasChairperson) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message: 'Bắt buộc phải có ít nhất 01 Chủ tọa cuộc họp (theo Luật Doanh nghiệp / quy chuẩn pháp lý).',
        blockTarget: 'block-participants',
      });
    }
    if (!hasSecretary) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message: 'Bắt buộc phải có ít nhất 01 Thư ký / Người ghi biên bản.',
        blockTarget: 'block-participants',
      });
    }
  } else {
    if (!hasChairperson) {
      warnings.push({
        type: 'warning',
        field: 'participants',
        message: 'Chưa chỉ định Chủ tọa / Người chủ trì cuộc họp.',
        blockTarget: 'block-participants',
      });
    }
  }

  // 2. Thời gian bắt đầu và kết thúc
  if (meeting.startTime && meeting.endTime) {
    const [startH, startM] = meeting.startTime.split(':').map(Number);
    const [endH, endM] = meeting.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      blockers.push({
        type: 'error',
        field: 'time',
        message: `Thời gian kết thúc (${meeting.endTime}) phải diễn ra sau thời gian bắt đầu (${meeting.startTime}).`,
        blockTarget: 'block-info',
      });
    }
  }

  // 3. Túc số (Quorum) với nhóm B
  if (meeting.quorum && !meeting.quorum.isMet) {
    warnings.push({
      type: 'warning',
      field: 'quorum',
      message: `Túc số tham dự đạt ${meeting.quorum.actualPercentage}%, chưa đạt điều kiện tối thiểu ${meeting.quorum.requiredPercentage}% theo luật hoặc điều lệ. Biên bản có nguy cơ vô hiệu hoặc phải chuyển sang biên bản họp không thành.`,
      blockTarget: 'block-quorum',
    });
  }

  // 4. Vấn đề nghị sự (Agenda items) & Kết luận
  if (meeting.agendaItems.length === 0) {
    blockers.push({
      type: 'error',
      field: 'agendaItems',
      message: 'Cuộc họp chưa có nội dung / chương trình nghị sự nào.',
      blockTarget: 'block-agenda',
    });
  } else {
    meeting.agendaItems.forEach((item, idx) => {
      if (!item.decision || !item.decision.content.trim()) {
        blockers.push({
          type: 'error',
          field: `agenda-${item.id}`,
          message: `Vấn đề "${item.title || `Mục ${idx + 1}`}" chưa có kết luận. Vui lòng chọn Thống nhất, Chưa thống nhất hoặc Hoãn kèm lý do.`,
          blockTarget: `agenda-item-${item.id}`,
        });
      }

      // Kiểm tra biểu quyết nếu có
      if (item.decision?.vote) {
        const v = item.decision.vote;
        const totalVotes = v.inFavor + v.against + v.abstain + (v.invalid || 0);
        if (totalVotes > v.totalEligible) {
          blockers.push({
            type: 'error',
            field: `vote-${item.id}`,
            message: `Tổng số phiếu biểu quyết (${totalVotes}) vượt quá tổng số phiếu hợp lệ (${v.totalEligible}) tại vấn đề "${item.title}".`,
            blockTarget: `agenda-item-${item.id}`,
          });
        }
      }
    });
  }

  // 5. Action items validation
  const allActions = meeting.agendaItems.flatMap(i => i.actionItems);
  const participantIds = new Set(meeting.participants.map(p => p.id));
  const actionsPerOwnerMap: Record<string, number> = {};

  allActions.forEach((action, idx) => {
    if (!action.ownerId || !action.ownerName.trim()) {
      blockers.push({
        type: 'error',
        field: `action-owner-${action.id}`,
        message: `Hành động #${idx + 1} ("${action.title}") chưa có Người chủ trì (Owner). Nguyên tắc: Một việc phải có đúng một người chịu trách nhiệm.`,
        blockTarget: 'block-actions',
      });
    }

    if (!action.deadline) {
      blockers.push({
        type: 'error',
        field: `action-deadline-${action.id}`,
        message: `Hành động #${idx + 1} ("${action.title}") chưa có thời hạn hoàn thành (Deadline).`,
        blockTarget: 'block-actions',
      });
    } else if (meeting.date && action.deadline < meeting.date) {
      blockers.push({
        type: 'error',
        field: `action-deadline-${action.id}`,
        message: `Hạn của hành động "${action.title}" (${action.deadline}) không được đặt trước ngày diễn ra cuộc họp (${meeting.date}).`,
        blockTarget: 'block-actions',
      });
    }

    if (!action.deliverable || !action.deliverable.trim()) {
      blockers.push({
        type: 'error',
        field: `action-deliverable-${action.id}`,
        message: `Hành động #${idx + 1} ("${action.title}") thiếu Sản phẩm đầu ra (DoD / Deliverable) để nghiệm thu.`,
        blockTarget: 'block-actions',
      });
    }

    if (action.ownerId && !participantIds.has(action.ownerId)) {
      warnings.push({
        type: 'warning',
        field: `action-owner-${action.id}`,
        message: `Người chủ trì "${action.ownerName}" của hành động "${action.title}" không có trong danh sách thành phần tham dự cuộc họp.`,
        blockTarget: 'block-actions',
      });
    }

    // Đếm số việc trên mỗi owner cùng deadline
    const key = `${action.ownerId}_${action.deadline}`;
    actionsPerOwnerMap[key] = (actionsPerOwnerMap[key] || 0) + 1;
    if (actionsPerOwnerMap[key] > 3) {
      warnings.push({
        type: 'warning',
        field: `action-load-${action.id}`,
        message: `Thành viên "${action.ownerName}" được giao quá nhiều việc (${actionsPerOwnerMap[key]} việc) có cùng hạn chót ${action.deadline}.`,
        blockTarget: 'block-actions',
      });
    }
  });

  return {
    isValid: blockers.length === 0,
    blockers,
    warnings,
  };
}
