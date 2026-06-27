import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubjects, getChapters, getLessons, getStudyMaterials } from '../api/subjects';
import { getExams } from '../api/exams';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ChevronRight, Lock, CheckCircle2, PlayCircle, BookOpen, FileText, Award } from 'lucide-react';

export default function LearnPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);
  const [chLoading, setChLoading] = useState(false);

  // States for lesson accordion and sub-items
  const [expandedLessons, setExpandedLessons] = useState({});
  const [lessonMaterials, setLessonMaterials] = useState({});
  const [lessonExams, setLessonExams] = useState({});
  const [lessonLoading, setLessonLoading] = useState({});

  useEffect(() => {
    getSubjects().then(res => {
      const subs = res.data?.subjects || res.data || [];
      setSubjects(subs);
      const target = subjectId ? subs.find(s => String(s.id) === subjectId) : subs[0];
      if (target) selectSubject(target, subs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectSubject = async (sub, subsArr) => {
    setSelectedSubject(sub);
    setChLoading(true);
    setChapters([]);
    setExpandedChapter(null);
    setLessons({});
    setExpandedLessons({});
    setLessonMaterials({});
    setLessonExams({});
    setLessonLoading({});
    try {
      const res = await getChapters(sub.id);
      setChapters(res.data?.chapters || res.data || []);
    } catch {}
    setChLoading(false);
  };

  const toggleChapter = async (chapter) => {
    if (expandedChapter === chapter.id) { setExpandedChapter(null); return; }
    setExpandedChapter(chapter.id);
    if (!lessons[chapter.id]) {
      try {
        const res = await getLessons(chapter.id);
        setLessons(prev => ({ ...prev, [chapter.id]: res.data?.lessons || res.data || [] }));
      } catch {}
    }
  };

  const toggleLesson = async (lesson) => {
    const isExpanded = !!expandedLessons[lesson.id];
    setExpandedLessons(prev => ({ ...prev, [lesson.id]: !isExpanded }));

    if (!isExpanded && !lessonMaterials[lesson.id]) {
      setLessonLoading(prev => ({ ...prev, [lesson.id]: true }));
      try {
        const [materialsRes, examsRes] = await Promise.all([
          getStudyMaterials(lesson.id).catch(() => ({ data: [] })),
          getExams({ lesson_id: lesson.id }).catch(() => ({ data: [] }))
        ]);
        
        setLessonMaterials(prev => ({ 
          ...prev, 
          [lesson.id]: materialsRes.data?.materials || materialsRes.data || [] 
        }));
        
        setLessonExams(prev => ({ 
          ...prev, 
          [lesson.id]: examsRes.data?.exams || examsRes.data || [] 
        }));
      } catch (err) {
        console.error("Lỗi khi tải tài liệu/đề thi của chuyên đề:", err);
      } finally {
        setLessonLoading(prev => ({ ...prev, [lesson.id]: false }));
      }
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"/></div>;

  return (
    <div className="layout-with-sidebar">
      {/* Sidebar — Subjects */}
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-title">Chọn bài học</div>
          {subjects.map(sub => (
            <button key={sub.id} className={`sidebar-item ${selectedSubject?.id === sub.id ? 'active' : ''}`}
              onClick={() => selectSubject(sub, subjects)}>
              <span className="icon">📚</span>
              <span>{sub.name && sub.name.includes('Lớp') ? sub.name.substring(sub.name.indexOf('Lớp')) : `Lớp ${sub.grade}`}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {selectedSubject && (
          <>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:'1.4rem', marginBottom:4 }}>
                {selectedSubject.name && selectedSubject.name.includes('Lớp') ? selectedSubject.name.substring(selectedSubject.name.indexOf('Lớp')) : `Lớp ${selectedSubject.grade}`}
              </h1>
              <p style={{ color:'var(--text-muted)', fontSize:'.875rem' }}>Chọn bài học để bắt đầu học tập</p>
            </div>

            {chLoading ? (
              <div className="page-loading"><div className="spinner"/></div>
            ) : chapters.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                <BookOpen size={48} style={{ margin:'0 auto 12px', opacity:.3 }}/>
                <p>Chưa có nội dung cho bài học này</p>
              </div>
            ) : chapters.map(ch => (
              <div key={ch.id} className="chapter-item">
                <div className="chapter-header" onClick={() => toggleChapter(ch)}>
                  {expandedChapter === ch.id ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  <span style={{ flex:1 }}>{ch.name || ch.title}</span>
                  <span style={{ fontSize:'.8rem', color:'var(--text-muted)', fontWeight:400 }}>{ch.lessonCount || 0} chuyên đề</span>
                </div>

                {expandedChapter === ch.id && (
                  <div className="chapter-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
                    {!lessons[ch.id] ? (
                      <div style={{ padding:'12px' }}><div className="spinner" style={{ width:20, height:20 }}/></div>
                    ) : lessons[ch.id].length === 0 ? (
                      <div style={{ padding:'12px', color:'var(--text-muted)', fontSize:'.875rem' }}>Chưa có chuyên đề nào</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {lessons[ch.id].map(lesson => {
                          const isExp = !!expandedLessons[lesson.id];
                          return (
                            <div key={lesson.id} style={{ display: 'flex', flexDirection: 'column' }}>
                              <div className={`lesson-row ${lesson.is_vip ? 'locked' : ''}`}
                                onClick={() => toggleLesson(lesson)}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 12, 
                                  padding: '14px 18px', 
                                  borderRadius: isExp ? '12px 12px 0 0' : '12px', 
                                  cursor: 'pointer', 
                                  background: '#fff', 
                                  border: '1px solid #e2e8f0', 
                                  borderBottom: isExp ? 'none' : '1px solid #e2e8f0',
                                  transition: 'all 0.2s' 
                                }}>
                                <BookOpen size={18} color="var(--primary)"/>
                                <span className="lesson-title" style={{ flex: 1, fontWeight: 700, color: '#1e293b' }}>{lesson.title}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {lesson.is_vip && <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 6px', borderRadius: 4 }}>VIP</span>}
                                  {isExp ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                                </div>
                              </div>

                              {isExp && (
                                <div style={{ 
                                  padding: '8px 16px 16px 20px', 
                                  background: '#f8fafc', 
                                  borderBottomLeftRadius: 12, 
                                  borderBottomRightRadius: 12, 
                                  border: '1px solid #e2e8f0', 
                                  borderTop: 'none', 
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8
                                }}>
                                  {lessonLoading[lesson.id] ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0', color: 'var(--text-muted)' }}>
                                      <div className="spinner" style={{ width: 16, height: 16 }} />
                                      <span style={{ fontSize: '0.85rem' }}>Đang tải tài liệu & đề thi...</span>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Check if both are empty */}
                                      {(!lessonMaterials[lesson.id] || lessonMaterials[lesson.id].length === 0) && 
                                       (!lessonExams[lesson.id] || lessonExams[lesson.id].length === 0) ? (
                                        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                          Chưa có tài liệu học tập hoặc đề thi nào.
                                        </div>
                                      ) : (
                                        <>
                                          {/* Materials list */}
                                          {lessonMaterials[lesson.id] && lessonMaterials[lesson.id].map(mat => (
                                            <div 
                                              key={mat.id}
                                              onClick={() => {
                                                if (mat.is_vip && !isLoggedIn) { navigate('/login'); return; }
                                                navigate(`/study-materials/${mat.id}`);
                                              }}
                                              style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 10, 
                                                padding: '10px 14px', 
                                                borderRadius: 8, 
                                                background: '#fff', 
                                                border: '1px solid #e2e8f0', 
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s'
                                              }}
                                              className="sub-lesson-row"
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.02)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#fff';
                                              }}
                                            >
                                              <FileText size={16} color="var(--primary)" />
                                              <span style={{ flex: 1, fontWeight: 600, color: '#334155' }}>
                                                {mat.title}
                                              </span>
                                              {mat.is_vip && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 6px', borderRadius: 4 }}>
                                                  VIP
                                                </span>
                                              )}
                                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tài liệu</span>
                                            </div>
                                          ))}

                                          {/* Exams list */}
                                          {lessonExams[lesson.id] && lessonExams[lesson.id].map(exam => (
                                            <div 
                                              key={exam.id}
                                              onClick={() => {
                                                navigate(`/exams/${exam.id}`);
                                              }}
                                              style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 10, 
                                                padding: '10px 14px', 
                                                borderRadius: 8, 
                                                background: '#fff', 
                                                border: '1px solid #e2e8f0', 
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s'
                                              }}
                                              className="sub-lesson-row"
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--primary)';
                                                e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.02)';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.background = '#fff';
                                              }}
                                            >
                                              <Award size={16} color="#f59e0b" />
                                              <span style={{ flex: 1, fontWeight: 600, color: '#334155' }}>
                                                {exam.title}
                                              </span>
                                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đề thi</span>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


