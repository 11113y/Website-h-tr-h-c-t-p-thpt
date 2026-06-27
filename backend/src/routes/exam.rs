use axum::{routing::{get, post}, Router};
use sqlx::MySqlPool;
use crate::handlers::exam::{get_exam_detail, get_exams, get_explanations, submit_exam};

pub fn exam_router() -> Router<MySqlPool> {
    Router::new()
        .route("/exams",                  get(get_exams))
        .route("/exams/:id",              get(get_exam_detail))
        .route("/exams/:id/submit",       post(submit_exam))
        .route("/exams/:id/explanations", get(get_explanations))
}
