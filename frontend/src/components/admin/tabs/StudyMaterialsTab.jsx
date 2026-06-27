import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { getSubjects, getChapters, getLessons, getStudyMaterials } from '../../../api/subjects';
import * as adminApi from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';
import client from '../../../api/client';

const toVietnameseSlug = (str) => {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.replace(/[\s-]+/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str;
};

export default function StudyMaterialsTab() {
  const { alert, confirm } = useDialog();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);

  // Modal states for CRUD
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: ''
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handleUploadPdf = async (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    setUploadingPdf(true);
    try {
      const res = await client.post('/admin/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.fileUrl) {
        if (isEditMode) {
          setEditingMaterial(prev => ({ ...prev, pdf_url: res.data.fileUrl }));
        } else {
          setFormData(prev => ({ ...prev, pdfUrl: res.data.fileUrl }));
        }
        alert('Tải lên file thành công!');
      }
    } catch (err) {
      alert('Lỗi tải lên file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPdf(false);
    }
  };

  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalChapters, setModalChapters] = useState([]);
  const [modalChapterId, setModalChapterId] = useState('');
  const [modalLessons, setModalLessons] = useState([]);
  const [modalLessonId, setModalLessonId] = useState('');

  useEffect(() => {
    if (!modalSubjectId) {
      setModalChapters([]);
      setModalChapterId('');
      return;
    }
    getChapters(modalSubjectId)
      .then(res => {
        const chs = res.data?.chapters || [];
        setModalChapters(chs);
        if (chs.length > 0) {
          if (modalSubjectId === selectedSubjectId && chs.some(ch => ch.id.toString() === selectedChapterId)) {
            setModalChapterId(selectedChapterId);
          } else {
            setModalChapterId(chs[0].id.toString());
          }
        } else {
          setModalChapterId('');
        }
      })
      .catch(err => console.error('Lỗi tải bài học trong modal:', err));
  }, [modalSubjectId]);

  useEffect(() => {
    if (!modalChapterId) {
      setModalLessons([]);
      setModalLessonId('');
      return;
    }
    getLessons(modalChapterId)
      .then(res => {
        const les = res.data?.lessons || [];
        setModalLessons(les);
        if (les.length > 0) {
          if (modalChapterId === selectedChapterId && les.some(l => l.id.toString() === selectedLessonId)) {
            setModalLessonId(selectedLessonId);
          } else {
            setModalLessonId(les[0].id.toString());
          }
        } else {
          setModalLessonId('');
        }
      })
      .catch(err => console.error('Lỗi tải chuyên đề trong modal:', err));
  }, [modalChapterId]);

  // Load subjects on mount
  useEffect(() => {
    getSubjects()
      .then(res => {
        const subs = res.data?.subjects || [];
        setSubjects(subs);
      })
      .catch(err => console.error('Lỗi tải lớp:', err));
  }, []);

  // Load chapters when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      setLessons([]);
      setSelectedLessonId('');
      return;
    }
    getChapters(selectedSubjectId)
      .then(res => {
        const chs = res.data?.chapters || [];
        setChapters(chs);
        if (chs.length > 0) {
          if (pendingSelection && pendingSelection.subjectId === selectedSubjectId && chs.some(ch => ch.id.toString() === pendingSelection.chapterId)) {
            setSelectedChapterId(pendingSelection.chapterId);
          } else {
            setSelectedChapterId('');
          }
        } else {
          setSelectedChapterId('');
        }
      })
      .catch(err => console.error('Lỗi tải bài học:', err));
  }, [selectedSubjectId, pendingSelection]);

  // Load lessons when selectedChapterId changes
  useEffect(() => {
    if (!selectedChapterId) {
      setLessons([]);
      setSelectedLessonId('');
      return;
    }
    getLessons(selectedChapterId)
      .then(res => {
        const les = res.data?.lessons || [];
        setLessons(les);
        if (les.length > 0) {
          if (pendingSelection && pendingSelection.chapterId === selectedChapterId && les.some(l => l.id.toString() === pendingSelection.lessonId)) {
            setSelectedLessonId(pendingSelection.lessonId);
            setPendingSelection(null);
          } else {
            setSelectedLessonId('');
          }
        } else {
          setSelectedLessonId('');
        }
      })
      .catch(err => console.error('Lỗi tải chuyên đề:', err));
  }, [selectedChapterId, pendingSelection]);

  // Load study materials
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSubjectId) params.subject_id = Number(selectedSubjectId);
      if (selectedChapterId) params.chapter_id = selectedChapterId;
      if (selectedLessonId) params.lesson_id = selectedLessonId;

      const res = await adminApi.getStudyMaterials(params);
      setMaterials(res.data?.materials || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [selectedSubjectId, selectedChapterId, selectedLessonId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!modalLessonId) {
      alert('Vui lòng chọn Chuyên đề trước!');
      return;
    }
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu!');
      return;
    }
    try {
      await adminApi.createStudyMaterial({
        lesson_id: modalLessonId,
        title: formData.title.trim(),
        slug: toVietnameseSlug(formData.title.trim()),
        content: formData.content.trim(),
        is_vip: formData.isVip,
        points_required: Number(formData.pointsRequired),
        order_index: 0,
        pdf_url: formData.pdfUrl.trim() || null,
        video_url: formData.videoUrl.trim() || null
      });
      alert('Thêm tài liệu học tập mới thành công!');
      setShowAddModal(false);
      setFormData({ title: '', slug: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: '' });
      
      // Update top filters to match the modal selection
      if (modalSubjectId === selectedSubjectId && modalChapterId === selectedChapterId && modalLessonId === selectedLessonId) {
        loadMaterials();
      } else {
        setPendingSelection({
          subjectId: modalSubjectId,
          chapterId: modalChapterId,
          lessonId: modalLessonId
        });
        setSelectedSubjectId(modalSubjectId);
        setSelectedChapterId(modalChapterId);
        setSelectedLessonId(modalLessonId);
      }
    } catch (err) {
      alert('Lỗi tạo mới tài liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMaterial.title.trim()) {
      alert('Vui lòng nhập tiêu đề tài liệu!');
      return;
    }
    try {
      await adminApi.updateStudyMaterial(editingMaterial.id, {
        title: editingMaterial.title.trim(),
        slug: toVietnameseSlug(editingMaterial.title.trim()),
        content: editingMaterial.content || '',
        is_vip: editingMaterial.is_vip,
        points_required: Number(editingMaterial.points_required),
        order_index: 0,
        pdf_url: editingMaterial.pdf_url ? editingMaterial.pdf_url.trim() : null,
        video_url: editingMaterial.video_url ? editingMaterial.video_url.trim() : null
      });
      alert('Cập nhật tài liệu học tập thành công!');
      setEditingMaterial(null);
      loadMaterials();
    } catch (err) {
      alert('Lỗi cập nhật tài liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa tài liệu học tập này?');
    if (!ok) return;
    try {
      await adminApi.deleteStudyMaterial(id);
      alert('Xóa tài liệu học tập thành công!');
      loadMaterials();
    } catch (err) {
      alert('Lỗi khi xóa tài liệu: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters Header */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>Lớp:</span>
            <select
              className="form-control"
              style={{ minWidth: 180, height: 40 }}
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
            >
              <option value="">-- Tất cả lớp --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>Lớp {s.grade}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>Bài học:</span>
            <select
              className="form-control"
              style={{ minWidth: 180, height: 40 }}
              value={selectedChapterId}
              onChange={e => setSelectedChapterId(e.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">-- Tất cả bài học --</option>
              {chapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.9rem' }}>Chuyên đề:</span>
            <select
              className="form-control"
              style={{ minWidth: 180, height: 40 }}
              value={selectedLessonId}
              onChange={e => setSelectedLessonId(e.target.value)}
              disabled={!selectedChapterId}
            >
              <option value="">-- Tất cả chuyên đề --</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ title: '', slug: '', content: '', isVip: false, pointsRequired: 0, pdfUrl: '', videoUrl: '' });
            setModalSubjectId(selectedSubjectId);
            setModalChapterId(selectedChapterId);
            setModalLessonId(selectedLessonId);
            setShowAddModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm tài liệu học tập
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="page-loading" style={{ padding: '40px 0' }}><div className="spinner" /></div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>STT</th>
                  <th>Tiêu đề tài liệu</th>
                  <th>Phân loại</th>
                  <th>Điểm tải</th>
                  <th style={{ width: 120, textAlign: 'center' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                      Không tìm thấy tài liệu học tập nào.
                    </td>
                  </tr>
                ) : (
                  materials.map((m, idx) => (
                    <tr key={m.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{m.title}</div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                          {m.pdf_url && (
                            <span style={{ fontSize: '0.75rem', color: '#0ea5e9', display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
                              📄 PDF Đính Kèm
                            </span>
                          )}
                          {m.video_url && (
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
                              🎥 Video Bài Giảng
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {m.is_vip ? (
                          <span style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 900,
                            background: 'var(--warning-light)', color: 'var(--warning)'
                          }}>VIP</span>
                        ) : (
                          <span style={{
                            padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 900,
                            background: '#f1f5f9', color: '#64748b'
                          }}>Thường</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: '#475569' }}>{m.points_required}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Sửa"
                            onClick={() => setEditingMaterial(m)}
                            style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Xóa"
                            onClick={() => handleDelete(m.id)}
                            style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 650,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Thêm tài liệu học tập mới
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Lớp</label>
                <select 
                  className="form-control"
                  value={modalSubjectId}
                  onChange={e => setModalSubjectId(e.target.value)}
                >
                  <option value="">-- Chọn Lớp --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>Lớp {s.grade}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Bài học</label>
                <select 
                  className="form-control"
                  value={modalChapterId}
                  onChange={e => setModalChapterId(e.target.value)}
                  disabled={!modalSubjectId}
                >
                  <option value="">-- Chọn Bài học --</option>
                  {modalChapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Chuyên đề</label>
                <select 
                  className="form-control"
                  value={modalLessonId}
                  onChange={e => setModalLessonId(e.target.value)}
                  disabled={!modalChapterId}
                >
                  <option value="">-- Chọn Chuyên đề --</option>
                  {modalLessons.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tiêu đề tài liệu</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Tài liệu ôn thi giữa kỳ: Giới hạn và liên tục" 
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Tài liệu PDF (Tải lên hoặc liên kết)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="file" 
                    id="material-pdf-upload"
                    accept="application/pdf"
                    onChange={e => handleUploadPdf(e, false)}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="material-pdf-upload" 
                    className="btn" 
                    style={{ 
                      background: '#f1f5f9', 
                      color: '#475569', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  >
                    Chọn tệp từ máy tính
                  </label>
                  {uploadingPdf && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Đang tải lên...</span>}
                  {formData.pdfUrl && !uploadingPdf && (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      ✓ {formData.pdfUrl.split('/').pop()}
                    </span>
                  )}
                </div>
                <input 
                  className="form-control" 
                  placeholder="Ví dụ: /uploads/tailieu.pdf" 
                  value={formData.pdfUrl}
                  onChange={e => setFormData(p => ({ ...p, pdfUrl: e.target.value }))}
                />
              </div>
                <div className="form-group">
                  <label className="form-label">Link video bài giảng (Nếu có)</label>
                  <input 
                    className="form-control" 
                    placeholder="Ví dụ: https://www.youtube.com/embed/..." 
                    value={formData.videoUrl}
                    onChange={e => setFormData(p => ({ ...p, videoUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung lý thuyết (Hỗ trợ Markdown / LaTeX)</label>
                <textarea 
                  className="form-control" 
                  required
                  rows={6}
                  placeholder="Nhập nội dung bài học lý thuyết hoặc tóm tắt kiến thức..." 
                  value={formData.content}
                  onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="isVipAdd"
                    checked={formData.isVip} 
                    onChange={e => setFormData(p => ({ ...p, isVip: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="isVipAdd" style={{ fontWeight: 800, cursor: 'pointer', margin: 0, fontSize: '0.9rem' }}>Yêu cầu tài khoản VIP</label>
                </div>
                {formData.isVip && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Điểm yêu cầu mở khóa</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={formData.pointsRequired} 
                      onChange={e => setFormData(p => ({ ...p, pointsRequired: Number(e.target.value) }))}
                      style={{ height: 36 }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 650,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Chỉnh sửa tài liệu học tập
              </h3>
              <button onClick={() => setEditingMaterial(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tiêu đề tài liệu</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Tài liệu ôn thi giữa kỳ: Giới hạn và liên tục" 
                  value={editingMaterial.title}
                  onChange={e => setEditingMaterial(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="form-label" style={{ fontWeight: 800 }}>Tài liệu PDF (Tải lên hoặc liên kết)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="file" 
                    id="material-pdf-upload-edit"
                    accept="application/pdf"
                    onChange={e => handleUploadPdf(e, true)}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="material-pdf-upload-edit" 
                    className="btn" 
                    style={{ 
                      background: '#f1f5f9', 
                      color: '#475569', 
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 700,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  >
                    Chọn tệp từ máy tính
                  </label>
                  {uploadingPdf && <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Đang tải lên...</span>}
                  {editingMaterial.pdf_url && !uploadingPdf && (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      ✓ {editingMaterial.pdf_url.split('/').pop()}
                    </span>
                  )}
                </div>
                <input 
                  className="form-control" 
                  placeholder="Ví dụ: /uploads/tailieu.pdf" 
                  value={editingMaterial.pdf_url || ''}
                  onChange={e => setEditingMaterial(p => ({ ...p, pdf_url: e.target.value }))}
                />
              </div>
                <div className="form-group">
                  <label className="form-label">Link video bài giảng (Nếu có)</label>
                  <input 
                    className="form-control" 
                    placeholder="Ví dụ: https://www.youtube.com/embed/..." 
                    value={editingMaterial.video_url || ''}
                    onChange={e => setEditingMaterial(p => ({ ...p, video_url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nội dung lý thuyết (Hỗ trợ Markdown / LaTeX)</label>
                <textarea 
                  className="form-control" 
                  required
                  rows={6}
                  placeholder="Nhập nội dung bài học lý thuyết..." 
                  value={editingMaterial.content}
                  onChange={e => setEditingMaterial(p => ({ ...p, content: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="isVipEdit"
                    checked={editingMaterial.is_vip} 
                    onChange={e => setEditingMaterial(p => ({ ...p, is_vip: e.target.checked }))}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <label htmlFor="isVipEdit" style={{ fontWeight: 800, cursor: 'pointer', margin: 0, fontSize: '0.9rem' }}>Yêu cầu tài khoản VIP</label>
                </div>
                {editingMaterial.is_vip && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Điểm yêu cầu mở khóa</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editingMaterial.points_required} 
                      onChange={e => setEditingMaterial(p => ({ ...p, points_required: Number(e.target.value) }))}
                      style={{ height: 36 }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingMaterial(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
