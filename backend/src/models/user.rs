use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

/// Struct ánh xạ bảng `users`
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub points: i32,
    pub streak_count: i32,
    pub last_active_at: Option<NaiveDateTime>,
    pub completed_lessons: sqlx::types::Json<Vec<String>>,
    pub unlocked_lessons: sqlx::types::Json<Vec<String>>,
    pub unlocked_documents: sqlx::types::Json<Vec<String>>,
    pub completed_materials: sqlx::types::Json<Vec<String>>,
    pub created_at: NaiveDateTime,
}

/// Thông tin public trả về trong API
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserPublic {
    pub id: String,
    pub username: String,
    pub email: String,
    pub role: String,
    pub points: i32,
    pub streak_count: i32,
    pub last_active_at: Option<NaiveDateTime>,
    pub completed_lessons: Vec<String>,
    pub unlocked_lessons: Vec<String>,
    pub unlocked_documents: Vec<String>,
    pub completed_materials: Vec<String>,
    pub created_at: NaiveDateTime,
    pub streak_status: String,
    pub streak_cost: i32,
    pub active_streak: i32,
}

impl UserPublic {
    pub fn new(
        u: User,
        completed_lessons: Vec<String>,
        unlocked_lessons: Vec<String>,
        unlocked_documents: Vec<String>,
        completed_materials: Vec<String>,
        streak_status: String,
        streak_cost: i32,
        active_streak: i32,
    ) -> Self {
        UserPublic {
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            points: u.points,
            streak_count: u.streak_count,
            last_active_at: u.last_active_at,
            completed_lessons,
            unlocked_lessons,
            unlocked_documents,
            completed_materials,
            created_at: u.created_at,
            streak_status,
            streak_cost,
            active_streak,
        }
    }
}

/// JWT Claims
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

/// Requests
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[derive(Debug, Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileRequest {
    pub username: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Leaderboard
#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct LeaderboardEntry {
    pub id: String,
    pub username: String,
    pub points: i32,
    pub streak_count: i32,
}
