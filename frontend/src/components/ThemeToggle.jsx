import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      }}
      className="relative w-8 h-8 md:w-[clamp(32px,2.4vw,52px)] md:h-[clamp(32px,2.4vw,52px)] rounded-full bg-[rgba(var(--primary-rgb),0.05)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.1)] flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer overflow-hidden group"
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      aria-label="Toggle theme"
    >
      <div className="relative w-4.5 h-4.5 md:w-6 md:h-6 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`absolute w-full h-full transition-all duration-500 transform ${
            theme === 'dark'
              ? 'rotate-90 scale-0 opacity-0 text-amber-500'
              : 'rotate-0 scale-100 opacity-100 text-[var(--primary)] group-hover:rotate-45'
          }`}
          size={18}
        />
        {/* Moon Icon */}
        <Moon
          className={`absolute w-full h-full transition-all duration-500 transform ${
            theme === 'dark'
              ? 'rotate-0 scale-100 opacity-100 text-[var(--primary)] group-hover:-rotate-12'
              : '-rotate-90 scale-0 opacity-0 text-slate-700'
          }`}
          size={18}
        />
      </div>
    </button>
  );
}
