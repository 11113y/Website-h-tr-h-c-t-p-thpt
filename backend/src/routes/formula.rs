use axum::{routing::{get, post, put}, Router};
use sqlx::MySqlPool;
use crate::handlers::formula::*;

pub fn formula_router() -> Router<MySqlPool> {
    Router::new()
        // Admin formula routes
        .route("/admin/formulas", get(get_admin_formulas).post(create_admin_formula))
        .route("/admin/formulas/:id", put(update_admin_formula).delete(delete_admin_formula))
        .route("/admin/formulas/:id/approve", post(approve_formula))
        .route("/admin/formulas/:id/reject", post(reject_formula))
        // Public/student formula routes
        .route("/formulas", get(get_public_formulas).post(user_submit_formula))
}
