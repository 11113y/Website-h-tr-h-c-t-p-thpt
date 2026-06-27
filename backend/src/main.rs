mod config;
mod db; // Database connection helper & initializer (live)
mod errors;
mod handlers;
mod middleware;
mod models;
mod routes;

use axum::{http::Method, Router};
use sqlx::MySqlPool;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use routes::{
    admin::admin_router, auth::auth_router, document::document_router,
    exam::exam_router, feedback::feedback_router, subject::subject_router,
    user::user_router, bookmark::bookmark_router, formula::formula_router,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let cfg = config::Config::from_env()?;

    tracing::info!("🚀 Khởi động Math Platform Backend (Rust/Axum + MySQL)");
    tracing::info!("📦 Kết nối cơ sở dữ liệu MySQL...");

    let pool = db::create_pool(&cfg.database_url).await?;

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH])
        .allow_headers(Any)
        .allow_origin(
            cfg.frontend_url
                .parse::<axum::http::HeaderValue>()
                .unwrap_or("http://localhost:5173".parse().unwrap()),
        )
        .allow_credentials(false);

    let api_router = Router::new()
        .nest("/auth",   auth_router())
        .nest("/users",  user_router())
        .merge(subject_router())
        .merge(exam_router())
        .merge(document_router())
        .merge(feedback_router())
        .merge(admin_router())
        .merge(bookmark_router())
        .merge(formula_router())
        .with_state(pool);


    let app = Router::new()
        .route("/health", axum::routing::get(health_check))
        .nest("/api", api_router)
        .nest_service("/uploads", tower_http::services::ServeDir::new("uploads"))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], cfg.port));
    tracing::info!("✅ Server đang chạy tại http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "version": "1.0.0",
        "framework": "Axum (Rust) + MySQL"
    }))
}
