use dotenvy::dotenv;
use sqlx::MySqlPool;
use std::env;
use uuid::Uuid;
use bcrypt::{hash, DEFAULT_COST};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct QuestionOption {
    id: String,
    question_id: String,
    key: String,
    option_text: String,
    is_correct: bool,
    option_value: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "mysql://root@localhost:3306/web_hoc_toan".to_string());
        
    println!("Connecting to database: {}", database_url);
    let pool = MySqlPool::connect(&database_url).await?;
    
    println!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;
    
    let hos = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng"];
    let tens_lot = ["Văn", "Thị", "Minh", "Đức", "Hữu"];
    let tens = ["Anh", "Huy", "Nam", "Khánh", "Linh"];

    let hos_ascii = ["nguyen", "tran", "le", "pham", "hoang"];
    let tens_lot_ascii = ["van", "thi", "minh", "duc", "huu"];
    let tens_ascii = ["anh", "huy", "nam", "khanh", "linh"];

    let mut lcg_state = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    let mut rand_num = || {
        lcg_state = lcg_state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        lcg_state
    };

    println!("Hashing default passwords...");
    let admin_pwd_hash = hash("admin123", DEFAULT_COST)?;
    let student_pwd_hash = hash("123456", DEFAULT_COST)?;
    
    // 1. Tạo hoặc cập nhật tài khoản admin mặc định cố định
    let admin_username = "admin";
    let admin_email = "admin@mathpeak.edu.vn";
    let admin_exists: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?"
    )
    .bind(admin_username)
    .bind(admin_email)
    .fetch_one(&pool)
    .await?;

    let empty_json = sqlx::types::Json(Vec::<String>::new());

    if admin_exists.0 == 0 {
        let admin_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO users (id, username, email, password_hash, role, points, streak_count, last_active_at, completed_lessons, unlocked_lessons, unlocked_documents, completed_materials, created_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&admin_id)
        .bind(admin_username)
        .bind(admin_email)
        .bind(&admin_pwd_hash)
        .bind("admin")
        .bind(1000)
        .bind(10)
        .bind(chrono::Utc::now().naive_utc())
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(chrono::Utc::now().naive_utc())
        .execute(&pool)
        .await?;
        println!("Inserted default admin: {} ({}) with password 'admin123'", admin_username, admin_email);
    } else {
        sqlx::query(
            "UPDATE users SET password_hash = ?, role = 'admin' WHERE username = ? OR email = ?"
        )
        .bind(&admin_pwd_hash)
        .bind(admin_username)
        .bind(admin_email)
        .execute(&pool)
        .await?;
        println!("Updated default admin password to 'admin123'");
    }

    let admin_id: String = sqlx::query_scalar(
        "SELECT id FROM users WHERE username = ?"
    )
    .bind(admin_username)
    .fetch_one(&pool)
    .await?;

    println!("Seeding random users...");
    let mut count = 0;
    let mut generated = std::collections::HashSet::new();
    
    while count < 10 {
        let ho_idx = (rand_num() % 5) as usize;
        let ten_lot_idx = (rand_num() % 5) as usize;
        let ten_idx = (rand_num() % 5) as usize;
        
        let ho_a = hos_ascii[ho_idx];
        let ten_lot_a = tens_lot_ascii[ten_lot_idx];
        let ten_a = tens_ascii[ten_idx];
        
        let suffix = (rand_num() % 900 + 100) as u32;
        let username = format!("{}{}{}{}", ho_a, ten_lot_a, ten_a, suffix);
        
        if generated.contains(&username) {
            continue;
        }
        
        let email = format!("{}@mathpeak.edu.vn", username);
        
        let exists: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE username = ? OR email = ?"
        )
        .bind(&username)
        .bind(&email)
        .fetch_one(&pool)
        .await?;
        
        if exists.0 > 0 {
            continue;
        }
        
        generated.insert(username.clone());
        let id = Uuid::new_v4().to_string();
        
        let role = "student";
        let points = (rand_num() % 2500) as i32;
        let streak_count = (rand_num() % 45) as i32;
        
        let days_ago = (rand_num() % 30) as i64;
        let hours_ago = (rand_num() % 24) as i64;
        let last_active = chrono::Utc::now() - chrono::Duration::days(days_ago) - chrono::Duration::hours(hours_ago);
        let last_active_naive = last_active.naive_utc();
        
        sqlx::query(
            "INSERT INTO users (id, username, email, password_hash, role, points, streak_count, last_active_at, completed_lessons, unlocked_lessons, unlocked_documents, completed_materials, created_at) \
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&username)
        .bind(&email)
        .bind(&student_pwd_hash)
        .bind(role)
        .bind(points)
        .bind(streak_count)
        .bind(last_active_naive)
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(&empty_json)
        .bind(chrono::Utc::now().naive_utc())
        .execute(&pool)
        .await?;
        
        let display_name = format!("{} {} {}", hos[ho_idx], tens_lot[ten_lot_idx], tens[ten_idx]);
        println!("Inserted user {}: {} -> {} ({})", count + 1, display_name, username, email);
        count += 1;
    }
    println!("Successfully seeded {} users!", count);

    // Delete existing data to prevent duplicate key errors
    println!("Clearing existing learning & exam data...");
    sqlx::query("SET FOREIGN_KEY_CHECKS = 0").execute(&pool).await?;
    sqlx::query("DELETE FROM user_exam_results").execute(&pool).await?;
    sqlx::query("DELETE FROM bookmarks").execute(&pool).await?;
    sqlx::query("DELETE FROM collections").execute(&pool).await?;
    sqlx::query("DELETE FROM exams").execute(&pool).await?;
    sqlx::query("DELETE FROM questions").execute(&pool).await?;
    sqlx::query("DELETE FROM study_materials").execute(&pool).await?;
    sqlx::query("DELETE FROM lessons").execute(&pool).await?;
    sqlx::query("DELETE FROM chapters").execute(&pool).await?;
    sqlx::query("DELETE FROM subjects").execute(&pool).await?;
    sqlx::query("DELETE FROM articles").execute(&pool).await?;
    sqlx::query("DELETE FROM documents").execute(&pool).await?;
    sqlx::query("SET FOREIGN_KEY_CHECKS = 1").execute(&pool).await?;

    println!("Seeding subjects...");
    struct SubjectSeed {
        id: i32,
        grade: i32,
        name: &'static str,
        slug: &'static str,
        order_index: i32,
    }
    let subjects = vec![
        SubjectSeed { id: 1, grade: 10, name: "Toán Học Lớp 10", slug: "toan-10", order_index: 1 },
        SubjectSeed { id: 2, grade: 11, name: "Toán Học Lớp 11", slug: "toan-11", order_index: 2 },
        SubjectSeed { id: 3, grade: 12, name: "Toán Học Lớp 12", slug: "toan-12", order_index: 3 },
    ];
    for s in &subjects {
        sqlx::query("INSERT INTO subjects (id, grade, name, slug, order_index) VALUES (?, ?, ?, ?, ?)")
            .bind(s.id)
            .bind(s.grade)
            .bind(s.name)
            .bind(s.slug)
            .bind(s.order_index)
            .execute(&pool)
            .await?;
    }

    println!("Seeding chapters...");
    struct ChapterSeed {
        id: &'static str,
        subject_id: i32,
        name: &'static str,
        slug: &'static str,
        order_index: i32,
    }
    let c1_id = "c1111111-1111-1111-1111-111111111111";
    let c2_id = "c2222222-2222-2222-2222-222222222222";
    let c3_id = "c3333333-3333-3333-3333-333333333333";
    let c4_id = "c4444444-4444-4444-4444-444444444444";
    let c5_id = "c5555555-5555-5555-5555-555555555555";
    let c6_id = "c6666666-6666-6666-6666-666666666666";

    let chapters = vec![
        ChapterSeed { id: c1_id, subject_id: 1, name: "Mệnh đề và Tập hợp", slug: "menh-de-va-tap-hop", order_index: 1 },
        ChapterSeed { id: c2_id, subject_id: 1, name: "Hàm số bậc hai", slug: "ham-so-bac-hai", order_index: 2 },
        ChapterSeed { id: c3_id, subject_id: 2, name: "Hàm số lượng giác", slug: "ham-so-luong-giac", order_index: 1 },
        ChapterSeed { id: c4_id, subject_id: 2, name: "Dãy số và Cấp số cộng", slug: "day-so-va-cap-so-cong", order_index: 2 },
        ChapterSeed { id: c5_id, subject_id: 3, name: "Ứng dụng đạo hàm", slug: "ung-dung-dao-ham", order_index: 1 },
        ChapterSeed { id: c6_id, subject_id: 3, name: "Nguyên hàm và Tích phân", slug: "nguyen-ham-va-tich-phan", order_index: 2 },
    ];
    for c in &chapters {
        sqlx::query("INSERT INTO chapters (id, subject_id, name, slug, order_index) VALUES (?, ?, ?, ?, ?)")
            .bind(c.id)
            .bind(c.subject_id)
            .bind(c.name)
            .bind(c.slug)
            .bind(c.order_index)
            .execute(&pool)
            .await?;
    }

    println!("Seeding lessons...");
    struct LessonSeed {
        id: &'static str,
        chapter_id: &'static str,
        title: &'static str,
        slug: &'static str,
        content: &'static str,
        is_vip: bool,
        points_required: i32,
        order_index: i32,
    }
    let lessons = vec![
        LessonSeed {
            id: "l1111111-1111-1111-1111-111111111111",
            chapter_id: c1_id,
            title: "Mệnh đề toán học",
            slug: "menh-de-toan-hoc",
            content: "Nội dung bài học mệnh đề toán học đầy đủ khái niệm, ví dụ minh họa và bài tập vận dụng nâng cao.",
            is_vip: false,
            points_required: 0,
            order_index: 1,
        },
        LessonSeed {
            id: "l2222222-2222-2222-2222-222222222222",
            chapter_id: c1_id,
            title: "Các phép toán trên tập hợp",
            slug: "cac-phep-toan-tren-tap-hop",
            content: "Tìm hiểu về các phép toán giao, hợp, hiệu và phần bù trên tập hợp một cách trực quan thông qua biểu đồ Venn.",
            is_vip: true,
            points_required: 50,
            order_index: 2,
        },
        LessonSeed {
            id: "l3333333-3333-3333-3333-333333333333",
            chapter_id: c2_id,
            title: "Khái niệm hàm số bậc hai",
            slug: "khai-niem-ham-so-bac-hai",
            content: "Lý thuyết cơ bản về hàm số bậc hai y = ax^2 + bx + c, khảo sát sự biến thiên và vẽ parabol.",
            is_vip: false,
            points_required: 0,
            order_index: 1,
        },
    ];
    for l in &lessons {
        sqlx::query("INSERT INTO lessons (id, chapter_id, title, slug, content, is_vip, points_required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(l.id)
            .bind(l.chapter_id)
            .bind(l.title)
            .bind(l.slug)
            .bind(l.content)
            .bind(l.is_vip as i8)
            .bind(l.points_required)
            .bind(l.order_index)
            .execute(&pool)
            .await?;
    }

    println!("Seeding study materials...");
    sqlx::query("INSERT INTO study_materials (id, lesson_id, title, slug, content, is_vip, points_required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind("m1111111-1111-1111-1111-111111111111")
        .bind("l1111111-1111-1111-1111-111111111111")
        .bind("Bài tập trắc nghiệm Mệnh đề nâng cao")
        .bind("bai-tap-trac-nghiem-menh-de-nang-cao")
        .bind("Tổng hợp 50 câu trắc nghiệm mệnh đề toán học mức độ vận dụng cao.")
        .bind(0)
        .bind(0)
        .bind(1)
        .execute(&pool)
        .await?;

    println!("Seeding questions...");
    struct OptionSeed {
        key: &'static str,
        option_text: &'static str,
        is_correct: bool,
    }
    struct QuestionSeed {
        id: &'static str,
        chapter_id: &'static str,
        text: &'static str,
        difficulty: &'static str,
        explanation: &'static str,
        points: i32,
        options: Vec<OptionSeed>,
    }
    let questions = vec![
        QuestionSeed {
            id: "q1111111-1111-1111-1111-111111111111",
            chapter_id: c1_id,
            text: "Trong các phát biểu sau, phát biểu nào là một mệnh đề toán học?",
            difficulty: "easy",
            explanation: "Mệnh đề toán học là một phát biểu khẳng định về một sự kiện toán học, có tính đúng hoặc sai rõ ràng.",
            points: 10,
            options: vec![
                OptionSeed { key: "A", option_text: "Hôm nay trời đẹp quá!", is_correct: false },
                OptionSeed { key: "B", option_text: "Bạn đã làm bài tập chưa?", is_correct: false },
                OptionSeed { key: "C", option_text: "Số 15 là số nguyên tố.", is_correct: true },
                OptionSeed { key: "D", option_text: "Học toán rất thú vị.", is_correct: false },
            ]
        },
        QuestionSeed {
            id: "q2222222-2222-2222-2222-222222222222",
            chapter_id: c1_id,
            text: "Cho tập hợp A = {1, 2, 3} và B = {2, 3, 4}. Tập hợp A giao B bằng?",
            difficulty: "easy",
            explanation: "Giao của hai tập hợp A và B gồm các phần tử vừa thuộc A vừa thuộc B.",
            points: 10,
            options: vec![
                OptionSeed { key: "A", option_text: "{1, 4}", is_correct: false },
                OptionSeed { key: "B", option_text: "{2, 3}", is_correct: true },
                OptionSeed { key: "C", option_text: "{1, 2, 3, 4}", is_correct: false },
                OptionSeed { key: "D", option_text: "{2}", is_correct: false },
            ]
        },
        QuestionSeed {
            id: "q3333333-3333-3333-3333-333333333333",
            chapter_id: c2_id,
            text: "Đồ thị hàm số y = x^2 - 4x + 3 có tọa độ đỉnh là?",
            difficulty: "medium",
            explanation: "Hoành độ đỉnh x = -b/(2a) = 4/2 = 2. Tung độ y = 2^2 - 4*2 + 3 = -1.",
            points: 10,
            options: vec![
                OptionSeed { key: "A", option_text: "(2, -1)", is_correct: true },
                OptionSeed { key: "B", option_text: "(-2, 15)", is_correct: false },
                OptionSeed { key: "C", option_text: "(1, 0)", is_correct: false },
                OptionSeed { key: "D", option_text: "(2, 1)", is_correct: false },
            ]
        },
    ];

    for q in &questions {
        let mut q_opts: Vec<QuestionOption> = Vec::new();
        for opt in &q.options {
            q_opts.push(QuestionOption {
                id: Uuid::new_v4().to_string(),
                question_id: q.id.to_string(),
                key: opt.key.to_string(),
                option_text: opt.option_text.to_string(),
                is_correct: opt.is_correct,
                option_value: None,
            });
        }
        
        let opts_json = sqlx::types::Json(q_opts);

        sqlx::query("INSERT INTO questions (id, chapter_id, question_text, question_type, difficulty, explanation, points, options) VALUES (?, ?, ?, 'single_choice', ?, ?, ?, ?)")
            .bind(q.id)
            .bind(q.chapter_id)
            .bind(q.text)
            .bind(q.difficulty)
            .bind(q.explanation)
            .bind(q.points)
            .bind(&opts_json)
            .execute(&pool)
            .await?;
    }

    println!("Seeding exams...");
    let q_ids = vec![
        "q1111111-1111-1111-1111-111111111111".to_string(),
        "q2222222-2222-2222-2222-222222222222".to_string()
    ];
    let q_ids_json = sqlx::types::Json(q_ids);

    sqlx::query("INSERT INTO exams (id, title, description, subject_id, lesson_id, time_limit_minutes, question_ids) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind("e1111111-1111-1111-1111-111111111111")
        .bind("Đề thi thử Chương 1 - Mệnh đề tập hợp")
        .bind("Đề thi giúp đánh giá tổng quan kiến thức chương 1 Toán lớp 10.")
        .bind(1)
        .bind("l1111111-1111-1111-1111-111111111111")
        .bind(15)
        .bind(&q_ids_json)
        .execute(&pool)
        .await?;

    println!("Seeding articles...");
    struct ArticleSeed {
        id: &'static str,
        title: &'static str,
        content: &'static str,
        summary: &'static str,
        thumbnail: &'static str,
    }
    let articles = vec![
        ArticleSeed {
            id: "a1111111-1111-1111-1111-111111111111",
            title: "Công thức Euler và vẻ đẹp kỳ diệu của Toán học",
            summary: "Khám phá công thức toán học đẹp nhất mọi thời đại e^(i*pi) + 1 = 0 của Leonhard Euler và ý nghĩa sâu sắc đằng sau nó.",
            content: "# Công thức Euler: Vẻ đẹp vĩnh cửu của Toán học\n\nTrong thế giới toán học, có một công thức được ví như một tác phẩm nghệ thuật kinh điển, kết hợp năm hằng số toán học quan trọng nhất vào một biểu thức duy nhất:\n\n$$e^{i\\pi} + 1 = 0$$\n\nCông thức này được phát minh bởi nhà toán học vĩ đại người Thụy Sĩ **Leonhard Euler**. Hãy cùng khám phá vì sao nó lại mang một vẻ đẹp kỳ diệu đến vậy.\n\n## Các thành phần cấu tạo\n\nBiểu thức này chứa đựng:\n* Hằng số $e$: Cơ số của logarit tự nhiên, xấp xỉ $2.71828$.\n* Đơn vị ảo $i$: Định nghĩa bởi $i^2 = -1$.\n* Hằng số $\\pi$: Tỉ số giữa chu vi và đường kính đường tròn, xấp xỉ $3.14159$.\n* Số $1$: Phần tử đơn vị của phép nhân.\n* Số $0$: Phần tử trung hòa của phép cộng.\n\n> [!TIP]\n> Sự liên kết của 5 đại lượng tưởng chừng như hoàn toàn khác biệt này thể hiện sự thống nhất sâu sắc của các phân môn toán học: Giải tích ($e$), Đại số ($i$), Hình học ($\\pi$), và Số học ($0, 1$).\n\n## Chứng minh toán học thông qua Chuỗi Taylor\n\nChúng ta có chuỗi lũy thừa Taylor của các hàm số lượng giác và hàm mũ:\n\n$$e^x = \\sum_{n=0}^{\\infty} \\frac{x^n}{n!} = 1 + x + \\frac{x^2}{2!} + \\frac{x^3}{3!} + \\dots$$\n\n$$\\cos x = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\dots$$\n\n$$\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\dots$$\n\nThay $x = i\\theta$ vào chuỗi của $e^x$, ta thu được công thức tổng quát của Euler:\n\n$$e^{i\\theta} = \\cos\\theta + i\\sin\\theta$$\n\nKhi đặt $\\theta = \\pi$, ta có $\\cos\\pi = -1$ và $\\sin\\pi = 0$. Biểu thức trở thành:\n\n$$e^{i\\pi} = -1 + 0i \\implies e^{i\\pi} + 1 = 0$$\n\nĐây chính là vẻ đẹp bất tận mà bất kỳ ai học toán cũng đều say mê!",
            thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60",
        },
        ArticleSeed {
            id: "a2222222-2222-2222-2222-222222222222",
            title: "Dãy số Fibonacci, Tỷ lệ vàng và Vẻ đẹp của Tự nhiên",
            summary: "Khám phá mối liên hệ kỳ diệu giữa dãy số Fibonacci, tỷ lệ vàng 1.618 và cách tự nhiên sử dụng chúng để tạo nên những tuyệt tác hình học.",
            content: "# Dãy số Fibonacci và Tỷ lệ vàng\n\nBạn đã bao giờ tự hỏi tại sao các hạt hướng dương xếp thành các đường xoắn ốc hoàn hảo, hay tại sao vỏ ốc anh vũ lại có hình dáng cân đối đến kỳ lạ? Câu trả lời nằm ở một dãy số vô cùng đơn giản: **Dãy số Fibonacci**.\n\n## Dãy số Fibonacci là gì?\n\nDãy số Fibonacci là dãy vô hạn các số tự nhiên bắt đầu bằng hai số $0$ và $1$ (hoặc $1$ và $1$), các số sau được lập bằng cách cộng hai số liền trước nó:\n\n$$F_0 = 0$$\n$$F_1 = 1$$\n$$F_n = F_{n-1} + F_{n-2} \\quad (n \\ge 2)$$\n\nNhững số đầu tiên của dãy số là:\n\n$$0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, \\dots$$\n\n## Tỷ lệ vàng $\\phi$\n\nKhi ta lấy tỉ số của hai số liên tiếp trong dãy Fibonacci, tỉ số này sẽ hội tụ về một hằng số gọi là **Tỷ lệ vàng**, ký hiệu là $\\phi$ (Phi):\n\n$$\\lim_{n \\to \\infty} \\frac{F_n}{F_{n-1}} = \\phi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.61803...$$\n\n## Sự hiện diện trong thế giới tự nhiên\n\nTỷ lệ vàng và dãy số Fibonacci xuất hiện khắp nơi xung quanh chúng ta:\n* **Nhị hoa hướng dương:** Các hạt hướng dương được xếp theo hai nhóm đường xoắn ốc ngược chiều nhau. Số lượng đường xoắn ốc thường là các số Fibonacci liên tiếp như 34 và 55, hoặc 55 và 89.\n* **Cấu trúc quả thông:** Các vảy của quả thông xếp thành các đường xoắn ốc có tỷ lệ tương ứng với các số Fibonacci.\n* **Cánh hoa:** Hầu hết các loài hoa đều có số lượng cánh hoa là một số Fibonacci: hoa loa kèn (3 cánh), hoa mao lương (5 cánh), hoa cúc (21 hoặc 34 cánh).\n\n> [!NOTE]\n> Việc xếp theo tỷ lệ này giúp các loài thực vật tối ưu hóa không gian tiếp nhận ánh sáng mặt trời và nước mưa hiệu quả nhất. Toán học chính là ngôn ngữ thiết kế của tự nhiên!",
            thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=60",
        },
    ];

    for art in &articles {
        sqlx::query("INSERT INTO articles (id, title, content, summary, author_id, thumbnail) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(art.id)
            .bind(art.title)
            .bind(art.content)
            .bind(art.summary)
            .bind(&admin_id)
            .bind(art.thumbnail)
            .execute(&pool)
            .await?;
    }

    println!("Seeding documents...");
    struct DocSeed {
        id: &'static str,
        subject_id: i32,
        title: &'static str,
        description: &'static str,
        file_url: &'static str,
        is_vip: bool,
        points_required: i32,
    }
    let documents = vec![
        DocSeed {
            id: "d1111111-1111-1111-1111-111111111111",
            subject_id: 3, // Toán 12
            title: "Tuyển tập 100 câu trắc nghiệm Vận dụng cao Hàm số lớp 12",
            description: "Tài liệu tổng hợp các bài toán trắc nghiệm chương Hàm số ở mức độ vận dụng và vận dụng cao (8+ và 9+) có lời giải chi tiết giúp học sinh ôn luyện thi THPT Quốc gia.",
            file_url: "/uploads/tuyen_tap_100_cau_ham_so_vdc.pdf",
            is_vip: true,
            points_required: 120,
        },
        DocSeed {
            id: "d2222222-2222-2222-2222-222222222222",
            subject_id: 2, // Toán 11
            title: "Tóm tắt công thức Giải tích và Hình học lớp 11 đầy đủ nhất",
            description: "Tài liệu tóm tắt toàn bộ lý thuyết, công thức lượng giác, cấp số cộng, cấp số nhân, giới hạn và hình học không gian lớp 11 giúp tra cứu nhanh chóng.",
            file_url: "/uploads/tong_hop_cong_thuc_toan_11.pdf",
            is_vip: false,
            points_required: 0,
        }
    ];

    for doc in &documents {
        sqlx::query("INSERT INTO documents (id, subject_id, title, description, file_url, is_vip, points_required, download_count) VALUES (?, ?, ?, ?, ?, ?, ?, 0)")
            .bind(doc.id)
            .bind(doc.subject_id)
            .bind(doc.title)
            .bind(doc.description)
            .bind(doc.file_url)
            .bind(doc.is_vip as i8)
            .bind(doc.points_required)
            .execute(&pool)
            .await?;
    }

    // ── Seed formulas ──────────────────────────────────────────────────────
    println!("Seeding formulas...");
    struct FormulaSeed {
        id: &'static str,
        title: &'static str,
        latex: &'static str,
        description: &'static str,
    }
    let formulas = vec![
        FormulaSeed {
            id: "f1111111-1111-1111-1111-111111111111",
            title: "Công thức nghiệm phương trình bậc 2",
            latex: r"x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}",
            description: "Công thức tính nghiệm của phương trình bậc hai ax² + bx + c = 0 (a ≠ 0). Điều kiện có nghiệm: Δ = b² - 4ac ≥ 0.",
        },
        FormulaSeed {
            id: "f2222222-2222-2222-2222-222222222222",
            title: "Công thức Euler",
            latex: r"e^{i\pi} + 1 = 0",
            description: "Được xem là công thức toán học đẹp nhất, kết nối năm hằng số toán học quan trọng: e, i, π, 1, và 0.",
        },
        FormulaSeed {
            id: "f3333333-3333-3333-3333-333333333333",
            title: "Định lý Pytago",
            latex: r"a^2 + b^2 = c^2",
            description: "Trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông. Trong đó c là cạnh huyền.",
        },
        FormulaSeed {
            id: "f4444444-4444-4444-4444-444444444444",
            title: "Diện tích hình tròn",
            latex: r"S = \pi r^2",
            description: "Diện tích hình tròn bán kính r. π ≈ 3.14159...",
        },
        FormulaSeed {
            id: "f5555555-5555-5555-5555-555555555555",
            title: "Đạo hàm của hàm hợp (Chain Rule)",
            latex: r"\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)",
            description: "Quy tắc dây chuyền trong giải tích: đạo hàm của hàm hợp f∘g bằng đạo hàm của hàm ngoài nhân đạo hàm hàm trong.",
        },
        FormulaSeed {
            id: "f6666666-6666-6666-6666-666666666666",
            title: "Tổng cấp số cộng",
            latex: r"S_n = \frac{n(u_1 + u_n)}{2}",
            description: "Tổng n số hạng đầu của cấp số cộng, trong đó u₁ là số hạng đầu và uₙ là số hạng thứ n.",
        },
        FormulaSeed {
            id: "f7777777-7777-7777-7777-777777777777",
            title: "Công thức lãi kép",
            latex: r"A = P\left(1 + \frac{r}{n}\right)^{nt}",
            description: "Công thức tính lãi kép: A là số tiền sau t năm, P là vốn gốc, r là lãi suất hàng năm, n là số lần ghép lãi mỗi năm.",
        },
        FormulaSeed {
            id: "f8888888-8888-8888-8888-888888888888",
            title: "Công thức sin trong tam giác",
            latex: r"\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C} = 2R",
            description: "Định lý sin: trong tam giác ABC, tỉ số giữa mỗi cạnh và sin của góc đối diện là bằng nhau và bằng đường kính ngoại tiếp 2R.",
        },
    ];

    for f in &formulas {
        sqlx::query("INSERT INTO formulas (id, title, latex, description, status, created_by) VALUES (?, ?, ?, ?, 'approved', ?)")
            .bind(f.id)
            .bind(f.title)
            .bind(f.latex)
            .bind(f.description)
            .bind(&admin_id)
            .execute(&pool)
            .await?;
    }

    println!("Learning & blog content seeded successfully!");
    Ok(())
}
