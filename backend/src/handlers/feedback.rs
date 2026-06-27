use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::{AdminUser, AuthUser},
    models::feedback::{CreateFeedbackRequest, Feedback, UpdateFeedbackRequest},
};

pub async fn create_feedback(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<CreateFeedbackRequest>,
) -> AppResult<Json<Value>> {
    if body.content.trim().is_empty() {
        return Err(AppError::BadRequest("Nội dung là bắt buộc".to_string()));
    }

    let title = body
        .title
        .as_deref()
        .map(str::trim)
        .filter(|title| !title.is_empty())
        .unwrap_or("Góp ý từ học sinh");

    let feedback_type = body.feedback_type.unwrap_or_else(|| "general".to_string());
    let valid_types = ["general", "lesson_error", "question_error", "ui_bug", "suggestion"];
    if !valid_types.contains(&feedback_type.as_str()) {
        return Err(AppError::BadRequest("Loại góp ý không hợp lệ".to_string()));
    }

    let new_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO feedbacks (id, user_id, title, content, feedback_type, reference_id)
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id)
    .bind(&claims.sub)
    .bind(title)
    .bind(body.content.trim())
    .bind(&feedback_type)
    .bind(body.reference_id.as_deref())
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    let feedback: Feedback = sqlx::query_as(
        "SELECT id, user_id, title, content, feedback_type, reference_id,
                status, admin_notes, created_at FROM feedbacks WHERE id = ?"
    )
    .bind(&new_id)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Cảm ơn bạn đã đóng góp ý kiến!",
        "feedback": feedback,
    })))
}

pub async fn get_feedbacks(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let status = params.get("status").map(|s| s.as_str()).unwrap_or("");

    let feedbacks: Vec<Feedback> = match (claims.role.as_str(), status.is_empty()) {
        ("admin", true) => {
            sqlx::query_as(
                "SELECT id, user_id, title, content, feedback_type, reference_id,
                        status, admin_notes, created_at FROM feedbacks ORDER BY created_at DESC"
            )
            .fetch_all(&pool)
            .await
        }
        ("admin", false) => {
            sqlx::query_as(
                "SELECT id, user_id, title, content, feedback_type, reference_id,
                        status, admin_notes, created_at FROM feedbacks WHERE status = ? ORDER BY created_at DESC"
            )
            .bind(status)
            .fetch_all(&pool)
            .await
        }
        (_, true) => {
            sqlx::query_as(
                "SELECT id, user_id, title, content, feedback_type, reference_id,
                        status, admin_notes, created_at FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC"
            )
            .bind(&claims.sub)
            .fetch_all(&pool)
            .await
        }
        (_, false) => {
            sqlx::query_as(
                "SELECT id, user_id, title, content, feedback_type, reference_id,
                        status, admin_notes, created_at FROM feedbacks WHERE user_id = ? AND status = ? ORDER BY created_at DESC"
            )
            .bind(&claims.sub)
            .bind(status)
            .fetch_all(&pool)
            .await
        }
    }.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "feedbacks": feedbacks })))
}

pub async fn get_feedback_detail(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(feedback_id): Path<String>,
) -> AppResult<Json<Value>> {
    let feedback: Feedback = sqlx::query_as(
        "SELECT id, user_id, title, content, feedback_type, reference_id,
                status, admin_notes, created_at FROM feedbacks WHERE id = ?"
    )
    .bind(&feedback_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Góp ý không tồn tại".to_string()))?;

    Ok(Json(json!({ "success": true, "feedback": feedback })))
}

pub async fn update_feedback(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(feedback_id): Path<String>,
    Json(body): Json<UpdateFeedbackRequest>,
) -> AppResult<Json<Value>> {
    if let Some(ref status) = body.status {
        let valid = ["pending", "reviewed", "resolved"];
        if !valid.contains(&status.as_str()) {
            return Err(AppError::BadRequest("Trạng thái không hợp lệ".to_string()));
        }
    }

    sqlx::query(
        "UPDATE feedbacks
         SET status = COALESCE(?, status),
             admin_notes = COALESCE(?, admin_notes)
         WHERE id = ?"
    )
    .bind(body.status.as_deref())
    .bind(body.admin_notes.as_deref())
    .bind(&feedback_id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật góp ý thành công!" })))
}
