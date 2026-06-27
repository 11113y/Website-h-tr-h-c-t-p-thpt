use axum::{extract::State, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde_json::{json, Value};
use sqlx::MySqlPool;
use std::env;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::AuthUser,
    models::user::{
        Claims, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest,
        UserPublic, User,
    },
};

/// POST /api/auth/register
pub async fn register(
    State(pool): State<MySqlPool>,
    Json(body): Json<RegisterRequest>,
) -> AppResult<Json<Value>> {
    if body.username.trim().is_empty() || body.email.trim().is_empty() || body.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Username, email và mật khẩu (tối thiểu 6 ký tự) là bắt buộc".to_string(),
        ));
    }

    // Kiểm tra trùng email/username
    let existing: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE email = ? OR username = ?"
    )
    .bind(body.email.trim().to_lowercase())
    .bind(body.username.trim())
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    if existing.0 > 0 {
        return Err(AppError::Conflict("Email hoặc tên đăng nhập đã được sử dụng".to_string()));
    }

    let password_hash = hash(body.password.as_bytes(), DEFAULT_COST)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("bcrypt error: {}", e)))?;

    let new_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)"
    )
    .bind(&new_id)
    .bind(body.username.trim())
    .bind(body.email.trim().to_lowercase())
    .bind(&password_hash)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    let user = fetch_user_by_id(&pool, &new_id).await?;
    let token = generate_token(&user.id, &user.role)?;
    let user_public = fetch_user_public(&pool, user).await?;

    Ok(Json(json!({
        "success": true,
        "message": "Đăng ký thành công!",
        "token": token,
        "user": user_public,
    })))
}

/// POST /api/auth/login
pub async fn login(
    State(pool): State<MySqlPool>,
    Json(body): Json<LoginRequest>,
) -> AppResult<Json<Value>> {
    let user = fetch_user_by_email(&pool, &body.email.trim().to_lowercase()).await
        .map_err(|_| AppError::BadRequest("Email hoặc mật khẩu không chính xác".to_string()))?;

    let valid = verify(body.password.as_bytes(), &user.password_hash)
        .map_err(|_| AppError::BadRequest("Email hoặc mật khẩu không chính xác".to_string()))?;

    if !valid {
        return Err(AppError::BadRequest("Email hoặc mật khẩu không chính xác".to_string()));
    }

    let token = generate_token(&user.id, &user.role)?;
    let user_public = fetch_user_public(&pool, user).await?;

    Ok(Json(json!({
        "success": true,
        "message": "Đăng nhập thành công!",
        "token": token,
        "user": user_public,
    })))
}

/// POST /api/auth/forgot-password
pub async fn forgot_password(
    State(pool): State<MySqlPool>,
    Json(body): Json<ForgotPasswordRequest>,
) -> AppResult<Json<Value>> {
    let email = body.email.trim().to_lowercase();
    if email.is_empty() {
        return Err(AppError::BadRequest("Email là bắt buộc".to_string()));
    }

    let user = fetch_user_by_email(&pool, &email).await.ok();
    let mut reset_url: Option<String> = None;

    if let Some(user) = user {
        let id = Uuid::new_v4().to_string();
        let token = Uuid::new_v4().to_string();
        let expires_at = (chrono::Utc::now() + chrono::Duration::minutes(30)).naive_utc();

        sqlx::query(
            "INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&user.id)
        .bind(&token)
        .bind(expires_at)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

        let frontend_url = env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
        reset_url = Some(format!("{}/reset-password?token={}", frontend_url.trim_end_matches('/'), token));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Nếu email tồn tại, hệ thống đã tạo liên kết đặt lại mật khẩu.",
        "reset_url": reset_url,
    })))
}

/// POST /api/auth/reset-password
pub async fn reset_password(
    State(pool): State<MySqlPool>,
    Json(body): Json<ResetPasswordRequest>,
) -> AppResult<Json<Value>> {
    let token = body.token.trim();
    if token.is_empty() {
        return Err(AppError::BadRequest("Token đặt lại mật khẩu không hợp lệ".to_string()));
    }
    if body.password.len() < 6 {
        return Err(AppError::BadRequest("Mật khẩu mới phải có ít nhất 6 ký tự".to_string()));
    }

    let row: Option<(String, chrono::NaiveDateTime)> = sqlx::query_as(
        "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ? AND used_at IS NULL"
    )
    .bind(token)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    let (user_id, expires_at) = row
        .ok_or_else(|| AppError::BadRequest("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng".to_string()))?;

    if expires_at < chrono::Utc::now().naive_utc() {
        return Err(AppError::BadRequest("Liên kết đặt lại mật khẩu đã hết hạn".to_string()));
    }

    let password_hash = hash(body.password.as_bytes(), DEFAULT_COST)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("bcrypt error: {}", e)))?;

    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&password_hash)
        .bind(&user_id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    sqlx::query("UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?")
        .bind(token)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    })))
}

/// GET /api/auth/me
pub async fn get_me(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let user = fetch_user_by_id(&pool, &claims.sub).await?;
    let user_public = fetch_user_public(&pool, user).await?;
    Ok(Json(json!({ "success": true, "user": user_public })))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

pub async fn fetch_user_by_id(pool: &MySqlPool, id: &str) -> AppResult<User> {
    sqlx::query_as::<_, User>(
        "SELECT id, username, email, password_hash, role, points, streak_count,
                last_active_at, completed_lessons, unlocked_lessons, unlocked_documents, completed_materials, created_at
         FROM users WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Tài khoản không tồn tại".to_string()))
}

pub async fn fetch_user_by_email(pool: &MySqlPool, email: &str) -> AppResult<User> {
    sqlx::query_as::<_, User>(
        "SELECT id, username, email, password_hash, role, points, streak_count,
                last_active_at, completed_lessons, unlocked_lessons, unlocked_documents, completed_materials, created_at
         FROM users WHERE email = ?"
    )
    .bind(email)
    .fetch_optional(pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Tài khoản không tồn tại".to_string()))
}

pub async fn fetch_user_public(pool: &MySqlPool, user: User) -> AppResult<UserPublic> {
    let today = chrono::Utc::now().date_naive();
    let last = user.last_active_at.map(|dt| dt.date());
    
    let (streak_status, active_streak) = match last {
        None => ("safe", 0),
        Some(last_date) => {
            let diff = (today - last_date).num_days();
            if diff <= 0 {
                ("safe", user.streak_count)
            } else if diff == 1 {
                ("warning", user.streak_count)
            } else {
                ("lost", 0)
            }
        }
    };
    
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT value FROM settings WHERE `key` = 'restore_streak_cost'"
    )
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    let streak_cost = row.and_then(|(val,)| val.parse::<i32>().ok()).unwrap_or(50);

    Ok(UserPublic::new(
        user.clone(),
        user.completed_lessons.0,
        user.unlocked_lessons.0,
        user.unlocked_documents.0,
        user.completed_materials.0,
        streak_status.to_string(),
        streak_cost,
        active_streak,
    ))
}

fn generate_token(user_id: &str, role: &str) -> AppResult<String> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "fallback_secret".to_string());
    let now = chrono::Utc::now().timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        iat: now,
        exp: now + 7 * 24 * 3600,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(anyhow::anyhow!("JWT encode error: {}", e)))
}
