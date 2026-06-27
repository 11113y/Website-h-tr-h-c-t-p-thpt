import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, X, FileText, Image as ImageIcon, 
  Upload, HelpCircle, FileCheck, RefreshCw, Eye
} from 'lucide-react';
import * as adminApi from '../../../api/admin';
import { renderMathText } from '../../../pages/QuizPage';
import { preprocessMath } from '../../../pages/BlogPage';
import { useDialog } from '../../../contexts/DialogContext';

export default function FormulasTab() {
  const { alert, confirm } = useDialog();
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: '',
    description: '',
    type: 'latex', // latex | image
    latex: '',
    imageUrl: '',
    status: 'approved'
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFormulas();
  }, []);

  const fetchFormulas = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFormulas();
      if (res.data?.success) {
        setFormulas(res.data.formulas || []);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách công thức:', err);
      alert('Không thể lấy danh sách công thức.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingFormula(null);
    setModalForm({
      title: '',
      description: '',
      type: 'latex',
      latex: '',
      imageUrl: '',
      status: 'approved'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (formula) => {
    setEditingFormula(formula);
    setModalForm({
      title: formula.title || '',
      description: formula.description || '',
      type: formula.image_url ? 'image' : 'latex',
      latex: formula.latex || '',
      imageUrl: formula.image_url || '',
      status: formula.status || 'approved'
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await adminApi.uploadFile(file);
      if (res.data?.success && res.data?.fileUrl) {
        setModalForm(prev => ({
          ...prev,
          imageUrl: res.data.fileUrl
        }));
        alert('Tải ảnh lên thành công!');
      } else {
        alert('Tải ảnh lên thất bại.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      alert('Tiêu đề công thức là bắt buộc!');
      return;
    }

    const payload = {
      title: modalForm.title.trim(),
      description: modalForm.description.trim() || null,
      latex: modalForm.type === 'latex' ? modalForm.latex.trim() : null,
      image_url: modalForm.type === 'image' ? modalForm.imageUrl.trim() : null,
      status: modalForm.status
    };

    try {
      if (editingFormula) {
        await adminApi.updateFormula(editingFormula.id, payload);
        alert('Cập nhật công thức thành công!');
      } else {
        await adminApi.createFormula(payload);
        alert('Tạo công thức mới thành công!');
      }
      setIsModalOpen(false);
      fetchFormulas();
    } catch (err) {
      console.error(err);
      alert('Lỗi xử lý công thức: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteFormula = async (id) => {
    const isConfirmed = await confirm('Bạn có chắc chắn muốn xóa công thức này? Hành động này không thể hoàn tác.');
    if (!isConfirmed) return;

    try {
      await adminApi.deleteFormula(id);
      alert('Xóa công thức thành công!');
      fetchFormulas();
    } catch (err) {
      console.error(err);
      alert('Không thể xóa công thức.');
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await adminApi.approveFormula(id);
      const earned = res.data?.points_earned || 0;
      alert(earned > 0
        ? `Đã phê duyệt công thức và cộng ${earned} điểm cho học sinh!`
        : 'Đã phê duyệt công thức.');
      fetchFormulas();
    } catch (err) {
      console.error(err);
      alert('Lỗi phê duyệt công thức.');
    }
  };

  const handleReject = async (id) => {
    const isConfirmed = await confirm('Từ chối công thức đóng góp này?');
    if (!isConfirmed) return;

    try {
      await adminApi.rejectFormula(id);
      alert('Đã từ chối công thức.');
      fetchFormulas();
    } catch (err) {
      console.error(err);
      alert('Lỗi từ chối công thức.');
    }
  };

  // Filter and search
  const filteredFormulas = formulas.filter(f => {
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.latex && f.latex.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Count pending contributions
  const pendingCount = formulas.filter(f => f.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Search & Filter Header Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        border: '1px solid #e2e8f0'
      }}>
        {/* Left Side: Status Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filterStatus === 'all' ? 'var(--primary)' : '#fff',
              color: filterStatus === 'all' ? '#fff' : '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            Tất cả ({formulas.length})
          </button>
          <button 
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filterStatus === 'pending' ? '#e2b714' : '#fff',
              color: filterStatus === 'pending' ? '#fff' : '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            Chờ duyệt 
            {pendingCount > 0 && (
              <span style={{
                backgroundColor: filterStatus === 'pending' ? '#fff' : '#e2b714',
                color: filterStatus === 'pending' ? '#e2b714' : '#fff',
                fontSize: '0.75rem',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: 8,
                marginLeft: 2
              }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setFilterStatus('approved')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filterStatus === 'approved' ? '#16a34a' : '#fff',
              color: filterStatus === 'approved' ? '#fff' : '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            Đã duyệt ({formulas.filter(f => f.status === 'approved').length})
          </button>
          <button 
            onClick={() => setFilterStatus('rejected')}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: filterStatus === 'rejected' ? '#dc2626' : '#fff',
              color: filterStatus === 'rejected' ? '#fff' : '#475569',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            Đã từ chối ({formulas.filter(f => f.status === 'rejected').length})
          </button>
        </div>

        {/* Right Side: Search and Create */}
        <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <input 
              type="text" 
              placeholder="Tìm kiếm công thức..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                backgroundColor: '#fff'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
          
          <button 
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12 }}
          >
            <Plus size={16} /> Thêm công thức
          </button>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ marginTop: 12, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Đang tải danh sách công thức...</p>
        </div>
      ) : filteredFormulas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#fff',
          borderRadius: 24,
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <HelpCircle size={40} style={{ color: '#94a3b8', marginBottom: 12 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#334155' }}>Không có công thức nào</h3>
          <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Không tìm thấy công thức nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 20
        }}>
          {filteredFormulas.map(f => (
            <div key={f.id} style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              border: f.status === 'pending' ? '2px solid #e2b714' : '1px solid #e2e8f0',
              padding: 20,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
            }}
            >
              {/* Card Header: title and status badge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#1e293b', margin: 0, lineHeight: 1.3 }}>
                    {f.title}
                  </h4>
                  
                  {/* Status Badge */}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    backgroundColor: f.status === 'pending' ? '#fef9c3' : f.status === 'approved' ? '#dcfce7' : '#fee2e2',
                    color: f.status === 'pending' ? '#a16207' : f.status === 'approved' ? '#15803d' : '#b91c1c',
                  }}>
                    {f.status === 'pending' ? 'Chờ duyệt' : f.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                  </span>
                </div>
                
                {f.description && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px 0', fontStyle: 'italic' }}>
                    {f.description}
                  </p>
                )}

                {/* Math Content Preview Area */}
                <div style={{
                  minHeight: 80,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  marginBottom: 16,
                  overflowX: 'auto',
                  position: 'relative'
                }}>
                  {f.latex ? (
                    <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {renderMathText(preprocessMath(f.latex))}
                    </div>
                  ) : f.image_url ? (
                    <img 
                      src={f.image_url} 
                      alt={f.title} 
                      style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Không có nội dung hiển thị</span>
                  )}
                  
                  <span style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 6,
                    fontSize: '0.65rem',
                    color: '#94a3b8',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    {f.latex ? <FileText size={10} /> : <ImageIcon size={10} />}
                    {f.latex ? 'LaTeX' : 'Hình ảnh'}
                  </span>
                </div>
              </div>

              {/* Card Footer: author & actions */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    <div>Bởi: <span style={{ fontWeight: 800, color: '#64748b' }}>{f.creator_username || 'Hệ thống'}</span></div>
                    <div style={{ fontSize: '0.7rem' }}>
                      {new Date(f.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {f.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleApprove(f.id)}
                          title="Phê duyệt"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: '#dcfce7',
                            color: '#16a34a',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbf7d0'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dcfce7'}
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => handleReject(f.id)}
                          title="Từ chối đóng góp"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleOpenEdit(f)}
                          title="Chỉnh sửa"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFormula(f.id)}
                          title="Xóa công thức"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fecaca'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Formula Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 550,
            padding: 28,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                {editingFormula ? 'Chỉnh sửa công thức' : 'Thêm công thức mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label">Tiêu đề công thức *</label>
                <input 
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ví dụ: Định lý Pythagore"
                  value={modalForm.title}
                  onChange={e => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Áp dụng cho tam giác vuông..."
                  value={modalForm.description}
                  onChange={e => setModalForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Type Switcher */}
              <div className="form-group">
                <label className="form-label">Loại hiển thị</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 16,
                    border: modalForm.type === 'latex' ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                    backgroundColor: modalForm.type === 'latex' ? 'var(--primary-light)' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: modalForm.type === 'latex' ? 'var(--primary)' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="radio"
                      name="formula_type"
                      checked={modalForm.type === 'latex'}
                      onChange={() => setModalForm(prev => ({ ...prev, type: 'latex' }))}
                      style={{ display: 'none' }}
                    />
                    <FileText size={16} /> LaTeX
                  </label>
                  
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    borderRadius: 16,
                    border: modalForm.type === 'image' ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                    backgroundColor: modalForm.type === 'image' ? 'var(--primary-light)' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: modalForm.type === 'image' ? 'var(--primary)' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    <input 
                      type="radio"
                      name="formula_type"
                      checked={modalForm.type === 'image'}
                      onChange={() => setModalForm(prev => ({ ...prev, type: 'image' }))}
                      style={{ display: 'none' }}
                    />
                    <ImageIcon size={16} /> Hình ảnh minh họa
                  </label>
                </div>
              </div>

              {/* LaTeX Input & Realtime Preview */}
              {modalForm.type === 'latex' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Biểu thức LaTeX (Không nhập ký tự $)</label>
                    <textarea 
                      className="form-control"
                      rows={3}
                      placeholder="Ví dụ: a^2 + b^2 = c^2"
                      value={modalForm.latex}
                      onChange={e => setModalForm(prev => ({ ...prev, latex: e.target.value }))}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>

                  {/* Realtime Live LaTeX Preview */}
                  {modalForm.latex.trim() && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="form-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Xem trước biểu thức:</span>
                      <div style={{
                        minHeight: 60,
                        backgroundColor: '#f8fafc',
                        border: '1px dashed var(--primary)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 12
                      }}>
                        <div style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {renderMathText(preprocessMath(modalForm.latex))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Url or File Upload */}
              {modalForm.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Đường dẫn ảnh (URL)</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: /uploads/abc.png"
                        value={modalForm.imageUrl}
                        onChange={e => setModalForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      />
                    </div>

                    {/* File Upload Trigger */}
                    <div>
                      <input 
                        type="file"
                        id="formula_image_file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <label 
                        htmlFor="formula_image_file"
                        className="btn btn-ghost"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          padding: '10px 16px',
                          borderRadius: 12,
                          border: '1px solid #cbd5e1',
                          height: '38px'
                        }}
                      >
                        {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        Tải lên
                      </label>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {modalForm.imageUrl.trim() && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="form-label" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Xem trước hình ảnh:</span>
                      <div style={{
                        maxHeight: 120,
                        backgroundColor: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 12,
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={modalForm.imageUrl} 
                          alt="Formula Preview"
                          style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                          onError={(e) => {
                            e.currentTarget.src = '';
                            alert('Không thể tải trước ảnh, vui lòng kiểm tra lại URL.');
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Selector (If Editing) */}
              {editingFormula && (
                <div className="form-group">
                  <label className="form-label">Trạng thái duyệt</label>
                  <select 
                    className="form-control"
                    value={modalForm.status}
                    onChange={e => setModalForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="approved">Đã duyệt (Hiển thị công khai)</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="rejected">Từ chối đóng góp</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ minWidth: 100 }}
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
