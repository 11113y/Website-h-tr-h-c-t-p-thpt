/**
 * useAdminUsers.js — ViewModel Hook
 * Manages user list, user detail, edit form, create form, delete, and pagination.
 */
import { useState } from 'react';
import axios from 'axios';

export function useAdminUsers({ showAlert }) {
  const [users,            setUsers]           = useState([]);
  const [loading,          setLoading]         = useState(false);
  const [searchQuery,      setSearchQuery]     = useState('');
  const [selectedUser,     setSelectedUser]    = useState(null);
  const [loadingDetail,    setLoadingDetail]   = useState(false);
  const [showEditForm,     setShowEditForm]    = useState(false);
  const [showCreateForm,   setShowCreateForm]  = useState(false);
  const [editSaving,       setEditSaving]      = useState(false);
  const [createSaving,     setCreateSaving]    = useState(false);
  const [deletingId,       setDeletingId]      = useState(null);
  const [editData,         setEditData]        = useState({ id: '', name: '', email: '', school: '', password: '' });
  const [createData,       setCreateData]      = useState({ name: '', email: '', school: '', password: '' });
  const [page,             setPage]            = useState(1);
  const [historyPage,      setHistoryPage]     = useState(1);
  const PAGE_SIZE = 20;
  const HISTORY_SIZE = 5;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data?.success) setUsers(res.data.users);
      else showAlert('Không thể tải danh sách người dùng.', 'Lỗi', 'error');
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi kết nối với server.', 'Lỗi', 'error');
    } finally { setLoading(false); }
  };

  const fetchUserDetail = async (userId) => {
    setLoadingDetail(true);
    setSelectedUser(null);
    setHistoryPage(1);
    try {
      const res = await axios.get(`/api/admin/users/${userId}`);
      if (res.data?.success) { setSelectedUser(res.data.user); return true; }
      else { showAlert('Không thể tải chi tiết người dùng.', 'Lỗi', 'error'); return false; }
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi tải thông tin chi tiết.', 'Lỗi', 'error');
      return false;
    } finally { setLoadingDetail(false); }
  };

  const openEditForm = (user) => {
    setEditData({ id: user.id, name: user.name || '', email: user.email || '', school: user.school || '', password: '' });
    setShowEditForm(true);
  };

  const openCreateForm = () => {
    setCreateData({ name: '', email: '', school: '', password: '' });
    setShowCreateForm(true);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await axios.put(`/api/admin/users/${editData.id}`, {
        name: editData.name,
        email: editData.email,
        school: editData.school || null,
        password: editData.password || undefined,
      });
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) =>
          u.id === editData.id ? { ...u, name: res.data.user.name, email: res.data.user.email, school: res.data.user.school } : u
        ));
        if (selectedUser?.id === editData.id)
          setSelectedUser((prev) => ({ ...prev, name: res.data.user.name, email: res.data.user.email, school: res.data.user.school }));
        showAlert('Cập nhật thông tin học viên thành công!', 'Thành công', 'success');
        setShowEditForm(false);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể cập nhật thông tin học viên.', 'Lỗi', 'error');
    } finally { setEditSaving(false); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreateSaving(true);
    try {
      const res = await axios.post('/api/admin/users', createData);
      if (res.data?.success) {
        setUsers((prev) => [res.data.user, ...prev]);
        showAlert('Tạo tài khoản học sinh thành công!', 'Thành công', 'success');
        setShowCreateForm(false);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể tạo tài khoản học sinh.', 'Lỗi', 'error');
    } finally { setCreateSaving(false); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc muốn xóa học sinh này? Hành động này không thể hoàn tác.')) return;
    setDeletingId(userId);
    try {
      const res = await axios.delete(`/api/admin/users/${userId}`);
      if (res.data?.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        if (selectedUser?.id === userId) setSelectedUser(null);
        showAlert('Xóa tài khoản học sinh thành công!', 'Thành công', 'success');
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể xóa tài khoản học sinh.', 'Lỗi', 'error');
    } finally { setDeletingId(null); }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) && u.role === 'USER';
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Derived user history pagination
  const attempts = selectedUser?.attempts || [];
  const totalHistoryPages = Math.ceil(attempts.length / HISTORY_SIZE);
  const pagedAttempts = attempts.slice((historyPage - 1) * HISTORY_SIZE, historyPage * HISTORY_SIZE);

  return {
    users, loading, searchQuery, setSearchQuery,
    selectedUser, setSelectedUser, loadingDetail,
    showEditForm, setShowEditForm, editData, setEditData, editSaving,
    showCreateForm, setShowCreateForm, createData, setCreateData, createSaving,
    deletingId,
    page, setPage, totalPages, pagedUsers,
    historyPage, setHistoryPage, totalHistoryPages, pagedAttempts,
    fetchUsers, fetchUserDetail, openEditForm, openCreateForm, saveUser, createUser, deleteUser,
  };
}
