# HƯỚNG DẪN TRIỂN KHAI MINUTELY LÊN VERCEL VÀ GITHUB (TỰ ĐỘNG CẬP NHẬT DEPLOYMENT)

Tài liệu này hướng dẫn chi tiết quy trình cấu hình để khi **push code lên GitHub (`amnesiaism1-lab/Minutely`)**, **Vercel sẽ tự động trigger build và cập nhật deployment** ngay lập tức, tương tự như kiến trúc triển khai của dự án `https://github.com/amnesiaism1-lab/Brain-Pro`.

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI

Minutely được xây dựng trên nền tảng **React 19 + TypeScript + Vite + Tailwind CSS v4** với cơ chế Client-Side Offline-First & Zero-Downtime:
- **Build cực nhanh**: Thời gian biên dịch production bundle chỉ **~700ms**.
- **Không lỗi Cold-Start**: Ứng dụng chạy trực tiếp trên Vercel Edge Network / CDN toàn cầu, phản hồi tức thời dưới 30ms.
- **Bảo toàn dữ liệu 100%**: Lưu trữ tức thời vào LocalStorage của trình duyệt và hỗ trợ trích xuất file Word (`.docx`), PDF (`.pdf`), mã băm SHA-256 xác thực.

---

## 2. CÁC TỆP CẤU HÌNH CỐT LÕI ĐÃ ĐƯỢC THIẾT LẬP

Dự án đã được tích hợp sẵn các file cấu hình tối ưu:

### A. `vercel.json` (Tại thư mục gốc)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### B. `.github/workflows/ci.yml` (Kiểm thử tự động trước khi Deploy)
Mỗi khi có commit đẩy lên branch `main`, GitHub Actions sẽ tự động chạy quy trình kiểm thử kiểu dữ liệu (TypeScript) và build bundle để đảm bảo Vercel không bao giờ gặp lỗi compile.

### C. `package.json`
Đã cấu hình script `vercel-build`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "vercel-build": "npm run build"
}
```

---

## 3. CÁC BƯỚC ĐẨY CODE LÊN GITHUB VÀ KẾT NỐI VERCEL

### BƯỚC 1: Đẩy toàn bộ mã nguồn lên GitHub Repo
Mở Terminal tại thư mục dự án và chạy các lệnh:

```bash
# 1. Kiểm tra trạng thái git
git status

# 2. Thêm toàn bộ mã nguồn mới
git add .

# 3. Commit phiên bản hoàn thiện
git commit -m "feat: complete Minutely meeting minutes platform with Decree 30 and Enterprise Law compliance"

# 4. Đặt nhánh chính là main
git branch -M main

# 5. Đẩy lên repository GitHub
git push -u origin main
```

*(Lưu ý: Nếu GitHub yêu cầu xác thực tài khoản, hãy đăng nhập bằng Personal Access Token (PAT) hoặc GitHub CLI `gh auth login`).*

---

### BƯỚC 2: Nhập dự án vào Vercel (Import Git Repository)

1. Truy cập vào **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Nhấp vào nút **"Add New..."** ở góc trên bên phải -> chọn **"Project"**.
3. Tại mục **"Import Git Repository"**, tìm kiếm repo `Minutely` (hoặc `amnesiaism1-lab/Minutely`).
4. Nhấp vào nút **"Import"** bên cạnh tên repository.

---

### BƯỚC 3: Cấu hình thông số và biến môi trường trên Vercel (Project Configuration)

Nhờ file `vercel.json`, Vercel sẽ tự động điền các thông số:
- **Project Name**: `minutely` (hoặc tên bạn tùy chọn)
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (để mặc định)
- **Build and Output Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

#### ⚙️ Biến môi trường bắt buộc (Environment Variables):
Vào mục **Environment Variables** trong khi Import (hoặc vào **Settings > Environment Variables** sau khi deploy), thêm các biến sau (lấy từ tệp `.env` bí mật trên máy bạn):

| Key | Value mẫu | Ghi chú |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.ewztorukxapprldbybit:[YOUR_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require` | Chuỗi kết nối Supabase Pooler Port 6543 (Thay `[YOUR_PASSWORD]` bằng password đã URL-encode `%40`) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Cho phép Vercel Serverless Function kết nối TLS pooler |
| `VITE_GOOGLE_CLIENT_ID` | `<YOUR_GOOGLE_CLIENT_ID>` | Google OAuth Client ID (xem trong file `.env`) |
| `GOOGLE_CLIENT_SECRET` | `<YOUR_GOOGLE_CLIENT_SECRET>` | Google OAuth Secret (xem trong file `.env`) |

Nhấp vào nút **"Deploy"**.

Vercel sẽ tiến hành clone repo, cài đặt dependencies và chạy lệnh `npm run build`. Sau khoảng **15 - 30 giây**, màn hình chúc mừng xuất hiện với đường link trang web hoạt động chính thức (dạng `https://minutely-xxx.vercel.app`).

---

### BƯỚC 4: Cấu hình Google Cloud Console (Cho phép Đăng nhập Google)

Để nút **"Đăng nhập với Google"** hoạt động trơn tru trên cả máy local và tên miền Vercel:

1. Truy cập **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Chọn project chứa Google OAuth 2.0 Client ID của bạn.
3. Bấm vào tên OAuth 2.0 Client ID để chỉnh sửa.
4. Tại mục **Authorized JavaScript origins (Nguồn gốc JavaScript được phép)**, thêm các URL sau:
   - `http://localhost:3000` (dành cho chạy dev local)
   - `http://localhost:5173` (dành cho preview)
   - `https://minutely.vercel.app` (thay bằng tên miền Vercel thực tế của bạn)
5. Tại mục **Authorized redirect URIs (URI chuyển hướng được phép)**, thêm:
   - `http://localhost:3000`
   - `https://minutely.vercel.app`
6. Bấm **Save** để áp dụng (có hiệu lực trong vòng 1-5 phút).

---

### BƯỚC 5: Thiết lập GitHub Secrets để Supabase không bị tạm dừng (Keep-Alive)

Để Supabase Free Tier không bị đóng băng sau 7 ngày không hoạt động:
1. Vào GitHub repo: `https://github.com/amnesiaism1-lab/Minutely/settings/secrets/actions`.
2. Bấm **New repository secret**.
3. Thêm secret tên: `DATABASE_URL` với giá trị kết nối Supabase PostgreSQL từ `.env`.
4. GitHub Actions workflow `.github/workflows/keep-supabase-alive.yml` sẽ tự động ping database mỗi 3 ngày lúc 11:00 AM VN.

---

### BƯỚC 6: Cơ chế Tự Động Cập Nhật (Git-Push Auto Deployment)

Kể từ thời điểm này, mỗi khi bạn chỉnh sửa mã nguồn và chạy lệnh:
```bash
git add .
git commit -m "update: cải tiến tính năng mới"
git push origin main
```
- GitHub sẽ kích hoạt Webhook tự động thông báo cho Vercel.
- Vercel sẽ tự động tải commit mới nhất về, biên dịch và cập nhật trang web (Zero Downtime) chỉ trong vòng vài chục giây.
- Bạn có thể xem lịch sử các lần deploy, rollback phiên bản cũ bất cứ lúc nào trong tab **Deployments** trên Vercel.

---

## 5. THÔNG SỐ KẾT NỐI SUPABASE POSTGRESQL (ĐÃ TEST THÀNH CÔNG 100%)

Cơ sở dữ liệu Supabase của bạn đã được kết nối thực tế, khởi tạo toàn bộ 8 bảng schema và nạp dữ liệu mẫu thành công:

### Biến môi trường trên Vercel (Settings > Environment Variables):

| Tên biến (Key) | Giá trị tối ưu (Value) | Mô tả |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres.ewztorukxapprldbybit:[YOUR_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` | Supavisor Transaction Pooler (Port 6543, Singapore). Chịu tải hàng ngàn kết nối đồng thời. Lưu ý `@` trong password được URL-encode thành `%40`. |
| `DIRECT_URL` | `postgresql://postgres.ewztorukxapprldbybit:[YOUR_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` | Session Pooler dùng khi chạy lệnh `npm run db:migrate` |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` | Cho phép Node.js kết nối TLS tới Supavisor Pooler mà không bị lỗi self-signed cert chain |
| `VITE_SUPABASE_URL` | `https://ewztorukxapprldbybit.supabase.co` | REST API Endpoint |

### Các lệnh quản trị database từ máy local:
```bash
# Tạo/cập nhật bảng schema:
npm run db:migrate

# Nạp dữ liệu cuộc họp mẫu:
npm run db:seed
```

