import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetUrl('');
    setLoading(true);
    try {
      const res = await forgotPassword({ email });
      setMessage(res.data?.message || 'Da tao lien ket dat lai mat khau.');
      setResetUrl(res.data?.reset_url || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tao lien ket dat lai mat khau');
    } finally {
      setLoading(false);
    }
  };

  const localResetPath = resetUrl ? (() => {
    try {
      const url = new URL(resetUrl);
      return `${url.pathname}${url.search}`;
    } catch {
      return resetUrl;
    }
  })() : '';

  return (
    <div style={{ minHeight:'calc(100vh - 60px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:'3rem', marginBottom:8 }}>🔐</div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:4 }}>Quên mật khẩu</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'.9rem' }}>Nhập email để tạo liên kết đặt lại mật khẩu</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom:16 }}>
                <AlertCircle size={16}/> {error}
              </div>
            )}
            {message && (
              <div className="alert alert-success" style={{ marginBottom:16 }}>
                <CheckCircle size={16}/> {message}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
                <Mail size={17}/> {loading ? 'Đang xử lý...' : 'Tạo liên kết đặt lại mật khẩu'}
              </button>
            </form>

            {resetUrl && (
              <div style={{ marginTop:18, padding:14, background:'var(--primary-light)', border:'1px solid #bcd0fb', borderRadius:'var(--radius)' }}>
                <div style={{ fontWeight:800, color:'var(--primary-dark)', marginBottom:6 }}>Link demo:</div>
                <Link to={localResetPath} style={{ fontWeight:700, wordBreak:'break-all' }}>
                  {resetUrl}
                </Link>
              </div>
            )}
          </div>
          <div className="card-footer" style={{ textAlign:'center', fontSize:'.875rem' }}>
            <Link to="/login" style={{ fontWeight:700, display:'inline-flex', alignItems:'center', gap:6 }}>
              <ArrowLeft size={15}/> Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
