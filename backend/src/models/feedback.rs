use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Feedback {
    pub id: String,
    pub user_id: Option<String>,
    pub title: String,
    pub content: String,
    pub feedback_type: String,
    pub reference_id: Option<String>,
    pub status: String,
    pub admin_notes: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedbackRequest {
    pub title: Option<String>,
    pub content: String,
    pub feedback_type: Option<String>,
    pub reference_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFeedbackRequest {
    pub status: Option<String>,
    pub admin_notes: Option<String>,
}
