use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ── Document ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Document {
    pub id: String,
    pub subject_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub file_url: String,
    pub is_vip: bool,
    pub points_required: i32,
    pub download_count: i32,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateDocumentRequest {
    pub subject_id: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub file_url: String,
    pub is_vip: Option<bool>,
    pub points_required: Option<i32>,
}

// ── Article ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Article {
    pub id: String,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub author_id: String,
    pub thumbnail: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateArticleRequest {
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateArticleRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub summary: Option<String>,
    pub thumbnail: Option<String>,
}
