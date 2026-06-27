# Hướng Dẫn Khởi Chạy Dự Án (Cho Máy Mới)

Tài liệu này hướng dẫn chi tiết cách thiết lập cơ sở dữ liệu, chạy phần Backend (Rust/Axum) và Frontend (React/Vite) trên một máy tính mới hoàn toàn sau khi giải nén.

---

## 🛠️ Yêu Cầu Hệ Thống (Prerequisites)
Trước khi bắt đầu, hãy chắc chắn máy tính của bạn đã cài đặt sẵn các công cụ sau:
1. **Node.js** (Phiên bản khuyến nghị: v18 hoặc mới hơn) và trình quản lý gói **npm**.
2. **Rust & Cargo** (Bộ biên dịch Rust): Cài đặt thông qua [rustup](https://rustup.rs/).
3. **MySQL Server**: Chạy tại cổng mặc định `3306`.

---

## 🗄️ 1. Cấu Hình Cơ Sở Dữ Liệu (MySQL)

1. Mở công cụ quản lý cơ sở dữ liệu của bạn (MySQL CLI, TablePlus, DBeaver, HeidiSQL, v.v.).
2. Tạo một database mới có tên là `web_hoc_toan` bằng câu lệnh SQL sau:
   ```sql
   CREATE DATABASE web_hoc_toan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

## 🦀 2. Cấu Hình và Khởi Chạy Backend (Rust)

### Bước 2.1: Tạo file cấu hình môi trường `.env`
Di chuyển vào thư mục `backend` và tạo một file mới tên là `.env` (hoặc sửa nếu đã có sẵn). 
Nội dung file `.env` mẫu như sau:

```env
# URL kết nối tới MySQL Database của bạn (Thay MAT_KHAU_CUA_BAN bằng mật khẩu MySQL)
DATABASE_URL=mysql://root:MAT_KHAU_CUA_BAN@localhost:3306/web_hoc_toan

# Cấu hình JWT, Cổng chạy và Logs
JWT_SECRET=supersecretkeyforhimatestplatform2026
PORT=5002
FRONTEND_URL=http://localhost:5173
RUST_LOG=info
```
*Lưu ý: Nếu MySQL của bạn không đặt mật khẩu, hãy viết: `DATABASE_URL=mysql://root@localhost:3306/web_hoc_toan`.*

### Bước 2.2: Tạo bảng tự động (Database Migrations)
Hệ thống được thiết kế để tự động quét thư mục `migrations` và khởi tạo toàn bộ các bảng trong cơ sở dữ liệu ngay khi chạy server. Bạn **không cần phải chạy lệnh SQL tạo bảng thủ công**.

### Bước 2.3: Nạp dữ liệu mẫu & Tạo tài khoản mặc định (Seeding)
Trong lần đầu tiên cài đặt dự án, bạn cần nạp dữ liệu mẫu (các lớp học, chương học, bài học, đề thi thử, và tài khoản quản trị viên) bằng lệnh:
```bash
cd backend
cargo run --bin seed
```
*Lệnh này sẽ xóa sạch dữ liệu cũ (nếu có) và tạo mới bộ dữ liệu thử nghiệm chuẩn.*

### Bước 2.4: Chạy Server Backend
Khi đã nạp xong dữ liệu, chạy lệnh sau để khởi động Backend:
```bash
cargo run --bin server
```
Server Backend sẽ khởi chạy thành công tại địa chỉ: **`http://localhost:5002`**.

---

## ⚛️ 3. Cấu Hình và Khởi Chạy Frontend (React/Vite)

### Bước 3.1: Cài đặt các thư viện phụ thuộc (Dependencies)
Mở một tab Terminal mới (giữ nguyên Terminal chạy Backend ở trên), di chuyển vào thư mục `frontend` và tiến hành cài đặt:
```bash
cd frontend
npm install
```

### Bước 3.2: Chạy Frontend ở chế độ phát triển
Sau khi cài đặt xong thư viện, khởi chạy môi trường phát triển:
```bash
npm run dev
```
Giao diện Web Học Toán sẽ chạy và tự động mở tại địa chỉ: **`http://localhost:5173`**.

---

## 🔑 Tài Khoản Đăng Nhập Mặc Định (Sau khi nạp dữ liệu mẫu)

Sau khi bạn đã hoàn thành lệnh `cargo run --bin seed` ở Bước 2.3, hệ thống sẽ có các tài khoản mặc định sau:

### 1. Tài khoản Quản trị viên (Admin)
* **Email:** `admin@mathpeak.edu.vn`
* **Mật khẩu:** `admin123`
*(Tài khoản này có quyền truy cập vào trang Quản trị hệ thống `/admin` để quản lý học sinh, lớp, bài học, tài liệu và tạo đề thi).*

### 2. Tài khoản Học sinh mẫu (Student)
* **Tên đăng nhập mẫu:** `nguyenvananh101` hoặc bất kỳ tên nào được in ra ở màn hình terminal khi chạy seed.
* **Email mẫu:** `nguyenvananh101@mathpeak.edu.vn`
* **Mật khẩu:** `123456`
