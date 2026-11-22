import React, { useState, useMemo, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  CirculationScope,
  ConfidentialityLevel,
  DOC_TYPES_DICTIONARY,
  FontScalePreset,
  REGULATION_REFINEMENT_NOTES,
  SIGNING_AUTHORITY_PRESETS,
  SigningAuthorityMode,
  UrgencyLevel,
  VTC_DEPARTMENTS,
  VTC_ORGANIZATION_DEFAULTS,
  autoFixAdministrativeText,
  formatDecree30DateLine,
  generateStandardDocCode,
  lintAdministrativeDocument,
} from '../../utils/docFormat/vtcRegulationRules';
import {
  COL_KIND_LABELS,
  LANDSCAPE_CONTENT_DXA,
  PORTRAIT_CONTENT_DXA,
  calculateOptimalColumnWidthsDxa,
  exportSmartTableMatrixToDocx,
  parseSpreadsheetPasteToMatrix,
} from '../../utils/docFormat/openXmlTableEngine';
import {
  FormatDocxReport,
  FormatWordProfile,
  generateSampleUnformattedContractDocx,
  processUploadedDocxBuffer,
} from '../../utils/docFormat/openXmlContractAndAdminEngine';
import {
  AdminDocumentFormState,
  exportAdminDocumentToDocx,
} from '../../utils/docFormat/adminDocGenerator';
import {
  Upload,
  FileText,
  Table2,
  BookOpen,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wand2,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';

type StudioTab = 'upload_docx' | 'author_14box' | 'table_studio' | 'regulation_guide';

const SAMPLE_WIDE_EXCEL_TSV = [
  'STT\tDanh mục thiết bị & bản quyền\tXuất xứ\tĐVT\tSố lượng\tĐơn giá (VNĐ)\tThuế VAT\tThành tiền (VNĐ)\tBảo hành',
  '1\tMáy chủ xử lý trung tâm VTC Cloud Compute Gen11\tSingapore\tBộ\t2\t185.000.000\t10%\t407.000.000\t36 tháng',
  '2\tThiết bị cân bằng tải & tường lửa ứng dụng Web WAF HA\tMỹ\tBộ\t1\t210.000.000\t10%\t231.000.000\t24 tháng',
  '3\tBản quyền phần mềm giám sát an toàn thông tin SOC\tViệt Nam\tGói\t1\t95.000.000\t8%\t102.600.000\t12 tháng',
  'Tổng cộng đã bao gồm thuế GTGT\t\t\t\t\t\t\t740.600.000\t',
  '(Bằng chữ: Bảy trăm bốn mươi triệu sáu trăm nghìn đồng chẵn./.)\t\t\t\t\t\t\t\t',
].join('\n');

const SAMPLE_PORTRAIT_EXCEL_TSV = [
  'STT\tHạng mục công việc triển khai\tĐơn vị chủ trì\tThời hạn\tSản phẩm đầu ra',
  '1\tRà soát hạ tầng truyền dẫn và chuẩn hóa cấu hình mạng lõi\tPhòng Kỹ thuật\t15 ngày\tBiên bản nghiệm thu kỹ thuật',
  '2\tKiểm định an toàn thông tin và đánh giá lỗ hổng bảo mật\tTT CN&ATTT\t10 ngày\tBáo cáo đánh giá ATTT đạt chuẩn',
  '3\tBàn giao vận hành khai thác dịch vụ cho khách hàng\tTT ĐHKT\t05 ngày\tBiên bản bàn giao đưa vào sử dụng',
].join('\n');

function buildTemplatePreset(presetKey: 'TTr' | 'BC' | 'QĐ' | 'CV' | 'HĐ'): AdminDocumentFormState {
  const today = new Date().toISOString().split('T')[0];

  if (presetKey === 'TTr') {
    return {
      docTypeCode: 'TTr',
      fontScale: '12_13',
      governingBody: '',
      issuerOrgName: VTC_ORGANIZATION_DEFAULTS.companyName,
      draftingDeptName: 'PHÒNG TỔ CHỨC - HÀNH CHÍNH',
      draftingDeptCode: 'TCHC',
      docCodeText: 'Số: 08/TTr-TCHC',
      locationCity: 'Hà Nội',
      issueDate: today,
      subject: 'phê duyệt phương án nâng cấp hệ thống quản trị văn bản và hợp đồng số năm 2026',
      recipientsKinhGui: ['Chủ tịch Công ty TNHH Một thành viên Viễn thông số VTC'],
      basisLines: [
        'Căn cứ Quyết định số 07/QĐ-VTS ngày 30 tháng 5 năm 2023 của Công ty TNHH MTV Viễn thông số VTC về việc ban hành Quy chế công tác văn thư',
        'Căn cứ nhu cầu chuẩn hóa quy trình soạn thảo, ký duyệt văn bản hành chính và hợp đồng tại các đơn vị trực thuộc',
      ],
      bodyParagraphs: [
        'I. SỰ CẦN THIẾT VÀ HIỆN TRẠNG',
        'Hiện nay, khối lượng hồ sơ hợp đồng, phụ lục bảng biểu, tờ trình và báo cáo phát sinh tại các đơn vị rất lớn. Việc chuẩn hóa tự động theo 14 ô thể thức Nghị định 30/2020/NĐ-CP giúp tiết kiệm 80% thời gian rà soát thể thức cho Văn thư và các phòng ban.',
        'II. NỘI DUNG ĐỀ XUẤT PHÊ DUYỆT',
        '1. Triển khai phân hệ tự động chuẩn hóa Hợp đồng, Bảng biểu và Văn bản hành chính trên toàn Công ty từ quý IV năm 2026.',
        '2. Giao Phòng Tổ chức - Hành chính phối hợp Trung tâm Công nghệ và An toàn thông tin hướng dẫn áp dụng thống nhất.',
        'Kính đề nghị Chủ tịch Công ty xem xét và phê duyệt.',
      ],
      closingCourtesy: 'Trân trọng./.',
      receiversNoinhan: [
        'Như trên',
        'Ban Giám đốc (để b/c)',
        'Các đơn vị liên quan (để t/h)',
        'Lưu: VT, TCHC',
      ],
      drafterInitialsAndCopies: 'TH(02)',
      signerTopAuthorityLine: '',
      signerRoleTitle: 'TRƯỞNG PHÒNG',
      signerFullName: 'Nguyễn Văn Minh',
      approvalLayoutMode: 'footer_3col_vtc',
      confidentiality: 'none',
      urgency: 'none',
      circulationScope: 'none',
      includeContactFooterPage1: false,
      contactFooterText: `${VTC_ORGANIZATION_DEFAULTS.address} • ĐT: ${VTC_ORGANIZATION_DEFAULTS.phone}`,
    };
  }

  if (presetKey === 'BC') {
    return {
      docTypeCode: 'BC',
      fontScale: '12_13',
      governingBody: '',
      issuerOrgName: VTC_ORGANIZATION_DEFAULTS.companyName,
      draftingDeptName: 'TRUNG TÂM KINH DOANH',
      draftingDeptCode: 'KD',
      docCodeText: 'Số: 12/BC-KD',
      locationCity: 'Hà Nội',
      issueDate: today,
      subject: 'kết quả thực hiện kế hoạch sản xuất kinh doanh quý III và nhiệm vụ trọng tâm quý IV năm 2026',
      recipientsKinhGui: ['Chủ tịch Công ty TNHH Một thành viên Viễn thông số VTC'],
      basisLines: [
        'Căn cứ Kế hoạch sản xuất kinh doanh năm 2026 của Công ty TNHH MTV Viễn thông số VTC',
        'Căn cứ số liệu đối soát doanh thu dịch vụ viễn thông và giải pháp số tính đến hết quý III năm 2026',
      ],
      bodyParagraphs: [
        'I. KẾT QUẢ THỰC HIỆN QUÝ III NĂM 2026',
        '1. Doanh thu dịch vụ kênh thuê riêng và hạ tầng đám mây đạt 108% kế hoạch quý, tăng trưởng 19% so với cùng kỳ.',
        '2. Hoàn thành ký kết và nghiệm thu 14 hợp đồng cung cấp giải pháp chuyển đổi số cho nhóm khách hàng doanh nghiệp lớn.',
        'II. PHƯƠNG HƯỚNG NHIỆM VỤ QUÝ IV NĂM 2026',
        'Trên đây là nội dung báo cáo kết quả hoạt động kinh doanh quý III, Trung tâm Kinh doanh kính báo cáo Chủ tịch Công ty xem xét chỉ đạo.',
      ],
      closingCourtesy: 'Trân trọng./.',
      receiversNoinhan: [
        'Chủ tịch Công ty (để b/c)',
        'Giám đốc Công ty (để b/c)',
        'Phòng TCKT (để p/h)',
        'Lưu: VT, KD',
      ],
      drafterInitialsAndCopies: 'KD(02)',
      signerTopAuthorityLine: '',
      signerRoleTitle: 'GIÁM ĐỐC TRUNG TÂM',
      signerFullName: 'Lê Hoàng Nam',
      approvalLayoutMode: 'none',
      confidentiality: 'none',
      urgency: 'none',
      circulationScope: 'none',
      includeContactFooterPage1: false,
      contactFooterText: `${VTC_ORGANIZATION_DEFAULTS.address} • ĐT: ${VTC_ORGANIZATION_DEFAULTS.phone}`,
    };
  }

  if (presetKey === 'QĐ') {
    return {
      docTypeCode: 'QĐ',
      fontScale: '12_13',
      governingBody: VTC_ORGANIZATION_DEFAULTS.governingBody,
      issuerOrgName: VTC_ORGANIZATION_DEFAULTS.companyName,
      draftingDeptName: '',
      draftingDeptCode: 'TCHC',
      docCodeText: 'Số: 07/QĐ-VTS',
      locationCity: 'Hà Nội',
      issueDate: today,
      subject: 'áp dụng quy chuẩn định dạng tự động văn bản hành chính và hợp đồng điện tử',
      decisionAuthorityLines: ['CHỦ TỊCH', VTC_ORGANIZATION_DEFAULTS.companyName],
      recipientsKinhGui: [],
      basisLines: [
        'Căn cứ Quyết định số 811/QĐ-VTC ngày 13/07/2011 của Tổng công ty Truyền thông đa phương tiện (VTC) về việc chuyển Công ty Viễn thông số thành Công ty TNHH một thành viên do Nhà nước làm chủ sở hữu',
        'Căn cứ Quyết định số 399/QĐ-VTC ngày 12/12/2022 của Tổng công ty VTC về việc ban hành Điều lệ tổ chức và hoạt động của Công ty TNHH MTV Viễn thông số VTC (VTC Digicom); Quyết định số 360/QĐ-VTC ngày 24/8/2024 về việc sửa đổi Điều 7 Điều lệ tổ chức và hoạt động của Công ty VTC Digicom',
        'Theo đề nghị của Trưởng phòng Tổ chức - Hành chính',
      ],
      bodyParagraphs: [
        'Điều 1. Ban hành và áp dụng thống nhất bộ công cụ chuẩn hóa thể thức văn bản hành chính, hợp đồng và phụ lục bảng biểu theo Nghị định số 30/2020/NĐ-CP tại tất cả các phòng, trung tâm và chi nhánh trực thuộc Công ty.',
        'Điều 2. Giao Phòng Tổ chức - Hành chính chủ trì kiểm soát thể thức văn bản trước khi trình ký và lưu trữ hồ sơ điện tử theo quy định.',
        'Điều 3. Quyết định này có hiệu lực thi hành kể từ ngày ký. Ban Giám đốc, Trưởng các phòng, Giám đốc các trung tâm và các cá nhân liên quan chịu trách nhiệm thi hành Quyết định này./.',
      ],
      closingCourtesy: '',
      receiversNoinhan: ['Như Điều 3', 'Tổng công ty VTC (để b/c)', 'Lưu: VT, TCHC'],
      drafterInitialsAndCopies: '',
      signerTopAuthorityLine: '',
      signerRoleTitle: 'CHỦ TỊCH',
      signerFullName: VTC_ORGANIZATION_DEFAULTS.defaultChairman,
      approvalLayoutMode: 'none',
      confidentiality: 'none',
      urgency: 'none',
      circulationScope: 'none',
      includeContactFooterPage1: false,
      contactFooterText: `${VTC_ORGANIZATION_DEFAULTS.address} • ĐT: ${VTC_ORGANIZATION_DEFAULTS.phone}`,
    };
  }

  if (presetKey === 'CV') {
    return {
      docTypeCode: 'CV',
      fontScale: '12_13',
      governingBody: VTC_ORGANIZATION_DEFAULTS.governingBody,
      issuerOrgName: VTC_ORGANIZATION_DEFAULTS.companyName,
      draftingDeptName: '',
      draftingDeptCode: 'TCHC',
      docCodeText: 'Số: 05/VTS-TCHC',
      locationCity: 'Hà Nội',
      issueDate: today,
      subject: 'phối hợp đối soát hồ sơ hợp đồng và chuẩn hóa biểu mẫu báo cáo định kỳ',
      recipientsKinhGui: ['Các đơn vị trực thuộc Tổng công ty Truyền thông đa phương tiện'],
      basisLines: [],
      bodyParagraphs: [
        'Thực hiện chủ trương hiện đại hóa công tác văn thư lưu trữ và nâng cao chất lượng hồ sơ pháp lý trong giao dịch thương mại năm 2026, Công ty TNHH Một thành viên Viễn thông số VTC trân trọng đề nghị Quý đơn vị phối hợp thực hiện một số nội dung sau:',
        '1. Thống nhất chuẩn dữ liệu bảng biểu đối soát cước và biên bản nghiệm thu dịch vụ theo định dạng chuẩn Nghị định số 30/2020/NĐ-CP.',
        '2. Cử đầu mối cán bộ phụ trách phối hợp rà soát tiến độ thực hiện trước ngày 30 tháng 11 năm 2026.',
        'Rất mong nhận được sự phối hợp chặt chẽ của Quý đơn vị.',
      ],
      closingCourtesy: 'Trân trọng./.',
      receiversNoinhan: ['Như trên', 'Ban Giám đốc (để b/c)', 'Lưu: VT, TCHC'],
      drafterInitialsAndCopies: '',
      signerTopAuthorityLine: '',
      signerRoleTitle: 'CHỦ TỊCH',
      signerFullName: VTC_ORGANIZATION_DEFAULTS.defaultChairman,
      approvalLayoutMode: 'none',
      confidentiality: 'none',
      urgency: 'none',
      circulationScope: 'none',
      includeContactFooterPage1: true,
      contactFooterText: `Địa chỉ: ${VTC_ORGANIZATION_DEFAULTS.address} • Điện thoại: ${VTC_ORGANIZATION_DEFAULTS.phone} • Website: ${VTC_ORGANIZATION_DEFAULTS.website}`,
    };
  }

  // Hợp đồng (HĐ)
  return {
    docTypeCode: 'HĐ',
    fontScale: '12_13',
    governingBody: VTC_ORGANIZATION_DEFAULTS.governingBody,
    issuerOrgName: VTC_ORGANIZATION_DEFAULTS.companyName,
    draftingDeptName: '',
    draftingDeptCode: 'KD',
    docCodeText: `Số: 09/${new Date().getFullYear()}/HĐ-VTS`,
    locationCity: 'Hà Nội',
    issueDate: today,
    subject: 'HỢP ĐỒNG CUNG CẤP DỊCH VỤ KÊNH TRUYỀN DẪN VÀ HẠ TẦNG SỐ',
    recipientsKinhGui: [],
    basisLines: [
      'Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015 của Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam',
      'Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 6 năm 2005 của Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam',
      'Căn cứ nhu cầu sử dụng dịch vụ và năng lực cung ứng của hai Bên',
    ],
    partyA: {
      roleTitle: 'BÊN A (BÊN SỬ DỤNG DỊCH VỤ)',
      companyName: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN CÔNG NGHỆ Á CHÂU',
      representative: 'Ông Phạm Quốc Bảo',
      position: 'Tổng Giám đốc',
      address: 'Tầng 15, Tòa nhà Capital Place, số 29 Liễu Giai, thành phố Hà Nội',
      taxCode: '0106688992',
      bankAccount: '19034568899012',
      bankName: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank) - Chi nhánh Ba Đình',
      phone: '024.37728899',
    },
    partyB: {
      roleTitle: 'BÊN B (BÊN CUNG CẤP DỊCH VỤ)',
      companyName: VTC_ORGANIZATION_DEFAULTS.companyName,
      representative: `Ông ${VTC_ORGANIZATION_DEFAULTS.defaultChairman}`,
      position: 'Chủ tịch Công ty',
      address: VTC_ORGANIZATION_DEFAULTS.address,
      taxCode: '0105431099',
      bankAccount: '950798888',
      bankName: 'Ngân hàng TMCP Quân Đội (MB) - Chi nhánh Hai Bà Trưng',
      phone: VTC_ORGANIZATION_DEFAULTS.phone,
    },
    bodyParagraphs: [
      'Điều 1. Nội dung dịch vụ và phạm vi cung cấp',
      'Bên B cung cấp cho Bên A dịch vụ kênh truyền dẫn tốc độ cao kết hợp giải pháp giám sát an toàn thông tin 24/7 đảm bảo cam kết chất lượng SLA đạt tối thiểu 99,95%.',
      'Điều 2. Giá trị hợp đồng và phương thức thanh toán',
      '1. Giá trị thanh toán thực hiện theo bảng tổng hợp cước phí định kỳ hàng quý có xác nhận biên bản đối soát giữa hai Bên.',
      '2. Bên A thanh toán bằng hình thức chuyển khoản vào tài khoản của Bên B trong vòng 15 ngày làm việc kể từ ngày nhận đủ hồ sơ thanh toán hợp lệ.',
      'Điều 3. Điều khoản chung',
      'Hợp đồng này được lập thành 04 bản chính bằng tiếng Việt có giá trị pháp lý như nhau, mỗi Bên giữ 02 bản để thực hiện và có hiệu lực kể từ ngày ký.',
    ],
    closingCourtesy: '',
    receiversNoinhan: [],
    signerTopAuthorityLine: '',
    signerRoleTitle: 'CHỦ TỊCH',
    signerFullName: VTC_ORGANIZATION_DEFAULTS.defaultChairman,
    approvalLayoutMode: 'none',
    confidentiality: 'none',
    urgency: 'none',
    circulationScope: 'none',
    includeContactFooterPage1: false,
    contactFooterText: '',
  };
}

export const FormatWordWorkspace: React.FC = () => {
  const { toast } = useToast();
  const [studioTab, setStudioTab] = useState<StudioTab>('upload_docx');

  // =========================================================================
  // TAB 1 STATE: UPLOAD & FORMAT EXISTING .DOCX (FormatHopDong + FormatBang)
  // =========================================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProfile, setUploadProfile] = useState<FormatWordProfile>('auto');
  const [uploadFontScale, setUploadFontScale] = useState<FontScalePreset>('12_13');
  const [isProcessingDocx, setIsProcessingDocx] = useState(false);
  const [processedFileName, setProcessedFileName] = useState<string>('');
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processReport, setProcessReport] = useState<FormatDocxReport | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // =========================================================================
  // TAB 2 STATE: 14-BOX DOCUMENT AUTHORING STUDIO
  // =========================================================================
  const [formState, setFormState] = useState<AdminDocumentFormState>(() =>
    buildTemplatePreset('TTr')
  );
  const [seqInput, setSeqInput] = useState<string>('08');
  const [useLegacyCvCode, setUseLegacyCvCode] = useState<boolean>(false);
  const [signingMode, setSigningMode] = useState<SigningAuthorityMode>('unit_head');
  const [isExportingNewDocx, setIsExportingNewDocx] = useState(false);

  // =========================================================================
  // TAB 3 STATE: EXCEL / TSV SMART TABLE FORMATTER (FormatBang)
  // =========================================================================
  const [tableTitle, setTableTitle] = useState('PHỤ LỤC 01: BẢNG DỰ TOÁN CHI TIẾT HẠNG MỤC');
  const [tableSubtitle, setTableSubtitle] = useState(
    '(Kèm theo Hợp đồng / Tờ trình ngày .... tháng .... năm 2026)'
  );
  const [rawTablePaste, setRawTablePaste] = useState(SAMPLE_WIDE_EXCEL_TSV);
  const [tableOrientation, setTableOrientation] = useState<'auto' | 'portrait' | 'landscape'>(
    'auto'
  );
  const [isExportingTableDocx, setIsExportingTableDocx] = useState(false);

  // Live Linter for Tab 2
  const linterIssues = useMemo(() => {
    const dateLine = formatDecree30DateLine(formState.locationCity, formState.issueDate);
    return lintAdministrativeDocument({
      docTypeCode: formState.docTypeCode,
      docCodeText: formState.docCodeText,
      dateLineText: dateLine,
      signerName: formState.signerFullName,
      basisLines: formState.basisLines,
      bodyText: formState.bodyParagraphs.join('\n') + '\n' + formState.closingCourtesy,
      receivers: formState.receiversNoinhan,
    });
  }, [formState]);

  // Live Table Column Analysis for Tab 3
  const parsedTablePreview = useMemo(() => {
    const matrix = parseSpreadsheetPasteToMatrix(rawTablePaste);
    if (matrix.length === 0) return null;
    const headers = matrix[0] || [];
    const rows = matrix.slice(1);
    const totalCols = headers.length;
    const isLandscape =
      tableOrientation === 'landscape' || (tableOrientation === 'auto' && totalCols >= 8);
    const contentWidthDxa = isLandscape ? LANDSCAPE_CONTENT_DXA : PORTRAIT_CONTENT_DXA;
    const isCol0Index = /^(stt|tt|no\.?)$/i.test((headers[0] || '').trim());
    const { widths, kinds } = calculateOptimalColumnWidthsDxa({
      headers,
      totalCols,
      isCol0Index,
      totalWidthDxa: contentWidthDxa,
      isLandscape,
      rowsMatrix: rows,
    });
    return { matrix, headers, rows, totalCols, isLandscape, contentWidthDxa, widths, kinds };
  }, [rawTablePaste, tableOrientation]);

  const handleRunDocxFormatter = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error('Chỉ hỗ trợ định dạng Microsoft Word (.docx)', 'Nếu là file .doc cũ, vui lòng Save As sang .docx trước.');
      return;
    }
    try {
      setIsProcessingDocx(true);
      const buf = await file.arrayBuffer();
      const { blob, report } = await processUploadedDocxBuffer({
        arrayBuffer: buf,
        profile: uploadProfile,
        fontScale: uploadFontScale,
      });

      const base = file.name.replace(/\.docx$/i, '').replace(/_ND30$/i, '');
      const outName = `${base}_ND30.docx`;
      setProcessedFileName(outName);
      setProcessedBlob(blob);
      setProcessReport(report);
      toast.success('Chuẩn hóa Nghị định 30 hoàn tất!', `Sẵn sàng tải về: ${outName}`);
    } catch (err: any) {
      console.error('Lỗi chuẩn hóa docx:', err);
      toast.error('Không thể xử lý file Word này', err?.message || 'Vui lòng kiểm tra lại cấu trúc file .docx.');
    } finally {
      setIsProcessingDocx(false);
    }
  };

  const handleLoadAndFormatSampleDocx = async () => {
    try {
      setIsProcessingDocx(true);
      const sampleFile = await generateSampleUnformattedContractDocx();
      await handleRunDocxFormatter(sampleFile);
    } catch (err) {
      console.error(err);
      setIsProcessingDocx(false);
    }
  };

  const handleDownloadProcessedDocx = () => {
    if (!processedBlob || !processedFileName) return;
    const url = URL.createObjectURL(processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = processedFileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã tải về file Word đã chuẩn hóa', processedFileName);
  };

  const handleSelectQuickTemplate = (preset: 'TTr' | 'BC' | 'QĐ' | 'CV' | 'HĐ') => {
    const next = buildTemplatePreset(preset);
    setFormState(next);
    const numMatch = next.docCodeText.match(/Số:\s*(\d+)/);
    setSeqInput(numMatch ? numMatch[1] : '05');
    setSigningMode(
      preset === 'TTr' || preset === 'BC' ? 'unit_head' : 'direct_chairman'
    );
  };

  const handleDepartmentChange = (deptCode: string) => {
    const unit = VTC_DEPARTMENTS.find((d) => d.code === deptCode) || VTC_DEPARTMENTS[0];
    const nextCode = generateStandardDocCode({
      sequenceNumber: seqInput,
      docTypeCode: formState.docTypeCode,
      issuerOrgCode: 'VTS',
      draftingDeptCode: unit.code,
      useLegacyCvCode,
    });

    setFormState((prev) => ({
      ...prev,
      draftingDeptCode: unit.code,
      draftingDeptName: unit.isCompanyRoot ? '' : unit.upperName,
      locationCity: unit.defaultCity,
      docCodeText: nextCode,
      receiversNoinhan: prev.receiversNoinhan.map((r) =>
        /^Lưu:\s*VT/i.test(r.trim())
          ? `Lưu: VT${unit.isCompanyRoot ? '' : `, ${unit.code}`}`
          : r
      ),
    }));
  };

  const handleSigningModeChange = (mode: SigningAuthorityMode) => {
    setSigningMode(mode);
    const opt = SIGNING_AUTHORITY_PRESETS.find((s) => s.id === mode);
    if (!opt) return;
    setFormState((prev) => ({
      ...prev,
      signerTopAuthorityLine: opt.topLine,
      signerRoleTitle: opt.roleLine,
    }));
  };

  const handleAutoFixForm = () => {
    const fixedCode = generateStandardDocCode({
      sequenceNumber: seqInput,
      docTypeCode: formState.docTypeCode,
      issuerOrgCode: 'VTS',
      draftingDeptCode: formState.draftingDeptCode,
      useLegacyCvCode: false,
    });

    setUseLegacyCvCode(false);
    setFormState((prev) => ({
      ...prev,
      docCodeText: fixedCode,
      signerFullName: prev.signerFullName.replace(/^(TS|ThS|PGS|GS|KS|CN|BS)\.?\s+/i, '').trim(),
      basisLines: prev.basisLines
        .map((l) => autoFixAdministrativeText(l.trim()))
        .filter(Boolean)
        .map((l, idx, arr) => l.replace(/[.,;:\s]+$/, '') + (idx === arr.length - 1 ? '.' : ';')),
      bodyParagraphs: prev.bodyParagraphs.map((p) => autoFixAdministrativeText(p)),
      closingCourtesy: prev.closingCourtesy
        ? autoFixAdministrativeText(prev.closingCourtesy)
        : prev.closingCourtesy,
      receiversNoinhan: prev.receiversNoinhan.some((r) => /^Lưu:\s*VT/i.test(r.trim()))
        ? prev.receiversNoinhan
        : [
            ...prev.receiversNoinhan,
            `Lưu: VT${prev.draftingDeptCode !== 'VTS' ? `, ${prev.draftingDeptCode}` : ''}`,
          ],
    }));
    toast.success('Đã tự động chuẩn hóa Số ký hiệu, Căn cứ, Viết hoa viện dẫn & Nơi nhận');
  };

  const handleExport14BoxDocx = async () => {
    try {
      setIsExportingNewDocx(true);
      const blob = await exportAdminDocumentToDocx(formState);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeCode = formState.docCodeText
        .replace(/^Số:\s*/i, '')
        .trim()
        .replace(/[/\\?%*:|"<> ]+/g, '-');
      a.href = url;
      a.download = `${formState.docTypeCode}-${safeCode || 'Chuan-ND30'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất văn bản Word chuẩn 14 ô thể thức (.docx)');
    } catch (err) {
      console.error(err);
      toast.error('Không thể xuất file Word');
    } finally {
      setIsExportingNewDocx(false);
    }
  };

  const handleExportSmartTableDocx = async () => {
    if (!parsedTablePreview || parsedTablePreview.matrix.length === 0) {
      toast.warning('Vui lòng dán dữ liệu bảng từ Excel hoặc chọn mẫu thử');
      return;
    }
    try {
      setIsExportingTableDocx(true);
      const { blob, isLandscape } = await exportSmartTableMatrixToDocx({
        title: tableTitle,
        subtitle: tableSubtitle,
        matrix: parsedTablePreview.matrix,
        forceOrientation: tableOrientation,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bang-Bieu-Chuan-ND30-${isLandscape ? 'Ngang-25.2cm' : 'Doc-16.5cm'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Đã xuất Bảng biểu chuẩn FormatBang (${isLandscape ? 'Khổ ngang A4 25.2cm' : 'Khổ dọc A4 16.5cm'})`
      );
    } catch (err) {
      console.error(err);
      toast.error('Không thể tạo file Word cho bảng dữ liệu');
    } finally {
      setIsExportingTableDocx(false);
    }
  };

  const activeDocMeta =
    DOC_TYPES_DICTIONARY.find((d) => d.code === formState.docTypeCode) || DOC_TYPES_DICTIONARY[0];
  const previewDateLine = formatDecree30DateLine(formState.locationCity, formState.issueDate);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#0b3d91]">
              <Sparkles className="h-3.5 w-3.5 text-[#1d4ed8]" />
              Nghị định 30/2020/NĐ-CP · Quy chế 07/QĐ-VTS
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              FormatHopDong + FormatBang OpenXML Engine
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Trung tâm Chuẩn hóa Word, Hợp đồng, Bảng biểu & Văn bản 14 Ô
          </h1>
          <p className="mt-1 text-[13.5px] text-slate-600">
            Tải lên file <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">.docx</code> có sẵn để tự động chuẩn hóa siêu tốc trên trình duyệt, hoặc soạn mới Tờ trình, Báo cáo, Quyết định, Công văn, Hợp đồng và Phụ lục bảng biểu.
          </p>
        </div>

        {/* Segmented Mode Bar */}
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200/90 bg-[var(--surface-well)] p-1">
          {[
            { id: 'upload_docx' as const, label: 'Chuẩn hóa File .docx', icon: Upload },
            { id: 'author_14box' as const, label: 'Soạn Văn bản 14 Ô', icon: FileText },
            { id: 'table_studio' as const, label: 'Format Bảng từ Excel', icon: Table2 },
            { id: 'regulation_guide' as const, label: 'Quy chế & Phân tích', icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStudioTab(tab.id)}
                className={`press-subtle flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] transition-all ${
                  active
                    ? 'bg-white font-semibold text-[#0b3d91] shadow-xs'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#1d4ed8]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: UPLOAD & FORMAT EXISTING .DOCX (FormatHopDong + FormatBang)    */}
      {/* ===================================================================== */}
      {studioTab === 'upload_docx' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Configuration & Dropzone */}
          <div className="space-y-5 lg:col-span-7">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  1. Chọn chế độ chuẩn hóa OpenXML
                </h2>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">Cặp cỡ chữ chuẩn:</span>
                  {(['12_13', '13_14'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setUploadFontScale(sc)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 font-medium tabular-nums transition-colors ${
                        uploadFontScale === sc
                          ? 'border-[#1d4ed8] bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sc === '12_13' ? '12pt / 13pt' : '13pt / 14pt'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {[
                  {
                    id: 'auto' as const,
                    title: 'Tự động nhận diện (Khuyên dùng)',
                    desc: 'Tự phân biệt Hợp đồng, Phụ lục Bảng biểu hay Quyết định / Tờ trình / Công văn.',
                  },
                  {
                    id: 'contract' as const,
                    title: 'Format Hợp đồng (FormatHopDong)',
                    desc: 'Đóng bảng 2 cột ẩn viền Bên A/B thụt treo dấu ":", khử "::", gắn chữ ký chống mồ côi + chuẩn hóa bảng.',
                  },
                  {
                    id: 'table_only' as const,
                    title: 'Format Bảng & Phụ lục (FormatBang)',
                    desc: '16 loại cột ngữ nghĩa, căn phải tiền tệ, tự xoay ngang A4 Landscape (25.2cm) khi bảng >= 8 cột.',
                  },
                  {
                    id: 'admin_vtc' as const,
                    title: 'Format Hành chính NĐ30 / VTC',
                    desc: 'Chuẩn hóa Tờ trình, Báo cáo, Quyết định, Công văn (thụt 1.27cm, dấu ";" căn cứ, số trang lề trên ẩn trang 1).',
                  },
                ].map((p) => {
                  const selected = uploadProfile === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setUploadProfile(p.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                        selected
                          ? 'border-[#1d4ed8] bg-[#eff6ff] shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[13.5px] font-semibold ${
                            selected ? 'text-[#0b3d91]' : 'text-slate-900'
                          }`}
                        >
                          {p.title}
                        </span>
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            selected ? 'bg-[#1d4ed8]' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop .docx Upload Card */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingFile(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleRunDocxFormatter(file);
              }}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDraggingFile
                  ? 'border-[#1d4ed8] bg-blue-50/70'
                  : 'border-slate-300 bg-[var(--surface-panel)] hover:border-[#1d4ed8]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleRunDocxFormatter(file);
                  e.target.value = '';
                }}
              />

              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d3e3fd] text-[#0b3d91]">
                <Upload className="h-6 w-6" />
              </div>

              <h3 className="text-[15px] font-semibold text-slate-900">
                Kéo thả file Microsoft Word (.docx) vào đây để chuẩn hóa tức thì
              </h3>
              <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-slate-600">
                Xử lý 100% trực tiếp trên trình duyệt bằng OpenXML — bảo toàn nguyên vẹn file gốc của bạn và xuất bản sao <code className="rounded bg-slate-100 px-1 text-slate-800">*_ND30.docx</code> chuẩn in ấn.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isProcessingDocx}
                  onClick={() => fileInputRef.current?.click()}
                  className="press-subtle inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>{isProcessingDocx ? 'Đang xử lý OpenXML…' : 'Chọn file .docx từ máy tính'}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingDocx}
                  onClick={handleLoadAndFormatSampleDocx}
                  className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Wand2 className="h-4 w-4 text-[#1d4ed8]" />
                  <span>Chạy thử bằng Hợp đồng & Phụ lục 9 cột mẫu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Transformation Output & Audit Summary */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Kết quả xử lý & Đối soát thể thức
                </h2>
                {processReport && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    Sẵn sàng tải về
                  </span>
                )}
              </div>

              {!processReport ? (
                <div className="space-y-3 py-8 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" strokeWidth={1.5} />
                  <p className="text-[13.5px] font-medium text-slate-700">
                    Chưa có tài liệu nào được tải lên
                  </p>
                  <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                    Chọn một file <strong className="font-medium text-slate-700">.docx</strong> bất kỳ hoặc bấm nút <em>“Chạy thử bằng Hợp đồng & Phụ lục 9 cột mẫu”</em> để kiểm chứng toàn bộ quy trình bóc tách Bên A/B, xoay ngang phụ lục và đánh số trang lề trên.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-emerald-900">
                        Nhận diện loại hồ sơ:
                      </span>
                      <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        {processReport.detectedLabel}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                      {processedFileName}
                    </p>
                  </div>

                  {/* 4 Metrics */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        label: 'Đoạn văn chuẩn hóa',
                        val: processReport.paragraphsFormatted,
                      },
                      {
                        label: 'Khối Bên A/B đóng bảng',
                        val: processReport.partyBlocksConverted,
                      },
                      {
                        label: 'Bảng dữ liệu FormatBang',
                        val: processReport.tablesFormatted,
                      },
                      {
                        label: 'Phụ lục xoay ngang A4',
                        val: processReport.landscapeSectionsCount,
                      },
                    ].map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200/80 bg-[var(--surface-well)] p-3"
                      >
                        <div className="text-xl font-semibold tabular-nums text-slate-900">
                          {m.val}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Các hạng mục đã tự động chuẩn hóa
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white">
                      {processReport.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 text-xs text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="leading-relaxed">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadProcessedDocx}
                    className="press-subtle flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải về {processedFileName}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: 14-BOX DOCUMENT AUTHORING STUDIO (TTr, BC, QĐ, CV, HĐ...)      */}
      {/* ===================================================================== */}
      {studioTab === 'author_14box' && (
        <div className="space-y-5">
          {/* Quick Flagship Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-4 py-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Mẫu chuẩn VTC / NĐ30:</span>
              {(
                [
                  { id: 'TTr', label: 'Tờ trình đơn vị (Có ô Phê duyệt)' },
                  { id: 'BC', label: 'Báo cáo đơn vị' },
                  { id: 'QĐ', label: 'Quyết định Chủ tịch' },
                  { id: 'CV', label: 'Công văn hành chính' },
                  { id: 'HĐ', label: 'Hợp đồng kinh tế (Bên A/B)' },
                ] as const
              ).map((preset) => {
                const isSelected = formState.docTypeCode === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectQuickTemplate(preset.id)}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFixForm}
                className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                title="Tự động sửa lỗi số < 10, dấu chấm phẩy Căn cứ, viết hoa điều khoản và Nơi nhận"
              >
                <Wand2 className="h-3.5 w-3.5 text-[#1d4ed8]" />
                <span>Chuẩn hóa câu chữ & Ký hiệu</span>
              </button>

              <button
                type="button"
                disabled={isExportingNewDocx}
                onClick={handleExport14BoxDocx}
                className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-1.5 text-[13px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af] disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isExportingNewDocx ? 'Đang kết xuất…' : 'Xuất Word 14 Ô (.docx)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Left 6 Cols: Structured 14-Box Editor + Auto-Linter */}
            <div className="space-y-4 xl:col-span-6">
              {/* Auto-Linter Card */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Kiểm định tự động (Auto-Linter Quy chế 07/QĐ-VTS)
                  </span>
                  {linterIssues.length === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Đạt chuẩn 100%
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 tabular-nums">
                      {linterIssues.length} điểm lưu ý
                    </span>
                  )}
                </div>

                {linterIssues.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {linterIssues.map((iss) => (
                      <div
                        key={iss.id}
                        className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs ${
                          iss.severity === 'error'
                            ? 'border-rose-200 bg-rose-50/80 text-rose-900'
                            : iss.severity === 'warning'
                            ? 'border-amber-200 bg-amber-50/80 text-amber-900'
                            : 'border-blue-200 bg-blue-50/70 text-[#0b3d91]'
                        }`}
                      >
                        {iss.severity === 'info' ? (
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold">[{iss.category}]</span> {iss.message}
                          {iss.suggestion && (
                            <p className="mt-0.5 opacity-85">→ {iss.suggestion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-medium text-slate-700">
                      Loại văn bản (Từ điển 27 mã VB)
                    </label>
                    <select
                      value={formState.docTypeCode}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const nextCode = generateStandardDocCode({
                          sequenceNumber: seqInput,
                          docTypeCode: nextType,
                          issuerOrgCode: 'VTS',
                          draftingDeptCode: formState.draftingDeptCode,
                          useLegacyCvCode,
                        });
                        setFormState((prev) => ({
                          ...prev,
                          docTypeCode: nextType,
                          docCodeText: nextCode,
                        }));
                      }}
                      className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                    >
                      {DOC_TYPES_DICTIONARY.map((dt) => (
                        <option key={dt.code} value={dt.code}>
                          [{dt.code}] {dt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Đồng bộ cỡ chữ</label>
                    <select
                      value={formState.fontScale}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          fontScale: e.target.value as FontScalePreset,
                        }))
                      }
                      className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                    >
                      <option value="12_13">QH 12pt · Nội dung 13pt</option>
                      <option value="13_14">QH 13pt · Nội dung 14pt</option>
                    </select>
                  </div>
                </div>

                {/* Ô 2, Ô 3, Ô 4 */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Đơn vị ban hành / trình</label>
                    <select
                      value={formState.draftingDeptCode}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                    >
                      {VTC_DEPARTMENTS.map((u) => (
                        <option key={u.code} value={u.code}>
                          [{u.code}] {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Số thứ tự (Tự đệm 0)</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={seqInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSeqInput(v);
                          setFormState((prev) => ({
                            ...prev,
                            docCodeText: generateStandardDocCode({
                              sequenceNumber: v,
                              docTypeCode: prev.docTypeCode,
                              issuerOrgCode: 'VTS',
                              draftingDeptCode: prev.draftingDeptCode,
                              useLegacyCvCode,
                            }),
                          }));
                        }}
                        placeholder="VD: 5 -> 05"
                        className="w-20 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 tabular-nums text-slate-900 focus:bg-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={formState.docCodeText}
                        onChange={(e) =>
                          setFormState((prev) => ({ ...prev, docCodeText: e.target.value }))
                        }
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-medium text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Ngày ban hành (Ô 4)</label>
                    <input
                      type="date"
                      value={formState.issueDate}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, issueDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 tabular-nums text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                    />
                  </div>
                </div>

                {formState.docTypeCode === 'CV' && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={useLegacyCvCode}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUseLegacyCvCode(checked);
                        setFormState((prev) => ({
                          ...prev,
                          docCodeText: generateStandardDocCode({
                            sequenceNumber: seqInput,
                            docTypeCode: 'CV',
                            issuerOrgCode: 'VTS',
                            draftingDeptCode: prev.draftingDeptCode,
                            useLegacyCvCode: checked,
                          }),
                        }));
                      }}
                      className="rounded border-slate-300 text-[#1d4ed8]"
                    />
                    <span>
                      Dùng ký hiệu mẫu cũ <code className="font-semibold">/CV-VTS</code> (Thay vì chuẩn Quy chế 07/QĐ-VTS <code className="font-semibold">/VTS-{formState.draftingDeptCode === 'VTS' ? 'TCHC' : formState.draftingDeptCode}</code>)
                    </span>
                  </label>
                )}

                {formState.docTypeCode === 'TTr' && (
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">
                      Kiểu bố cục Ô “PHÊ DUYỆT” trên Tờ trình nội bộ
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'footer_3col_vtc' as const, label: 'Chân trang 3 cột (Mẫu VTC)' },
                        { id: 'top_left_box' as const, label: 'Khung góc trái trên (Mẫu 9)' },
                        { id: 'none' as const, label: 'Không chèn ô phê duyệt' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({ ...prev, approvalLayoutMode: m.id }))
                          }
                          className={`cursor-pointer rounded-lg border px-2.5 py-1.5 font-medium transition-colors ${
                            formState.approvalLayoutMode === m.id
                              ? 'border-[#1d4ed8] bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trích yếu & Kính gửi */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    {formState.docTypeCode === 'CV'
                      ? 'Trích yếu Công văn (Ô 5b — tự động thêm "V/v")'
                      : formState.docTypeCode === 'HĐ'
                      ? 'Tên Hợp đồng (IN HOA)'
                      : 'Trích yếu nội dung văn bản (Ô 5a — tự động thêm "Về việc")'}
                  </label>
                  <input
                    type="text"
                    value={formState.subject}
                    onChange={(e) => setFormState((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                </div>

                {activeDocMeta.hasKinhGui && (
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">
                      Kính gửi (Ô 9a — Mỗi đơn vị 1 dòng; tự động căn cùng dòng nếu 1 nơi hoặc gạch đầu dòng nếu ≥ 2 nơi)
                    </label>
                    <textarea
                      rows={2}
                      value={formState.recipientsKinhGui.join('\n')}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          recipientsKinhGui: e.target.value.split('\n'),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Các dòng Căn cứ pháp lý (Mỗi căn cứ 1 dòng — tự động {activeDocMeta.italicBasis ? 'in nghiêng' : 'chữ đứng'} theo loại VB)
                  </label>
                  <textarea
                    rows={3}
                    value={formState.basisLines.join('\n')}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        basisLines: e.target.value.split('\n'),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Nội dung văn bản / Điều khoản (Ô 6 — Mỗi đoạn hoặc Điều 1 dòng)
                  </label>
                  <textarea
                    rows={6}
                    value={formState.bodyParagraphs.join('\n')}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        bodyParagraphs: e.target.value.split('\n'),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 leading-relaxed text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                  />
                </div>

                {/* Phân quyền ký (Phụ lục VII) & Nơi nhận */}
                {formState.docTypeCode !== 'HĐ' && (
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="font-medium text-slate-700">
                        Ma trận thẩm quyền ký (Ô 7a — Phụ lục VII)
                      </label>
                      <select
                        value={signingMode}
                        onChange={(e) =>
                          handleSigningModeChange(e.target.value as SigningAuthorityMode)
                        }
                        className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                      >
                        {SIGNING_AUTHORITY_PRESETS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formState.signerRoleTitle}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, signerRoleTitle: e.target.value }))
                          }
                          placeholder="Chức vụ ký..."
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-900"
                        />
                        <input
                          type="text"
                          value={formState.signerFullName}
                          onChange={(e) =>
                            setFormState((prev) => ({ ...prev, signerFullName: e.target.value }))
                          }
                          placeholder="Họ tên người ký..."
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-slate-700">
                        Nơi nhận (Ô 9b — 11pt, dòng cuối Lưu: VT)
                      </label>
                      <textarea
                        rows={4}
                        value={formState.receiversNoinhan.join('\n')}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            receiversNoinhan: e.target.value.split('\n'),
                          }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Dấu Độ mật / Độ khẩn / Phạm vi lưu hành (Ô 10a, 10b, 11) */}
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-600">Độ mật (Ô 10a)</label>
                    <select
                      value={formState.confidentiality}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          confidentiality: e.target.value as ConfidentialityLevel,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                    >
                      <option value="none">Không (Thường)</option>
                      <option value="MAT">MẬT</option>
                      <option value="TOI_MAT">TỐI MẬT</option>
                      <option value="TUYET_MAT">TUYỆT MẬT</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-600">Độ khẩn khung đỏ (Ô 10b)</label>
                    <select
                      value={formState.urgency}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          urgency: e.target.value as UrgencyLevel,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                    >
                      <option value="none">Không</option>
                      <option value="KHAN">KHẨN (20×8mm)</option>
                      <option value="THUONG_KHAN">THƯỢNG KHẨN (40×8mm)</option>
                      <option value="HOA_TOC">HỎA TỐC (30×8mm)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-600">Chỉ dẫn lưu hành (Ô 11)</label>
                    <select
                      value={formState.circulationScope}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          circulationScope: e.target.value as CirculationScope,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-slate-800"
                    >
                      <option value="none">Không</option>
                      <option value="LUU_HANH_NOI_BO">LƯU HÀNH NỘI BỘ</option>
                      <option value="XEM_XONG_TRA_LAI">XEM XONG TRẢ LẠI</option>
                      <option value="TAI_LIEU_THU_HOI">TÀI LIỆU THU HỒI</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Live A4 Paper Preview (Times New Roman #000000 on #FFFFFF) */}
            <div className="xl:col-span-6">
              <div className="mx-auto max-w-[210mm] rounded-sm border border-slate-300 bg-white p-[16mm_12mm_16mm_22mm] font-decree text-[12.5pt] leading-[1.45] text-black shadow-lg">
                {/* 2-Column Header Grid */}
                <div className="grid grid-cols-12 items-start gap-3 text-center">
                  <div className="col-span-5">
                    {formState.governingBody && (
                      <div className="text-[10.5pt] uppercase leading-snug">
                        {formState.governingBody}
                      </div>
                    )}
                    <div
                      className={`text-[11pt] uppercase leading-snug ${
                        !formState.draftingDeptName ? 'font-bold' : ''
                      }`}
                    >
                      {formState.issuerOrgName}
                    </div>
                    {formState.draftingDeptName && (
                      <div className="text-[11pt] font-bold uppercase leading-snug">
                        {formState.draftingDeptName}
                      </div>
                    )}
                    <div className="mx-auto my-1 w-20 border-b border-black" />
                    <div className="text-[11.5pt]">{formState.docCodeText}</div>
                    {formState.docTypeCode === 'CV' && formState.subject.trim() && (
                      <div className="mt-1 text-[11pt] leading-snug">
                        V/v {formState.subject.replace(/^(V\/v|Về việc)\s*:?\s*/i, '')}
                      </div>
                    )}
                    {formState.urgency !== 'none' && (
                      <div className="mt-2 inline-block border-2 border-red-600 px-2.5 py-0.5 text-[11pt] font-bold text-red-600">
                        {formState.urgency === 'HOA_TOC'
                          ? 'HỎA TỐC'
                          : formState.urgency === 'THUONG_KHAN'
                          ? 'THƯỢNG KHẨN'
                          : 'KHẨN'}
                      </div>
                    )}
                  </div>

                  <div className="col-span-7">
                    {formState.circulationScope !== 'none' && (
                      <div className="mb-1.5 text-right">
                        <span className="inline-block border border-black px-2 py-0.5 text-[9.5pt] font-bold">
                          {formState.circulationScope === 'TAI_LIEU_THU_HOI'
                            ? 'TÀI LIỆU THU HỒI'
                            : formState.circulationScope === 'XEM_XONG_TRA_LAI'
                            ? 'XEM XONG TRẢ LẠI'
                            : 'LƯU HÀNH NỘI BỘ'}
                        </span>
                      </div>
                    )}
                    <div className="text-[11pt] font-bold uppercase">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="inline-block border-b border-black pb-0.5 text-[12pt] font-bold">
                      Độc lập - Tự do - Hạnh phúc
                    </div>
                    <div className="mt-1.5 text-[11.5pt] italic">{previewDateLine}</div>
                  </div>
                </div>

                {/* Ô 5a: Tên loại & Trích yếu */}
                {activeDocMeta.hasTypeHeader && (
                  <div className="mt-6 mb-4 text-center">
                    <div className="text-[14pt] font-bold uppercase">
                      {formState.docTypeCode === 'HĐ' && formState.subject
                        ? formState.subject.toUpperCase()
                        : activeDocMeta.upperTitle}
                    </div>
                    {formState.docTypeCode !== 'HĐ' && formState.subject && (
                      <>
                        <div className="mt-0.5 text-[12.5pt] font-bold">
                          Về việc {formState.subject.replace(/^(Về việc|V\/v)\s*:?\s*/i, '')}
                        </div>
                        <div className="mx-auto mt-1 w-28 border-b border-black" />
                      </>
                    )}
                  </div>
                )}

                {/* Ô 9a: Kính gửi */}
                {activeDocMeta.hasKinhGui &&
                  formState.recipientsKinhGui.filter((r) => r.trim()).length > 0 && (
                    <div className="my-3 text-center text-[12.5pt] font-bold">
                      Kính gửi: {formState.recipientsKinhGui.filter((r) => r.trim()).join('; ')}
                    </div>
                  )}

                {/* Quyết định Authority */}
                {formState.docTypeCode === 'QĐ' && formState.decisionAuthorityLines && (
                  <div className="my-3 text-center font-bold uppercase">
                    {formState.decisionAuthorityLines.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                )}

                {/* Phần Căn cứ */}
                <div className="mt-3 space-y-1 text-justify">
                  {formState.basisLines
                    .filter((b) => b.trim())
                    .map((b, i, arr) => {
                      const clean = b.trim().replace(/[.,;:\s]+$/, '');
                      return (
                        <p
                          key={i}
                          className={`indent-8 ${activeDocMeta.italicBasis ? 'italic' : ''}`}
                        >
                          {clean}
                          {i === arr.length - 1 ? '.' : ';'}
                        </p>
                      );
                    })}
                </div>

                {formState.docTypeCode === 'QĐ' && (
                  <div className="my-3 text-center font-bold uppercase">QUYẾT ĐỊNH:</div>
                )}

                {/* Hợp đồng Party A / B Preview */}
                {formState.docTypeCode === 'HĐ' && formState.partyA && formState.partyB && (
                  <div className="my-3 space-y-2 text-[12pt]">
                    {[formState.partyA, formState.partyB].map((pt, idx) => (
                      <div key={idx}>
                        <div className="font-bold uppercase">
                          {pt.roleTitle}: {pt.companyName}
                        </div>
                        <div className="grid grid-cols-12">
                          <span className="col-span-3">Đại diện</span>
                          <span className="col-span-9">: <strong>{pt.representative}</strong></span>
                          <span className="col-span-3">Chức vụ</span>
                          <span className="col-span-9">: {pt.position}</span>
                          <span className="col-span-3">Địa chỉ</span>
                          <span className="col-span-9">: {pt.address}</span>
                          <span className="col-span-3">Mã số thuế</span>
                          <span className="col-span-9">: {pt.taxCode}</span>
                          <span className="col-span-3">Tài khoản</span>
                          <span className="col-span-9">: {pt.bankAccount}</span>
                          <span className="col-span-3">Mở tại</span>
                          <span className="col-span-9">: {pt.bankName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Nội dung chính */}
                <div className="mt-2 space-y-1.5 text-justify">
                  {formState.bodyParagraphs
                    .filter((p) => p.trim())
                    .map((p, idx) => {
                      const isHeader = /^([IVX]+\.|Điều\s+\d+\.)/i.test(p.trim());
                      return (
                        <p key={idx} className={`indent-8 ${isHeader ? 'font-bold' : ''}`}>
                          {p}
                        </p>
                      );
                    })}
                </div>

                {formState.closingCourtesy &&
                  formState.docTypeCode !== 'QĐ' &&
                  formState.docTypeCode !== 'HĐ' && (
                    <p className="mt-2 indent-8 italic">{formState.closingCourtesy}</p>
                  )}

                {/* Footer Signatures */}
                {formState.docTypeCode === 'HĐ' && formState.partyA && formState.partyB ? (
                  <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="font-bold">ĐẠI DIỆN BÊN A</div>
                      <div className="text-[10.5pt] italic">(Ký, đóng dấu, ghi rõ họ tên)</div>
                      <div className="h-14" />
                      <div className="font-bold">
                        {formState.partyA.representative.replace(/^(Ông|Bà)\s+/i, '')}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">ĐẠI DIỆN BÊN B</div>
                      <div className="text-[10.5pt] italic">(Ký, đóng dấu, ghi rõ họ tên)</div>
                      <div className="h-14" />
                      <div className="font-bold">
                        {formState.partyB.representative.replace(/^(Ông|Bà)\s+/i, '')}
                      </div>
                    </div>
                  </div>
                ) : formState.docTypeCode === 'TTr' &&
                  formState.approvalLayoutMode === 'footer_3col_vtc' ? (
                  <div className="mt-6 grid grid-cols-12 items-start gap-2">
                    <div className="col-span-5 text-[10.5pt]">
                      <div className="text-[11pt] font-bold italic">Nơi nhận:</div>
                      {formState.receiversNoinhan
                        .filter((r) => r.trim())
                        .map((r, idx, arr) => (
                          <div key={idx}>
                            - {r.trim().replace(/^-\s*/, '').replace(/[.;]+$/, '')}
                            {idx === arr.length - 1 ? '.' : ';'}
                          </div>
                        ))}
                    </div>
                    <div className="col-span-3 text-center font-bold">PHÊ DUYỆT</div>
                    <div className="col-span-4 text-center">
                      {formState.signerTopAuthorityLine && (
                        <div className="font-bold uppercase">
                          {formState.signerTopAuthorityLine}
                        </div>
                      )}
                      <div className="font-bold uppercase">{formState.signerRoleTitle}</div>
                      <div className="h-14" />
                      <div className="font-bold">{formState.signerFullName}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-12 items-start gap-3">
                    <div className="col-span-6 text-[10.5pt]">
                      <div className="text-[11pt] font-bold italic">Nơi nhận:</div>
                      {formState.receiversNoinhan
                        .filter((r) => r.trim())
                        .map((r, idx, arr) => (
                          <div key={idx}>
                            - {r.trim().replace(/^-\s*/, '').replace(/[.;]+$/, '')}
                            {idx === arr.length - 1 ? '.' : ';'}
                          </div>
                        ))}
                    </div>
                    <div className="col-span-6 text-center">
                      {formState.signerTopAuthorityLine && (
                        <div className="font-bold uppercase">
                          {formState.signerTopAuthorityLine}
                        </div>
                      )}
                      <div className="font-bold uppercase">{formState.signerRoleTitle}</div>
                      <div className="h-14" />
                      <div className="font-bold">{formState.signerFullName}</div>
                    </div>
                  </div>
                )}

                {formState.includeContactFooterPage1 && formState.contactFooterText && (
                  <div className="mt-8 border-t border-black pt-1.5 text-center text-[10pt]">
                    {formState.contactFooterText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: EXCEL / TSV SMART TABLE STUDIO (FormatBang)                    */}
      {/* ===================================================================== */}
      {studioTab === 'table_studio' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-slate-900">
                  Dán dữ liệu bảng từ Excel / Sheets
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTableTitle('PHỤ LỤC 01: BẢNG DỰ TOÁN CHI TIẾT HẠNG MỤC');
                      setRawTablePaste(SAMPLE_WIDE_EXCEL_TSV);
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Mẫu 9 cột (Tự xoay ngang)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTableTitle('BẢNG KẾ HOẠCH TRIỂN KHAI KỸ THUẬT');
                      setRawTablePaste(SAMPLE_PORTRAIT_EXCEL_TSV);
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Mẫu 5 cột (Khổ dọc)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Tiêu đề Phụ lục / Bảng biểu</label>
                <input
                  type="text"
                  value={tableTitle}
                  onChange={(e) => setTableTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Ghi chú kèm theo (In nghiêng)</label>
                <input
                  type="text"
                  value={tableSubtitle}
                  onChange={(e) => setTableSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-[#1d4ed8] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Chế độ hướng giấy A4</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'auto' as const, label: 'Tự động (≥8 cột xoay ngang)' },
                    { id: 'portrait' as const, label: 'Khổ dọc (16.5cm)' },
                    { id: 'landscape' as const, label: 'Khổ ngang (25.2cm)' },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setTableOrientation(o.id)}
                      className={`cursor-pointer rounded-lg border px-2 py-1.5 font-medium transition-colors ${
                        tableOrientation === o.id
                          ? 'border-[#1d4ed8] bg-[#d3e3fd] font-semibold text-[#0b3d91]'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Nội dung bảng (Copy vùng ô từ Excel và Ctrl+V vào đây)
                </label>
                <textarea
                  rows={8}
                  value={rawTablePaste}
                  onChange={(e) => setRawTablePaste(e.target.value)}
                  placeholder="STT	Tên hạng mục	ĐVT	Số lượng	Đơn giá	Thành tiền..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs leading-relaxed text-slate-900 focus:bg-white focus:border-[#1d4ed8] focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={isExportingTableDocx}
                onClick={handleExportSmartTableDocx}
                className="press-subtle flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-xs transition-colors hover:bg-[#1e40af] disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>
                  {isExportingTableDocx
                    ? 'Đang tạo bảng Word…'
                    : 'Xuất Bảng Word Chuẩn NĐ30 (.docx)'}
                </span>
              </button>
            </div>
          </div>

          {/* Right 7 Cols: Semantic Column Sizing Inspector & Preview */}
          <div className="space-y-4 lg:col-span-7">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">
                    Phân tích độ rộng cột thông minh (16 lớp ngữ nghĩa FormatBang)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tự động bảo vệ cột Đơn giá / Thành tiền không bị ngắt dòng, gộp dòng Bằng chữ và lặp tiêu đề trang.
                  </p>
                </div>
                {parsedTablePreview && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                      parsedTablePreview.isLandscape
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {parsedTablePreview.isLandscape
                      ? `A4 Ngang · 25.2cm (${parsedTablePreview.totalCols} cột)`
                      : `A4 Dọc · 16.5cm (${parsedTablePreview.totalCols} cột)`}
                  </span>
                )}
              </div>

              {parsedTablePreview && (
                <>
                  {/* Detected Column Semantic Chips */}
                  <div className="flex flex-wrap gap-2">
                    {parsedTablePreview.headers.map((h, i) => {
                      const cm = (parsedTablePreview.widths[i] / 567).toFixed(2);
                      const kind = parsedTablePreview.kinds[i];
                      return (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 bg-[var(--surface-well)] px-2.5 py-1.5 text-xs"
                        >
                          <div className="font-medium text-slate-900">{h || `Cột ${i + 1}`}</div>
                          <div className="mt-0.5 text-[11px] text-slate-600 tabular-nums">
                            {COL_KIND_LABELS[kind]} · <strong>{cm} cm</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live HTML Table Preview */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse font-decree text-[12px] text-black">
                      <thead>
                        <tr className="bg-slate-100">
                          {parsedTablePreview.headers.map((h, i) => (
                            <th
                              key={i}
                              className="border border-slate-400 px-2.5 py-2 text-center font-bold"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTablePreview.rows.map((row, rIdx) => {
                          const joined = row.join(' ').trim();
                          if (/^\(?bằng chữ/i.test(joined)) {
                            return (
                              <tr key={rIdx} className="bg-amber-50/30 italic">
                                <td
                                  colSpan={parsedTablePreview.totalCols}
                                  className="border border-slate-400 px-3 py-1.5 text-left"
                                >
                                  {row.filter(Boolean).join(' ')}
                                </td>
                              </tr>
                            );
                          }
                          return (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              {row.map((cell, cIdx) => {
                                const kind = parsedTablePreview.kinds[cIdx];
                                const alignClass =
                                  kind === 'unit_price' || kind === 'total_price'
                                    ? 'text-right tabular-nums'
                                    : kind === 'index' ||
                                      kind === 'unit' ||
                                      kind === 'quantity' ||
                                      kind === 'warranty'
                                    ? 'text-center'
                                    : 'text-left';
                                return (
                                  <td
                                    key={cIdx}
                                    className={`border border-slate-300 px-2.5 py-1.5 ${alignClass}`}
                                  >
                                    {cell}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: REGULATION REFERENCE & EXPERT REFINEMENT ANALYSIS              */}
      {/* ===================================================================== */}
      {studioTab === 'regulation_guide' && (
        <div className="space-y-6">
          {/* 5 Expert Refinements & Supplements */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                5 Điểm Rà soát, Hiệu chỉnh & Bổ sung Quan trọng khi Đưa Quy chế VTC (07/QĐ-VTS) lên Web
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Tổng hợp đối chiếu giữa Quy chế 07/QĐ-VTS, Nghị định 30/2020/NĐ-CP, 4 phôi văn bản thực tế và 2 bộ máy FormatHopDong + FormatBang.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {REGULATION_REFINEMENT_NOTES.map((item, idx) => (
                <div key={idx} className="py-4 first:pt-1 last:pb-0 space-y-1.5">
                  <h3 className="text-[14px] font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-amber-900 bg-amber-50/70 border border-amber-200/80 rounded-lg px-3 py-2">
                    <strong>Vấn đề thực tế:</strong> {item.issueFound}
                  </p>
                  <p className="text-xs leading-relaxed text-emerald-900 bg-emerald-50/70 border border-emerald-200/80 rounded-lg px-3 py-2">
                    <strong>Giải pháp đã tích hợp vào hệ thống:</strong> {item.standardResolution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 27 Document Codes Dictionary & Department Matrix */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-3">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Bảng mã 27 Loại văn bản & Bản sao (Ô số 3)
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
                {DOC_TYPES_DICTIONARY.map((d) => (
                  <div
                    key={d.code}
                    className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-[var(--surface-well)] px-2.5 py-1.5"
                  >
                    <span className="truncate text-slate-700">{d.name}</span>
                    <span className="ml-2 shrink-0 rounded bg-white px-1.5 py-0.5 font-semibold text-[#0b3d91]">
                      {d.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs space-y-3">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Mã đơn vị VTC Digicom & Phân quyền ký (Phụ lục VII)
              </h3>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80">
                {SIGNING_AUTHORITY_PRESETS.map((s) => (
                  <div key={s.id} className="p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{s.label}</span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-[#0b3d91]">
                        {s.topLine ? `${s.topLine} / ${s.roleLine}` : s.roleLine}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{s.scopeHint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
