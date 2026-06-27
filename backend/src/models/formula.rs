use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Formula {
    pub id: String,
    pub title: String,
    pub latex: Option<String>,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub created_by: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct FormulaWithCreator {
    pub id: String,
    pub title: String,
    pub latex: Option<String>,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub created_by: Option<String>,
    pub creator_username: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct CreateFormulaRequest {
    pub title: String,
    pub latex: Option<String>,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFormulaRequest {
    pub title: Option<String>,
    pub latex: Option<String>,
    pub image_url: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
}
