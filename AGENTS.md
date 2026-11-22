# Antigravity Workspace Rules & Automated Skill Usage

## 1. Automatic Skill Discovery & Application
- Before implementing features, debugging errors, refactoring code, designing APIs, or writing tests, **always search and identify relevant skills** from the installed catalog in `C:\Users\Admin\.agents\skills\` and workspace `.agents/skills/`.
- **Automatic Activation**: Whenever a task matches an available skill domain (e.g., `bigtech-ui-system`, `hig-foundations`, `hig-components-layout`, `stitch-design-taste`, `wcag-audit-patterns`, `kpi-dashboard-design`, `systematic-debugging`, `typescript-expert`, etc.), proactively read that skill's `SKILL.md` and adhere strictly to its workflows and best practices.
- **Workflow Integrity**: Follow the multi-step checklists, diagnostic steps, or design patterns dictated by the matched skill before writing code.
- **Transparency**: Briefly notify the user which skill has been activated to address their request.

## 2. Project Architecture & Big Tech UI Design Standards (Google M3 · Apple HIG · Stripe · Linear · WCAG 2.2)

### 2.1. Tonal Surface Hierarchy (Google Material Design 3 & Linear)
- **App Shell (`surfaceContainerLow` `#EEF3FA`)**: `Navbar` và `Sidebar` nằm trên cùng một bề mặt khung đồng nhất, nhẹ nhàng, không bị chia cắt bởi các đường viền đen nặng nề.
- **Workspace Sheet (`surface` `#F7F9FC`)**: Khung nội dung chính `<main>` được đóng khung bo góc (`lg:rounded-tl-2xl border-t border-l border-[#DCE4F0]`) tạo chiều sâu tự nhiên tách biệt thanh điều hướng và vùng làm việc.
- **Elevated Cards (`surfaceContainerLowest` `#FFFFFF`)**: Các khối dữ liệu đặt trên nền trắng tinh khiết với viền `1px solid #DCE4F0`, hạn chế lồng hộp trong hộp (*no box-in-box*); sử dụng đường kẻ mảnh `divide-y divide-slate-100` cho các dòng danh sách.

### 2.2. Color Contrast & Semantic Punctuation (WCAG 2.2 AA+ & Apple HIG)
- **Text Contrast**:
  - Primary Ink: `#0F172A` (`slate-900`, >16:1) cho tiêu đề, tên biên bản, số liệu KPI.
  - Secondary Ink: `#475569` (`slate-600`, >7.5:1) cho mô tả, ngày giờ, địa điểm, người phụ trách.
  - Muted Metadata: `#64748B` (`slate-500`, ≥4.6:1). **Cấm dùng `slate-400` (`#94A3B8`) cho chữ thông tin cần đọc.**
- **Single Brand Accent**: Sử dụng **Royal Cobalt (`#1D4ED8`, hover `#1E40AF`)** cho nút CTA chính và trạng thái điều hướng đang chọn (`bg-[#D3E3FD] text-[#0B3D91]`, tương phản `9.8:1`). Tối đa **1 nút Primary đặc màu** trong mỗi vùng thao tác.
- **Restrained Status Signals**: Giao tiếp trạng thái bằng chấm màu `8px` và nhãn Lozenge tương phản cao (`emerald`, `amber`, `rose`, `blue`); không kẻ viền màu dày (`border-t-[3px]`, `border-l-4`) tràn lan trên mọi thẻ.

### 2.3. Typography & 8pt Spatial Grid (Atlassian & Vercel Geist)
- **Readable Type Scale**: Cỡ chữ chuẩn cho điều hướng, nút bấm, input và nội dung là `13.5px – 14px` (`text-[13.5px]` / `text-sm`); tiêu đề dòng `14.5px – 15px`; nhãn phụ/badge tối thiểu `12px` (`text-xs`). Không sử dụng cỡ chữ siêu nhỏ `9px – 10px` gây mỏi mắt.
- **Tabular Numerals**: Bắt buộc áp dụng `tabular-nums` cho toàn bộ KPI, mã số biên bản, tỷ lệ túc số và đồng hồ phiên họp.
- **Decree 30 Legal Isolation**: Giữ nguyên tuyệt đối `src/components/preview/Decree30View.tsx` (trang A4 trắng `#FFFFFF`, mực `#000000`, `Times New Roman` chuẩn Nghị định 30/2020/NĐ-CP).

### 2.4. Fast Minutes Engine & Supabase Anti-Pause Architecture
- Luồng 5 không gian cốt lõi: `Tổng quan` -> `Phòng ghi trực tiếp` -> `Xem, Ký & Xuất bản` -> `Kho biên bản` -> `Bảng việc sau họp`.
- Lưu trữ đồng bộ `meeting_payload JSONB` kết hợp 3 lớp chống ngủ đông Supabase (`Vercel Cron /api/keepalive`, `GitHub Actions 2-day Heartbeat`, và `Client 12h Throttled Ping` lên bảng `system_heartbeat`).
