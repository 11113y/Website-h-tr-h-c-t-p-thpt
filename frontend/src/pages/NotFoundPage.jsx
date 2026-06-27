import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="container" style={{ textAlign: 'center', padding: '80px 16px', maxWidth: 500 }}>
      <AlertCircle size={64} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>404 - Không tìm thấy trang</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Đường dẫn bạn truy cập không tồn tại hoặc đã bị thay đổi.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        <Home size={16} style={{ marginRight: 6 }} /> Quay lại trang chủ
      </button>
    </div>
  );
}
