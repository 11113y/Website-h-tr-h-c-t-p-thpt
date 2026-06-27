use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::{AuthUser, OptionalAuthUser},
    models::exam::{
        AnswerDetail, ExamRow, Question, SubmitExamRequest,
    },
};

pub async fn get_exams(
    State(pool): State<MySqlPool>,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> AppResult<Json<Value>> {
    let subject_id = params.get("subject_id").and_then(|s| s.parse::<i32>().ok());
    let lesson_id = params.get("lesson_id").cloned();

    let exams: Vec<ExamRow> = if let Some(ref lid) = lesson_id {
        sqlx::query_as(
            "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes,
                    question_ids, created_at
             FROM exams WHERE lesson_id = ? ORDER BY created_at DESC"
        )
        .bind(lid)
        .fetch_all(&pool)
        .await
    } else if let Some(sid) = subject_id {
        sqlx::query_as(
            "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes,
                    question_ids, created_at
             FROM exams WHERE subject_id = ? ORDER BY created_at DESC"
        )
        .bind(sid)
        .fetch_all(&pool)
        .await
    } else {
        sqlx::query_as(
            "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes,
                    question_ids, created_at
             FROM exams ORDER BY created_at DESC"
        )
        .fetch_all(&pool)
        .await
    }
    .map_err(AppError::Database)?;

    let mut data: Vec<Value> = Vec::new();
    for e in exams {
        let q_count = e.question_ids.as_ref().map(|q| q.0.len() as i64).unwrap_or(0);
        data.push(json!({
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "subject_id": e.subject_id,
            "lesson_id": e.lesson_id,
            "time_limit_minutes": e.time_limit_minutes,
            "question_count": q_count,
            "created_at": e.created_at,
        }));
    }

    Ok(Json(json!({ "success": true, "exams": data })))
}

pub async fn get_exam_detail(
    State(pool): State<MySqlPool>,
    Path(exam_id): Path<String>,
    OptionalAuthUser(_): OptionalAuthUser,
) -> AppResult<Json<Value>> {
    let exam: ExamRow = sqlx::query_as(
        "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes,
                question_ids, created_at
         FROM exams WHERE id = ?"
    )
    .bind(&exam_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Đề kiểm tra không tồn tại".to_string()))?;

    let q_ids = exam.question_ids.as_ref().map(|q| q.0.clone()).unwrap_or_default();
    let questions = fetch_questions_for_student(&pool, &q_ids).await?;

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

pub async fn submit_exam(
    State(pool): State<MySqlPool>,
    Path(exam_id): Path<String>,
    OptionalAuthUser(claims_opt): OptionalAuthUser,
    Json(body): Json<SubmitExamRequest>,
) -> AppResult<Json<Value>> {
    let exam: ExamRow = sqlx::query_as(
        "SELECT id, title, description, subject_id, lesson_id, time_limit_minutes,
                question_ids, created_at
         FROM exams WHERE id = ?"
    )
    .bind(&exam_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .ok_or_else(|| AppError::NotFound("Đề kiểm tra không tồn tại".to_string()))?;

    let q_ids = exam.question_ids.as_ref().map(|q| q.0.clone()).unwrap_or_default();
    let mut correct_count = 0usize;
    let mut earned_profile_points = 0i32;
    let mut details: Vec<AnswerDetail> = Vec::new();
    let questions = fetch_questions_full(&pool, &q_ids).await?;
    let total_questions = questions.len();

    let score_per_question = if total_questions > 0 {
        ((10.0 / total_questions as f64) * 100.0).round() / 100.0
    } else {
        0.0
    };

    for q in &questions {
        let submitted = body.answers.iter().find(|a| a.question_id == q.id);

        let (is_correct, sel_option, sel_input) = if let Some(ans) = submitted {
            if q.question_type == "input_number" {
                let correct_opt = q.options.0.iter().find(|o| o.is_correct);
                let correct_val = correct_opt
                    .and_then(|o| o.option_value.as_deref())
                    .unwrap_or("")
                    .trim()
                    .to_lowercase();
                let user_val = ans.input_value.as_deref().unwrap_or("").trim().to_lowercase();
                let correct = !correct_val.is_empty() && user_val == correct_val;
                (correct, None, ans.input_value.clone())
            } else {
                let correct_opt = q.options.0.iter().find(|o| o.is_correct);
                let correct_id = correct_opt.map(|o| o.id.clone()).unwrap_or_default();
                let correct = ans.selected_option_id.as_deref() == Some(&correct_id);
                (correct, ans.selected_option_id.clone(), None)
            }
        } else {
            (false, None, None)
        };

        let points_awarded = if is_correct { score_per_question } else { 0.0 };

        if is_correct {
            correct_count += 1;
            earned_profile_points += q.points;
        }

        details.push(AnswerDetail {
            question_id: q.id.clone(),
            selected_option_id: sel_option,
            input_value: sel_input,
            is_correct,
            points_awarded: points_awarded as f32,
            correct_option_id: q.options.0.iter().find(|o| o.is_correct).map(|o| o.id.clone()),
            correct_input_value: q.options.0.iter().find(|o| o.is_correct)
                .and_then(|o| o.option_value.clone()),
            explanation: q.explanation.clone(),
        });
    }

    let score_10 = if total_questions > 0 {
        if correct_count == total_questions {
            10.0
        } else {
            ((correct_count as f64 * score_per_question) * 100.0).round() / 100.0
        }
    } else {
        0.0
    };

    let points_rewarded = earned_profile_points;

    // Save result if user is logged in
    let result_id = if let Some(ref claims) = claims_opt {
        let rid = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO user_exam_results (id, user_id, exam_id, score, points_earned, time_spent_seconds, answers, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())"
        )
        .bind(&rid)
        .bind(&claims.sub)
        .bind(&exam_id)
        .bind(score_10)
        .bind(points_rewarded)
        .bind(body.time_spent_seconds)
        .bind(sqlx::types::Json(&details))
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

        if let Ok(user) = crate::handlers::auth::fetch_user_by_id(&pool, &claims.sub).await {
            let new_points = user.points + points_rewarded;
            let _ = sqlx::query("UPDATE users SET points = ? WHERE id = ?")
                .bind(new_points)
                .bind(&claims.sub)
                .execute(&pool)
                .await;
            
            let _ = crate::handlers::user::update_streak(&pool, &user).await;
        }

        Some(rid)
    } else {
        None
    };

    Ok(Json(json!({
        "success": true,
        "result": {
            "result_id": result_id,
            "score": score_10,
            "points_earned": points_rewarded,
            "time_spent_seconds": body.time_spent_seconds,
            "total_questions": total_questions,
            "correct_count": correct_count,
            "details": details,
        }
    })))
}

pub async fn get_explanations(
    State(pool): State<MySqlPool>,
    Path(exam_id): Path<String>,
    AuthUser(_): AuthUser,
) -> AppResult<Json<Value>> {
    let question_ids: Option<sqlx::types::Json<Vec<String>>> = sqlx::query_as(
        "SELECT question_ids FROM exams WHERE id = ?"
    )
    .bind(&exam_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?
    .map(|(q,): (Option<sqlx::types::Json<Vec<String>>>,)| q)
    .flatten();

    let q_ids = question_ids.map(|j| j.0).unwrap_or_default();
    let questions = fetch_questions_full(&pool, &q_ids).await?;

    let explanations: Vec<Value> = questions
        .iter()
        .map(|q| {
            let opts_val: Vec<Value> = q.options.0
                .iter()
                .map(|opt| {
                    json!({
                        "id": opt.id,
                        "key": opt.key,
                        "option_text": opt.option_text,
                        "is_correct": opt.is_correct,
                        "option_value": opt.option_value,
                    })
                })
                .collect();
            json!({
                "question_id": q.id,
                "question_text": q.question_text,
                "options": opts_val,
                "explanation": q.explanation,
                "images": q.images.as_ref().map(|j| &j.0),
                "sol_images": q.sol_images.as_ref().map(|j| &j.0),
            })
        })
        .collect();

    Ok(Json(json!({ "success": true, "explanations": explanations })))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async fn fetch_questions_for_student(
    pool: &MySqlPool,
    ids: &[String],
) -> AppResult<Vec<Value>> {
    let questions = fetch_questions_full(pool, ids).await?;

    Ok(questions
        .iter()
        .map(|q| {
            let opts_filtered: Vec<Value> = q.options.0
                .iter()
                .map(|opt| {
                    json!({
                        "id": opt.id,
                        "key": opt.key,
                        "option_text": opt.option_text,
                        "option_value": opt.option_value,
                    })
                })
                .collect();
            json!({
                "id": q.id,
                "chapter_id": q.chapter_id,
                "question_text": q.question_text,
                "question_type": q.question_type,
                "points": q.points,
                "options": opts_filtered,
                "images": q.images.as_ref().map(|j| &j.0),
                "sol_images": q.sol_images.as_ref().map(|j| &j.0),
            })
        })
        .collect())
}

async fn fetch_questions_full(pool: &MySqlPool, ids: &[String]) -> AppResult<Vec<Question>> {
    if ids.is_empty() {
        return Ok(vec![]);
    }

    let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
    let sql = format!(
        "SELECT id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images, created_at \
         FROM questions WHERE id IN ({})",
        placeholders
    );

    let mut query = sqlx::query_as::<_, Question>(&sql);
    for id in ids {
        query = query.bind(id);
    }

    let questions: Vec<Question> = query.fetch_all(pool).await.map_err(AppError::Database)?;

    Ok(ids
        .iter()
        .filter_map(|id| questions.iter().find(|q| &q.id == id).cloned())
        .collect())
}
