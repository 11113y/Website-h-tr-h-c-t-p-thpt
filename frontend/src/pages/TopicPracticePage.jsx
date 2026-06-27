import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/client';
import { ArrowLeft, BookOpen, Brain, Star, CheckCircle, AlertTriangle, ArrowRight, Play, Check, Lock, GraduationCap, X } from 'lucide-react';

const STABLE_MASCOTS = [
  '/practice/mascot-reading.png',
  '/practice/mascot-hiking.png',
  '/practice/mascot-idea.png',
  '/practice/mascot-duo.png',
  '/practice/mascot-trophy.png',
  '/practice/mascot-pencil.png',
  '/practice/mascot-thumbsup.png',
];

export default function TopicPracticePage({ navigateTo, startQuiz, isLoggedIn, activeGrade }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingPracticeId, setStartingPracticeId] = useState(null);
  const [selectedPracticeTopic, setSelectedPracticeTopic] = useState(null);
  const [practiceQuestionLimit, setPracticeQuestionLimit] = useState(10);

  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const [pathPoints, setPathPoints] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/topics/practice?grade=${activeGrade}`);
        if (res.data && res.data.success) {
          setTopics(res.data.topics);
        } else {
          setError('Không thể lấy danh sách chủ đề.');
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Có lỗi xảy ra khi kết nối máy chủ.');
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [activeGrade]);

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
    const timeout = setTimeout(updatePathPoints, 350);
    window.addEventListener('resize', updatePathPoints);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePathPoints);
    };
  }, [topics]);

  const handleOpenPracticeConfig = (topic) => {
    setSelectedPracticeTopic(topic);
    setPracticeQuestionLimit(Math.min(10, topic.questionCount));
  };

  const handleStartPractice = async () => {
    if (!selectedPracticeTopic) return;
    const topicId = selectedPracticeTopic.id;
    setStartingPracticeId(topicId);
    try {
      const res = await axios.post(`/topics/${topicId}/practice`, {
        grade: activeGrade,
        limit: practiceQuestionLimit
      });
      if (res.data && res.data.success) {
        setSelectedPracticeTopic(null);
        startQuiz(res.data.testId);
      } else {
        alert(res.data.message || 'Không thể khởi tạo bài luyện tập.');
      }
    } catch (err) {
      console.error('Error starting topic practice:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi bắt đầu luyện tập.');
    } finally {
      setStartingPracticeId(null);
    }
  };

  const getGradeLabel = (g) => {
    if (g === 'GRADE_12') return '12';
    if (g === 'GRADE_11') return '11';
    return '10';
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-20 relative">
      {/* Back Button */}
      <div className="flex justify-start px-2 md:px-0 pt-4">
        <button
          onClick={() => navigateTo('practice-select')}
          className="flex items-center gap-1.5 px-4 py-2 border-2 border-[#bceae0]/80 text-[#006b58] hover:bg-[#f0faf7] hover:border-[#006b58]/30 rounded-2xl font-black text-xs transition-all cursor-pointer bg-white shadow-sm"
        >
          <ArrowLeft size={14} className="stroke-[3]" />
          Quay lại Lộ trình
        </button>
      </div>

      {/* Header */}
      <div className="text-center space-y-3 relative z-10">
        <div className="inline-flex p-3.5 bg-[#f0faf7] border border-[#006b58]/20 rounded-3xl text-[#006b58] mb-1 animate-bounce">
          <Brain size={32} className="stroke-[2.5]" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-[#241916]">
          Luyện tập theo chuyên đề lớp {getGradeLabel(activeGrade)}
        </h2>
        <p className="text-sm font-semibold text-[#8b716a] max-w-xl mx-auto leading-relaxed">
          Chinh phục đỉnh cao kiến thức với bản đồ leo núi theo từng chuyên đề sách giáo khoa ⛰️
        </p>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-[#006b58] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#8b716a] animate-pulse">Đang tải danh sách chuyên đề...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-6 text-center max-w-xl mx-auto space-y-3 shadow-md animate-fadeIn">
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="bg-[#fffdfd] border border-[#dfc0b7]/50 rounded-[32px] p-8 text-center max-w-xl mx-auto space-y-4 shadow-md animate-fadeIn">
          <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-sm animate-bounce">
            <BookOpen size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#241916]">Chưa có chuyên đề nào</h3>
            <p className="text-xs font-semibold text-[#8b716a] max-w-sm mx-auto">
              Hệ thống chưa tìm thấy chuyên đề toán học nào. Vui lòng quay lại sau!
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
                stroke="#bceae0"
                strokeWidth="3.5"
                strokeDasharray="8 8"
                className="drop-shadow-[0_2px_4px_rgba(0,107,88,0.1)]"
              />
            )}
          </svg>

          <div className="space-y-16 relative z-10">
            {topics.map((topic, index) => {
              const isEven = index % 2 === 0;
              const isCurrent = index === 0;
              const hasQuestions = topic.questionCount > 0;
              const accuracy = topic.userAccuracy;
              const isWeak = accuracy !== null && accuracy < 70;
              const isStrong = accuracy !== null && accuracy >= 70;
              
              // Assign mascot stably based on index
              const mascotSrc = STABLE_MASCOTS[index % STABLE_MASCOTS.length];
              const altitude = `${300 + index * 1000}m`;

              return (
                <div
                  key={topic.id}
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
                        isStrong
                          ? 'bg-[#006b58] border-[#74f9d8] text-white'
                          : isCurrent
                            ? 'bg-[#006b58] border-white text-white animate-pulse ring-4 ring-[#006b58]/20 scale-110'
                            : 'bg-white border-[#bceae0] text-[#006b58] font-extrabold'
                      }`}
                    >
                      {isStrong ? (
                        <Check className="stroke-[3] w-5 h-5 text-white" />
                      ) : (
                        <span className="font-extrabold text-sm">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Altitude indicator bubble */}
                    <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-[#f0faf7] border border-[#bceae0] text-[#006b58] font-extrabold text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      {altitude}
                    </div>
                  </div>

                  {/* Content Card (Full-width on mobile, left/right alternating on desktop) */}
                  <div className="flex-1 w-full relative group">
                    
                    {/* Floating Mascot positioned beside cards */}
                    {hasQuestions && (
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

                    <div className={`bg-white rounded-[32px] border-2 transition-all p-6 text-left shadow-sm ${
                      isCurrent 
                        ? 'border-[#006b58] shadow-md ring-4 ring-[#006b58]/5 scale-[1.01]' 
                        : isStrong
                          ? 'border-emerald-100 hover:border-emerald-300'
                          : isWeak
                            ? 'border-orange-200 hover:border-orange-300'
                            : 'border-[#bceae0]/50 opacity-90 hover:opacity-100 hover:border-[#006b58]/30'
                    }`}>
                      
                      {/* Topic Title & Badge */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-[#006b58] uppercase">
                            CHUYÊN ĐỀ {index + 1}
                          </span>
                          <h3 className="font-black text-lg text-[#241916] mt-0.5 group-hover:text-[#006b58] transition-colors">
                            {topic.title}
                          </h3>
                        </div>
                        
                        {/* Personalization Badges */}
                        {isLoggedIn && (
                          <div className="shrink-0">
                            {accuracy !== null ? (
                              isWeak ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 font-extrabold text-[9px] rounded-full uppercase border border-orange-200">
                                  <AlertTriangle size={10} className="stroke-[3]" /> Yếu ({accuracy}%)
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-[9px] rounded-full uppercase border border-emerald-200">
                                  <CheckCircle size={10} className="stroke-[3]" /> Mạnh ({accuracy}%)
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-1 bg-gray-50 text-gray-500 font-bold text-[9px] rounded-full border border-gray-200">
                                Chưa luyện tập
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-[#57423b] mt-3 leading-relaxed">
                        {topic.description || `Hệ thống các câu hỏi tự động bám sát kiến thức chuyên đề ${topic.title}.`}
                      </p>

                      {/* Progress bar inside card */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-extrabold text-[#8b716a]">
                          <span>Tiến độ ngân hàng câu hỏi</span>
                          <span>{topic.questionCount} câu có sẵn</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#f0ede9] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isWeak ? 'bg-orange-500' : 'bg-[#006b58]'}`}
                            style={{ width: `${accuracy !== null ? accuracy : 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f0e5e1]">
                        <button
                          disabled={!hasQuestions || startingPracticeId !== null}
                          onClick={() => handleOpenPracticeConfig(topic)}
                          className={`font-black text-xs px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer select-none outline-none ${
                            !hasQuestions
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                              : startingPracticeId === topic.id
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isWeak
                              ? 'bg-orange-600 hover:bg-orange-700 text-white'
                              : 'bg-[#006b58] hover:bg-[#005546] text-white'
                          }`}
                        >
                          {startingPracticeId === topic.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                              Đang chuẩn bị đề...
                            </>
                          ) : (
                            <>
                              <Play size={12} className="fill-white stroke-none" />
                              Luyện tập ngay
                            </>
                          )}
                        </button>
                        
                        <span className="text-[10px] font-extrabold text-[#8b716a] uppercase tracking-widest">
                          Mã CĐ: #{topic.id.substring(0, 8)}
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

      {/* Configuration Modal */}
      {selectedPracticeTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn text-left">
          <div className="bg-white border-2 border-[#bceae0] rounded-[36px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-[#bceae0]/30 flex items-center justify-between bg-[#f0faf7]">
              <h3 className="text-lg font-black text-[#006b58] flex items-center gap-2">
                <Brain className="text-[#006b58]" size={20} />
                Cấu hình ôn tập chuyên đề
              </h3>
              <button
                onClick={() => setSelectedPracticeTopic(null)}
                className="p-2 hover:bg-emerald-50 rounded-full text-gray-500 hover:text-[#006b58] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-6 bg-white">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black tracking-widest text-[#006b58] uppercase">Chuyên đề lựa chọn</span>
                <h4 className="text-sm font-black text-[#241916] leading-snug">{selectedPracticeTopic.title}</h4>
                <p className="text-[11px] font-medium text-[#8b716a]">{selectedPracticeTopic.description || 'Hệ thống tự động ôn luyện toàn diện chuyên đề.'}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-black text-[#57423b] uppercase tracking-wider">
                  Số lượng câu hỏi muốn ôn tập: <span className="text-[#006b58] text-sm font-black">{practiceQuestionLimit} câu</span>
                </label>
                
                {/* Number selector buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20, 25, 30, 40, 50].map((num) => {
                    const isDisabled = num > selectedPracticeTopic.questionCount;
                    const isSelected = practiceQuestionLimit === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setPracticeQuestionLimit(num)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          isSelected
                            ? 'bg-[#006b58] border-[#006b58] text-white shadow-sm'
                            : isDisabled
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-[#bceae0]/50 text-[#57423b] hover:bg-[#f0faf7] hover:border-[#006b58]/35'
                        }`}
                      >
                        {num} câu
                      </button>
                    );
                  })}
                </div>
                
                {/* Range input slider */}
                <div className="space-y-1 pt-2">
                  <input
                    type="range"
                    min={1}
                    max={selectedPracticeTopic.questionCount}
                    value={practiceQuestionLimit}
                    onChange={(e) => setPracticeQuestionLimit(parseInt(e.target.value))}
                    className="w-full accent-[#006b58]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-extrabold">
                    <span>1 câu</span>
                    <span>Tối đa: {selectedPracticeTopic.questionCount} câu</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-[#dfc0b7]/25 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPracticeTopic(null)}
                  className="px-5 py-2.5 bg-white border border-[#bceae0] text-[#57423b] text-xs font-black rounded-xl hover:bg-[#f0faf7] hover:text-[#006b58] transition-all uppercase tracking-wider cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={startingPracticeId !== null}
                  onClick={handleStartPractice}
                  className="px-5 py-2.5 bg-[#006b58] hover:bg-[#005546] text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {startingPracticeId !== null ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang chuẩn bị...
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-white stroke-none" />
                      Bắt đầu ôn tập
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
