import type { Meeting } from '../types';

export const CANONICAL_SEAL_TAG = '[SHA256-CANONICAL]';

/**
 * Standard SHA-256 deterministic hash implementation in pure TypeScript.
 * Given the same UTF-8 content, it ALWAYS produces the exact same 64-hex-character SHA-256 hash.
 */
export function generateContentHash(content: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  // Encode UTF-8 bytes
  const utf8: number[] = [];
  for (let i = 0; i < content.length; i++) {
    let charcode = content.charCodeAt(i);
    if (charcode < 0x80) {
      utf8.push(charcode);
    } else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (content.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  // Pre-processing (Padding)
  const bitLength = utf8.length * 8;
  utf8.push(0x80);
  while (utf8.length % 64 !== 56) {
    utf8.push(0);
  }

  // Append 64-bit length (big-endian)
  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;
  utf8.push(
    (highBits >>> 24) & 0xff,
    (highBits >>> 16) & 0xff,
    (highBits >>> 8) & 0xff,
    highBits & 0xff,
    (lowBits >>> 24) & 0xff,
    (lowBits >>> 16) & 0xff,
    (lowBits >>> 8) & 0xff,
    lowBits & 0xff
  );

  const words = new Uint32Array(64);

  for (let chunk = 0; chunk < utf8.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      const offset = chunk + i * 4;
      words[i] =
        (utf8[offset] << 24) |
        (utf8[offset + 1] << 16) |
        (utf8[offset + 2] << 8) |
        utf8[offset + 3];
    }

    for (let i = 16; i < 64; i++) {
      const s0 =
        ((words[i - 15] >>> 7) | (words[i - 15] << 25)) ^
        ((words[i - 15] >>> 18) | (words[i - 15] << 14)) ^
        (words[i - 15] >>> 3);
      const s1 =
        ((words[i - 2] >>> 17) | (words[i - 2] << 15)) ^
        ((words[i - 2] >>> 19) | (words[i - 2] << 13)) ^
        (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + words[i]) >>> 0;
      const S0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return (
    toHex(h0) +
    toHex(h1) +
    toHex(h2) +
    toHex(h3) +
    toHex(h4) +
    toHex(h5) +
    toHex(h6) +
    toHex(h7)
  ).toUpperCase();
}

/**
 * Builds a deterministic, canonical SHA-256 fingerprint of the legal minutes record.
 * Excludes mutable post-meeting operational fields (like ActionBoard progress `status`, `completedAt`,
 * `postponedReason`, `updatedAt`, lifecycle `status` transitions `approved` -> `published` -> `archived`,
 * and `auditLogs`) so post-meeting task tracking never invalidates the signed legal document seal.
 */
export function computeMeetingIntegrityHash(meeting: Meeting): string {
  const canonicalPayload = {
    code: meeting.code.trim(),
    version: meeting.version,
    title: meeting.title.trim(),
    group: meeting.group,
    type: meeting.type,
    isInquorateMinutes: Boolean(meeting.isInquorateMinutes),
    organization: {
      governingBody: meeting.organization.governingBody || '',
      name: meeting.organization.name || '',
      department: meeting.organization.department || '',
      enterpriseCode: meeting.organization.enterpriseCode || '',
      address: meeting.organization.address || '',
    },
    locationCity: meeting.locationCity || '',
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    venue: meeting.venue,
    meetingMode: meeting.meetingMode,
    participants: meeting.participants.map((p) => ({
      name: p.name,
      role: p.role,
      title: p.title,
      affiliation: p.affiliation || 'internal',
      status: p.status,
      delegatedTo: p.delegatedTo || '',
      sharesCount: p.sharesCount ?? null,
      capitalRatio: p.capitalRatio ?? null,
      refusedSign: Boolean(p.refusedSign),
      refusalReason: p.refusalReason || '',
    })),
    quorum: meeting.quorum
      ? {
          requiredPercentage: meeting.quorum.requiredPercentage,
          actualPercentage: meeting.quorum.actualPercentage,
          isMet: meeting.quorum.isMet,
          totalCapitalOrShares: meeting.quorum.totalCapitalOrShares,
          presentCapitalOrShares: meeting.quorum.presentCapitalOrShares,
        }
      : null,
    agendaItems: meeting.agendaItems.map((item) => ({
      order: item.order,
      title: item.title,
      description: item.description || '',
      presenterName: item.presenterName || '',
      opinions: item.opinions.map((op) => ({
        speakerName: op.speakerName,
        type: op.type,
        content: op.content,
      })),
      decision: item.decision
        ? {
            content: item.decision.content,
            status: item.decision.status,
            thresholdPercent: item.decision.thresholdPercent,
            deferredReason: item.decision.deferredReason || '',
            reservedOpinions: item.decision.reservedOpinions || [],
            vote: item.decision.vote
              ? {
                  method: item.decision.vote.method,
                  inFavor: item.decision.vote.inFavor,
                  against: item.decision.vote.against,
                  abstain: item.decision.vote.abstain,
                  invalid: item.decision.vote.invalid ?? 0,
                  totalEligible: item.decision.vote.totalEligible,
                  ratioPassed: item.decision.vote.ratioPassed,
                  thresholdPercent: item.decision.vote.thresholdPercent,
                  isPassed: item.decision.vote.isPassed,
                  memberVotes: (item.decision.vote.memberVotes || []).map((mv) => ({
                    participantName: mv.participantName,
                    voteChoice: mv.voteChoice || '',
                  })),
                }
              : null,
          }
        : null,
      // Capture original assigned responsibility in the minutes (not post-meeting Kanban completion state)
      assignedActions: item.actionItems.map((act) => ({
        title: act.title,
        ownerName: act.ownerName,
        supporterNames: act.supporterNames || [],
        deliverable: act.deliverable,
      })),
    })),
    conclusionSummary: meeting.conclusionSummary || '',
    bilateral: meeting.bilateral || null,
    postMortem: meeting.postMortem || null,
    scrumRetro: meeting.scrumRetro || null,
    archiveDetails: meeting.archiveDetails
      ? {
          totalCopies: meeting.archiveDetails.totalCopies,
          storageLocations: meeting.archiveDetails.storageLocations,
          adjournedAt: meeting.archiveDetails.adjournedAt || '',
          approvedWithoutObjection: Boolean(meeting.archiveDetails.approvedWithoutObjection),
        }
      : null,
    signatures: meeting.signatures.map((s) => ({
      role: s.role,
      signerName: s.signerName,
      signatureType: s.signatureType,
      refused: Boolean(s.refused),
    })),
  };

  return generateContentHash(JSON.stringify(canonicalPayload));
}

export function verifyMeetingIntegrity(meeting: Meeting): {
  isSealed: boolean;
  isValid: boolean;
  mode: 'canonical' | 'legacy' | 'none';
  computedHash: string;
} {
  const computedHash = computeMeetingIntegrityHash(meeting);
  if (!meeting.contentHash) {
    return { isSealed: false, isValid: true, mode: 'none', computedHash };
  }

  const hasCanonicalAudit = Boolean(
    meeting.auditLogs?.some((log) => log.details?.includes(CANONICAL_SEAL_TAG))
  );

  if (hasCanonicalAudit) {
    return {
      isSealed: true,
      isValid: meeting.contentHash === computedHash,
      mode: 'canonical',
      computedHash,
    };
  }

  return {
    isSealed: true,
    isValid: true,
    mode: 'legacy',
    computedHash,
  };
}
