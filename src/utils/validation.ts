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

  // 2. Kiểm tra Chủ tọa và Thư ký (bao gồm trạng thái có mặt thực tế)
  const chairpersons = meeting.participants.filter((p) => p.role === 'chairperson');
  const secretaries = meeting.participants.filter((p) => p.role === 'secretary');
  const hasAttendingChair = chairpersons.some(
    (p) => p.status === 'present' || p.status === 'late'
  );
  const hasAttendingSecretary = secretaries.some(
    (p) => p.status === 'present' || p.status === 'late'
  );

  if (['B', 'D'].includes(meeting.group)) {
    if (chairpersons.length === 0) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message:
          'Bắt buộc phải có ít nhất 01 Chủ tọa cuộc họp (theo Luật Doanh nghiệp / quy chuẩn pháp lý).',
        blockTarget: 'block-participants',
      });
    } else if (!hasAttendingChair) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message:
          'Chủ tọa cuộc họp đang ở trạng thái Vắng mặt — vui lòng cập nhật điểm danh hoặc chỉ định Chủ tọa điều hành thay thế.',
        blockTarget: 'block-participants',
      });
    }

    if (secretaries.length === 0) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message: 'Bắt buộc phải có ít nhất 01 Thư ký / Người ghi biên bản.',
        blockTarget: 'block-participants',
      });
    } else if (!hasAttendingSecretary) {
      blockers.push({
        type: 'error',
        field: 'participants',
        message:
          'Thư ký ghi biên bản đang ở trạng thái Vắng mặt — vui lòng cập nhật điểm danh hoặc cử Thư ký trực tiếp ghi biên bản.',
        blockTarget: 'block-participants',
      });
    }
  } else {
    if (chairpersons.length === 0 || !hasAttendingChair) {
      warnings.push({
        type: 'warning',
        field: 'participants',
        message: 'Chưa có Chủ tọa / Người chủ trì đang có mặt điều hành cuộc họp.',
        blockTarget: 'block-participants',
      });
    }
    if (secretaries.length === 0 || !hasAttendingSecretary) {
      warnings.push({
        type: 'warning',
        field: 'participants',
        message: 'Nên phân công rõ Thư ký ghi biên bản để hoàn thiện chữ ký theo Nghị định 30.',
        blockTarget: 'block-participants',
      });
    }
  }

  // Kiểm tra trường hợp từ chối ký biên bản (Điều 158 Luật Doanh nghiệp 2020)
  meeting.participants.forEach((p) => {
    if (p.refusedSign && !p.refusalReason?.trim()) {
      blockers.push({
        type: 'error',
        field: `refusal-${p.id}`,
        message: `Đại biểu "${p.name}" được đánh dấu từ chối ký biên bản nhưng chưa ghi rõ lý do theo Điều 158 Luật Doanh nghiệp 2020.`,
        blockTarget: 'block-participants',
      });
    }
  });

  // Kiểm tra thông tin pháp nhân đối với Nhóm B (Điều 150, 158 Luật DN 2020)
  if (meeting.group === 'B') {
    if (!meeting.organization.enterpriseCode?.trim()) {
      warnings.push({
        type: 'warning',
        field: 'enterpriseCode',
        message:
          'Nên bổ sung Mã số doanh nghiệp (MSDN) vào thông tin pháp nhân theo Điều 150, 158 Luật Doanh nghiệp 2020.',
        blockTarget: 'block-info',
      });
    }
    if (!meeting.organization.address?.trim()) {
      warnings.push({
        type: 'warning',
        field: 'address',
        message: 'Nên bổ sung Địa chỉ trụ sở chính của doanh nghiệp vào phần thông tin pháp nhân.',
        blockTarget: 'block-info',
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
        message:
          'Cuộc họp đối ngoại (Nhóm D) nên phân định rõ đại diện Bên A và Bên B để đảm bảo tính ràng buộc cam kết.',
        blockTarget: 'block-participants',
      });
    }
    if (
      !meeting.bilateral?.partyA?.companyName?.trim() ||
      !meeting.bilateral?.partyB?.companyName?.trim() ||
      !meeting.bilateral?.partyA?.representative?.trim() ||
      !meeting.bilateral?.partyB?.representative?.trim()
    ) {
      warnings.push({
        type: 'warning',
        field: 'bilateral_info',
        message:
          'Nên hoàn thiện đầy đủ tên pháp nhân và người đại diện Bên A & Bên B trong Hồ sơ & Phụ lục.',
        blockTarget: 'block-bilateral',
      });
    }
  }

  // 3. Thời gian bắt đầu và kết thúc
  const effectiveEndTime = meeting.archiveDetails?.adjournedAt || meeting.endTime;
  if (meeting.startTime && effectiveEndTime) {
    const [startH, startM] = meeting.startTime.split(':').map(Number);
    const [endH, endM] = effectiveEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      blockers.push({
        type: 'error',
        field: 'time',
        message: `Thời gian kết thúc / bế mạc (${effectiveEndTime}) phải diễn ra sau thời gian khai mạc (${meeting.startTime}).`,
        blockTarget: 'block-info',
      });
    }
  }

  // 4. Túc số (Quorum) — Chặn nghiêm ngặt đối với Nhóm B trừ khi lập Biên bản họp không thành (Điều 145)
  if (meeting.quorum && !meeting.quorum.isMet) {
    if (meeting.isInquorateMinutes) {
      warnings.push({
        type: 'warning',
        field: 'quorum',
        message: `Đang lập Biên bản họp không thành (Điều 145 Luật DN 2020) do túc số thực tế đạt ${meeting.quorum.actualPercentage}% / ${meeting.quorum.requiredPercentage}%.`,
        blockTarget: 'block-quorum',
      });
    } else if (meeting.group === 'B' || meeting.quorum.requiredPercentage >= 50) {
      blockers.push({
        type: 'error',
        field: 'quorum',
        message: `TÚC SỐ KHÔNG ĐẠT: Đại biểu có mặt đạt ${meeting.quorum.actualPercentage}%, chưa đạt mức tối thiểu ${meeting.quorum.requiredPercentage}% theo Điều 141, 148 Luật Doanh nghiệp 2020. Có thể chuyển sang "Lập BB Họp không thành (Điều 145)" hoặc bổ sung đại biểu/ủy quyền.`,
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

  // 5. Vấn đề nghị sự (Agenda items) & Kết luận / Biểu quyết
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

      const hasContent = Boolean(item.decision?.content?.trim());
      const isDeferred = item.decision?.status === 'deferred';
      const isDeferredWithReason = isDeferred && Boolean(item.decision?.deferredReason?.trim());

      if (!item.decision || (!hasContent && !isDeferredWithReason)) {
        blockers.push({
          type: 'error',
          field: `agenda-${item.id}`,
          message: isDeferred
            ? `Vấn đề "${item.title || `Mục ${idx + 1}`}" đang chọn Tạm hoãn — vui lòng nhập nội dung hoặc lý do hoãn.`
            : `Vấn đề "${item.title || `Mục ${idx + 1}`}" chưa có kết luận hoặc quyết nghị chính thức.`,
          blockTarget: `agenda-item-${item.id}`,
        });
      }

      // Biểu quyết bắt buộc với Nhóm B (trừ biên bản họp không thành hoặc mục đã hoãn xem xét)
      if (meeting.group === 'B' && !meeting.isInquorateMinutes && !isDeferred) {
        if (!item.decision?.vote) {
          blockers.push({
            type: 'error',
            field: `vote-${item.id}`,
            message: `Quyết nghị tại Mục #${idx + 1} ("${item.title}") bắt buộc phải ghi nhận kết quả biểu quyết theo Điều 148, 158 Luật Doanh nghiệp 2020.`,
            blockTarget: `agenda-item-${item.id}`,
          });
        }
      }

      // Kiểm tra tính toàn vẹn số phiếu và tính nhất quán với trạng thái quyết nghị
      if (item.decision?.vote) {
        const v = item.decision.vote;
        const totalVotes = v.inFavor + v.against + v.abstain + (v.invalid || 0);
        if (totalVotes > v.totalEligible) {
          blockers.push({
            type: 'error',
            field: `vote-${item.id}`,
            message: `Tổng số phiếu biểu quyết (${totalVotes}) vượt quá tổng quyền hợp lệ (${v.totalEligible}) tại mục "${item.title}".`,
            blockTarget: `agenda-item-${item.id}`,
          });
        }

        if (!v.isPassed && item.decision.status === 'agreed') {
          blockers.push({
            type: 'error',
            field: `vote-status-${item.id}`,
            message: `Mâu thuẫn pháp lý tại Mục #${idx + 1} ("${item.title}"): Tỷ lệ tán thành chỉ đạt ${v.ratioPassed}% (ngưỡng ${v.thresholdPercent}%), không thể để trạng thái quyết nghị là "Thống nhất thông qua".`,
            blockTarget: `agenda-item-${item.id}`,
          });
        } else if (v.isPassed && item.decision.status === 'disagreed') {
          warnings.push({
            type: 'warning',
            field: `vote-status-${item.id}`,
            message: `Lưu ý tại Mục #${idx + 1} ("${item.title}"): Tỷ lệ biểu quyết đã đạt ${v.ratioPassed}% / ${v.thresholdPercent}% nhưng trạng thái quyết nghị đang chọn "Không thông qua".`,
            blockTarget: `agenda-item-${item.id}`,
          });
        }
      }
    });

    if (totalOpinionsCount === 0 && !meeting.isInquorateMinutes) {
      warnings.push({
        type: 'warning',
        field: 'opinions',
        message:
          'Cuộc họp chưa ghi nhận ý kiến phát biểu thảo luận nào của đại biểu. Nên bổ sung diễn biến thảo luận trước khi duyệt.',
        blockTarget: 'block-agenda',
      });
    }
  }

  // 6. Action items validation (hỗ trợ đối chiếu qua cả id cuộc họp, directoryMemberId, email và họ tên)
  const allActions = meeting.agendaItems.flatMap((i) => i.actionItems);
  const participantIdSet = new Set<string>();
  const participantEmails = new Set<string>();
  const participantNames = new Set<string>();

  meeting.participants.forEach((p) => {
    if (p.id) participantIdSet.add(p.id);
    if (p.directoryMemberId) participantIdSet.add(p.directoryMemberId);
    if (p.email) participantEmails.add(p.email.trim().toLowerCase());
    if (p.name) participantNames.add(p.name.trim().toLowerCase());
  });

  const actionsPerOwnerMap: Record<string, number> = {};

  allActions.forEach((action, idx) => {
    if (!action.ownerId || !action.ownerName.trim()) {
      blockers.push({
        type: 'error',
        field: `action-owner-${action.id}`,
        message: `Nhiệm vụ #${idx + 1} ("${action.title}") chưa có Người chủ trì (Owner). Nguyên tắc giải trình: Mỗi đầu việc phải có đúng 01 người chịu trách nhiệm chính.`,
        blockTarget: 'block-actions',
      });
    }

    if (!action.deadline) {
      blockers.push({
        type: 'error',
        field: `action-deadline-${action.id}`,
        message: `Nhiệm vụ #${idx + 1} ("${action.title}") chưa có thời hạn hoàn thành (Deadline).`,
        blockTarget: 'block-actions',
      });
    } else if (meeting.date && action.deadline < meeting.date && !action.carriedFromPrevious) {
      blockers.push({
        type: 'error',
        field: `action-deadline-${action.id}`,
        message: `Hạn chót của nhiệm vụ "${action.title}" (${action.deadline}) không được đặt trước ngày họp (${meeting.date}).`,
        blockTarget: 'block-actions',
      });
    }

    if (!action.deliverable || !action.deliverable.trim()) {
      blockers.push({
        type: 'error',
        field: `action-deliverable-${action.id}`,
        message: `Nhiệm vụ #${idx + 1} ("${action.title}") thiếu Sản phẩm đầu ra (Deliverable / DoD) để nghiệm thu.`,
        blockTarget: 'block-actions',
      });
    }

    const inParticipants =
      (action.ownerId && participantIdSet.has(action.ownerId)) ||
      (action.ownerEmail && participantEmails.has(action.ownerEmail.trim().toLowerCase())) ||
      participantNames.has(action.ownerName.trim().toLowerCase());

    if (action.ownerName.trim() && !inParticipants) {
      warnings.push({
        type: 'warning',
        field: `action-owner-${action.id}`,
        message: `Người chủ trì "${action.ownerName}" của nhiệm vụ "${action.title}" không nằm trong thành phần tham dự trực tiếp cuộc họp (cần gửi thông báo phân phối Nơi nhận).`,
        blockTarget: 'block-actions',
      });
    }

    const ownerKey = `${(action.ownerEmail || action.ownerId || action.ownerName).toLowerCase()}_${action.deadline}`;
    actionsPerOwnerMap[ownerKey] = (actionsPerOwnerMap[ownerKey] || 0) + 1;
    if (actionsPerOwnerMap[ownerKey] > 3) {
      warnings.push({
        type: 'warning',
        field: `action-load-${action.id}`,
        message: `Ông/Bà "${action.ownerName}" đang được giao ${actionsPerOwnerMap[ownerKey]} nhiệm vụ trùng hạn chót ${action.deadline} — cân nhắc giãn tiến độ để khả thi.`,
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
