use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct BookmarkRow {
    pub id: String,
    pub user_id: String,
    pub question_id: String,
    pub folder_id: Option<String>,
    pub is_pinned: i8, // MySQL TINYINT
    pub note: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateBookmarkRequest {
    pub question_id: String,
    pub folder_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBookmarkRequest {
    pub folder_id: Option<String>,
    pub is_pinned: Option<bool>,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchAddQuestionsRequest {
    pub bookmark_ids: Vec<String>,
}
