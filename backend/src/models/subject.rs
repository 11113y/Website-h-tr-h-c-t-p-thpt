use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ── Subject ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Subject {
    pub id: i32,
    pub grade: i32,
    pub name: String,
    pub slug: String,
    pub order_index: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubjectRequest {
    pub grade: i32,
    pub name: String,
    pub slug: String,
    pub order_index: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSubjectRequest {
    pub grade: Option<i32>,
    pub name: Option<String>,
    pub slug: Option<String>,
    pub order_index: Option<i32>,
}

// ── Chapter ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Chapter {
    pub id: String,
    pub subject_id: i32,
    pub name: String,
    pub slug: String,
    pub order_index: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateChapterRequest {
    pub subject_id: i32,
    pub name: String,
    pub slug: String,
    pub order_index: Option<i32>,
}

// ── Lesson ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Lesson {
    pub id: String,
    pub chapter_id: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub is_vip: bool,
    pub points_required: i32,
    pub order_index: i32,
    pub created_at: NaiveDateTime,
    pub pdf_url: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LessonSummary {
    pub id: String,
    pub chapter_id: String,
    pub title: String,
    pub slug: String,
    pub is_vip: bool,
    pub points_required: i32,
    pub order_index: i32,
    pub created_at: NaiveDateTime,
    pub pdf_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLessonRequest {
    pub chapter_id: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub is_vip: Option<bool>,
    pub points_required: Option<i32>,
    pub order_index: Option<i32>,
    pub pdf_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLessonRequest {
    pub chapter_id: Option<String>,
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_vip: Option<bool>,
    pub points_required: Option<i32>,
    pub order_index: Option<i32>,
    pub pdf_url: Option<String>,
}

// ── StudyMaterial ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct StudyMaterial {
    pub id: String,
    pub lesson_id: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub is_vip: bool,
    pub points_required: i32,
    pub order_index: i32,
    pub created_at: NaiveDateTime,
    pub pdf_url: Option<String>,
    pub video_url: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StudyMaterialSummary {
    pub id: String,
    pub lesson_id: String,
    pub title: String,
    pub slug: String,
    pub is_vip: bool,
    pub points_required: i32,
    pub order_index: i32,
    pub created_at: NaiveDateTime,
    pub pdf_url: Option<String>,
    pub video_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStudyMaterialRequest {
    pub lesson_id: String,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub is_vip: Option<bool>,
    pub points_required: Option<i32>,
    pub order_index: Option<i32>,
    pub pdf_url: Option<String>,
    pub video_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStudyMaterialRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub is_vip: Option<bool>,
    pub points_required: Option<i32>,
    pub order_index: Option<i32>,
    pub pdf_url: Option<String>,
    pub video_url: Option<String>,
}
