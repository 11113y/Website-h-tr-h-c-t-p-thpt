use axum::{
    extract::{Path, State},
    Json,
};
use serde_json::{json, Value};
use sqlx::MySqlPool;
use uuid::Uuid;

use crate::{
    errors::{AppError, AppResult},
    middleware::auth_jwt::AuthUser,
};

// ── BOOKMARKS ────────────────────────────────────────────────────────────────

pub async fn get_bookmarks(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let bookmark_rows: Vec<(String, String, Option<String>, i8, Option<String>, chrono::NaiveDateTime)> = sqlx::query_as(
        "SELECT id, question_id, folder_id, is_pinned, note, created_at
         FROM bookmarks WHERE user_id = ? ORDER BY is_pinned DESC, created_at DESC"
    )
    .bind(&claims.sub)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let mut bookmarks_data = Vec::new();

    for (b_id, b_question_id, b_folder_id, b_is_pinned, b_note, b_created_at) in bookmark_rows {
        // Fetch question details
        let question_row: Option<(
            String,
            Option<String>,
            String,
            String,
            String,
            i32,
            sqlx::types::Json<Vec<crate::models::exam::QuestionOption>>,
            Option<sqlx::types::Json<Vec<String>>>,
            Option<sqlx::types::Json<Vec<String>>>,
        )> = sqlx::query_as(
            "SELECT id, chapter_id, question_text, question_type, explanation, points, options, images, sol_images
             FROM questions WHERE id = ?"
        )
        .bind(&b_question_id)
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;

        if let Some((q_id, q_chapter_id, q_text, q_type, q_expl, _q_pts, sqlx::types::Json(options), q_images, q_sol_images)) = question_row {
            // Get chapter name
            let chapter_name: Option<String> = if let Some(ref ch_id) = q_chapter_id {
                sqlx::query_scalar("SELECT name FROM chapters WHERE id = ?")
                    .bind(ch_id)
                    .fetch_optional(&pool)
                    .await
                    .map_err(AppError::Database)?
            } else {
                None
            };

            let section = if q_type == "input_number" { "III" } else { "I" };

            let mut options_list = Vec::new();
            let mut correct_answer_idx: Option<usize> = None;
            let mut correct_input_val: Option<String> = None;

            for (idx, opt) in options.into_iter().enumerate() {
                options_list.push(opt.option_text);
                if opt.is_correct {
                    correct_answer_idx = Some(idx);
                    correct_input_val = opt.option_value;
                }
            }

            let answer_val = if section == "III" {
                json!({ "val": correct_input_val.unwrap_or_default() })
            } else {
                json!(correct_answer_idx.unwrap_or(0))
            };

            bookmarks_data.push(json!({
                "id": b_id,
                "questionId": b_question_id,
                "folderId": b_folder_id,
                "isPinned": b_is_pinned != 0,
                "note": b_note,
                "savedAt": b_created_at,
                "question": {
                    "id": q_id,
                    "question": q_text,
                    "explanation": q_expl,
                    "topicTitle": chapter_name.unwrap_or_else(|| "Chưa phân loại".to_string()),
                    "section": section,
                    "options": options_list,
                    "answer": answer_val,
                    "images": q_images.as_ref().map(|j| &j.0),
                    "sol_images": q_sol_images.as_ref().map(|j| &j.0),
                }
            }));
        }
    }

    Ok(Json(json!({ "success": true, "bookmarks": bookmarks_data })))
}

pub async fn create_bookmark(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    let question_id = body.get("questionId")
        .or_else(|| body.get("question_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("questionId là bắt buộc".to_string()))?;

    let folder_id = body.get("folderId")
        .or_else(|| body.get("folder_id"))
        .and_then(|v| {
            if v.is_null() {
                None
            } else {
                v.as_str()
            }
        });

    // Check if question exists
    let q_exists: Option<(String,)> = sqlx::query_as("SELECT id FROM questions WHERE id = ?")
        .bind(question_id)
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;

    if q_exists.is_none() {
        return Err(AppError::NotFound("Câu hỏi không tồn tại".to_string()));
    }

    // Check if already bookmarked
    let existing: Option<(String, Option<String>)> = sqlx::query_as(
        "SELECT id, folder_id FROM bookmarks WHERE user_id = ? AND question_id = ?"
    )
    .bind(&claims.sub)
    .bind(question_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    if let Some((b_id, current_folder_id)) = existing {
        // If folder is different, update folder
        if current_folder_id.as_deref() != folder_id {
            sqlx::query("UPDATE bookmarks SET folder_id = ? WHERE id = ?")
                .bind(folder_id)
                .bind(&b_id)
                .execute(&pool)
                .await
                .map_err(AppError::Database)?;
        }

        return Ok(Json(json!({
            "success": true,
            "message": "Câu hỏi đã được lưu trước đó",
            "bookmark": {
                "id": b_id,
                "questionId": question_id,
                "folderId": folder_id
            }
        })));
    }

    let b_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO bookmarks (id, user_id, question_id, folder_id, is_pinned, note)
         VALUES (?, ?, ?, ?, 0, NULL)"
    )
    .bind(&b_id)
    .bind(&claims.sub)
    .bind(question_id)
    .bind(folder_id)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Lưu câu hỏi thành công",
        "bookmark": {
            "id": b_id,
            "questionId": question_id,
            "folderId": folder_id,
            "isPinned": false,
            "note": null
        }
    })))
}

pub async fn toggle_bookmark(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    let question_id = body.get("questionId")
        .or_else(|| body.get("question_id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("questionId là bắt buộc".to_string()))?;

    let folder_id = body.get("folderId")
        .or_else(|| body.get("folder_id"))
        .and_then(|v| if v.is_null() { None } else { v.as_str() });

    // Check if question exists
    let q_exists: Option<(String,)> = sqlx::query_as("SELECT id FROM questions WHERE id = ?")
        .bind(question_id)
        .fetch_optional(&pool)
        .await
        .map_err(AppError::Database)?;

    if q_exists.is_none() {
        return Err(AppError::NotFound("Câu hỏi không tồn tại".to_string()));
    }

    // Check if already bookmarked
    let existing: Option<(String, Option<String>)> = sqlx::query_as(
        "SELECT id, folder_id FROM bookmarks WHERE user_id = ? AND question_id = ?"
    )
    .bind(&claims.sub)
    .bind(question_id)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    if let Some((b_id, current_folder_id)) = existing {
        // If folder_id is provided and is different, update the folder instead of deleting
        if folder_id.is_some() && current_folder_id.as_deref() != folder_id {
            sqlx::query("UPDATE bookmarks SET folder_id = ? WHERE id = ?")
                .bind(folder_id)
                .bind(&b_id)
                .execute(&pool)
                .await
                .map_err(AppError::Database)?;

            return Ok(Json(json!({
                "success": true,
                "message": "Cập nhật bộ sưu tập thành công",
                "bookmarked": true,
                "bookmark": {
                    "id": b_id,
                    "questionId": question_id,
                    "folderId": folder_id
                }
            })));
        }

        // Otherwise, delete/remove bookmark (toggle off)
        sqlx::query("DELETE FROM bookmarks WHERE id = ?")
            .bind(&b_id)
            .execute(&pool)
            .await
            .map_err(AppError::Database)?;

        return Ok(Json(json!({
            "success": true,
            "message": "Đã bỏ lưu câu hỏi thành công",
            "bookmarked": false
        })));
    } else {
        // Create new bookmark
        let b_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO bookmarks (id, user_id, question_id, folder_id, is_pinned, note)
             VALUES (?, ?, ?, ?, 0, NULL)"
        )
        .bind(&b_id)
        .bind(&claims.sub)
        .bind(question_id)
        .bind(folder_id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

        return Ok(Json(json!({
            "success": true,
            "message": "Lưu câu hỏi thành công",
            "bookmarked": true,
            "bookmark": {
                "id": b_id,
                "questionId": question_id,
                "folderId": folder_id
            }
        })));
    }
}


pub async fn delete_bookmark_by_question(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Path(question_id): Path<String>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query("DELETE FROM bookmarks WHERE user_id = ? AND question_id = ?")
        .bind(&claims.sub)
        .bind(&question_id)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Không tìm thấy câu hỏi đã lưu".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Đã bỏ lưu câu hỏi thành công"
    })))
}

pub async fn update_bookmark(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Path(bookmark_id): Path<String>,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    // Verify owner
    let existing: Option<(String, Option<String>, i8, Option<String>)> = sqlx::query_as(
        "SELECT id, folder_id, is_pinned, note FROM bookmarks WHERE id = ? AND user_id = ?"
    )
    .bind(&bookmark_id)
    .bind(&claims.sub)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    if existing.is_none() {
        return Err(AppError::NotFound("Không tìm thấy câu hỏi đã lưu hoặc không có quyền".to_string()));
    }

    // Build update dynamically
    let mut query_builder = sqlx::QueryBuilder::new("UPDATE bookmarks SET ");
    let mut separated = query_builder.separated(", ");
    let mut has_fields = false;

    // folderId / folder_id
    if let Some(folder_val) = body.get("folderId").or_else(|| body.get("folder_id")) {
        separated.push("folder_id = ");
        if folder_val.is_null() {
            separated.push_bind_unseparated(None::<String>);
        } else if let Some(folder_str) = folder_val.as_str() {
            separated.push_bind_unseparated(Some(folder_str.to_string()));
        }
        has_fields = true;
    }

    // isPinned / is_pinned
    if let Some(pin_val) = body.get("isPinned").or_else(|| body.get("is_pinned")) {
        if let Some(pin_bool) = pin_val.as_bool() {
            separated.push("is_pinned = ");
            separated.push_bind_unseparated(if pin_bool { 1i8 } else { 0i8 });
            has_fields = true;
        }
    }

    // note
    if let Some(note_val) = body.get("note") {
        separated.push("note = ");
        if note_val.is_null() {
            separated.push_bind_unseparated(None::<String>);
        } else if let Some(note_str) = note_val.as_str() {
            separated.push_bind_unseparated(Some(note_str.to_string()));
        }
        has_fields = true;
    }

    if !has_fields {
        return Err(AppError::BadRequest("Không có trường thông tin nào để cập nhật".to_string()));
    }

    query_builder.push(" WHERE id = ? AND user_id = ?");
    let mut query = query_builder.build();
    query = query.bind(&bookmark_id).bind(&claims.sub);

    query.execute(&pool).await.map_err(AppError::Database)?;

    // Fetch updated row
    let updated: (String, Option<String>, i8, Option<String>) = sqlx::query_as(
        "SELECT id, folder_id, is_pinned, note FROM bookmarks WHERE id = ?"
    )
    .bind(&bookmark_id)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Cập nhật câu hỏi đã lưu thành công",
        "bookmark": {
            "id": updated.0,
            "folderId": updated.1,
            "isPinned": updated.2 != 0,
            "note": updated.3
        }
    })))
}

// ── COLLECTIONS / FOLDERS ────────────────────────────────────────────────────

pub async fn get_folders(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
) -> AppResult<Json<Value>> {
    let rows: Vec<(String, String, Option<String>, i64)> = sqlx::query_as(
        "SELECT c.id, c.name, c.description, COUNT(b.id) as count
         FROM collections c
         LEFT JOIN bookmarks b ON c.id = b.folder_id
         WHERE c.user_id = ?
         GROUP BY c.id, c.name, c.description, c.created_at
         ORDER BY c.created_at ASC"
    )
    .bind(&claims.sub)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    let folders: Vec<Value> = rows
        .into_iter()
        .map(|(id, name, desc, count)| {
            json!({
                "id": id,
                "name": name,
                "description": desc,
                "count": count
            })
        })
        .collect();

    Ok(Json(json!({ "success": true, "folders": folders })))
}

pub async fn create_folder(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    let name = body.get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Tên bộ sưu tập là bắt buộc".to_string()))?;

    let description = body.get("description")
        .and_then(|v| v.as_str());

    let folder_id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO collections (id, user_id, name, description)
         VALUES (?, ?, ?, ?)"
    )
    .bind(&folder_id)
    .bind(&claims.sub)
    .bind(name)
    .bind(description)
    .execute(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Tạo bộ sưu tập thành công",
        "folder": {
            "id": folder_id,
            "name": name,
            "description": description,
            "count": 0
        }
    })))
}

pub async fn update_folder(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Path(folder_id): Path<String>,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    let name = body.get("name")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::BadRequest("Tên bộ sưu tập là bắt buộc".to_string()))?;

    let result = sqlx::query("UPDATE collections SET name = ? WHERE id = ? AND user_id = ?")
        .bind(name)
        .bind(&folder_id)
        .bind(&claims.sub)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Không tìm thấy bộ sưu tập hoặc không có quyền".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Đổi tên bộ sưu tập thành công",
        "folder": {
            "id": folder_id,
            "name": name
        }
    })))
}

pub async fn delete_folder(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Path(folder_id): Path<String>,
) -> AppResult<Json<Value>> {
    let result = sqlx::query("DELETE FROM collections WHERE id = ? AND user_id = ?")
        .bind(&folder_id)
        .bind(&claims.sub)
        .execute(&pool)
        .await
        .map_err(AppError::Database)?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Không tìm thấy bộ sưu tập hoặc không có quyền".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Xóa bộ sưu tập thành công"
    })))
}

pub async fn batch_add_questions(
    State(pool): State<MySqlPool>,
    AuthUser(claims): AuthUser,
    Path(folder_id): Path<String>,
    Json(body): Json<Value>,
) -> AppResult<Json<Value>> {
    // Verify collection belongs to user
    let collection_exists: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM collections WHERE id = ? AND user_id = ?"
    )
    .bind(&folder_id)
    .bind(&claims.sub)
    .fetch_optional(&pool)
    .await
    .map_err(AppError::Database)?;

    if collection_exists.is_none() {
        return Err(AppError::NotFound("Không tìm thấy bộ sưu tập hoặc không có quyền".to_string()));
    }

    let bookmark_ids = body.get("bookmarkIds")
        .or_else(|| body.get("bookmark_ids"))
        .and_then(|v| v.as_array())
        .ok_or_else(|| AppError::BadRequest("bookmarkIds là bắt buộc và phải là danh sách".to_string()))?;

    if bookmark_ids.is_empty() {
        return Ok(Json(json!({
            "success": true,
            "message": "Không có câu hỏi nào để thêm"
        })));
    }

    let mut tx = pool.begin().await.map_err(AppError::Database)?;

    for id_val in bookmark_ids {
        if let Some(id_str) = id_val.as_str() {
            sqlx::query("UPDATE bookmarks SET folder_id = ? WHERE id = ? AND user_id = ?")
                .bind(&folder_id)
                .bind(id_str)
                .bind(&claims.sub)
                .execute(&mut *tx)
                .await
                .map_err(AppError::Database)?;
        }
    }

    tx.commit().await.map_err(AppError::Database)?;

    Ok(Json(json!({
        "success": true,
        "message": "Thêm câu hỏi vào bộ sưu tập thành công"
    })))
}
