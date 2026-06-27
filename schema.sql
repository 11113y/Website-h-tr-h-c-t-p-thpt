-- Kích hoạt extension sinh mã UUID ngẫu nhiên tự động
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. BẢNG NGƯỜI DÙNG (users)
-- =========================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    points INT DEFAULT 0 CHECK (points >= 0),
    streak_count INT DEFAULT 0 CHECK (streak_count >= 0),
    last_active_at TIMESTAMP,
    completed_lessons JSONB DEFAULT '[]',
    unlocked_lessons JSONB DEFAULT '[]',
    unlocked_documents JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email_lookup ON users(email);

-- =========================================================================
-- 2. BẢNG CHUYÊN ĐỀ HỌC TẬP (subjects)
-- =========================================================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    grade INT NOT NULL CHECK (grade IN (10, 11, 12)),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    order_index INT DEFAULT 0
);

-- =========================================================================
-- 3. BẢNG CHƯƠNG HỌC (chapters)
-- =========================================================================
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    order_index INT DEFAULT 0,
    CONSTRAINT fk_chapters_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapters_subject_fk ON chapters(subject_id);

-- =========================================================================
-- 4. BẢNG BÀI HỌC (lessons)
-- =========================================================================
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    points_required INT DEFAULT 0 CHECK (points_required >= 0),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_lessons_chapter_fk ON lessons(chapter_id);

-- =========================================================================
-- 5. BẢNG NGÂN HÀNG CÂU HỎI (questions)
-- =========================================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL DEFAULT 'single_choice'
        CHECK (question_type IN ('single_choice', 'multiple_choice', 'input_number')),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    explanation TEXT NOT NULL,
    points INT DEFAULT 10 CHECK (points >= 0),
    options JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
);

CREATE INDEX idx_questions_chapter_fk ON questions(chapter_id);

-- =========================================================================
-- 6. BẢNG ĐỀ KIỂM TRA & CUỘC THI (exams)
-- =========================================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INT,
    time_limit_minutes INT DEFAULT 45 CHECK (time_limit_minutes > 0),
    question_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- =========================================================================
-- 7. BẢNG KẾT QUẢ KIỂM TRA & LỊCH SỬ LÀM BÀI (user_exam_results)
-- =========================================================================
CREATE TABLE user_exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    exam_id UUID NOT NULL,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0.0 AND score <= 10.0),
    points_earned INT DEFAULT 0 CHECK (points_earned >= 0),
    time_spent_seconds INT NOT NULL CHECK (time_spent_seconds > 0),
    answers JSONB NOT NULL DEFAULT '[]',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_results_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_exam_results_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE INDEX idx_exam_results_user_fk ON user_exam_results(user_id);

-- =========================================================================
-- 8. BẢNG BỘ SƯU TẬP (collections)
-- =========================================================================
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    question_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_collections_user_fk ON collections(user_id);

-- =========================================================================
-- 9. BẢNG TÀI LIỆU HỌC TẬP (documents)
-- =========================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url VARCHAR(255) NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    points_required INT DEFAULT 0 CHECK (points_required >= 0),
    download_count INT DEFAULT 0 CHECK (download_count >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

CREATE INDEX idx_documents_subject_fk ON documents(subject_id);

-- =========================================================================
-- 10. BẢNG BÀI VIẾT (articles)
-- =========================================================================
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================================
-- 11. BẢNG Ý KIẾN ĐÓNG GÓP & GÓP Ý (feedbacks)
-- =========================================================================
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'general'
        CHECK (feedback_type IN ('general', 'lesson_error', 'question_error', 'ui_bug', 'suggestion')),
    reference_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewed', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedbacks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_feedbacks_user_fk ON feedbacks(user_id);
