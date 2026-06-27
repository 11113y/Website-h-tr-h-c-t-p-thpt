import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { updateProfile, changePassword } from '../../../api/users';
import { useDialog } from '../../../contexts/DialogContext';
import { User, Shield, Key, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminProfileTab() {
  const { user, refreshUser } = useAuth();
  const { alert } = useDialog();

  // Profile state
  const [username, setUsername] = useState(user?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password state
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setProfileError('Tên đăng nhập không được để trống.');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const res = await updateProfile({ username: username.trim() });
      if (res.data?.success) {
        await refreshUser();
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.response?.data?.error || 'Không thể cập nhật thông tin cá nhân.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (!pwForm.currentPassword) {
      setPwError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setPwLoading(true);

    try {
      const res = await changePassword({
        current_password: pwForm.currentPassword,
        new_password: pwForm.newPassword
      });
      if (res.data?.success) {
        setPwSuccess(true);
        setPwForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setPwSuccess(false), 5000);
      }
    } catch (err) {
      setPwError(err.response?.data?.message || err.response?.data?.error || 'Đổi mật khẩu thất bại.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 28, maxWidth: 1000, margin: '0 auto', padding: '12px 0' }}>
      
      {/* Account Info Form */}
      <div className="card" style={{ padding: 28, borderRadius: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary)' }}>
          <User size={20} />
          Thông tin tài khoản
        </h3>
        
        {profileError && (
          <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}
        
        {profileSuccess && (
          <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} />
            <span>Cập nhật thông tin thành công!</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Email hệ thống</label>
            <input 
              type="email" 
              className="form-control" 
              value={user?.email || ''} 
              disabled 
              style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 600 }}
            />
            <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Email đăng nhập không thể thay đổi.</small>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Tên đăng nhập (Username)</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập mới"
              required 
              style={{ fontWeight: 600 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Vai trò</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 10, color: '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
              <Shield size={16} />
              Quản trị viên (Administrator)
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={profileLoading} 
            style={{ alignSelf: 'flex-start', marginTop: 8, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {profileLoading ? <RefreshCw size={16} className="spinner" /> : null}
            <span>Lưu thay đổi</span>
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="card" style={{ padding: 28, borderRadius: 20, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--primary)' }}>
          <Key size={20} />
          Đổi mật khẩu
        </h3>

        {pwError && (
          <div className="alert alert-danger" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} />
            <span>{pwError}</span>
          </div>
        )}

        {pwSuccess && (
          <div className="alert alert-success" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} />
            <span>Mật khẩu của bạn đã được thay đổi thành công!</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Mật khẩu hiện tại</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Mật khẩu mới</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Tối thiểu 6 ký tự"
              value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700, color: '#334155', marginBottom: 6 }}>Nhập lại mật khẩu mới</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Xác nhận mật khẩu mới"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={pwLoading} 
            style={{ alignSelf: 'flex-start', marginTop: 8, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {pwLoading ? <RefreshCw size={16} className="spinner" /> : null}
            <span>Cập nhật mật khẩu</span>
          </button>
        </form>
      </div>

    </div>
  );
}
