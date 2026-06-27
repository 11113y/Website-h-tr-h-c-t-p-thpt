/**
 * AdminManagers.jsx — View
 * CRUD management for Admin accounts only.
 */
import React, { useEffect } from 'react';
import {
  Search, RefreshCw, Calendar, Edit, X, Trash2,
  UserCog, UserPlus, Loader2, ShieldCheck
} from 'lucide-react';
import { useAdminManagers } from './useAdminManagers';
import Pagination from '../../../components/shared/Pagination';
import { useTheme } from '../../../utils/ThemeContext';
import { getAdminPalette } from '../../../utils/adminColorUtils';

export default function AdminManagers({ showAlert, currentUser }) {
  const { adminColor, adminTheme } = useTheme();
  const p = getAdminPalette(adminColor, adminTheme);
  const isDark = p.isDark;

  const vm = useAdminManagers({ showAlert, currentUser });

  useEffect(() => {
    vm.fetchAdmins();
  }, []);

  const inputCls = `w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[11px] placeholder-gray-400 focus:outline-none font-bold transition-all ${
    isDark
      ? 'bg-[var(--admin-surface-dim)] text-[var(--admin-text-primary)] border-[var(--admin-border)]'
      : 'bg-white text-[#241916]'
  }`;

  return (
    <div className="space-y-4 text-left" style={{ fontSize: '0.82rem' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#dfc0b7]/20">
        <div className="space-y-0.5">
          <h2
            className="text-2xl font-black flex items-center gap-2"
            style={{ color: isDark ? 'var(--admin-text-primary)' : '#241916' }}
          >
            <ShieldCheck size={22} style={{ color: p.accentText }} />
            Quản lý Admin
          </h2>
          <p
            className="text-[11px] font-bold"
            style={{ color: isDark ? 'var(--admin-text-muted)' : '#8b716a' }}
          >
            Danh sách tài khoản quản trị viên hệ thống HIMA TEST.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-56 min-w-[160px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, email..."
              value={vm.searchQuery}
              onChange={(e) => { vm.setSearchQuery(e.target.value); vm.setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border-2 rounded-full text-[11px] font-bold focus:outline-none shadow-sm"
              style={{
                backgroundColor: isDark ? 'var(--admin-surface-dim)' : '#ffffff',
                borderColor: isDark ? 'var(--admin-border)' : 'rgba(223,192,183,0.5)',
                color: isDark ? 'var(--admin-text-primary)' : '#241916',
              }}
            />
          </div>
          <button
            onClick={vm.openCreateForm}
            className="flex items-center gap-1.5 px-3 py-2 text-white rounded-full text-[11px] font-black shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: p.btnBg }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.btnHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.btnBg; }}
            title="Thêm Admin mới"
          >
            <UserPlus size={13} />
            Thêm Admin
          </button>
          <button
            onClick={() => { vm.setPage(1); vm.fetchAdmins(); }}
            disabled={vm.loading}
            className="p-2 border rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50"
            style={{
              backgroundColor: isDark ? 'var(--admin-surface-dim)' : '#ffffff',
              borderColor: isDark ? 'var(--admin-border)' : 'rgba(223,192,183,0.55)',
            }}
            title="Tải lại"
          >
            <RefreshCw size={14} className={vm.loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-[28px] overflow-hidden shadow-sm"
        style={{
          backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff',
          border: isDark ? '1px solid var(--admin-border)' : '1px solid rgba(223,192,183,0.5)',
        }}
      >
        {vm.loading ? (
          <div className="p-10 text-center space-y-3">
            <div
              className="animate-spin w-7 h-7 border-4 border-t-transparent rounded-full mx-auto"
              style={{ borderColor: p.accentColor, borderTopColor: 'transparent' }}
            />
            <p className="text-[11px] font-black" style={{ color: isDark ? 'var(--admin-text-muted)' : '#8b716a' }}>
              Đang tải danh sách Admin...
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-[9px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: isDark ? 'var(--admin-surface-dim)' : p.accentBg,
                      borderBottom: isDark ? `1px solid var(--admin-border)` : `1px solid ${p.accentBorder}`,
                      color: isDark ? 'var(--admin-text-muted)' : p.accentText,
                    }}
                  >
                    <th className="py-3.5 px-5 font-extrabold tracking-widest">Tài khoản Admin</th>
                    <th className="py-3.5 px-5 font-extrabold tracking-widest">Ngày tạo</th>
                    <th className="py-3.5 px-5 text-center font-extrabold tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {vm.pagedAdmins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-12 text-center text-[11px] font-bold"
                        style={{ color: isDark ? 'var(--admin-text-muted)' : '#8b716a' }}
                      >
                        Không tìm thấy tài khoản Admin nào.
                      </td>
                    </tr>
                  ) : (
                    vm.pagedAdmins.map((admin) => {
                      const isSelf = admin.id === currentUser?.id;
                      return (
                        <tr
                          key={admin.id}
                          className="transition-all duration-150"
                          style={{ borderTop: isDark ? '1px solid var(--admin-border-dim)' : '1px solid transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'var(--admin-surface-dim)' : p.accentBg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 shadow-sm"
                                style={{
                                  backgroundColor: p.accentBg,
                                  border: `1px solid ${p.accentBorder}`,
                                  color: p.accentText,
                                }}
                              >
                                {admin.name ? admin.name.charAt(0).toUpperCase() : admin.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="text-left min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className="text-[11px] font-black truncate"
                                    style={{ color: isDark ? 'var(--admin-text-primary)' : '#241916' }}
                                  >
                                    {admin.name || 'Admin ẩn danh'}
                                  </p>
                                  {isSelf && (
                                    <span
                                      className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border"
                                      style={{ backgroundColor: p.accentBg, color: p.accentText, borderColor: p.accentBorder }}
                                    >
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-[10px] font-semibold mt-0.5 truncate"
                                  style={{ color: isDark ? 'var(--admin-text-muted)' : '#8b716a' }}
                                >
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td
                            className="py-3 px-5 text-[11px] font-extrabold"
                            style={{ color: isDark ? 'var(--admin-text-secondary)' : '#57423b' }}
                          >
                            <div className="flex items-center gap-1">
                              <Calendar size={11} style={{ color: isDark ? 'var(--admin-text-muted)' : '#9ca3af' }} />
                              <span>{new Date(admin.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Sửa */}
                              <button
                                onClick={() => vm.openEditForm(admin)}
                                title="Sửa thông tin"
                                className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                style={{ backgroundColor: p.accentBg, color: p.accentText }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.accentBg; }}
                              >
                                <Edit size={13} />
                              </button>
                              {/* Xóa — không cho xóa chính mình */}
                              <button
                                onClick={() => vm.deleteAdmin(admin.id)}
                                disabled={isSelf || vm.deletingId === admin.id}
                                title={isSelf ? 'Không thể xóa tài khoản của chính mình' : 'Xóa Admin'}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                style={isDark ? { backgroundColor: 'var(--admin-rose-bg)', color: 'var(--admin-rose-text)' } : {}}
                              >
                                {vm.deletingId === admin.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={vm.page} totalPages={vm.totalPages} onPageChange={vm.setPage} />
          </>
        )}
      </div>

      {/* Edit Admin Modal */}
      {vm.showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left"
            style={{
              backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff',
              border: `2px solid ${p.accentBorder}`,
            }}
          >
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: p.accentBorder, backgroundColor: p.accentBg }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: p.accentBgHover }}>
                  <UserCog size={14} style={{ color: p.accentText }} />
                </div>
                <h3 className="text-sm font-black" style={{ color: p.accentText }}>Chỉnh sửa tài khoản Admin</h3>
              </div>
              <button
                onClick={() => vm.setShowEditForm(false)}
                className="p-2 rounded-full transition-all cursor-pointer"
                style={{ color: p.accentText }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={vm.saveAdmin} className="p-5 space-y-3.5" style={{ backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff' }}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>Tên Admin</label>
                <input type="text" value={vm.editData.name}
                  onChange={(e) => vm.setEditData({ ...vm.editData, name: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập tên Admin" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>Email <span className="text-rose-500">*</span></label>
                <input type="email" required value={vm.editData.email}
                  onChange={(e) => vm.setEditData({ ...vm.editData, email: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập email" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>
                  Mật khẩu mới <span className="font-bold lowercase" style={{ color: isDark ? 'var(--admin-text-muted)' : '#9ca3af' }}>(bỏ trống nếu không đổi)</span>
                </label>
                <input type="password" value={vm.editData.password}
                  onChange={(e) => vm.setEditData({ ...vm.editData, password: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập mật khẩu mới" />
              </div>
              <div className="pt-3 flex justify-end gap-2" style={{ borderTop: isDark ? '1px solid var(--admin-border-dim)' : '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => vm.setShowEditForm(false)}
                  className="px-4 py-2 border text-[11px] font-black rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: isDark ? 'var(--admin-surface-dim)' : '#ffffff',
                    borderColor: isDark ? 'var(--admin-border)' : '#e2e8f0',
                    color: isDark ? 'var(--admin-text-secondary)' : '#475569',
                  }}>
                  Hủy
                </button>
                <button type="submit" disabled={vm.editSaving}
                  className="px-4 py-2 text-white text-[11px] font-black rounded-xl transition-all uppercase tracking-wider shadow-sm disabled:opacity-55 cursor-pointer"
                  style={{ backgroundColor: p.btnBg }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.btnHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.btnBg; }}>
                  {vm.editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {vm.showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left"
            style={{
              backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff',
              border: `2px solid ${p.accentBorder}`,
            }}
          >
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: p.accentBorder, backgroundColor: p.accentBg }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: p.accentBgHover }}>
                  <UserPlus size={14} style={{ color: p.accentText }} />
                </div>
                <h3 className="text-sm font-black" style={{ color: p.accentText }}>Thêm tài khoản Admin mới</h3>
              </div>
              <button
                onClick={() => vm.setShowCreateForm(false)}
                className="p-2 rounded-full transition-all cursor-pointer"
                style={{ color: p.accentText }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={vm.createAdmin} className="p-5 space-y-3.5" style={{ backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff' }}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>Tên Admin</label>
                <input type="text" value={vm.createData.name}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, name: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập tên (có thể để trống)" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>Email <span className="text-rose-500">*</span></label>
                <input type="email" required value={vm.createData.email}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, email: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập địa chỉ email" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: isDark ? 'var(--admin-text-muted)' : '#64748b' }}>Mật khẩu <span className="text-rose-500">*</span></label>
                <input type="password" required value={vm.createData.password}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, password: e.target.value })}
                  className={inputCls}
                  placeholder="Nhập mật khẩu" />
              </div>
              <div className="pt-3 flex justify-end gap-2" style={{ borderTop: isDark ? '1px solid var(--admin-border-dim)' : '1px solid #f1f5f9' }}>
                <button type="button" onClick={() => vm.setShowCreateForm(false)}
                  className="px-4 py-2 border text-[11px] font-black rounded-xl transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: isDark ? 'var(--admin-surface-dim)' : '#ffffff',
                    borderColor: isDark ? 'var(--admin-border)' : '#e2e8f0',
                    color: isDark ? 'var(--admin-text-secondary)' : '#475569',
                  }}>
                  Hủy
                </button>
                <button type="submit" disabled={vm.createSaving}
                  className="px-4 py-2 text-white text-[11px] font-black rounded-xl transition-all uppercase tracking-wider shadow-sm disabled:opacity-55 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: p.btnBg }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.btnHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.btnBg; }}>
                  {vm.createSaving
                    ? <><Loader2 size={12} className="animate-spin" /> Đang tạo...</>
                    : <><ShieldCheck size={12} /> Tạo Admin</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
