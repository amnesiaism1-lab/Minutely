---
name: bigtech-ui-system
description: "Bộ quy chuẩn thiết kế giao diện chuẩn Big Tech tổng hợp từ Google Material Design 3 (M3), Apple Human Interface Guidelines (HIG), Stripe, Linear, Atlassian Design System và Vercel Geist, kết hợp kiểm định tương phản WCAG 2.2 AA+. Kích hoạt kỹ năng này khi thiết kế, đánh giá hoặc nâng cấp bố cục, phân cấp bề mặt (tonal surfaces), typography, màu sắc tương phản và dashboard SaaS doanh nghiệp."
risk: safe
source: self
date_added: "2026-11-22"
tags: [google-m3, apple-hig, stripe, linear, atlassian, vercel-geist, wcag, design-system, ui-ux]
---

# Big Tech Enterprise UI Design System (Google M3 · Apple HIG · Stripe · Linear · Atlassian · Geist)

Bộ quy tắc thiết kế thực chiến chắt lọc từ 6 hệ thống thiết kế hàng đầu thế giới nhằm tạo ra giao diện **dễ nhìn ngay từ giây đầu tiên, phân cấp thị giác tự nhiên, tương phản đạt chuẩn quốc tế và không gây mỏi mắt khi làm việc nhiều giờ**.

---

## 1. Phân cấp Bề mặt theo Tông độ — Google Material Design 3 (M3 Tonal Surfaces)

Thay vì lạm dụng bóng đổ đậm (`heavy drop-shadow`) hoặc kẻ viền đen chằng chịt, Google Workspace (Drive, Gmail, Docs) và Linear phân tách không gian bằng **5 tầng độ sáng bề mặt (Surface Containers)**:

| Tầng bề mặt (M3 Role) | Mã màu chuẩn (Cool Daylight) | Chế độ Giấy ấm (Warm Comfort) | Vai trò không gian |
| :--- | :--- | :--- | :--- |
| **1. Shell Chrome** (`surfaceContainerLow`) | `#EEF3FA` | `#ECE5D8` | Khung bao ngoài cùng chứa Top Navbar & Left Sidebar (không kẻ viền thô). |
| **2. Workspace Sheet** (`surface`) | `#F7F9FC` | `#F5F0E6` | Tấm nền nội dung chính (`<main>`), bo góc mềm (`rounded-tl-2xl`) tách biệt rõ khỏi thanh điều hướng. |
| **3. Card Container** (`surfaceContainerLowest`) | `#FFFFFF` | `#FDFCF8` | Thẻ KPI, bảng danh sách biên bản, hộp quyết nghị, modal nổi bật trên nền Sheet. |
| **4. Nested Well / Lane** (`surfaceContainer`) | `#F1F5FB` | `#EDE6D8` | Ô lọc phụ, cột Kanban, vùng tóm tắt lồng bên trong mà không gây rối. |
| **5. Interactive Hover** (`surfaceContainerHigh`) | `#E6EEF8` | `#E4DCCB` | Phản hồi mượt khi di chuột lên mục điều hướng hoặc dòng dữ liệu. |

### Quy tắc vàng về Bề mặt:
- **Cấm "Hộp lồng trong Hộp" (No Box-in-Box Clutter)**: Bên trong một thẻ trắng `#FFFFFF`, sử dụng **đường kẻ phân tách mảnh `1px` (`divide-y divide-slate-100`)** theo chuẩn Linear/Stripe thay vì nhồi thêm hàng loạt thẻ xám có viền dày bên trong.
- **Viền (Outlines)**: Viền cấu trúc thẻ dùng `#DCE4F0` (`1px`), viền ô nhập liệu/nút bấm (`input`, `select`, `button` phụ) phải dùng `#C3CFE0` (hoặc `slate-300`) để đạt tương phản ranh giới tương tác `≥ 3:1` khi nhìn trên màn hình văn phòng sáng.

---

## 2. Chuẩn Tương phản Màu sắc — WCAG 2.2 AA+ & Apple HIG Clarity

Mọi cặp chữ – nền phải vượt ngưỡng **WCAG 2.2 AA** (`≥ 4.5:1` cho chữ thường, `≥ 7:1` khuyến nghị cho đọc văn bản dài):

| Cấp độ chữ / Thành phần | Mã màu Hex | Tương phản trên `#FFFFFF` | Quy tắc áp dụng bắt buộc |
| :--- | :--- | :--- | :--- |
| **Primary Ink** (Tiêu đề, số KPI, tên mục) | `#0F172A` (`slate-900`) | **16.1 : 1** (AAA) | Dùng cho toàn bộ tiêu đề, tên biên bản, nội dung chính, ô nhập liệu. Cấm dùng đen tuyền `#000000` trên UI (trừ trang in pháp lý A4). |
| **Secondary Ink** (Mô tả, nhãn phụ, metadata) | `#475569` (`slate-600`) | **7.5 : 1** (AAA) | Dùng cho ngày giờ, địa điểm, người phụ trách, mô tả phụ. |
| **Tertiary / Muted Ink** (Gợi ý phụ, caption) | `#64748B` (`slate-500`) | **4.6 : 1** (AA) | Cấp chữ nhạt nhất được phép hiển thị thông tin đọc được. |
| **BANNED trên chữ nhỏ** | `#94A3B8` (`slate-400`) | *2.5 : 1 (FAIL)* | **TUYỆT ĐỐI CẤM** dùng `slate-400` cho nhãn, mô tả hoặc thông tin nghiệp vụ (chỉ dùng cho icon trang trí hoặc trạng thái `disabled`). |

### Quy tắc Màu Nhấn — "Color as Punctuation" (Apple HIG & Stripe):
1. **Một Màu Thương hiệu Chủ đạo Duy nhất (`Primary Brand`)**:
   - Sử dụng **Royal Cobalt Blue (`#1A56DB` / `#1D4ED8`, hover `#1E40AF`)** chuẩn Google Cloud / Atlassian.
   - Nền chọn điều hướng (`primaryContainer`): `#D3E3FD` đi kèm chữ `#0B3D91` (**tương phản 9.8 : 1**).
   - **Tối đa 1 nút Primary đặc màu (`Solid Brand CTA`)** trên mỗi vùng màn hình để mắt người dùng biết ngay hành động chính cần bấm trong 0.2 giây.
2. **Cấm "Hội chứng Cầu vồng Viền dày" (No Rainbow Thick Borders)**:
   - Không đặt `border-top: 3px` hay `border-left: 4px` đủ màu lên tất cả các thẻ cùng lúc.
   - Thay bằng **chấm tròn ngữ nghĩa (`8px dot`) + nhãn Lozenge nền nhạt chữ đậm** theo chuẩn Atlassian/Linear:
     - **Hiệu lực / Hoàn thành (Success)**: Nền `#ECFDF5`, viền `#A7F3D0`, chữ `#065F46` (tương phản `7.8:1`).
     - **Chờ duyệt / Cảnh báo (Warning)**: Nền `#FFFBEB`, viền `#FDE68A`, chữ `#92400E` (tương phản `7.2:1`).
     - **Quá hạn / Lỗi chặn (Danger)**: Nền `#FFF1F2`, viền `#FECDD3`, chữ `#9F1239` (tương phản `8.1:1`).
     - **Đang xử lý / Thông tin (Info)**: Nền `#EFF6FF`, viền `#BFDBFE`, chữ `#1E40AF` (tương phản `8.5:1`).

---

## 3. Hệ thống Chữ & Nhịp điệu Không gian — Apple HIG, Linear & Geist

### Thang đo Typography & Độ Đậm Nhạt Hài Hòa (Chống nặng nề & rối mắt trên Windows):
- **Phông chữ chuẩn Tiếng Việt (`Unified UI Font`)**: Sử dụng **`Inter`** (`cv02, cv03, cv04, cv11`) + `Be Vietnam Pro` đồng nhất cho cả tiêu đề, nội dung và mã số (`tabular-nums`).
  - **Cấm trộn `Plus Jakarta Sans`** cho tiếng Việt (thiếu dấu tổ hợp gây lệch nét giữa các chữ cái trong cùng một từ).
  - **Cấm dùng `font-mono` mặc định của Windows (`Consolas`/`Courier`)** cho mã biên bản hay ngày tháng vì nét răng cưa làm rối mắt; dùng cùng phông sans-serif kèm `tabular-nums`.
- **Nhịp điệu Độ dày chữ (`400 / 500 / 600` — Cấm lạm dụng `700 Bold` tràn lan)**:
  - **Tiêu đề trang (`H1`) & Số liệu KPI (`26px`)**: `font-semibold` (`600`), `#0F172A`.
  - **Tiêu đề khối (`H2` — `15px`)**: `font-semibold` (`600`), `#0F172A`.
  - **Tiêu đề dòng dữ liệu / Tên công việc (`13.5px – 14.5px`)**: **`font-medium` (`500`)** — thanh thoát, rõ ràng, không gây đen đặc màn hình khi danh sách dài.
  - **Mã hồ sơ, ngày giờ, địa điểm, người phụ trách (`12px – 12.5px`)**: **`font-normal` (`400`)**, màu `#64748B` / `#475569`, đặt ở dòng dưới tiêu đề (*Title-First Hierarchy*).
- **Tinh giản Nhãn (Zero Redundant Badges)**:
  - Nhãn trạng thái dùng nền nhạt dịu không viền đậm (`bg-*-50 text-*-700 font-medium`).
  - Mức ưu tiên bình thường (*Trung bình* / *Thấp*) **ẩn nhãn** để giảm nhiễu; chỉ gắn nhãn cho các mục *Cao* và *Khẩn cấp*.
  - Hạn công việc viết gọn tự nhiên (`Trễ 8 ngày`, `Hôm nay`, `Còn 3 ngày`), không lặp lại ngày tháng dài trong ngoặc đơn.

### Lưới Không gian 4px / 8px (8pt Spatial Grid):
- **Sidebar**: Rộng `256px` (`16rem`), thu gọn `68px`; mục menu cao `40px` (`h-10`), dạng viên thuốc bo tròn chuẩn Google M3 (`rounded-full` hoặc `rounded-xl`).
- **Top Navbar**: Cao `56px` (`h-14`), thanh tìm kiếm trung tâm cao `36px – 38px` (`rounded-full` kiểu Google Workspace).
- **Lưới Dashboard**: `12 cột` (`max-w-[1360px]`), khoảng cách giữa các khối chính `24px` (`gap-6`), padding khung ngoài `24px – 32px`, padding trong thẻ `20px` (`p-5`).
- **Kích thước vùng bấm (Touch / Click Target)**: Nút thao tác chính cao tối thiểu `36px` (`h-9`) trên Desktop và `40px–44px` trên Mobile.

---

## 4. Tổ chức Bố cục & UX Copywriting chuẩn Sản phẩm Lớn

1. **Quy luật Quét mắt chữ F / chữ Z (F-Pattern Visual Flow)**:
   - Tầng 1: Ngữ cảnh ngày + Lời chào ngắn + Tối đa 2 nút hành động góc phải (1 Secondary + 1 Solid Primary).
   - Tầng 2: Thanh khởi tạo nhanh 1 chạm (Compact Quick-Action Bar) hoặc Cảnh báo thông minh (chỉ hiện khi thực sự có việc cần xử lý).
   - Tầng 3: Dải 4 chỉ số KPI ngang hàng, cùng chiều cao, có ý nghĩa hành động khi bấm vào.
   - Tầng 4: Bố cục bất đối xứng `7 cột (Danh sách chính)` + `5 cột (Việc cần làm / Trách nhiệm)` giúp mắt phân biệt rõ khu vực chính – phụ (tránh chia 3 cột bằng nhau đơn điệu).
2. **UX Copywriting Tự nhiên (Zero Robotic Text)**:
   - Không bao giờ hiển thị câu máy móc kiểu *"Bạn có 0 biên bản chờ phê duyệt và 6 nhiệm vụ quá hạn"*. Nếu một vế bằng `0`, tự động ẩn vế đó để thông điệp súc tích, đúng trọng tâm con người đọc.
3. **Chuyển động Tinh tế (Silk Physics)**:
   - Chỉ animate `transform` và `opacity` với đường cong mượt `cubic-bezier(0.22, 1, 0.36, 1)` dưới `220ms`; tôn trọng `prefers-reduced-motion`.

---

## 5. Checklist Kiểm định Nhanh Trước Khi Xuất Bản UI

- [ ] **Tách lớp Chrome vs Content**: Thanh điều hướng (`#EEF3FA`) đã tách tông rõ với vùng làm việc chính (`#F7F9FC` + thẻ `#FFFFFF`) chưa?
- [ ] **Không còn chữ siêu nhỏ mờ nhạt**: Đã loại bỏ `text-[9px]`, `text-[10px]` và `text-slate-400` trên các nhãn thông tin cần đọc chưa?
- [ ] **Tương phản nút & ô nhập**: Viền input/button phụ đã đủ rõ (`#CBD5E1` / `slate-300`) trên nền sáng chưa?
- [ ] **Không lạm dụng viền màu dày**: Đã thay các vạch màu dày gây rối bằng chấm trạng thái + Lozenge tương phản cao chưa?
- [ ] **Điểm nhấn duy nhất**: Trong mỗi khu vực, người dùng có nhìn ra ngay nút hành động chính (`#1D4ED8`) trong chưa đầy 1 giây không?
