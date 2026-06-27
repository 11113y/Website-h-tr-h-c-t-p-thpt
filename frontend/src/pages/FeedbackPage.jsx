import React, { useEffect, useState } from 'react';
import { createFeedback, getFeedbacks } from '../api/feedback';
import { Send, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadFeedbacks = () => {
    getFeedbacks()
      .then(res => setFeedbacks(res.data?.feedbacks || res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await createFeedback({
        title: 'Góp ý từ học sinh',
        content,
        feedback_type: 'suggestion'
      });
      setContent('');
      setSuccess('Cảm ơn phản hồi đóng góp quý giá của bạn!');
      loadFeedbacks();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Gửi phản hồi thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 16px', maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ marginBottom: 6 }}>Góp ý & Phản hồi</h1>
        <p style={{ color: 'var(--text-muted)' }}>Hãy chia sẻ ý kiến của bạn để giúp TD Math ngày càng hoàn thiện hơn</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={16} /> {success}</div>}
          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}><AlertCircle size={16} /> {error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Nội dung đóng góp ý kiến</label>
              <textarea 
                className="form-control" 
                rows={4} 
                placeholder="Nhập nội dung góp ý hoặc báo cáo lỗi gặp phải..." 
                required
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={submitting}>
              <Send size={16} style={{ marginRight: 6 }} /> {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
            </button>
          </form>
        </div>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Phản hồi gần đây</h2>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : feedbacks.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Chưa có ý kiến phản hồi nào</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {feedbacks.map(f => (
            <div key={f.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <strong>{f.title || 'Góp ý của bạn'}</strong>
                <span>{new Date(f.created_at || f.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <span className="badge badge-primary" style={{ marginBottom: 8 }}>{f.status || 'pending'}</span>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{f.content}</p>
              {(f.admin_notes || f.reply) && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--primary-light)', borderLeft: '3px solid var(--primary)', borderRadius: '0 var(--radius) var(--radius) 0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 2 }}>Ban Quản Trị phản hồi:</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', margin: 0 }}>{f.admin_notes || f.reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
