import React, { useState, useEffect, useMemo } from 'react';
import { useMeetingContext } from '../../context/MeetingContext';
import { useToast } from '../../context/ToastContext';
import { removeVietnameseDiacritics } from '../../utils/dateParser';
import {
  BookOpen,
  Compass,
  Users,
  Terminal,
  WandSparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Search,
  Play,
  PlusCircle,
  FileCheck2,
  CheckSquare,
  UsersRound,
  Lock,
  GitCompare,
  FileSearch,
  Table2,
  FileText,
  Upload,
  Sparkles,
  Keyboard,
  ChevronDown,
  ChevronUp,
  Scale,
  Clock,
  AlertTriangle,
} from 'lucide-react';

type GuideTabId = 'overview' | 'roles' | 'live-shortcuts' | 'word-studio' | 'faq';

interface UserGuideWorkspaceProps {
  onOpenCreateModal: () => void;
}

interface WorkflowStepCard {
  stepNumber: string;
  badge: string;
  title: string;
  summary: string;
  bullets: string[];
  proTip: string;
  ctaLabel: string;
  onAction: () => void;
}

interface SlashCommandGuideItem {
  syntax: string;
  category: string;
  example: string;
  effect: string;
  badgeTone: string;
}

interface FaqItem {
  id: string;
  tag: string;
  question: string;
  answer: string;
  legalRef?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SLASH_COMMANDS_GUIDE: SlashCommandGuideItem[] = [
  {
    syntax: '/yk [nội dung]',
    category: 'Ý kiến thảo luận',
    example: '/yk Đề nghị làm rõ phương án dự phòng hạ tầng máy chủ quý IV',
    effect: 'Ghi nhận phát biểu thông thường vào luồng biên bản kèm mốc giờ tự động.',
    badgeTone: 'bg-slate-100 text-slate-700',
  },
  {
    syntax: '/dx [nội dung]',
    category: 'Đề xuất giải pháp',
    example: '/dx Triển khai thí điểm tại Chi nhánh phía Nam trong 30 ngày trước khi nhân rộng',
    effect: 'Gắn nhãn [Đề xuất] màu xanh, ưu tiên đưa vào trình Tổng hợp quyết nghị tự động.',
    badgeTone: 'bg-blue-50 text-[#0b3d91]',
  },
  {
    syntax: '/pb [nội dung]',
    category: 'Phản biện / Rủi ro',
    example: '/pb Chi phí vận hành năm đầu có thể vượt trần ngân sách nếu thuê ngoài 100%',
    effect: 'Gắn nhãn [Phản biện] màu hổ phách giúp Chủ tọa nhận diện rủi ro trước khi biểu quyết.',
    badgeTone: 'bg-amber-50 text-amber-800',
  },
  {
    syntax: '/lr [nội dung]',
    category: 'Làm rõ thông tin',
    example: '/lr Phòng TCKT xác nhận nguồn vốn đầu tư đã được bố trí trong kế hoạch năm',
    effect: 'Ghi nhận nội dung giải trình bổ sung, làm căn cứ thông qua quyết nghị.',
    badgeTone: 'bg-emerald-50 text-emerald-800',
  },
  {
    syntax: '/qd [nội dung quyết nghị]',
    category: 'Chốt Quyết nghị ngay',
    example: '/qd Thông qua hạn mức đầu tư hạ tầng Cloud giai đoạn 1 là 4,5 tỷ đồng.',
    effect: 'Điền thẳng văn bản kết luận vào ô Quyết nghị chính thức bên cột phải và chuyển trạng thái sang Thống nhất.',
    badgeTone: 'bg-[#d3e3fd] text-[#0b3d91]',
  },
  {
    syntax: '/viec [tên việc] @Tên !Hạn',
    category: 'Giao việc thông minh',
    example: '/viec Hoàn thiện dự thảo hợp đồng khung @Hà !25/12',
    effect: 'Tự động tạo Nhiệm vụ sau họp, khớp người phụ trách trong danh sách dự họp và quy đổi hạn chót (!25/12, !mai, !t6).',
    badgeTone: 'bg-emerald-50 text-emerald-800',
  },
  {
    syntax: '/bq',
    category: 'Mở Kiểm phiếu Biểu quyết',
    example: '/bq',
    effect: 'Mở ngay bảng kiểm phiếu theo đầu người, cổ phần (ĐHĐCĐ) hoặc tỷ lệ vốn góp (HĐTV) và tự tính % thông qua.',
    badgeTone: 'bg-indigo-50 text-indigo-800',
  },
];

const KEYBOARD_SHORTCUTS = [
  {
    keys: 'Ctrl + K (hoặc Cmd + K)',
    scope: 'Toàn hệ thống',
    desc: 'Mở thanh tìm kiếm vạn năng (Omnisearch): nhảy nhanh tới bất kỳ biên bản, đầu việc, công cụ chuẩn hóa Word hoặc mẫu họp.',
  },
  {
    keys: 'Enter',
    scope: 'Phòng ghi trực tiếp',
    desc: 'Gửi nhanh dòng tốc ký vào luồng thảo luận hoặc kích hoạt ngay lệnh /qd, /viec, /bq.',
  },
  {
    keys: 'Shift + Enter',
    scope: 'Phòng ghi trực tiếp',
    desc: 'Xuống dòng mới bên trong cùng một lượt phát biểu dài mà không gửi đi ngay.',
  },
  {
    keys: 'Ctrl + P',
    scope: 'Xem, Ký & Xuất bản',
    desc: 'In trực tiếp trang biên bản khổ chuẩn A4 (hệ thống tự động ẩn toàn bộ thanh điều hướng và nút bấm).',
  },
  {
    keys: 'Esc',
    scope: 'Mọi hộp thoại (Modal)',
    desc: 'Đóng nhanh cửa sổ đang mở mà không cần rê chuột tìm nút X.',
  },
];

export const UserGuideWorkspace: React.FC<UserGuideWorkspaceProps> = ({ onOpenCreateModal }) => {
  const {
    guideSection,
    setActiveTab,
    currentUser,
    setCurrentUser,
    isGuest,
  } = useMeetingContext();
  const { toast } = useToast();

  const [activeSection, setActiveSection] = useState<GuideTabId>('overview');
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
    'faq-3': true,
  });

  useEffect(() => {
    const valid: GuideTabId[] = ['overview', 'roles', 'live-shortcuts', 'word-studio', 'faq'];
    if (valid.includes(guideSection as GuideTabId)) {
      setActiveSection(guideSection as GuideTabId);
    }
  }, [guideSection]);

  const workflowSteps: WorkflowStepCard[] = [
    {
      stepNumber: 'Bước 0',
      badge: 'Thiết lập 1 lần · Dùng mãi mãi',
      title: 'Cấu hình Pháp nhân, Danh bạ Nhân sự & Nhóm họp thường trực',
      summary:
        'Tách biệt hoàn toàn dữ liệu gốc của doanh nghiệp khỏi từng cuộc họp lẻ để không bao giờ phải nhập lại tên công ty, chức danh hay tỷ lệ cổ phần.',
      bullets: [
        'Khai báo Tên cơ quan chủ quản, Tên đơn vị ban hành, Mã viết tắt (VD: VTS), Địa danh (Hà Nội / Thành phố Hồ Chí Minh) và Phòng họp cố định.',
        'Quản lý Danh bạ thành viên kèm chức vụ, email, số cổ phần biểu quyết (ĐHĐCĐ) hoặc tỷ lệ vốn góp (HĐTV).',
        'Đóng gói các Nhóm họp mẫu (VD: Hội đồng quản trị, Giao ban tuần, Tổ dự án) gắn sẵn Chủ tọa, Thư ký và khung nghị sự mặc định.',
      ],
      proTip:
        'Sau khi tạo Nhóm họp mẫu, một nút khởi tạo 1 chạm của nhóm đó sẽ xuất hiện ngay trên màn hình Tổng quan điều hành.',
      ctaLabel: 'Mở Danh bạ & Đơn vị',
      onAction: () => setActiveTab('directory'),
    },
    {
      stepNumber: 'Bước 1',
      badge: 'Trước giờ họp · 15 giây',
      title: 'Khởi tạo Cuộc họp từ 14 Biểu mẫu Pháp lý (Nhóm A – E)',
      summary:
        'Hệ thống tự động sinh mã số biên bản chuẩn thể thức, áp quy tắc túc số theo Luật Doanh nghiệp 2020 và kế thừa việc tồn kỳ trước.',
      bullets: [
        '5 phân nhóm nghiệp vụ: Nhóm A (Điều hành nội bộ), Nhóm B (Pháp lý ĐHĐCĐ, HĐQT, HĐTV, BKS), Nhóm C (Kỹ thuật / Sprint), Nhóm D (Đối ngoại / Nghiệm thu), Nhóm E (Đoàn thể).',
        'Tự động tính ngưỡng túc số hợp lệ: >50% vốn cổ phần (Điều 145 ĐHĐCĐ), ≥65% vốn điều lệ (HĐTV), ≥75% thành viên (Điều 157 HĐQT).',
        'Tùy chọn "Kế thừa nhiệm vụ tồn đọng": tự động gom các đầu việc chưa hoàn thành từ kỳ họp trước thành Mục nghị sự số 1 để rà soát tiến độ.',
      ],
      proTip:
        'Cần họp gấp? Bấm thẳng vào các thẻ "Khởi tạo nhanh" trên trang Tổng quan để vào ngay Phòng ghi trong 1 giây.',
      ctaLabel: 'Tạo cuộc họp mới',
      onAction: onOpenCreateModal,
    },
    {
      stepNumber: 'Bước 2',
      badge: 'Trong cuộc họp · Tốc ký thời gian thực',
      title: 'Điểm danh Túc số, Tốc ký 3 Cột & Chốt Quyết nghị trực tiếp',
      summary:
        'Không gian làm việc 3 cột chuyên biệt giúp Thư ký bắt kịp mọi diễn biến phát biểu, biểu quyết và phân công nhiệm vụ ngay tại bàn họp.',
      bullets: [
        'Bấm nút Túc số trên thanh đầu trang để điểm danh (Có mặt / Đi trễ / Ủy quyền / Vắng); bấm đồng hồ Play để theo dõi thời lượng phiên họp.',
        'Gõ tốc ký bằng lệnh /yk, /dx, /pb, /lr; chốt thẳng kết luận bằng /qd hoặc giao việc ngay bằng cú pháp /viec [Nội dung] @Tên !Hạn.',
        'Bấm nút "Tổng hợp từ ý kiến" bên cột phải để hệ thống tự động kết tinh các đề xuất thành văn phong Quyết nghị chuẩn hành chính.',
      ],
      proTip:
        'Khi kết thúc cuộc họp, bấm nút "Chốt bế mạc" trên thanh công cụ để ghi nhận giờ kết thúc thực tế vào dòng cuối biên bản.',
      ctaLabel: 'Vào Phòng ghi trực tiếp',
      onAction: () => setActiveTab('live'),
    },
    {
      stepNumber: 'Bước 3',
      badge: 'Kiểm soát & Niêm phong · SHA-256',
      title: 'Kiểm định Pháp lý, Ký khóa SHA-256 & Xuất bản Word / PDF / Trích lục',
      summary:
        'Đảm bảo 100% biên bản ban hành không thiếu chữ ký, không sai túc số và được bảo vệ toàn vẹn bằng chữ ký băm mật mã học.',
      bullets: [
        'Bộ kiểm định tự động chặn các lỗi trọng yếu: thiếu Chủ tọa/Thư ký có mặt, chưa đạt túc số, mục nghị sự bỏ trống kết luận hoặc việc giao chưa rõ người nhận.',
        'Chủ tọa duyệt ký (Chữ ký số USB Token / Xác nhận điện tử / Ký tươi đóng dấu) → hệ thống đóng khóa mã băm SHA-256 chống chỉnh sửa ngầm.',
        'Xuất file Microsoft Word (.docx) chuẩn Nghị định 30/2020/NĐ-CP, xuất PDF thông minh không cắt đôi dòng chữ và cấp Bản trích lục Điều 150.',
      ],
      proTip:
        'Nếu biên bản đã khóa SHA-256 cần đính chính, Chủ tọa vào menu Tiện ích → "Tạo bản sửa đổi" để sinh bản v2.0 và đối chiếu thay đổi từng từ (Diff).',
      ctaLabel: 'Mở Xem, Ký & Xuất bản',
      onAction: () => setActiveTab('preview'),
    },
    {
      stepNumber: 'Bước 4',
      badge: 'Sau cuộc họp · Trách nhiệm giải trình',
      title: 'Đôn đốc Thực thi & Lưu vết Gia hạn tại Bảng việc sau họp',
      summary:
        'Biến quyết nghị trên giấy thành tiến độ thực tế, chấm dứt tình trạng giao việc trong cuộc họp rồi bị lãng quên ở kỳ họp sau.',
      bullets: [
        'Tất cả nhiệm vụ từ mọi biên bản tự động quy tụ về Bảng việc trực quan (chuyển đổi linh hoạt giữa bảng kéo thả Kanban 4 cột và Danh sách).',
        'Khi nhân sự xin dời hạn hoàn thành, hệ thống bắt buộc nhập Lý do giải trình và tự động ghi vết hạn cũ → hạn mới vào Nhật ký kiểm toán.',
        'Xuất báo cáo tổng hợp tiến độ thực thi sau họp ra file Word (.docx) trình lãnh đạo hoặc file Excel (.csv UTF-8) không lỗi phông tiếng Việt.',
      ],
      proTip:
        'Các đầu việc quá hạn được cảnh báo rõ ràng trên trang Tổng quan điều hành để Chủ tọa nắm bắt ngay trước kỳ giao ban tiếp theo.',
      ctaLabel: 'Mở Bảng việc sau họp',
      onAction: () => setActiveTab('actions'),
    },
    {
      stepNumber: 'Bước 5',
      badge: 'Khép kín hồ sơ Văn thư · NĐ30 & 07/QĐ-VTS',
      title: 'Ban hành Thông báo, Quyết định, Hợp đồng & Chuẩn hóa File Word (.docx)',
      summary:
        'Kết nối liền mạch từ Biên bản cuộc họp sang các văn bản hành chính chính thức và tự động chuẩn hóa mọi file Hợp đồng, Phụ lục bảng biểu.',
      bullets: [
        'Từ biên bản đã duyệt, bấm 1 chạm "+ Thông báo kết luận" hoặc "+ Quyết định / Nghị quyết" để tự động đổ toàn bộ quyết nghị sang khung 14 ô thể thức.',
        'Kéo thả file Hợp đồng / Văn bản (.docx) bị lệch lề, sai cỡ chữ hoặc dính dòng Bên A/B để động cơ OpenXML (FormatHopDong + FormatBang) chuẩn hóa trong 1 giây.',
        'Copy bảng tính nhiều cột từ Excel dán thẳng vào công cụ FormatBang để tự động phân bổ độ rộng cột tối ưu và xoay khổ ngang A4 (25.2cm) khi bảng từ 8 cột trở lên.',
      ],
      proTip:
        'Bộ kiểm lỗi Auto-Linter tích hợp sẵn Quy chế 07/QĐ-VTS sẽ tự cảnh báo nếu bạn viết sai ký hiệu Công văn (/CV-), thiếu số 0 ngày tháng hoặc ghi học hàm trước tên người ký.',
      ctaLabel: 'Mở Chuẩn hóa Word & VB',
      onAction: () => setActiveTab('format-word'),
    },
  ];

  const faqList: FaqItem[] = [
    {
      id: 'faq-1',
      tag: 'Luật Doanh nghiệp 2020',
      question:
        'Triệu tập cuộc họp ĐHĐCĐ hoặc HĐQT nhưng đại biểu vắng mặt nhiều, không đạt tỷ lệ túc số thì lập biên bản thế nào?',
      answer:
        'Tại Phòng ghi trực tiếp, khi tỷ lệ điểm danh thấp hơn ngưỡng quy định, nút "Lập BB Điều 145" màu đỏ sẽ xuất hiện ngay cạnh huy hiệu Túc số trên thanh đầu trang. Khi bấm kích hoạt, hệ thống chuyển biên bản sang chế độ "Biên bản ghi nhận cuộc họp không tiến hành được do không đủ túc số", tự động gỡ bỏ chặn túc số để Chủ tọa và Thư ký ký xác nhận làm căn cứ pháp lý triệu tập cuộc họp lần thứ hai (theo Điều 145 và Điều 157 Luật Doanh nghiệp 2020).',
      legalRef: 'Điều 145 & Điều 157 Luật DN 2020',
      actionLabel: 'Mở Phòng ghi kiểm tra',
      onAction: () => setActiveTab('live'),
    },
    {
      id: 'faq-2',
      tag: 'Bảo lưu & Từ chối ký',
      question:
        'Có đại biểu dự họp phản đối quyết nghị hoặc từ chối ký vào biên bản thì biên bản có còn hiệu lực pháp lý không?',
      answer:
        'Hoàn toàn hợp lệ nếu tuân thủ đúng Điều 158 Luật Doanh nghiệp 2020. Bạn thực hiện 2 thao tác: (1) Tại cột phải Phòng ghi trực tiếp, mở mục "Ý kiến bảo lưu (Điều 158)" để ghi rõ họ tên đại biểu và nội dung bảo lưu vào từng mục nghị sự; (2) Bấm nút "Hồ sơ & Phụ lục" trên thanh công cụ để đánh dấu trạng thái từ chối ký kèm lý do. Khi xuất bản A4, biên bản sẽ hiển thị đầy đủ phần ghi nhận bảo lưu và trách nhiệm liên đới của Chủ tọa, Người ghi biên bản.',
      legalRef: 'Điều 158 Luật DN 2020',
      actionLabel: 'Vào Phòng ghi trực tiếp',
      onAction: () => setActiveTab('live'),
    },
    {
      id: 'faq-3',
      tag: 'Bảo mật SHA-256 & Phiên bản',
      question:
        'Biên bản đã được Chủ tọa ký khóa SHA-256 nhưng phát hiện sai chính tả hoặc cần cập nhật số liệu bổ sung thì xử lý ra sao?',
      answer:
        'Để đảm bảo tính bất biến của hồ sơ pháp lý, biên bản đã khóa SHA-256 không cho phép sửa đè làm sai lệch mã băm gốc. Thay vào đó, người dùng có quyền [Chủ tọa] hoặc [Quản trị] mở mục "Xem, Ký & Xuất bản" → bấm nút "Tiện ích" → chọn "Tạo bản sửa đổi". Hệ thống sẽ giữ nguyên bản v1.0 trong kho lưu trữ và nhân bản ra phiên bản nháp v2.0 để bạn chỉnh sửa, đồng thời cung cấp công cụ "So sánh phiên bản" tô sáng từng từ thêm/xóa giữa hai bản.',
      legalRef: 'Chuẩn kiểm toán SHA-256',
      actionLabel: 'Mở Xem, Ký & Xuất bản',
      onAction: () => setActiveTab('preview'),
    },
    {
      id: 'faq-4',
      tag: 'Bảo mật thông tin',
      question:
        'Ngân hàng hoặc đối tác chỉ yêu cầu cung cấp 1 quyết nghị vay vốn / đầu tư, làm sao xuất văn bản mà không lộ các nội dung mật khác trong cuộc họp?',
      answer:
        'Hãy sử dụng tính năng "Trích lục biên bản (Điều 150)" nằm trong menu "Tiện ích" tại màn hình Xem, Ký & Xuất bản. Bạn chỉ cần tích chọn đúng 1 hoặc vài mục nghị sự liên quan; hệ thống sẽ kết xuất ngay một file Word (.docx) hoặc bản in "BẢN TRÍCH LỤC BIÊN BẢN HỌP" chuẩn Nghị định 30, giữ nguyên thông tin pháp nhân, tỷ lệ túc số hợp lệ của cuộc họp nhưng ẩn tuyệt đối các mục thảo luận nội bộ khác.',
      legalRef: 'Điều 150 Luật DN 2020',
      actionLabel: 'Mở công cụ Trích lục',
      onAction: () => setActiveTab('preview'),
    },
    {
      id: 'faq-5',
      tag: 'Phân quyền RBAC',
      question:
        'Tại sao khi vào Phòng ghi trực tiếp tôi thấy nhãn "Chế độ xem" hoặc không nhìn thấy nút "Ký duyệt & Khóa" ở màn hình Xem trước?',
      answer:
        'Hệ thống áp dụng phân quyền chặt chẽ theo 4 vai trò: [Thành viên] chỉ được xem biên bản và cập nhật tiến độ việc được giao; [Thư ký] có quyền soạn thảo, điểm danh và trình duyệt; chỉ [Chủ tọa] mới thấy nút "Ký duyệt & Khóa" hoặc "Trả lại" khi biên bản đang ở trạng thái Chờ duyệt. Nếu bạn đang trải nghiệm ở chế độ Dùng thử, hãy dùng hộp chọn chuyển vai trò góc trên bên phải thanh Navbar để kiểm thử toàn bộ quy trình.',
      actionLabel: 'Xem bảng phân quyền Vai trò',
      onAction: () => setActiveSection('roles'),
    },
    {
      id: 'faq-6',
      tag: 'Quy chế Văn thư 07/QĐ-VTS',
      question:
        'Khi soạn Công văn hành chính và ghi ngày tháng văn bản theo Nghị định 30 / Quy chế VTC cần lưu ý quy tắc số 0 như thế nào?',
      answer:
        'Có 3 quy tắc vàng thường bị nhầm lẫn: (1) Công văn KHÔNG có dòng tên loại giữa trang và ký hiệu chuẩn là "Số: 05/VTS-TCHC" (không chèn chữ /CV-); (2) Số thứ tự văn bản nhỏ hơn 10 bắt buộc thêm số 0 phía trước (01..09); (3) Ngày nhỏ hơn 10 bắt buộc thêm số 0 (ngày 05), nhưng phần Tháng CHỈ thêm số 0 đối với tháng 01 và tháng 02, còn từ tháng 3 đến tháng 9 viết 1 chữ số (VD: ngày 05 tháng 5 năm 2026). Bộ Auto-Linter trong Trung tâm Chuẩn hóa Word sẽ tự động kiểm tra và sửa chuẩn 100% cho bạn.',
      legalRef: 'Nghị định 30/2020 & 07/QĐ-VTS',
      actionLabel: 'Mở Soạn Văn bản 14 Ô',
      onAction: () => setActiveTab('format-word'),
    },
    {
      id: 'faq-7',
      tag: 'FormatHopDong & FormatBang',
      question:
        'Tôi có sẵn file Word cũ định dạng .doc (Word 97-2003) hoặc file Hợp đồng có bảng dự toán 10 cột bị tràn trang thì xử lý thế nào?',
      answer:
        'Đối với file đuôi .doc cũ, bạn mở bằng Microsoft Word rồi chọn File → Save As → Word Document (.docx), sau đó kéo thả vào tab "Chuẩn hóa File .docx". Động cơ FormatHopDong & FormatBang chạy trực tiếp trên trình duyệt sẽ giữ nguyên 100% nội dung câu chữ và công thức của bạn, tự gom bảng thông tin Bên A/Bên B, tự chèn ngắt trang Section Break xoay ngang khổ A4 (25.2cm) cho các bảng từ 8 cột trở lên và lặp lại dòng tiêu đề đầu mỗi trang mới.',
      actionLabel: 'Thử nghiệm Chuẩn hóa .docx',
      onAction: () => setActiveTab('format-word'),
    },
    {
      id: 'faq-8',
      tag: 'Đồng bộ & An toàn dữ liệu',
      question:
        'Dữ liệu biên bản và file Word tải lên có an toàn không? Cơ sở dữ liệu trực tuyến có bị tạm dừng khi ít sử dụng không?',
      answer:
        'Mọi thao tác chuẩn hóa file Word (.docx) diễn ra hoàn toàn cục bộ ngay trong bộ nhớ trình duyệt của bạn, không gửi tài liệu nhạy cảm qua máy chủ trung gian thứ ba. Đối với dữ liệu biên bản và danh bạ, hệ thống lưu đồng bộ tức thời vào cả bộ nhớ trình duyệt và cơ sở dữ liệu PostgreSQL (Supabase), đi kèm kiến trúc chống ngủ đông 3 lớp tự động (Vercel Cron, GitHub Actions định kỳ 2 ngày/lần và Client Heartbeat) đảm bảo hệ thống luôn sẵn sàng 24/7.',
    },
  ];

  const normQuery = removeVietnameseDiacritics(filterQuery.trim());

  const filteredSlashCommands = useMemo(() => {
    if (!normQuery) return SLASH_COMMANDS_GUIDE;
    return SLASH_COMMANDS_GUIDE.filter((item) =>
      [item.syntax, item.category, item.example, item.effect].some((txt) =>
        removeVietnameseDiacritics(txt).includes(normQuery)
      )
    );
  }, [normQuery]);

  const filteredFaqs = useMemo(() => {
    if (!normQuery) return faqList;
    return faqList.filter((f) =>
      [f.tag, f.question, f.answer, f.legalRef || ''].some((txt) =>
        removeVietnameseDiacritics(txt).includes(normQuery)
      )
    );
  }, [normQuery]);

  const handleSwitchDemoRole = (
    role: 'chairperson' | 'secretary' | 'member' | 'admin',
    name: string,
    title: string,
    email: string,
    id: string
  ) => {
    if (currentUser.isGoogleAuth) {
      toast.info('Bạn đang đăng nhập bằng tài khoản Google chính thức');
      return;
    }
    setCurrentUser({
      id,
      name,
      role,
      title,
      email,
      isGoogleAuth: false,
    });
    toast.success(`Đã chuyển sang vai trò [${title}]`, `Đang trải nghiệm dưới tên ${name}.`);
  };

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 p-5 sm:p-7">
      {/* Top Executive Guide Header + Instant Search */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d3e3fd] px-3 py-0.5 text-xs font-semibold text-[#0b3d91]">
                <BookOpen className="h-3.5 w-3.5 text-[#1d4ed8]" />
                Cẩm nang Nghiệp vụ Chuẩn Khép kín
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Luật DN 2020 · Nghị định 30/2020/NĐ-CP · Quy chế 07/QĐ-VTS
              </span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Hướng dẫn sử dụng & Quy trình Vận hành Minutely
            </h1>
            <p className="max-w-3xl text-[13.5px] leading-relaxed text-slate-600">
              Làm chủ trọn vẹn luồng nghiệp vụ từ khởi tạo cuộc họp 1 chạm, tốc ký biên bản thời gian thực, ký khóa toàn vẹn SHA-256 đến đôn đốc việc sau họp và chuẩn hóa tự động Hợp đồng, Bảng biểu, Văn bản hành chính 14 ô.
            </p>
          </div>

          {/* Search inside Guide */}
          <div className="w-full lg:w-80">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterQuery(val);
                  if (val.trim() && activeSection !== 'faq' && activeSection !== 'live-shortcuts') {
                    setActiveSection('faq');
                  }
                }}
                placeholder="Tra cứu nhanh: túc số, /viec, hợp đồng, SHA-256…"
                className="h-10 w-full rounded-xl border border-slate-300 bg-[var(--surface-well)] pl-9 pr-3 text-[13px] text-slate-900 placeholder-slate-500 transition-colors focus:border-[#1d4ed8] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 5-Tab Segmented Navigation */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4">
          {[
            { id: 'overview' as const, label: '1. Luồng chuẩn 6 bước', icon: Compass },
            { id: 'roles' as const, label: '2. Hướng dẫn theo Vai trò', icon: Users },
            { id: 'live-shortcuts' as const, label: '3. Lệnh tốc ký /slash & Phím tắt', icon: Terminal },
            { id: 'word-studio' as const, label: '4. Chuẩn hóa Word, Hợp đồng & 14 Ô', icon: WandSparkles },
            { id: 'faq' as const, label: '5. Xử lý tình huống & FAQ', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`press-subtle inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] transition-all ${
                  isActive
                    ? 'bg-[#1d4ed8] font-semibold text-white shadow-xs'
                    : 'bg-[var(--surface-well)] font-medium text-slate-700 hover:bg-[var(--surface-hover)] hover:text-slate-950'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#1d4ed8]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: LUỒNG NGHIỆP VỤ CHUẨN KHÉP KÍN 6 BƯỚC                    */}
      {/* =================================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Visual Pipeline Summary Strip */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900">
                Bức tranh tổng thể: Chu trình Khép kín Trước họp → Trong họp → Sau họp & Văn thư
              </h2>
              <span className="text-xs text-slate-500">
                Bấm vào bất kỳ bước nào bên dưới để thực hành trực tiếp
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
              {[
                {
                  num: '01',
                  title: 'Danh bạ & Đơn vị',
                  desc: 'Pháp nhân & Nhóm họp',
                  icon: UsersRound,
                  onClick: () => setActiveTab('directory'),
                },
                {
                  num: '02',
                  title: 'Khởi tạo Cuộc họp',
                  desc: '14 mẫu chuẩn A–E',
                  icon: PlusCircle,
                  onClick: onOpenCreateModal,
                },
                {
                  num: '03',
                  title: 'Phòng Ghi Tốc ký',
                  desc: 'Điểm danh · /qd · /viec',
                  icon: Play,
                  onClick: () => setActiveTab('live'),
                },
                {
                  num: '04',
                  title: 'Ký khóa SHA-256',
                  desc: 'Xuất Word · PDF · Trích lục',
                  icon: FileCheck2,
                  onClick: () => setActiveTab('preview'),
                },
                {
                  num: '05',
                  title: 'Bảng việc Sau họp',
                  desc: 'Kanban & Lưu vết dời hạn',
                  icon: CheckSquare,
                  onClick: () => setActiveTab('actions'),
                },
                {
                  num: '06',
                  title: 'Văn bản & Hợp đồng',
                  desc: '14 Ô · FormatHopDong/Bang',
                  icon: WandSparkles,
                  onClick: () => setActiveTab('format-word'),
                },
              ].map((node) => {
                const Icon = node.icon;
                return (
                  <button
                    key={node.num}
                    type="button"
                    onClick={node.onClick}
                    className="group press-subtle flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200/90 bg-[var(--surface-well)] p-3.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tabular-nums text-[#1d4ed8]">
                        Bước {node.num}
                      </span>
                      <Icon className="h-4 w-4 text-slate-500 transition-colors group-hover:text-[#1d4ed8]" />
                    </div>
                    <div className="mt-2.5">
                      <p className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#0b3d91]">
                        {node.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">{node.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed 6 Step Cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {workflowSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#d3e3fd] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#0b3d91]">
                      {step.stepNumber}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-[15.5px] font-semibold leading-snug text-slate-900">
                    {step.title}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-slate-600">{step.summary}</p>

                  <ul className="space-y-2 border-t border-slate-100 pt-3">
                    {step.bullets.map((b, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-700"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 space-y-3 pt-2">
                  <div className="rounded-xl bg-[var(--surface-well)] px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                    <strong className="font-semibold text-[#0b3d91]">Mẹo tối ưu:</strong>{' '}
                    {step.proTip}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={step.onAction}
                      className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-[13px] font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
                    >
                      <span>{step.ctaLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: HƯỚNG DẪN THEO VAI TRÒ PHÂN QUYỀN (RBAC PLAYBOOKS)       */}
      {/* =================================================================== */}
      {activeSection === 'roles' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 text-[13px] text-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="font-semibold text-[#0b3d91]">
                  Vai trò hiện tại của bạn:
                </strong>{' '}
                <span>
                  {currentUser.name} ({currentUser.title}) — Quyền hệ thống:{' '}
                  <strong className="font-semibold uppercase text-[#1d4ed8]">
                    {currentUser.role}
                  </strong>
                </span>
              </div>
              {isGuest && (
                <span className="text-xs text-slate-600">
                  Chế độ Dùng thử: Bấm nút “Trải nghiệm vai trò này” trên từng thẻ để kiểm chứng phân quyền thực tế.
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              {
                roleKey: 'secretary' as const,
                id: 'p2',
                sampleName: 'Trần Thị Thu Hà',
                sampleTitle: 'Trưởng ban Pháp chế (Thư ký)',
                sampleEmail: 'ha.tran@vinacorp.vn',
                badge: 'Thư ký cuộc họp',
                badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
                mission:
                  'Chịu trách nhiệm chuẩn bị nghị sự, điểm danh túc số, ghi tốc ký diễn biến thảo luận và hoàn thiện thể thức biên bản trình Chủ tọa.',
                tasks: [
                  'Khởi tạo cuộc họp mới từ Nhóm họp mẫu hoặc 14 biểu mẫu chuẩn, bật tùy chọn kéo việc tồn đọng kỳ trước.',
                  'Điểm danh đại biểu (Có mặt / Đi trễ / Ủy quyền), bấm đồng hồ phiên họp và tốc ký bằng các lệnh /yk, /dx, /pb, /qd, /viec.',
                  'Mở bảng Kiểm phiếu (/bq) ghi nhận tỷ lệ biểu quyết và nhập Ý kiến bảo lưu (nếu có).',
                  'Kiểm tra bản xem trước A4 chuẩn Nghị định 30 và bấm "Trình duyệt" để chuyển hồ sơ sang Chủ tọa.',
                ],
                primaryNav: () => setActiveTab('live'),
                primaryLabel: 'Mở Phòng ghi trực tiếp',
              },
              {
                roleKey: 'chairperson' as const,
                id: 'p1',
                sampleName: 'Nguyễn Văn Hùng',
                sampleTitle: 'Chủ tịch HĐQT (Chủ tọa)',
                sampleEmail: 'hung.nguyen@vinacorp.vn',
                badge: 'Chủ tọa / Người phê duyệt',
                badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                mission:
                  'Chủ trì điều hành phiên họp, thẩm định nội dung quyết nghị cuối cùng, ký khóa toàn vẹn SHA-256 và phê duyệt phát hành.',
                tasks: [
                  'Theo dõi các biên bản đang ở trạng thái "Chờ duyệt" và các nhiệm vụ quá hạn ngay trên màn hình Tổng quan điều hành.',
                  'Đọc kiểm tra toàn văn biên bản khổ A4 tại mục Xem, Ký & Xuất bản; nếu cần bổ sung, bấm "Trả lại" kèm lý do cụ thể cho Thư ký.',
                  'Bấm "Ký duyệt & Khóa" để niêm phong mã băm SHA-256 và bấm "Phát hành" để phân phối chính thức.',
                  'Khi cần đính chính hồ sơ đã khóa, khởi tạo "Bản sửa đổi (v2.0)" để bảo toàn lịch sử kiểm toán.',
                ],
                primaryNav: () => setActiveTab('preview'),
                primaryLabel: 'Mở Xem, Ký & Xuất bản',
              },
              {
                roleKey: 'member' as const,
                id: 'p3',
                sampleName: 'Lê Hoàng Minh',
                sampleTitle: 'Đại diện Cổ đông lớn (Thành viên)',
                sampleEmail: 'minh.le@dragoncapital.com',
                badge: 'Thành viên / Đại biểu dự họp',
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                mission:
                  'Tra cứu nội dung biên bản chính thức ở chế độ chỉ đọc an toàn và thực thi, giải trình tiến độ các đầu việc được phân công.',
                tasks: [
                  'Xem lại đầy đủ diễn biến thảo luận, kết quả biểu quyết và tải file PDF / Word biên bản đã ban hành.',
                  'Truy cập "Bảng việc sau họp" để cập nhật trạng thái công việc (Chưa làm → Đang thực hiện → Hoàn thành).',
                  'Trường hợp gặp vướng mắc khách quan cần gia hạn, thực hiện "Dời hạn" kèm lý do giải trình minh bạch trên hệ thống.',
                  'Không có quyền sửa nội dung biên bản hay xóa hồ sơ để bảo vệ tuyệt đối an toàn dữ liệu chung.',
                ],
                primaryNav: () => setActiveTab('actions'),
                primaryLabel: 'Mở Bảng việc cá nhân',
              },
              {
                roleKey: 'admin' as const,
                id: 'p11',
                sampleName: 'Trương Tuấn Anh',
                sampleTitle: 'Giám đốc Công nghệ (Quản trị & Văn thư)',
                sampleEmail: 'anh.truong@vinacorp.vn',
                badge: 'Văn thư / Pháp chế / Quản trị',
                badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                mission:
                  'Chuẩn hóa dữ liệu danh mục toàn đơn vị, kiểm soát thể thức văn bản hành chính 14 ô, chuẩn hóa Hợp đồng và lưu trữ hồ sơ.',
                tasks: [
                  'Thiết lập thông tin Pháp nhân đơn vị, Phòng họp cố định, Danh bạ nhân sự và các Nhóm họp thường trực.',
                  'Từ biên bản đã khóa, trích xuất tự động sang dự thảo Thông báo kết luận (TB), Quyết định (QĐ), Nghị quyết (NQ) hoặc Hợp đồng (HĐ).',
                  'Sử dụng động cơ FormatHopDong & FormatBang để chuẩn hóa nhanh các file .docx và phụ lục bảng tính nhiều cột trước khi trình ký.',
                  'Đưa các biên bản đã hoàn tất thực thi vào trạng thái "Lưu trữ hồ sơ" dài hạn.',
                ],
                primaryNav: () => setActiveTab('format-word'),
                primaryLabel: 'Mở Trung tâm Chuẩn hóa Word',
              },
            ].map((r) => {
              const isCurrentRole = currentUser.role === r.roleKey;
              return (
                <div
                  key={r.roleKey}
                  className={`flex flex-col justify-between rounded-2xl border p-5 shadow-2xs ${
                    isCurrentRole
                      ? 'border-blue-300 bg-[var(--surface-panel)] ring-1 ring-blue-200/70'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-panel)]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold ${r.badgeClass}`}
                      >
                        {r.badge}
                      </span>
                      {isCurrentRole && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          Đang sử dụng vai trò này
                        </span>
                      )}
                    </div>

                    <p className="text-[13.5px] font-medium leading-relaxed text-slate-800">
                      {r.mission}
                    </p>

                    <ul className="space-y-2 border-t border-slate-100 pt-3">
                      {r.tasks.map((t, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-700"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d4ed8]" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                    {isGuest && !isCurrentRole ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleSwitchDemoRole(
                            r.roleKey,
                            r.sampleName,
                            r.sampleTitle,
                            r.sampleEmail,
                            r.id
                          )
                        }
                        className="cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Trải nghiệm vai trò [{r.badge}]
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Phân quyền chuẩn doanh nghiệp</span>
                    )}

                    <button
                      type="button"
                      onClick={r.primaryNav}
                      className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#0b3d91] transition-colors hover:bg-blue-100"
                    >
                      <span>{r.primaryLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 3: BẢNG TRA CỨU LỆNH TỐC KÝ /SLASH & PHÍM TẮT               */}
      {/* =================================================================== */}
      {activeSection === 'live-shortcuts' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-[16px] font-semibold text-slate-900">
                  7 Lệnh Tốc ký Thông minh trong Phòng ghi trực tiếp
                </h2>
                <p className="mt-0.5 text-[13px] text-slate-600">
                  Tại ô nhập liệu dưới cùng cột giữa, chỉ cần gõ dấu gạch chéo <code className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-[#0b3d91]">/</code> ở đầu dòng để phân loại phát biểu hoặc ra lệnh tự động mà không cần rời tay khỏi bàn phím.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2 text-[13px] font-semibold text-white shadow-xs hover:bg-[#1e40af]"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Thực hành ngay tại Phòng ghi</span>
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {filteredSlashCommands.map((cmd) => (
                <div
                  key={cmd.syntax}
                  className="grid grid-cols-1 gap-3 py-3.5 md:grid-cols-12 md:items-center"
                >
                  <div className="md:col-span-3">
                    <code className="inline-block rounded-lg border border-blue-200/80 bg-blue-50/70 px-2.5 py-1 text-[13px] font-semibold text-[#0b3d91]">
                      {cmd.syntax}
                    </code>
                    <div className="mt-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cmd.badgeTone}`}
                      >
                        {cmd.category}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <p className="text-xs font-medium text-slate-500">Ví dụ gõ thực tế:</p>
                    <p className="mt-0.5 rounded-lg bg-[var(--surface-well)] px-3 py-1.5 text-[13px] text-slate-800">
                      {cmd.example}
                    </p>
                  </div>

                  <div className="md:col-span-5">
                    <p className="text-[13px] leading-relaxed text-slate-700">{cmd.effect}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart @Mention & !Deadline + Keyboard Shortcuts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1d4ed8]" />
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Cú pháp Hạn chót Tiếng Việt tự nhiên (<code className="text-[#0b3d91]">!Hạn</code>)
                </h3>
              </div>
              <p className="text-[13px] leading-relaxed text-slate-600">
                Khi dùng lệnh giao việc <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">/viec</code>, bộ phân tích ngày tháng thông minh tự động hiểu các cách viết nhanh của người Việt:
              </p>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-[var(--surface-well)] px-3.5">
                {[
                  { token: '!mai / !ngaymai', meaning: 'Tự tính sang ngày mai' },
                  { token: '!t6 / !thu6', meaning: 'Thứ Sáu gần nhất sắp tới' },
                  { token: '!25/12', meaning: 'Ngày 25 tháng 12 năm hiện tại' },
                  { token: '!15/01/2027', meaning: 'Ngày tháng năm đầy đủ' },
                  { token: '@Hà / @Hùng', meaning: 'Tự khớp đại biểu có tên tương ứng trong cuộc họp' },
                ].map((row) => (
                  <div
                    key={row.token}
                    className="flex items-center justify-between gap-2 py-2.5 text-xs"
                  >
                    <code className="font-semibold text-[#0b3d91]">{row.token}</code>
                    <span className="text-slate-700">{row.meaning}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#1d4ed8]" />
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Bảng Phím tắt Điều hướng Toàn hệ thống
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {KEYBOARD_SHORTCUTS.map((k) => (
                  <div
                    key={k.keys}
                    className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="shrink-0">
                      <kbd className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                        {k.keys}
                      </kbd>
                      <span className="ml-2 text-xs text-slate-500">{k.scope}</span>
                    </div>
                    <p className="text-[13px] text-slate-700 sm:max-w-md sm:text-right">{k.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: CHUẨN HÓA WORD (.DOCX), HỢP ĐỒNG, BẢNG BIỂU & 14 Ô       */}
      {/* =================================================================== */}
      {activeSection === 'word-studio' && (
        <div className="space-y-6">
          {/* 3 Core Capabilities */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0b3d91]">
                  <Upload className="h-4 w-4 text-[#1d4ed8]" />
                  <span>1. Kéo thả File .docx (FormatHopDong)</span>
                </div>
                <h3 className="text-[15.5px] font-semibold text-slate-900">
                  Chuẩn hóa Hợp đồng & Văn bản có sẵn trong 1 giây
                </h3>
                <ul className="space-y-2 text-[13px] leading-relaxed text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Đưa toàn bộ phông chữ về <strong>Times New Roman</strong>, màu đen <code className="text-xs">#000000</code>, căn lề chuẩn Nghị định 30 (Trái 3cm, Phải 1.5cm, Trên/Dưới 2cm).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Tự động nhận diện khối thông tin <strong>BÊN A / BÊN B</strong> đang gõ thủ công rời rạc để gom vào bảng 2 cột không viền thẳng hàng tuyệt đối (<code className="text-xs">4.3cm | 12.2cm</code>), khử lỗi lặp dấu <code className="text-xs">::</code>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Đóng bảng chữ ký <strong>ĐẠI DIỆN BÊN A – ĐẠI DIỆN BÊN B</strong> chống bị rớt dòng chữ ký sang trang lẻ loi và tự đánh số trang lề trên ẩn trang 1.
                    </span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('format-word')}
                className="press-subtle mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1e40af]"
              >
                <span>Mở Chuẩn hóa File .docx</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <span>2. Soạn mới Văn bản 14 Ô (27 loại VB)</span>
                </div>
                <h3 className="text-[15.5px] font-semibold text-slate-900">
                  Tờ trình, Báo cáo, Quyết định, Công văn & Hợp đồng
                </h3>
                <ul className="space-y-2 text-[13px] leading-relaxed text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Dựng sẵn lưới tọa độ <strong>14 ô thể thức</strong> chuẩn Nghị định 30/2020/NĐ-CP và Quy chế Văn thư VTC Digicom (<code className="text-xs">07/QĐ-VTS</code>) kèm xem trước trang A4 thời gian thực.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Hỗ trợ riêng mẫu <strong>Tờ trình nội bộ có khung PHÊ DUYỆT 3 cột cuối trang</strong>, mẫu Quyết định Chủ tịch, Báo cáo đơn vị và Công văn hành chính.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Nút <strong>“Nạp từ Biên bản đang mở”</strong> tự động chuyển hóa các quyết nghị cuộc họp thành dự thảo Thông báo kết luận hoặc Quyết định chỉ trong 1 cú nhấp.
                    </span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('format-word')}
                className="press-subtle mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[13px] font-semibold text-[#0b3d91] hover:bg-blue-100"
              >
                <span>Mở Trình soạn Văn bản 14 Ô</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                  <Table2 className="h-4 w-4 text-amber-700" />
                  <span>3. Format Bảng từ Excel (FormatBang)</span>
                </div>
                <h3 className="text-[15.5px] font-semibold text-slate-900">
                  Tự động chia độ rộng cột & Xoay ngang Phụ lục ≥ 8 cột
                </h3>
                <ul className="space-y-2 text-[13px] leading-relaxed text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Copy vùng dữ liệu từ Excel / Google Sheets dán vào ô nhập: thuật toán tự nhận diện 8 loại cột (<code className="text-xs">STT, Mã, ĐVT, Số lượng, Ngày, Tiền tệ, %, Diễn giải</code>).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Tự căn phải số tiền (<code className="text-xs">tabular-nums</code>), căn giữa STT/ĐVT/Ngày, căn trái diễn giải và tự động in đậm các dòng <strong>Tổng cộng / Bằng chữ</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Khi bảng có từ <strong>8 cột trở lên</strong>, tự động chuyển khổ giấy sang A4 Ngang (<code className="text-xs">25.2cm</code>), lặp tiêu đề đầu mỗi trang mới (<code className="text-xs">tblHeader</code>) và chống đứt dòng.
                    </span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('format-word')}
                className="press-subtle mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
              >
                <span>Mở Công cụ Format Bảng</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Cheat-Sheet of 07/QĐ-VTS & Decree 30 Rules */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
              <Scale className="h-4 w-4 text-[#1d4ed8]" />
              <h3 className="text-[15.5px] font-semibold text-slate-900">
                Bảng Tóm tắt 5 Quy tắc Thể thức Hay Nhầm Lẫn Nhất (Nghị định 30 & Quy chế 07/QĐ-VTS)
              </h3>
            </div>

            <div className="mt-3 divide-y divide-slate-100 text-[13px]">
              {[
                {
                  rule: '1. Ký hiệu Công văn hành chính',
                  wrong: 'Số: 5/CV-VTS hoặc Số: 05 / VTS - TCHC',
                  right: 'Số: 05/VTS-TCHC (cấp Công ty) hoặc Số: 05/TCHC-TH (nội bộ phòng)',
                  note: 'Công văn không có chữ /CV- trong ký hiệu và không có khoảng trắng quanh dấu / hoặc -.',
                },
                {
                  rule: '2. Quy tắc thêm số 0 ở Ngày, Tháng',
                  wrong: 'Hà Nội, ngày 5 tháng 05 năm 2026',
                  right: 'Hà Nội, ngày 05 tháng 5 năm 2026 (chỉ tháng 01 và 02 mới có số 0)',
                  note: 'Ngày < 10 bắt buộc có số 0; Tháng chỉ dùng 01, 02, còn tháng 3 đến 12 viết bình thường.',
                },
                {
                  rule: '3. Kiểu chữ phần Căn cứ ban hành',
                  wrong: 'Tờ trình và Báo cáo cũng in nghiêng toàn bộ phần Căn cứ',
                  right: 'In nghiêng với Quyết định, Nghị quyết, Quy chế, Quy định, Hợp đồng; In đứng với Tờ trình, Báo cáo, Công văn',
                  note: 'Cuối mỗi dòng căn cứ dùng dấu chấm phẩy (;), riêng dòng căn cứ cuối cùng kết thúc bằng dấu chấm (.).',
                },
                {
                  rule: '4. Họ tên Người ký & Dòng Lưu Nơi nhận',
                  wrong: 'Ghi "TS. Nguyễn Văn A" và thiếu dòng Lưu VT',
                  right: 'Chỉ ghi "Nguyễn Văn A" (không ghi học hàm, học vị); dòng cuối Nơi nhận bắt buộc "Lưu: VT, [Mã đơn vị]."',
                  note: 'Nếu ký thừa lệnh / ký thay ghi rõ KT. GIÁM ĐỐC / TL. CHỦ TỊCH ở dòng trên chức vụ.',
                },
                {
                  rule: '5. Đường kẻ chân dưới Quốc hiệu, Cơ quan & Trích yếu',
                  wrong: 'Dùng dấu gạch dưới (Underline) kéo dài hết dòng hoặc kẻ nét đứt',
                  right: 'Đường kẻ nét liền mảnh cân giữa: 100% độ dài dòng Tiêu ngữ; 1/3–1/2 dưới Tên cơ quan và dưới Trích yếu (trừ Công văn)',
                  note: 'Bộ xuất Word OpenXML tự động vẽ đường kẻ chuẩn kích thước mà không bị xô lệch khi in.',
                },
              ].map((item) => (
                <div
                  key={item.rule}
                  className="grid grid-cols-1 gap-2.5 py-3.5 lg:grid-cols-12 lg:items-start"
                >
                  <div className="font-semibold text-slate-900 lg:col-span-3">{item.rule}</div>
                  <div className="lg:col-span-4">
                    <span className="inline-block rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-800">
                      Sai thường gặp: {item.wrong}
                    </span>
                  </div>
                  <div className="space-y-1 lg:col-span-5">
                    <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      Chuẩn quy định: {item.right}
                    </span>
                    <p className="text-xs text-slate-600">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 5: TÌNH HUỐNG PHÁP LÝ THỰC TẾ & CÂU HỎI THƯỜNG GẶP (FAQ)    */}
      {/* =================================================================== */}
      {activeSection === 'faq' && (
        <div className="space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-10 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Không tìm thấy mục hướng dẫn khớp với từ khóa “{filterQuery}”
              </p>
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="mt-3 cursor-pointer rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                Xóa từ khóa lọc
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!expandedFaqIds[faq.id] || normQuery.length > 0;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFaqIds((prev) => ({ ...prev, [faq.id]: !prev[faq.id] }))
                    }
                    className="flex w-full cursor-pointer items-start justify-between gap-4 p-5 text-left"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#0b3d91]">
                          {faq.tag}
                        </span>
                        {faq.legalRef && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                            {faq.legalRef}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-semibold leading-snug text-slate-900">
                        {faq.question}
                      </h3>
                    </div>

                    <span className="mt-1 shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3.5">
                      <p className="text-[13.5px] leading-relaxed text-slate-700">{faq.answer}</p>
                      {faq.actionLabel && faq.onAction && (
                        <div className="mt-3.5">
                          <button
                            type="button"
                            onClick={faq.onAction}
                            className="press-subtle inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold text-[#0b3d91] hover:bg-blue-100"
                          >
                            <span>{faq.actionLabel}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
