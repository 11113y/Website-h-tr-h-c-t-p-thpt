// Touch comment for recompilation
use sqlx::mysql::{MySqlPool, MySqlPoolOptions};

pub async fn create_pool(database_url: &str) -> anyhow::Result<MySqlPool> {
    let pool = MySqlPoolOptions::new()
        .max_connections(20)
        .min_connections(2)
        .connect(database_url)
        .await
        .map_err(|e| anyhow::anyhow!("Không thể kết nối MySQL: {}", e))?;

    // Chạy migrations tự động khi khởi động
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .map_err(|e| anyhow::anyhow!("Migration thất bại: {}", e))?;

    tracing::info!("✅ Kết nối MySQL thành công & migrations đã chạy");
    Ok(pool)
}
