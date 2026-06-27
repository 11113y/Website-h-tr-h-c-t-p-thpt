use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::AuthUser,
    models::subject::{Chapter, Lesson, LessonSummary, Subject, StudyMaterial, StudyMaterialSummary},
};

// ── Subjects ──────────────────────────────────────────────────────────────────

pub async fn get_subjects(
    State(pool): State<MySqlPool>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let grade = params.get("grade").and_then(|g| g.parse::<i32>().ok());

    let subjects: Vec<(i32, i32, String, String, i32, i64)> = if let Some(g) = grade {
        sqlx::query_as(
            "SELECT s.id, s.grade, s.name, s.slug, s.order_index, COUNT(c.id) as chapter_count \
             FROM subjects s LEFT JOIN chapters c ON c.subject_id = s.id \
             WHERE s.grade = ? GROUP BY s.id ORDER BY s.order_index"
        )
        .bind(g)
        .fetch_all(&pool)
        .await
    } else {
        sqlx::query_as(
            "SELECT s.id, s.grade, s.name, s.slug, s.order_index, COUNT(c.id) as chapter_count \
             FROM subjects s LEFT JOIN chapters c ON c.subject_id = s.id \
             GROUP BY s.id ORDER BY s.grade, s.order_index"
        )
        .fetch_all(&pool)
        .await
    }
    .map_err(AppError::Database)?;

    let subjects_json: Vec<Value> = subjects.into_iter().map(|(id, grade, name, slug, order_index, chapter_count)| {
        json!({
            "id": id,
            "grade": grade,
            "name": name,
            "slug": slug,
            "order_index": order_index,
            "chapterCount": chapter_count,
        })
    }).collect();

    Ok(Json(json!({ "success": true, "subjects": subjects_json })))
}


// ── Chapters ──────────────────────────────────────────────────────────────────

pub async fn get_chapters(
    State(pool): State<MySqlPool>,
    Path(subject_id): Path<i32>,
) -> AppResult<Json<Value>> {
    let chapters: Vec<Chapter> = sqlx::query_as(
        "SELECT id, subject_id, name, slug, order_index FROM chapters
         WHERE subject_id = ? ORDER BY order_index"
    )
    .bind(subject_id)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "chapters": chapters })))
}

// ── Lessons ───────────────────────────────────────────────────────────────────

pub async fn get_lessons(
    State(pool): State<MySqlPool>,
    Path(chapter_id): Path<String>,
) -> AppResult<Json<Value>> {
    let lessons: Vec<LessonSummary> = sqlx::query_as(
        "SELECT id, chapter_id, title, slug, is_vip, points_required, order_index, created_at, pdf_url
         FROM lessons WHERE chapter_id = ? ORDER BY order_index"
    )
    .bind(&chapter_id)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "lessons": lessons })))
}

pub async fn get_lesson_detail(
    State(pool): State<MySqlPool>,
    Path(lesson_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let lesson: Lesson = sqlx::query_as(
        "SELECT id, chapter_id, title, slug, content, is_vip, points_required, order_index, created_at, pdf_url
         FROM lessons WHERE id = ?"
    )
    .bind(&lesson_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Bài học không tồn tại".to_string()))?;

    let user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let mut completed = false;

    if lesson.is_vip {
        let already_unlocked = user.unlocked_lessons.0.contains(&lesson_id);
        if !already_unlocked {
            return Ok(Json(json!({
                "success": false,
                "locked": true,
                "points_required": lesson.points_required,
                "message": format!("Cần {} điểm để mở khóa bài học này", lesson.points_required),
            })));
        }
    }

    completed = user.completed_lessons.0.contains(&lesson_id);

    Ok(Json(json!({ "success": true, "lesson": lesson, "completed": completed })))
}

pub async fn unlock_lesson(
    State(pool): State<MySqlPool>,
    Path(lesson_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let row: Option<(bool, i32)> = sqlx::query_as(
        "SELECT is_vip, points_required FROM lessons WHERE id = ?"
    )
    .bind(&lesson_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    let (is_vip, cost) = row.ok_or_else(|| AppError::NotFound("Bài học không tồn tại".to_string()))?;

    if !is_vip {
        return Err(AppError::BadRequest("Bài học này không yêu cầu mở khóa".to_string()));
    }

    let mut user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let already_unlocked = user.unlocked_lessons.0.contains(&lesson_id);

    if already_unlocked {
        return Ok(Json(json!({ "success": true, "message": "Bài học đã được mở khóa trước đó" })));
    }

    if user.points < cost {
        return Err(AppError::InsufficientPoints);
    }

    user.points -= cost;
    user.unlocked_lessons.0.push(lesson_id.clone());

    sqlx::query(
        "UPDATE users SET points = ?, unlocked_lessons = ?, last_active_at = NOW() WHERE id = ?"
    )
    .bind(user.points)
    .bind(&user.unlocked_lessons)
    .bind(&user.id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Mở khóa bài học thành công!",
        "points_spent": cost,
    })))
}

pub async fn complete_lesson(
    State(pool): State<MySqlPool>,
    Path(lesson_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    // Kiểm tra bài học tồn tại
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM lessons WHERE id = ?")
        .bind(&lesson_id)
        .fetch_one(&pool)
        .await
        .map_err(AppError::Database)?;

    if exists.0 == 0 {
        return Err(AppError::NotFound("Bài học không tồn tại".to_string()));
    }

    let mut user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let already_completed = user.completed_lessons.0.contains(&lesson_id);

    if !already_completed {
        user.completed_lessons.0.push(lesson_id.clone());

        sqlx::query(
            "UPDATE users SET completed_lessons = ?, last_active_at = NOW() WHERE id = ?"
        )
        .bind(&user.completed_lessons)
        .bind(&user.id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    }

    Ok(Json(json!({
        "success": true,
        "message": "Đánh dấu hoàn thành bài học thành công!",
    })))
}

// ── Study Materials ────────────────────────────────────────────────────────────

pub async fn get_study_materials(
    State(pool): State<MySqlPool>,
    Path(lesson_id): Path<String>,
) -> AppResult<Json<Value>> {
    let materials: Vec<StudyMaterialSummary> = sqlx::query_as(
        "SELECT id, lesson_id, title, slug, is_vip, points_required, order_index, created_at, pdf_url, video_url
         FROM study_materials WHERE lesson_id = ? ORDER BY created_at DESC"
    )
    .bind(&lesson_id)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "materials": materials })))
}

pub async fn get_study_material_detail(
    State(pool): State<MySqlPool>,
    Path(material_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let material: StudyMaterial = sqlx::query_as(
        "SELECT id, lesson_id, title, slug, content, is_vip, points_required, order_index, created_at, pdf_url, video_url
         FROM study_materials WHERE id = ?"
    )
    .bind(&material_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Tài liệu học tập không tồn tại".to_string()))?;

    let user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let mut completed = false;

    if material.is_vip {
        let already_unlocked = user.unlocked_lessons.0.contains(&material_id);
        if !already_unlocked {
            return Ok(Json(json!({
                "success": false,
                "locked": true,
                "points_required": material.points_required,
                "message": format!("Cần {} điểm để mở khóa tài liệu này", material.points_required),
            })));
        }
    }

    completed = user.completed_materials.0.contains(&material_id);

    Ok(Json(json!({ "success": true, "material": material, "completed": completed })))
}

pub async fn unlock_study_material(
    State(pool): State<MySqlPool>,
    Path(material_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let row: Option<(bool, i32)> = sqlx::query_as(
        "SELECT is_vip, points_required FROM study_materials WHERE id = ?"
    )
    .bind(&material_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    let (is_vip, cost) = row.ok_or_else(|| AppError::NotFound("Tài liệu học tập không tồn tại".to_string()))?;

    if !is_vip {
        return Err(AppError::BadRequest("Tài liệu này không yêu cầu mở khóa".to_string()));
    }

    let mut user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let already_unlocked = user.unlocked_lessons.0.contains(&material_id);

    if already_unlocked {
        return Ok(Json(json!({ "success": true, "message": "Tài liệu đã được mở khóa trước đó" })));
    }

    if user.points < cost {
        return Err(AppError::InsufficientPoints);
    }

    user.points -= cost;
    user.unlocked_lessons.0.push(material_id.clone());

    sqlx::query(
        "UPDATE users SET points = ?, unlocked_lessons = ?, last_active_at = NOW() WHERE id = ?"
    )
    .bind(user.points)
    .bind(&user.unlocked_lessons)
    .bind(&user.id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Mở khóa tài liệu thành công!",
        "points_spent": cost,
    })))
}

pub async fn complete_study_material(
    State(pool): State<MySqlPool>,
    Path(material_id): Path<String>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let exists: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM study_materials WHERE id = ?")
        .bind(&material_id)
        .fetch_one(&pool)
        .await
        .map_err(AppError::Database)?;

    if exists.0 == 0 {
        return Err(AppError::NotFound("Tài liệu học tập không tồn tại".to_string()));
    }

    let mut user = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await?;
    let already_completed = user.completed_materials.0.contains(&material_id);

    if !already_completed {
        user.completed_materials.0.push(material_id.clone());

        sqlx::query(
            "UPDATE users SET completed_materials = ?, last_active_at = NOW() WHERE id = ?"
        )
        .bind(&user.completed_materials)
        .bind(&user.id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;
    }

    Ok(Json(json!({
        "success": true,
        "message": "Đánh dấu hoàn thành tài liệu thành công!",
    })))
}

pub async fn get_public_stats(
    State(pool): State<MySqlPool>,
) -> AppResult<Json<Value>> {
    let (user_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE role = 'student'"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (exam_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM exams"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (attempt_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM user_exam_results"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "total_students": user_count,
        "total_exams": exam_count,
        "total_attempts": attempt_count,
    })))
}
