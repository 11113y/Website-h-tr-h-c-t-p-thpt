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
    models::formula::{CreateFormulaRequest, UpdateFormulaRequest, FormulaWithCreator},
};

const FORMULA_CONTRIBUTION_REWARD_POINTS: i32 = 100;

/// GET /api/admin/formulas
pub async fn get_admin_formulas(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<Value>> {
    let formulas: Vec<FormulaWithCreator> = sqlx::query_as(
        "SELECT f.id, f.title, f.latex, f.image_url, f.description, f.status, f.created_by, u.username as creator_username, f.created_at
         FROM formulas f
         LEFT JOIN users u ON f.created_by = u.id
         ORDER BY f.created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "formulas": formulas })))
}

/// POST /api/admin/formulas
pub async fn create_admin_formula(
    State(pool): State<MySqlPool>,
    AdminUser(claims): AdminUser,
    Json(body): Json<CreateFormulaRequest>,
) -> AppResult<Json<Value>> {
    if body.title.trim().is_empty() {
        return Err(AppError::BadRequest("Tiêu đề không được để trống".to_string()));
    }

    let id = Uuid::new_v4().to_string();
    let status = body.status.unwrap_or_else(|| "approved".to_string());

    sqlx::query(
        "INSERT INTO formulas (id, title, latex, image_url, description, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(body.title.trim())
    .bind(&body.latex)
    .bind(&body.image_url)
    .bind(&body.description)
    .bind(&status)
    .bind(&claims.sub)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Tạo công thức thành công!", "id": id })))
}

/// PUT /api/admin/formulas/:id
pub async fn update_admin_formula(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateFormulaRequest>,
) -> AppResult<Json<Value>> {
    // Check if exists
    let exists: Option<(String,)> = sqlx::query_as("SELECT id FROM formulas WHERE id = ?")
        .bind(&id)
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;

    if exists.is_none() {
        return Err(AppError::NotFound("Công thức không tồn tại".to_string()));
    }

    if let Some(ref title) = body.title {
        if title.trim().is_empty() {
            return Err(AppError::BadRequest("Tiêu đề không được để trống".to_string()));
        }
    }

    sqlx::query(
        "UPDATE formulas
         SET title = COALESCE(?, title),
             latex = ?,
             image_url = ?,
             description = ?,
             status = COALESCE(?, status)
         WHERE id = ?"
    )
    .bind(body.title.as_deref().map(|t| t.trim()))
    .bind(&body.latex)
    .bind(&body.image_url)
    .bind(&body.description)
    .bind(body.status.as_deref())
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật công thức thành công!" })))
}

/// DELETE /api/admin/formulas/:id
pub async fn delete_admin_formula(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query("DELETE FROM formulas WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Công thức không tồn tại".to_string()));
    }

    Ok(Json(json!({ "success": true, "message": "Xóa công thức thành công!" })))
}

/// POST /api/admin/formulas/:id/approve
pub async fn approve_formula(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    let existing: Option<(String, Option<String>, bool)> = sqlx::query_as(
        "SELECT status, created_by, reward_granted FROM formulas WHERE id = ?"
    )
    .bind(&id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    let (previous_status, created_by, reward_granted) = existing
        .ok_or_else(|| AppError::NotFound("Công thức không tồn tại".to_string()))?;
    let should_reward = previous_status != "approved" && !reward_granted && created_by.is_some();

    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    sqlx::query("UPDATE formulas SET status = 'approved', reward_granted = ? WHERE id = ?")
        .bind(should_reward)
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    if should_reward {
        if let Some(user_id) = created_by {
            sqlx::query("UPDATE users SET points = points + ?, last_active_at = NOW() WHERE id = ?")
                .bind(FORMULA_CONTRIBUTION_REWARD_POINTS)
                .bind(user_id)
                .execute(&mut *tx)
                .await
                .map_err(AppError::Database)?;
        }
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Đã duyệt công thức!",
        "points_earned": if should_reward { FORMULA_CONTRIBUTION_REWARD_POINTS } else { 0 },
    })))
}

/// POST /api/admin/formulas/:id/reject
pub async fn reject_formula(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query("UPDATE formulas SET status = 'rejected' WHERE id = ?")
        .bind(&id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Công thức không tồn tại".to_string()));
    }

    Ok(Json(json!({ "success": true, "message": "Đã từ chối công thức!" })))
}

/// GET /api/formulas (Public)
pub async fn get_public_formulas(
    State(pool): State<MySqlPool>,
) -> AppResult<Json<Value>> {
    let formulas: Vec<FormulaWithCreator> = sqlx::query_as(
        "SELECT f.id, f.title, f.latex, f.image_url, f.description, f.status, f.created_by, u.username as creator_username, f.created_at
         FROM formulas f
         LEFT JOIN users u ON f.created_by = u.id
         WHERE f.status = 'approved'
         ORDER BY f.created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "formulas": formulas })))
}

/// POST /api/formulas (Student contribution)
pub async fn user_submit_formula(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<CreateFormulaRequest>,
) -> AppResult<Json<Value>> {
    if body.title.trim().is_empty() {
        return Err(AppError::BadRequest("Tiêu đề không được để trống".to_string()));
    }

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO formulas (id, title, latex, image_url, description, status, created_by)
         VALUES (?, ?, ?, ?, ?, 'pending', ?)"
    )
    .bind(&id)
    .bind(body.title.trim())
    .bind(&body.latex)
    .bind(&body.image_url)
    .bind(&body.description)
    .bind(&claims.sub)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Gửi đóng góp công thức thành công! Vui lòng chờ admin phê duyệt.",
        "points_earned": 0,
        "id": id
    })))
}
