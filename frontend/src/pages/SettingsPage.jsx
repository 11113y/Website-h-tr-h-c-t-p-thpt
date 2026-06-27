import React, { useState } from 'react';
import { updateProfile, changePassword } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Save, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [msg, setMsg] = useState({ profile:'', pw:'' });
  const [err, setErr] = useState({ profile:'', pw:'' });
  const [loading, setLoading] = useState({ profile:false, pw:false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(p=>({...p,profile:true})); setMsg(p=>({...p,profile:''})); setErr(p=>({...p,profile:''}));
    try {
      await updateProfile(profileForm);
      await refreshUser();
      setMsg(p=>({...p,profile:'Cập nhật hồ sơ thành công!'}));
    } catch (e) { setErr(p=>({...p,profile:e.response?.data?.message||'Cập nhật thất bại'})); }
    setLoading(p=>({...p,profile:false}));
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setErr(p=>({...p,pw:'Mật khẩu mới không khớp'})); return; }
    if (pwForm.newPassword.length < 6) { setErr(p=>({...p,pw:'Mật khẩu phải ít nhất 6 ký tự'})); return; }
    setLoading(p=>({...p,pw:true})); setMsg(p=>({...p,pw:''})); setErr(p=>({...p,pw:''}));
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setMsg(p=>({...p,pw:'Đổi mật khẩu thành công!'}));
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (e) { setErr(p=>({...p,pw:e.response?.data?.message||'Đổi mật khẩu thất bại'})); }
    setLoading(p=>({...p,pw:false}));
  };

  return (
    <div className="container" style={{ maxWidth:640, padding:'32px 16px' }}>
      <h1 style={{ marginBottom:28 }}>Cài đặt tài khoản</h1>

      {/* Profile settings */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><h3><User size={16} style={{ display:'inline', marginRight:6 }}/>Thông tin cá nhân</h3></div>
        <div className="card-body">
          {msg.profile && <div className="alert alert-success" style={{ marginBottom:16 }}><CheckCircle size={16}/> {msg.profile}</div>}
          {err.profile && <div className="alert alert-danger" style={{ marginBottom:16 }}><AlertCircle size={16}/> {err.profile}</div>}
          <form onSubmit={handleProfileSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-control" value={profileForm.name} onChange={e=>setProfileForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email || ''} disabled style={{ background:'var(--bg)', cursor:'not-allowed' }}/>
              <span className="form-hint">Email không thể thay đổi</span>
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={loading.profile}>
              <Save size={16}/> {loading.profile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-header"><h3><Lock size={16} style={{ display:'inline', marginRight:6 }}/>Đổi mật khẩu</h3></div>
        <div className="card-body">
          {msg.pw && <div className="alert alert-success" style={{ marginBottom:16 }}><CheckCircle size={16}/> {msg.pw}</div>}
          {err.pw && <div className="alert alert-danger" style={{ marginBottom:16 }}><AlertCircle size={16}/> {err.pw}</div>}
          <form onSubmit={handlePwSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {['currentPassword','newPassword','confirm'].map(k=>(
              <div key={k} className="form-group">
                <label className="form-label">
                  {k==='currentPassword'?'Mật khẩu hiện tại':k==='newPassword'?'Mật khẩu mới':'Xác nhận mật khẩu mới'}
                </label>
                <input className="form-control" type="password" required
                  value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={loading.pw}>
              <Lock size={16}/> {loading.pw ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
