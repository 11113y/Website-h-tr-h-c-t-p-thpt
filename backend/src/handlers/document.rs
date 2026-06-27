use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::AuthUser,
    models::document::{Article, Document},
};

pub async fn get_documents(
    State(pool): State<MySqlPool>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let subject_id = params.get("subject_id").and_then(|s| s.parse::<i32>().ok());

    let documents: Vec<Document> = if let Some(sid) = subject_id {
        sqlx::query_as(
            "SELECT id, subject_id, title, description, file_url, is_vip,
                    points_required, download_count, created_at
             FROM documents WHERE subject_id = ? ORDER BY created_at DESC"
        )
        .bind(sid)
        .fetch_all(&pool)
        .await
    } else {
        sqlx::query_as(
            "SELECT id, subject_id, title, description, file_url, is_vip,
                    points_required, download_count, created_at
             FROM documents ORDER BY created_at DESC"
        )
        .fetch_all(&pool)
        .await
    }
    .map_err(AppError::Database)?;

    let data: Vec<Value> = documents
        .iter()
        .map(|d| json!({
            "id": d.id, "subject_id": d.subject_id, "title": d.title,
            "description": d.description, "is_vip": d.is_vip,
            "points_required": d.points_required, "download_count": d.download_count,
            "created_at": d.created_at,
        }))
        .collect();

    Ok(Json(json!({ "success": true, "documents": data })))
}

pub async fn download_document(
    State(pool): State<MySqlPool>,
    Path(doc_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let doc: Document = sqlx::query_as(
        "SELECT id, subject_id, title, description, file_url, is_vip,
                points_required, download_count, created_at
         FROM documents WHERE id = ?"
    )
    .bind(&doc_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Tài liệu không tồn tại".to_string()))?;

    let mut remaining_points = None;

    if doc.is_vip {
        let mut user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
        let already_unlocked = user.unlocked_documents.0.contains(&doc_id);

        if !already_unlocked {
            if user.points < doc.points_required {
                return Err(AppError::InsufficientPoints);
            }

            user.points -= doc.points_required;
            user.unlocked_documents.0.push(doc_id.clone());

            sqlx::query(
                "UPDATE users SET points = ?, unlocked_documents = ?, last_active_at = NOW() WHERE id = ?"
            )
            .bind(user.points)
            .bind(&user.unlocked_documents)
            .bind(&user.id)
            .execute(&pool)
            .await
            .map_err(AppError::Database)?;
            
            remaining_points = Some(user.points);
        }
    }

    sqlx::query("UPDATE documents SET download_count = download_count + 1 WHERE id = ?")
        .bind(&doc_id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "file_url": doc.file_url,
        "title": doc.title,
        "remaining_points": remaining_points,
    })))
}

pub async fn get_articles(
    State(pool): State<MySqlPool>,
) -> AppResult<Json<Value>> {
    let articles: Vec<(String, String, Option<String>, String, String, Option<String>, chrono::NaiveDateTime)> =
        sqlx::query_as(
            "SELECT a.id, a.title, a.summary, a.author_id, u.username, a.thumbnail, a.created_at
             FROM articles a JOIN users u ON u.id = a.author_id
             ORDER BY a.created_at DESC"
        )
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;

    let data: Vec<Value> = articles
        .iter()
        .map(|(id, title, summary, author_id, author_name, thumbnail, created_at)| json!({
            "id": id, "title": title, "summary": summary,
            "author_id": author_id, "author_name": author_name, "thumbnail": thumbnail, "created_at": created_at,
        }))
        .collect();

    Ok(Json(json!({ "success": true, "articles": data })))
}

pub async fn get_article_detail(
    State(pool): State<MySqlPool>,
    Path(article_id): Path<String>,
) -> AppResult<Json<Value>> {
    let article: Article = sqlx::query_as(
        "SELECT id, title, content, summary, author_id, thumbnail, created_at FROM articles WHERE id = ?"
    )
    .bind(&article_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Bài viết không tồn tại".to_string()))?;

    Ok(Json(json!({ "success": true, "article": article })))
}
