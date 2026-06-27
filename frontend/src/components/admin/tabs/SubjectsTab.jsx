import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { getSubjects } from '../../../api/subjects';
import * as adminApi from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';

export default function SubjectsTab() {
  const { alert, confirm } = useDialog();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ grade: 10 });

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await getSubjects();
      const sorted = (res.data?.subjects || []).sort((a, b) => a.grade - b.grade);
      setSubjects(sorted);
    } catch (err) {
      console.error('Lỗi tải danh sách Lớp học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    // Check client-side duplicate
    const isDuplicate = subjects.some(s => s.grade === Number(formData.grade));
    if (isDuplicate) {
      alert(`Lớp ${formData.grade} đã tồn tại! Mỗi lớp chỉ được phép có một bản ghi duy nhất.`);
      return;
    }

    try {
      await adminApi.createSubject({
        grade: Number(formData.grade),
        name: `Lớp ${formData.grade}`,
        slug: `lop-${formData.grade}`
      });
      alert('Thêm Lớp học thành công!');
      setShowAddModal(false);
      setFormData({ grade: 10 });
      loadSubjects();
    } catch (err) {
      alert('Lỗi tạo mới: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Check client-side duplicate
    const isDuplicate = subjects.some(s => s.grade === Number(editingSubject.grade) && s.id !== editingSubject.id);
    if (isDuplicate) {
      alert(`Lớp ${editingSubject.grade} đã tồn tại! Mỗi lớp chỉ được phép có một bản ghi duy nhất.`);
      return;
    }

    try {
      await adminApi.updateSubject(editingSubject.id, {
        grade: Number(editingSubject.grade),
        name: `Lớp ${editingSubject.grade}`,
        slug: `lop-${editingSubject.grade}`
      });
      alert('Cập nhật Lớp học thành công!');
      setEditingSubject(null);
      loadSubjects();
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSubject = async (id) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa Lớp này? Tất cả bài học, chuyên đề, bài tập và đề thi liên quan cũng sẽ bị xóa.');
    if (!confirmed) return;
    try {
      await adminApi.deleteSubject(id);
      alert('Xóa Lớp thành công!');
      loadSubjects();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
          Danh sách Lớp
        </h2>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ grade: 10 });
            setShowAddModal(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm Lớp
        </button>
      </div>

      {loading ? (
        <div className="page-loading" style={{ padding: '40px 0' }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>ID</th>
                  <th>Lớp</th>
                  <th style={{ width: 120 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Không có Lớp nào
                    </td>
                  </tr>
                ) : subjects.map(sub => (
                  <tr key={sub.id}>
                    <td>{sub.id}</td>
                    <td style={{ fontWeight: 800, color: '#1e293b' }}>Lớp {sub.grade}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => setEditingSubject(sub)}
                          style={{ color: 'var(--primary)' }}
                          title="Chỉnh sửa Lớp"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleDeleteSubject(sub.id)}
                          style={{ color: 'var(--danger)' }}
                          title="Xóa Lớp"
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
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Thêm Lớp mới
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Khối lớp học</label>
                <select 
                  className="form-control" 
                  required
                  value={formData.grade}
                  onChange={e => setFormData(p => ({ ...p, grade: Number(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 450,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Chỉnh sửa Lớp
              </h3>
              <button onClick={() => setEditingSubject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Khối lớp học</label>
                <select 
                  className="form-control" 
                  required
                  value={editingSubject.grade}
                  onChange={e => setEditingSubject(p => ({ ...p, grade: Number(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingSubject(null)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
