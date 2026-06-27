use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),

    #[error("Không tìm thấy: {0}")]
    NotFound(String),

    #[error("Không có quyền truy cập")]
    Unauthorized,

    #[error("Không đủ quyền hạn")]
    Forbidden,

    #[error("Xung đột dữ liệu: {0}")]
    Conflict(String),

    #[error("Không đủ điểm để thực hiện thao tác này")]
    InsufficientPoints,

    #[error("Lỗi cơ sở dữ liệu")]
    Database(#[from] sqlx::Error),

    #[error("Lỗi hệ thống nội bộ")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::BadRequest(msg)      => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::NotFound(msg)        => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::Unauthorized         => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Forbidden            => (StatusCode::FORBIDDEN, self.to_string()),
            AppError::Conflict(msg)        => (StatusCode::CONFLICT, msg.clone()),
            AppError::InsufficientPoints   => (StatusCode::UNPROCESSABLE_ENTITY, self.to_string()),
            AppError::Database(e) => {
                tracing::error!("DB error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Lỗi cơ sở dữ liệu".to_string())
            }
            AppError::Internal(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Lỗi hệ thống nội bộ".to_string())
            }
        };

        (status, Json(json!({ "success": false, "message": message }))).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
