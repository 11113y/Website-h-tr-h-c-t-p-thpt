/**
 * AdminProfile.jsx — View
 * Admin profile and password change UI.
 */
import React from 'react';
import { Plus, ShieldCheck, Users, User } from 'lucide-react';
import { useAdminProfile } from './useAdminProfile';

export default function AdminProfile({ currentUser, setCurrentUser, showAlert }) {
  const vm = useAdminProfile({ currentUser, setCurrentUser, showAlert });

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#241916]">Thông tin cá nhân</h2>
          <p className="text-xs font-bold text-[#8b716a]">
            Cấu hình chi tiết thông tin hồ sơ tài khoản Quản trị viên và đổi mật khẩu bảo mật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar card */}
        <div className="bg-white border border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-6 text-center">
          <div className="relative w-32 h-32 mx-auto">
            {vm.avatarUrl ? (
              <img src={vm.avatarUrl} alt="Admin Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-[#dfc0b7]/30 shadow-md" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-[#dfc0b7]/30 bg-gray-50 flex items-center justify-center text-[#8b716a] mx-auto shadow-inner">
                <User size={64} className="stroke-[1.5]" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-sm">
              <ShieldCheck size={14} className="stroke-[3]" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#241916]">{vm.name || 'Admin'}</h3>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8c3315] text-white rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm">
              {currentUser?.role || 'SUPER ADMIN'}
            </span>
          </div>
          <div className="border-t border-[#dfc0b7]/20 pt-4 text-xs font-bold text-[#8b716a] space-y-2.5 text-left">
            <div className="flex justify-between items-center">
              <span>Email liên hệ:</span>
              <span className="text-[#241916]">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Ngày tham gia:</span>
              <span className="text-[#241916]">
                {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : '01/01/2026'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trạng thái:</span>
              <span className="inline-flex items-center gap-1 text-emerald-500 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic info form */}
          <div className="bg-white border border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-[#8c3315]" /> Thông tin cơ bản
              </h3>
              <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Cập nhật tên hiển thị của tài khoản quản trị viên</p>
            </div>
            <form onSubmit={vm.handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Họ và Tên</label>
                  <input
                    type="text"
                    value={vm.name}
                    onChange={(e) => vm.setName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email (Không được thay đổi)</label>
                  <input
                    type="email"
                    value={vm.email}
                    disabled
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-xs font-bold text-gray-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 bg-white border border-[#dfc0b7] hover:bg-[#fff3f0] hover:text-[#8c3315] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5">
                    <Plus size={14} /> Chọn ảnh từ máy
                    <input type="file" accept="image/*" onChange={vm.handleAvatarChange} className="hidden" />
                  </label>
                  {vm.avatarUrl && (
                    <button type="button" onClick={() => vm.setAvatarUrl('')} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm animate-fadeIn">
                      Xóa ảnh
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={vm.savingProfile}
                  className="px-6 py-3 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer"
                >
                  {vm.savingProfile ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Password form */}
          <div className="bg-white border border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#8c3315]" /> Đổi mật khẩu bảo mật
              </h3>
              <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Nên thiết lập mật khẩu mạnh để bảo vệ tài khoản quản trị</p>
            </div>
            <form onSubmit={vm.handleChangePassword} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={vm.oldPassword}
                  onChange={(e) => vm.setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={vm.newPassword}
                    onChange={(e) => vm.setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={vm.confirmPwd}
                    onChange={(e) => vm.setConfirmPwd(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới..."
                    className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={vm.savingPassword}
                  className="px-6 py-3 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer"
                >
                  {vm.savingPassword ? 'Đang thay đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
