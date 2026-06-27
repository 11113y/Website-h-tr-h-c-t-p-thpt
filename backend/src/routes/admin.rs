use axum::{routing::{delete, get, post, put}, Router};
use sqlx::MySqlPool;
use crate::handlers::admin::*;
use crate::handlers::upload::upload_file;

pub fn admin_router() -> Router<MySqlPool> {
    Router::new()
        .route("/admin/dashboard",     get(get_dashboard))
        .route("/admin/reports",       get(get_reports))
        .route("/admin/attempts",      get(get_all_attempts))
        .route("/admin/users",         get(get_users).post(create_user))
        .route("/admin/users/:id",     put(update_user).delete(delete_user))
        .route("/admin/subjects",      post(create_subject))
        .route("/admin/subjects/:id",  put(update_subject).delete(delete_subject))
        .route("/admin/chapters",      post(create_chapter))
        .route("/admin/chapters/:id",  put(update_chapter).delete(delete_chapter))
        .route("/admin/chapters/:id/questions", get(get_chapter_questions))
        .route("/admin/lessons",       post(create_lesson))
        .route("/admin/lessons/:id",   put(update_lesson).delete(delete_lesson))
        .route("/admin/study-materials", get(get_all_study_materials).post(create_study_material))
        .route("/admin/study-materials/:id", put(update_study_material).delete(delete_study_material))
        .route("/admin/questions",     get(get_all_questions).post(create_question))
        .route("/admin/questions/:id", put(update_question).delete(delete_question))
        .route("/admin/exams",         post(create_exam))
        .route("/admin/exams/:id",     get(get_exam_detail_admin).put(update_exam).delete(delete_exam))
        .route("/admin/documents",     post(create_document))
        .route("/admin/documents/:id", delete(delete_document))
        .route("/admin/articles",      post(create_article))
        .route("/admin/articles/:id",  put(update_article).delete(delete_article))
        .route("/admin/upload",        post(upload_file))
        .route("/admin/settings",      get(get_settings).post(save_settings))
}
