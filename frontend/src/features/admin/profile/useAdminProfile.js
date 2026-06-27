/**
 * useAdminProfile.js — ViewModel Hook
 * Manages admin profile & password change state and API calls.
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

export function useAdminProfile({ currentUser, setCurrentUser, showAlert }) {
  const [name,           setName]           = useState(currentUser?.name || '');
  const [email,          setEmail]          = useState(currentUser?.email || '');
  const [avatarUrl,      setAvatarUrl]      = useState(currentUser?.avatarUrl || '');
  const [oldPassword,    setOldPassword]    = useState('');
  const [newPassword,    setNewPassword]    = useState('');
  const [confirmPwd,     setConfirmPwd]     = useState('');
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Kích thước ảnh không được vượt quá 2MB.', 'Cảnh báo', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showAlert('Vui lòng nhập họ và tên.', 'Cảnh báo', 'warning');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await axios.put('/api/users/profile', { name, avatarUrl }, { withCredentials: true });
      if (res.data?.success) {
        setCurrentUser(res.data.user);
        showAlert('Cập nhật thông tin cá nhân thành công!', 'Thành công', 'success');
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật thông tin.', 'Lỗi', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPwd) {
      showAlert('Vui lòng điền đầy đủ các thông tin mật khẩu.', 'Cảnh báo', 'warning');
      return;
    }
    if (newPassword !== confirmPwd) {
      showAlert('Mật khẩu mới và xác nhận mật khẩu mới không khớp.', 'Cảnh báo', 'warning');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await axios.put('/api/users/change-password', { oldPassword, newPassword }, { withCredentials: true });
      if (res.data?.success) {
        showAlert('Đổi mật khẩu thành công!', 'Thành công', 'success');
        setOldPassword(''); setNewPassword(''); setConfirmPwd('');
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Đã xảy ra lỗi khi đổi mật khẩu.', 'Lỗi', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return {
    // state
    name, email, avatarUrl,
    oldPassword, newPassword, confirmPwd,
    savingProfile, savingPassword,
    // setters
    setName, setAvatarUrl, setOldPassword, setNewPassword, setConfirmPwd,
    // actions
    handleAvatarChange, handleSaveProfile, handleChangePassword,
  };
}
