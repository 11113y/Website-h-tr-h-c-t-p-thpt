# Website hỗ trợ học tập THPT

## Hướng dẫn cài đặt và sử dụng

Ứng dụng web hỗ trợ học Toán THPT, gồm giao diện học sinh và trang quản trị. Học sinh có thể học lý thuyết, làm đề thi, xem lời giải, lưu câu hỏi, xem điểm tích lũy, streak, bảng xếp hạng, đọc bài viết/tài liệu, gửi góp ý và đóng góp công thức. Admin có thể quản lý tài khoản, lớp/chương/bài học, câu hỏi, đề thi, tài liệu, bài viết, phản hồi và duyệt công thức.

## Công nghệ sử dụng

- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Backend: Rust, Axum, SQLx
- Database: MySQL
- Xác thực: JWT, bcrypt
- File upload: thư mục `backend/uploads`

## Yêu cầu trước khi cài đặt

Cần cài sẵn các phần mềm sau:

- Git
- Node.js 18 trở lên và npm
- Rust và Cargo
- MySQL Server

Kiểm tra nhanh:

```bash
node -v
npm -v
cargo --version
mysql --version
```

## 1. Tải source code

```bash
git clone https://github.com/11113y/Website-h-tr-h-c-t-p-thpt.git
cd Website-h-tr-h-c-t-p-thpt
```

Nếu bạn đang mở trực tiếp thư mục dự án đã tải sẵn thì chỉ cần mở terminal tại thư mục gốc của project.

## 2. Tạo database MySQL

Mở MySQL CLI, MySQL Workbench, DBeaver, HeidiSQL hoặc công cụ quản lý database bạn đang dùng, sau đó chạy:

```sql
CREATE DATABASE web_hoc_toan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Backend sẽ tự chạy các migration trong thư mục `backend/migrations` khi server khởi động, nên không cần tạo bảng thủ công.

## 3. Cấu hình backend

Vào thư mục backend:

```bash
cd backend
```

Tạo file `.env` trong thư mục `backend` với nội dung mẫu:

```env
DATABASE_URL=mysql://root:MAT_KHAU_MYSQL@localhost:3306/web_hoc_toan
JWT_SECRET=supersecretkeyforhimatestplatform2026
PORT=5002
FRONTEND_URL=http://localhost:5173
RUST_LOG=info
```

Nếu MySQL của bạn không có mật khẩu:

```env
DATABASE_URL=mysql://root@localhost:3306/web_hoc_toan
```

Nếu dùng user MySQL khác, thay `root`, mật khẩu và tên database cho đúng máy của bạn.

## 4. Nạp dữ liệu mẫu

Chạy lệnh sau trong thư mục `backend`:

```bash
cargo run --bin seed
```

Lệnh này sẽ:

- Chạy migration tạo bảng nếu database chưa có bảng.
- Tạo hoặc cập nhật tài khoản admin mặc định.
- Tạo một số tài khoản học sinh mẫu.
- Nạp dữ liệu mẫu cho lớp, chương, bài học, câu hỏi, đề thi, bài viết, tài liệu và công thức.

Lưu ý: seed sẽ xóa và nạp lại một số dữ liệu học tập/đề thi/bài viết/tài liệu mẫu, nên không nên chạy trên database đang chứa dữ liệu thật cần giữ.

## 5. Chạy backend

Trong thư mục `backend`, chạy:

```bash
cargo run --bin server
```

Backend chạy tại:

```text
http://localhost:5002
```

Kiểm tra backend:

```text
http://localhost:5002/health
```

Nếu trả về `status: ok` là backend đã chạy.

## 6. Cài và chạy frontend

Mở terminal mới, quay về thư mục gốc dự án rồi vào `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

Frontend đã cấu hình proxy trong `frontend/vite.config.js`, các request `/api` và `/uploads` sẽ tự chuyển sang backend `http://127.0.0.1:5002`.

## 7. Tài khoản mẫu

Sau khi chạy seed, có thể đăng nhập bằng tài khoản admin:

```text
Email: admin@mathpeak.edu.vn
Mật khẩu: admin123
```

Tài khoản học sinh mẫu được in ra trong terminal khi chạy seed. Mật khẩu mặc định:

```text
Mật khẩu học sinh: 123456
```

Ví dụ email học sinh thường có dạng:

```text
nguyenvananh123@mathpeak.edu.vn
```

Ngoài ra có thể tự tạo tài khoản mới tại:

```text
http://localhost:5173/register
```

## 8. Cách sử dụng app

### Với học sinh

Truy cập:

```text
http://localhost:5173
```

Các màn hình chính:

- `/learn`: xem chương trình học theo lớp 10, 11, 12.
- `/lessons/:lessonId`: xem chi tiết bài học.
- `/exams`: xem kho đề thi.
- `/exams/:examId`: làm bài thi.
- `/exams/:examId/result`: xem kết quả sau khi nộp bài.
- `/exams/:examId/explanations`: xem lời giải chi tiết.
- `/saved-questions`: xem câu hỏi đã lưu.
- `/collections`: xem bộ sưu tập câu hỏi.
- `/leaderboard`: xem bảng xếp hạng.
- `/formulas`: xem và đóng góp công thức.
- `/grapher`: dùng công cụ vẽ đồ thị.
- `/blog`: đọc bài viết và tài liệu.
- `/feedback`: gửi góp ý.
- `/profile`: xem hồ sơ, điểm tích lũy và streak.

### Với admin

Đăng nhập bằng tài khoản admin rồi truy cập:

```text
http://localhost:5173/admin
```

Admin có thể quản lý:

- Dashboard thống kê tổng quan.
- Người dùng học sinh và admin.
- Lớp, chương, bài học, học liệu.
- Câu hỏi và đề thi.
- Bài viết, tài liệu.
- Phản hồi/góp ý của học sinh.
- Công thức do học sinh đóng góp và duyệt điểm thưởng.
- Thiết lập hệ thống và hồ sơ admin.

## 9. Quên mật khẩu

Màn hình quên mật khẩu:

```text
http://localhost:5173/forgot-password
```

Ở chế độ demo, hệ thống chưa gửi email thật. Sau khi nhập email đã tồn tại, backend sẽ tạo link đặt lại mật khẩu và frontend hiển thị link demo để bấm vào trang:

```text
http://localhost:5173/reset-password?token=...
```

## 10. Build kiểm tra trước khi nộp

Build frontend:

```bash
cd frontend
npm run build
```

Build backend:

```bash
cd backend
cargo build --bin server
```

## 11. Lỗi thường gặp

### Backend báo thiếu `DATABASE_URL` hoặc `JWT_SECRET`

Kiểm tra lại file:

```text
backend/.env
```

Đảm bảo đã có `DATABASE_URL` và `JWT_SECRET`.

### Không kết nối được MySQL

Kiểm tra:

- MySQL Server đã bật chưa.
- Tên database có đúng là `web_hoc_toan` không.
- User, mật khẩu và port trong `DATABASE_URL` có đúng không.

### Frontend gọi API lỗi

Kiểm tra backend đang chạy ở:

```text
http://localhost:5002
```

Nếu đổi port backend, cần sửa lại proxy trong:

```text
frontend/vite.config.js
```

### Port đã bị chiếm

Backend mặc định dùng port `5002`, frontend mặc định dùng port `5173`. Nếu bị trùng port, hãy tắt tiến trình đang chạy hoặc đổi port tương ứng trong `.env` và cấu hình Vite.

## 12. Cấu trúc thư mục chính

```text
web-hoc-toan/
|-- backend/
|   |-- migrations/        # SQL migration tạo bảng
|   |-- src/               # Source Rust/Axum
|   |-- uploads/           # File upload
|   `-- Cargo.toml
|-- frontend/
|   |-- public/            # Asset tĩnh
|   |-- src/               # Source React
|   `-- package.json
|-- extract/               # Công cụ/tài liệu trích xuất đề
|-- erd_planuml.puml       # Sơ đồ ERD PlantUML
|-- usecase_*.puml         # Các sơ đồ use case
`-- README.md
```
