use axum::{routing::post, Router};
use sqlx::MySqlPool;
use crate::handlers::auth::{forgot_password, get_me, login, register, reset_password};

pub fn auth_router() -> Router<MySqlPool> {
    Router::new()
        .route("/register", post(register))
        .route("/login",    post(login))
        .route("/forgot-password", post(forgot_password))
        .route("/reset-password",  post(reset_password))
        .route("/me",       axum::routing::get(get_me))
}
