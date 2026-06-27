import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(form);
      const { token, user } = res.data;
      login(token, user);
      navigate(user.role?.toLowerCase() === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 60px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:'3rem', marginBottom:8 }}>📐</div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:4 }}>Đăng nhập TD Math</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'.9rem' }}>Chào mừng bạn quay trở lại!</p>
        </div>

        <div className="card">
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" style={{ marginBottom:16 }}>
                <AlertCircle size={16}/> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="your@email.com" required
                  value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" type={showPw?'text':'password'} placeholder="••••••••" required
                    value={form.password} onChange={e => setForm(p => ({...p, password:e.target.value}))}
                    style={{ paddingRight:44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <div style={{ textAlign:'right', marginTop:-8 }}>
                <Link to="/forgot-password" style={{ fontSize:'.82rem', fontWeight:700 }}>
                  Quên mật khẩu?
                </Link>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
                <LogIn size={17}/> {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
          <div className="card-footer" style={{ textAlign:'center', fontSize:'.875rem' }}>
            Chưa có tài khoản? <Link to="/register" style={{ fontWeight:700 }}>Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
