import React, { useState, useEffect } from 'react';
import { Trash2, Plus, X, HelpCircle, FileText } from 'lucide-react';
import { getSubjects, getChapters } from '../../../api/subjects';
import * as adminApi from '../../../api/admin';
import { useDialog } from '../../../contexts/DialogContext';
import WordImportModal from '../WordImportModal';

export default function QuestionsTab() {
  const { alert, confirm } = useDialog();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [wordImportOpen, setWordImportOpen] = useState(false);

  const [newQuestionForm, setNewQuestionForm] = useState({
    questionText: '',
    questionType: 'single_choice',
    difficulty: 'medium',
    explanation: '',
    points: 10,
    options: [
      { key: 'A', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'B', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'C', optionText: '', isCorrect: false, optionValue: '' },
      { key: 'D', optionText: '', isCorrect: false, optionValue: '' },
    ]
  });

  // Load subjects on mount
  useEffect(() => {
    getSubjects()
      .then(res => {
        const subs = res.data?.subjects || [];
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id.toString());
        }
      })
      .catch(err => console.error('Lỗi tải môn học:', err));
  }, []);

  // Load chapters when selected subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    getChapters(selectedSubjectId)
      .then(res => {
        const chs = res.data?.chapters || [];
        setChapters(chs);
        if (chs.length > 0) {
          setSelectedChapterId(chs[0].id.toString());
        } else {
          setSelectedChapterId('');
        }
      })
      .catch(err => console.error('Lỗi tải chuyên đề:', err));
  }, [selectedSubjectId]);

  // Load questions when selected chapter changes
  const loadQuestions = async () => {
    if (!selectedChapterId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await adminApi.getChapterQuestions(selectedChapterId);
      setQuestions(res.data?.questions || []);
    } catch (err) {
      console.error('Lỗi tải câu hỏi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedChapterId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChapterId) {
      alert('Vui lòng chọn Chuyên đề trước!');
      return;
    }
    if (!newQuestionForm.questionText.trim()) {
      alert('Vui lòng nhập đề bài!');
      return;
    }

    try {
      let opts = [];
      if (newQuestionForm.questionType === 'single_choice') {
        opts = newQuestionForm.options.map(o => ({
          key: o.key,
          option_text: o.optionText.trim(),
          is_correct: o.isCorrect,
          option_value: null
        }));
      } else if (newQuestionForm.questionType === 'input_number') {
        opts = [{
          key: 'ANSWER',
          option_text: 'Đáp án đúng',
          is_correct: true,
          option_value: newQuestionForm.options[0].optionValue.trim()
        }];
      }

      await adminApi.createQuestion({
        chapter_id: selectedChapterId,
        question_text: newQuestionForm.questionText,
        question_type: newQuestionForm.questionType,
        difficulty: newQuestionForm.difficulty,
        explanation: newQuestionForm.explanation,
        points: Number(newQuestionForm.points || 10),
        options: opts
      });

      alert('Đã thêm câu hỏi mới!');
      setShowAddModal(false);
      setNewQuestionForm({
        questionText: '',
        questionType: 'single_choice',
        difficulty: 'medium',
        explanation: '',
        points: 10,
        options: [
          { key: 'A', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'B', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'C', optionText: '', isCorrect: false, optionValue: '' },
          { key: 'D', optionText: '', isCorrect: false, optionValue: '' },
        ]
      });
      loadQuestions();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteQuestion = async (id) => {
    const confirmed = await confirm('Bạn có chắc chắn muốn xóa câu hỏi này?');
    if (!confirmed) return;
    try {
      await adminApi.deleteQuestion(id);
      alert('Đã xóa thành công!');
      loadQuestions();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleWordImportSuccess = (importedIds) => {
    alert(`Đã trích xuất và nhập thành công ${importedIds.length} câu hỏi!`);
    loadQuestions();
  };

  if (wordImportOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <button 
            className="btn btn-ghost" 
            onClick={() => setWordImportOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e1', background: '#fff' }}
          >
            ← Quay lại danh sách câu hỏi
          </button>
        </div>
        <WordImportModal
          isOpen={true}
          inline={true}
          onClose={() => setWordImportOpen(false)}
          preselectedChapterId={Number(selectedChapterId)}
          subjects={subjects}
          onImportSuccess={handleWordImportSuccess}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Filters & Actions Header */}
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
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Lớp:</span>
            <select 
              className="form-control"
              style={{ minWidth: 180, padding: '6px 12px' }}
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
            >
              <option value="">-- Chọn Lớp --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>Lớp {s.grade}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Bài học:</span>
            <select 
              className="form-control"
              style={{ minWidth: 200, padding: '6px 12px' }}
              value={selectedChapterId}
              onChange={e => setSelectedChapterId(e.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">-- Chọn Bài học --</option>
              {chapters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-ghost"
            onClick={() => setWordImportOpen(true)}
            disabled={!selectedChapterId}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <FileText size={16} color="#059669" /> Trích xuất từ Word (.docx)
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            disabled={!selectedChapterId}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Thêm Câu hỏi
          </button>
        </div>
      </div>

      {/* Main List */}
      {!selectedChapterId ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', background: '#fff', borderRadius: 16 }}>
          Vui lòng chọn Bài học và Chuyên đề để xem danh sách câu hỏi tự luyện.
        </div>
      ) : loading ? (
        <div className="page-loading" style={{ padding: '40px 0' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
            Tổng số câu hỏi: {questions.length}
          </span>

          {questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', background: '#fff', borderRadius: 16 }}>
              Chưa có câu hỏi tự luyện nào trong chuyên đề này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ 
                  background: '#fff', 
                  borderRadius: 16, 
                  border: '1px solid #cbd5e1', 
                  padding: 20, 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span className="badge" style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', fontWeight: 800 }}>
                          Câu {idx + 1}
                        </span>
                        <span className="badge" style={{ 
                          fontSize: '0.7rem', 
                          background: q.question_type === 'single_choice' ? '#dbeafe' : '#fef3c7', 
                          color: q.question_type === 'single_choice' ? '#1e40af' : '#92400e',
                          fontWeight: 800
                        }}>
                          {q.question_type === 'single_choice' ? 'Trắc nghiệm' : 'Điền số'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          ({q.points} điểm, độ khó: {q.difficulty})
                        </span>
                      </div>

                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'pre-wrap', marginBottom: 12 }}>
                        {q.question_text}
                      </div>

                      {q.question_type === 'single_choice' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 12, marginBottom: 12 }}>
                          {(q.options || []).map(o => (
                            <div key={o.id} style={{ 
                              fontSize: '0.85rem', 
                              color: o.is_correct ? '#059669' : '#475569', 
                              fontWeight: o.is_correct ? 700 : 500,
                              background: o.is_correct ? '#ecfdf5' : '#transparent',
                              padding: '4px 8px',
                              borderRadius: 6
                            }}>
                              <strong>{o.key}.</strong> {o.option_text} {o.is_correct && '✓'}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.question_type === 'input_number' && (
                        <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, paddingLeft: 12, marginBottom: 12 }}>
                          Đáp án đúng: {(q.options || [])[0]?.option_value || 'Chưa thiết lập'}
                        </div>
                      )}

                      {q.explanation && (
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: 12, 
                          borderRadius: 10, 
                          fontSize: '0.8rem', 
                          color: '#475569', 
                          borderLeft: '4px solid #cbd5e1' 
                        }}>
                          <strong>Lời giải chi tiết:</strong> {q.explanation}
                        </div>
                      )}
                    </div>

                    <button 
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Xóa câu hỏi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Question Modal */}
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
                Thêm Câu hỏi mới
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Loại câu hỏi</label>
                  <select 
                    className="form-control"
                    value={newQuestionForm.questionType}
                    onChange={e => setNewQuestionForm(p => {
                      const nextType = e.target.value;
                      const nextOptions = nextType === 'input_number' 
                        ? [{ key: 'ANSWER', optionText: '', isCorrect: true, optionValue: '' }]
                        : [
                            { key: 'A', optionText: '', isCorrect: false, optionValue: '' },
                            { key: 'B', optionText: '', isCorrect: false, optionValue: '' },
                            { key: 'C', optionText: '', isCorrect: false, optionValue: '' },
                            { key: 'D', optionText: '', isCorrect: false, optionValue: '' },
                          ];
                      return { ...p, questionType: nextType, options: nextOptions };
                    })}
                  >
                    <option value="single_choice">Trắc nghiệm</option>
                    <option value="input_number">Điền số đáp án</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Độ khó</label>
                  <select 
                    className="form-control"
                    value={newQuestionForm.difficulty}
                    onChange={e => setNewQuestionForm(p => ({ ...p, difficulty: e.target.value }))}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Điểm số</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={newQuestionForm.points}
                    onChange={e => setNewQuestionForm(p => ({ ...p, points: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Đề bài (Hỗ trợ LaTeX bằng ký hiệu $, ví dụ: $x^2 + y^2 = r^2$)</label>
                <textarea 
                  required
                  className="form-control"
                  rows={4}
                  placeholder="Nhập nội dung đề bài..."
                  value={newQuestionForm.questionText}
                  onChange={e => setNewQuestionForm(p => ({ ...p, questionText: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
                <div className="no-mathjax" style={{ marginTop: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem', borderLeft: '3px solid #10b981', color: '#1e293b' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Xem trước đề bài:</span>
                  <div className="mathjax" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {newQuestionForm.questionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                  </div>
                </div>
              </div>

              {newQuestionForm.questionType === 'single_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Các phương án lựa chọn (chọn đáp án đúng):</label>
                  {newQuestionForm.options.map((opt, oIdx) => (
                    <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input 
                        type="radio" 
                        name="new-question-correct"
                        checked={opt.isCorrect}
                        onChange={() => setNewQuestionForm(p => {
                          const nextOpts = p.options.map((o, i) => ({ ...o, isCorrect: i === oIdx }));
                          return { ...p, options: nextOpts };
                        })}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{opt.key}:</span>
                      <div className="no-mathjax" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <input 
                          required
                          className="form-control"
                          placeholder={`Nội dung phương án ${opt.key}...`}
                          value={opt.optionText}
                          onChange={e => setNewQuestionForm(p => {
                            const nextOpts = [...p.options];
                            nextOpts[oIdx].optionText = e.target.value;
                            return { ...p, options: nextOpts };
                          })}
                        />
                        <div className="mathjax" style={{ fontSize: '0.75rem', color: '#0f766e', paddingLeft: 4 }}>
                          {opt.optionText || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {newQuestionForm.questionType === 'input_number' && (
                <div className="form-group">
                  <label className="form-label">Đáp án số đúng</label>
                  <input 
                    required
                    className="form-control"
                    placeholder="Ví dụ: 3.14 hoặc 10"
                    value={newQuestionForm.options[0].optionValue}
                    onChange={e => setNewQuestionForm(p => {
                      const nextOpts = [...p.options];
                      nextOpts[0].optionValue = e.target.value;
                      return { ...p, options: nextOpts };
                    })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Lời giải chi tiết</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  placeholder="Nhập hướng dẫn lời giải..."
                  value={newQuestionForm.explanation}
                  onChange={e => setNewQuestionForm(p => ({ ...p, explanation: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
                <div className="no-mathjax" style={{ marginTop: 6, padding: '6px 12px', background: '#f8fafc', borderRadius: 6, fontSize: '0.85rem', borderLeft: '3px solid #10b981', color: '#1e293b' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 2 }}>Xem trước lời giải chi tiết:</span>
                  <div className="mathjax" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {newQuestionForm.explanation || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Trống)</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu câu hỏi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
