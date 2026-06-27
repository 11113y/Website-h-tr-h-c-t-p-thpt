/**
 * useAdminManagers.js — ViewModel Hook
 * Manages admin account list: create, edit, delete.
 */
import { useState } from 'react';
import axios from 'axios';

export function useAdminManagers({ showAlert, currentUser }) {
  const [admins,       setAdmins]      = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [searchQuery,  setSearchQuery] = useState('');

  const [showEditForm,    setShowEditForm]   = useState(false);
  const [showCreateForm,  setShowCreateForm] = useState(false);
  const [editSaving,      setEditSaving]     = useState(false);
  const [createSaving,    setCreateSaving]   = useState(false);
  const [deletingId,      setDeletingId]     = useState(null);

  const [editData,   setEditData]   = useState({ id: '', name: '', email: '', password: '' });
  const [createData, setCreateData] = useState({ name: '', email: '', password: '' });

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/admins');
      if (res.data?.success) setAdmins(res.data.admins);
      else showAlert('Không thể tải danh sách Admin.', 'Lỗi', 'error');
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi kết nối với server.', 'Lỗi', 'error');
    } finally { setLoading(false); }
  };

  const openEditForm = (admin) => {
    setEditData({ id: admin.id, name: admin.name || '', email: admin.email || '', password: '' });
    setShowEditForm(true);
  };

  const openCreateForm = () => {
    setCreateData({ name: '', email: '', password: '' });
    setShowCreateForm(true);
  };

  const saveAdmin = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await axios.put(`/api/admin/admins/${editData.id}`, {
        name: editData.name,
        email: editData.email,
        password: editData.password || undefined,
      });
      if (res.data?.success) {
        setAdmins((prev) => prev.map((a) =>
          a.id === editData.id ? { ...a, name: res.data.admin.name, email: res.data.admin.email } : a
        ));
        showAlert('Cập nhật tài khoản Admin thành công!', 'Thành công', 'success');
        setShowEditForm(false);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể cập nhật tài khoản Admin.', 'Lỗi', 'error');
    } finally { setEditSaving(false); }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setCreateSaving(true);
    try {
      const res = await axios.post('/api/admin/admins', createData);
      if (res.data?.success) {
        setAdmins((prev) => [...prev, res.data.admin]);
        showAlert('Tạo tài khoản Admin thành công!', 'Thành công', 'success');
        setShowCreateForm(false);
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể tạo tài khoản Admin.', 'Lỗi', 'error');
    } finally { setCreateSaving(false); }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài khoản Admin này? Hành động không thể hoàn tác.')) return;
    setDeletingId(adminId);
    try {
      const res = await axios.delete(`/api/admin/admins/${adminId}`);
      if (res.data?.success) {
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));
        showAlert('Xóa tài khoản Admin thành công!', 'Thành công', 'success');
      }
    } catch (err) {
      showAlert(err.response?.data?.message || 'Không thể xóa tài khoản Admin.', 'Lỗi', 'error');
    } finally { setDeletingId(null); }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filteredAdmins.length / PAGE_SIZE);
  const pagedAdmins = filteredAdmins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    admins, loading, searchQuery, setSearchQuery,
    showEditForm, setShowEditForm, editData, setEditData, editSaving,
    showCreateForm, setShowCreateForm, createData, setCreateData, createSaving,
    deletingId,
    page, setPage, totalPages, pagedAdmins,
    fetchAdmins, openEditForm, openCreateForm, saveAdmin, createAdmin, deleteAdmin,
  };
}
