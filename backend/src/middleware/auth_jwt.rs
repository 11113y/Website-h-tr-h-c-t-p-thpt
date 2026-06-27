use axum::{
    async_trait,
    extract::FromRequestParts,
    http::request::Parts,
    RequestPartsExt,
};
use axum_extra::{headers::{authorization::Bearer, Authorization}, TypedHeader};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;

use crate::{errors::AppError, models::user::Claims};

/// Extractor: yêu cầu đăng nhập (trả lỗi 401 nếu không có token hợp lệ)
pub struct AuthUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let claims = extract_claims_from_parts(parts).await?;
        Ok(AuthUser(claims))
    }
}

/// Extractor: yêu cầu quyền Admin
pub struct AdminUser(pub Claims);

#[async_trait]
impl<S> FromRequestParts<S> for AdminUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let claims = extract_claims_from_parts(parts).await?;
        if claims.role != "admin" {
            return Err(AppError::Forbidden);
        }
        Ok(AdminUser(claims))
    }
}

/// Extractor: tùy chọn đăng nhập (None nếu không có token)
pub struct OptionalAuthUser(pub Option<Claims>);

#[async_trait]
impl<S> FromRequestParts<S> for OptionalAuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        match extract_claims_from_parts(parts).await {
            Ok(claims) => Ok(OptionalAuthUser(Some(claims))),
            Err(_) => Ok(OptionalAuthUser(None)),
        }
    }
}

/// Hàm trích xuất & xác minh JWT từ header Authorization hoặc Cookie
async fn extract_claims_from_parts(parts: &mut Parts) -> Result<Claims, AppError> {
    let secret = env::var("JWT_SECRET").unwrap_or_default();
    let key = DecodingKey::from_secret(secret.as_bytes());

    // Thử lấy từ Authorization: Bearer <token>
    if let Ok(TypedHeader(Authorization(bearer))) =
        parts.extract::<TypedHeader<Authorization<Bearer>>>().await
    {
        return decode_token(bearer.token(), &key);
    }

    // Thử lấy từ cookie "token"
    if let Some(cookie_header) = parts.headers.get("cookie") {
        if let Ok(cookie_str) = cookie_header.to_str() {
            for part in cookie_str.split(';') {
                let part = part.trim();
                if let Some(val) = part.strip_prefix("token=") {
                    return decode_token(val.trim(), &key);
                }
            }
        }
    }

    Err(AppError::Unauthorized)
}

fn decode_token(token: &str, key: &DecodingKey) -> Result<Claims, AppError> {
    decode::<Claims>(token, key, &Validation::default())
        .map(|data| data.claims)
        .map_err(|_| AppError::Unauthorized)
}
