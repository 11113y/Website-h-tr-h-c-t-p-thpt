import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Layers, GraduationCap, School } from 'lucide-react';

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

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DESC_MAP = {
  'Luyện theo chuyên đề': 'Học tập có hệ thống theo từng chuyên đề sách giáo khoa, vững chắc kiến thức cốt lõi.',
  'Luyện theo dạng bài tập': 'Tập trung ôn luyện và giải quyết các nhóm dạng bài tập thường xuất hiện trong đề thi.',
  'Luyện đề Trường / Sở': 'Cọ xát trực tiếp với đề khảo sát chất lượng của các Sở GD&ĐT và Trường Chuyên danh tiếng.',
  'Luyện đề THPT (Tự soạn)': 'Bộ đề thi thử bám sát ma trận cấu trúc đề thi chính thức do đội ngũ HIMA TEST biên soạn.'
};

const getCategoryType = (cat) => {
  if (cat.children && cat.children.length > 0) {
    const childNames = cat.children.map(child => child.name.toLowerCase());
    if (childNames.some(name => name.includes('chuyên đề') || name.includes('dạng bài') || name.includes('tập'))) {
      return 'practice';
    }
    if (childNames.some(name => name.includes('trường') || name.includes('sở') || name.includes('thpt') || name.includes('thi'))) {
      return 'exam';
    }
  }
  const nameLower = cat.name.toLowerCase();
  if (nameLower.includes('tập') || nameLower.includes('practice')) {
    return 'practice';
  }
  return 'exam';
};

export default function SelectionPage({ type, navigateTo, categories = [], activeGrade, categoriesLoaded, categoriesError }) {
  // Find the appropriate root category from the DB based on grade and classified type
  const rootCategory = categories.find(c => c.grade === activeGrade && !c.parentId && getCategoryType(c) === type);
  const subCategories = rootCategory ? (rootCategory.children || []) : [];

  const config = type === 'practice' ? {
    title: rootCategory ? rootCategory.name : 'Luyện tập',
    subtitle: 'Chọn hình thức luyện tập toán học để bắt đầu hành trình của bạn ⛰️',
    theme: 'teal'
  } : {
    title: rootCategory ? rootCategory.name : 'Luyện thi',
    subtitle: 'Lựa chọn bộ đề thi thử chất lượng cao phù hợp với mục tiêu của bạn 🎯',
    theme: 'banhmi'
  };

  // Get icons and styles for each card dynamically
  const getCardIcon = (index, theme) => {
    if (theme === 'teal') {
      return index === 0 
        ? <BookOpen className="w-5 h-5 text-[#006b58] dark:text-emerald-400" /> 
        : <Layers className="w-5 h-5 text-[#006b58] dark:text-emerald-400" />;
    } else {
      return index === 0 
        ? <School className="w-5 h-5 text-[#8c3315] dark:text-[var(--primary)]" /> 
        : <GraduationCap className="w-5 h-5 text-[#8c3315] dark:text-[var(--primary)]" />;
    }
  };

  const cardStyle = config.theme === 'teal' 
    ? 'from-[#f3faf8] to-[#dcfce7] dark:from-emerald-950/20 dark:to-emerald-950/10 border-[#006b58]/40 dark:border-emerald-500/20 hover:border-[#006b58]/70 dark:hover:border-emerald-500/50 text-[#006b58] dark:text-emerald-400'
    : 'from-[#fff5f2] to-[#fce5dd] dark:from-[rgba(var(--primary-rgb),0.12)] dark:to-[rgba(var(--primary-rgb),0.04)] border-[#dfc0b7] dark:border-[var(--border-color)] hover:border-[#8c3315]/60 dark:hover:border-[var(--primary)] text-[#8c3315] dark:text-[var(--primary)]';

  // Generate random mascots for each subcategory
  const mascots = useMemo(() => {
    const pool = config.theme === 'teal' ? TEAL_MASCOTS : BANHMI_MASCOTS;
    return subCategories.map(() => pickRandom(pool));
  }, [subCategories, config.theme]);

  const getGridClass = () => {
    const len = subCategories.length;
    let widthClass = 'w-full md:w-[clamp(880px,75vw,1240px)]';
    let colsClass = 'grid-cols-1 md:grid-cols-3';
    let heightClass = 'md:h-[clamp(330px,40vh,500px)]';

    if (len === 1) {
      colsClass = 'grid-cols-1 md:grid-cols-1';
      widthClass = 'w-full max-w-md';
    } else if (len === 2) {
      colsClass = 'grid-cols-1 md:grid-cols-2';
      widthClass = 'w-full max-w-4xl';
    } else if (len === 3) {
      colsClass = 'grid-cols-1 md:grid-cols-3';
    } else if (len === 4) {
      colsClass = 'grid-cols-1 md:grid-cols-2';
      widthClass = 'w-full max-w-4xl';
      heightClass = 'md:h-[clamp(320px,42vh,500px)] py-1';
    } else {
      colsClass = 'grid-cols-1 md:grid-cols-3';
      heightClass = 'md:h-[clamp(320px,42vh,500px)] py-1';
    }

    return `grid ${colsClass} ${widthClass} ${heightClass} gap-4 md:gap-[1.5vw] mx-auto items-stretch`;
  };

  const cardHeightStyle = 'h-full min-h-0';

  const mascotHeightStyle = subCategories.length === 2
    ? 'h-32 md:h-[clamp(145px,23vh,240px)]'
    : subCategories.length > 3
      ? 'h-24 md:h-[clamp(70px,10vh,120px)]'
      : 'h-32 md:h-[clamp(110px,15vh,185px)]';

  const cardPaddingStyle = subCategories.length > 3
    ? 'p-4 md:p-[clamp(0.8rem,1.2vh,1.4rem)]'
    : 'p-6 md:p-[clamp(1.2rem,1.8vh,2.2rem)]';

  return (
    <div className="flex-1 flex flex-col justify-between gap-3 pb-0 min-h-0">
      {/* Back Button and Header */}
      <div className="space-y-2">
        <div className="flex items-center">
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 text-xs xl:text-sm 2xl:text-base font-black text-[#8b716a] dark:text-[var(--text-secondary)] hover:text-[#241916] dark:hover:text-[var(--text-primary)] transition-colors bg-[var(--surface)] border border-[var(--border-color)]/50 px-3.5 py-1.5 xl:px-4.5 xl:py-2.5 rounded-full shadow-sm hover:shadow cursor-pointer select-none outline-none"
          >
            <ArrowLeft size={14} className="stroke-[3] xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" />
            <span>Quay lại</span>
          </button>
        </div>

        <div className="text-center pt-0">
          <h2 className="text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
            {config.title}
          </h2>
          <p className="text-xs xl:text-sm 2xl:text-base text-[var(--text-secondary)] font-semibold mt-1">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Grid containing dynamic Cards */}
      <div className="flex-1 overflow-hidden w-full py-1.5 flex flex-col items-center">
        <div className="my-auto w-full flex flex-col items-center py-2">
          {categoriesError ? (
          <div className="text-center py-8 px-6 bg-[rgba(var(--primary-rgb),0.05)] border-2 border-dashed border-[var(--border-color)] rounded-[28px] max-w-sm shadow-sm animate-fadeIn">
            <p className="text-xs font-black text-[var(--primary)] uppercase tracking-wider mb-2">Lỗi kết nối máy chủ</p>
            <p className="text-[11px] font-bold text-[var(--text-secondary)] leading-relaxed mb-3">
              Không thể tải danh mục. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng của bạn.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Tải lại trang
            </button>
          </div>
        ) : !categoriesLoaded ? (
          <div className="text-center py-12">
            <p className="text-xs font-black text-[var(--text-muted)] animate-pulse">Đang tải danh mục...</p>
          </div>
        ) : subCategories.length === 0 ? (
          <div className="text-center py-8 px-6 bg-[var(--surface)] border-2 border-dashed border-[var(--border-color)]/50 rounded-[28px] max-w-sm shadow-sm animate-fadeIn">
            <p className="text-xs font-black text-[var(--primary)] uppercase tracking-wider mb-2">Chưa có bài tập</p>
            <p className="text-[11px] font-bold text-[var(--text-secondary)] leading-relaxed">
              Hệ thống chưa tìm thấy bài tập nào cho lộ trình này.
            </p>
          </div>
        ) : (
          <div className={getGridClass()}>
            {subCategories.map((sub, index) => {
              const description = DESC_MAP[sub.name] || 'Ôn tập kiến thức chất lượng cao bám sát chương trình học và thi.';
              const icon = getCardIcon(index, config.theme);
              const mascot = mascots[index] || pickRandom(config.theme === 'teal' ? TEAL_MASCOTS : BANHMI_MASCOTS);

              const handleAction = () => {
                // Determine legacy subview based on index or name
                const subView = type === 'practice' 
                  ? (index === 0 ? 'topic' : 'type')
                  : (index === 0 ? 'school' : 'custom');

                // Navigate to roadmap, with the category ID!
                navigateTo('roadmap', null, type, subView, sub.id);
              };

              return (
                <div
                  key={sub.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleAction}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAction(); }}
                  className={`group relative w-full ${cardHeightStyle} bg-gradient-to-br ${cardStyle} border-2 rounded-[24px] md:rounded-[1.5vw] ${cardPaddingStyle} text-left flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer select-none outline-none`}
                >
                  {/* Top text block */}
                  <div className="space-y-2 md:space-y-[0.8vh] relative z-10 pr-8 md:pr-[2vh]">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 md:p-[0.5vh] rounded-lg md:rounded-[0.5vh] ${config.theme === 'teal' ? 'bg-[#006b58]/10 dark:bg-emerald-500/20' : 'bg-[#8c3315]/10 dark:bg-[var(--primary)]/20'} shrink-0`}>
                        {icon}
                      </div>
                      <h3 className="text-lg md:text-[clamp(1.2rem,2.4vh,2rem)] font-black leading-tight">
                        {sub.name}
                      </h3>
                    </div>
                    <p className="text-xs md:text-[clamp(0.75rem,1.6vh,1.1rem)] font-semibold text-[#57423b] dark:text-[var(--text-secondary)] leading-relaxed max-w-[85%] mt-1">
                      {description}
                    </p>
                  </div>

                  {/* Centered mascot image below */}
                  <div className="flex justify-center items-end flex-1 pt-1 pb-0 relative z-10 min-h-0">
                    <img 
                      src={mascot} 
                      alt="Mascot" 
                      className={`${mascotHeightStyle} w-auto object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300`}
                    />
                  </div>

                  {/* Action indicator at top-right */}
                  <div className={`absolute top-6 right-6 md:top-[clamp(1.5rem,2.2vh,2.5rem)] md:right-[clamp(1.5rem,2.2vh,2.5rem)] w-8 h-8 md:w-[clamp(32px,3.2vh,48px)] md:h-[clamp(32px,3.2vh,48px)] rounded-full bg-white dark:bg-[var(--surface)] border ${config.theme === 'teal' ? 'border-[#006b58]/20 dark:border-emerald-500/20 text-[#006b58] dark:text-emerald-400 group-hover:bg-[#006b58] dark:group-hover:bg-emerald-600' : 'border-[#dfc0b7]/80 dark:border-[var(--border-color)] text-[#8c3315] dark:text-[var(--primary)] group-hover:bg-[#8c3315] dark:group-hover:bg-[var(--primary)]'} flex items-center justify-center shadow-sm z-10 group-hover:text-white transition-colors duration-300`}>
                    <ArrowRight className="w-4 h-4 md:w-[clamp(16px,1.6vh,24px)] md:h-[clamp(16px,1.6vh,24px)] stroke-[2.5]" />
                  </div>

                  {/* Glow backdrop */}
                  <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/40 rounded-full blur-2xl pointer-events-none" />
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
