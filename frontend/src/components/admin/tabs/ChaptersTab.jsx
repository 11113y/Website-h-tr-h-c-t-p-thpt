import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, X } from 'lucide-react';
import { getSubjects, getChapters } from '../../../api/subjects';
import * as adminApi from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';

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

export default function ChaptersTab() {
  const { alert, confirm } = useDialog();
  const [subjects, setSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('all'); // default to 'all'
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Add form data (exactly 2 fields: grade, name)
  const [formData, setFormData] = useState({ grade: 10, name: '' });
  
  // Edit form data
  const [editFormData, setEditFormData] = useState({ id: '', name: '', slug: '', orderIndex: 0, subjectId: '' });

  const loadSubjectsAndChapters = async () => {
    setLoading(true);
    try {
      const res = await getSubjects();
      const subs = res.data?.subjects || [];
      subs.sort((a, b) => a.grade - b.grade);
      setSubjects(subs);
      
      if (selectedGrade === 'all') {
        // Fetch chapters for all subjects in parallel
        const allChaptersPromises = subs.map(s => 
          getChapters(s.id).then(chRes => {
            const chs = chRes.data?.chapters || [];
            return chs.map(ch => ({
              ...ch,
              subjectName: s.name,
              grade: s.grade
            }));
          })
        );
        const results = await Promise.all(allChaptersPromises);
        const combined = results.flat();
        
        // Sort chapters: grade ascending, order_index ascending
        combined.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.order_index - b.order_index;
        });
        setChapters(combined);
      } else {
        const matchedSubject = subs.find(s => s.grade === Number(selectedGrade));
        if (matchedSubject) {
          const chaptersRes = await getChapters(matchedSubject.id);
          const chs = chaptersRes.data?.chapters || [];
          setChapters(chs.map(ch => ({
            ...ch,
            subjectName: matchedSubject.name,
            grade: matchedSubject.grade
          })));
        } else {
          setChapters([]);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách bài học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjectsAndChapters();
  }, [selectedGrade]);

  const handleOpenAddModal = () => {
    if (subjects.length === 0) {
      alert('Chưa có Lớp nào trong hệ thống! Vui lòng tạo Lớp trước ở tab Lớp.');
      return;
    }
    const defaultGrade = selectedGrade === 'all' ? subjects[0].grade : Number(selectedGrade);
    setFormData({ grade: defaultGrade, name: '' });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }

    try {
      // 1. Find the corresponding subject for the selected grade
      let subject = subjects.find(s => s.grade === formData.grade);
      
      if (!subject) {
        alert(`Lớp ${formData.grade} chưa được tạo. Vui lòng vào phần quản lý "Lớp" để tạo lớp này trước!`);
        return;
      }

      // 2. Fetch current chapters of this subject to compute order_index
      const chaptersRes = await getChapters(subject.id);
      const existingChapters = chaptersRes.data?.chapters || [];

      // 3. Create the chapter/lesson
      const slug = toVietnameseSlug(formData.name.trim());
      await adminApi.createChapter({
        subject_id: subject.id,
        name: formData.name.trim(),
        slug: slug,
        order_index: existingChapters.length + 1
      });

      alert('Thêm bài học mới thành công!');
      setShowAddModal(false);

      // 4. Reload data
      loadSubjectsAndChapters();
      
      setFormData({ grade: 10, name: '' });
    } catch (err) {
      alert('Lỗi tạo mới: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }
    try {
      await adminApi.updateChapter(editFormData.id, {
        subject_id: editFormData.subjectId,
        name: editFormData.name.trim(),
        slug: toVietnameseSlug(editFormData.name.trim())
      });
      alert('Cập nhật bài học thành công!');
      setShowEditModal(false);
      loadSubjectsAndChapters();
    } catch (err) {
      alert('Lỗi cập nhật: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteChapter = async (id) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa bài học này? Tất cả chuyên đề và đề thi bên trong bài học cũng sẽ bị xóa.');
    if (!confirmed) return;
    try {
      await adminApi.deleteChapter(id);
      alert('Xóa bài học thành công!');
      loadSubjectsAndChapters();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selection row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: '#f8fafc',
        padding: '16px 24px',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>Chọn Lớp:</span>
          <select 
            className="form-control"
            style={{ minWidth: 160, padding: '8px 12px' }}
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
          >
            <option value="all">Tất cả lớp</option>
            {subjects.map(s => (
              <option key={s.grade} value={s.grade}>Lớp {s.grade}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm Bài học
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="page-loading" style={{ padding: '40px 0' }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ borderRadius: 16, overflow: 'hidden', padding: 0 }}>
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>STT</th>
                  <th style={{ width: 120 }}>Lớp</th>
                  <th>Tên bài học</th>
                  <th style={{ width: 100 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {chapters.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Chưa có bài học nào.
                    </td>
                  </tr>
                ) : chapters.map((ch, index) => (
                  <tr key={ch.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Lớp {ch.grade}</td>
                    <td style={{ fontWeight: 800, color: '#1e293b' }}>{ch.name}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => {
                            setEditFormData({
                              id: ch.id,
                              name: ch.name,
                              slug: ch.slug,
                              subjectId: ch.subject_id
                            });
                            setShowEditModal(true);
                          }}
                          style={{ color: 'var(--primary)' }}
                          title="Sửa bài học"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleDeleteChapter(ch.id)}
                          style={{ color: 'var(--danger)' }}
                          title="Xóa bài học"
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

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Thêm Bài học mới
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Chọn lớp</label>
                <select 
                  className="form-control"
                  required
                  value={formData.grade}
                  onChange={e => setFormData(p => ({ ...p, grade: Number(e.target.value) }))}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.grade}>Lớp {s.grade}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tên bài học</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Chương 1: Mệnh đề" 
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500,
            padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                Chỉnh sửa Bài học
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Tên bài học</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Chương 1: Mệnh đề" 
                  value={editFormData.name}
                  onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
