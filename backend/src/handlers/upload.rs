use axum::{
    extract::Multipart,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

pub async fn upload_file(mut multipart: Multipart) -> Result<impl IntoResponse, (StatusCode, String)> {
    let mut file_url = None;
    
    while let Some(field) = multipart.next_field().await.map_err(|err| {
        (StatusCode::BAD_REQUEST, format!("Lỗi tải lên: {}", err))
    })? {
        let name = field.name().unwrap_or("").to_string();
        let file_name = field.file_name().unwrap_or("file").to_string();
        
        let data = field.bytes().await.map_err(|err| {
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Lỗi đọc dữ liệu: {}", err))
        })?;
        
        if name == "file" {
            // Generate unique name
            let ext = Path::new(&file_name)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("pdf");
                
            let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
            
            // Create uploads dir if it doesn't exist
            let uploads_dir = Path::new("uploads");
            if !uploads_dir.exists() {
                std::fs::create_dir_all(uploads_dir).map_err(|err| {
                    (StatusCode::INTERNAL_SERVER_ERROR, format!("Không thể tạo thư mục: {}", err))
                })?;
            }
            
            let dest_path = uploads_dir.join(&new_filename);
            let mut file = File::create(&dest_path).map_err(|err| {
                (StatusCode::INTERNAL_SERVER_ERROR, format!("Không thể tạo tệp: {}", err))
            })?;
            
            file.write_all(&data).map_err(|err| {
                (StatusCode::INTERNAL_SERVER_ERROR, format!("Không thể ghi tệp: {}", err))
            })?;
            
            file_url = Some(format!("/uploads/{}", new_filename));
        }
    }
    
    if let Some(url) = file_url {
        Ok(Json(serde_json::json!({
            "success": true,
            "fileUrl": url
        })))
    } else {
        Err((StatusCode::BAD_REQUEST, "Không tìm thấy trường file".to_string()))
    }
}
