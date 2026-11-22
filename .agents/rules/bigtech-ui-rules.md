---
description: Quy tắc thiết kế giao diện chuẩn Big Tech (Google Material 3, Apple HIG, Stripe, Linear, Atlassian, WCAG 2.2 AA+) cho dự án Minutely
alwaysApply: true
---

# Quy chuẩn Thiết kế Giao diện Big Tech (Minutely Design Rules)

1. **Google M3 Tonal Surface Architecture**:
   - Tách biệt rõ **Shell Chrome** (`#EEF3FA` cho Navbar + Sidebar) với **Workspace Sheet** (`#F7F9FC`, bo góc `lg:rounded-tl-2xl`) và **Card Surface** (`#FFFFFF`, viền `1px #DCE4F0`).
   - Bên trong thẻ trắng, ưu tiên danh sách phân cách bằng đường kẻ mảnh `divide-y divide-slate-100` thay vì lồng nhiều hộp xám gây rối mắt.

2. **WCAG 2.2 AA+ Contrast & Color Discipline**:
   - Chữ chính dùng `#0F172A` (`slate-900`, >16:1), chữ phụ dùng `#475569` (`slate-600`, >7.5:1), metadata dùng `#64748B` (`slate-500`, ≥4.6:1). **Cấm dùng `slate-400` cho chữ thông tin cần đọc.**
   - Màu nhấn thương hiệu duy nhất: **Royal Cobalt (`#1D4ED8`, hover `#1E40AF`, active pill `#D3E3FD` / `#0B3D91`)**. Tối đa 1 nút Primary đặc màu mỗi vùng màn hình.
   - Không lạm dụng viền màu dày (`border-t-[3px]`, `border-l-4`) tràn lan; dùng chấm màu `8px` và nhãn Lozenge tương phản cao (`text-*-800/900` trên nền `bg-*-50`).

3. **Readable Typography & 8pt Spatial Rhythm**:
   - Cỡ chữ điều hướng, nút bấm, ô nhập và nội dung từ `13.5px – 14px` (`text-[13.5px]` / `text-sm`); tiêu đề dòng `14px – 15px`; nhãn trạng thái tối thiểu `12px` (`text-xs`). Không dùng `9px – 10px` cho nhãn nghiệp vụ.
   - Mọi con số thống kê, mã hồ sơ, bộ đếm thời gian phải bật `tabular-nums`.

4. **Bảo toàn Thể thức Pháp lý A4**:
   - Tuyệt đối giữ nguyên `src/components/preview/Decree30View.tsx` (nền `#FFFFFF`, chữ `#000000`, phông `Times New Roman` chuẩn Nghị định 30/2020/NĐ-CP).

5. **Tailwind CSS v4 Static Classes**:
   - Luôn viết đầy đủ chuỗi utility class tĩnh, không nối chuỗi động kiểu ``bg-${color}-50``.
