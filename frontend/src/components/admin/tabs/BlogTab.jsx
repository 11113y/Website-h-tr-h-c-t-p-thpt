import React, { useState } from 'react';
import { Trash2, Edit, Plus, FileText, Download, X } from 'lucide-react';
import * as adminApi from '../../../api/admin';
import client from '../../../api/client';

export default function BlogTab({
  articlesList,
  documentsList,
  subjectsList,
  handleDelete,
  loadTabDetails
}) {
  const [subTab, setSubTab] = useState('articles'); // 'articles' or 'documents'
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    setUploading(true);
    try {
      const res = await client.post('/admin/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.fileUrl) {
        setFormData(prev => ({ ...prev, file_url: res.data.fileUrl }));
        alert('Tải lên file thành công!');
      }
    } catch (err) {
      alert('Lỗi tải lên file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    setUploadingImage(true);
    try {
      const res = await client.post('/admin/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.fileUrl) {
        setFormData(prev => ({ ...prev, thumbnail: res.data.fileUrl }));
        alert('Tải lên ảnh thành công!');
      }
    } catch (err) {
      alert('Lỗi tải lên ảnh: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      thumbnail: '',
      description: '',
      subject_id: '',
      file_url: '',
      is_vip: false,
      points_required: 0
    });
    setIsEdit(false);
    setShowForm(true);
  };

  const handleOpenEdit = (item, type) => {
    if (type === 'article') {
      setFormData({
        id: item.id,
        title: item.title,
        summary: item.summary || '',
        content: item.content || '',
        thumbnail: item.thumbnail || ''
      });
    } else {
      setFormData({
        id: item.id,
        title: item.title,
        description: item.description || '',
        subject_id: item.subject_id || '',
        file_url: item.file_url || '',
        is_vip: item.is_vip || false,
        points_required: item.points_required || 0
      });
    }
    setIsEdit(true);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (subTab === 'articles') {
        if (isEdit) {
          await adminApi.updateArticle(formData.id, {
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            thumbnail: formData.thumbnail
          });
          alert('Cập nhật bài viết thành công!');
        } else {
          await adminApi.createArticle({
            title: formData.title,
            summary: formData.summary,
            content: formData.content,
            thumbnail: formData.thumbnail
          });
          alert('Tạo bài viết mới thành công!');
        }
      } else {
        // documents
        if (isEdit) {
          // Note: Wait! Does the adminApi export an updateDocument? Let's check!
          // Actually, let's verify if updateDocument exists or if we should just support create & delete for documents,
          // which is the default in the API list. Wait, in adminApi, there is NO updateDocument! Only createDocument and deleteDocument!
          // Let's verify admin.js:
          // export const createDocument = (data) => client.post('/admin/documents', data);
          // export const deleteDocument = (id) => client.delete(`/admin/documents/${id}`);
          // So for documents, we only have create/delete! That is perfect. We can only allow create/delete for documents.
          // Let's check if updateArticle exists. Yes, updateArticle exists!
          if (isEdit) {
             alert('Không hỗ trợ chỉnh sửa tài liệu PDF. Vui lòng xóa và tạo mới!');
             return;
          } else {
            await adminApi.createDocument({
              title: formData.title,
              description: formData.description,
              subject_id: Number(formData.subject_id),
              file_url: formData.file_url,
              is_vip: formData.is_vip,
              points_required: Number(formData.points_required || 0)
            });
            alert('Tạo tài liệu mới thành công!');
          }
        } else {
          await adminApi.createDocument({
            title: formData.title,
            description: formData.description,
            subject_id: Number(formData.subject_id),
            file_url: formData.file_url,
            is_vip: formData.is_vip,
            points_required: Number(formData.points_required || 0)
          });
          alert('Tạo tài liệu mới thành công!');
        }
      }
      setShowForm(false);
      loadTabDetails();
    } catch (err) {
      alert('Lỗi lưu dữ liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-tab selection bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setSubTab('articles')}
            className="btn"
            style={{
              background: subTab === 'articles' ? 'var(--primary)' : 'transparent',
              color: subTab === 'articles' ? '#fff' : '#64748b',
              fontWeight: 700,
              border: subTab === 'articles' ? 'none' : '1px solid #cbd5e1'
            }}
          >
            <FileText size={16} style={{ marginRight: 6 }} /> Bài viết Blog
          </button>
          <button
            onClick={() => setSubTab('documents')}
            className="btn"
            style={{
              background: subTab === 'documents' ? 'var(--primary)' : 'transparent',
              color: subTab === 'documents' ? '#fff' : '#64748b',
              fontWeight: 700,
              border: subTab === 'documents' ? 'none' : '1px solid #cbd5e1'
            }}
          >
            <Download size={16} style={{ marginRight: 6 }} /> Tài liệu PDF
          </button>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm mới
        </button>
      </div>

      {subTab === 'articles' ? (
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Ảnh</th>
                  <th>Tiêu đề bài viết</th>
                  <th>Tác giả</th>
                  <th>Ngày đăng</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {articlesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Không có bài viết nào
                    </td>
                  </tr>
                ) : articlesList.map(art => (
                  <tr key={art.id}>
                    <td>
                      {art.thumbnail ? (
                        <img 
                          src={art.thumbnail} 
                          alt={art.title} 
                          style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} 
                        />
                      ) : (
                        <div style={{ width: 60, height: 40, background: '#f1f5f9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>No Image</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{art.title}</td>
                    <td>{art.author_name || 'Admin'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(art.created_at || art.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleOpenEdit(art, 'article')} 
                          style={{ color: 'var(--primary)' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleDelete('article', art.id)} 
                          style={{ color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
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
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: subTab === 'articles' ? 650 : 500,
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', margin: 0 }}>
                {isEdit ? 'Chỉnh sửa' : 'Thêm mới'} {subTab === 'articles' ? 'Bài viết Blog' : 'Tài liệu PDF'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subTab === 'articles' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề bài viết</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Bí quyết ôn thi THPT Quốc gia đạt điểm cao" 
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ảnh đại diện bài viết</label>
                    {/* Preview area */}
                    {formData.thumbnail && (
                      <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                        <img
                          src={formData.thumbnail}
                          alt="Preview"
                          style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, thumbnail: '' }))}
                          style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}
                          title="Xóa ảnh"
                        >×</button>
                      </div>
                    )}
                    {/* Upload button */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <input
                        type="file"
                        id="article-image-upload"
                        accept="image/*"
                        onChange={handleUploadImage}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="article-image-upload"
                        className="btn"
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                          padding: '10px 18px',
                          borderRadius: 10,
                          border: 'none',
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {uploadingImage ? '⏳ Đang tải lên...' : '🖼️ Chọn ảnh từ máy tính'}
                      </label>
                      {formData.thumbnail && !uploadingImage && (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>✓ Đã có ảnh</span>
                      )}
                    </div>
                    {/* URL fallback */}
                    <input
                      className="form-control"
                      placeholder="Hoặc nhập URL ảnh (https://...)"
                      value={formData.thumbnail || ''}
                      onChange={e => setFormData(p => ({ ...p, thumbnail: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tóm tắt ngắn</label>
                    <input 
                      className="form-control" 
                      placeholder="Một vài câu tóm tắt nội dung chính..." 
                      value={formData.summary || ''}
                      onChange={e => setFormData(p => ({ ...p, summary: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nội dung bài viết (Hỗ trợ Markdown & LaTeX)</label>
                    <textarea 
                      className="form-control" 
                      required
                      rows={8}
                      placeholder="Nội dung chính..." 
                      value={formData.content || ''}
                      onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Tiêu đề tài liệu</label>
                    <input 
                      className="form-control" 
                      required 
                      placeholder="Ví dụ: Tóm tắt công thức Hình học 10" 
                      value={formData.title || ''}
                      onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <input 
                      className="form-control" 
                      placeholder="Mô tả sơ lược về tài liệu..." 
                      value={formData.description || ''}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chọn Môn học</label>
                    <select 
                      className="form-control" 
                      required
                      value={formData.subject_id || ''}
                      onChange={e => setFormData(p => ({ ...p, subject_id: e.target.value }))}
                    >
                      <option value="">-- Chọn chuyên đề học tập --</option>
                      {subjectsList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} (Khối {s.grade})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đường dẫn tệp tài liệu (Tải lên hoặc liên kết)</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                      <input 
                        type="file" 
                        id="pdf-file-upload"
                        accept="application/pdf"
                        onChange={handleUploadFile}
                        style={{ display: 'none' }}
                      />
                      <label 
                        htmlFor="pdf-file-upload" 
                        className="btn" 
                        style={{ 
                          background: '#f1f5f9', 
                          color: '#475569', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontWeight: 700,
                          padding: '10px 16px',
                          borderRadius: 10,
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        <Download size={16} /> Chọn tệp từ máy tính
                      </label>
                      {uploading && <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Đang tải lên...</span>}
                      {formData.file_url && !uploading && (
                        <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          ✓ Đã chọn: {formData.file_url.split('/').pop()}
                        </span>
                      )}
                    </div>
                    <input 
                      className="form-control" 
                      required
                      placeholder="Ví dụ: /uploads/hinh-hoc-10.pdf" 
                      value={formData.file_url || ''}
                      onChange={e => setFormData(p => ({ ...p, file_url: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.is_vip || false}
                        onChange={e => setFormData(p => ({ ...p, is_vip: e.target.checked }))}
                      />
                      Tài liệu VIP
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Điểm yêu cầu tải:</span>
                      <input 
                        type="number"
                        className="form-control" 
                        style={{ width: 80 }}
                        value={formData.points_required || 0}
                        onChange={e => setFormData(p => ({ ...p, points_required: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
