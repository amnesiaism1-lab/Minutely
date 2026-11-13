import { Meeting, ValidationIssue } from '../types';

export function validateMeeting(meeting: Meeting): {
  isValid: boolean;
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
} {
  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Kiểm tra Tiêu đề & Mã biên bản
  if (!meeting.title || meeting.title.trim() === '' || meeting.title === 'Biên bản cuộc họp mới') {
    blockers.push({
      type: 'error',
      field: 'title',
      message: 'Tiêu đề cuộc họp không được để trống hoặc dùng tên mẫu mặc định.',
      blockTarget: 'block-info',
    });
  }

  if (!meeting.code || meeting.code.trim() === '') {
    blockers.push({
      type: 'error',
      field: 'code',
      message: 'Số và ký hiệu biên bản (theo Nghị định 30) là bắt buộc.',
      blockTarget: 'block-info',
    });
  }

  // 2. Kiểm tra Chủ tọa và Thư ký
  const hasChairperson = meeting.participants.some((p) => p.role === 'chairperson');
  const hasSecretary = meeting.participants.some((p) => p.role === 'secretary');

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

  // Kiểm tra tính đại diện song phương ở Nhóm D (Đối ngoại)
  if (meeting.group === 'D') {
    const hasPartyA = meeting.participants.some((p) => p.affiliation === 'party_a');
    const hasPartyB = meeting.participants.some((p) => p.affiliation === 'party_b');
    if (!hasPartyA || !hasPartyB) {
      warnings.push({
        type: 'warning',
        field: 'participants_bilateral',
        message: 'Cuộc họp đối ngoại (Nhóm D) nên phân định rõ đại diện Bên A và Bên B để đảm bảo tính ràng buộc cam kết.',
        blockTarget: 'block-participants',
      });
    }
  }

  // 3. Thời gian bắt đầu và kết thúc
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

  // 4. Túc số (Quorum) — Chặn nghiêm ngặt đối với Nhóm B (Luật DN 2020)
  if (meeting.quorum && !meeting.quorum.isMet) {
    if (meeting.group === 'B' || meeting.quorum.requiredPercentage >= 50) {
      blockers.push({
        type: 'error',
        field: 'quorum',
        message: `TÚC SỐ KHÔNG ĐẠT: Đại biểu có mặt đạt ${meeting.quorum.actualPercentage}%, chưa đạt mức tối thiểu ${meeting.quorum.requiredPercentage}% theo Điều 141, 148 Luật Doanh nghiệp 2020. Cuộc họp không đủ điều kiện pháp lý để thông qua nghị quyết. Cần hoãn họp hoặc bổ sung giấy ủy quyền hợp lệ.`,
        blockTarget: 'block-quorum',
      });
    } else {
      warnings.push({
        type: 'warning',
        field: 'quorum',
        message: `Túc số tham dự đạt ${meeting.quorum.actualPercentage}%, chưa đạt mức yêu cầu ${meeting.quorum.requiredPercentage}%.`,
        blockTarget: 'block-quorum',
      });
    }
  }

  // 5. Vấn đề nghị sự (Agenda items) & Kết luận
  if (meeting.agendaItems.length === 0) {
    blockers.push({
      type: 'error',
      field: 'agendaItems',
      message: 'Cuộc họp chưa có nội dung / chương trình nghị sự nào.',
      blockTarget: 'block-agenda',
    });
  } else {
    let totalOpinionsCount = 0;

    meeting.agendaItems.forEach((item, idx) => {
      totalOpinionsCount += item.opinions.length;

      if (!item.decision || !item.decision.content.trim()) {
        blockers.push({
          type: 'error',
          field: `agenda-${item.id}`,
          message: `Vấn đề "${item.title || `Mục ${idx + 1}`}" chưa có kết luận hoặc quyết nghị chính thức.`,
          blockTarget: `agenda-item-${item.id}`,
        });
      }

      // Kiểm tra biểu quyết bắt buộc đối với Nhóm B (Pháp lý DN)
      if (meeting.group === 'B') {
        if (!item.decision?.vote) {
          blockers.push({
            type: 'error',
            field: `vote-${item.id}`,
            message: `Quyết nghị tại Mục #${idx + 1} ("${item.title}") bắt buộc phải tổ chức biểu quyết theo quy định Điều 148 Luật Doanh nghiệp 2020.`,
            blockTarget: `agenda-item-${item.id}`,
          });
        }
      }

      // Kiểm tra tính toàn vẹn số phiếu nếu có biểu quyết
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

    if (totalOpinionsCount === 0) {
      warnings.push({
        type: 'warning',
        field: 'opinions',
        message: 'Cuộc họp chưa ghi nhận ý kiến phát biểu thảo luận nào của đại biểu. Nên bổ sung diễn biến thảo luận trước khi duyệt.',
        blockTarget: 'block-agenda',
      });
    }
  }

  // 6. Action items validation
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);
  const participantIds = new Set(meeting.participants.map((p) => p.id));
  const actionsPerOwnerMap: Record<string, number> = {};

  allActions.forEach((action, idx) => {
    if (!action.ownerId || !action.ownerName.trim()) {
      blockers.push({
        type: 'error',
        field: `action-owner-${action.id}`,
        message: `Hành động #${idx + 1} ("${action.title}") chưa có Người phụ trách (Owner). Nguyên tắc: Một việc phải có đúng một người chịu trách nhiệm.`,
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
        message: `Người phụ trách "${action.ownerName}" của hành động "${action.title}" không có trong danh sách thành phần tham dự cuộc họp.`,
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
