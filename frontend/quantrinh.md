# NHẬT KÝ TIẾN ĐỘ DỰ ÁN: QUIZZ TEST MATH PEAK
> **Mục đích:** Lưu trữ toàn bộ quá trình thiết kế, cấu trúc mã nguồn, hệ thống giao diện và các tương tác nâng cao đã phát triển trong phiên làm việc này để AI ở các phiên tiếp theo có thể đọc và nắm bắt dự án ngay lập tức (tiết kiệm token tối đa).

---

## 📌 1. THÔNG TIN CHUNG & PROJECT ID
* **Tên dự án:** Quizz Test Math Peak (Ứng dụng ôn luyện Toán THPT Quốc Gia cao cấp)
* **Project ID (Stitch):** `9930450047666123912`
* **Ngôn ngữ & Công nghệ:** React (Vite) + Vanilla CSS (Aesthetic Premium Glassmorphism & Micro-animations)
* **Linh vật (Mascot):** Bánh Mì, Cheese Cube & Teal Cube (3D Feel SVGs)

---

## 📁 2. CẤU TRÚC WORKSPACE & THƯ MỤC
Toàn bộ mã nguồn đã được gom và đồng nhất vào **một thư mục duy nhất**:
```text
/Users/vuphap/Hima test/frontend/
├── package.json         <- Chứa các thư viện (lucide-react, react v19, vite v8)
├── vite.config.js       <- Cấu hình Vite dev server
├── index.html           <- Điểm neo HTML chính, nạp Google Fonts 'Outfit'
├── quantrinh.md         <- File nhật ký tiến độ dự án (chính là file này)
└── src/
    ├── main.jsx         <- Khởi tạo React
    ├── App.jsx          <- File logic ứng dụng chính (chứa toàn bộ màn hình, trạng thái, mascots)
    ├── index.css        <- Toàn bộ Design System (tokens, class premium, keyframes, scrollbar)
    └── App.css          <- Style bổ sung
```
* **Lệnh khởi động Server Dev:** `npm run dev` (chạy trên cổng `http://localhost:5173/`)
* **Lệnh xác thực bản build:** `npm run build` (Biên dịch thành công 100% không cảnh báo lỗi, thời gian build siêu tốc `227ms`).

---

## 🎨 3. HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM) IN `index.css`
* **Màu sắc chủ đạo (Brand Theme):**
  * `Primary Color` (Cam san hô hoàng hôn): `#ff7d54` (`--primary`)
  * `Secondary Color` (Xanh ngọc lục bảo rừng): `#006b58` (`--secondary`)
  * `Background` (Kem sữa nhạt ấm): `#fff8f6` (`--background`)
  * `Text Primary` (Nâu đen đậm): `#241916`
* **Typography:** Font chữ **'Outfit'** từ Google Fonts (mang tính hiện đại, mềm mại nhưng vững chắc).
* **Các Class Giao diện Premium:**
  * `.card-premium`: Bo góc cực lớn (`32px`), viền nổi tactility nhẹ, hiệu ứng di chuột bay lên (`translate-y[-6px]`) kèm đổ bóng sâu.
  * `.btn-premium`: Nút bấm vật lý 3D, hiệu ứng quét bóng sáng (`shine swipe`), lún xuống nhẹ khi bấm (`:active`).
  * `.btn-secondary-premium`: Nút phụ tinh tế viền nổi.

---

## 💻 4. CÁC MÀN HÌNH ĐÃ HOÀN THIỆN TRONG `App.jsx`
Giao diện được liên kết chặt chẽ qua thanh Menu điều hướng mượt mà, bao gồm:

### Màn hình 1: Bàn Học (Home Dashboard)
* Banner chào mừng hoàng hôn rực rỡ dạng Gradient mượt, tích hợp **Hình ảnh Mascot 3D Claymorphic cực đẹp nhập từ Stitch** (hình ảnh linh vật Teal Cube leo núi tri thức, nền hoàng hôn ấm áp có các ký tự toán học bay quanh).
* Các thẻ thống kê tiến độ: Streak học tập (7 ngày liên tiếp), Rank hiện tại (Himalaya Badge), Tổng điểm đạt được.
* Danh sách đề thi đề xuất cùng thẻ Mascots tương tác sinh động.

### Màn hình 2: Lộ Trình Leo Núi (Roadmap View)
* Con đường leo đỉnh núi Everest cao `8,848m` chia thành 5 trạm địa hình (Base Camp, Thung lũng Đại số, Thách thức Hình học, Vách đá Giải tích, Đỉnh Peak).
* Các trạm có trạng thái động: Đã hoàn thành (Green Check), Mục tiêu hiện tại (Nút Play lấp lánh), Bị khóa (Icon Lock xám).

### Màn hình 3: Phòng Luyện Thi Mới (Practice Exam Room)
* *Khớp chính xác với bản cập nhật Stitch màn hình `c57e70872fe84d14a741f16f73c79552` ("Phòng luyện tập - Danh sách câu hỏi tập trung")*:
  1. **Exam Header (Cố định phía trên):** Hiển thị thông tin thí sinh `Vũ Quốc Pháp` (SBD: `01202688`), bộ đếm giờ điện tử thực tế từ `49:33` đếm ngược liên tục từng giây, nút "Lưu" và nút "Nộp bài".
  2. **Dải định tuyến 40 câu hỏi (Question Navigation Strip):** 
     * Hàng ngang 40 nút tròn câu hỏi.
     * Trạng thái động: Xanh lục bảo (đã chọn đáp án), Cam viền sáng (đang làm/active), Trắng (chưa làm).
     * Bấm vào nút `1` - `4` sẽ cuộn trang mượt mà đến đúng thẻ câu hỏi đó.
  3. **Danh sách câu hỏi tập trung dạng cuộn dọc:**
     * **Câu 3 (Bảng Biến Thiên):** Tích hợp ảnh Bảng biến thiên thực tế từ Stitch CDN, lưới tùy chọn A, B, C, D mượt mà.
     * **Câu 4 (Cực trị):** Câu hỏi tính giá trị lớn nhất của $f(x) = x^3 - 3x + 2$ trên $[0; 2]$.
     * **Nút "Xóa lựa chọn":** Cho phép thí sinh xóa đáp án đã tích để chọn lại từ đầu.
  4. **Linh vật Cổ động viên leo núi:** `TealCubeMascot` đặt ở Sidebar cố định, tự động thay đổi cử chỉ (vẫy tay, cười mừng) và đưa ra lời khuyên toán học/cổ vũ thực tế dựa trên tiến trình làm bài của thí sinh.

### Màn hình 4: Kết Quả & Xem Lại Lời Giải (Quiz Result)
* Hiển thị hiệu ứng pháo hoa giấy bay rơi (`confetti-fall`) ăn mừng vượt ải.
* Thống kê trực quan số điểm tích lũy, số câu đúng và thời gian làm bài.
* Danh sách xem lại đáp án chi tiết an toàn (xử lý hoàn hảo trường hợp thí sinh bỏ trống đáp án).
* Nhúng trực tiếp hộp thoại **"Lời giải chi tiết từ Mr. Peak"** cho tất cả các câu hỏi để người học ôn tập tối đa.

### Màn hình 5: Blog & Tài Liệu
* Nơi tổng hợp các bí kíp toán học mở rộng (học công thức lượng giác bằng thơ, phân tích ma trận đề thi THPT...).

---

## 🎨 5. CẬP NHẬT GIAO DIỆN PREMIUM HƠN & ĐỒNG BỘ 100% STITCH (MỚI NHẤT)
Trong phiên làm việc này, giao diện đã được nâng cấp toàn diện để giải quyết triệt để tình trạng chật chội và đồng bộ **100% hoàn hảo** với bản thiết kế Stitch UI:

1. **Header đỉnh cao 100% Stitch:**
   * **Bên trái:** Tích hợp nút Hamburger Menu cùng biểu tượng Logo ngọn núi dạng SVG nhiều lớp màu sắc bắt mắt (xanh ngọc lục bảo rừng và cam hoàng hôn), thương hiệu **Quizz Test** (`font-black` nâu trầm ấm `#8c3315`) và phụ đề chính xác *"Hệ thống ôn luyện và thi thử THPT Quốc gia"* sắc nét.
   * **Ở giữa:** Thanh tìm kiếm dạng viên thuốc (Pill shape) màu nền ấm `#f6f3f2` bo tròn quyến rũ, kèm icon trợ giúp và chữ gợi ý *"Tìm kiếm đề thi, môn học..."*.
   * **Bên phải:** Chuông thông báo lấp lánh kèm chấm đỏ trạng thái và **Pill Avatar Vũ Quốc Pháp**: Một khối nút sang trọng với Avatar tròn dạng Gradient màu cam đất có ký tự viết tắt **VP**, hiển thị họ tên học sinh và vai trò của họ.
2. **Thanh Điều hướng phụ (Sub-header Tab Bar):**
   * Đưa các tab điều hướng (`Bàn Học`, `Lộ Trình Leo Núi`, `Blog & Tài Liệu`, `Himalaya Rank`) xuống thanh sub-header phụ nền dịu mắt `#fbf1ee/45`. Nút bấm active được đổ bóng nổi và hiển thị trực quan các chỉ số Streak `🔥 7 ngày liên tiếp` và Điểm số `🎯 3850 điểm` để giữ ngọn lửa học tập của học sinh.
3. **Footer đồng bộ 100%:**
   * Thay thế footer 3 cột cũ bằng giao diện mới 100% Stitch: Nền hồng nâu đất ấm `#fbf1ee`, bên trái là logo bản quyền `"Quizz Test. Master the Peak."`, ở giữa là các liên kết ngang (`About Us`, `Curriculum`, `Privacy Policy`, `Contact Support`) tinh tế, bên phải là 2 nút tròn viền mỏng chứa icon Tài liệu và Khám phá cực chất.
4. **Cải thiện độ giãn cách (Spacing) & Khắc phục Đè lấp (Overlap):**
   * Tăng khoảng cách các phần của Dashboard lên `space-y-12`, giúp các khối thẻ Mascot, Bảng thống kê tiến độ học tập và Câu hỏi thi được "thở" tự nhiên, tạo cảm giác vô cùng phóng khoáng, thoáng đãng và chuẩn Premium.
   * **Sửa lỗi đè lấp (Overlap Fix):** Tăng padding-top của container `<main>` từ `py-8` lên `pt-12 pb-16` (thêm ~48px padding). Điều này khắc phục triệt để việc các tiêu đề lớn của Welcome Banner bị đè lấp dưới thanh Sub-header dính (sticky top bar), giúp hiển thị trọn vẹn 100% dòng chữ chào mừng học sinh, nhãn mùa thi 2026 và Mascot cực đẹp mà không bị mất góc hay che lấp bất kỳ chữ nào.

5. **Khôi phục cấu trúc Đơn tệp (Single-file Codebase Recovery):**
   * **Sự cố tách file:** Người dùng đã cố gắng tách cấu trúc dự án thành các file riêng lẻ (`LoginPage.jsx`, `HomePage.jsx`, v.v.) dẫn đến mất mát dữ liệu và lỗi hiển thị.
   * **Khôi phục:** Sử dụng tệp sao lưu an toàn `App.backup.jsx` (1770 dòng mã nguồn gốc) để khôi phục hoàn chỉnh lại tệp `src/App.jsx`. Quá trình khôi phục hoàn tất 100%, bảo lưu nguyên vẹn các cải tiến CSS trong `index.css` (như Material Symbols và Chrome Auto-Fill styling) và đạt trạng thái biên dịch thành công hoàn hảo (`npm run build` trong 304ms).

---

## 🚀 6. HƯỚNG PHÁT TRIỂN TIẾP THEO (NEXT STEPS)
1. **Import Đề từ Excel:** Tích hợp logic xử lý file Excel câu hỏi từ backend để tự động sinh danh sách 40 câu hỏi đa dạng (thay vì 4 câu mẫu hiện tại).
2. **Mock Đăng Nhập & Hồ Sơ:** Hoàn thiện giao diện trang cá nhân (Profile) với biểu đồ hình cột thể hiện tiến độ leo núi qua các ngày.
3. **Âm thanh và Hiệu ứng Tích Hợp:** Bổ sung âm thanh chúc mừng nhẹ khi trả lời đúng hoặc khi nộp bài thành công để tăng tính trò chơi hóa (Gamification).
