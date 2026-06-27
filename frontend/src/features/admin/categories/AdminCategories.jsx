/**
 * AdminCategories.jsx — View
 * Category list, category tree view, details sub-view, and add/edit category forms.
 */
import React, { useEffect } from 'react';
import { RefreshCw, Plus, Edit, Trash2, ArrowLeft, Folder, BookOpen, Clock, Calendar, X, Eye, Award, Tags, AlertCircle, Check } from 'lucide-react';
import { useAdminCategories } from './useAdminCategories';
import { formatCategoryType } from '../../../utils/adminHelpers';
import Pagination from '../../../components/shared/Pagination';

export default function AdminCategories({ showAlert, setConfirmModal }) {
  const vm = useAdminCategories({ showAlert, setConfirmModal });

  useEffect(() => {
    vm.fetchCategories(vm.activeGrade);
    vm.fetchExams();
  }, [vm.activeGrade]);

  return (
    <div className="space-y-6 text-left">
      {vm.selectedCat ? (
        /* ==================== SCREEN: CHILD CATEGORY DETAIL ==================== */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => vm.setSelectedCat(null)}
                className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-[#fff3f0] hover:text-[#8c3315] rounded-full shadow-sm transition-all cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#8b716a]">
                  {(() => {
                    const parent = vm.categories.find((c) => c.id === vm.selectedCat.parentId);
                    const gradeStr = parent?.grade === 'GRADE_12' ? 'Lớp 12' : parent?.grade === 'GRADE_11' ? 'Lớp 11' : parent?.grade === 'GRADE_10' ? 'Lớp 10' : '';
                    return `${gradeStr} · ${parent?.name || ''}`;
                  })()}
                </p>
                <h2 className="text-2xl font-black text-[#241916]">{vm.selectedCat.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => vm.openForm('edit', null, vm.selectedCat)}
                className="px-4 py-2 bg-[#fff3f0] hover:bg-[#fddcd2] text-[#8c3315] text-xs font-black rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit size={14} />
                Chỉnh sửa
              </button>
              <button
                onClick={() => {
                  vm.deleteCategory(vm.selectedCat.id, vm.selectedCat.name);
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                Xóa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Loại',
                value: 'Danh mục con',
                color: 'bg-[#e6fcf4] text-[#006b58]'
              },
              {
                label: 'Thuộc danh mục cha',
                value: vm.categories.find((c) => c.id === vm.selectedCat.parentId)?.name || '—',
                color: 'bg-[#fff3f0] text-[#8c3315]'
              },
              {
                label: 'Khối lớp',
                value: (() => {
                  const parent = vm.categories.find((c) => c.id === vm.selectedCat.parentId);
                  return parent?.grade === 'GRADE_12' ? 'Lớp 12' : parent?.grade === 'GRADE_11' ? 'Lớp 11' : parent?.grade === 'GRADE_10' ? 'Lớp 10' : '—';
                })(),
                color: 'bg-amber-50 text-amber-800'
              },
              {
                label: 'Số đề thi',
                value: `${vm.exams.filter((e) => e.categoryId === vm.selectedCat.id).length} đề`,
                color: 'bg-indigo-50 text-indigo-800'
              }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-[#dfc0b7]/40 rounded-2xl p-4 shadow-sm">
                <p className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1">{stat.label}</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Test Assignment Selection */}
          <div className="bg-white border border-[#dfc0b7]/40 rounded-[24px] p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-[#241916]">Phân bổ đề thi vào danh mục này</h3>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  vm.assignTest(e.target.value, vm.selectedCat.id);
                }
              }}
              className="w-full px-4 py-2.5 border-2 border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] bg-[#fffdfb] cursor-pointer"
            >
              <option value="">-- Chọn đề thi chưa thuộc danh mục để gán --</option>
              {vm.exams
                .filter((e) => e.categoryId !== vm.selectedCat.id)
                .map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.grade === 'GRADE_12' ? 'Lớp 12' : exam.grade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10'})
                  </option>
                ))}
            </select>
          </div>

          {/* Assigned Exams List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#8b716a] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} />
              Đề thi thuộc danh mục ({vm.exams.filter((e) => e.categoryId === vm.selectedCat.id).length})
            </h4>

            {vm.exams.filter((e) => e.categoryId === vm.selectedCat.id).length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-[#dfc0b7]/40 rounded-2xl text-xs font-bold text-gray-400">
                Chưa có đề thi nào trong danh mục này. Hãy gán đề thi ở trên.
              </div>
            ) : (
              <div className="space-y-2">
                {vm.exams
                  .filter((e) => e.categoryId === vm.selectedCat.id)
                  .map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center justify-between px-5 py-4 bg-white border border-[#dfc0b7]/40 rounded-2xl hover:border-[#8c3315]/30 hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#241916] truncate">{exam.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border bg-[#fff3f0] text-[#8c3315] border-[#dfc0b7]/50">
                            {formatCategoryType(exam.category)}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            {exam.durationMinutes} phút
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => vm.removeTest(exam.id, vm.selectedCat.id)}
                        className="ml-4 p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-all shrink-0 cursor-pointer"
                        title="Gỡ khỏi danh mục"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== SCREEN: CATEGORIES OVERVIEW ==================== */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
            <div>
              <h2 className="text-3xl font-black text-[#241916]">Quản lý Danh mục</h2>
              <p className="text-xs font-bold text-[#8b716a] mt-1">
                Xây dựng cấu trúc danh mục và quản lý đề thi theo từng mục.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#fff5f2] border border-[#dfc0b7]/50 rounded-full p-1 flex items-center gap-1 shadow-sm">
                {['GRADE_10', 'GRADE_11', 'GRADE_12'].map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => vm.setActiveGrade(grade)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                      vm.activeGrade === grade
                        ? 'bg-[#8c3315] text-white shadow-sm'
                        : 'text-[#8c3315] hover:bg-[#8c3315]/10'
                    }`}
                  >
                    {grade === 'GRADE_12' ? 'Lớp 12' : grade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => vm.fetchCategories(vm.activeGrade)}
                disabled={vm.loading}
                className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={16} className={vm.loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => vm.openForm('add')}
                className="px-5 py-2.5 bg-[#8c3315] hover:bg-[#72270e] text-white text-xs font-black rounded-full transition-all uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Thêm danh mục gốc
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Khối đang xem',
                value: vm.activeGrade === 'GRADE_12' ? 'Lớp 12' : vm.activeGrade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10',
                icon: <Award size={16} />,
                bg: 'bg-amber-50 border-amber-200',
                text: 'text-amber-800'
              },
              {
                label: 'Danh mục cha',
                value: vm.gradeRootCategories.length,
                icon: <Folder size={16} />,
                bg: 'bg-[#e6fcf4] border-[#a7f3d0]',
                text: 'text-[#006b58]'
              },
              {
                label: 'Danh mục con',
                value: vm.gradeRootCategories.reduce((acc, curr) => acc + (curr.children?.length || 0), 0),
                icon: <Tags size={16} />,
                bg: 'bg-[#fff3f0] border-[#dfc0b7]/60',
                text: 'text-[#8c3315]'
              },
              {
                label: 'Tổng số đề thi',
                value: vm.exams.filter((e) => e.grade === vm.activeGrade).length,
                icon: <BookOpen size={16} />,
                bg: 'bg-indigo-50 border-indigo-200',
                text: 'text-indigo-800'
              }
            ].map((stat, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-4 rounded-2xl border ${stat.bg}`}>
                <span className={`${stat.text}`}>{stat.icon}</span>
                <div>
                  <p className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider leading-none">{stat.label}</p>
                  <p className={`text-xl font-black mt-0.5 ${stat.text}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Root Categories and Child Tree Render */}
          {vm.loading && vm.categories.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-[#8c3315] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-[#8b716a]">Đang tải danh mục...</p>
            </div>
          ) : vm.gradeRootCategories.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#dfc0b7]/40 rounded-[32px] space-y-3 bg-white">
              <Folder size={32} className="text-gray-300 mx-auto" />
              <p className="text-sm font-black text-[#8b716a]">
                Chưa có danh mục nào cho {vm.activeGrade === 'GRADE_12' ? 'Lớp 12' : vm.activeGrade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10'}.
              </p>
              <button onClick={() => vm.openForm('add')} className="text-xs text-[#8c3315] font-black underline hover:text-[#72270e] cursor-pointer">
                Tạo danh mục gốc đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {vm.pagedRootCategories.map((parent) => (
                <div key={parent.id} className="bg-white border border-[#dfc0b7]/40 rounded-[28px] overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 bg-[#fdf5f2] border-b border-[#dfc0b7]/20">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#fff3f0] border border-[#dfc0b7]/50 flex items-center justify-center text-[#8c3315]">
                        <Folder size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-black text-[#241916]">{parent.name}</p>
                        <p className="text-[10px] font-bold text-[#8b716a]">{parent.children?.length || 0} danh mục con</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => vm.openForm('add', parent.id)}
                        className="px-3 py-1.5 bg-[#006b58] hover:bg-[#005243] text-white text-[10px] font-black rounded-full flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                      >
                        <Plus size={11} /> Thêm danh mục con
                      </button>
                      <button
                        onClick={() => vm.openForm('edit', null, parent)}
                        className="p-1.5 bg-white border border-[#dfc0b7]/50 hover:bg-[#fff3f0] text-[#8c3315] rounded-lg transition-all cursor-pointer"
                        title="Sửa"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => vm.deleteCategory(parent.id, parent.name)}
                        className="p-1.5 bg-white border border-[#dfc0b7]/50 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {parent.children && parent.children.length > 0 ? (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {parent.children.map((child) => {
                        const examsCount = vm.exams.filter((ex) => ex.categoryId === child.id).length;
                        return (
                          <div
                            key={child.id}
                            className="group border border-[#dfc0b7]/40 rounded-2xl p-4 hover:border-[#8c3315]/40 hover:shadow-sm transition-all bg-[#fffdfb] flex flex-col gap-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-black text-[#241916] truncate">{child.name}</p>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black ${examsCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {examsCount} đề thi
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => vm.openForm('edit', null, { ...child, parentId: parent.id })}
                                  className="p-1 hover:bg-[#fff3f0] text-[#8c3315] rounded-lg transition-all cursor-pointer"
                                  title="Sửa"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => vm.deleteCategory(child.id, child.name)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => vm.setSelectedCat({ ...child, parentId: parent.id })}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8c3315] hover:bg-[#72270e] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer"
                            >
                              <Eye size={12} /> Xem chi tiết
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-xs font-bold text-gray-400 italic">Chưa có danh mục con.</div>
                  )}
                </div>
              ))}
              <Pagination currentPage={vm.page} totalPages={vm.totalPages} onPageChange={vm.setPage} />
            </div>
          )}
        </div>
      )}

      {/* ==================== DIALOG: ADD/EDIT CATEGORY ==================== */}
      {vm.showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border-2 border-[#dfc0b7] rounded-[28px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-5 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb]">
              <h3 className="text-md font-black text-[#241916]">
                {vm.formMode === 'add' ? '✦ Thêm danh mục mới' : '✦ Chỉnh sửa danh mục'}
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
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cực trị của hàm số"
                  value={vm.formData.name}
                  onChange={(e) => vm.setFormData({ ...vm.formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white focus:outline-none focus:border-[#8c3315]"
                />
              </div>

              {!vm.formData.parentId && vm.formMode === 'add' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">
                    Khối lớp *
                  </label>
                  <select
                    value={vm.formData.grade}
                    onChange={(e) => vm.setFormData({ ...vm.formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white focus:outline-none focus:border-[#8c3315]"
                  >
                    <option value="GRADE_10">Lớp 10</option>
                    <option value="GRADE_11">Lớp 11</option>
                    <option value="GRADE_12">Lớp 12</option>
                  </select>
                </div>
              )}

              {vm.formData.parentId && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                  <p className="text-[10px] text-amber-800 font-extrabold">
                    Danh mục con sẽ thuộc về danh mục cha:{' '}
                    <span className="underline font-black">
                      {vm.categories.find((c) => c.id === vm.formData.parentId)?.name}
                    </span>
                  </p>
                </div>
              )}

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
