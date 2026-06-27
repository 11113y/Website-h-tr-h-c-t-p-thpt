/**
 * AdminExams.jsx — View
 * Manage exams list, preview exam, import from Word, and edit exam/questions.
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, RotateCcw, Calendar, Eye, Trash2, ArrowLeft, Plus, X, Upload, Check, Edit2, ChevronDown, ChevronUp, AlertCircle, FileText, Brain } from 'lucide-react';
import { useAdminExams } from './useAdminExams';
import Pagination from '../../../components/shared/Pagination';
import { flattenTree } from '../../../utils/adminHelpers';
import { renderMathText } from '../../../pages/QuizPage';

export default function AdminExams({ showAlert, setConfirmModal }) {
  const vm = useAdminExams({ showAlert, setConfirmModal });

  useEffect(() => {
    vm.fetchExams();
    vm.fetchCategories();
    vm.fetchTopics();
  }, []);

  // Helpers for Question Editor option labeling
  const getOptionLabel = (idx) => ['A', 'B', 'C', 'D'][idx] || '';

  console.log("AdminExams Render. vm.editingExam:", vm.editingExam);

  return (
    <div className="space-y-6 text-left">
      {vm.editingExam ? (
        /* ==================== SCREEN: EXAM EDITOR ==================== */
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
            <div>
              <button
                onClick={() => {
                  setConfirmModal({
                    show: true,
                    title: 'Rời khỏi màn hình chỉnh sửa',
                    message: 'Bạn có chắc muốn rời khỏi màn hình chỉnh sửa? Tiến trình chưa được lưu sẽ bị mất.',
                    onConfirm: () => vm.setEditingExam(null)
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-full text-xs font-black text-[#57423b] hover:bg-[#fff3f0] hover:text-[#8c3315] hover:border-[#dfc0b7] transition-all shadow-sm cursor-pointer"
              >
                <ArrowLeft size={14} />
                Quay lại danh sách đề
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Initialize a blank question
                  vm.setEditingQuestion({
                    num: vm.editingExam.questions.length + 1,
                    section: 'I',
                    question: '',
                    options: ['', '', '', ''],
                    tfStatements: [
                      { key: 'a', text: '' },
                      { key: 'b', text: '' },
                      { key: 'c', text: '' },
                      { key: 'd', text: '' }
                    ],
                    correctAnswer: 0,
                    explanation: '',
                    images: [],
                    solImages: [],
                    points: 0.25,
                    topicTitle: 'Chủ đề mặc định'
                  });
                  vm.setEditingQIndex(-1);
                  vm.setShowQuestionEditor(true);
                  window.scrollTo(0, 0);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-full transition-all shadow-sm cursor-pointer"
              >
                + Thêm câu hỏi
              </button>
              <button
                onClick={vm.saveExam}
                disabled={vm.saving}
                className="px-5 py-2 bg-[#8c3315] hover:bg-[#72270e] disabled:bg-gray-300 text-white text-xs font-black rounded-full transition-all uppercase tracking-wider shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                {vm.saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  vm.editingExam.id ? 'Lưu thay đổi' : 'Lưu & Xuất bản Đề'
                )}
              </button>
            </div>
          </div>

          {/* General Config Card */}
          <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] p-6 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-[#241916]">Cấu hình chung đề thi</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1 md:col-span-4">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Tiêu đề đề thi</label>
                <input
                  type="text"
                  value={vm.editingExam.title}
                  onChange={(e) => vm.setEditingExam({ ...vm.editingExam, title: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] bg-[#fffdfb] shadow-sm font-black"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Thời gian (phút)</label>
                <input
                  type="number"
                  value={vm.editingExam.durationMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    vm.setEditingExam({ ...vm.editingExam, durationMinutes: val === '' ? '' : parseInt(val) || 0 });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] bg-[#fffdfb] shadow-sm font-black"
                />
              </div>
            </div>

            {/* Category selection row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#dfc0b7]/30">
              {/* Khối lớp */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Khối lớp</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'GRADE_10', name: 'Lớp 10' },
                    { id: 'GRADE_11', name: 'Lớp 11' },
                    { id: 'GRADE_12', name: 'Lớp 12' }
                  ].map((g) => {
                    const isSelected = vm.editingExam.grade === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => vm.setEditingExam({
                          ...vm.editingExam,
                          grade: g.id,
                          parentId: '',
                          categoryId: null,
                          categoryIds: []
                        })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-black text-xs ${
                          isSelected
                            ? 'border-[#8c3315] bg-[#fff3f0] text-[#8c3315]'
                            : 'border-[#dfc0b7]/40 hover:bg-gray-50 text-[#57423b]'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lộ trình */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Lộ trình</label>
                <div className="border-2 border-[#dfc0b7]/40 rounded-2xl bg-[#fffdfb] p-2.5 max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                  {vm.categories
                    .filter((c) => c.grade === vm.editingExam.grade && !c.parentId)
                    .map((parentCat) => {
                      const isSelected = vm.editingExam.parentId === parentCat.id;
                      return (
                        <button
                          key={parentCat.id}
                          type="button"
                          onClick={() => {
                            const isExam = parentCat.name?.toLowerCase().includes('thi') || parentCat.name?.toLowerCase().includes('test');
                            vm.setEditingExam({
                              ...vm.editingExam,
                              parentId: parentCat.id,
                              categoryId: null,
                              categoryIds: [],
                              category: isExam ? 'EXAM' : 'PRACTICE'
                            });
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-[#8c3315]/60 bg-[#fff3f0]/50 text-[#8c3315]'
                              : 'border-transparent bg-transparent hover:bg-gray-50 text-[#57423b]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected ? 'border-[#8c3315] bg-[#8c3315]' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-black">{parentCat.name}</span>
                        </button>
                      );
                    })}
                  {vm.categories.filter((c) => c.grade === vm.editingExam.grade && !c.parentId).length === 0 && (
                    <p className="text-xs text-gray-400 font-bold text-center py-6">
                      Không có lộ trình nào cho khối lớp này.
                    </p>
                  )}
                </div>
              </div>

              {/* Danh mục con */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Danh mục con (Chọn bằng Checkbox)</label>
                <div className="border-2 border-[#dfc0b7]/40 rounded-2xl bg-[#fffdfb] p-2.5 max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                  {(() => {
                    if (!vm.editingExam.parentId) {
                      return (
                        <p className="text-xs text-gray-400 font-bold text-center py-6">
                          Vui lòng chọn lộ trình để xem các danh mục con.
                        </p>
                      );
                    }

                    const selectedParent = vm.categories.find(c => c.id === vm.editingExam.parentId);
                    const childCats = selectedParent?.children || [];

                    if (childCats.length === 0) {
                      return (
                        <p className="text-xs text-gray-400 font-bold text-center py-6">
                          Không có danh mục con nào trong lộ trình này.
                        </p>
                      );
                    }

                    return childCats.map((childCat) => {
                      const isSelected = (vm.editingExam.categoryIds || []).includes(childCat.id);
                      return (
                        <button
                          key={childCat.id}
                          type="button"
                          onClick={() => {
                            const currentIds = vm.editingExam.categoryIds || [];
                            let nextIds;
                            if (isSelected) {
                              nextIds = currentIds.filter(id => id !== childCat.id);
                            } else {
                              nextIds = [...currentIds, childCat.id];
                            }
                            vm.setEditingExam({
                              ...vm.editingExam,
                              categoryIds: nextIds,
                              categoryId: nextIds[0] || null
                            });
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'border-[#8c3315]/60 bg-[#fff3f0]/50 text-[#8c3315]'
                              : 'border-transparent bg-transparent hover:bg-gray-50 text-[#57423b]'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check size={11} className="text-white" />}
                          </div>
                          <span className="text-xs font-black">
                            {childCat.name}
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Chuyên đề selection row */}
            <div className="pt-4 border-t border-[#dfc0b7]/30 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!vm.editingExam.hasTopic}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    vm.setEditingExam({
                      ...vm.editingExam,
                      hasTopic: checked,
                      topicId: checked ? (vm.editingExam.topicId || (vm.topics[0]?.id || null)) : null
                    });
                  }}
                  className="w-4 h-4 rounded border-[#dfc0b7]/60 text-[#8c3315] focus:ring-[#8c3315] cursor-pointer"
                />
                <span className="text-xs font-black text-[#57423b] uppercase tracking-wider">Chuyên đề</span>
              </label>

              {vm.editingExam.hasTopic && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Chọn Chuyên đề</label>
                  <select
                    value={vm.editingExam.topicId || ''}
                    onChange={(e) => vm.setEditingExam({ ...vm.editingExam, topicId: e.target.value || null })}
                    className="w-full max-w-md px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] focus:outline-none focus:border-[#8c3315] font-bold transition-all"
                  >
                    <option value="">-- Chọn chuyên đề --</option>
                    {vm.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Question Editor Modal */}
          {vm.showQuestionEditor && vm.editingQuestion && createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
              <div className="bg-white border-2 border-[#dfc0b7] rounded-[36px] w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left max-h-[95vh]">
                <div className="p-6 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb] shrink-0">
                  <h3 className="text-base font-black text-[#241916]">
                    {vm.editingQIndex === -1 ? '✦ Soạn thảo câu hỏi mới' : `✦ Sửa Câu số ${vm.editingQuestion.num}`}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      vm.setShowQuestionEditor(false);
                      vm.setEditingQuestion(null);
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fffdfb]">
                  {/* Question Editor Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Basic question settings */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block mb-1">Phần thi *</label>
                          <select
                            value={vm.editingQuestion.section}
                            onChange={(e) => {
                              const sec = e.target.value;
                              let ans = vm.editingQuestion.correctAnswer;
                              if (sec === 'I') ans = 0;
                              else if (sec === 'II') ans = { type: 'tf', vals: ['Đ', 'Đ', 'Đ', 'Đ'] };
                              else if (sec === 'III') ans = { type: 'short', val: '0' };
                              vm.setEditingQuestion({ ...vm.editingQuestion, section: sec, correctAnswer: ans });
                            }}
                            className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white"
                          >
                            <option value="I">Phần I – Trắc nghiệm</option>
                            <option value="II">Phần II – Đúng/Sai</option>
                            <option value="III">Phần III – Trả lời ngắn</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block mb-1">Chủ đề *</label>
                          <input
                            type="text"
                            value={vm.editingQuestion.topicTitle}
                            onChange={(e) => vm.setEditingQuestion({ ...vm.editingQuestion, topicTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block mb-1">Điểm số *</label>
                          <input
                            type="number"
                            step="0.05"
                            value={vm.editingQuestion.points}
                            onChange={(e) => vm.setEditingQuestion({ ...vm.editingQuestion, points: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white"
                          />
                        </div>
                      </div>

                      {/* Question text */}
                      <div>
                        <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block mb-1">Nội dung câu hỏi (LaTeX)</label>
                        <textarea
                          rows={10}
                          value={vm.editingQuestion.question}
                          onChange={(e) => vm.setEditingQuestion({ ...vm.editingQuestion, question: e.target.value })}
                          className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-medium bg-white resize-y leading-relaxed"
                        />
                      </div>

                      {/* Question Images */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block">Hình ảnh câu hỏi</span>
                        {(vm.editingQuestion.images || []).map((imgUrl, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={imgUrl}
                              onChange={(e) => {
                                const newImgs = [...vm.editingQuestion.images];
                                newImgs[idx] = e.target.value;
                                vm.setEditingQuestion({ ...vm.editingQuestion, images: newImgs });
                              }}
                              className="flex-1 px-3 py-1.5 border border-[#dfc0b7]/40 rounded-lg text-xs bg-white"
                              placeholder="URL hình ảnh"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newImgs = vm.editingQuestion.images.filter((_, i) => i !== idx);
                                vm.setEditingQuestion({ ...vm.editingQuestion, images: newImgs });
                              }}
                              className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => vm.setEditingQuestion({ ...vm.editingQuestion, images: [...(vm.editingQuestion.images || []), ''] })}
                          className="px-3 py-1.5 bg-white border border-[#dfc0b7]/50 rounded-lg text-[10px] font-black text-[#57423b] hover:bg-gray-50 cursor-pointer"
                        >
                          + Thêm URL ảnh
                        </button>
                      </div>
                    </div>

                    {/* Section Specific Answers & Explanations */}
                    <div className="space-y-4">
                      {vm.editingQuestion.section === 'I' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block">Các lựa chọn & Đáp án đúng</label>
                          {vm.editingQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <button
                                type="button"
                                onClick={() => vm.setEditingQuestion({ ...vm.editingQuestion, correctAnswer: idx })}
                                className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center border cursor-pointer transition-all ${
                                  vm.editingQuestion.correctAnswer === idx
                                    ? 'bg-[#8c3315] border-[#8c3315] text-white shadow-sm'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {getOptionLabel(idx)}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...vm.editingQuestion.options];
                                  newOpts[idx] = e.target.value;
                                  vm.setEditingQuestion({ ...vm.editingQuestion, options: newOpts });
                                }}
                                className="flex-1 px-3 py-1.5 border border-[#dfc0b7]/40 rounded-xl text-xs bg-white font-medium"
                                placeholder={`Lựa chọn ${getOptionLabel(idx)}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {vm.editingQuestion.section === 'II' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block">Khẳng định Đúng/Sai</label>
                          {vm.editingQuestion.tfStatements.map((stmt, idx) => {
                            const currentVals = vm.editingQuestion.correctAnswer?.vals || ['Đ', 'Đ', 'Đ', 'Đ'];
                            const isTrue = currentVals[idx] === 'Đ';
                            return (
                              <div key={stmt.key} className="flex gap-2 items-center">
                                <span className="w-5 text-xs font-black text-gray-500 uppercase">{stmt.key})</span>
                                <input
                                  type="text"
                                  value={stmt.text}
                                  onChange={(e) => {
                                    const newStmts = [...vm.editingQuestion.tfStatements];
                                    newStmts[idx] = { ...newStmts[idx], text: e.target.value };
                                    vm.setEditingQuestion({ ...vm.editingQuestion, tfStatements: newStmts });
                                  }}
                                  className="flex-1 px-3 py-1.5 border border-[#dfc0b7]/40 rounded-xl text-xs bg-white font-medium"
                                  placeholder={`Nội dung khẳng định ${stmt.key.toUpperCase()}`}
                                />
                                <div className="flex border border-[#dfc0b7]/40 rounded-lg overflow-hidden shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextVals = [...currentVals];
                                      nextVals[idx] = 'Đ';
                                      vm.setEditingQuestion({
                                        ...vm.editingQuestion,
                                        correctAnswer: { ...vm.editingQuestion.correctAnswer, vals: nextVals }
                                      });
                                    }}
                                    className={`px-2.5 py-1 text-[10px] font-black transition-all cursor-pointer ${
                                      isTrue ? 'bg-emerald-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextVals = [...currentVals];
                                      nextVals[idx] = 'S';
                                      vm.setEditingQuestion({
                                        ...vm.editingQuestion,
                                        correctAnswer: { ...vm.editingQuestion.correctAnswer, vals: nextVals }
                                      });
                                    }}
                                    className={`px-2.5 py-1 text-[10px] font-black transition-all cursor-pointer ${
                                      !isTrue ? 'bg-rose-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {vm.editingQuestion.section === 'III' && (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block">Đáp án ngắn chính xác</label>
                          <input
                            type="text"
                            value={vm.editingQuestion.correctAnswer?.val || ''}
                            onChange={(e) =>
                              vm.setEditingQuestion({
                                ...vm.editingQuestion,
                                correctAnswer: { type: 'short', val: e.target.value }
                              })
                            }
                            className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-black bg-white"
                            placeholder="Nhập kết quả số hoặc chữ"
                          />
                        </div>
                      )}

                      {/* Explanation & Sol Images */}
                      <div>
                        <label className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block mb-1">Lời giải chi tiết</label>
                        <textarea
                          rows={10}
                          value={vm.editingQuestion.explanation}
                          onChange={(e) => vm.setEditingQuestion({ ...vm.editingQuestion, explanation: e.target.value })}
                          className="w-full px-3 py-2 border border-[#dfc0b7]/60 rounded-xl text-xs font-medium bg-white resize-y leading-relaxed"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-[#8b716a] uppercase tracking-wider block">Hình ảnh lời giải</span>
                        {(vm.editingQuestion.solImages || []).map((solUrl, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={solUrl}
                              onChange={(e) => {
                                const newSols = [...vm.editingQuestion.solImages];
                                newSols[idx] = e.target.value;
                                vm.setEditingQuestion({ ...vm.editingQuestion, solImages: newSols });
                              }}
                              className="flex-1 px-3 py-1.5 border border-[#dfc0b7]/40 rounded-lg text-xs bg-white"
                              placeholder="URL hình ảnh lời giải"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSols = vm.editingQuestion.solImages.filter((_, i) => i !== idx);
                                vm.setEditingQuestion({ ...vm.editingQuestion, solImages: newSols });
                              }}
                              className="p-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => vm.setEditingQuestion({ ...vm.editingQuestion, solImages: [...(vm.editingQuestion.solImages || []), ''] })}
                          className="px-3 py-1.5 bg-white border border-[#dfc0b7]/50 rounded-lg text-[10px] font-black text-[#57423b] hover:bg-gray-50 cursor-pointer"
                        >
                          + Thêm URL ảnh giải
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-[#dfc0b7]/30 flex justify-end gap-3 bg-[#fffdfb] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      vm.setShowQuestionEditor(false);
                      vm.setEditingQuestion(null);
                    }}
                    className="px-4 py-2 bg-white border border-[#dfc0b7]/60 text-[#57423b] text-xs font-black rounded-xl hover:bg-[#fff3f0] hover:text-[#8c3315] transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!vm.editingQuestion.question.trim()) {
                        showAlert('Vui lòng nhập nội dung câu hỏi.', 'Cảnh báo', 'warning');
                        return;
                      }
                      const pts = parseFloat(vm.editingQuestion.points);
                      const qObj = { ...vm.editingQuestion, points: isNaN(pts) ? 0.25 : pts };

                      // Format section values appropriately
                      if (qObj.section === 'I') {
                        qObj.correctAnswer = parseInt(qObj.correctAnswer) || 0;
                        qObj.tfStatements = undefined;
                      } else if (qObj.section === 'II') {
                        qObj.options = [];
                        if (!qObj.correctAnswer || typeof qObj.correctAnswer !== 'object' || qObj.correctAnswer.type !== 'tf') {
                          qObj.correctAnswer = { type: 'tf', vals: ['Đ', 'Đ', 'Đ', 'Đ'] };
                        }
                      } else if (qObj.section === 'III') {
                        qObj.options = [];
                        qObj.tfStatements = undefined;
                        if (!qObj.correctAnswer || typeof qObj.correctAnswer !== 'object' || qObj.correctAnswer.type !== 'short') {
                          qObj.correctAnswer = { type: 'short', val: typeof qObj.correctAnswer === 'string' ? qObj.correctAnswer : '0' };
                        }
                      }

                      const nextQs = [...vm.editingExam.questions];
                      if (vm.editingQIndex === -1) {
                        nextQs.push(qObj);
                      } else {
                        nextQs[vm.editingQIndex] = qObj;
                      }

                      // Reset question numbers
                      const formattedQs = nextQs.map((q, i) => ({ ...q, num: i + 1 }));
                      vm.setEditingExam({ ...vm.editingExam, questions: formattedQs });
                      vm.setShowQuestionEditor(false);
                      vm.setEditingQuestion(null);
                      showAlert('Cập nhật câu hỏi thành công!', 'Thành công', 'success');
                    }}
                    className="px-4 py-2 bg-[#8c3315] hover:bg-[#72270e] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    {vm.editingQIndex === -1 ? 'Lưu Câu hỏi' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
            {/* Questions List inside Exam */}
            <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#dfc0b7]/20">
                <h3 className="text-lg font-black text-[#241916]">
                  Danh sách câu hỏi tạm ({vm.editingExam.questions?.length || 0} câu)
                </h3>
              </div>

              {vm.editingExam.questions?.length === 0 ? (
                <div className="py-12 border border-dashed border-[#dfc0b7]/40 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-black text-gray-400">Đề thi chưa có câu hỏi nào. Vui lòng thêm câu hỏi mới.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vm.editingExam.questions.map((q, idx) => (
                    <div key={idx} className="p-4 border border-[#dfc0b7]/40 rounded-2xl bg-[#fffdfb] flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#8c3315]/10 text-[#8c3315] rounded font-black text-[9px]">
                            Câu {q.num}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-bold text-[9px]">
                            Phần {q.section}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">({q.points} điểm)</span>
                          <span className="text-[10px] text-[#006b58] font-bold">Chủ đề: {q.topicTitle}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#241916] leading-relaxed whitespace-pre-wrap mt-1">
                          {renderMathText(q.question)}
                        </div>

                        {/* Question Images */}
                        {q.images && q.images.filter(Boolean).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.images.filter(Boolean).map((imgUrl, i) => (
                              <img 
                                key={i} 
                                src={imgUrl} 
                                alt={`Hình ảnh đề câu ${q.num}`} 
                                className="max-h-48 rounded-lg border border-[#dfc0b7]/40 object-contain bg-white-forced p-1.5 shadow-sm" 
                              />
                            ))}
                          </div>
                        )}

                        {/* Section Options/Answers */}
                        {q.section === 'I' && q.options && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pl-1">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = q.correctAnswer === oIdx;
                              return (
                                <div 
                                  key={oIdx} 
                                  className={`flex items-start gap-2 text-xs p-2 rounded-xl border transition-colors ${
                                    isCorrect 
                                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-bold' 
                                      : 'bg-white border-[#dfc0b7]/20 text-[#57423b]'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {getOptionLabel(oIdx)}
                                  </span>
                                  <span className="leading-relaxed">{renderMathText(opt || 'Chưa nhập lựa chọn')}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.section === 'II' && q.tfStatements && (
                          <div className="space-y-1.5 mt-3 pl-1">
                            {q.tfStatements.map((stmt, sIdx) => {
                              const correctVals = q.correctAnswer?.vals || ['Đ', 'Đ', 'Đ', 'Đ'];
                              const val = correctVals[sIdx] || 'Đ';
                              return (
                                <div 
                                  key={sIdx} 
                                  className="flex items-start justify-between gap-3 text-xs p-2.5 bg-white border border-[#dfc0b7]/20 rounded-xl"
                                >
                                  <div className="flex gap-2 items-start leading-relaxed text-[#57423b]">
                                    <span className="font-black text-gray-500 shrink-0">{stmt.key})</span>
                                    <span>{renderMathText(stmt.text || 'Chưa nhập khẳng định')}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                    val === 'Đ' 
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                    {val === 'Đ' ? 'Đúng' : 'Sai'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.section === 'III' && (
                          <div className="mt-3 pl-1">
                            <div className="inline-flex items-center gap-2 p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                              <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                                Đáp án đúng:
                              </span>
                              <span>{renderMathText(q.correctAnswer?.val || 'Chưa nhập')}</span>
                            </div>
                          </div>
                        )}

                        {/* Detailed Solution / Explanation */}
                        {(q.explanation || (q.solImages && q.solImages.filter(Boolean).length > 0)) && (
                          <div className="mt-4 p-3.5 bg-gray-50 border border-[#dfc0b7]/30 rounded-2xl space-y-2">
                            <div className="text-[10px] font-black text-[#8c3315] uppercase tracking-wider">
                              Lời giải chi tiết:
                            </div>
                            {q.explanation && (
                              <p className="text-xs text-[#57423b] leading-relaxed whitespace-pre-wrap font-medium">
                                {renderMathText(q.explanation)}
                              </p>
                            )}
                            {q.solImages && q.solImages.filter(Boolean).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {q.solImages.filter(Boolean).map((solUrl, i) => (
                                  <img 
                                    key={i} 
                                    src={solUrl} 
                                    alt={`Hình ảnh lời giải câu ${q.num}`} 
                                    className="max-h-48 rounded-lg border border-[#dfc0b7]/40 object-contain bg-white-forced p-1.5 shadow-sm" 
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            vm.setEditingQuestion({ ...q });
                            vm.setEditingQIndex(idx);
                            vm.setShowQuestionEditor(true);
                            window.scrollTo(0, 0);
                          }}
                          className="p-1.5 bg-white border border-[#dfc0b7]/60 hover:bg-[#fff3f0] hover:text-[#8c3315] rounded-lg text-gray-500 transition-all cursor-pointer"
                          title="Sửa câu hỏi"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmModal({
                              show: true,
                              title: 'Xóa câu hỏi',
                              message: 'Bạn có chắc chắn muốn xóa câu hỏi này khỏi danh sách tạm?',
                              onConfirm: () => {
                                const nextQs = vm.editingExam.questions.filter((_, i) => i !== idx);
                                const formattedQs = nextQs.map((q, i) => ({ ...q, num: i + 1 }));
                                vm.setEditingExam({ ...vm.editingExam, questions: formattedQs });
                                showAlert('Đã xóa câu hỏi khỏi danh sách tạm.', 'Thông tin', 'info');
                              }
                            });
                          }}
                          className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg text-rose-700 transition-all cursor-pointer"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      ) : (
        /* ==================== SCREEN: EXAMS DASHBOARD ==================== */
        <>
          <div className="flex flex-col gap-5 pb-5 border-b border-[#dfc0b7]/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-[#241916]">Quản lý đề thi</h2>
                <p className="text-xs font-bold text-[#8b716a]">Trích xuất đề thi từ file Word, cấu hình câu hỏi và phân bổ danh mục.</p>
              </div>
              <div>
                <button
                  onClick={() => vm.setShowImportForm(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8c3315] hover:opacity-90 text-white text-xs font-black rounded-xl shadow-md shadow-[#8c3315]/10 hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                  title="Nhập đề thi mới từ file Word (.docx)"
                >
                  <Upload size={14} className="group-hover:scale-110 transition-transform" />
                  Nhập đề từ Word
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-4 w-full bg-[#fffcfb] border border-[#dfc0b7]/30 rounded-2xl p-4 shadow-sm">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px]">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm tiêu đề đề thi..."
                  value={vm.searchQuery}
                  onChange={(e) => vm.setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] placeholder-gray-400 transition-all shadow-sm"
                />
              </div>

              {/* Segmented Toggle: Loại đề */}
              <div className="flex bg-slate-100 border border-slate-200/60 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => vm.setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${vm.filterType === 'all' ? 'bg-[#8c3315] text-white shadow-sm' : 'text-slate-600 hover:text-[#8c3315]'}`}
                >
                  Tất cả đề
                </button>
                <button
                  onClick={() => vm.setFilterType('synthetic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${vm.filterType === 'synthetic' ? 'bg-[#8c3315] text-white shadow-sm' : 'text-slate-600 hover:text-[#8c3315]'}`}
                >
                  Tổng hợp
                </button>
                <button
                  onClick={() => vm.setFilterType('thematic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap cursor-pointer ${vm.filterType === 'thematic' ? 'bg-[#8c3315] text-white shadow-sm' : 'text-slate-600 hover:text-[#8c3315]'}`}
                >
                  Chuyên đề
                </button>
              </div>

              {/* Shared Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Khối lớp */}
                <select
                  value={vm.filterGrade}
                  onChange={(e) => vm.setFilterGrade(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] text-[#57423b] cursor-pointer shadow-sm"
                >
                  <option value="all">Khối lớp (Tất cả)</option>
                  <option value="GRADE_10">Lớp 10</option>
                  <option value="GRADE_11">Lớp 11</option>
                  <option value="GRADE_12">Lớp 12</option>
                </select>

                {/* Lộ trình */}
                <select
                  value={vm.filterRoadmapId}
                  onChange={(e) => vm.setFilterRoadmapId(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] text-[#57423b] cursor-pointer shadow-sm"
                >
                  <option value="all">Lộ trình (Tất cả)</option>
                  {vm.categories.filter(c => !c.parentId).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>

                {/* Danh mục con */}
                <select
                  value={vm.filterSubcategoryId}
                  onChange={(e) => vm.setFilterSubcategoryId(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] text-[#57423b] cursor-pointer shadow-sm"
                >
                  <option value="all">Danh mục con (Tất cả)</option>
                  {(vm.filterRoadmapId === 'all'
                    ? vm.categories.reduce((acc, p) => p.children ? [...acc, ...p.children] : acc, [])
                    : (vm.categories.find(c => c.id === vm.filterRoadmapId)?.children || [])
                  ).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Bộ lọc Chuyên đề cụ thể (chỉ hiển thị khi loại đề chọn là Chuyên đề) */}
                {vm.filterType === 'thematic' && (
                  <select
                    value={vm.filterTopicId}
                    onChange={(e) => vm.setFilterTopicId(e.target.value)}
                    className="px-4 py-2 bg-white border border-[#dfc0b7]/50 rounded-xl text-xs font-bold focus:outline-none focus:border-[#8c3315] text-[#57423b] cursor-pointer shadow-sm animate-fadeIn"
                  >
                    <option value="all">Chuyên đề (Tất cả)</option>
                    {vm.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                )}

                {/* Reset Filters button */}
                <button
                  onClick={vm.resetFilters}
                  className="p-2 bg-[#fff3f0] border border-[#dfc0b7]/50 hover:bg-[#fddcd2] text-[#8c3315] rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center"
                  title="Xóa bộ lọc"
                >
                  <RotateCcw size={16} />
                </button>

                {/* Reload button */}
                <button
                  onClick={vm.fetchExams}
                  disabled={vm.loadingExams}
                  className="p-2 bg-white border border-[#dfc0b7]/50 hover:bg-[#fff3f0] hover:text-[#8c3315] rounded-xl text-gray-500 shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                  title="Tải lại danh sách"
                >
                  <RefreshCw size={16} className={vm.loadingExams ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>

          {/* Exams List Container */}
          <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] overflow-hidden shadow-sm">
            {vm.loadingExams ? (
              <div className="p-12 text-center space-y-3">
                <div className="animate-spin w-8 h-8 border-4 border-[#8c3315] border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-black text-[#8b716a]">Đang tải danh sách đề thi...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#fdf5f2] border-b border-[#dfc0b7]/20 text-[10px] font-black text-[#8b716a] uppercase tracking-wider">
                      <th className="py-2.5 px-6 min-w-[280px]">Đề thi</th>
                      <th className="py-2.5 px-6">Chuyên đề</th>
                      <th className="py-2.5 px-6">Lộ trình</th>
                      <th className="py-2.5 px-6">Danh mục con</th>
                      <th className="py-2.5 px-6">Khối lớp</th>
                      <th className="py-2.5 px-6">Thời gian</th>
                      <th className="py-2.5 px-6">Số câu hỏi</th>
                      <th className="py-2.5 px-6 text-center w-32">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dfc0b7]/20">
                    {vm.pagedExams.length === 0 ? (
                       <tr>
                         <td colSpan={8} className="py-12 text-center text-xs font-black text-[#8b716a]">
                           Không tìm thấy đề thi nào phù hợp.
                         </td>
                       </tr>
                    ) : (
                      vm.pagedExams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-6">
                            <div className="text-left py-0.5">
                              <p className="text-xs font-black text-[#241916] break-words whitespace-normal leading-relaxed">{exam.title}</p>
                              {exam.description && <p className="text-[10px] font-semibold text-[#8b716a] mt-1 break-words whitespace-normal leading-relaxed">{exam.description}</p>}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd] whitespace-nowrap">
                              {exam.topic?.title || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border bg-[#fff3f0] text-[#8c3315] border-[#dfc0b7]/50 whitespace-nowrap">
                              {exam.categoryRel?.parent?.name || vm.formatCategoryType(exam.category) || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2.5 py-0.5 bg-gray-100 text-[#57423b] border border-gray-200 rounded-md font-bold text-[10px] whitespace-nowrap">
                              {exam.categoryRel?.name || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border bg-[#e6fcf4] text-[#006b58] border-[#a7f3d0] whitespace-nowrap">
                              {exam.grade === 'GRADE_12' ? 'Lớp 12' : exam.grade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10'}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-xs font-extrabold text-[#57423b] whitespace-nowrap">
                            {exam.durationMinutes} phút
                          </td>
                          <td className="py-3 px-6 text-xs font-extrabold text-[#57423b] whitespace-nowrap">
                            {exam._count?.questions || exam.questions?.length || 0} câu
                          </td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Xem trước */}
                              <button
                                onClick={() => vm.previewExamById(exam.id)}
                                title="Xem trước đề thi"
                                className="p-1.5 bg-[#e6fcf4] hover:bg-[#bbf7e3] text-[#006b58] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Eye size={13} />
                              </button>
                              {/* Sửa */}
                              <button
                                onClick={() => vm.editExistingExam(exam.id)}
                                title="Sửa đề thi"
                                className="p-1.5 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Edit2 size={13} />
                              </button>
                              {/* Xóa */}
                              <button
                                onClick={() => vm.deleteExam(exam.id, exam.title)}
                                title="Xóa đề thi"
                                className="p-1.5 bg-[#fff3f0] hover:bg-[#fddcd2] text-[#8c3315] rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Trash2 size={13} />
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
        </>
      )}

      {/* ==================== MODAL: WORD DOC IMPORT ==================== */}
      {vm.showImportForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border-2 border-[#dfc0b7] rounded-[36px] w-full max-w-4xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-6 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb]">
              <h3 className="text-xl font-black text-[#241916] flex items-center gap-2">
                <FileText className="text-[#8c3315]" size={22} />
                Nhập đề thi mới từ file Word (.docx)
              </h3>
              <button
                onClick={() => {
                  vm.setShowImportForm(false);
                  vm.setImportTitle('');
                  vm.setImportDesc('');
                  vm.setImportFile(null);
                  vm.setImportCategoryId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={vm.importFromWord} className="p-6 space-y-6 bg-[#fffdfb] overflow-y-auto max-h-[80vh]">
              {vm.importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  {vm.importError}
                </div>
              )}
              {vm.importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-2">
                  <Check size={16} />
                  {vm.importSuccess}
                </div>
              )}

              {/* Form content in expanded layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side: File upload & description */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Tiêu đề đề thi *</label>
                    <input
                      type="text"
                      required
                      value={vm.importTitle}
                      onChange={(e) => vm.setImportTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-bold transition-all"
                      placeholder="VD: Đề thi khảo sát chất lượng môn Toán học kì 2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Mô tả ngắn đề thi</label>
                    <textarea
                      rows={2}
                      value={vm.importDesc}
                      onChange={(e) => vm.setImportDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-semibold transition-all resize-none"
                      placeholder="VD: Đề thi ôn tập đầy đủ các kiến thức lớp 12"
                    />
                  </div>

                  {/* File Upload Zone */}
                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Chọn file Word (.docx) *</label>
                    <div className="border-2 border-dashed border-[#dfc0b7]/60 rounded-2xl p-6 text-center bg-[#fffdfb] hover:bg-[#fffcfb] hover:border-[#8c3315]/60 transition-all relative">
                      <input
                        type="file"
                        accept=".docx"
                        required
                        onChange={(e) => vm.setImportFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2">
                        <Upload size={24} className="mx-auto text-gray-400" />
                        {vm.importFile ? (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-[#8c3315]">{vm.importFile.name}</p>
                            <p className="text-[10px] text-gray-400">{(vm.importFile.size / 1024).toFixed(1)} KB - Nhấp để thay đổi file</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-black text-[#57423b]">Kéo thả hoặc nhấp để chọn file</p>
                            <p className="text-[9px] text-gray-400">Chỉ hỗ trợ định dạng Microsoft Word (.docx)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Thời gian làm bài (phút)</label>
                    <input
                      type="number"
                      value={vm.importDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        vm.setImportDuration(val === '' ? '' : parseInt(val) || 0);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-black transition-all"
                      placeholder="90"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!vm.importHasTopic}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          vm.setImportHasTopic(checked);
                          if (checked && !vm.importTopicId) {
                            vm.setImportTopicId(vm.topics[0]?.id || '');
                          }
                        }}
                        className="w-4 h-4 rounded border-[#dfc0b7]/60 text-[#8c3315] focus:ring-[#8c3315] cursor-pointer"
                      />
                      <span className="text-xs font-black text-[#57423b] uppercase tracking-wider">Chuyên đề</span>
                    </label>

                    {vm.importHasTopic && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider">Chọn Chuyên đề</label>
                        <select
                          value={vm.importTopicId || ''}
                          onChange={(e) => vm.setImportTopicId(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] focus:outline-none focus:border-[#8c3315] font-bold transition-all"
                        >
                          <option value="">-- Chọn chuyên đề --</option>
                          {vm.topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Checkbox Group (Request 1) */}
                <div className="space-y-4 bg-[#fffdfb] border border-[#dfc0b7]/40 rounded-2xl p-4">
                  {/* Khối lớp */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Khối lớp (Chọn bằng Checkbox)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'GRADE_10', label: 'Lớp 10' },
                        { id: 'GRADE_11', label: 'Lớp 11' },
                        { id: 'GRADE_12', label: 'Lớp 12' }
                      ].map((gradeObj) => {
                        const isSelected = vm.importGrade === gradeObj.id;
                        return (
                          <button
                            key={gradeObj.id}
                            type="button"
                            onClick={() => {
                              vm.setImportGrade(gradeObj.id);
                              vm.setImportParentId('');
                              vm.setImportCategoryId('');
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'border-[#8c3315] bg-[#fff3f0] text-[#8c3315]'
                                : 'border-[#dfc0b7]/40 bg-white hover:bg-[#fffdfb] text-[#57423b]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check size={11} className="text-white" />}
                            </div>
                            <span className="text-xs font-black">{gradeObj.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lộ trình */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Lộ trình (Chọn bằng Checkbox)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const parentCats = vm.categories.filter((c) => c.grade === vm.importGrade && !c.parentId);
                        if (parentCats.length === 0) {
                          return (
                            <p className="col-span-2 text-xs text-gray-400 font-bold py-3 text-center">
                              Không tìm thấy lộ trình nào cho khối lớp này.
                            </p>
                          );
                        }
                        return parentCats.map((parentCat) => {
                          const isSelected = vm.importParentId === parentCat.id;
                          return (
                            <button
                              key={parentCat.id}
                              type="button"
                              onClick={() => {
                                vm.setImportParentId(parentCat.id);
                                vm.setImportCategoryId('');
                                const isExam = parentCat.name.toLowerCase().includes('thi') || parentCat.name.toLowerCase().includes('test');
                                vm.setImportCategory(isExam ? 'EXAM' : 'PRACTICE');
                              }}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'border-[#8c3315] bg-[#fff3f0] text-[#8c3315]'
                                  : 'border-[#dfc0b7]/40 bg-white hover:bg-[#fffdfb] text-[#57423b]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check size={11} className="text-white" />}
                              </div>
                              <span className="text-xs font-black leading-tight">{parentCat.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Danh mục con */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Danh mục con (Chọn bằng Checkbox)</label>
                    <div className="border-2 border-[#dfc0b7]/40 rounded-2xl bg-white p-2.5 max-h-48 overflow-y-auto space-y-1.5 shadow-inner">
                      {(() => {
                        if (!vm.importParentId) {
                          return (
                            <p className="text-xs text-gray-400 font-bold text-center py-6">
                              Vui lòng chọn lộ trình ở trên để xem các danh mục con.
                            </p>
                          );
                        }

                        const selectedParent = vm.categories.find(c => c.id === vm.importParentId);
                        const childCats = selectedParent?.children || [];

                        if (childCats.length === 0) {
                          return (
                            <p className="text-xs text-gray-400 font-bold text-center py-6">
                              Không có danh mục con nào trong lộ trình này.
                            </p>
                          );
                        }

                        return childCats.map((childCat) => {
                          const isSelected = vm.importCategoryIds.includes(childCat.id);
                          return (
                            <button
                              key={childCat.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  vm.setImportCategoryIds(vm.importCategoryIds.filter(id => id !== childCat.id));
                                } else {
                                  vm.setImportCategoryIds([...vm.importCategoryIds, childCat.id]);
                                }
                              }}
                              className={`w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'border-[#8c3315]/60 bg-[#fff3f0]/50 text-[#8c3315]'
                                  : 'border-transparent bg-transparent hover:bg-gray-50 text-[#57423b]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check size={11} className="text-white" />}
                              </div>
                              <span className="text-xs font-black">
                                {childCat.name}
                              </span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-[#dfc0b7]/30 flex justify-end gap-3 bg-[#fffdfb]">
                <button
                  type="button"
                  onClick={() => {
                    vm.setShowImportForm(false);
                    vm.setImportTitle('');
                    vm.setImportDesc('');
                    vm.setImportFile(null);
                    vm.setImportCategoryId('');
                  }}
                  className="px-5 py-2.5 bg-white border border-[#dfc0b7]/60 text-[#57423b] text-xs font-black rounded-xl hover:bg-[#fff3f0] hover:text-[#8c3315] transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  disabled={vm.importing}
                  className="px-5 py-2.5 bg-[#8c3315] text-white text-xs font-black rounded-xl hover:bg-[#72270e] transition-all uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {vm.importing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý Word...
                    </>
                  ) : (
                    'Bắt đầu Trích xuất'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: GENERATE EXAM BY TOPICS ==================== */}
      {false && vm.showTopicGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border-2 border-[#dfc0b7] rounded-[36px] w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-6 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb]">
              <h3 className="text-xl font-black text-[#241916] flex items-center gap-2">
                <Brain className="text-[#006b58]" size={22} />
                Tạo đề thi ngẫu nhiên theo chủ đề
              </h3>
              <button
                onClick={() => {
                  vm.setShowTopicGenerator(false);
                  vm.setGeneratorTitle('');
                  vm.setGeneratorDesc('');
                  vm.setGeneratorCategoryIds([]);
                  vm.setGeneratorParentId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={vm.generateTestFromTopicsAction} className="p-6 space-y-6 bg-[#fffdfb] overflow-y-auto max-h-[80vh]">
              {vm.generatorError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  {vm.generatorError}
                </div>
              )}
              {vm.generatorSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-2">
                  <Check size={16} />
                  {vm.generatorSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: General Config */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Tiêu đề đề thi *</label>
                    <input
                      type="text"
                      required
                      value={vm.generatorTitle}
                      onChange={(e) => vm.setGeneratorTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-bold transition-all"
                      placeholder="VD: Đề thi khảo sát ngẫu nhiên tháng 6"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Mô tả ngắn đề thi</label>
                    <textarea
                      rows={4}
                      value={vm.generatorDesc}
                      onChange={(e) => vm.setGeneratorDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-semibold transition-all resize-none"
                      placeholder="VD: Đề khảo sát ngẫu nhiên hệ thống các câu hỏi"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8b716a] uppercase tracking-wider mb-1.5">Thời gian làm bài (phút)</label>
                    <input
                      type="number"
                      value={vm.generatorDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        vm.setGeneratorDuration(val === '' ? '' : parseInt(val) || 0);
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-[#dfc0b7]/60 rounded-xl text-xs text-[#241916] placeholder-gray-400 focus:outline-none focus:border-[#8c3315] font-black transition-all"
                      placeholder="90"
                    />
                  </div>
                </div>

                {/* Column 2: Categorization (matching normal modal) */}
                <div className="space-y-4 bg-[#fffdfb] border border-[#dfc0b7]/40 rounded-2xl p-4">
                  {/* Khối lớp */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Khối lớp (Chọn bằng Checkbox)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'GRADE_10', label: 'Lớp 10' },
                        { id: 'GRADE_11', label: 'Lớp 11' },
                        { id: 'GRADE_12', label: 'Lớp 12' }
                      ].map((gradeObj) => {
                        const isSelected = vm.generatorGrade === gradeObj.id;
                        return (
                          <button
                            key={gradeObj.id}
                            type="button"
                            onClick={() => {
                              vm.setGeneratorGrade(gradeObj.id);
                              vm.setGeneratorParentId('');
                              vm.setGeneratorCategoryIds([]);
                              vm.fetchTopicsForGenerator(gradeObj.id);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'border-[#8c3315] bg-[#fff3f0] text-[#8c3315]'
                                : 'border-[#dfc0b7]/40 bg-white hover:bg-[#fffdfb] text-[#57423b]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check size={11} className="text-white" />}
                            </div>
                            <span className="text-xs font-black">{gradeObj.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lộ trình */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Lộ trình (Chọn bằng Checkbox)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const parentCats = vm.categories.filter((c) => c.grade === vm.generatorGrade && !c.parentId);
                        if (parentCats.length === 0) {
                          return (
                            <p className="col-span-2 text-xs text-gray-400 font-bold py-3 text-center">
                              Không tìm thấy lộ trình nào cho khối lớp này.
                            </p>
                          );
                        }
                        return parentCats.map((pCat) => {
                          const isSelected = vm.generatorParentId === pCat.id;
                          return (
                            <button
                              key={pCat.id}
                              type="button"
                              onClick={() => {
                                vm.setGeneratorParentId(pCat.id);
                                vm.setGeneratorCategoryIds([]);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'border-[#8c3315] bg-[#fff3f0] text-[#8c3315]'
                                  : 'border-[#dfc0b7]/40 bg-white hover:bg-[#fffdfb] text-[#57423b]'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check size={11} className="text-white" />}
                              </div>
                              <span className="text-xs font-black truncate">{pCat.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Danh mục con */}
                  {vm.generatorParentId && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider block">Danh mục con (Chọn bằng Checkbox)</label>
                      <div className="border border-[#dfc0b7]/40 rounded-xl bg-white p-2.5 max-h-40 overflow-y-auto space-y-1 shadow-inner">
                        {(() => {
                          const selectedParent = vm.categories.find(c => c.id === vm.generatorParentId);
                          const childCats = selectedParent?.children || [];
                          if (childCats.length === 0) {
                            return <p className="text-xs text-gray-400 font-bold py-3 text-center">Không có danh mục con.</p>;
                          }
                          return childCats.map((childCat) => {
                            const isSelected = vm.generatorCategoryIds.includes(childCat.id);
                            return (
                              <button
                                key={childCat.id}
                                type="button"
                                onClick={() => {
                                  let nextIds;
                                  if (isSelected) {
                                    nextIds = vm.generatorCategoryIds.filter(id => id !== childCat.id);
                                  } else {
                                    nextIds = [...vm.generatorCategoryIds, childCat.id];
                                  }
                                  vm.setGeneratorCategoryIds(nextIds);
                                  vm.setGeneratorCategoryId(nextIds[0] || '');
                                }}
                                className={`w-full flex items-center gap-2.5 p-1.5 rounded-lg border transition-all cursor-pointer text-left ${
                                  isSelected ? 'border-[#8c3315]/60 bg-[#fff3f0]/50 text-[#8c3315]' : 'border-transparent bg-transparent hover:bg-gray-50 text-[#57423b]'
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                  isSelected ? 'bg-[#8c3315] border-[#8c3315]' : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <span className="text-[11px] font-black">{childCat.name}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Topic configurations list */}
                <div className="space-y-4 bg-white border border-[#dfc0b7]/40 rounded-2xl p-4">
                  <h4 className="text-xs font-black text-[#241916] pb-2 border-b border-[#dfc0b7]/30 flex justify-between items-center gap-2">
                    <span className="uppercase tracking-wider text-[10px] text-[#8b716a] whitespace-nowrap">Chọn số câu mỗi chuyên đề</span>
                    <span className="text-xs text-[#006b58] font-black whitespace-nowrap">
                      Tổng số câu: {Object.values(vm.topicCounts).reduce((a, b) => a + (parseInt(b) || 0), 0)} câu
                    </span>
                  </h4>
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {(Array.isArray(vm.topicsForGenerator) ? vm.topicsForGenerator : []).map((topic) => {
                      const currentCount = vm.topicCounts[topic.id] || 0;
                      return (
                        <div key={topic.id} className="flex items-center justify-between p-2.5 border border-[#dfc0b7]/30 rounded-xl bg-[#fffdfb]">
                          <div className="space-y-0.5 max-w-[60%]">
                            <span className="text-xs font-black text-[#241916] block truncate" title={topic.title}>{topic.title}</span>
                            <span className="text-[9px] text-gray-400 font-bold block">{topic.questionCount} câu hỏi sẵn có</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(0, currentCount - 1);
                                vm.setTopicCounts({ ...vm.topicCounts, [topic.id]: nextVal });
                              }}
                              className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full font-black text-xs flex items-center justify-center cursor-pointer select-none text-gray-600"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={topic.questionCount}
                              value={currentCount}
                              onChange={(e) => {
                                const val = Math.min(topic.questionCount, Math.max(0, parseInt(e.target.value) || 0));
                                vm.setTopicCounts({ ...vm.topicCounts, [topic.id]: val });
                              }}
                              className="w-10 text-center py-0.5 border border-[#dfc0b7]/60 rounded-lg text-xs font-black focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.min(topic.questionCount, currentCount + 1);
                                vm.setTopicCounts({ ...vm.topicCounts, [topic.id]: nextVal });
                              }}
                              className="w-6 h-6 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full font-black text-xs flex items-center justify-center cursor-pointer select-none text-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-[#dfc0b7]/30 flex justify-end gap-3 bg-[#fffdfb]">
                <button
                  type="button"
                  onClick={() => {
                    vm.setShowTopicGenerator(false);
                    vm.setGeneratorTitle('');
                    vm.setGeneratorDesc('');
                    vm.setGeneratorCategoryIds([]);
                    vm.setGeneratorParentId('');
                  }}
                  className="px-5 py-2.5 bg-white border border-[#dfc0b7]/60 text-[#57423b] text-xs font-black rounded-xl hover:bg-[#fff3f0] hover:text-[#8c3315] transition-all uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  disabled={vm.generatingByTopics}
                  className="px-5 py-2.5 bg-[#006b58] text-white text-xs font-black rounded-xl hover:bg-[#005546] transition-all uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {vm.generatingByTopics ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang khởi tạo đề...
                    </>
                  ) : (
                    'Khởi tạo Đề thi'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EXAM PREVIEW ==================== */}
      {vm.previewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="bg-white border-2 border-[#dfc0b7] rounded-[36px] w-full max-w-4xl overflow-hidden flex flex-col shadow-2xl animate-scaleIn text-left">
            <div className="p-6 border-b border-[#dfc0b7]/30 flex items-center justify-between bg-[#fffdfb]">
              <div>
                <h3 className="text-lg font-black text-[#241916]">{vm.previewExam.title}</h3>
                <p className="text-[10px] text-[#8b716a] font-bold mt-1 uppercase tracking-wide">
                  {vm.previewExam.grade === 'GRADE_12' ? 'Lớp 12' : vm.previewExam.grade === 'GRADE_11' ? 'Lớp 11' : 'Lớp 10'} • {vm.formatCategoryType(vm.previewExam.category)} • {vm.previewExam.durationMinutes} phút
                </p>
              </div>
              <button
                onClick={() => vm.setPreviewExam(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 bg-[#fffdfb] overflow-y-auto max-h-[85vh]">
              {vm.previewExam.questions?.length === 0 ? (
                <p className="text-xs font-black text-gray-400 text-center py-12">Đề thi chưa có câu hỏi nào.</p>
              ) : (
                <div className="space-y-6">
                  {vm.previewExam.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-5 border border-[#dfc0b7]/40 rounded-[24px] bg-white space-y-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#8c3315]/10 text-[#8c3315] rounded font-black text-[9px]">
                          Câu {q.num}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-bold text-[9px]">
                          Phần {q.section}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">({q.points} điểm)</span>
                        {q.topicTitle && <span className="text-[10px] text-[#006b58] font-bold">Chủ đề: {q.topicTitle}</span>}
                      </div>

                      {/* Question Text */}
                      <p className="text-xs font-black text-[#241916] whitespace-pre-wrap leading-relaxed">
                        {renderMathText(q.question)}
                      </p>

                      {/* Question Images */}
                      {q.images && q.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.images.filter(Boolean).map((imgUrl, i) => (
                            <img key={i} src={imgUrl} alt="question-asset" className="max-h-48 rounded-xl border border-amber-200 object-contain bg-white-forced p-1.5" />
                          ))}
                        </div>
                      )}

                      {/* Options for Section I */}
                      {q.section === 'I' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                          {q.options.map((opt, i) => {
                            const isCorrect = q.correctAnswer === i;
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-black'
                                    : 'border-gray-100 bg-[#fffdfb] text-gray-700'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-black ${
                                  isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>
                                  {getOptionLabel(i)}
                                </span>
                                <span>{renderMathText(opt)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* TF Statements for Section II */}
                      {q.section === 'II' && q.tfStatements && (
                        <div className="space-y-2 pt-2">
                          {q.tfStatements.map((stmt, i) => {
                            const vals = q.correctAnswer?.vals || ['Đ', 'Đ', 'Đ', 'Đ'];
                            const correctVal = vals[i];
                            return (
                              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-[#fffdfb] gap-4">
                                <span className="text-xs text-gray-700 font-bold">
                                  {stmt.key.toUpperCase()}. {renderMathText(stmt.text)}
                                </span>
                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0 ${
                                  correctVal === 'Đ' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  Đáp án: {correctVal === 'Đ' ? 'Đúng' : 'Sai'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Short answer for Section III */}
                      {q.section === 'III' && (
                        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-900">
                          Đáp án đúng: <span className="font-black underline">{renderMathText(q.correctAnswer?.val || '')}</span>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200/60 rounded-xl space-y-1.5">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Lời giải chi tiết:</p>
                          <p className="text-xs text-[#57423b] font-medium leading-relaxed">{renderMathText(q.explanation)}</p>
                          {q.solImages && q.solImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {q.solImages.filter(Boolean).map((solImg, i) => (
                                <img key={i} src={solImg} alt="sol-asset" className="max-h-40 rounded-xl border border-gray-200 object-contain bg-white-forced p-1.5" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
