/**
 * AdminReports.jsx — View
 * Báo cáo & Thống kê tab UI.
 * Handles sub-views for dashboard, all attempts, and detailed attempt view.
 */
import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, ClipboardList, Award, Activity, Clock, TrendingUp, Eye, ArrowLeft, Check, X, HelpCircle, Search
} from 'lucide-react';
import { useAdminReports } from './useAdminReports';
import { formatCategoryType, formatDuration } from '../../../utils/adminHelpers';
import axios from 'axios';
import { renderMathText } from '../../../pages/QuizPage';
import Pagination from '../../../components/shared/Pagination';
import { useTheme } from '../../../utils/ThemeContext';
import { getAdminPalette } from '../../../utils/adminColorUtils';

export default function AdminReports({ showAlert }) {
  const { adminColor, adminTheme } = useTheme();
  const p = getAdminPalette(adminColor, adminTheme);
  const { reports, loading, fetchReports } = useAdminReports({ showAlert });
  
  // View states: 'dashboard', 'all', 'detail'
  const [subView, setSubView] = useState('dashboard');
  const [previousView, setPreviousView] = useState('dashboard');
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);

  // All attempts states
  const [allAttempts, setAllAttempts] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Attempt detail states
  const [attemptDetail, setAttemptDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Pagination for all attempts
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchAllAttempts = async () => {
    setLoadingAll(true);
    try {
      const res = await axios.get('/api/admin/attempts');
      if (res.data?.success) {
        setAllAttempts(res.data.attempts);
      } else {
        showAlert('Không thể tải tất cả lượt làm bài.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi tải tất cả lượt làm bài.', 'Lỗi', 'error');
    } finally {
      setLoadingAll(false);
    }
  };

  const fetchAttemptDetail = async (attemptId) => {
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/admin/attempts/${attemptId}`);
      if (res.data?.success) {
        setAttemptDetail(res.data.attempt);
        setActiveQuestionIdx(0);
      } else {
        showAlert('Không thể tải chi tiết lượt làm bài.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Đã xảy ra lỗi khi tải chi tiết lượt làm bài.', 'Lỗi', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (subView === 'all') {
      fetchAllAttempts();
    }
  }, [subView]);

  useEffect(() => {
    if (subView === 'detail' && selectedAttemptId) {
      fetchAttemptDetail(selectedAttemptId);
    }
  }, [subView, selectedAttemptId]);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter attempts based on search query
  const filteredAttempts = allAttempts.filter(a => 
    a.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.testTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(filteredAttempts.length / PAGE_SIZE);
  const pagedAttempts = filteredAttempts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Helper to format submission date/time
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} - ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  if (subView === 'detail') {
    return (
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Header section with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAttemptDetail(null);
                setSubView(previousView);
              }}
              className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-[#8c3315] hover:text-[#b34d28] shadow-sm transition-all cursor-pointer flex items-center justify-center"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#241916]">Chi tiết kết quả làm bài</h2>
              <p className="text-xs font-bold text-[#8b716a]">
                Xem chi tiết câu trả lời và quá trình làm bài của học viên.
              </p>
            </div>
          </div>
        </div>

        {/* Loading detail */}
        {loadingDetail && (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#8c3315] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-[#8b716a] uppercase tracking-wider">Đang tải chi tiết bài làm...</p>
          </div>
        )}

        {/* Content detail */}
        {!loadingDetail && attemptDetail && (
          <div className="space-y-6">
            {/* Student and Test summary information card */}
            <div className="bg-[#fffdfb] border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#8c3315]">Học viên</span>
                <h4 className="text-base font-black text-[#241916]">{attemptDetail.user.name}</h4>
                <p className="text-[11px] font-bold text-gray-400">{attemptDetail.user.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: p.accentText }}>Đề thi</span>
                <h4 className="text-base font-black text-[#241916] truncate max-w-xs" title={attemptDetail.test.title}>
                  {attemptDetail.test.title}
                </h4>
                <p className="text-[11px] font-bold text-gray-400">Thời lượng: {attemptDetail.test.durationMinutes} phút</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Kết quả</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black ${attemptDetail.score >= 5 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {attemptDetail.score.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-[#8b716a]">/ 10 điểm</span>
                </div>
                <p className="text-[11px] font-bold text-gray-400">
                  Thời gian làm: {formatDuration(attemptDetail.timeSpentSeconds)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Thời gian nộp</span>
                <h4 className="text-sm font-black text-[#241916] mt-0.5">{formatDate(attemptDetail.submittedAt)}</h4>
                <p className="text-[11px] font-bold text-gray-400">Trạng thái: Hoàn thành</p>
              </div>
            </div>

            {/* Main view panel */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Questions navigation grid */}
              <div className="lg:col-span-1 bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-5 shadow-sm space-y-4 lg:sticky lg:top-8 max-h-[70vh] overflow-y-auto">
                <div>
                  <h3 className="text-xs font-black text-[#241916] uppercase tracking-wider">Danh sách câu</h3>
                  <p className="text-[9px] font-bold text-[#8b716a] mt-0.5">Bấm để chuyển nhanh tới câu hỏi</p>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {attemptDetail.test.questions.map((q, idx) => {
                    const det = attemptDetail.details.find(d => d.questionId === q.id);
                    const isCorrect = det ? det.isCorrect : false;
                    const points = det ? det.points : 0;
                    const isAnswered = det && det.selectedAnswer !== null && det.selectedAnswer !== undefined && det.selectedAnswer !== '';

                    let bgClass = "bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100";
                    if (isAnswered) {
                      if (isCorrect) {
                        bgClass = "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100";
                      } else if (points > 0) {
                        bgClass = "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100";
                      } else {
                        bgClass = "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100";
                      }
                    }

                    const isActive = activeQuestionIdx === idx;
                    const activeBorder = isActive ? 'ring-2 ring-[#8c3315] scale-105 shadow-sm z-10' : '';

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center font-black text-[11px] transition-all cursor-pointer ${bgClass} ${activeBorder}`}
                      >
                        <span>{idx + 1}</span>
                        {det && (
                          <span className="text-[8px] font-bold opacity-80">{det.points}đ</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-[#dfc0b7]/20 flex flex-col gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#8b716a]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-300 rounded" />
                    <span>Trả lời đúng</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-amber-50 border border-amber-300 rounded" />
                    <span>Đúng một phần (Phần II)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-rose-50 border border-rose-300 rounded" />
                    <span>Trả lời sai</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 bg-gray-50 border border-gray-200 rounded" />
                    <span>Chưa làm / Chưa nộp</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Active Question detail content */}
              <div className="lg:col-span-3 space-y-6">
                {(() => {
                  const q = attemptDetail.test.questions[activeQuestionIdx];
                  if (!q) return <div className="text-center font-bold text-gray-400 py-12">Không tìm thấy câu hỏi</div>;

                  const det = attemptDetail.details.find(d => d.questionId === q.id);
                  const userAns = det ? det.selectedAnswer : null;
                  const points = det ? det.points : 0.0;
                  const isCorrect = det ? det.isCorrect : false;

                  return (
                    <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-6">
                      {/* Section Info & points */}
                      <div className="flex items-center justify-between border-b border-[#dfc0b7]/20 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#8c3315] text-white px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            Câu {activeQuestionIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-[#8b716a]">
                            Phần {q.section === 'I' ? 'I' : q.section === 'II' ? 'II' : 'III'}
                          </span>
                          {q.topic?.title && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border" style={{ color: p.accentText, backgroundColor: p.accentBg, borderColor: p.accentBorder }}>
                              {q.topic.title}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-black text-[#8c3315]">
                          Điểm đạt: <span className="text-sm font-black">{points}</span> / {q.points || (q.section === 'I' ? 0.25 : q.section === 'II' ? 1.0 : 0.5)}đ
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="space-y-4">
                        <h3 className="text-sm md:text-base font-extrabold text-[#241916] leading-relaxed">
                          {renderMathText(q.question)}
                        </h3>

                        {/* Question Images */}
                        {q.images && q.images.length > 0 && (
                          <div className="flex flex-col gap-4">
                            {q.images.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-center shadow-inner">
                                <img 
                                  alt={`Hình ảnh câu ${activeQuestionIdx + 1}`} 
                                  className="max-h-64 w-auto rounded-xl border border-gray-150 shadow-sm bg-white" 
                                  src={imgUrl} 
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Student answer vs Correct answer comparison */}
                      <div className="space-y-3 pt-3 border-t border-[#dfc0b7]/10">
                        {q.section === 'I' ? (
                          /* Section I options mapping */
                          <div className="flex flex-col gap-2">
                            {(q.options || []).map((option, optIdx) => {
                              const isSelected = userAns === optIdx;
                              const isCorrectOption = Number(q.correctAnswer) === optIdx;

                              let borderStyle = "border-gray-100 bg-white opacity-60";
                              let badgeStyle = "border-gray-200 text-gray-400";
                              
                              if (isCorrectOption) {
                                borderStyle = "border-emerald-500 bg-emerald-50/50 shadow-sm opacity-100";
                                badgeStyle = "bg-emerald-500 text-white border-emerald-500 font-black";
                              } else if (isSelected) {
                                borderStyle = "border-rose-500 bg-rose-50/50 shadow-sm opacity-100";
                                badgeStyle = "bg-rose-500 text-white border-rose-500 font-black";
                              }

                              return (
                                <div key={optIdx} className={`flex items-center py-2 px-3 border rounded-[12px] transition-all ${borderStyle}`}>
                                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-black text-xs mr-2 transition-all ${badgeStyle}`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </div>
                                  <span className="font-extrabold text-sm text-[#241916]">
                                    {renderMathText(option)}
                                  </span>
                                  {isCorrectOption && (
                                    <span className="ml-auto text-xs font-black text-emerald-600 flex items-center gap-1.5">
                                      <Check size={14} /> Đáp án đúng
                                    </span>
                                  )}
                                  {isSelected && !isCorrectOption && (
                                    <span className="ml-auto text-xs font-black text-rose-600 flex items-center gap-1.5">
                                      <X size={14} /> Học viên chọn
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : q.section === 'II' ? (
                          /* Section II statements mapping */
                          <div className="flex flex-col gap-2">
                            {(q.tfStatements || []).map((st, sIdx) => {
                              const stmtKey = st.key;
                              const studentVal = (userAns || {})[stmtKey] || '';
                              const correctVal = q.correctAnswer?.vals?.[sIdx] || '';
                              const isValCorrect = studentVal === correctVal;

                              return (
                                <div key={stmtKey} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 border border-gray-100 rounded-[12px] bg-white gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className="font-black text-sm text-[#8c3315] shrink-0 mt-0.5">{stmtKey})</span>
                                    <span className="font-extrabold text-sm text-[#241916] leading-snug">{renderMathText(st.text)}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-xs font-bold text-[#8b716a]">
                                      Học viên: <span className={`font-black px-2 py-0.5 rounded text-xs ${isValCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : (studentVal ? 'bg-rose-50 text-rose-700 border border-rose-300' : 'bg-gray-100 text-gray-500')}`}>
                                        {studentVal === 'Đ' ? 'Đúng' : (studentVal === 'S' ? 'Sai' : 'Chưa trả lời')}
                                      </span>
                                    </span>
                                    <span className="text-xs font-bold text-[#006b58]">
                                      Đáp án: <span className="font-black bg-emerald-500 text-white px-2 py-0.5 rounded text-xs">
                                        {correctVal === 'Đ' ? 'Đúng' : 'Sai'}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Section III short answer comparison */
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[12px] bg-gray-50 border border-gray-200">
                            <div className="text-xs font-black text-[#57423b]">
                              Trả lời của học viên: <span className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'}`}>
                                {userAns || '(Chưa trả lời)'}
                              </span>
                            </div>
                            <div className="text-xs font-black text-[#006b58] sm:ml-auto flex items-center gap-1.5">
                              <Check size={14} /> Đáp án đúng: <span className="font-mono text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold">
                                {q.correctAnswer?.val}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Solution / Explanation details */}
                      {q.explanation && (
                        <div className="border border-dashed rounded-2xl p-4.5 space-y-2.5" style={{ backgroundColor: p.accentBg, borderColor: p.accentBorder }}>
                          <h4 className="font-black text-sm flex items-center gap-1.5" style={{ color: p.accentText }}>
                            <HelpCircle size={16} /> Lời giải chi tiết từ HIMA TEST:
                          </h4>
                          <div className="text-sm font-semibold text-[#57423b] leading-relaxed whitespace-pre-line">
                            {renderMathText(q.explanation)}
                          </div>

                          {/* Solution Images */}
                          {q.solImages && q.solImages.length > 0 && (
                            <div className="flex flex-col gap-4 mt-3">
                              {q.solImages.map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="bg-white border border-gray-200 rounded-xl p-3 flex justify-center shadow-sm">
                                  <img 
                                    alt={`Hình ảnh lời giải câu ${activeQuestionIdx + 1}`} 
                                    className="max-h-64 h-auto rounded-lg border border-gray-150 bg-white" 
                                    src={imgUrl} 
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom actions for active question details */}
                <div className="flex justify-between items-center bg-white border-2 border-[#dfc0b7]/40 rounded-[24px] p-4 shadow-sm">
                  <button
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                    className="px-4 py-2 border border-[#dfc0b7] hover:bg-gray-50 text-[#8c3315] font-black text-xs rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    Câu trước
                  </button>
                  <span className="text-xs font-black text-[#8b716a]">
                    Câu {activeQuestionIdx + 1} / {attemptDetail.test.questions.length}
                  </span>
                  <button
                    disabled={activeQuestionIdx === attemptDetail.test.questions.length - 1}
                    onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                    className="px-4 py-2 bg-[#8c3315] hover:bg-[#72270e] text-white font-black text-xs rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    Câu tiếp theo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (subView === 'all') {
    return (
      <div className="space-y-6 text-left animate-fadeIn">
        {/* Header section with Back Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSubView('dashboard');
              }}
              className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-[#8c3315] hover:text-[#b34d28] shadow-sm transition-all cursor-pointer flex items-center justify-center"
              title="Quay lại Tổng quan báo cáo"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-[#241916]">Tất cả lượt làm bài</h2>
              <p className="text-xs font-bold text-[#8b716a]">
                Danh sách toàn bộ lịch sử thi cử và làm bài tập của mọi học viên trên hệ thống.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAllAttempts}
              disabled={loadingAll}
              className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50"
              title="Tải lại danh sách"
            >
              <RefreshCw size={18} className={loadingAll ? 'animate-spin text-[#8c3315]' : ''} />
            </button>
          </div>
        </div>

        {/* Search tool block */}
        <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[24px] p-4 shadow-sm flex items-center gap-3">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên học viên, email, đề thi hoặc danh mục..."
            className="w-full text-sm font-bold text-[#241916] placeholder-gray-400 bg-transparent border-none focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-gray-400 hover:text-[#8c3315] hover:bg-gray-50 rounded-full transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading all attempts */}
        {loadingAll ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#8c3315] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-[#8b716a] uppercase tracking-wider">Đang tải danh sách bài làm...</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-4 overflow-hidden">
            {filteredAttempts.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#dfc0b7]/20 text-[10px] font-black text-[#8b716a] uppercase tracking-wider">
                        <th className="py-3 px-4">Học viên</th>
                        <th className="py-3 px-4">Đề thi</th>
                        <th className="py-3 px-4 text-center">Điểm số</th>
                        <th className="py-3 px-4 text-center">Thời gian làm</th>
                        <th className="py-3 px-4 text-center">Thời gian nộp</th>
                        <th className="py-3 px-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-bold text-[#57423b]">
                      {pagedAttempts.map((a, i) => {
                        const pass = a.score >= 5;
                        return (
                          <tr key={a.id || i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-black text-[#241916]">
                              <div>{a.userName}</div>
                              <div className="text-[9px] font-medium text-gray-400 mt-0.5">{a.userEmail}</div>
                            </td>
                            <td className="py-3.5 px-4 max-w-xs truncate" title={a.testTitle}>
                              <div>{a.testTitle}</div>
                              <div className="text-[9px] font-black mt-0.5 uppercase tracking-wide" style={{ color: p.accentText }}>
                                {formatCategoryType(a.category)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-black">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${pass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {a.score.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center text-gray-500 font-semibold">
                              {formatDuration(a.timeSpentSeconds)}
                            </td>
                            <td className="py-3.5 px-4 text-center text-gray-400 font-medium">
                              {formatDate(a.submittedAt)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => {
                                  setPreviousView('all');
                                  setSelectedAttemptId(a.id);
                                  setSubView('detail');
                                }}
                                className="p-1.5 hover:bg-gray-50 text-[#8c3315] hover:text-[#b34d28] rounded-lg border border-transparent hover:border-[#dfc0b7]/50 transition-all cursor-pointer inline-flex items-center justify-center"
                                title="Xem chi tiết bài làm"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </>
            ) : (
              <div className="py-12 text-center text-xs font-black text-[#8b716a]">
                Không tìm thấy kết quả làm bài nào khớp với từ khóa tìm kiếm.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-[#dfc0b7]/20">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#241916]">Báo cáo &amp; Thống kê</h2>
          <p className="text-xs font-bold text-[#8b716a]">
            Thống kê kết quả thi, xu hướng luyện tập và phân tích điểm mạnh yếu theo từng chuyên đề môn Toán.
          </p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-gray-500 shadow-sm transition-all disabled:opacity-50"
          title="Tải lại dữ liệu báo cáo"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-[#8c3315]' : ''} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#8c3315] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-[#8b716a] uppercase tracking-wider">Đang tính toán dữ liệu báo cáo...</p>
        </div>
      )}

      {/* Content */}
      {!loading && reports && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { 
                label: 'Tổng lượt thi',    
                value: reports.summary.totalAttempts,             
                sub: 'Số lần làm bài của học sinh',          
                icon: <ClipboardList size={22} />, 
                iconStyle: { backgroundColor: p.accentBg, borderColor: p.accentBorder, color: p.accentText },  
                labelStyle: { color: p.accentText } 
              },
              { 
                label: 'Điểm trung bình',   
                value: `${reports.summary.averageScore} / 10`,    
                sub: 'Trên toàn hệ thống',                   
                icon: <Award size={22} />,         
                iconStyle: { backgroundColor: adminTheme === 'dark' ? 'rgba(245,158,11,0.12)' : '#fffbeb', borderColor: adminTheme === 'dark' ? 'rgba(245,158,11,0.3)' : '#fde68a', color: '#fbbf24' },    
                labelStyle: { color: '#fbbf24' } 
              },
              { 
                label: 'Tỷ lệ đạt (≥ 5.0)', 
                value: `${reports.summary.passingRate}%`,        
                sub: 'Học sinh đạt điểm trung bình trở lên', 
                icon: <Activity size={22} />,      
                iconStyle: { backgroundColor: adminTheme === 'dark' ? 'rgba(16,185,129,0.12)' : '#ecfdf5', borderColor: adminTheme === 'dark' ? 'rgba(16,185,129,0.3)' : '#a7f3d0', color: '#34d399' }, 
                labelStyle: { color: '#34d399' } 
              },
              { 
                label: 'Thời gian TB',      
                value: `${reports.summary.averageTimeSpentMinutes} phút`, 
                sub: 'Thời gian trung bình hoàn thành bài thi', 
                icon: <Clock size={22} />, 
                iconStyle: { backgroundColor: adminTheme === 'dark' ? 'rgba(140,51,21,0.12)' : '#fff3f0', borderColor: adminTheme === 'dark' ? 'rgba(140,51,21,0.3)' : '#dfc0b7', color: '#e8825a' }, 
                labelStyle: { color: '#e8825a' } 
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-[#fffdfb] border-2 border-[#dfc0b7]/40 rounded-[28px] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 border rounded-2xl flex items-center justify-center shrink-0" style={kpi.iconStyle}>{kpi.icon}</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={kpi.labelStyle}>{kpi.label}</p>
                  <h4 className="text-2xl font-black text-[#241916] mt-0.5">{kpi.value}</h4>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Bar chart: daily trend */}
            <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm lg:col-span-3 space-y-6">
              <div>
                <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#8c3315]" /> Xu hướng luyện tập 7 ngày qua
                </h3>
                <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Số lượng bài làm được nộp mỗi ngày</p>
              </div>
              <div className="flex items-end justify-between h-48 pt-4 pb-2 px-4 border-b border-[#dfc0b7]/30 bg-gray-50/50 rounded-2xl">
                {reports.dailyTrend.map((d, i) => {
                  const maxVal = Math.max(...reports.dailyTrend.map((x) => x.count), 1);
                  const height = (d.count / maxVal) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center justify-end h-full w-1/12 group relative">
                      <div className="absolute bottom-full mb-2 bg-[#241916] text-white text-[9px] font-black py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                        {d.count} bài làm
                      </div>
                      <div className="w-full h-32 flex items-end justify-center">
                        <div style={{ height: `${Math.max(height, 6)}%` }} className="w-8 bg-gradient-to-t from-[#8c3315] to-[#c85a3b] rounded-t-lg group-hover:brightness-110 shadow-sm transition-all duration-300" />
                      </div>
                      <span className="text-[9px] font-black text-[#8b716a] mt-1.5 shrink-0">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Topic accuracy */}
            <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm lg:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-[#8c3315]" /> Hiệu suất theo chuyên đề
                </h3>
                <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Tỷ lệ trả lời chính xác của từng chuyên đề</p>
              </div>
              {reports.topicStats?.length > 0 ? (
                <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                  {reports.topicStats.map((t, i) => {
                    const bar = t.accuracy >= 75 ? 'bg-emerald-500' : t.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500';
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] font-black">
                          <span className="text-[#241916] truncate max-w-[200px]" title={t.title}>{t.title}</span>
                          <span className="text-[#8c3315]">{t.accuracy}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                          <div style={{ width: `${t.accuracy}%` }} className={`h-full rounded-full transition-all duration-500 ${bar}`} />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-bold text-gray-400">
                          <span>Đúng: {t.correctAnswersCount} / {t.totalQuestionsAnswered} câu</span>
                          <span>Độ khó: {t.accuracy >= 75 ? 'Dễ' : t.accuracy >= 50 ? 'Trung bình' : 'Khó'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs font-semibold text-gray-400">Chưa có dữ liệu thống kê câu trả lời.</div>
              )}
            </div>
          </div>

          {/* Recent attempts table */}
          <div className="bg-white border-2 border-[#dfc0b7]/40 rounded-[32px] p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#241916] uppercase tracking-wider">10 Lượt làm bài gần đây nhất</h3>
              <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">Chi tiết kết quả làm bài của học sinh</p>
            </div>
            {reports.recentAttempts?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#dfc0b7]/20 text-[10px] font-black text-[#8b716a] uppercase tracking-wider">
                      <th className="py-3 px-4">Học sinh</th>
                      <th className="py-3 px-4">Đề thi</th>
                      <th className="py-3 px-4 text-center">Điểm số</th>
                      <th className="py-3 px-4 text-center">Thời gian làm</th>
                      <th className="py-3 px-4 text-center">Thời gian nộp</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-bold text-[#57423b]">
                    {reports.recentAttempts.map((a, i) => {
                      const pass = a.score >= 5;
                      return (
                        <tr key={a.id || i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-black text-[#241916]">
                            <div>{a.userName}</div>
                            <div className="text-[9px] font-medium text-gray-400 mt-0.5">{a.userEmail}</div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate" title={a.testTitle}>
                            <div>{a.testTitle}</div>
                            <div className="text-[9px] font-black mt-0.5 uppercase tracking-wide" style={{ color: p.accentText }}>
                              {formatCategoryType(a.category)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${pass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {a.score.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-500 font-semibold">
                            {formatDuration(a.timeSpentSeconds)}
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-400 font-medium">
                            {formatDate(a.submittedAt)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setPreviousView('dashboard');
                                setSelectedAttemptId(a.id);
                                setSubView('detail');
                              }}
                              className="p-1.5 hover:bg-gray-50 text-[#8c3315] hover:text-[#b34d28] rounded-lg border border-transparent hover:border-[#dfc0b7]/50 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Xem chi tiết bài làm"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs font-black text-[#8b716a]">Chưa có lượt thi nào được thực hiện trên hệ thống.</div>
            )}

            {reports.recentAttempts?.length > 0 && (
              <div className="flex justify-center pt-4 border-t border-[#dfc0b7]/20">
                <button
                  onClick={() => setSubView('all')}
                  className="px-6 py-2.5 bg-white border border-[#dfc0b7] hover:bg-[#fff9f7] text-[#8c3315] font-black text-xs rounded-full transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  Xem thêm tất cả lượt làm bài
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !reports && (
        <div className="bg-[#fffdfb] border-2 border-dashed border-[#dfc0b7]/40 rounded-[32px] p-12 text-center shadow-sm">
          <p className="text-xs font-black text-[#8b716a]">Không có dữ liệu báo cáo thống kê.</p>
        </div>
      )}
    </div>
  );
}
