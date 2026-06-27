import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { getSubjects, getChapters, getLessons } from '../../../api/subjects';
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

export default function LessonsTab() {
  const { alert, confirm } = useDialog();
  const [subjects, setSubjects] = useState([]);
  
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState('all'); // default to 'all' (Tất cả lớp)
  const [selectedChapterId, setSelectedChapterId] = useState('all'); // default to 'all' (Tất cả bài học)
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  
  // Simplified add form data
  const [formData, setFormData] = useState({ title: '', isVip: false });

  // Flat list of all chapters for the select list and filter
  const [allChapters, setAllChapters] = useState([]);
  const [modalChapterId, setModalChapterId] = useState('');

  const loadInitialData = async () => {
    try {
      const res = await getSubjects();
      const subs = res.data?.subjects || [];
      subs.sort((a, b) => a.grade - b.grade);
      setSubjects(subs);
      
      // Fetch all chapters from all subjects in parallel to build flat list
      const promises = subs.map(s => 
        getChapters(s.id).then(chRes => {
          const chs = chRes.data?.chapters || [];
          return chs.map(ch => ({
            ...ch,
            grade: s.grade,
            subjectId: s.id
          }));
        })
      );
      const results = await Promise.all(promises);
      const combined = results.flat();
      combined.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.order_index - b.order_index;
      });
      setAllChapters(combined);
    } catch (err) {
      console.error('Lỗi tải dữ liệu ban đầu:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      // Find matching chapters based on class filter
      let matchedChapters = [];
      if (selectedGrade === 'all') {
        matchedChapters = allChapters;
      } else {
        matchedChapters = allChapters.filter(ch => ch.grade === Number(selectedGrade));
      }

      if (selectedChapterId && selectedChapterId !== 'all') {
        // Fetch lessons for the specific selected chapter
        const res = await getLessons(selectedChapterId);
        const matchedCh = allChapters.find(ch => ch.id.toString() === selectedChapterId);
        setLessons((res.data?.lessons || []).map(l => ({
          ...l,
          chapterName: matchedCh?.name,
          grade: matchedCh?.grade
        })));
      } else {
        // Fetch lessons for all matching chapters in parallel
        const promises = matchedChapters.map(ch => 
          getLessons(ch.id).then(res => {
            const les = res.data?.lessons || [];
            return les.map(l => ({
              ...l,
              chapterName: ch.name,
              grade: ch.grade
            }));
          })
        );
        const results = await Promise.all(promises);
        const combined = results.flat();
        
        // Sort by grade, then by order_index
        combined.sort((a, b) => {
          if (a.grade !== b.grade) return a.grade - b.grade;
          return a.order_index - b.order_index;
        });
        setLessons(combined);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chuyên đề:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [selectedGrade, selectedChapterId, allChapters]);

  const handleOpenAddModal = () => {
    setFormData({ title: '', isVip: false });
    // Default to the first chapter in the filtered list if none is selected
    const filteredChapters = selectedGrade === 'all' 
      ? allChapters 
      : allChapters.filter(ch => ch.grade === Number(selectedGrade));

    if (selectedChapterId && selectedChapterId !== 'all') {
      setModalChapterId(selectedChapterId);
    } else if (filteredChapters.length > 0) {
      setModalChapterId(filteredChapters[0].id.toString());
    } else if (allChapters.length > 0) {
      setModalChapterId(allChapters[0].id.toString());
    } else {
      setModalChapterId('');
    }
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!modalChapterId) {
      alert('Vui lòng chọn Bài học!');
      return;
    }
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên chuyên đề!');
      return;
    }

    try {
      const lessonsRes = await getLessons(modalChapterId);
      const existingLessons = lessonsRes.data?.lessons || [];

      const slug = toVietnameseSlug(formData.title.trim());
      await adminApi.createLesson({
        chapter_id: modalChapterId.toString(),
        title: formData.title.trim(),
        slug: slug,
        content: '',
        is_vip: formData.isVip,
        points_required: 0,
        order_index: existingLessons.length + 1,
        pdf_url: ''
      });

      alert('Thêm chuyên đề mới thành công!');
      setShowAddModal(false);
      
      // Reload list
      loadLessons();
      setFormData({ title: '', isVip: false });
    } catch (err) {
      alert('Lỗi thêm chuyên đề: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLesson.title.trim()) {
      alert('Vui lòng nhập tên chuyên đề!');
      return;
    }
    if (!editingLesson.chapter_id) {
      alert('Vui lòng chọn bài học!');
      return;
    }
    try {
      await adminApi.updateLesson(editingLesson.id, {
        chapter_id: editingLesson.chapter_id.toString(),
        title: editingLesson.title.trim(),
        slug: toVietnameseSlug(editingLesson.title.trim())
      });
      alert('Cập nhật chuyên đề thành công!');
      setEditingLesson(null);
      loadLessons();
    } catch (err) {
      alert('Lỗi cập nhật chuyên đề: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteLesson = async (id) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa chuyên đề này? Tất cả học liệu và câu hỏi bên trong chuyên đề cũng sẽ bị xóa.');
    if (!confirmed) return;
    try {
      await adminApi.deleteLesson(id);
      alert('Xóa chuyên đề thành công!');
      loadLessons();
    } catch (err) {
      alert('Lỗi khi xóa chuyên đề: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter the chapters for the secondary filter dropdown dynamically
  const filteredChaptersForSelect = selectedGrade === 'all' 
    ? allChapters 
    : allChapters.filter(ch => ch.grade === Number(selectedGrade));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters row */}
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
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Chọn Lớp:</span>
            <select 
              className="form-control"
              style={{ minWidth: 150, padding: '6px 12px' }}
              value={selectedGrade}
              onChange={e => {
                setSelectedGrade(e.target.value);
                setSelectedChapterId('all'); // Reset chapter filter
              }}
            >
              <option value="all">Tất cả lớp</option>
              {subjects.map(s => (
                <option key={s.grade} value={s.grade}>Lớp {s.grade}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Chọn Bài học:</span>
            <select 
              className="form-control"
              style={{ minWidth: 220, padding: '6px 12px' }}
              value={selectedChapterId}
              onChange={e => setSelectedChapterId(e.target.value)}
            >
              <option value="all">Tất cả bài học</option>
              {filteredChaptersForSelect.map(ch => (
                <option key={ch.id} value={ch.id}>Lớp {ch.grade} - {ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Thêm Chuyên đề
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
                  <th>Bài học</th>
                  <th>Tên chuyên đề</th>
                  <th style={{ width: 100 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {lessons.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      Không tìm thấy chuyên đề nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : lessons.map((les) => (
                  <tr key={les.id}>
                    <td style={{ color: '#475569', fontSize: '0.9rem' }}>{les.chapterName}</td>
                    <td style={{ fontWeight: 800, color: '#1e293b' }}>{les.title}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => setEditingLesson(les)}
                          style={{ color: 'var(--primary)' }}
                          title="Chỉnh sửa chuyên đề"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon" 
                          onClick={() => handleDeleteLesson(les.id)}
                          style={{ color: 'var(--danger)' }}
                          title="Xóa chuyên đề"
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

      {/* Add Lesson (Chuyên đề) Modal */}
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
                Thêm Chuyên đề mới
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Chọn bài học</label>
                <select 
                  className="form-control"
                  required
                  value={modalChapterId}
                  onChange={e => setModalChapterId(e.target.value)}
                >
                  <option value="">-- Chọn Bài học --</option>
                  {allChapters.map(ch => (
                    <option key={ch.id} value={ch.id}>Lớp {ch.grade} - {ch.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tên chuyên đề</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Bài 1: Mệnh đề và tập hợp" 
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isVip}
                    onChange={e => setFormData(p => ({ ...p, isVip: e.target.checked }))}
                  />
                  Yêu cầu tài khoản VIP
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lesson (Chuyên đề) Modal */}
      {editingLesson && (
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
                Chỉnh sửa Chuyên đề
              </h3>
              <button onClick={() => setEditingLesson(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Chọn bài học</label>
                <select 
                  className="form-control"
                  required
                  value={editingLesson.chapter_id || ''}
                  onChange={e => setEditingLesson(p => ({ ...p, chapter_id: e.target.value }))}
                >
                  <option value="">-- Chọn Bài học --</option>
                  {allChapters.map(ch => (
                    <option key={ch.id} value={ch.id}>Lớp {ch.grade} - {ch.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tên chuyên đề</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="Ví dụ: Bài 1: Mệnh đề và tập hợp" 
                  value={editingLesson.title}
                  onChange={e => setEditingLesson(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditingLesson(null)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
