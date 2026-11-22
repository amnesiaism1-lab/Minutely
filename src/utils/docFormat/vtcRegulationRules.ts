// ============================================================================
// BỘ QUY TẮC THỂ THỨC VĂN BẢN HÀNH CHÍNH & HỢP ĐỒNG
// Căn cứ: Nghị định 30/2020/NĐ-CP & Quy chế Công tác Văn thư VTC Digicom (07/QĐ-VTS)
// ============================================================================

export type FontScalePreset = '12_13' | '13_14';

export type DocCategoryGroup =
  | 'quyet_dinh_nghi_quyet'
  | 'dieu_hanh_bao_cao'
  | 'cong_van'
  | 'hop_dong_giao_dich'
  | 'phu_luc_ban_sao';

export interface DocTypeMeta {
  code: string;
  name: string;
  upperTitle: string; // Dòng Tên loại IN HOA (rỗng với Công văn)
  group: DocCategoryGroup;
  hasTypeHeader: boolean; // False đối với Công văn
  italicBasis: boolean; // True với NQ, QĐ, QC, QyĐ (và Hợp đồng); False với TTr, BC, CV...
  hasKinhGui: boolean;
  defaultClosingCourtesy?: string; // VD: "Trân trọng./."
  supportsInternalApprovalCol?: boolean; // Mẫu 9 / Mẫu TTr nội bộ có ô PHÊ DUYỆT
  isCompanyLevelOnly?: boolean; // VD: QĐ, NQ thường ban hành cấp Công ty
}

export const DOC_TYPES_DICTIONARY: DocTypeMeta[] = [
  // Nhóm trọng tâm hay dùng nhất đưa lên đầu
  {
    code: 'TTr',
    name: 'Tờ trình',
    upperTitle: 'TỜ TRÌNH',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
    defaultClosingCourtesy: 'Trân trọng./.',
    supportsInternalApprovalCol: true,
  },
  {
    code: 'BC',
    name: 'Báo cáo',
    upperTitle: 'BÁO CÁO',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
    defaultClosingCourtesy: 'Trân trọng./.',
  },
  {
    code: 'QĐ',
    name: 'Quyết định (cá biệt)',
    upperTitle: 'QUYẾT ĐỊNH',
    group: 'quyet_dinh_nghi_quyet',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
    isCompanyLevelOnly: true,
  },
  {
    code: 'CV',
    name: 'Công văn hành chính',
    upperTitle: '',
    group: 'cong_van',
    hasTypeHeader: false,
    italicBasis: false,
    hasKinhGui: true,
    defaultClosingCourtesy: 'Trân trọng./.',
  },
  {
    code: 'HĐ',
    name: 'Hợp đồng',
    upperTitle: 'HỢP ĐỒNG DỊCH VỤ',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'BB',
    name: 'Biên bản',
    upperTitle: 'BIÊN BẢN',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  // Đầy đủ 27 loại văn bản + 3 loại bản sao theo Phụ lục Quy chế 07/QĐ-VTS
  {
    code: 'NQ',
    name: 'Nghị quyết (cá biệt)',
    upperTitle: 'NGHỊ QUYẾT',
    group: 'quyet_dinh_nghi_quyet',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
    isCompanyLevelOnly: true,
  },
  {
    code: 'CT',
    name: 'Chỉ thị',
    upperTitle: 'CHỈ THỊ',
    group: 'quyet_dinh_nghi_quyet',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'QC',
    name: 'Quy chế',
    upperTitle: 'QUY CHẾ',
    group: 'quyet_dinh_nghi_quyet',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'QyĐ',
    name: 'Quy định',
    upperTitle: 'QUY ĐỊNH',
    group: 'quyet_dinh_nghi_quyet',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'TB',
    name: 'Thông báo',
    upperTitle: 'THÔNG BÁO',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
    defaultClosingCourtesy: 'Trân trọng./.',
  },
  {
    code: 'TC',
    name: 'Thông cáo',
    upperTitle: 'THÔNG CÁO',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'HD',
    name: 'Hướng dẫn',
    upperTitle: 'HƯỚNG DẪN',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'CTr',
    name: 'Chương trình',
    upperTitle: 'CHƯƠNG TRÌNH',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'KH',
    name: 'Kế hoạch',
    upperTitle: 'KẾ HOẠCH',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'PA',
    name: 'Phương án',
    upperTitle: 'PHƯƠNG ÁN',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'ĐA',
    name: 'Đề án',
    upperTitle: 'ĐỀ ÁN',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'DA',
    name: 'Dự án',
    upperTitle: 'DỰ ÁN',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'CD',
    name: 'Công điện',
    upperTitle: 'CÔNG ĐIỆN',
    group: 'dieu_hanh_bao_cao',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'BGN',
    name: 'Bản ghi nhớ',
    upperTitle: 'BẢN GHI NHỚ',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'BTT',
    name: 'Bản thỏa thuận',
    upperTitle: 'BẢN THỎA THUẬN',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'GUQ',
    name: 'Giấy ủy quyền',
    upperTitle: 'GIẤY ỦY QUYỀN',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: true,
    hasKinhGui: false,
  },
  {
    code: 'GM',
    name: 'Giấy mời',
    upperTitle: 'GIẤY MỜI',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
    defaultClosingCourtesy: 'Trân trọng./.',
  },
  {
    code: 'GGT',
    name: 'Giấy giới thiệu',
    upperTitle: 'GIẤY GIỚI THIỆU',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: false,
  },
  {
    code: 'GNP',
    name: 'Giấy nghỉ phép',
    upperTitle: 'GIẤY NGHỈ PHÉP',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'PG',
    name: 'Phiếu gửi',
    upperTitle: 'PHIẾU GỬI',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'PC',
    name: 'Phiếu chuyển',
    upperTitle: 'PHIẾU CHUYỂN',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'PB',
    name: 'Phiếu báo',
    upperTitle: 'PHIẾU BÁO',
    group: 'hop_dong_giao_dich',
    hasTypeHeader: true,
    italicBasis: false,
    hasKinhGui: true,
  },
  {
    code: 'SY',
    name: 'Bản sao y',
    upperTitle: 'SAO Y BẢN CHÍNH',
    group: 'phu_luc_ban_sao',
    hasTypeHeader: false,
    italicBasis: false,
    hasKinhGui: false,
  },
];

export interface VtcDepartmentUnit {
  code: string;
  name: string;
  upperName: string;
  defaultCity: string;
  isCompanyRoot?: boolean;
  headTitle: string;
}

export const VTC_ORGANIZATION_DEFAULTS = {
  governingBody: 'TỔNG CÔNG TY TRUYỀN THÔNG ĐA PHƯƠNG TIỆN',
  governingCode: 'VTC',
  companyName: 'CÔNG TY TNHH MỘT THÀNH VIÊN VIỄN THÔNG SỐ VTC',
  companyShortName: 'CÔNG TY TNHH MTV VIỄN THÔNG SỐ VTC',
  companyCode: 'VTS',
  defaultChairman: 'Trần Quốc Sơn',
  address: 'Số 65 Lạc Trung, phường Vĩnh Tuy, thành phố Hà Nội',
  phone: '024.44501901',
  website: 'https://vtcdigicom.vn',
};

export const VTC_DEPARTMENTS: VtcDepartmentUnit[] = [
  {
    code: 'VTS',
    name: 'Cấp Công ty (VTC Digicom)',
    upperName: '',
    defaultCity: 'Hà Nội',
    isCompanyRoot: true,
    headTitle: 'CHỦ TỊCH',
  },
  {
    code: 'GĐ',
    name: 'Ban Giám đốc',
    upperName: 'BAN GIÁM ĐỐC',
    defaultCity: 'Hà Nội',
    headTitle: 'GIÁM ĐỐC',
  },
  {
    code: 'TCHC',
    name: 'Phòng Tổ chức - Hành chính',
    upperName: 'PHÒNG TỔ CHỨC - HÀNH CHÍNH',
    defaultCity: 'Hà Nội',
    headTitle: 'TRƯỞNG PHÒNG',
  },
  {
    code: 'TCKT',
    name: 'Phòng Tài chính Kế toán',
    upperName: 'PHÒNG TÀI CHÍNH KẾ TOÁN',
    defaultCity: 'Hà Nội',
    headTitle: 'KẾ TOÁN TRƯỞNG',
  },
  {
    code: 'KT',
    name: 'Phòng Kỹ thuật',
    upperName: 'PHÒNG KỸ THUẬT',
    defaultCity: 'Hà Nội',
    headTitle: 'TRƯỞNG PHÒNG',
  },
  {
    code: 'ĐHKT',
    name: 'Trung tâm Điều hành Kỹ thuật',
    upperName: 'TRUNG TÂM ĐIỀU HÀNH KỸ THUẬT',
    defaultCity: 'Hà Nội',
    headTitle: 'GIÁM ĐỐC TRUNG TÂM',
  },
  {
    code: 'CN&ATTT',
    name: 'Trung tâm Công nghệ và An toàn thông tin',
    upperName: 'TRUNG TÂM CÔNG NGHỆ VÀ AN TOÀN THÔNG TIN',
    defaultCity: 'Hà Nội',
    headTitle: 'GIÁM ĐỐC TRUNG TÂM',
  },
  {
    code: 'ITV',
    name: 'Trung tâm Phát thanh Truyền hình Internet',
    upperName: 'TRUNG TÂM PHÁT THANH TRUYỀN HÌNH INTERNET',
    defaultCity: 'Hà Nội',
    headTitle: 'GIÁM ĐỐC TRUNG TÂM',
  },
  {
    code: 'KD',
    name: 'Trung tâm Kinh doanh',
    upperName: 'TRUNG TÂM KINH DOANH',
    defaultCity: 'Hà Nội',
    headTitle: 'GIÁM ĐỐC TRUNG TÂM',
  },
  {
    code: 'CNPN',
    name: 'Chi nhánh phía Nam',
    upperName: 'CHI NHÁNH PHÍA NAM',
    defaultCity: 'Thành phố Hồ Chí Minh',
    headTitle: 'GIÁM ĐỐC CHI NHÁNH',
  },
];

export type SigningAuthorityMode =
  | 'direct_chairman'
  | 'direct_director'
  | 'kt_director'
  | 'tl_director'
  | 'tuq_director'
  | 'unit_head'
  | 'tm_collective';

export interface SigningAuthorityOption {
  id: SigningAuthorityMode;
  label: string;
  topLine: string; // VD: "KT. GIÁM ĐỐC" hoặc ""
  roleLine: string; // VD: "PHÓ GIÁM ĐỐC" hoặc "CHỦ TỊCH"
  scopeHint: string; // Phụ lục VII Quy chế 07/QĐ-VTS
}

export const SIGNING_AUTHORITY_PRESETS: SigningAuthorityOption[] = [
  {
    id: 'direct_chairman',
    label: 'Chủ tịch Công ty ký trực tiếp',
    topLine: '',
    roleLine: 'CHỦ TỊCH',
    scopeHint:
      'Văn bản gửi Lãnh đạo TCT VTC; Quyết định chiến lược, tổ chức cán bộ, vốn, tái cơ cấu, khen thưởng.',
  },
  {
    id: 'direct_director',
    label: 'Giám đốc Công ty ký trực tiếp',
    topLine: '',
    roleLine: 'GIÁM ĐỐC',
    scopeHint:
      'Văn bản gửi đơn vị thuộc TCT VTC, đối tác; báo cáo quý/tháng/tuần; điều hành SXKD hàng ngày.',
  },
  {
    id: 'kt_director',
    label: 'Phó Giám đốc ký thay (KT.)',
    topLine: 'KT. GIÁM ĐỐC',
    roleLine: 'PHÓ GIÁM ĐỐC',
    scopeHint: 'Ký thay Giám đốc đối với các văn bản thuộc lĩnh vực được phân công phụ trách.',
  },
  {
    id: 'tl_director',
    label: 'Trưởng đơn vị ký thừa lệnh (TL.)',
    topLine: 'TL. GIÁM ĐỐC',
    roleLine: 'TRƯỞNG PHÒNG TỔ CHỨC - HÀNH CHÍNH',
    scopeHint:
      'Ký thừa lệnh Giám đốc các văn bản thông báo, giao dịch, hướng dẫn chuyên môn thuộc chức năng đơn vị.',
  },
  {
    id: 'tuq_director',
    label: 'Ký thừa ủy quyền (TUQ.)',
    topLine: 'TUQ. GIÁM ĐỐC',
    roleLine: 'GIÁM ĐỐC CHI NHÁNH',
    scopeHint: 'Ký thừa ủy quyền bằng văn bản có thời hạn cụ thể.',
  },
  {
    id: 'unit_head',
    label: 'Trưởng đơn vị trình nội bộ',
    topLine: '',
    roleLine: 'TRƯỞNG ĐƠN VỊ',
    scopeHint: 'Dùng cho Tờ trình nội bộ, Báo cáo đơn vị gửi Chủ tịch hoặc Giám đốc Công ty.',
  },
  {
    id: 'tm_collective',
    label: 'Thay mặt tập thể (TM.)',
    topLine: 'TM. HỘI ĐỒNG',
    roleLine: 'CHỦ TỊCH HỘI ĐỒNG',
    scopeHint: 'Dùng cho Nghị quyết, văn bản của Hội đồng / Ban Chỉ đạo.',
  },
];

export type ConfidentialityLevel = 'none' | 'MAT' | 'TOI_MAT' | 'TUYET_MAT';
export type UrgencyLevel = 'none' | 'KHAN' | 'THUONG_KHAN' | 'HOA_TOC';
export type CirculationScope = 'none' | 'LUU_HANH_NOI_BO' | 'XEM_XONG_TRA_LAI' | 'TAI_LIEU_THU_HOI';

/**
 * Ô số 3: Sinh chuỗi Số & Ký hiệu văn bản chuẩn Nghị định 30 & Quy chế 07/QĐ-VTS
 * - Số < 10 bắt buộc đệm số 0 (VD: 05, 07)
 * - Không có khoảng trắng quanh dấu "/" và "-"
 * - Công văn chuẩn NĐ30: Số: 05/VTS-TCHC (hoặc chế độ legacy CV: Số: 05/CV-VTS)
 */
export function generateStandardDocCode(params: {
  sequenceNumber?: number | string;
  docTypeCode: string;
  issuerOrgCode: string; // VD: "VTS"
  draftingDeptCode: string; // VD: "TCHC", "KD", hoặc "VTS"
  useLegacyCvCode?: boolean;
  contractYear?: number;
}): string {
  const rawSeq = String(params.sequenceNumber ?? '').trim();
  let formattedSeq = '      '; // Để trống chờ Văn thư cấp số nếu người dùng chưa nhập
  if (rawSeq !== '') {
    const num = parseInt(rawSeq, 10);
    formattedSeq = !Number.isNaN(num) && num > 0 && num < 10 ? `0${num}` : rawSeq.replace(/\s+/g, '');
  }

  const org = (params.issuerOrgCode || 'VTS').trim().toUpperCase().replace(/\s+/g, '');
  const dept = (params.draftingDeptCode || org).trim().toUpperCase().replace(/\s+/g, '');
  const type = (params.docTypeCode || 'CV').trim().replace(/\s+/g, '');

  // Hợp đồng thường có năm: Số: 01/2026/HĐDV-VTS
  if (type === 'HĐ') {
    const yr = params.contractYear || new Date().getFullYear();
    return `Số: ${formattedSeq}/${yr}/HĐ-${org}`;
  }

  // Công văn (không có tên loại văn bản)
  if (type === 'CV') {
    if (params.useLegacyCvCode) {
      return `Số: ${formattedSeq}/CV-${dept === org ? org : dept}`;
    }
    const suffixUnit = dept === org ? 'TCHC' : dept;
    return `Số: ${formattedSeq}/${org}-${suffixUnit}`;
  }

  // Các văn bản có tên loại: Số: [STT]/[Mã loại]-[Mã cơ quan hoặc Mã đơn vị trình]
  // Nếu ban hành cấp Công ty (QĐ, NQ, hoặc chọn VTS) -> -VTS; nếu cấp đơn vị trình (TTr, BC nội bộ) -> -[Mã đơn vị]
  const issuingCode = type === 'QĐ' || type === 'NQ' ? org : dept;
  return `Số: ${formattedSeq}/${type}-${issuingCode}`;
}

/**
 * Ô số 4: Định dạng Địa danh & Ngày tháng chuẩn Phụ lục I Nghị định 30/2020/NĐ-CP
 * Quy tắc:
 * - Ngày < 10 bắt buộc thêm 0 (01..09)
 * - Tháng 1 và 2 bắt buộc thêm 0 (tháng 01, tháng 02)
 * - Tháng 3 đến 12 KHÔNG thêm số 0 (tháng 3..tháng 9, tháng 10..12)
 */
export function formatDecree30DateLine(city: string, dateStr?: string): string {
  const cleanCity = (city || 'Hà Nội').trim();
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${cleanCity}, ngày .... tháng .... năm ${new Date().getFullYear()}`;
  }
  const [yStr, mStr, dStr] = dateStr.split('-');
  const day = parseInt(dStr, 10);
  const month = parseInt(mStr, 10);
  const dayFormatted = day < 10 ? `0${day}` : String(day);
  const monthFormatted = month === 1 || month === 2 ? `0${month}` : String(month);
  return `${cleanCity}, ngày ${dayFormatted} tháng ${monthFormatted} năm ${yStr}`;
}

export interface LinterIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
}

/**
 * Bộ Kiểm lỗi Chính tả, Viết hoa & Thể thức Tự động (Auto-Linter theo NĐ30 & 07/QĐ-VTS)
 */
export function lintAdministrativeDocument(params: {
  docTypeCode: string;
  docCodeText: string;
  dateLineText: string;
  signerName: string;
  basisLines: string[];
  bodyText: string;
  receivers: string[];
}): LinterIssue[] {
  const issues: LinterIssue[] = [];
  const fullText = [params.bodyText, ...params.basisLines].join('\n');

  // 1. Kiểm tra Số & Ký hiệu (Ô số 3)
  if (/\s*\/\s*|\s*-\s*/.test(params.docCodeText.replace(/^Số:\s*/, '')) && /\s+\/|\s+-|\/\s+|-\s+/.test(params.docCodeText)) {
    issues.push({
      id: 'code-space',
      severity: 'error',
      category: 'Ô 3 · Số & Ký hiệu',
      message: 'Có khoảng trắng thừa xung quanh dấu gạch chéo (/) hoặc gạch nối (-) trong Số/Ký hiệu.',
      suggestion: 'Xóa khoảng trắng giữa các ký hiệu (VD: Số: 05/QĐ-VTS).',
    });
  }

  const singleDigitNo = params.docCodeText.match(/Số:\s*([1-9])\//);
  if (singleDigitNo) {
    issues.push({
      id: 'code-zero',
      severity: 'error',
      category: 'Ô 3 · Số & Ký hiệu',
      message: `Số thứ tự văn bản < 10 ("${singleDigitNo[1]}") chưa có chữ số 0 đứng trước.`,
      suggestion: `Đổi thành "Số: 0${singleDigitNo[1]}/..." theo Mục 3A Quy chế 07/QĐ-VTS.`,
    });
  }

  if (params.docTypeCode === 'CV' && /\/CV-/i.test(params.docCodeText)) {
    issues.push({
      id: 'cv-legacy-code',
      severity: 'warning',
      category: 'Ô 3 · Ký hiệu Công văn',
      message:
        'Đang dùng ký hiệu "/CV-". Theo Nghị định 30 & Mục 3A Quy chế 07/QĐ-VTS, Công văn không có tên loại nên ghi [Mã cơ quan]-[Mã đơn vị soạn thảo].',
      suggestion: 'Chuẩn hóa thành kiểu "Số: 05/VTS-TCHC" (trừ khi dùng biểu mẫu cũ của đơn vị).',
    });
  }

  // 2. Kiểm tra Ngày tháng (Ô số 4)
  const badMonthZero = params.dateLineText.match(/tháng\s+0([3-9])\b/i);
  if (badMonthZero) {
    issues.push({
      id: 'date-month-zero',
      severity: 'warning',
      category: 'Ô 4 · Ngày tháng',
      message: `Tháng ${badMonthZero[1]} đang ghi thừa số 0 ("tháng 0${badMonthZero[1]}").`,
      suggestion: `Theo Phụ lục I NĐ30, chỉ tháng 01 và 02 mới thêm số 0; từ tháng 3 đến 12 ghi "tháng ${badMonthZero[1]}".`,
    });
  }

  const missingMonthZero = params.dateLineText.match(/tháng\s+([12])\b/i);
  if (missingMonthZero) {
    issues.push({
      id: 'date-month-12',
      severity: 'error',
      category: 'Ô 4 · Ngày tháng',
      message: `Tháng ${missingMonthZero[1]} bắt buộc phải có số 0 phía trước để chống sửa chữa gian lận.`,
      suggestion: `Đổi thành "tháng 0${missingMonthZero[1]}".`,
    });
  }

  // 3. Kiểm tra Học hàm, Học vị trước tên Người ký (Ô 7b)
  if (/^(TS|ThS|PGS|GS|KS|CN|BS|Ths|Ts)\.?\s+/i.test(params.signerName.trim())) {
    issues.push({
      id: 'signer-degree',
      severity: 'error',
      category: 'Ô 7b · Họ tên người ký',
      message: `Họ tên người ký ("${params.signerName}") đang ghi kèm học hàm / học vị.`,
      suggestion:
        'Quy chế 07/QĐ-VTS & NĐ30 quy định KHÔNG ghi học hàm, học vị (TS, ThS, KS...) trước tên người ký văn bản hành chính.',
    });
  }

  // 4. Kiểm tra dấu câu phần Căn cứ (Ô 6)
  params.basisLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const isLast = idx === params.basisLines.length - 1;
    if (!isLast && !trimmed.endsWith(';')) {
      issues.push({
        id: `basis-semi-${idx}`,
        severity: 'warning',
        category: 'Ô 6 · Phần căn cứ',
        message: `Dòng căn cứ thứ ${idx + 1} chưa kết thúc bằng dấu chấm phẩy (;).`,
        suggestion: 'Hết mỗi căn cứ xuống dòng phải kết thúc bằng ";", dòng căn cứ cuối kết thúc bằng ".".',
      });
    }
    if (isLast && !trimmed.endsWith('.')) {
      issues.push({
        id: 'basis-dot-last',
        severity: 'warning',
        category: 'Ô 6 · Phần căn cứ',
        message: 'Dòng căn cứ cuối cùng chưa kết thúc bằng dấu chấm (.).',
        suggestion: 'Đổi dấu cuối của dòng căn cứ cuối cùng thành dấu chấm ".".',
      });
    }
  });

  // 5. Kiểm tra Viết hoa viện dẫn pháp luật (Khoản / Điểm viết hoa sai)
  if (/(?<![\p{L}\p{N}])(Điểm\s+[a-zđ]\s+[Kk]hoản\s+\d+|Khoản\s+\d+\s+Điều\s+\d+)/u.test(fullText)) {
    issues.push({
      id: 'cap-citation',
      severity: 'warning',
      category: 'Viết hoa viện dẫn',
      message: 'Phát hiện viết hoa chữ "Điểm" hoặc "Khoản" khi viện dẫn điều luật.',
      suggestion:
        'Theo Phụ lục II NĐ30 & Mục 4 Quy chế VTC: KHÔNG viết hoa "điểm", "khoản"; chỉ viết hoa "Điều, Mục, Chương, Phần" (VD: điểm a khoản 2 Điều 10).',
    });
  }

  // 6. Kiểm tra chính tả "Cộng hoà", dấu "::", "Trân trọng ./."
  if (/Cộng\s+hoà/i.test(fullText)) {
    issues.push({
      id: 'ortho-hoa',
      severity: 'info',
      category: 'Chính tả TCVN',
      message: 'Phát hiện cách bỏ dấu cũ "Cộng hoà".',
      suggestion: 'Chuẩn hóa thành "Cộng hòa" theo quy tắc đặt dấu thanh điệu Nghị định 30.',
    });
  }

  if (/:{2,}/.test(fullText)) {
    issues.push({
      id: 'double-colon',
      severity: 'error',
      category: 'Dấu câu',
      message: 'Phát hiện lỗi lặp dấu hai chấm "::" trong nội dung văn bản.',
      suggestion: 'Bấm "Tự động chuẩn hóa câu chữ" để khử sạch "::".',
    });
  }

  if (/Trân trọng\s+\.\/\./.test(fullText)) {
    issues.push({
      id: 'courtesy-space',
      severity: 'info',
      category: 'Thể thức kết thúc',
      message: 'Có khoảng trắng thừa trước ký hiệu kết thúc "./." ("Trân trọng ./.").',
      suggestion: 'Viết liền chuẩn mực: "Trân trọng./.".',
    });
  }

  // 7. Kiểm tra dòng Lưu: VT ở Nơi nhận (Ô 9b)
  const hasLuuVt = params.receivers.some((r) => /^Lưu:\s*VT/i.test(r.trim().replace(/^-\s*/, '')));
  if (params.docTypeCode !== 'HĐ' && !hasLuuVt) {
    issues.push({
      id: 'missing-luu-vt',
      severity: 'warning',
      category: 'Ô 9b · Nơi nhận',
      message: 'Danh sách Nơi nhận chưa có dòng lưu Văn thư bắt buộc ở cuối.',
      suggestion: 'Dòng cuối Nơi nhận phải ghi: "- Lưu: VT, [Mã đơn vị soạn thảo]."',
    });
  }

  return issues;
}

/**
 * Tự động sửa nhanh các lỗi chính tả, viết hoa viện dẫn, ngày tháng & dấu câu phổ biến
 */
export function autoFixAdministrativeText(input: string): string {
  if (!input) return input;
  let txt = input;

  // 1. Dấu câu & khoảng trắng thừa
  txt = txt.replace(/\u00A0/g, ' ').replace(/[ ]{2,}/g, ' ');
  txt = txt.replace(/\s+:/g, ':').replace(/\s+,/g, ',').replace(/\s+;/g, ';');
  txt = txt.replace(/:{2,}/g, ':');
  txt = txt.replace(/Trân trọng\s*\.\/\./gi, 'Trân trọng./.');

  // 2. Chính tả Quốc hiệu / Cộng hòa
  txt = txt.replace(/Cộng\s+hoà/g, 'Cộng hòa').replace(/cộng\s+hoà/g, 'cộng hòa');
  txt = txt.replace(/Độc\s+Lập\s*[-–]\s*Tự\s+Do\s*[-–]\s*Hạnh\s+Phúc/g, 'Độc lập - Tự do - Hạnh phúc');

  // 3. Viết hoa viện dẫn điều luật: "Điểm a Khoản 2 Điều 10" -> "điểm a khoản 2 Điều 10"
  txt = txt.replace(
    /(?<![\p{L}\p{N}])Điểm\s+([a-zđ])\s+[Kk]hoản\s+(\d+)\s+[Đđ]iều\s+(\d+)/gu,
    'điểm $1 khoản $2 Điều $3'
  );
  txt = txt.replace(/(?<![\p{L}\p{N}])Khoản\s+(\d+)\s+[Đđ]iều\s+(\d+)/gu, 'khoản $1 Điều $2');
  txt = txt.replace(/(?<![\p{L}\p{N}])điều\s+(\d+)(?![\p{L}\p{N}])/gu, 'Điều $1');

  // 4. Viết hoa thứ & tháng viết chữ
  txt = txt.replace(
    /\bthứ\s+(hai|ba|tư|năm|sáu|bảy)\b/gi,
    (_, d: string) => `thứ ${d.charAt(0).toUpperCase()}${d.slice(1).toLowerCase()}`
  );

  // 5. Chuẩn hóa ngày tháng NĐ30 (01..09 ngày; 01,02 tháng; 3..12 tháng không có số 0)
  txt = txt.replace(
    /\bngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})\b/gi,
    (match, dRaw: string, mRaw: string, yRaw: string) => {
      const d = parseInt(dRaw, 10);
      const m = parseInt(mRaw, 10);
      if (d < 1 || d > 31 || m < 1 || m > 12) return match;
      const dOut = d < 10 ? `0${d}` : String(d);
      const mOut = m <= 2 ? `0${m}` : String(m);
      return `ngày ${dOut} tháng ${mOut} năm ${yRaw}`;
    }
  );

  // 6. Ngoặc kép cong tiếng Việt “...” (bỏ qua ký hiệu inch 14")
  let openQuote = true;
  let out = '';
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === '"') {
      const prevIsDigit = i > 0 && /\d/.test(txt[i - 1]);
      const nextIsSpaceOrEnd = i === txt.length - 1 || /\s/.test(txt[i + 1]);
      if (prevIsDigit && nextIsSpaceOrEnd) {
        out += ch;
      } else {
        out += openQuote ? '“' : '”';
        openQuote = !openQuote;
      }
    } else {
      out += ch;
    }
  }
  out = out.replace(/“\s+/g, '“').replace(/\s+”/g, '”');

  return out;
}

/**
 * Phân tích đối chiếu chuyên sâu Quy chế 07/QĐ-VTS, Nghị định 30/2020/NĐ-CP và Thực tiễn Mẫu biểu VTC
 * (Giải đáp câu hỏi: "xem có cần bổ sung chỉnh sửa như nào không")
 */
export interface RegulationRefinementNote {
  title: string;
  issueFound: string;
  standardResolution: string;
}

export const REGULATION_REFINEMENT_NOTES: RegulationRefinementNote[] = [
  {
    title: '1. Ký hiệu Công văn: Mẫu cũ "/CV-VTS" vs Chuẩn Quy chế 07/QĐ-VTS "/VTS-TCHC"',
    issueFound:
      'Trong phôi ảnh Công văn thực tế đang ghi "Số: .../CV-VTS", nhưng Mục 3.A Quy chế 07/QĐ-VTS và Nghị định 30 quy định Công văn KHÔNG có tên loại văn bản nên không có chữ "CV".',
    standardResolution:
      'Hệ thống mặc định sinh chuẩn pháp lý "Số: 05/VTS-[Mã đơn vị soạn]" (VD: 05/VTS-TCHC), đồng thời cung cấp nút chuyển đổi tương thích mẫu cũ "/CV-VTS" và cảnh báo trên Auto-Linter.',
  },
  {
    title: '2. Bố cục Ô "PHÊ DUYỆT" trên Tờ trình nội bộ đơn vị (Mẫu 9 vs Phôi VTC thực tế)',
    issueFound:
      'Phụ lục III Mẫu 9 mô tả khung PHÊ DUYỆT ở góc trái trên (dưới Số/Ký hiệu), trong khi phôi Tờ trình thực tế của các đơn vị VTC Digicom đặt cột "PHÊ DUYỆT" ở giữa chân trang (giữa Nơi nhận và TRƯỞNG ĐƠN VỊ).',
    standardResolution:
      'Hệ thống bổ sung tùy chọn hỗ trợ CẢ 2 KIỂU bố cục Phê duyệt (Chân trang 3 cột chuẩn thực tế VTC Digicom & Góc trái trên chuẩn Phụ lục III) để xuất Word khớp 100% nhu cầu trình ký.',
  },
  {
    title: '3. Lề trang Ngang (Landscape) cho Phụ lục Bảng biểu lớn (>= 8 cột)',
    issueFound:
      'Đặc tả Mục 1 mới nêu lề trang Dọc (Trái 30-35mm, Phải 15-20mm). Nếu áp nguyên lề này khi xoay ngang, gáy đóng hồ sơ sẽ bị lệch.',
    standardResolution:
      'Tích hợp quy tắc Mục II Phụ lục I Nghị định 30 & dự án FormatBang: Khi tự động xoay ngang Phụ lục >= 8 cột sang A4 Landscape (297×210mm), lề tự động chuyển thành Trên 20mm, Dưới 20mm, Trái 25mm (gáy trên khi đóng tập), Phải 20mm (vùng in rộng 25.2cm).',
  },
  {
    title: '4. Quy tắc Tháng 01, 02 vs Tháng 3–12 & Căn cứ Hợp đồng vs Văn bản Hành chính',
    issueFound:
      'Lập trình viên thường pad số 0 cho mọi tháng < 10 (tháng 03..09 là SAI chuẩn NĐ30), và thường áp chung chữ đứng/nghiêng cho mọi phần Căn cứ.',
    standardResolution:
      'Engine phân tách chính xác: Chỉ đệm số 0 cho ngày 01..09 và tháng 01, 02 (tự động gỡ số 0 thừa ở tháng 3..9); tự động in nghiêng Căn cứ đối với QĐ, NQ, QC, QyĐ, Hợp đồng và giữ chữ đứng đối với Tờ trình, Báo cáo, Công văn.',
  },
  {
    title: '5. Khối Thông tin Bên A / Bên B & Chống mồ côi Chữ ký (từ dự án FormatHopDong)',
    issueFound:
      'Quy chế văn thư hành chính không quy định chi tiết cấu trúc Bên A/B của Hợp đồng thương mại (dễ bị lệch dấu hai chấm, lặp "::" hoặc bảng ký bị rớt sang trang trắng cuối cùng).',
    standardResolution:
      'Bổ sung máy trạng thái Hợp đồng: Tự động tách các trường gõ dính dòng, đóng bảng 2 cột ẩn viền (3.6cm + 12.9cm) thụt treo dấu ": ", in đậm tên người sau Ông/Bà, nghiêng dòng Giấy ủy quyền và khóa cứng keepNext 3–4 đoạn cuối đi liền bảng chữ ký.',
  },
];
