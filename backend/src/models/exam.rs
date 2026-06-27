use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

// ── Question Option ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuestionOption {
    pub id: String,
    pub key: String, // Label like "A", "B", etc.
    pub option_text: String,
    pub is_correct: bool,
    pub option_value: Option<String>,
}

// ── Question ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Question {
    pub id: String,
    pub chapter_id: Option<String>,
    pub question_text: String,
    pub question_type: String,
    // Removed difficulty field as it was dropped from DB schema
    pub explanation: String,
    pub points: i32,
    pub options: sqlx::types::Json<Vec<QuestionOption>>,
    pub images: Option<sqlx::types::Json<Vec<String>>>,
    pub sol_images: Option<sqlx::types::Json<Vec<String>>>,
    pub created_at: NaiveDateTime,
}

pub type QuestionRow = Question;

#[derive(Debug, Deserialize)]
pub struct CreateQuestionOptionRequest {
    pub key: String,
    pub option_text: String,
    pub is_correct: bool,
    pub option_value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuestionRequest {
    pub chapter_id: Option<String>,
    pub question_text: String,
    pub question_type: Option<String>,
    // difficulty removed
    pub explanation: String,
    pub points: Option<i32>,
    pub options: Vec<CreateQuestionOptionRequest>,
    pub images: Option<Vec<String>>,
    pub sol_images: Option<Vec<String>>,
}

// ── Exam ──────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ExamRow {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub subject_id: Option<i32>,
    pub lesson_id: Option<String>,
    pub time_limit_minutes: i32,
    pub question_ids: Option<sqlx::types::Json<Vec<String>>>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize)]
pub struct Exam {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub subject_id: Option<i32>,
    pub lesson_id: Option<String>,
    pub time_limit_minutes: i32,
    pub question_ids: Vec<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateExamRequest {
    pub title: String,
    pub description: Option<String>,
    pub subject_id: Option<i32>,
    pub lesson_id: Option<String>,
    pub time_limit_minutes: Option<i32>,
    pub question_ids: Vec<String>,
}

// ── Submit ────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AnswerSubmit {
    pub question_id: String,
    pub selected_option_id: Option<String>,
    pub input_value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SubmitExamRequest {
    pub answers: Vec<AnswerSubmit>,
    pub time_spent_seconds: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnswerDetail {
    pub question_id: String,
    pub selected_option_id: Option<String>,
    pub input_value: Option<String>,
    pub is_correct: bool,
    pub correct_option_id: Option<String>,
    pub correct_input_value: Option<String>,
    pub explanation: String,
    pub points_awarded: f32,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct UserExamResultRow {
    pub id: String,
    pub user_id: String,
    pub exam_id: String,
    pub score: f32,
    pub points_earned: i32,
    pub time_spent_seconds: i32,
    pub answers: sqlx::types::Json<Vec<AnswerDetail>>,
    pub completed_at: NaiveDateTime,
}

#[derive(Debug, Serialize)]
pub struct UserExamResult {
    pub id: String,
    pub user_id: String,
    pub exam_id: String,
    pub score: f32,
    pub points_earned: i32,
    pub time_spent_seconds: i32,
    pub answers: Vec<AnswerDetail>,
    pub completed_at: NaiveDateTime,
}
