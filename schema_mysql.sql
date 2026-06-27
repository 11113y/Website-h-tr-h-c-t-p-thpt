-- =============================================================================
-- Database Schema: Hệ thống học toán THPT (Thiết kế tinh giản, sử dụng JSON)
-- Database: MySQL 8.0+
-- =============================================================================

-- 1. Bảng: users
CREATE TABLE IF NOT EXISTS users (
    id                  CHAR(36)        PRIMARY KEY,
    username            VARCHAR(50)     UNIQUE NOT NULL,
    email               VARCHAR(100)    UNIQUE NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    role                VARCHAR(20)     NOT NULL DEFAULT 'student'
                            CHECK (role IN ('student', 'admin')),
    points              INT             NOT NULL DEFAULT 0,
    streak_count        INT             NOT NULL DEFAULT 0,
    last_active_at      DATETIME        NULL,
    completed_lessons   JSON            NOT NULL, -- Mảng JSON chứa ID của bài học đã hoàn thành
    unlocked_lessons    JSON            NOT NULL, -- Mảng JSON chứa ID của bài học/học liệu VIP đã mở khóa
    unlocked_documents  JSON            NOT NULL, -- Mảng JSON chứa ID của tài liệu VIP đã mở khóa
    completed_materials JSON            NOT NULL, -- Mảng JSON chứa ID của tài liệu học tập đã hoàn thành
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bảng: subjects
CREATE TABLE IF NOT EXISTS subjects (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    grade       INT             NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    slug        VARCHAR(100)    UNIQUE NOT NULL,
    order_index INT             NOT NULL DEFAULT 0,
    CONSTRAINT chk_grade CHECK (grade BETWEEN 1 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng: chapters
CREATE TABLE IF NOT EXISTS chapters (
    id          CHAR(36)        PRIMARY KEY,
    subject_id  INT             NOT NULL,
    name        VARCHAR(150)    NOT NULL,
    slug        VARCHAR(150)    UNIQUE NOT NULL,
    order_index INT             NOT NULL DEFAULT 0,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Bảng: lessons
CREATE TABLE IF NOT EXISTS lessons (
    id              CHAR(36)        PRIMARY KEY,
    chapter_id      CHAR(36)        NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    slug            VARCHAR(200)    UNIQUE NOT NULL,
    content         LONGTEXT        NOT NULL,
    is_vip          TINYINT(1)      NOT NULL DEFAULT 0,
    points_required INT             NOT NULL DEFAULT 0,
    order_index     INT             NOT NULL DEFAULT 0,
    pdf_url         VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Bảng: study_materials
CREATE TABLE IF NOT EXISTS study_materials (
    id              CHAR(36)        PRIMARY KEY,
    chapter_id      CHAR(36)        NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    slug            VARCHAR(200)    UNIQUE NOT NULL,
    content         LONGTEXT        NOT NULL,
    pdf_url         VARCHAR(500)    NULL,
    video_url       VARCHAR(500)    NULL,
    is_vip          TINYINT(1)      NOT NULL DEFAULT 0,
    points_required INT             NOT NULL DEFAULT 0,
    order_index     INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Bảng: questions
CREATE TABLE IF NOT EXISTS questions (
    id              CHAR(36)        PRIMARY KEY,
    chapter_id      CHAR(36)        NULL,
    question_text   TEXT            NOT NULL,
    question_type   VARCHAR(30)     NOT NULL DEFAULT 'single_choice',
    difficulty      VARCHAR(20)     NOT NULL DEFAULT 'medium',
    explanation     TEXT            NOT NULL,
    points          INT             NOT NULL DEFAULT 10,
    options         JSON            NOT NULL, -- Lưu danh sách QuestionOption dạng JSON
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Bảng: exams
CREATE TABLE IF NOT EXISTS exams (
    id                  CHAR(36)        PRIMARY KEY,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT            NULL,
    subject_id          INT             NULL,
    lesson_id           CHAR(36)        NULL,
    time_limit_minutes  INT             NOT NULL DEFAULT 45,
    question_ids        JSON            NULL, -- Mảng JSON lưu danh sách ID câu hỏi
    pdf_url             VARCHAR(500)    NULL,
    answer_key          JSON            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Bảng: user_exam_results
CREATE TABLE IF NOT EXISTS user_exam_results (
    id                  CHAR(36)        PRIMARY KEY,
    user_id             CHAR(36)        NOT NULL,
    exam_id             CHAR(36)        NOT NULL,
    score               FLOAT           NOT NULL,
    points_earned       INT             NOT NULL DEFAULT 0,
    time_spent_seconds  INT             NOT NULL,
    answers             JSON            NOT NULL, -- Lưu chi tiết đáp án AnswerDetail của user dưới dạng JSON
    completed_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Bảng: collections
CREATE TABLE IF NOT EXISTS collections (
    id          CHAR(36)        PRIMARY KEY,
    user_id     CHAR(36)        NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    description TEXT            NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Bảng: bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id              CHAR(36)        PRIMARY KEY,
    user_id         CHAR(36)        NOT NULL,
    question_id     CHAR(36)        NOT NULL,
    folder_id       CHAR(36)        NULL,
    is_pinned       TINYINT(1)      NOT NULL DEFAULT 0,
    note            TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES collections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Bảng: documents
CREATE TABLE IF NOT EXISTS documents (
    id              CHAR(36)        PRIMARY KEY,
    subject_id      INT             NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NULL,
    file_url        VARCHAR(500)    NOT NULL,
    is_vip          TINYINT(1)      NOT NULL DEFAULT 0,
    points_required INT             NOT NULL DEFAULT 0,
    download_count  INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Bảng: articles
CREATE TABLE IF NOT EXISTS articles (
    id          CHAR(36)        PRIMARY KEY,
    title       VARCHAR(200)    NOT NULL,
    content     LONGTEXT        NOT NULL,
    summary     TEXT            NULL,
    author_id   CHAR(36)        NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Bảng: feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
    id              CHAR(36)        PRIMARY KEY,
    user_id         CHAR(36)        NULL,
    title           VARCHAR(200)    NOT NULL,
    content         TEXT            NOT NULL,
    feedback_type   VARCHAR(50)     NOT NULL DEFAULT 'general',
    reference_id    CHAR(36)        NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending',
    admin_notes     TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
