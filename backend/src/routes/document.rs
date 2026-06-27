use axum::{routing::{get, post}, Router};
use sqlx::MySqlPool;
use crate::handlers::document::{
    download_document, get_article_detail, get_articles, get_documents,
};

pub fn document_router() -> Router<MySqlPool> {
    Router::new()
        .route("/documents",              get(get_documents))
        .route("/documents/:id/download", post(download_document))
        .route("/articles",               get(get_articles))
        .route("/articles/:id",           get(get_article_detail))
}
