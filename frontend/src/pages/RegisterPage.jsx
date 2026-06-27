import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    setLoading(true);
    try {
      const res = await registerApi({ name:form.name, email:form.email, password:form.password });
      const { token, user } = res.data;
      login(token, user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length >= 8 ? 'strong' : form.password.length >= 6 ? 'ok' : 'weak';

  return (
    <div style={{ minHeight:'calc(100vh - 60px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', background:'var(--bg)' }}>
      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:'3rem', marginBottom:8 }}>🎓</div>
          <h1 style={{ fontSize:'1.5rem', marginBottom:4 }}>Tạo tài khoản miễn phí</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'.9rem' }}>Tham gia cùng cộng đồng TD Math</p>
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
                <label className="form-label">Họ và tên</label>
                <input className="form-control" type="text" placeholder="Nguyễn Văn A" required
                  value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" placeholder="your@email.com" required
                  value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" type={showPw?'text':'password'} placeholder="Ít nhất 6 ký tự" required
                    value={form.password} onChange={e => setForm(p => ({...p, password:e.target.value}))} style={{ paddingRight:44 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}>
                    {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop:6, display:'flex', gap:4 }}>
                    {['weak','ok','strong'].map(lvl => (
                      <div key={lvl} style={{ flex:1, height:4, borderRadius:99, background: pwStrength === 'strong' ? 'var(--success)' : pwStrength === 'ok' && lvl !== 'strong' ? 'var(--warning)' : lvl === 'weak' && form.password ? 'var(--danger)' : 'var(--border)' }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu</label>
                <input className="form-control" type="password" placeholder="Nhập lại mật khẩu" required
                  value={form.confirm} onChange={e => setForm(p => ({...p, confirm:e.target.value}))} />
                {form.confirm && form.password === form.confirm && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, color:'var(--success)', fontSize:'.8rem', marginTop:4 }}>
                    <CheckCircle size={14}/> Mật khẩu khớp
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} disabled={loading}>
                <UserPlus size={17}/> {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>
          </div>
          <div className="card-footer" style={{ textAlign:'center', fontSize:'.875rem' }}>
            Đã có tài khoản? <Link to="/login" style={{ fontWeight:700 }}>Đăng nhập</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
