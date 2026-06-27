use axum::{routing::{get, post, put, delete}, Router};
use sqlx::MySqlPool;
use crate::handlers::bookmark::{
    get_bookmarks, create_bookmark, toggle_bookmark, delete_bookmark_by_question, update_bookmark,
    get_folders, create_folder, update_folder, delete_folder, batch_add_questions
};

pub fn bookmark_router() -> Router<MySqlPool> {
    Router::new()
        .route("/bookmarks", delete(delete_bookmark_by_question))
        .route("/bookmarks", get(get_bookmarks).post(create_bookmark))
        .route("/bookmarks/toggle", post(toggle_bookmark))
        .route("/bookmarks/questions/:question_id", delete(delete_bookmark_by_question))
        .route("/bookmarks/:bookmark_id", put(update_bookmark))
        .route("/bookmarks/folders", get(get_folders).post(create_folder))
        .route("/bookmarks/folders/:folder_id", put(update_folder).delete(delete_folder))
        .route("/bookmarks/folders/:folder_id/add-questions", post(batch_add_questions))
}

