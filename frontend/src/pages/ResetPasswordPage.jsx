import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ.');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ token, password: form.password });
      setMessage(res.data?.message || 'Đặt lại mật khẩu thành công.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 60px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:440 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:'3rem', marginBottom:8 }}>🔑</div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:4 }}>Đặt lại mật khẩu</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'.9rem' }}>Tạo mật khẩu mới cho tài khoản của bạn</p>
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
                <label className="form-label">Mật khẩu mới</label>
                <div style={{ position:'relative' }}>
                  <input
                    className="form-control"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Ít nhất 6 ký tự"
                    required
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password:e.target.value }))}
                    style={{ paddingRight:44 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu mới</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm:e.target.value }))}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
                <KeyRound size={17}/> {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </div>
          <div className="card-footer" style={{ textAlign:'center', fontSize:'.875rem' }}>
            <Link to="/login" style={{ fontWeight:700 }}>Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
