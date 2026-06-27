use axum::{extract::State, Json};
use bcrypt::{hash, verify, DEFAULT_COST};
use serde_json::{json, Value};
use sqlx::MySqlPool;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::{AuthUser, OptionalAuthUser},
    models::{
        user::{ChangePasswordRequest, LeaderboardEntry, UpdateProfileRequest, UserPublic},
        exam::AnswerDetail,
    },
    handlers::auth::{fetch_user_by_id, fetch_user_public},
};

/// PUT /api/users/profile
pub async fn update_profile(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<UpdateProfileRequest>,
) -> AppResult<Json<Value>> {
    if let Some(ref username) = body.username {
        if username.trim().is_empty() {
            return Err(AppError::BadRequest("Username không được để trống".to_string()));
        }
        let exists: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM users WHERE username = ? AND id != ?"
        )
        .bind(username.trim())
        .bind(&claims.sub)
        .fetch_one(&pool)
        .await
        .map_err(AppError::Database)?;

        if exists.0 > 0 {
            return Err(AppError::Conflict("Tên đăng nhập đã được sử dụng".to_string()));
        }

        sqlx::query("UPDATE users SET username = ? WHERE id = ?")
            .bind(username.trim())
            .bind(&claims.sub)
            .execute(&pool)
            .await
            .map_err(AppError::Database)?;
    }

    let user = fetch_user_by_id(&pool, &claims.sub).await?;
    let user_public = fetch_user_public(&pool, user).await?;
    Ok(Json(json!({ "success": true, "user": user_public })))
}

/// PUT /api/users/change-password
pub async fn change_password(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<ChangePasswordRequest>,
) -> AppResult<Json<Value>> {
    if body.new_password.len() < 6 {
        return Err(AppError::BadRequest("Mật khẩu mới tối thiểu 6 ký tự".to_string()));
    }

    let user = fetch_user_by_id(&pool, &claims.sub).await?;

    let valid = verify(body.current_password.as_bytes(), &user.password_hash)
        .map_err(|_| AppError::BadRequest("Mật khẩu hiện tại không chính xác".to_string()))?;
    if !valid {
        return Err(AppError::BadRequest("Mật khẩu hiện tại không chính xác".to_string()));
    }

    let new_hash = hash(body.new_password.as_bytes(), DEFAULT_COST)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("{}", e)))?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(new_hash)
        .bind(&claims.sub)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Đổi mật khẩu thành công!" })))
}

/// GET /api/users/stats
pub async fn get_stats(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let user = fetch_user_by_id(&pool, &claims.sub).await?;

    let total_attempts: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM user_exam_results WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    let user_public = fetch_user_public(&pool, user.clone()).await?;

    Ok(Json(json!({
        "success": true,
        "user": user_public,
        "streak": user_public.active_streak,
        "points": user_public.points,
        "totalAttempts": total_attempts,
        "completedLessons": user_public.completed_lessons.len() + user_public.completed_materials.len(),
        "streakStatus": user_public.streak_status,
        "streakCost": user_public.streak_cost,
    })))
}

/// GET /api/users/analytics
pub async fn get_analytics(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    // Lấy tất cả câu trả lời của user từ cột JSON `answers` trong `user_exam_results`
    let rows: Vec<(sqlx::types::Json<Vec<AnswerDetail>>,)> = sqlx::query_as(
        "SELECT answers FROM user_exam_results WHERE user_id = ?"
    )
    .bind(&claims.sub)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let mut results: Vec<(String, bool)> = Vec::new();
    for (answers_json,) in rows {
        for ans in &answers_json.0 {
            results.push((ans.question_id.clone(), ans.is_correct));
        }
    }

    // Lấy câu hỏi để tra chapter_id
    let questions: Vec<(String, Option<String>)> = sqlx::query_as(
        "SELECT id, chapter_id FROM questions"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let q_chapter: std::collections::HashMap<String, Option<String>> = questions
        .into_iter()
        .map(|(id, cid)| (id, cid))
        .collect();

    let mut chapter_stats: std::collections::HashMap<String, (i32, i32)> =
        std::collections::HashMap::new();

    for (qid, is_correct) in &results {
        if let Some(Some(chapter_id)) = q_chapter.get(qid) {
            let entry = chapter_stats.entry(chapter_id.clone()).or_insert((0, 0));
            entry.1 += 1;
            if *is_correct {
                entry.0 += 1;
            }
        }
    }

    let chapters: Vec<(String, String)> = sqlx::query_as(
        "SELECT id, name FROM chapters"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let radar: Vec<Value> = chapters
        .iter()
        .filter_map(|(cid, cname)| {
            chapter_stats.get(cid).map(|(correct, total)| {
                let accuracy = if *total > 0 {
                    (*correct as f64 / *total as f64) * 100.0
                } else {
                    0.0
                };
                json!({
                    "chapter_id": cid,
                    "chapter_name": cname,
                    "correct": correct,
                    "total": total,
                    "accuracy": (accuracy * 10.0).round() / 10.0,
                    "status": if accuracy >= 80.0 { "strong" } else if accuracy < 50.0 { "weak" } else { "average" }
                })
            })
        })
        .collect();

    Ok(Json(json!({ "success": true, "radar": radar })))
}

/// GET /api/users/leaderboard
pub async fn get_leaderboard(
    State(pool): State<MySqlPool>,
    OptionalAuthUser(_): OptionalAuthUser,
) -> AppResult<Json<Value>> {
    let by_points: Vec<LeaderboardEntry> = sqlx::query_as(
        "SELECT id, username, points, streak_count FROM users ORDER BY points DESC LIMIT 20"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let by_streak: Vec<LeaderboardEntry> = sqlx::query_as(
        "SELECT id, username, points, streak_count FROM users ORDER BY streak_count DESC LIMIT 20"
    )
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "by_points": by_points,
        "by_streak": by_streak,
    })))
}

/// GET /api/users/history
pub async fn get_attempts_history(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let history: Vec<(String, String, String, f32, i32, i32, chrono::NaiveDateTime)> =
        sqlx::query_as(
            "SELECT r.id, r.exam_id, e.title, r.score, r.points_earned,
                    r.time_spent_seconds, r.completed_at
             FROM user_exam_results r
             JOIN exams e ON e.id = r.exam_id
             WHERE r.user_id = ?
             ORDER BY r.completed_at DESC"
        )
        .bind(&claims.sub)
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;

    let data: Vec<Value> = history
        .iter()
        .map(|(id, exam_id, exam_title, score, points, time_spent, completed_at)| {
            json!({
                "id": id,
                "exam_id": exam_id,
                "exam_title": exam_title,
                "score": score,
                "points_earned": points,
                "time_spent_seconds": time_spent,
                "completed_at": completed_at,
            })
        })
        .collect();

    Ok(Json(json!({ "success": true, "history": data })))
}

/// POST /api/users/restore-streak
pub async fn restore_streak(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let restore_cost = get_restore_streak_cost(&pool).await;

    let user = fetch_user_by_id(&pool, &claims.sub).await?;

    if user.points < restore_cost {
        return Err(AppError::InsufficientPoints);
    }

    sqlx::query(
        "UPDATE users SET points = points - ?, last_active_at = NOW() WHERE id = ?"
    )
    .bind(restore_cost)
    .bind(&claims.sub)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Đã khôi phục streak!",
        "points_spent": restore_cost,
    })))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

use crate::models::user::User;

pub async fn get_restore_streak_cost(pool: &MySqlPool) -> i32 {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT value FROM settings WHERE `key` = 'restore_streak_cost'"
    )
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    row.and_then(|(val,)| val.parse::<i32>().ok()).unwrap_or(50)
}

pub async fn update_streak(pool: &MySqlPool, user: &User) -> AppResult<()> {
    let today = chrono::Utc::now().date_naive();

    match user.last_active_at {
        None => {
            sqlx::query(
                "UPDATE users SET streak_count = 1, last_active_at = NOW() WHERE id = ?"
            )
            .bind(&user.id)
            .execute(pool)
            .await
            .map_err(AppError::Database)?;
        }
        Some(last) => {
            let diff = (today - last.date()).num_days();
            match diff {
                0 => {}
                1 => {
                    sqlx::query(
                        "UPDATE users SET streak_count = streak_count + 1,
                         last_active_at = NOW() WHERE id = ?"
                    )
                    .bind(&user.id)
                    .execute(pool)
                    .await
                    .map_err(AppError::Database)?;
                }
                _ => {
                    sqlx::query(
                        "UPDATE users SET streak_count = 1, last_active_at = NOW() WHERE id = ?"
                    )
                    .bind(&user.id)
                    .execute(pool)
                    .await
                    .map_err(AppError::Database)?;
                }
            }
        }
    }

    Ok(())
}
