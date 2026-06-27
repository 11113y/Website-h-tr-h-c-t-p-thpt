import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DocumentsTab({
  documentsList,
  handleDelete
}) {
  return (
    <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
      <div className="table-wrapper" style={{ margin: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tiêu đề tài liệu</th>
              <th>Loại</th>
              <th>Điểm yêu cầu</th>
              <th>Lượt tải</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {documentsList.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  Không có tài liệu nào
                </td>
              </tr>
            ) : documentsList.map(doc => (
              <tr key={doc.id}>
                <td style={{ fontWeight: 700 }}>{doc.title}</td>
                <td>
                  <span 
                    className="badge" 
                    style={{ 
                      background: doc.is_vip ? '#fef3c7' : '#f1f5f9', 
                      color: doc.is_vip ? '#d97706' : '#475569',
                      fontWeight: 700
                    }}
                  >
                    {doc.is_vip ? 'VIP' : 'Thường'}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>{doc.points_required}đ</td>
                <td>{doc.download_count || 0} lượt</td>
                <td>
                  <button 
                    className="btn btn-ghost btn-sm btn-icon" 
                    onClick={() => handleDelete('document', doc.id)} 
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
