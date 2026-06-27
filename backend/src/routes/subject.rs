use axum::{routing::{get, post}, Router};
use sqlx::MySqlPool;
use crate::handlers::subject::{
    complete_lesson, get_chapters, get_lesson_detail, get_lessons,
    get_subjects, unlock_lesson, get_study_materials, get_study_material_detail,
    unlock_study_material, complete_study_material, get_public_stats,
};

pub fn subject_router() -> Router<MySqlPool> {
    Router::new()
        .route("/subjects",                 get(get_subjects))
        .route("/subjects/stats/global",    get(get_public_stats))
        .route("/subjects/:id/chapters",    get(get_chapters))
        .route("/chapters/:id/lessons",     get(get_lessons))
        .route("/lessons/:id",              get(get_lesson_detail))
        .route("/lessons/:id/unlock",       post(unlock_lesson))
        .route("/lessons/:id/complete",     post(complete_lesson))
        .route("/lessons/:id/study-materials", get(get_study_materials))
        .route("/study-materials/:id",          get(get_study_material_detail))
        .route("/study-materials/:id/unlock",   post(unlock_study_material))
        .route("/study-materials/:id/complete", post(complete_study_material))
}
