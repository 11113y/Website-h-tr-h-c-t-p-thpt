import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, Check, Lock, Compass, GraduationCap, AlertCircle } from 'lucide-react';

const TEAL_MASCOTS = [
  '/mascots/teal/mascot-pencil.png',
  '/mascots/teal/mascot-reading.png',
  '/mascots/teal/mascot-idea.png',
  '/mascots/teal/mascot-hiking.png',
  '/mascots/teal/mascot-duo.png',
];

const BANHMI_MASCOTS = [
  '/mascots/banhmi/banh_mi_reading-Photoroom.png',
  '/mascots/banhmi/banh_mi_writing-Photoroom.png',
  '/mascots/banhmi/banh_mi_idea-Photoroom.png',
  '/mascots/banhmi/banh_mi_hiking-Photoroom.png',
  '/mascots/banhmi/banh_mi_trophy-Photoroom.png',
];

export default function RoadmapPage({ 
  startQuiz, 
  roadmapMode, 
  setRoadmapMode,
  practiceSubView,
  setPracticeSubView,
  examSubView,
  setExamSubView,
  activeGrade,
  selectedCategoryId,
  setSelectedCategoryId,
  navigateTo
}) {
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const [pathPoints, setPathPoints] = useState([]);

  const handleBack = () => {
    setSelectedCategoryId(null);
    navigateTo(roadmapMode === 'practice' ? 'practice-select' : 'exam-select');
  };
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (selectedCategoryId) {
      const getCatName = async () => {
        try {
          const res = await axios.get('/api/categories');
          if (res.data && res.data.success) {
            const allCats = res.data.categories;
            const flat = [];
            allCats.forEach(c => {
              flat.push(c);
              if (c.children) {
                c.children.forEach(child => flat.push(child));
              }
            });
            const found = flat.find(c => c.id === selectedCategoryId);
            if (found) {
              setCategoryName(found.name);
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      getCatName();
    }
  }, [selectedCategoryId]);

  // Clear nodeRefs array on each render
  nodeRefs.current = [];

  const addToNodeRefs = (el) => {
    if (el && !nodeRefs.current.includes(el)) {
      nodeRefs.current.push(el);
    }
  };

  const updatePathPoints = () => {
    if (!containerRef.current || nodeRefs.current.length === 0) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const points = nodeRefs.current.map((node) => {
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      };
    }).filter(Boolean);

    setPathPoints(points);
  };

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/tests?grade=${activeGrade}`;
        if (selectedCategoryId) {
          url += `&categoryId=${selectedCategoryId}`;
        } else {
          let categoryParam = 'PRACTICE_THEMATIC';
          if (roadmapMode === 'practice') {
            categoryParam = practiceSubView === 'topic' ? 'PRACTICE_THEMATIC' : 'PRACTICE_FORMAT';
          } else {
            categoryParam = examSubView === 'school' ? 'EXAM_SCHOOL' : 'EXAM_THPT';
          }
          url += `&category=${categoryParam}`;
        }
        const res = await axios.get(url);
        if (res.data && res.data.success) {
          setTests(res.data.tests);
        } else {
          setTests([]);
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
        setError('Không thể tải danh sách đề thi từ máy chủ.');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [roadmapMode, practiceSubView, examSubView, activeGrade, selectedCategoryId]);

  useEffect(() => {
    const timeout = setTimeout(updatePathPoints, 350);
    window.addEventListener('resize', updatePathPoints);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePathPoints);
    };
  }, [tests]);

  const isPractice = roadmapMode === 'practice';

  const getGradeLabel = (g) => {
    if (g === 'GRADE_12') return '12';
    if (g === 'GRADE_11') return '11';
    return '10';
  };

  const getPageTitle = () => {
    const gradeSuffix = ` - Lớp ${getGradeLabel(activeGrade)}`;
    if (selectedCategoryId && categoryName) {
      return categoryName + gradeSuffix;
    }
    if (isPractice) {
      return (practiceSubView === 'topic' ? 'Luyện theo chuyên đề' : 'Luyện theo dạng bài tập') + gradeSuffix;
    } else {
      return (examSubView === 'school' ? 'Luyện đề Trường / Sở' : 'Luyện đề THPT (Tự soạn)') + gradeSuffix;
    }
  };

  const getPageDescription = () => {
    if (isPractice) {
      return practiceSubView === 'topic'
        ? 'Hành trình chinh phục đỉnh cao Toán học được thiết kế như một cuộc thám hiểm Himalaya theo từng chuyên đề sách giáo khoa.'
        : 'Ôn luyện thông minh tập trung vào từng dạng bài cụ thể xuất hiện nhiều trong các kỳ thi.';
    } else {
      return examSubView === 'school'
        ? 'Tuyển tập đề thi thử khảo sát chất lượng bám sát đề thi từ các trường THPT Chuyên và Sở GD&ĐT.'
        : 'Tuyển tập bộ đề thi thử do HIMA TEST tự biên soạn và chọn lọc kỹ lưỡng dành riêng cho bạn.';
    }
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-20 relative">

      {/* Back Button */}
      <div className="flex justify-start px-2 md:px-0 pt-4">
        <button
          onClick={handleBack}
          className={`flex items-center gap-1.5 px-4 py-2 border-2 rounded-2xl font-black text-xs transition-all cursor-pointer bg-[var(--surface)] ${
            isPractice
              ? 'border-[#bceae0]/80 dark:border-emerald-500/20 text-[#006b58] dark:text-emerald-400 hover:bg-[#f0faf7] dark:hover:bg-emerald-950/20 hover:border-[#006b58]/30'
              : 'border-[#dfc0b7]/60 dark:border-[var(--border-color)]/60 text-[#8c3315] dark:text-[var(--primary)] hover:bg-[#fff3f0] dark:hover:bg-[rgba(var(--primary-rgb),0.1)] hover:border-[#8c3315]/30'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 transform rotate-180" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          Quay lại
        </button>
      </div>

      {/* ===== HEADER INFO ===== */}
      <div className="text-center space-y-3 relative z-10">
        <div className={`inline-flex p-3 rounded-full mb-2 animate-bounce ${
          isPractice ? 'bg-[#f0faf7] dark:bg-emerald-950/30 text-[#006b58] dark:text-emerald-400' : 'bg-[#fff3f0] dark:bg-[rgba(var(--primary-rgb),0.1)] text-[#8c3315] dark:text-[var(--primary)]'
        }`}>
          <Compass size={32} className="stroke-[2.5]" />
        </div>
        <h2 className="text-4xl font-black text-[var(--text-primary)]">
          {getPageTitle()}
        </h2>
        <p className="text-sm font-semibold text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
          {getPageDescription()}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${
            isPractice ? 'border-[#006b58]' : 'border-[#8c3315]'
          }`} />
          <p className="text-sm font-bold text-[var(--text-muted)] animate-pulse">Đang tải danh sách bài kiểm tra...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-450 rounded-3xl p-6 text-center max-w-xl mx-auto space-y-3 shadow-md animate-fadeIn">
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-color)]/50 rounded-[32px] p-8 text-center max-w-xl mx-auto space-y-4 shadow-md animate-fadeIn">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 shadow-sm animate-bounce">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[var(--text-primary)]">Chưa có bài kiểm tra</h3>
            <p className="text-xs font-semibold text-[var(--text-secondary)] max-w-sm mx-auto">
              Hiện tại chuyên mục này chưa có đề thi nào được cập nhật trên hệ thống. Vui lòng quay lại sau!
            </p>
          </div>
        </div>
      ) : (
        /* ===== ZIG-ZAG PATH CONTAINER ===== */
        <div ref={containerRef} className="relative pt-10 px-4 md:px-8 animate-fadeIn">
          
          {/* SVG Zig-Zag Dotted Line (Depth Effect connecting nodes) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {pathPoints.length > 1 && (
              <path
                d={`M ${pathPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeDasharray="8 8"
                className={isPractice ? 'text-[#bceae0] dark:text-emerald-900 drop-shadow-[0_2px_4px_rgba(0,107,88,0.1)]' : 'text-[#dfc0b7] dark:text-[var(--border-color)]/60 drop-shadow-[0_2px_4px_rgba(140,51,21,0.15)]'}
              />
            )}
          </svg>
          
          <div className="space-y-16 relative z-10">
            {tests.map((test, index) => {
              const isEven = index % 2 === 0;
              const isCurrent = index === 0;
              const isCompleted = false;
              const isLocked = false;
              
              // Assign mascot stably based on index
              const mascotsPool = isPractice ? TEAL_MASCOTS : BANHMI_MASCOTS;
              const mascotSrc = mascotsPool[index % mascotsPool.length];
              const altitude = `${500 + index * 1500}m`;

              return (
                <div
                  key={test.id}
                  className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 relative ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Space holder for zig-zag balance */}
                  <div className="flex-1 hidden md:block" />

                  {/* Center Node on desktop, Side marker on mobile */}
                  <div className="relative z-10 shrink-0">
                    <div 
                      ref={addToNodeRefs}
                      className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shadow-md transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#006b58] border-[#74f9d8] text-white'
                          : isCurrent
                            ? isPractice
                              ? 'bg-[#006b58] border-white text-white animate-pulse ring-4 ring-[#006b58]/20 scale-110'
                              : 'bg-[#8c3315] border-white text-white animate-pulse ring-4 ring-[#8c3315]/20 scale-110'
                            : isPractice
                              ? 'bg-[var(--surface)] border-[#bceae0] dark:border-emerald-900 text-[#006b58] dark:text-emerald-400 font-extrabold'
                              : 'bg-[var(--surface)] border-[#dfc0b7] dark:border-[var(--border-color)] text-[#8c3315] dark:text-[var(--primary)] font-extrabold'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} className="stroke-[3]" />
                      ) : (
                        <span className="font-extrabold text-sm">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Altitude indicator bubble */}
                    <div className={`absolute top-14 left-1/2 transform -translate-x-1/2 font-extrabold text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm ${
                      isPractice
                        ? 'bg-[#f0faf7] dark:bg-emerald-950/30 border border-[#bceae0] dark:border-emerald-800 text-[#006b58] dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-400'
                    }`}>
                      {altitude}
                    </div>
                  </div>

                  {/* Content Card (Full-width on mobile, left/right alternating on desktop) */}
                  <div className="flex-1 w-full relative group">
                    
                    {/* Floating Mascot positioned beside active/completed cards */}
                    {!isLocked && (
                      <div className={`absolute z-20 pointer-events-none -top-10 transition-transform duration-300 group-hover:scale-110 ${
                        isEven ? 'left-4 md:-left-16' : 'right-4 md:-right-16'
                      }`}>
                        <img 
                          src={mascotSrc} 
                          alt="Mascot Badge" 
                          className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg animate-float"
                        />
                      </div>
                    )}

                    <div className={`bg-[var(--surface)] rounded-[32px] border-2 transition-all p-6 text-left shadow-sm ${
                      isCurrent 
                        ? isPractice
                          ? 'border-[#006b58] dark:border-emerald-500 shadow-md ring-4 ring-[#006b58]/5 scale-[1.01]'
                          : 'border-[#ff7d54] dark:border-[var(--primary)] shadow-md ring-4 ring-[#ff7d54]/5 scale-[1.01]' 
                        : isCompleted
                          ? 'border-[#006b58]/30 dark:border-emerald-900/30 hover:border-[#006b58]/50 dark:hover:border-emerald-700/50'
                          : isPractice
                            ? 'border-[#bceae0]/50 dark:border-emerald-900/50 opacity-80 hover:opacity-100 hover:border-[#006b58]/30 dark:hover:border-emerald-600/30'
                            : 'border-[#dfc0b7]/50 dark:border-[var(--border-color)] opacity-80 hover:opacity-100 hover:border-[#8c3315]/30 dark:hover:border-[var(--primary)]/30'
                    }`}>
                      
                      {/* Chapter Name & Badge */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">
                            ĐỀ THI {index + 1}
                          </span>
                          <h3 className={`font-black text-lg text-[var(--text-primary)] mt-0.5 transition-colors ${
                            isPractice ? 'group-hover:text-[#006b58] dark:group-hover:text-emerald-400' : 'group-hover:text-[#8c3315] dark:group-hover:text-[var(--primary)]'
                          }`}>
                            {test.title}
                          </h3>
                        </div>
                        
                        {isCurrent && (
                          <span className={`shrink-0 px-2.5 py-1 rounded-full font-black text-[9px] uppercase tracking-wider ${
                            isPractice ? 'bg-[#006b58]/10 dark:bg-emerald-500/20 text-[#006b58] dark:text-emerald-400' : 'bg-[#ff7d54]/10 dark:bg-[var(--primary)]/20 text-[#ff7d54] dark:text-[var(--primary)]'
                          }`}>
                            Đề mới nhất
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[#57423b] dark:text-[var(--text-secondary)] mt-3 leading-relaxed">
                        {test.description || 'Luyện tập giải đề thi chất lượng cao để ôn tập kiến thức toàn diện.'}
                      </p>

                      {/* Progress Bar inside */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-[var(--text-secondary)]">
                          <span>Thời gian làm bài</span>
                          <span>{test.durationMinutes || 90} phút</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#f0ede9] dark:bg-[var(--surface-dim)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isPractice ? 'bg-[#006b58]' : 'bg-[#ff7d54]'}`}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f0e5e1] dark:border-[var(--border-color)]/40">
                        <button 
                          onClick={() => startQuiz(test.id)} 
                          className={`text-white font-black text-xs px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                            isPractice 
                              ? 'bg-[#006b58] hover:bg-[#005546]' 
                              : 'bg-[#8c3315] hover:bg-[#72270e]'
                          }`}
                        >
                          {isPractice ? '⛰️ Luyện tập ngay' : '🎯 Bắt đầu làm bài'}
                        </button>
                        
                        <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-widest">
                          Mã đề: #{test.id.substring(0, 8)}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SUMMIT COMPLETED BLOCK AT BOTTOM ===== */}
      {isPractice && tests.length > 0 && (
        <div id="summit-section" className="pt-8">
          <div className="bg-gradient-to-br from-[#e6f4f1] via-[#f5faf8] to-[#e6f4f1] border-2 border-[#bceae0] rounded-[36px] p-8 text-center max-w-xl mx-auto space-y-5 shadow-lg">
            <div className="w-14 h-14 bg-[#006b58] text-teal-300 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[#006b58] uppercase tracking-wide">ĐỈNH NÚI: LUYỆN ĐỀ TỔNG HỢP</h3>
              <p className="text-xs font-bold text-[#57423b]">
                Thử thách tối hậu dành cho các chiến thần toán học chinh phục 9+ đề thi thực tế THPT Quốc Gia
              </p>
            </div>
            <button 
              onClick={() => {
                setRoadmapMode('exam');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-[#006b58] hover:bg-[#005546] text-white font-black text-xs px-8 py-3.5 rounded-full shadow-md transition-all uppercase tracking-widest cursor-pointer"
            >
              CHINH PHỤC ĐỈNH CAO
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
