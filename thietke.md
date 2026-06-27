# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG WEBSITE HỌC TOÁN TRỰC QUAN THPT

---

## 1. GIỚI THIỆU ĐỀ TÀI & TẦM NHÌN SẢN PHẨM

Sản phẩm của đề tài là một website giới thiệu và trực quan hóa các khái niệm toán học trong chương trình THPT, giúp người học tiếp cận toán học theo cách trực quan và hấp dẫn hơn.

Website được thiết kế với mục tiêu khi người dùng truy cập có thể khám phá các chủ đề toán học thông qua công thức, đồ thị và các hình minh họa trực quan, từ đó cảm nhận được vẻ đẹp và tính logic của toán học.

### Các giá trị cốt lõi của sản phẩm:

1. **Trải nghiệm học tập trực quan:** Giao diện rõ ràng giúp người dùng dễ dàng khám phá các chủ đề toán học, tạo hứng thú học tập và thấu hiểu các khái niệm phức tạp qua hình ảnh, đồ thị động.
2. **Trình bày công thức toán học sắc nét:** Sử dụng ký pháp LaTeX giúp hiển thị các biểu thức toán học rõ ràng, giúp người học dễ hiểu, dễ đọc và dễ ghi nhớ.
3. **Trực quan hóa đồ thị & hình học:** Minh họa các khái niệm toán học thông qua đồ thị hàm số động, hình học trực quan và ví dụ sinh động, giúp kết nối công thức với thực tế trực quan.
4. **Khám phá vẻ đẹp của Toán học:** Một phân hệ chuyên biệt giới thiệu các ý tưởng, công thức nổi tiếng (như công thức Euler, dãy số Fibonacci, tỷ lệ vàng) giúp tạo cảm hứng và giúp người học nhận ra toán học không chỉ là các phép tính khô khan.

---

## 2. KỸ NĂNG VÀ KIẾN THỨC ĐẠT ĐƯỢC QUA ĐỀ TÀI

### 2.1 Kỹ năng đạt được

* **Kỹ năng phân tích và thiết kế hệ thống:**
  * Phân tích nhu cầu của đối tượng học sinh THPT cần một hệ thống trực quan, dễ tiếp cận.
  * Xác định các phân hệ chức năng: hệ thống bài học lý thuyết, công cụ render công thức LaTeX, vẽ đồ thị tương tác và làm bài tập trắc nghiệm tự động.
  * Thiết kế cấu trúc chương trình toán học THPT phân cấp (Khối lớp -> Chuyên đề -> Chương học -> Bài học).
  * Thiết kế kiến trúc tổng thể của hệ thống website (Frontend, Backend, Database).
  * Thiết kế cơ sở dữ liệu quan hệ tối ưu hóa cấu trúc dữ liệu để quản lý môn học, bài học, công thức và bài tập.
  * Lựa chọn công nghệ tối ưu: Rust cho Backend, PostgreSQL lưu trữ và KaTeX/JSXGraph cho trực quan hóa.
* **Kỹ năng lập trình:**
  * Lập trình Backend hiệu năng cao và an toàn bằng ngôn ngữ Rust.
  * Xây dựng và triển khai các API hiển thị bài học, công thức toán học, danh mục chuyên đề.
  * Kết nối CSDL PostgreSQL, truy xuất và xử lý dữ liệu để phản hồi cho giao diện Frontend.
* **Kỹ năng thiết kế cơ sở dữ liệu:**
  * Thiết kế các bảng dữ liệu cho hệ thống và xây dựng các quan hệ tối ưu (1-N, JSONB).
  * Thực hiện các thao tác CRUD (Create, Read, Update, Delete) và viết truy vấn SQL hiệu quả.
* **Kỹ năng phát triển giao diện web (Frontend):**
  * Thiết kế giao diện Glassmorphism / Dark Mode cao cấp giúp hiển thị nội dung toán học rõ ràng, dễ đọc.
  * Tích hợp render công thức LaTeX bằng KaTeX và tương tác vẽ đồ thị.
  * Tổ chức bố cục responsive giúp dễ dàng tìm kiếm và học tập trên mọi thiết bị.
* **Kỹ năng kiểm thử và hoàn thiện hệ thống:**
  * Thực hiện kiểm thử tích hợp và phát hiện, sửa lỗi logic nghiệp vụ.
  * Tối ưu hóa hiệu năng hệ thống và tốc độ tải trang trước khi hoàn thiện.

### 2.2 Kiến thức tích lũy

* **Kiến thức về phát triển hệ thống web:** Hiểu rõ quy trình phát triển từ giai đoạn đặc tả yêu cầu, thiết kế, lập trình đến kiểm thử và triển khai.
* **Kiến thức về lập trình backend bằng Rust:** Áp dụng Rust để xử lý HTTP request/response qua web framework (Axum), tổ chức API RESTful bảo mật bằng JWT.
* **Kiến thức về thiết kế cơ sở dữ liệu:** Nắm vững nguyên tắc chuẩn hóa dữ liệu, ứng dụng trường `JSONB` trong PostgreSQL để lưu trữ mảng dữ liệu động một cách hiệu quả.
* **Kiến thức về hiển thị nội dung toán học:** Hiểu cách biểu diễn ký pháp LaTeX trên trình duyệt, kết xuất đồ họa hàm số động và kết hợp lý thuyết với mô hình trực quan hóa.

---

## 3. PHÂN TÍCH CHUYÊN SÂU HAI NỀN TẢNG HỌC TOÁN TRỰC TUYẾN TẠI VIỆT NAM

Để tối ưu hóa trải nghiệm học tập và thiết kế hệ thống, chúng ta tiến hành khảo sát, phân tích chi tiết toàn diện cấu trúc chức năng, phương pháp giảng dạy và trải nghiệm người dùng của 2 nền tảng giáo dục trực tuyến lớn nhất Việt Nam hiện nay: **HOCMAI (hocmai.vn)** và **Tuyensinh247 (tuyensinh247.com)**.

---

### 3.1 Nền tảng HOCMAI (hocmai.vn)
* **Tổng quan:** Hệ thống giáo dục trực tuyến quy mô lớn nhất Việt Nam, hỗ trợ học sinh từ cấp Tiểu học đến ôn thi Đại học.
* **Lộ trình học tập & Luyện thi môn Toán:**
  * **Giải pháp luyện thi PEN:** Chia lộ trình ôn thi THPT Quốc gia làm 3 giai đoạn rõ ràng:
    * *PEN-C (Ôn luyện kiến thức toàn diện):* Hệ thống hóa toàn bộ kiến thức giáo khoa lớp 10, 11 và trọng tâm lớp 12 bằng video lý thuyết bài bản.
    * *PEN-I (Luyện đề chuyên sâu):* Cung cấp các đề thi thử chuẩn cấu trúc đề minh họa của Bộ GD&ĐT.
    * *PEN-M (Ôn tập cấp tốc):* Hệ thống các mẹo loại trừ phương án sai, mẹo bấm máy tính Casio.
  * **Chương trình HOCMAI Topclass (Chương trình GDPT mới 2018):** Lớp 10, 11, 12 bám sát các bộ SGK mới. Áp dụng quy trình khép kín 4 bước: **HỌC - HỎI - LUYỆN - KIỂM TRA**.
* **Tính năng kỹ thuật và tương tác cốt lõi:**
  * **Trình phát Video học tập nâng cao:** Giao diện xem video tích hợp công cụ thay đổi tốc độ phát (0.75x đến 2x), ghi chú trực tiếp mốc thời gian bài học (Video Bookmarking), và danh sách bài học/tài liệu PDF đính kèm hiển thị trực quan ngay cạnh video.
  * **Trợ lý học tập AI (IChat):** Tích hợp chatbot AI hỗ trợ 24/7 giải thích nhanh lý thuyết toán học cơ bản và gợi ý bài học.
  * **Cơ chế Hỏi đáp (Q&A Forum):** Box bình luận dưới bài giảng cho phép gửi câu hỏi kèm hình ảnh. Đội ngũ Mentor (các sinh viên xuất sắc) trả lời hướng dẫn giải bài trong vòng 30 phút.
  * **Phòng thi thử & Đánh giá năng lực:** Luyện đề thi Tốt nghiệp THPT, kỳ thi Đánh giá năng lực (HSA, APT) và Đánh giá tư duy (TSA).
* **Ưu điểm:** Lộ trình bài bản, giảng viên uy tín, tích hợp AI hỗ trợ học tập đắc lực.
* **Nhược điểm:** Tính trực quan động (Interactive visual tools) còn hạn chế, chủ yếu học một chiều qua video tĩnh.
* **Ứng dụng vào dự án:**
  * Thiết lập cấu trúc nội dung phân cấp rõ ràng: `Lớp học -> Chuyên đề -> Chương học -> Bài học`.
  * Xây dựng hệ thống làm bài kiểm tra tự động chấm điểm và đếm ngược thời gian làm bài.

---

### 3.2 Nền tảng Tuyensinh247.com
* **Tổng quan:** Nền tảng luyện thi trực tuyến vô cùng phổ biến với học sinh THPT nhờ kho đề thi khổng lồ và tốc độ hỗ trợ giải đáp nhanh.
* **Lộ trình học tập & Luyện thi môn Toán:**
  * **Lộ trình SUN:** Chia quá trình ôn luyện làm 3 bước:
    * *SUN 1 (Nền tảng):* Học sinh nắm vững lý thuyết và các dạng bài tập sách giáo khoa cơ bản.
    * *SUN 2 (Chuyên sâu):* Đi sâu vào các chuyên đề điểm 8, 9, 10 và các phương pháp giải nhanh trắc nghiệm bằng máy tính cầm tay (Casio).
    * *SUN 3 (Luyện đề):* Luyện đề thi thử bám sát đề thi chính thức.
  * **Mô hình học tập kết hợp:** Kết hợp bài giảng ghi hình sẵn chất lượng cao với các buổi học **Livestream tương tác trực tiếp** cùng giáo viên và thủ khoa.
* **Tính năng kỹ thuật và tương tác cốt lõi:**
  * **Phòng thi thử Online mô phỏng thực tế:** Giao diện thi trắc nghiệm Toán bám sát trải nghiệm thi thật với bảng điều hướng câu hỏi trực quan và đồng hồ đếm ngược chính xác giây.
  * **Lời giải chi tiết tách biệt từng câu (Video & Text):** Sau khi nộp bài, hệ thống hiển thị đáp án:
    * *Lời giải Text:* Viết chi tiết các bước biến đổi công thức toán học sắc nét hỗ trợ LaTeX.
    * *Lời giải Video ngắn (1 - 5 phút):* Mỗi câu hỏi khó đều có video ngắn giải chi tiết riêng biệt do giáo viên chữa riêng cho câu đó.
  * **Hỏi đáp chuyên môn siêu tốc:** Cam kết giải đáp thắc mắc chuyên môn dưới mỗi câu hỏi của đề thi online trong vòng 10 - 30 phút. Liên kết chặt chẽ với **Hoidap247.com** để chụp ảnh bài tập toán học nhận giải đáp nhanh.
* **Ưu điểm:** Ngân hàng đề thi cực kỳ phong phú và cập nhật liên tục; lời giải chi tiết chất lượng cao (cả chữ LaTeX và video ngắn cho từng câu); hỗ trợ hỏi đáp nhanh chóng.
* **Nhược điểm:** Tập trung chủ yếu vào luyện đề thi và mẹo làm bài nhanh, thiếu các mô hình trực quan tương tác sinh động để học sinh hiểu bản chất công thức.
* **Ứng dụng vào dự án:**
  * Hiển thị lời giải chi tiết của từng câu hỏi bằng LaTeX.
  * Thống kê học lực để chỉ ra điểm mạnh, điểm yếu theo từng chương học dựa trên lịch sử giải đề, từ đó đề xuất nội dung lý thuyết ôn tập phù hợp.

---

## 4. DANH SÁCH CHỨC NĂNG & LOGIC NGHIỆP VỤ HỆ THỐNG

### 4.1 Phân hệ dành cho Học sinh

#### 4.1.1 Đăng ký / Đăng nhập

* **Chức năng:** Học sinh đăng ký tài khoản mới bằng Email/Username và đăng nhập để lưu trữ tiến trình học tập, tích lũy điểm thưởng và theo dõi Streak.
* **Logic nghiệp vụ:** Hệ thống nhận thông tin đăng ký, băm mật khẩu bảo mật và lưu vào bảng `users`. Mặc định quyền `role` là `'student'`, `points = 0`, `streak_count = 0`. Khi đăng nhập thành công, hệ thống cấp JWT Token cho phiên làm việc.

#### 4.1.2 Theo dõi Streak học tập

* **Chức năng:** Ghi nhận và hiển thị chuỗi ngày học tập liên tục để khuyến khích học sinh duy trì thói quen học bài.
* **Logic nghiệp vụ:** Mỗi khi học sinh nhấn "Hoàn thành bài học" hoặc nộp bài kiểm tra, hệ thống so sánh ngày hoạt động hiện tại với `last_active_at`:
  * Nếu là ngày hôm sau liên tiếp: `streak_count` tăng thêm 1.
  * Nếu là cùng ngày: Giữ nguyên.
  * Nếu khoảng cách > 1 ngày: Reset `streak_count` về 1.

#### 4.1.3 Trang cá nhân & Thống kê học lực

* **Chức năng:** Hiển thị thông tin cá nhân, điểm tích lũy, các bài học đã xong và phân tích điểm mạnh/điểm yếu học lực.
* **Logic nghiệp vụ:** Hệ thống truy xuất lịch sử thi trong bảng `user_exam_results`. Gom nhóm các câu hỏi đã làm theo từng chương học (`chapter_id`). Nếu tỷ lệ làm đúng ở một chương < 50%, xếp chương đó vào mục "Kiến thức yếu - Cần ôn tập" và đề xuất các bài học tương ứng trong chương. Nếu tỷ lệ đúng > 80%, xếp vào "Kiến thức mạnh".

#### 4.1.4 Học theo chuyên đề & Khối lớp (VIP)

* **Chức năng:** Lọc nội dung theo Lớp 10, 11, 12 và Chuyên đề. Học lý thuyết hỗ trợ LaTeX. Mở khóa bài học VIP bằng điểm tích lũy.
* **Logic nghiệp vụ:** Đối với bài học VIP (`is_vip = TRUE`): Hệ thống kiểm tra xem ID bài học có nằm trong trường `unlocked_lessons` của học sinh hay không. Nếu chưa, học sinh nhấn "Mở khóa bài học". Nếu `users.points` >= `lessons.points_required`, hệ thống trừ số điểm tương ứng và thêm bài học vào danh sách `unlocked_lessons`.

#### 4.1.5 Làm bài kiểm tra & Luyện tập

* **Chức năng:** Làm trắc nghiệm và điền số tự động chấm điểm, giới hạn thời gian làm bài, cộng điểm thưởng và xem lời giải chi tiết.
* **Logic nghiệp vụ:** Hệ thống tải câu hỏi từ đề kiểm tra dựa trên trường `question_ids`. Khi nộp bài hoặc hết giờ, hệ thống so khớp đáp án, tính toán điểm số (thang điểm 10). Nếu đạt yêu cầu, cộng điểm thưởng (`exams.points_rewarded`) vào `users.points` và lưu lịch sử chi tiết vào `user_exam_results`.

#### 4.1.6 Bộ sưu tập câu hỏi khó

* **Chức năng:** Lưu trữ các câu hỏi khó để ôn tập lại một cách dễ dàng.
* **Logic nghiệp vụ:** Học sinh tạo bộ sưu tập (lưu vào bảng `collections`). Khi làm bài kiểm tra hoặc xem lại lời giải, học sinh click "Lưu câu hỏi" để thêm UUID của câu hỏi vào trường `question_ids` của bộ sưu tập.

#### 4.1.7 Tải tài liệu học tập (VIP)

* **Chức năng:** Tìm kiếm và tải tài liệu PDF/Word học tập. Mở khóa tài liệu VIP bằng điểm tích lũy.
* **Logic nghiệp vụ:** Đối với tài liệu VIP (`is_vip = TRUE`), hệ thống kiểm tra mảng `unlocked_documents` trong bảng `users`. Nếu chưa có, học sinh dùng điểm để đổi. Nếu đủ điểm, hệ thống trừ điểm và thêm UUID tài liệu vào mảng mở khóa của học sinh, đồng thời tăng lượt tải `download_count` thêm 1.

#### 4.1.8 z

---

### 4.2 Phân hệ dành cho Quản trị viên (Admin)

#### 4.2.1 Quản lý Bài học & Chuyên đề (CRUD)

* **Chức năng:** Thêm, sửa, xóa môn học, chuyên đề, chương học và bài học. Sắp xếp thứ tự hiển thị của bài học.
* **Logic nghiệp vụ:** Thay đổi trực tiếp các bảng `subjects`, `chapters` và `lessons` thông qua các API quản trị an toàn (yêu cầu quyền Admin trong JWT).

#### 4.2.2 Quản lý Ngân hàng câu hỏi & Đề kiểm tra (CRUD)

* **Chức năng:** Quản lý ngân hàng câu hỏi độc lập (thiết lập độ khó, đáp án nhiễu, lời giải) và tạo đề thi bằng cách nhúng các UUID câu hỏi vào đề thi.
* **Logic nghiệp vụ:** Thay đổi các bảng `questions` và `exams`. Trường `question_ids` trong `exams` được lưu trữ dưới dạng mảng JSON chứa các UUID của câu hỏi được chọn.

#### 4.2.3 Soạn thảo công thức toán học với LaTeX

* **Chức năng:** Soạn bài học và câu hỏi hỗ trợ các ký pháp công thức toán học chuyên nghiệp bằng LaTeX.
* **Logic nghiệp vụ:** Lưu trữ nội dung chứa LaTeX dạng `$$...$$` hoặc `$...$` vào cơ sở dữ liệu. Phía máy khách sử dụng KaTeX để biên dịch và render tự động ra đồ họa toán học đẹp mắt.

#### 4.2.4 Quản lý Tài liệu & Bài viết (CRUD)

* **Chức năng:** Đăng tải tài liệu học tập, gán thuộc tính VIP và số điểm đổi tương ứng; soạn thảo bài viết tin tức/chương trình toán.
* **Logic nghiệp vụ:** Cập nhật dữ liệu trực tiếp vào các bảng `documents` và `articles`.

#### 4.2.5 Xem báo cáo phân tích học lực hệ thống

* **Chức năng:** Thống kê kết quả kiểm tra của toàn bộ học sinh trên hệ thống giúp ban quản lý đánh giá hiệu quả dạy và học.
* **Logic nghiệp vụ:** Tính toán điểm thi trung bình từ bảng `user_exam_results`, phân loại học sinh thành các nhóm Giỏi, Khá, Trung bình, Yếu và hiển thị dưới dạng biểu đồ trực quan phía Admin Dashboard.

#### 4.2.6 Quản lý & xử lý đóng góp của học sinh

* **Chức năng:** Xem danh sách, lọc ý kiến đóng góp từ học sinh, tiến hành sửa đổi hệ thống và phản hồi ghi chú.
* **Logic nghiệp vụ:** Admin truy cập danh sách từ bảng `feedbacks`, cập nhật nội dung giải quyết vào cột `admin_notes` và thay đổi trạng thái xử lý sang `reviewed` hoặc `resolved`.

---

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU

Cơ sở dữ liệu của hệ thống được tinh giản từ 22 bảng xuống còn **11 bảng cốt lõi** bằng cách ứng dụng định dạng dữ liệu động `JSONB` trong PostgreSQL để chứa các mối quan hệ liên kết động.

Chi tiết về lược đồ thiết kế các bảng cơ sở dữ liệu và ràng buộc toàn vẹn được định nghĩa đầy đủ tại tệp tin:

* [schema.sql](file:///Users/vuphap/Tasks/web-hoc-toan/schema.sql) (Tệp tin mã nguồn SQL khởi tạo dữ liệu).
* [schema.dbml](file:///Users/vuphap/Tasks/web-hoc-toan/schema.dbml) (Tệp tin lược đồ biểu đồ trực quan DBML).

### Danh sách 11 bảng dữ liệu tinh gọn:

1. **`users`**: Người dùng & Tiến trình học tập (Streak, completed_lessons, unlocked_lessons, unlocked_documents).
2. **`subjects`**: Chuyên đề học tập phân loại theo khối lớp.
3. **`chapters`**: Chương học trực thuộc các chuyên đề.
4. **`lessons`**: Bài học lý thuyết (hỗ trợ VIP và điểm mở khóa).
5. **`questions`**: Ngân hàng câu hỏi trắc nghiệm/điền số (chứa options dưới dạng mảng JSONB).
6. **`exams`**: Đề thi & bài kiểm tra trắc nghiệm (lưu mảng `question_ids` dưới dạng JSONB).
7. **`user_exam_results`**: Kết quả làm bài và chi tiết các phương án đã chọn của học sinh.
8. **`collections`**: Bộ sưu tập các câu hỏi khó do học sinh tự tạo và phân loại.
9. **`documents`**: Tài liệu học tập tải về (hỗ trợ VIP và cấu hình điểm tích lũy yêu cầu).
10. **`articles`**: Bài viết tin tức toán học và chia sẻ phương pháp học tập của Giáo viên/Admin.
11. **`feedbacks`**: Đóng góp ý kiến và báo cáo lỗi học liệu từ học sinh gửi đến Admin.

---

## 6. DANH SÁCH USE CASE & CÁC SƠ ĐỒ THIẾT KẾ CƠ BẢN

Để phục vụ việc thiết kế và lập trình, hệ thống được biểu diễn qua các sơ đồ UML và sơ đồ luồng được lưu dưới dạng Draw.io XML (`.drawio`) để người dùng có thể mở trực tiếp trên công cụ Draw.io:

* **Sơ đồ Use Case tổng thể hợp nhất:** [uc_tong_the.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/uc_tong_the.drawio)
  Biểu diễn mạch lạc, đúng chuẩn ký hiệu UML với ranh giới hệ thống (System Boundary), các tác nhân chính (Học sinh, Quản trị viên) và các ca sử dụng cốt lõi quan trọng nhất của hệ thống.
* **Sơ đồ Luồng nghiệp vụ 1 (Core Study & Exam Flows):** [sequence_diagrams.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/sequence_diagrams.drawio)
  Mô tả chi tiết luồng nghiệp vụ Học chuyên đề & Mở khóa VIP và Làm bài kiểm tra & Nhận điểm thưởng qua các tab riêng biệt.
* **Sơ đồ Luồng nghiệp vụ 2 (Password Reset via OTP):** [password_recovery.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/password_recovery.drawio)
  Mô tả chi tiết quy trình khôi phục mật khẩu qua xác thực mã OTP gửi về Email.
* **Sơ đồ Luồng nghiệp vụ 3 (LaTeX Feedback & Leaderboard):** [feedback_leaderboard.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/feedback_leaderboard.drawio)
  Mô tả quy trình gửi báo lỗi công thức LaTeX/mô phỏng, phê duyệt cộng điểm thưởng và đua top bảng xếp hạng.
* **Sơ đồ Luồng dữ liệu (Data Flow Diagrams):** [dfd_level1.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/dfd_level1.drawio)
  Mô tả luồng dữ liệu ở mức ngữ cảnh (DFD Level 0) và chi tiết chức năng hệ thống (DFD Level 1) qua các tab riêng biệt.
* **Sơ đồ Lớp (UML Class Diagram):** [class_diagram.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/class_diagram.drawio)
  Biểu diễn cấu trúc tĩnh của các thực thể/lớp dữ liệu cốt lõi và mối quan hệ logic giữa chúng (Association, Composition).
* **Sơ đồ quan hệ thực thể (ERD Database):** [erd_database.drawio](file:///Users/vuphap/Tasks/web-hoc-toan/erd_database.drawio)
  Biểu diễn sơ đồ thực thể cơ sở dữ liệu với 11 bảng dữ liệu tinh gọn và các liên kết khóa ngoại.

---
