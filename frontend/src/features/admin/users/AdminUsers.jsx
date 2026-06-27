/**
 * AdminUsers.jsx — View
 * Manage student list, detail, and profile modification.
 * Icons-only action buttons, compact layout with CSS scale.
 */
import React, { useEffect } from 'react';
import {
  Search, RefreshCw, Calendar, Flame, ArrowLeft, Edit, X, Eye,
  Trash2, UserPlus, Loader2
} from 'lucide-react';
import { useAdminUsers } from './useAdminUsers';
import { formatDuration } from '../../../utils/adminHelpers';
import Pagination from '../../../components/shared/Pagination';
import { useTheme } from '../../../utils/ThemeContext';
import { getAdminPalette } from '../../../utils/adminColorUtils';

export default function AdminUsers({ showAlert, selectedUserId, setSelectedUserId }) {
  const { adminColor, adminTheme } = useTheme();
  const p = getAdminPalette(adminColor, adminTheme);
  const vm = useAdminUsers({ showAlert });

  useEffect(() => {
    vm.fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      vm.fetchUserDetail(selectedUserId);
      if (setSelectedUserId) setSelectedUserId(null);
    }
  }, [selectedUserId]);

  return (
    <div className="space-y-4 text-left" style={{ fontSize: '0.82rem' }}>
      {/* Detail view */}
      {vm.selectedUser ? (
        <div className="space-y-4 text-left animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-2.5 text-left">
              <button
                onClick={() => vm.setSelectedUser(null)}
                className="p-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-gray-500 shadow-sm transition-all flex items-center gap-1.5 px-3 py-2 text-[11px] font-black cursor-pointer"
                onMouseEnter={(e) => { e.currentTarget.style.color = p.accentText; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                <ArrowLeft size={13} />
                Quay lại
              </button>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-black text-xs flex items-center justify-center shrink-0" style={{ color: p.accentText }}>
                {(vm.selectedUser.name || vm.selectedUser.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  {vm.selectedUser.name || 'Học viên ẩn danh'}
                  <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wider border ${vm.selectedUser.role === 'ADMIN' ? 'bg-[#e6fcf4] text-[#006b58] border-[#a7f3d0]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {vm.selectedUser.role === 'ADMIN' ? 'Admin' : 'Học sinh'}
                  </span>
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {vm.selectedUser.school ? `${vm.selectedUser.school} • ` : ''}{vm.selectedUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => vm.openEditForm(vm.selectedUser)}
                title="Sửa thông tin"
                className="p-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                onMouseEnter={(e) => { e.currentTarget.style.color = p.accentText; e.currentTarget.style.backgroundColor = p.accentBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; }}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => vm.deleteUser(vm.selectedUser.id)}
                disabled={vm.deletingId === vm.selectedUser.id}
                title="Xóa học sinh"
                className="p-2 bg-white border border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-rose-400 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {vm.deletingId === vm.selectedUser.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left space-y-0.5 shadow-sm">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Chuỗi streak</span>
              <p className="text-lg font-black text-amber-600 flex items-center gap-1">
                <Flame size={15} className="fill-amber-500 text-amber-600" />
                {vm.selectedUser.streak || 0} ngày
              </p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left space-y-0.5 shadow-sm">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Đề đã hoàn thành</span>
              <p className="text-lg font-black" style={{ color: p.accentText }}>{vm.selectedUser.attempts?.length || 0} đề</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left space-y-0.5 shadow-sm">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Điểm TB</span>
              <p className="text-lg font-black text-[#006b58]">
                {vm.selectedUser.attempts && vm.selectedUser.attempts.length > 0
                  ? (vm.selectedUser.attempts.reduce((acc, curr) => acc + curr.score, 0) / vm.selectedUser.attempts.length).toFixed(1)
                  : 'Chưa thi'}
              </p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-left space-y-0.5 shadow-sm">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Ngày tham gia</span>
              <p className="text-[11px] font-black text-slate-700 pt-1">
                {new Date(vm.selectedUser.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 text-left">Lịch sử làm bài thi</h4>
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Tên đề thi</th>
                      <th className="py-3 px-5">Điểm số</th>
                      <th className="py-3 px-5">Thời gian</th>
                      <th className="py-3 px-5">Ngày làm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vm.pagedAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs font-black text-slate-500">
                          Học viên này chưa thực hiện bài thi nào.
                        </td>
                      </tr>
                    ) : (
                      vm.pagedAttempts.map((attempt) => (
                        <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors text-[11px]">
                          <td className="py-3 px-5 font-black text-slate-800">{attempt.test?.title || 'Đề thi không xác định'}</td>
                          <td className="py-3 px-5 font-black">
                            <span className={attempt.score >= 8 ? 'text-[#006b58]' : attempt.score >= 5 ? 'text-amber-600' : 'text-rose-600'}>
                              {attempt.score.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-3 px-5 text-slate-600 font-semibold">
                            {attempt.timeSpentSeconds ? formatDuration(attempt.timeSpentSeconds) : 'N/A'}
                          </td>
                          <td className="py-3 px-5 text-gray-500 font-semibold">
                            {new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={vm.historyPage} totalPages={vm.totalHistoryPages} onPageChange={vm.setHistoryPage} />
            </div>
          </div>
        </div>
      ) : (
        /* User List View */
        <div className="space-y-4 text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-slate-800">Quản lý người dùng</h2>
              <p className="text-[11px] font-bold text-slate-500">Xem danh sách, phân quyền và lịch sử thi cử của toàn bộ học viên.</p>
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
                  className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 rounded-full text-[11px] font-bold focus:outline-none bg-white shadow-sm"
                  style={{ '--tw-ring-color': p.accentColor }}
                />
              </div>
              <button
                onClick={vm.openCreateForm}
                className="flex items-center gap-1.5 px-3 py-2 text-white rounded-full text-[11px] font-black shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: p.btnBg }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.btnHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.btnBg; }}
                title="Thêm học sinh mới"
              >
                <UserPlus size={13} />
                Thêm học sinh
              </button>
              <button
                onClick={() => { vm.setPage(1); vm.fetchUsers(); }}
                disabled={vm.loading}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50/50 rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50"
                title="Tải lại danh sách"
              >
                <RefreshCw size={14} className={vm.loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[28px] overflow-hidden shadow-sm">
            {vm.loading ? (
              <div className="p-10 text-center space-y-3">
                <div className="animate-spin w-7 h-7 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: p.accentColor, borderTopColor: 'transparent' }} />
                <p className="text-[11px] font-black text-slate-500">Đang tải danh sách người dùng...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-5 font-extrabold tracking-widest">Người dùng</th>
                        <th className="py-3.5 px-5 font-extrabold tracking-widest">Quyền hạn</th>
                        <th className="py-3.5 px-5 font-extrabold tracking-widest">Streak</th>
                        <th className="py-3.5 px-5 font-extrabold tracking-widest">Ngày đăng ký</th>
                        <th className="py-3.5 px-5 text-center font-extrabold tracking-widest">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vm.pagedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-[11px] font-bold text-slate-500">
                            Không tìm thấy người dùng nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        vm.pagedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-200" style={{ '--tw-shadow': `inset 3px 0 0 0 ${p.primary}` }}>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 font-black text-xs flex items-center justify-center shrink-0 shadow-sm" style={{ color: p.accentText }}>
                                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-[11px] font-black text-slate-800 truncate">{user.name || 'Học viên ẩn danh'}</p>
                                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${user.role === 'ADMIN' ? 'bg-[#e6fcf4] text-[#006b58] border-[#a7f3d0]' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {user.role === 'ADMIN' ? 'Admin' : 'Học sinh'}
                              </span>
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-1 text-[11px] font-black text-amber-600">
                                <Flame size={13} className="fill-amber-500 text-amber-500" />
                                <span>{user.streak || 0}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-[11px] font-extrabold text-slate-600">
                              <div className="flex items-center gap-1">
                                <Calendar size={11} className="text-gray-400" />
                                <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Chi tiết */}
                                <button
                                  onClick={() => vm.fetchUserDetail(user.id)}
                                  title="Xem chi tiết"
                                  className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                  style={{ backgroundColor: p.accentBg, color: p.accentText }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.accentBg; }}
                                >
                                  <Eye size={13} />
                                </button>
                                {/* Sửa */}
                                <button
                                  onClick={() => vm.openEditForm(user)}
                                  title="Sửa thông tin"
                                  className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                                  style={{ backgroundColor: p.accentBg, color: p.accentText }}
                                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.accentBg; }}
                                >
                                  <Edit size={13} />
                                </button>
                                {/* Xóa */}
                                <button
                                  onClick={() => vm.deleteUser(user.id)}
                                  disabled={vm.deletingId === user.id}
                                  title="Xóa học sinh"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm disabled:opacity-40"
                                >
                                  {vm.deletingId === user.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Trash2 size={13} />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={vm.page} totalPages={vm.totalPages} onPageChange={vm.setPage} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {vm.showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border-2 border-slate-200 rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-black text-slate-800">Chỉnh sửa thông tin học viên</h3>
              <button onClick={() => vm.setShowEditForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-gray-400 transition-all cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={vm.saveUser} className="p-5 space-y-3.5 bg-white" autoComplete="off">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên học viên</label>
                <input type="text" required value={vm.editData.name}
                  onChange={(e) => vm.setEditData({ ...vm.editData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 placeholder-gray-400 focus:outline-none font-black transition-all"
                  placeholder="Nhập tên học viên" autoComplete="off" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input type="email" required value={vm.editData.email}
                  onChange={(e) => vm.setEditData({ ...vm.editData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 placeholder-gray-400 focus:outline-none font-black transition-all"
                  placeholder="Nhập email" autoComplete="new-email" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Trường học</label>
                <input type="text" value={vm.editData.school || ''}
                  onChange={(e) => vm.setEditData({ ...vm.editData, school: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 placeholder-gray-400 focus:outline-none font-black transition-all"
                  placeholder="Nhập trường học" autoComplete="off" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Mật khẩu mới <span className="text-gray-400 font-bold lowercase">(bỏ trống nếu không đổi)</span>
                </label>
                <input type="password" value={vm.editData.password}
                  onChange={(e) => vm.setEditData({ ...vm.editData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-slate-800 placeholder-gray-400 focus:outline-none font-black transition-all"
                  placeholder="Nhập mật khẩu mới" autoComplete="new-password" />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => vm.setShowEditForm(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-black rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                  onMouseEnter={(e) => { e.currentTarget.style.color = p.accentText; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}>
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

      {/* Create User Modal */}
      {vm.showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left" style={{ border: `2px solid ${p.accentBorder}` }}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: p.accentBorder, backgroundColor: p.accentBg }}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: p.accentBgHover }}>
                  <UserPlus size={14} style={{ color: p.accentText }} />
                </div>
                <h3 className="text-sm font-black" style={{ color: p.accentText }}>Thêm học sinh mới</h3>
              </div>
              <button onClick={() => vm.setShowCreateForm(false)} className="p-2 rounded-full transition-all cursor-pointer" style={{ color: p.accentText }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.accentBgHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={vm.createUser} className="p-5 space-y-3.5 bg-white" autoComplete="off">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Tên học viên</label>
                <input type="text" value={vm.createData.name}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-[#241916] placeholder-gray-400 focus:outline-none font-bold transition-all"
                  placeholder="Nhập tên học viên (có thể để trống)" autoComplete="off" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Email <span className="text-rose-500">*</span></label>
                <input type="email" required value={vm.createData.email}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-[#241916] placeholder-gray-400 focus:outline-none font-bold transition-all"
                  placeholder="Nhập địa chỉ email" autoComplete="new-email" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Trường học</label>
                <input type="text" value={vm.createData.school || ''}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, school: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-[#241916] placeholder-gray-400 focus:outline-none font-bold transition-all"
                  placeholder="Nhập trường học" autoComplete="off" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Mật khẩu <span className="text-rose-500">*</span></label>
                <input type="password" required value={vm.createData.password}
                  onChange={(e) => vm.setCreateData({ ...vm.createData, password: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] text-[#241916] placeholder-gray-400 focus:outline-none font-bold transition-all"
                  placeholder="Nhập mật khẩu" autoComplete="new-password" />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => vm.setShowCreateForm(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[11px] font-black rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider shadow-sm cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={vm.createSaving}
                  className="px-4 py-2 text-white text-[11px] font-black rounded-xl transition-all uppercase tracking-wider shadow-sm disabled:opacity-55 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: p.btnBg }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = p.btnHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = p.btnBg; }}>
                  {vm.createSaving ? <><Loader2 size={12} className="animate-spin" /> Đang tạo...</> : <><UserPlus size={12} /> Tạo tài khoản</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
