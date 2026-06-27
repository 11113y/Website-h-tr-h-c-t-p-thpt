import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ArticlesTab({
  articlesList,
  handleDelete
}) {
  return (
    <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div className="table-wrapper" style={{ margin: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tiêu đề bài viết</th>
              <th>Tác giả</th>
              <th>Ngày đăng</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {articlesList.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  Không có bài viết nào
                </td>
              </tr>
            ) : articlesList.map(art => (
              <tr key={art.id}>
                <td style={{ fontWeight: 700 }}>{art.title}</td>
                <td>{art.author_name || 'Admin'}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {new Date(art.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <button 
                    className="btn btn-ghost btn-sm btn-icon" 
                    onClick={() => handleDelete('article', art.id)} 
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
