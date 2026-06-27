import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudyMaterialDetail, completeStudyMaterial, unlockStudyMaterial } from '../api/subjects';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, CheckCircle, BookOpen, Lock, Sparkles, AlertCircle } from 'lucide-react';

const getEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/embed/')) return url;
  try {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const params = new URLSearchParams(url.split('?')[1]);
      videoId = params.get('v');
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    console.error(e);
  }
  return url;
};

const getPdfEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    return url.replace(/\/view(\?.*)?$/, '/preview');
  }
  return url;
};

export default function StudyMaterialDetailPage() {
  const { materialId } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [material, setMaterial] = useState(null);
  const [locked, setLocked] = useState(false);
  const [pointsRequired, setPointsRequired] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const loadMaterial = () => {
    setLoading(true);
    setError('');
    getStudyMaterialDetail(materialId)
      .then(res => {
        if (res.data?.locked) {
          setLocked(true);
          setPointsRequired(res.data.points_required || 0);
        } else {
          setLocked(false);
          setMaterial(res.data?.material || res.data);
          setDone(!!res.data?.completed);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Không thể tải tài liệu học tập');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setError('');
    try {
      await unlockStudyMaterial(materialId);
      await refreshUser();
      loadMaterial();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Mở khóa thất bại. Hãy chắc chắn bạn có đủ điểm.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeStudyMaterial(materialId);
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
          <h2 style={{ marginBottom:8 }}>Tài liệu VIP cần mở khóa</h2>
          <p style={{ color:'var(--text-muted)', marginBottom:20 }}>
            Tài liệu này yêu cầu <strong>{pointsRequired}</strong> điểm để mở khóa học tập.
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

  if (!material) return <div className="container" style={{ padding:'40px 0', textAlign:'center' }}>Không tìm thấy tài liệu học tập</div>;

  return (
    <div className="container" style={{ maxWidth:860, padding:'32px 16px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:20 }} onClick={() => navigate(-1)}>
        <ChevronLeft size={16}/> Quay lại
      </button>

      <div className="card">
        <div className="card-header">
          <div>
            <span className="badge badge-primary" style={{ marginBottom:6 }}>Tài liệu học tập</span>
            <h1 style={{ fontSize:'1.4rem' }}>{material.title}</h1>
          </div>
        </div>
        <div className="card-body">
          {material.video_url && (
            <div style={{ marginBottom:24, borderRadius:'var(--radius-lg)', overflow:'hidden', aspectRatio:'16/9', border: '1px solid var(--border)' }}>
              <iframe src={getEmbedUrl(material.video_url)} allowFullScreen style={{ width:'100%', height:'100%', border:'none' }} />
            </div>
          )}

          {material.content && (
            <div style={{ lineHeight:1.8, fontSize:'.95rem', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
              {material.content}
            </div>
          )}

          {material.pdf_url ? (
            <div style={{ marginTop: 16 }}>
              {/* Nút tải về luôn hiển thị */}
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <a
                  href={material.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8,
                    background: 'var(--primary)', color: '#fff',
                    fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none'
                  }}
                >
                  📥 Tải PDF về máy
                </a>
                <a
                  href={material.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8,
                    background: '#f1f5f9', color: '#475569',
                    fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  🔗 Mở PDF trong tab mới
                </a>
              </div>
              {/* Iframe xem PDF trực tiếp */}
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '700px', border: '1px solid var(--border)' }}>
                <iframe
                  src={getPdfEmbedUrl(material.pdf_url)}
                  title="Tài liệu PDF"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            </div>
          ) : (
            !material.content && !material.video_url && <p style={{ color: 'var(--text-muted)' }}>Nội dung tài liệu đang được cập nhật...</p>
          )}
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
