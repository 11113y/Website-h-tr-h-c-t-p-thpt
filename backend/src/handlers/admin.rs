use axum::{
    extract::{Path, State, Query},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::AdminUser,
    models::{
        document::{CreateArticleRequest, CreateDocumentRequest, UpdateArticleRequest},
        exam::{CreateExamRequest, CreateQuestionRequest, Question, QuestionOption},
        subject::{CreateChapterRequest, CreateLessonRequest, CreateSubjectRequest, UpdateLessonRequest, UpdateSubjectRequest, CreateStudyMaterialRequest, UpdateStudyMaterialRequest},
    },
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

pub async fn get_dashboard(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<Value>> {
    let (user_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE role = 'student'"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (lesson_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM lessons"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (exam_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM exams"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (attempt_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM user_exam_results"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let (pending_feedback,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM feedbacks WHERE status = 'pending'"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    // Growth attempts trend (last 30 days)
    let growth_attempts_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT DATE_FORMAT(completed_at, '%Y-%m-%d') as date_str, COUNT(*) as count \
         FROM user_exam_results \
         WHERE completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) \
         GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d') \
         ORDER BY date_str ASC"
    ).fetch_all(&pool).await.map_err(AppError::Database)?;

    // Growth users trend (last 30 days)
    let growth_users_rows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date_str, COUNT(*) as count \
         FROM users \
         WHERE role = 'student' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) \
         GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') \
         ORDER BY date_str ASC"
    ).fetch_all(&pool).await.map_err(AppError::Database)?;

    // Top 5 most attempted exams
    let top_exams_rows: Vec<(String, String, i64)> = sqlx::query_as(
        "SELECT e.id, e.title, COUNT(r.id) as attempt_count \
         FROM exams e \
         JOIN user_exam_results r ON e.id = r.exam_id \
         GROUP BY e.id, e.title \
         ORDER BY attempt_count DESC \
         LIMIT 5"
    ).fetch_all(&pool).await.map_err(AppError::Database)?;

    // Map rows into simple JSON format
    let growth_attempts: Vec<Value> = growth_attempts_rows.into_iter()
        .map(|(date, count)| json!({ "date": date, "count": count }))
        .collect();

    let growth_users: Vec<Value> = growth_users_rows.into_iter()
        .map(|(date, count)| json!({ "date": date, "count": count }))
        .collect();

    let top_exams: Vec<Value> = top_exams_rows.into_iter()
        .map(|(id, title, count)| json!({ "id": id, "title": title, "count": count }))
        .collect();

    Ok(Json(json!({
        "success": true,
        "stats": {
            "total_students": user_count,
            "total_lessons": lesson_count,
            "total_exams": exam_count,
            "total_attempts": attempt_count,
            "pending_feedbacks": pending_feedback,
        },
        "growth_attempts": growth_attempts,
        "growth_users": growth_users,
        "top_exams": top_exams
    })))
}

pub async fn get_reports(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<Value>> {
    let (avg_score,): (Option<f64>,) = sqlx::query_as(
        "SELECT AVG(score) FROM user_exam_results"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    let row: (i64, i64, i64, i64) = sqlx::query_as(
        "SELECT
            SUM(CASE WHEN avg_score >= 8.0 THEN 1 ELSE 0 END),
            SUM(CASE WHEN avg_score >= 6.5 AND avg_score < 8.0 THEN 1 ELSE 0 END),
            SUM(CASE WHEN avg_score >= 5.0 AND avg_score < 6.5 THEN 1 ELSE 0 END),
            SUM(CASE WHEN avg_score < 5.0 THEN 1 ELSE 0 END)
         FROM (SELECT user_id, AVG(score) as avg_score FROM user_exam_results GROUP BY user_id) t"
    ).fetch_one(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "report": {
            "system_avg_score": avg_score.unwrap_or(0.0),
            "classification": {
                "excellent": row.0, "good": row.1, "average": row.2, "weak": row.3,
            }
        }
    })))
}

pub async fn get_all_attempts(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<Value>> {
    let attempts: Vec<(String, String, String, String, String, f32, i32, i32, chrono::NaiveDateTime)> =
        sqlx::query_as(
            "SELECT r.id, r.user_id, u.username, r.exam_id, e.title,
                    r.score, r.points_earned, r.time_spent_seconds, r.completed_at
             FROM user_exam_results r
             JOIN users u ON u.id = r.user_id
             JOIN exams e ON e.id = r.exam_id
             ORDER BY r.completed_at DESC LIMIT 100"
        )
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;

    let data: Vec<Value> = attempts.iter().map(|a| json!({
        "id": a.0, "user_id": a.1, "username": a.2,
        "exam_id": a.3, "exam_title": a.4, "score": a.5,
        "points_earned": a.6, "time_spent_seconds": a.7, "completed_at": a.8,
    })).collect();

    Ok(Json(json!({ "success": true, "attempts": data })))
}

#[derive(serde::Deserialize)]
pub struct GetUsersQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub role: Option<String>,
    pub search: Option<String>,
}

pub async fn get_users(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Query(query): Query<GetUsersQuery>,
) -> AppResult<Json<Value>> {
    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(20);
    let offset = (page.saturating_sub(1)) * limit;

    let role_filter = query.role.as_deref().unwrap_or("");
    let search_filter = query.search.as_deref().unwrap_or("").trim();

    let pattern = format!("%{}%", search_filter);

    let mut count_query = "SELECT COUNT(*) FROM users WHERE 1=1".to_string();
    if !role_filter.is_empty() {
        count_query.push_str(" AND role = ?");
    }
    if !search_filter.is_empty() {
        count_query.push_str(" AND (username LIKE ? OR email LIKE ?)");
    }

    let mut q_count = sqlx::query_scalar::<_, i64>(&count_query);
    if !role_filter.is_empty() {
        q_count = q_count.bind(role_filter);
    }
    if !search_filter.is_empty() {
        q_count = q_count.bind(&pattern).bind(&pattern);
    }
    let total_count: i64 = q_count.fetch_one(&pool).await.map_err(AppError::Database)?;

    let mut select_query = "SELECT id, username, email, role, points, streak_count, created_at FROM users WHERE 1=1".to_string();
    if !role_filter.is_empty() {
        select_query.push_str(" AND role = ?");
    }
    if !search_filter.is_empty() {
        select_query.push_str(" AND (username LIKE ? OR email LIKE ?)");
    }
    select_query.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");

    let mut q_select = sqlx::query_as::<_, (String, String, String, String, i32, i32, chrono::NaiveDateTime)>(&select_query);
    if !role_filter.is_empty() {
        q_select = q_select.bind(role_filter);
    }
    if !search_filter.is_empty() {
        q_select = q_select.bind(&pattern).bind(&pattern);
    }
    q_select = q_select.bind(limit).bind(offset);

    let users = q_select.fetch_all(&pool).await.map_err(AppError::Database)?;

    let data: Vec<Value> = users.iter().map(|u| json!({
        "id": u.0, "username": u.1, "email": u.2, "role": u.3,
        "points": u.4, "streak_count": u.5, "created_at": u.6,
    })).collect();

    Ok(Json(json!({
        "success": true,
        "users": data,
        "total": total_count,
        "page": page,
        "limit": limit,
    })))
}

// ── Subjects ──────────────────────────────────────────────────────────────────

pub async fn create_subject(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateSubjectRequest>,
) -> AppResult<Json<Value>> {
    if body.grade < 1 || body.grade > 12 {
        return Err(AppError::BadRequest("Khối lớp phải từ 1 đến 12".to_string()));
    }

    // Check duplicate grade
    let grade_exists: Option<i32> = sqlx::query_scalar("SELECT grade FROM subjects WHERE grade = ?")
        .bind(body.grade)
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;

    if grade_exists.is_some() {
        return Err(AppError::BadRequest("Khối lớp này đã tồn tại".to_string()));
    }

    sqlx::query(
        "INSERT INTO subjects (grade, name, slug, order_index) VALUES (?, ?, ?, ?)"
    )
    .bind(body.grade).bind(body.name.trim()).bind(body.slug.trim())
    .bind(body.order_index.unwrap_or(0))
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Tạo chuyên đề thành công!" })))
}

pub async fn update_subject(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<i32>,
    Json(body): Json<UpdateSubjectRequest>,
) -> AppResult<Json<Value>> {
    if let Some(grade) = body.grade {
        if grade < 1 || grade > 12 {
            return Err(AppError::BadRequest("Khối lớp phải từ 1 đến 12".to_string()));
        }
        // Check duplicate grade
        let grade_exists: Option<i32> = sqlx::query_scalar("SELECT grade FROM subjects WHERE grade = ? AND id != ?")
            .bind(grade)
            .bind(id)
            .fetch_optional(&pool)
            .await
            .map_err(AppError::Database)?;

        if grade_exists.is_some() {
            return Err(AppError::BadRequest("Khối lớp này đã tồn tại".to_string()));
        }
    }

    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    if let Some(ref name) = body.name {
        sqlx::query("UPDATE subjects SET name = ? WHERE id = ?")
            .bind(name.trim())
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(ref slug) = body.slug {
        sqlx::query("UPDATE subjects SET slug = ? WHERE id = ?")
            .bind(slug.trim())
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(grade) = body.grade {
        sqlx::query("UPDATE subjects SET grade = ? WHERE id = ?")
            .bind(grade)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(order_index) = body.order_index {
        sqlx::query("UPDATE subjects SET order_index = ? WHERE id = ?")
            .bind(order_index)
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật chuyên đề thành công!" })))
}

pub async fn delete_subject(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<i32>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM subjects WHERE id = ?")
        .bind(id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa chuyên đề" })))
}

// ── Chapters ──────────────────────────────────────────────────────────────────

pub async fn create_chapter(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateChapterRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO chapters (id, subject_id, name, slug, order_index) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(body.subject_id).bind(body.name.trim())
    .bind(body.slug.trim()).bind(body.order_index.unwrap_or(0))
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo chương học thành công!" })))
}

pub async fn delete_chapter(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM chapters WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa chương học" })))
}

pub async fn update_chapter(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<CreateChapterRequest>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "UPDATE chapters SET name = ?, slug = ?, order_index = ? WHERE id = ?"
    )
    .bind(body.name.trim())
    .bind(body.slug.trim())
    .bind(body.order_index.unwrap_or(0))
    .bind(&id)
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật chuyên đề thành công!" })))
}

// ── Lessons ───────────────────────────────────────────────────────────────────

pub async fn create_lesson(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateLessonRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO lessons (id, chapter_id, title, slug, content, is_vip, points_required, order_index, pdf_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(&body.chapter_id).bind(body.title.trim()).bind(body.slug.trim())
    .bind(&body.content).bind(body.is_vip.unwrap_or(false))
    .bind(body.points_required.unwrap_or(0)).bind(body.order_index.unwrap_or(0))
    .bind(body.pdf_url.as_deref())
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo bài học thành công!" })))
}

pub async fn update_lesson(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateLessonRequest>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "UPDATE lessons SET
         chapter_id = COALESCE(?, chapter_id),
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         is_vip = COALESCE(?, is_vip),
         points_required = COALESCE(?, points_required),
         order_index = COALESCE(?, order_index),
         pdf_url = COALESCE(?, pdf_url)
         WHERE id = ?"
    )
    .bind(body.chapter_id.as_deref())
    .bind(body.title.as_deref())
    .bind(body.content.as_deref())
    .bind(body.is_vip)
    .bind(body.points_required)
    .bind(body.order_index)
    .bind(body.pdf_url.as_deref())
    .bind(&id)
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật bài học thành công!" })))
}

pub async fn delete_lesson(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM lessons WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa bài học" })))
}

#[derive(serde::Deserialize)]
pub struct StudyMaterialsQuery {
    pub lesson_id: Option<String>,
    pub chapter_id: Option<String>,
    pub subject_id: Option<i32>,
}

pub async fn get_all_study_materials(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Query(params): Query<StudyMaterialsQuery>,
) -> AppResult<Json<Value>> {
    let mut sql = "SELECT id, lesson_id, title, slug, content, is_vip, points_required, order_index, created_at, pdf_url, video_url
                   FROM study_materials".to_string();
    let mut conditions = Vec::new();

    if params.lesson_id.is_some() {
        conditions.push("lesson_id = ?");
    } else if params.chapter_id.is_some() {
        conditions.push("lesson_id IN (SELECT id FROM lessons WHERE chapter_id = ?)");
    } else if params.subject_id.is_some() {
        conditions.push("lesson_id IN (SELECT l.id FROM lessons l JOIN chapters c ON l.chapter_id = c.id WHERE c.subject_id = ?)");
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }

    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, crate::models::subject::StudyMaterial>(&sql);

    if let Some(les_id) = &params.lesson_id {
        query = query.bind(les_id);
    } else if let Some(ch_id) = &params.chapter_id {
        query = query.bind(ch_id);
    } else if let Some(sub_id) = params.subject_id {
        query = query.bind(sub_id);
    }

    let materials: Vec<crate::models::subject::StudyMaterial> = query
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "materials": materials })))
}

// ── Study Materials ────────────────────────────────────────────────────────────

pub async fn create_study_material(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateStudyMaterialRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO study_materials (id, lesson_id, title, slug, content, is_vip, points_required, order_index, pdf_url, video_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(&body.lesson_id).bind(body.title.trim()).bind(body.slug.trim())
    .bind(&body.content).bind(body.is_vip.unwrap_or(false))
    .bind(body.points_required.unwrap_or(0)).bind(body.order_index.unwrap_or(0))
    .bind(body.pdf_url.as_deref()).bind(body.video_url.as_deref())
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo tài liệu học tập thành công!" })))
}

pub async fn update_study_material(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateStudyMaterialRequest>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "UPDATE study_materials SET
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         is_vip = COALESCE(?, is_vip),
         points_required = COALESCE(?, points_required),
         order_index = COALESCE(?, order_index),
         pdf_url = COALESCE(?, pdf_url),
         video_url = COALESCE(?, video_url)
         WHERE id = ?"
    )
    .bind(body.title.as_deref()).bind(body.content.as_deref())
    .bind(body.is_vip).bind(body.points_required).bind(body.order_index)
    .bind(body.pdf_url.as_deref()).bind(body.video_url.as_deref())
    .bind(&id)
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật tài liệu học tập thành công!" })))
}

pub async fn delete_study_material(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM study_materials WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa tài liệu học tập" })))
}

// ── Questions ─────────────────────────────────────────────────────────────────

pub async fn create_question(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateQuestionRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    let q_type = body.question_type.unwrap_or_else(|| "single_choice".to_string());


    let question_options: Vec<QuestionOption> = body.options.iter().map(|opt| {
        QuestionOption {
            id: Uuid::new_v4().to_string(),
            key: opt.key.clone(),
            option_text: opt.option_text.clone(),
            is_correct: opt.is_correct,
            option_value: opt.option_value.clone(),
        }
    }).collect();

    let images_json = sqlx::types::Json(body.images.unwrap_or_default());
    let sol_images_json = sqlx::types::Json(body.sol_images.unwrap_or_default());

    let chapter_id_cleaned = body.chapter_id.as_deref().filter(|s| !s.trim().is_empty());

// Create Question without difficulty column
    sqlx::query(
        "INSERT INTO questions (id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id)
    .bind(chapter_id_cleaned)
    .bind(body.question_text.trim())
    .bind(&q_type)
    .bind(body.explanation.trim())
    .bind(body.points.unwrap_or(10))
    .bind(sqlx::types::Json(question_options))
    .bind(images_json)
    .bind(sol_images_json)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo câu hỏi thành công!" })))
}

pub async fn update_question(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<CreateQuestionRequest>,
) -> AppResult<Json<Value>> {
    let q_type = body.question_type.unwrap_or_else(|| "single_choice".to_string());


    let question_options: Vec<QuestionOption> = body.options.iter().map(|opt| {
        QuestionOption {
            id: Uuid::new_v4().to_string(),
            key: opt.key.clone(),
            option_text: opt.option_text.clone(),
            is_correct: opt.is_correct,
            option_value: opt.option_value.clone(),
        }
    }).collect();

    let images_json = sqlx::types::Json(body.images.unwrap_or_default());
    let sol_images_json = sqlx::types::Json(body.sol_images.unwrap_or_default());

    let chapter_id_cleaned = body.chapter_id.as_deref().filter(|s| !s.trim().is_empty());

    sqlx::query(
        "UPDATE questions 
         SET chapter_id = ?, question_text = ?, question_type = ?, explanation = ?, points = ?, options = ?, images = ?, sol_images = ?
         WHERE id = ?"
    )
    .bind(chapter_id_cleaned)
    .bind(body.question_text.trim())
    .bind(&q_type)
    .bind(body.explanation.trim())
    .bind(body.points.unwrap_or(10))
    .bind(sqlx::types::Json(question_options))
    .bind(images_json)
    .bind(sol_images_json)
    .bind(&id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật câu hỏi thành công!" })))
}

pub async fn delete_question(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM questions WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa câu hỏi" })))
}

#[derive(serde::Deserialize)]
pub struct QuestionsQuery {
    pub chapter_id: Option<String>,
    pub subject_id: Option<i32>,
}

pub async fn get_all_questions(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Query(params): Query<QuestionsQuery>,
) -> AppResult<Json<Value>> {
    let mut sql = "SELECT id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images, created_at 
                   FROM questions".to_string();
    let mut conditions = Vec::new();
    
    if params.chapter_id.is_some() {
        conditions.push("chapter_id = ?");
    } else if params.subject_id.is_some() {
        conditions.push("chapter_id IN (SELECT id FROM chapters WHERE subject_id = ?)");
    }

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }
    
    sql.push_str(" ORDER BY created_at DESC");

    let mut query = sqlx::query_as::<_, Question>(&sql);
    if let Some(ch_id) = &params.chapter_id {
        query = query.bind(ch_id);
    } else if let Some(sub_id) = params.subject_id {
        query = query.bind(sub_id);
    }

    let questions: Vec<Question> = query
        .fetch_all(&pool)
        .await
        .map_err(AppError::Database)?;

    let data: Vec<Value> = questions.iter().map(|q| {
        json!({
            "id": q.id,
            "chapter_id": q.chapter_id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            // "difficulty" field removed from schema
            "explanation": q.explanation,
            "points": q.points,
            "options": q.options.0,
            "images": q.images.as_ref().map(|j| &j.0),
            "sol_images": q.sol_images.as_ref().map(|j| &j.0),
            "created_at": q.created_at,
        })
    }).collect();

    Ok(Json(json!({ "success": true, "questions": data })))
}

pub async fn get_chapter_questions(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(chapter_id): Path<String>,
) -> AppResult<Json<Value>> {
    let questions: Vec<Question> = sqlx::query_as(
        "SELECT id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images, created_at
         FROM questions WHERE chapter_id = ? ORDER BY created_at"
    )
    .bind(&chapter_id)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let data: Vec<Value> = questions.iter().map(|q| {
        json!({
            "id": q.id,
            "chapter_id": q.chapter_id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "explanation": q.explanation,
            "points": q.points,
            "options": q.options.0,
            "images": q.images.as_ref().map(|j| &j.0),
            "sol_images": q.sol_images.as_ref().map(|j| &j.0),
            "created_at": q.created_at,
        })
    }).collect();

    Ok(Json(json!({ "success": true, "questions": data })))
}

// ── Exams ─────────────────────────────────────────────────────────────────────

pub async fn get_exam_detail_admin(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(exam_id): Path<String>,
) -> AppResult<Json<Value>> {
    let exam = sqlx::query_as::<_, crate::models::exam::ExamRow>(
        "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes, question_ids, created_at
         FROM exams WHERE id = ?"
    )
    .bind(&exam_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Đề thi không tồn tại".to_string()))?;

    let q_ids = exam.question_ids.as_ref().map(|q| q.0.clone()).unwrap_or_default();

    // Fetch FULL question data including explanation, images, sol_images for admin editing
    let questions: Vec<Value> = if q_ids.is_empty() {
        vec![]
    } else {
        let placeholders = q_ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
        let sql = format!(
            "SELECT id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images
             FROM questions WHERE id IN ({})",
            placeholders
        );
        let mut query = sqlx::query(&sql);
        for id in &q_ids {
            query = query.bind(id);
        }
        let rows = query.fetch_all(&pool).await.map_err(AppError::Database)?;
        // Preserve order from question_ids
        let mut map: std::collections::HashMap<String, Value> = rows.into_iter().map(|row| {
            use sqlx::Row;
            let id: String = row.get("id");
            let options_raw: sqlx::types::Json<serde_json::Value> = row.get("options");
            let images_raw: Option<sqlx::types::Json<serde_json::Value>> = row.get("images");
            let sol_images_raw: Option<sqlx::types::Json<serde_json::Value>> = row.get("sol_images");
            let v = json!({
                "id": id,
                "chapter_id": row.get::<Option<String>, _>("chapter_id"),
                "question_text": row.get::<String, _>("question_text"),
                "question_type": row.get::<String, _>("question_type"),
                "explanation": row.get::<String, _>("explanation"),
                "points": row.get::<i32, _>("points"),
                "options": options_raw.0,
                "images": images_raw.map(|j| j.0).unwrap_or(json!([])),
                "sol_images": sol_images_raw.map(|j| j.0).unwrap_or(json!([])),
            });
            (id, v)
        }).collect();
        q_ids.iter().filter_map(|id| map.remove(id)).collect()
    };

    Ok(Json(json!({
        "success": true,
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "description": exam.description,
            "subject_id": exam.subject_id,
            "lesson_id": exam.lesson_id,
            "time_limit_minutes": exam.time_limit_minutes,
            "question_ids": q_ids,
        },
        "questions": questions,
    })))
}

pub async fn create_exam(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateExamRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();

    let qids_json = sqlx::types::Json(body.question_ids.clone());

    sqlx::query(
        "INSERT INTO exams (id, title, description, subject_id, lesson_id, time_limit_minutes, question_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(body.title.trim()).bind(body.description.as_deref())
    .bind(body.subject_id).bind(body.lesson_id).bind(body.time_limit_minutes.unwrap_or(45))
    .bind(qids_json)
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo đề thi thành công!" })))
}

pub async fn update_exam(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<serde_json::Value>,
) -> AppResult<Json<Value>> {
    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    if let Some(title) = body.get("title").and_then(|v| v.as_str()) {
        sqlx::query("UPDATE exams SET title = ? WHERE id = ?")
            .bind(title.trim()).bind(&id)
            .execute(&mut *tx).await.map_err(AppError::Database)?;
    }
    if let Some(desc) = body.get("description") {
        let desc_val = desc.as_str().map(|s| s.trim().to_string());
        sqlx::query("UPDATE exams SET description = ? WHERE id = ?")
            .bind(desc_val).bind(&id)
            .execute(&mut *tx).await.map_err(AppError::Database)?;
    }
    if let Some(sid) = body.get("subject_id") {
        let sid_val = sid.as_i64().map(|n| n as i32);
        sqlx::query("UPDATE exams SET subject_id = ? WHERE id = ?")
            .bind(sid_val).bind(&id)
            .execute(&mut *tx).await.map_err(AppError::Database)?;
    }
    if let Some(lid) = body.get("lesson_id") {
        let lid_val = lid.as_str().map(|s| s.trim().to_string());
        sqlx::query("UPDATE exams SET lesson_id = ? WHERE id = ?")
            .bind(lid_val).bind(&id)
            .execute(&mut *tx).await.map_err(AppError::Database)?;
    }
    if let Some(t_limit) = body.get("time_limit_minutes") {
        if let Some(t_val) = t_limit.as_i64() {
            sqlx::query("UPDATE exams SET time_limit_minutes = ? WHERE id = ?")
                .bind(t_val as i32).bind(&id)
                .execute(&mut *tx).await.map_err(AppError::Database)?;
        }
    }
    if let Some(pdf) = body.get("pdf_url") {
        let _ = pdf; // ignored - column removed
    }
    if let Some(key) = body.get("answer_key") {
        let _ = key; // ignored - column removed
    }

    if let Some(qids) = body.get("question_ids").and_then(|q| q.as_array()) {
        let qids_vec: Vec<String> = qids.iter().filter_map(|q| q.as_str().map(|s| s.to_string())).collect();
        let qids_json = sqlx::types::Json(qids_vec.clone());
        sqlx::query("UPDATE exams SET question_ids = ? WHERE id = ?")
            .bind(qids_json).bind(&id)
            .execute(&mut *tx).await.map_err(AppError::Database)?;
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật đề thi thành công!" })))
}

pub async fn delete_exam(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM exams WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa đề thi" })))
}

// ── Documents ─────────────────────────────────────────────────────────────────

pub async fn create_document(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateDocumentRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO documents (id, subject_id, title, description, file_url, is_vip, points_required)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(body.subject_id).bind(body.title.trim())
    .bind(body.description.as_deref()).bind(body.file_url.trim())
    .bind(body.is_vip.unwrap_or(false)).bind(body.points_required.unwrap_or(0))
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo tài liệu thành công!" })))
}

pub async fn delete_document(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM documents WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa tài liệu" })))
}

// ── Articles ──────────────────────────────────────────────────────────────────

pub async fn create_article(
    State(pool): State<MySqlPool>,
    AdminUser(claims): AdminUser,
    Json(body): Json<CreateArticleRequest>,
) -> AppResult<Json<Value>> {
    let new_id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO articles (id, title, content, summary, author_id, thumbnail) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&new_id).bind(body.title.trim()).bind(&body.content)
    .bind(body.summary.as_deref()).bind(&claims.sub).bind(body.thumbnail.as_deref())
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "id": new_id, "message": "Tạo bài viết thành công!" })))
}

pub async fn update_article(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateArticleRequest>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "UPDATE articles SET
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         summary = COALESCE(?, summary),
         thumbnail = COALESCE(?, thumbnail)
         WHERE id = ?"
    )
    .bind(body.title.as_deref()).bind(body.content.as_deref())
    .bind(body.summary.as_deref()).bind(body.thumbnail.as_deref()).bind(&id)
    .execute(&pool).await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật bài viết thành công!" })))
}

pub async fn delete_article(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    sqlx::query("DELETE FROM articles WHERE id = ?")
        .bind(&id).execute(&pool).await.map_err(AppError::Database)?;
    Ok(Json(json!({ "success": true, "message": "Đã xóa bài viết" })))
}

// ── User Management ───────────────────────────────────────────────────────────

use bcrypt::{hash, DEFAULT_COST};

#[derive(serde::Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
    pub role: String,
    pub password: Option<String>,
}

#[derive(serde::Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub points: Option<i32>,
    pub streak_count: Option<i32>,
    pub password: Option<String>,
}

pub async fn create_user(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<CreateUserRequest>,
) -> AppResult<Json<Value>> {
    if body.username.trim().is_empty() || body.email.trim().is_empty() {
        return Err(AppError::BadRequest("Tên đăng nhập và Email không được để trống".to_string()));
    }

    let existing: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM users WHERE email = ? OR username = ?"
    )
    .bind(body.email.trim().to_lowercase())
    .bind(body.username.trim())
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    if existing.0 > 0 {
        return Err(AppError::Conflict("Email hoặc tên đăng nhập đã tồn tại".to_string()));
    }

    let raw_password = body.password.unwrap_or_else(|| "123456".to_string());
    let password_hash = hash(raw_password.as_bytes(), DEFAULT_COST)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("bcrypt error: {}", e)))?;

    let new_id = Uuid::new_v4().to_string();
    let normalized_role = if body.role.trim().to_lowercase() == "admin" { "admin" } else { "student" };

    sqlx::query(
        "INSERT INTO users (id, username, email, password_hash, role, points, streak_count) VALUES (?, ?, ?, ?, ?, 0, 0)"
    )
    .bind(&new_id)
    .bind(body.username.trim())
    .bind(body.email.trim().to_lowercase())
    .bind(&password_hash)
    .bind(normalized_role)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Tạo thành viên thành công!", "user_id": new_id })))
}

pub async fn update_user(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateUserRequest>,
) -> AppResult<Json<Value>> {
    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    if let Some(ref username) = body.username {
        sqlx::query("UPDATE users SET username = ? WHERE id = ?")
            .bind(username.trim())
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(ref email) = body.email {
        sqlx::query("UPDATE users SET email = ? WHERE id = ?")
            .bind(email.trim().to_lowercase())
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(ref role) = body.role {
        let norm_role = if role.trim().to_lowercase() == "admin" { "admin" } else { "student" };
        sqlx::query("UPDATE users SET role = ? WHERE id = ?")
            .bind(norm_role)
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(points) = body.points {
        sqlx::query("UPDATE users SET points = ? WHERE id = ?")
            .bind(points)
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(streak_count) = body.streak_count {
        sqlx::query("UPDATE users SET streak_count = ? WHERE id = ?")
            .bind(streak_count)
            .bind(&id)
            .execute(&mut *tx)
            .await
            .map_err(AppError::Database)?;
    }

    if let Some(ref pwd) = body.password {
        if !pwd.trim().is_empty() {
            let password_hash = hash(pwd.as_bytes(), DEFAULT_COST)
                .map_err(|e| AppError::Internal(anyhow::anyhow!("bcrypt error: {}", e)))?;
            sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
                .bind(&password_hash)
                .bind(&id)
                .execute(&mut *tx)
                .await
                .map_err(AppError::Database)?;
        }
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Cập nhật thành viên thành công!" })))
}

pub async fn delete_user(
    State(pool): State<MySqlPool>,
    AdminUser(claims): AdminUser,
    Path(id): Path<String>,
) -> AppResult<Json<Value>> {
    if claims.sub == id {
        return Err(AppError::BadRequest("Bạn không thể tự xóa chính mình".to_string()));
    }

    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    sqlx::query("DELETE FROM user_exam_results WHERE user_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    sqlx::query("DELETE FROM feedbacks WHERE user_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    sqlx::query("DELETE FROM user_saved_questions WHERE user_id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    sqlx::query("DELETE FROM users WHERE id = ?")
        .bind(&id)
        .execute(&mut *tx)
        .await
        .map_err(AppError::Database)?;

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({ "success": true, "message": "Xóa thành viên thành công!" })))
}

// ── Settings ──────────────────────────────────────────────────────────────────

#[derive(serde::Deserialize)]
pub struct SaveSettingsRequest {
    pub restore_streak_cost: i32,
}

pub async fn get_settings(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
) -> AppResult<Json<Value>> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT value FROM settings WHERE `key` = 'restore_streak_cost'"
    )
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    let cost = row.and_then(|(val,)| val.parse::<i32>().ok()).unwrap_or(50);

    Ok(Json(json!({
        "success": true,
        "restore_streak_cost": cost,
    })))
}

pub async fn save_settings(
    State(pool): State<MySqlPool>,
    AdminUser(_): AdminUser,
    Json(body): Json<SaveSettingsRequest>,
) -> AppResult<Json<Value>> {
    sqlx::query(
        "INSERT INTO settings (`key`, value) VALUES ('restore_streak_cost', ?)
         ON DUPLICATE KEY UPDATE value = ?"
    )
    .bind(body.restore_streak_cost.to_string())
    .bind(body.restore_streak_cost.to_string())
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Cấu hình đã được lưu!",
    })))
}

