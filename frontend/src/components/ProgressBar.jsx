import React from 'react';

export default function ProgressBar({ totalQuestions = 0, activeQuestionIdx = 0 }) {
  if (!totalQuestions) return null;
  const progress = Math.round(((activeQuestionIdx + 1) / totalQuestions) * 100);
  return (
    <div className="fixed left-0 right-0 bottom-0 bg-white/90 backdrop-blur-sm border-t border-[#dfc0b7] z-50 p-2 md:p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1200px] mx-auto flex items-center">
        <div className="flex-1 h-2 bg-[#f0ded8] rounded-full overflow-hidden">
          <div className="h-full bg-[#8c3315] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="ml-3 text-xs md:text-sm font-black text-[#8c3315] whitespace-nowrap">
          Câu {activeQuestionIdx + 1}/{totalQuestions} ({progress}%)
        </span>
      </div>
    </div>
  );
}
