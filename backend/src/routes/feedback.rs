use axum::{routing::{get, post, put}, Router};
use sqlx::MySqlPool;
use crate::handlers::feedback::{
    create_feedback, get_feedback_detail, get_feedbacks, update_feedback,
};

pub fn feedback_router() -> Router<MySqlPool> {
    Router::new()
        .route("/feedbacks",     post(create_feedback).get(get_feedbacks))
        .route("/feedbacks/:id", get(get_feedback_detail).put(update_feedback))
}
