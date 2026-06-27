/**
 * AdminTopics.jsx — View
 * Redesigned flat table view for managing math topics with exam count statistics.
 */
import React, { useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Tags, X } from 'lucide-react';
import { useAdminTopics } from './useAdminTopics';

export default function AdminTopics({ showAlert, setConfirmModal }) {
  const vm = useAdminTopics({ showAlert, setConfirmModal });

  useEffect(() => {
    vm.fetchTopics();
  }, []);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
        <div>
          <h2 className="text-3xl font-black text-[#241916]">Quản lý Chuyên đề</h2>
          <p className="text-xs font-bold text-[#8b716a] mt-1">
            Xây dựng và quản lý danh mục các chuyên đề ôn tập, kiểm tra.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={vm.fetchTopics}
            disabled={vm.loading}
            className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} className={vm.loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => vm.openForm('add')}
            className="px-5 py-2.5 bg-[#8c3315] hover:bg-[#72270e] text-white text-xs font-black rounded-full transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Thêm chuyên đề
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] overflow-hidden shadow-sm">
        {vm.loading && vm.flatTopics.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-[#8c3315] border-t-transparent rounded-full mx-auto" />
            <p className="text-xs font-black text-[#8b716a]">Đang tải danh sách chuyên đề...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#fdf5f2] border-b border-[#dfc0b7]/20 text-[10px] font-black text-[#8b716a] uppercase tracking-wider">
                    <th className="py-4 px-6 min-w-[200px]">Tên chuyên đề</th>
                    <th className="py-4 px-6 min-w-[300px]">Mô tả</th>
                    <th className="py-4 px-6 text-center w-40">Số lượng đề thi</th>
                    <th className="py-4 px-6 text-center w-32">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dfc0b7]/20">
                  {vm.flatTopics.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs font-black text-[#8b716a]">
                        Chưa có chuyên đề nào được tạo.
                      </td>
                    </tr>
                  ) : (
                    vm.flatTopics.map((topic) => (
                      <tr key={topic.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <p className="text-xs font-black text-[#241916] break-words whitespace-normal leading-relaxed">
                            {topic.title}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-[10px] font-semibold text-[#8b716a] break-words whitespace-normal leading-relaxed">
                            {topic.description || <span className="italic text-gray-400">Không có mô tả</span>}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border bg-[#e6fcf4] text-[#006b58] border-[#a7f3d0] whitespace-nowrap">
                            {topic._count?.tests || 0} đề thi
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => vm.openForm('edit', null, topic)}
                              className="p-1.5 bg-[#fff3f0] border border-[#dfc0b7]/30 hover:bg-[#fddcd2] hover:text-[#8c3315] rounded-lg text-[#8b716a] transition-all cursor-pointer"
                              title="Sửa chuyên đề"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => vm.deleteTopic(topic.id, topic.title)}
                              className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:text-rose-700 rounded-lg text-rose-600 transition-all cursor-pointer"
                              title="Xóa chuyên đề"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {vm.showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border-2 border-[#dfc0b7] rounded-[28px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-5 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb]">
              <h3 className="text-md font-black text-[#241916]">
                {vm.formMode === 'add' ? '✦ Thêm chuyên đề mới' : '✦ Chỉnh sửa chuyên đề'}
              </h3>
              <button
                onClick={() => vm.setShowForm(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={vm.saveForm} className="p-5 space-y-4 bg-[#fffdfb]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">
                  Tiêu đề chuyên đề *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Đại số & Giải tích"
                  value={vm.formData.title}
                  onChange={(e) => vm.setFormData({ ...vm.formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white focus:outline-none focus:border-[#8c3315]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">
                  Mô tả chuyên đề
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập mô tả hoặc ghi chú cho chuyên đề..."
                  value={vm.formData.description}
                  onChange={(e) => vm.setFormData({ ...vm.formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-medium bg-white focus:outline-none focus:border-[#8c3315] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[#dfc0b7]/30 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => vm.setShowForm(false)}
                  className="px-4 py-2 bg-white border border-[#dfc0b7]/60 text-[#57423b] text-xs font-black rounded-xl hover:bg-[#fff3f0] hover:text-[#8c3315] transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={vm.formSaving}
                  className="px-4 py-2 bg-[#8c3315] hover:bg-[#72270e] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {vm.formSaving ? 'Đang lưu...' : vm.formMode === 'edit' ? 'Lưu thay đổi' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
