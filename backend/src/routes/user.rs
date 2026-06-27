use axum::{routing::{get, post, put}, Router};
use sqlx::MySqlPool;
use crate::handlers::user::{
    change_password, get_analytics, get_attempts_history, get_leaderboard,
    get_stats, restore_streak, update_profile,
};

pub fn user_router() -> Router<MySqlPool> {
    Router::new()
        .route("/profile",         put(update_profile))
        .route("/change-password", put(change_password))
        .route("/stats",           get(get_stats))
        .route("/analytics",       get(get_analytics))
        .route("/leaderboard",     get(get_leaderboard))
        .route("/history",         get(get_attempts_history))
        .route("/restore-streak",  post(restore_streak))
}
