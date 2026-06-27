import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonDetail, completeLesson, unlockLesson, getStudyMaterials } from '../api/subjects';
import { getExams } from '../api/exams';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, CheckCircle, BookOpen, Lock, Sparkles, AlertCircle, FileText, Clock, Award } from 'lucide-react';

const getPdfEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }
  return url;
};

export default function LessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [locked, setLocked] = useState(false);
  const [pointsRequired, setPointsRequired] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const loadLesson = () => {
    setLoading(true);
    setError('');
    getLessonDetail(lessonId)
      .then(res => {
        if (res.data?.locked) {
          setLocked(true);
          setPointsRequired(res.data.points_required || 0);
        } else {
          setLocked(false);
          setLesson(res.data?.lesson || res.data);
          setDone(!!res.data?.completed);

          // Tải tài liệu lý thuyết của bài học này
          setLoadingMaterials(true);
          getStudyMaterials(lessonId)
            .then(matRes => {
              setStudyMaterials(matRes.data?.materials || matRes.data || []);
            })
            .catch(err => console.error('Lỗi tải tài liệu lý thuyết:', err))
            .finally(() => setLoadingMaterials(false));

          // Tải đề kiểm tra thực hành của bài học này
          setLoadingExams(true);
          getExams({ lesson_id: lessonId })
            .then(examRes => {
              setExams(examRes.data?.exams || examRes.data || []);
            })
            .catch(err => console.error('Lỗi tải đề thi của bài học:', err))
            .finally(() => setLoadingExams(false));
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Không thể tải bài học');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setError('');
    try {
      await unlockLesson(lessonId);
      await refreshUser();
      loadLesson();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Mở khóa thất bại. Hãy chắc chắn bạn có đủ điểm.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeLesson(lessonId);
      setDone(true);
      await refreshUser();
    } catch {}
    setCompleting(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner"/></div>;

  if (locked) {
    return (
      <div className="container" style={{ maxWidth:600, padding:'40px 16px', textAlign:'center' }}>
        <div style={{ background:'var(--primary-light)', padding:32, borderRadius:'var(--radius-lg)', border:'2px dashed var(--primary)' }}>
          <Lock size={48} color="var(--primary)" style={{ margin:'0 auto 16px' }}/>
          <h2 style={{ marginBottom:8 }}>Bài học VIP cần mở khóa</h2>
          <p style={{ color:'var(--text-muted)', marginBottom:20 }}>
            Bài học này yêu cầu <strong>{pointsRequired}</strong> điểm để mở khóa học tập.
          </p>
          <div style={{ background:'#fff', padding:'12px 20px', borderRadius:'var(--radius)', display:'inline-block', marginBottom:24, border:'1px solid var(--border)' }}>
            Số điểm hiện tại của bạn: <strong style={{ color:'var(--accent)' }}>{user?.points || 0}</strong> điểm
          </div>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom:16, textAlign:'left' }}>
              <AlertCircle size={16}/> {error}
            </div>
          )}
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}><ChevronLeft size={16}/> Quay lại</button>
            <button className="btn btn-primary" onClick={handleUnlock} disabled={unlocking}>
              <Sparkles size={16}/> {unlocking ? 'Đang mở khóa...' : 'Mở khóa ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) return <div className="container" style={{ padding:'40px 0', textAlign:'center' }}>Không tìm thấy bài học</div>;

  return (
    <div className="container" style={{ maxWidth:860, padding:'32px 16px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:20 }} onClick={() => navigate(-1)}>
        <ChevronLeft size={16}/> Quay lại
      </button>

      <div className="card">
        <div className="card-header">
          <div>
            <span className="badge badge-primary" style={{ marginBottom:6 }}>Bài học</span>
            <h1 style={{ fontSize:'1.4rem' }}>{lesson.title}</h1>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', fontSize:'.875rem' }}>
            <BookOpen size={16}/> {lesson.duration || '?'} phút
          </div>
        </div>
        <div className="card-body">
          {lesson.content && (
            <div style={{ lineHeight:1.8, fontSize:'.95rem', marginBottom: 20 }}
              dangerouslySetInnerHTML={{ __html: lesson.content }} />
          )}

          {lesson.pdf_url ? (
            <div style={{ marginTop:16, borderRadius:'var(--radius-lg)', overflow:'hidden', height: '650px', border: '1px solid var(--border)' }}>
              <iframe src={getPdfEmbedUrl(lesson.pdf_url)} title="Tài liệu PDF" style={{ width:'100%', height:'100%', border:'none' }} />
            </div>
          ) : (
            !lesson.content && <p style={{ color:'var(--text-muted)' }}>Nội dung bài học đang được cập nhật...</p>
          )}

          {lesson.videoUrl && (
            <div style={{ marginTop:24, borderRadius:'var(--radius-lg)', overflow:'hidden', aspectRatio:'16/9' }}>
              <iframe src={lesson.videoUrl} allowFullScreen style={{ width:'100%', height:'100%', border:'none' }} />
            </div>
          )}

          {/* STUDY MATERIALS LIST SECTION */}
          <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}>
              📚 Tài liệu lý thuyết ({studyMaterials.length})
            </h3>
            
            {loadingMaterials ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : studyMaterials.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed var(--border)',
                fontSize: '0.9rem',
                marginBottom: 24
              }}>
                Chưa có tài liệu lý thuyết nào được thêm cho chuyên đề này.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {studyMaterials.map(mat => (
                  <div key={mat.id} 
                    onClick={() => {
                      if (mat.is_vip && !user) { navigate('/login'); return; }
                      navigate(`/study-materials/${mat.id}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: '#fff',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                    className="study-material-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FileText size={20} color="var(--primary)" />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>{mat.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                          Đăng lúc: {new Date(mat.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {mat.is_vip && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'var(--warning-light)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 4 }}>
                          VIP
                        </span>
                      )}
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>Xem tài liệu &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EXAMS LIST SECTION */}
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b' }}>
              ✍️ Đề kiểm tra thực hành ({exams.length})
            </h3>
            
            {loadingExams ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : exams.length === 0 ? (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed var(--border)',
                fontSize: '0.9rem'
              }}>
                Chưa có đề kiểm tra thực hành nào được thêm cho chuyên đề này.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {exams.map(exam => {
                  const qCount = exam.question_count || 0;
                  const diffLower = (exam.difficulty || 'medium').toLowerCase();
                  const diffText = diffLower === 'hard' ? 'Khó' : diffLower === 'medium' ? 'Trung bình' : 'Dễ';
                  const diffBadge = diffLower === 'hard' ? 'badge-danger' : diffLower === 'medium' ? 'badge-warning' : 'badge-success';

                  return (
                    <div key={exam.id} className="card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                      <div className="card-body" style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span className={`badge ${diffBadge}`} style={{ fontSize: '0.7rem' }}>{diffText}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Award size={13} /> +{exam.points_rewarded || 50} điểm
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, lineHeight: 1.4, flex: 1, color: '#1e293b' }}>
                          {exam.title}
                        </h4>
                        <div style={{ display: 'flex', gap: 12, color: 'var(--text-muted)', fontSize: '0.725rem', marginBottom: 14 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13}/> {exam.time_limit_minutes || 45} phút</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={13}/> {qCount} câu hỏi</span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700 }}
                          onClick={() => navigate(`/exams/${exam.id}`)}
                        >
                          Bắt đầu làm bài
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="card-footer" style={{ display:'flex', justifyContent:'flex-end' }}>
          {done ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--success)', fontWeight:700 }}>
              <CheckCircle size={20}/> Đã học!
            </div>
          ) : (
            <button className="btn btn-success" onClick={handleComplete} disabled={completing}>
              <CheckCircle size={17}/> {completing ? 'Đang lưu...' : 'Đánh dấu đã học'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
