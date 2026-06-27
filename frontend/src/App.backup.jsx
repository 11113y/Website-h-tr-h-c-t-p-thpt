import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, Trophy, Flag, User, LogIn, Compass, ChevronRight, 
  CheckCircle2, XCircle, AlertCircle, Calendar, ArrowUpRight, 
  HelpCircle, Activity, Sparkles, Menu, X, Play, Check, RotateCcw, 
  FileText, BookMarked, Users, Flame, Target, Star, Bookmark, GraduationCap, ChevronLeft,
  Clock, Globe
} from 'lucide-react';

/* ==========================================================================
   SVG Mascot Renderers - Creating Premium 3D-feel Illustrations
   ========================================================================== */

// 1. Mr. Peak - Friendly Light Teal Cube Mascot (#45D0B1)
const TealCubeMascot = ({ className = "w-32 h-32", pose = "happy" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#81edd4" />
        <stop offset="100%" stopColor="#30b498" />
      </linearGradient>
      <linearGradient id="tealShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e8a72" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#12594a" stopOpacity="0" />
      </linearGradient>
      <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#45D0B1" floodOpacity="0.25" />
      </filter>
    </defs>
    
    {/* Ambient shadow beneath */}
    <ellipse cx="100" cy="175" rx="60" ry="12" fill="url(#tealShadow)" opacity="0.4" />
    
    {/* Main Cube Body with Rounded Corners */}
    <rect x="35" y="35" width="130" height="130" rx="36" fill="url(#tealGrad)" filter="url(#softGlow)" />
    
    {/* Inner shadow for 3D depth */}
    <rect x="42" y="42" width="116" height="116" rx="28" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.35" />
    
    {/* Signature Round Black Glasses */}
    <g id="glasses">
      <circle cx="75" cy="95" r="24" fill="none" stroke="#241916" strokeWidth="7" />
      <circle cx="125" cy="95" r="24" fill="none" stroke="#241916" strokeWidth="7" />
      <line x1="99" y1="92" x2="101" y2="92" stroke="#241916" strokeWidth="7" strokeLinecap="round" />
      {/* Glare on glasses */}
      <path d="M 67 80 A 15 15 0 0 1 83 80" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M 117 80 A 15 15 0 0 1 133 80" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Big happy eyes / crescent winks */}
    {pose === "happy" ? (
      <g stroke="#241916" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M 65 95 Q 75 87 85 95" />
        <path d="M 115 95 Q 125 87 135 95" />
      </g>
    ) : (
      <g fill="#241916">
        <circle cx="75" cy="95" r="8" />
        <circle cx="125" cy="95" r="8" />
        <circle cx="72" cy="92" r="3" fill="#ffffff" />
        <circle cx="122" cy="92" r="3" fill="#ffffff" />
      </g>
    )}

    {/* Warm happy smile */}
    <path d="M 85 130 Q 100 148 115 130" fill="none" stroke="#241916" strokeWidth="7" strokeLinecap="round" />
    
    {/* Hands / Poses */}
    {pose === "thumbs_up" && (
      <g transform="translate(145, 105)" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))">
        {/* Thumbs up arm */}
        <path d="M -15 20 Q 5 20 15 0" fill="none" stroke="url(#tealGrad)" strokeWidth="24" strokeLinecap="round" />
        <circle cx="15" cy="0" r="16" fill="url(#tealGrad)" />
        <path d="M 15 -12 Q 22 -12 22 -6" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      </g>
    )}
  </svg>
);

// 2. Cheese Cube Mascot - Yellow perfect Swiss cheese cube (#FFD043)
const CheeseCubeMascot = ({ className = "w-32 h-32", pose = "happy" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cheeseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffe675" />
        <stop offset="100%" stopColor="#ffd043" />
      </linearGradient>
      <linearGradient id="cheeseShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#bfa00f" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7a6703" stopOpacity="0" />
      </linearGradient>
      <filter id="cheeseGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#ffd043" floodOpacity="0.35" />
      </filter>
    </defs>
    
    {/* Base Shadow */}
    <ellipse cx="100" cy="175" rx="60" ry="12" fill="url(#cheeseShadow)" opacity="0.4" />
    
    {/* Swiss Cheese Perfect Cube */}
    <rect x="35" y="35" width="130" height="130" rx="20" fill="url(#cheeseGrad)" filter="url(#cheeseGlow)" stroke="#ffd043" strokeWidth="2" />
    
    {/* Swiss Cheese Holes */}
    <g fill="#e6b81c" opacity="0.75">
      <circle cx="50" cy="55" r="10" />
      <circle cx="140" cy="65" r="14" />
      <circle cx="55" cy="140" r="12" />
      <circle cx="145" cy="130" r="8" />
      <circle cx="100" cy="45" r="7" />
    </g>

    {/* Round Black Glasses */}
    <g id="cheese-glasses">
      <circle cx="75" cy="95" r="24" fill="none" stroke="#241916" strokeWidth="7" />
      <circle cx="125" cy="95" r="24" fill="none" stroke="#241916" strokeWidth="7" />
      <line x1="99" y1="92" x2="101" y2="92" stroke="#241916" strokeWidth="7" strokeLinecap="round" />
      {/* Glare */}
      <path d="M 67 80 A 15 15 0 0 1 83 80" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M 117 80 A 15 15 0 0 1 133 80" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </g>

    {/* Eyes */}
    {pose === "joyful" ? (
      <g stroke="#241916" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M 65 95 Q 75 87 85 95" />
        <path d="M 115 95 Q 125 87 135 95" />
      </g>
    ) : (
      <g fill="#241916">
        <circle cx="75" cy="95" r="8" />
        <circle cx="125" cy="95" r="8" />
        <circle cx="72" cy="92" r="3" fill="#ffffff" />
        <circle cx="122" cy="92" r="3" fill="#ffffff" />
      </g>
    )}

    {/* Happy Smile */}
    <path d="M 82 128 Q 100 148 118 128" fill="none" stroke="#241916" strokeWidth="7" strokeLinecap="round" />

    {/* Arms celebrating (jumping for joy) */}
    {pose === "joyful" && (
      <g stroke="#ffd043" strokeWidth="16" strokeLinecap="round" fill="none">
        <path d="M 35 110 Q 15 80 15 60" />
        <path d="M 165 110 Q 185 80 185 60" stroke="#ffd043" />
      </g>
    )}
  </svg>
);

// 3. Vietnamese Banh Mi Baguette Mascot - Golden-brown (#B36E2A)
const BanhMiMascot = ({ className = "w-32 h-32", pose = "climbing" }) => (
  <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="baguetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e5a65e" />
        <stop offset="60%" stopColor="#c67d30" />
        <stop offset="100%" stopColor="#9a5716" />
      </linearGradient>
      <linearGradient id="crustShadow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#542b03" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#2e1701" stopOpacity="0" />
      </linearGradient>
      <filter id="banhMiGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#c67d30" floodOpacity="0.3" />
      </filter>
    </defs>
    
    {/* Base Shadow */}
    <ellipse cx="100" cy="180" rx="55" ry="10" fill="url(#crustShadow)" opacity="0.4" />
    
    {/* Cylindrical rounded Baguette Body */}
    <rect x="55" y="25" width="90" height="145" rx="45" fill="url(#baguetteGrad)" filter="url(#banhMiGlow)" />
    
    {/* Crust scoring marks (slashes) */}
    <path d="M 75 55 Q 100 65 125 55" fill="none" stroke="#fed8ad" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    <path d="M 72 90 Q 100 100 128 90" fill="none" stroke="#fed8ad" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    <path d="M 75 125 Q 100 135 125 125" fill="none" stroke="#fed8ad" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    
    {/* Black Glasses */}
    <g id="bm-glasses">
      <circle cx="85" cy="85" r="18" fill="none" stroke="#241916" strokeWidth="5.5" />
      <circle cx="115" cy="85" r="18" fill="none" stroke="#241916" strokeWidth="5.5" />
      <line x1="101" y1="83" x2="103" y2="83" stroke="#241916" strokeWidth="5.5" strokeLinecap="round" />
      {/* Glare */}
      <path d="M 79 74 A 12 12 0 0 1 91 74" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 109 74 A 12 12 0 0 1 121 74" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Eyes */}
    <g fill="#241916">
      <circle cx="85" cy="85" r="6" />
      <circle cx="115" cy="85" r="6" />
      <circle cx="83" cy="83" r="2.2" fill="#ffffff" />
      <circle cx="113" cy="83" r="2.2" fill="#ffffff" />
    </g>
    
    {/* Big smile */}
    <path d="M 92 110 Q 100 122 108 110" fill="none" stroke="#241916" strokeWidth="5.5" strokeLinecap="round" />

    {/* Triumphed pose / Climbing pose */}
    {pose === "climbing" && (
      <g stroke="#c67d30" strokeWidth="12" strokeLinecap="round" fill="none">
        {/* Climbing arm */}
        <path d="M 55 110 Q 30 90 35 70" />
        <path d="M 145 110 Q 170 120 165 95" />
      </g>
    )}
  </svg>
);


/* ==========================================================================
   Static / Mock Data for Quizzes, Roadmap, Blog & Leaderboard
   ========================================================================== */

const ROADMAP_STATIONS = [
  { id: 'station-1', name: 'Trạm Base Camp: Nhập môn Số học', desc: 'Làm quen với các phép toán cơ bản và quy luật số học.', altitude: '500m', progress: 100, completed: true },
  { id: 'station-2', name: 'Vực thẳm Đại số: Đơn thức & Đa thức', desc: 'Rút gọn biểu thức phức tạp, phương trình bậc nhất.', altitude: '1,500m', progress: 75, completed: false, isCurrent: true },
  { id: 'station-3', name: 'Đèo Hình học: Hệ thức lượng & Góc', desc: 'Chinh phục các định lý tam giác, lượng giác căn bản.', altitude: '3,200m', progress: 0, completed: false },
  { id: 'station-4', name: 'Vách đá Giải tích: Đạo hàm & Giới hạn', desc: 'Tiệm cận độ dốc toán học tối đa của đỉnh Peak.', altitude: '5,000m', progress: 0, completed: false },
  { id: 'station-5', name: 'ĐỈNH PEAK: Chuyên đề Tích phân & Tổng hợp', desc: 'Thử thách cuối cùng để cắm cờ chiến thắng Everest toán học.', altitude: '8,848m', progress: 0, completed: false }
];

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Cho biểu thức đại số A = (3x² - 2x + 5) - (2x² + x - 3). Rút gọn biểu thức A ta được kết quả nào dưới đây?",
    options: [
      "A = x² - 3x + 8",
      "A = x² - x + 2",
      "A = 5x² - x + 8",
      "A = x² - 3x + 2"
    ],
    answer: 0,
    explanation: "Ta thực hiện mở ngoặc và đổi dấu: A = 3x² - 2x + 5 - 2x² - x + 3. Gom các hạng tử đồng dạng: (3x² - 2x²) + (-2x - x) + (5 + 3) = x² - 3x + 8. Do đó đáp án A là chính xác."
  },
  {
    id: 2,
    question: "Giải phương trình đại số sau để tìm x: 2(x - 3) + 5 = 3(x + 1) - 4x. Giá trị x là bao nhiêu?",
    options: [
      "x = 1/2",
      "x = 4/3",
      "x = 2",
      "x = -1"
    ],
    answer: 1,
    explanation: "Ta biến đổi phương trình: 2x - 6 + 5 = 3x + 3 - 4x => 2x - 1 = -x + 3 => 3x = 4 => x = 4/3. Do đó đáp án chính xác là B."
  },
  {
    id: 3,
    question: "Cho hàm số y = f(x) có bảng biến thiên như sau: Hàm số đã cho đồng biến trên khoảng nào dưới đây?",
    options: [
      "(-3; 3)",
      "(-3; 0)",
      "(0; 3)",
      "(-∞; -3)"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJZKiuSaV2PMnJF2kPUflABA3wPu1mE0BeURUu5sIKdAU9N3JenYZ2T6uYhrHVnsKZs9k08n2EYuCzDUJwQZ8Bm9VxPQ7icR8MWYckvHLc_URu-R5EdMZqZE6bYtfX2E0k9tDuCcXLH4MtjAUodJOpYGlZ_3I2MZ4K9Fz0K7Hz9Ck3bmEOO4rSpeD6xyx8CrUo585teqEQBGrkQG2DRUCY-N0XngEvf5SiNwAsgig9B6Xfp_CPn6AtmmSQH692L6hMmi1thXVaMf4",
    answer: 1,
    explanation: "Dựa vào bảng biến thiên của hàm số y = f(x), ta thấy trên khoảng (-3; 0), mũi tên của f(x) đi lên (hoặc f'(x) mang dấu dương). Do đó hàm số đồng biến trên khoảng (-3; 0). Đáp án chính xác là B."
  },
  {
    id: 4,
    question: "Tìm giá trị lớn nhất của hàm số f(x) = x³ - 3x + 2 trên đoạn [0; 2].",
    options: [
      "4",
      "2"
    ],
    answer: 0,
    explanation: "Ta tính đạo hàm: f'(x) = 3x² - 3. Cho f'(x) = 0 => x = ±1. Vì x thuộc [0; 2] nên ta chọn x = 1. Ta tính các giá trị biên: f(0) = 2, f(1) = 0, f(2) = 8 - 6 + 2 = 4. Do đó giá trị lớn nhất trên đoạn [0; 2] là 4. Đáp án đúng là A."
  }
];

const BLOG_POSTS = [
  {
    id: 'post-1',
    title: 'Mẹo nhớ nhanh công thức lượng giác khó nhằn bằng thơ',
    category: 'Hình học',
    color: 'mint',
    date: '20/05/2026',
    author: 'Thầy Toán Peak',
    desc: 'Lượng giác luôn là nỗi sợ của nhiều học sinh lớp 10, 11. Cùng khám phá bí kíp ghi nhớ thông qua các bài thơ siêu thú vị...',
    views: '1.2k',
    readTime: '5 phút'
  },
  {
    id: 'post-2',
    title: 'Phân tích cấu trúc đề thi THPT Quốc Gia môn Toán mới nhất',
    category: 'Tài liệu ôn thi',
    color: 'pink',
    date: '18/05/2026',
    author: 'Cô Minh Thư',
    desc: 'Bản phân tích chi tiết ma trận đề thi toán chính thức, các chủ đề trọng tâm dễ lấy điểm và các dạng bài nâng cao phân hóa học sinh.',
    views: '3.5k',
    readTime: '8 phút'
  },
  {
    id: 'post-3',
    title: 'Bánh Mì & Cheese Cube Mascot: Hành trình số hóa Toán học',
    category: 'Sự kiện',
    color: 'blue',
    date: '15/05/2026',
    author: 'Quizz Test Team',
    desc: 'Tại sao lại là Bánh mì và Khối Phô mai? Cùng tìm hiểu câu chuyện đằng sau những mascot 3D đáng yêu của nền tảng Quizz Test.',
    views: '840',
    readTime: '3 phút'
  },
  {
    id: 'post-4',
    title: 'Làm chủ chuyên đề Đạo hàm chỉ trong 3 tiếng tự học',
    category: 'Giải tích',
    color: 'orange',
    date: '10/05/2026',
    author: 'Bách Khoa Master',
    desc: 'Phương pháp tự học có hệ thống giúp bạn hiểu bản chất đạo hàm, ứng dụng vật lý và giải quyết nhanh các bài tập trắc nghiệm.',
    views: '2.1k',
    readTime: '10 phút'
  }
];

const LEADERBOARD_USERS = [
  { rank: 1, name: 'Nguyễn Đăng Khoa', points: 9850, level: 'Cao thủ Tích phân', avatarColor: 'bg-orange-500', climbPct: 98 },
  { rank: 2, name: 'Trần Minh Tú', points: 9240, level: 'Chiến thần Đại số', avatarColor: 'bg-teal-500', climbPct: 92 },
  { rank: 3, name: 'Phạm Lê Hoài Nam', points: 8900, level: 'Kiện tướng Hình học', avatarColor: 'bg-indigo-500', climbPct: 89 },
  { rank: 4, name: 'Vũ Quốc Pháp', points: 8750, level: 'Nhà leo núi Triển vọng', avatarColor: 'bg-pink-500', climbPct: 87 },
  { rank: 5, name: 'Lê Thanh Vy', points: 8120, level: 'Thợ săn Điểm số', avatarColor: 'bg-purple-500', climbPct: 81 }
];


/* ==========================================================================
   Main App Component
   ========================================================================== */

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // States for interactive Quiz - Stacked Exam Mode
  const [selectedAnswers, setSelectedAnswers] = useState({ 0: null, 1: null, 2: null, 3: null });
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(2973); // 49 minutes 33 seconds
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  
  // Learning states
  const [streak, setStreak] = useState(7);
  const [totalPoints, setTotalPoints] = useState(3850);
  const [currentRank, setCurrentRank] = useState(4);
  
  // Login states
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName, setUserName] = useState('Minh Quân');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Live Timer Countdown Effect
  useEffect(() => {
    if (activeTab !== 'practice' || quizFinished || !timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleQuizSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab, quizFinished, timerActive]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle navigation click helper
  const navigateTo = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start a new Quiz session in Exam Mode
  const startQuiz = () => {
    setSelectedAnswers({ 0: null, 1: null, 2: null, 3: null });
    setQuizFinished(false);
    setShowAnswerFeedback(false);
    setCorrectAnswersCount(0);
    setUserAnswers([]);
    setTimeLeft(2973); // Reset to 49:33
    setTimerActive(true);
    setActiveQuestionIdx(0);
    setActiveTab('practice');
  };

  // Handle Exam Submission
  const handleQuizSubmit = () => {
    let correctCount = 0;
    const answersList = [];
    QUIZ_QUESTIONS.forEach((q, idx) => {
      const selected = selectedAnswers[idx];
      const isCorrect = selected === q.answer;
      if (isCorrect) {
        correctCount += 1;
      }
      answersList.push({
        questionId: q.id,
        selected: selected,
        isCorrect: isCorrect
      });
    });
    setUserAnswers(answersList);
    setQuizFinished(true);
    setTimerActive(false);
    setShowAnswerFeedback(true);
    setTotalPoints(prev => prev + (correctCount * 100) + 100);
    navigateTo('result');
  };

  // Fake login handler
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    navigateTo('home');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      
      {/* ==========================================================================
         Header Navigation - "Base Camp Navigation"
         ========================================================================== */}
      {activeTab !== 'practice' ? (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 backdrop-blur-md transition-all">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
            
            {/* Left: Hamburger & Logo Brand Area (100% Stitch Style) */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                className="p-1.5 text-gray-500 hover:text-[#8c3315] hover:bg-gray-100 rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
                <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 5L35 32H5L20 5Z" fill="#14b8a6" />
                  <path d="M20 5L28 32H12L20 5Z" fill="#0f9f8f" />
                  <path d="M22 16L17 23L19 25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 28C22 28 30 22 32 15" stroke="#ff7d54" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="text-left hidden sm:block">
                  <h1 className="text-base font-black text-[#8c3315] tracking-tight leading-none">Quizz Test</h1>
                  <p className="text-[8px] text-[#57423b]/65 font-bold leading-none mt-0.5">Hệ thống ôn luyện và thi thử THPT Quốc gia</p>
                </div>
              </div>
            </div>

            {/* Center: Search Bar (100% Match with Image) */}
            <div className="hidden md:flex items-center gap-2 bg-[#fdf2ee] rounded-full border border-transparent px-4 py-2 w-72 lg:w-96 focus-within:bg-white focus-within:border-[#8c3315]/20 focus-within:shadow-md transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input 
                type="text" 
                placeholder="Tìm kiếm đề thi, môn học..." 
                className="bg-transparent border-none outline-none text-xs w-full font-bold text-[#57423b] placeholder-[#8b716a]"
              />
            </div>

            {/* Right: Notifications & Profile Pill (100% Match with Image) */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Bell Notification Icon */}
              <button className="relative p-2 text-gray-600 hover:text-[#8c3315] hover:bg-[#fbf1ee] rounded-full transition-all">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {/* Small red circle dot at the top right of the bell icon */}
                <div className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 border border-white" />
              </button>

              {isLoggedIn ? (
                <button 
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-3 bg-[#fdf2ee] hover:bg-[#fce5dd] rounded-full py-1 pl-1 pr-4 transition-all duration-200"
                >
                  {/* Premium Styled Mascot/Avatar inside the pill */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#dfc0b7] bg-white flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="50" fill="#fde5dd" />
                      <circle cx="50" cy="40" r="22" fill="#57423b" />
                      <circle cx="50" cy="44" r="18" fill="#ffe2d9" />
                      <circle cx="50" cy="40" r="22" fill="none" stroke="#57423b" strokeWidth="3" />
                      <path d="M 33 32 Q 50 20 67 32 Q 50 26 33 32" fill="#57423b" />
                      <circle cx="42" cy="44" r="6" fill="none" stroke="#241916" strokeWidth="2" />
                      <circle cx="58" cy="44" r="6" fill="none" stroke="#241916" strokeWidth="2" />
                      <line x1="48" y1="44" x2="52" y2="44" stroke="#241916" strokeWidth="2" />
                      <circle cx="42" cy="44" r="1.5" fill="#241916" />
                      <circle cx="58" cy="44" r="1.5" fill="#241916" />
                      <path d="M 46 52 Q 50 55 54 52" fill="none" stroke="#241916" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 25 85 C 25 70 35 64 50 64 C 65 64 75 70 75 85 Z" fill="#8c3315" />
                      <path d="M 50 64 L 50 74" stroke="#ffe2d9" strokeWidth="4" />
                      <path d="M 43 74 L 50 82 L 57 74" fill="#ffffff" />
                    </svg>
                  </div>
                  <span className="font-extrabold text-xs text-[#8c3315]">{userName}</span>
                </button>
              ) : (
                <button 
                  onClick={() => navigateTo('login')}
                  className="flex items-center gap-2 bg-[#8c3315] text-white hover:bg-[#72270e] font-extrabold text-xs px-4 py-2 rounded-full shadow-sm transition-all"
                >
                  <LogIn size={13} />
                  Đăng nhập
                </button>
              )}
            </div>

          </div>
          
          {/* Sleek Sub-Header Tab Navigation Bar */}
          <div className="w-full bg-[#fbf1ee]/45 border-t border-b border-[#dfc0b7]/30 py-2.5 transition-all">
            <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
              <nav className="flex items-center gap-1.5">
                {[
                  { id: 'home', label: 'Bàn Học', icon: BookOpen },
                  { id: 'roadmap', label: 'Lộ Trình Leo Núi', icon: Compass },
                  { id: 'blog', label: 'Blog & Tài Liệu', icon: FileText },
                  { id: 'leaderboard', label: 'Himalaya Rank', icon: Trophy }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id || (tab.id === 'practice' && activeTab === 'result');
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigateTo(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-xs transition-all duration-150 ${
                        isActive 
                          ? 'bg-[#8c3315] text-white shadow-sm' 
                          : 'text-[#8c3315]/80 hover:bg-[#8c3315]/10 hover:text-[#8c3315]'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
              {isLoggedIn && (
                <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-[#8c3315]/80">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-orange-600 font-extrabold">
                    <Flame size={12} className="fill-orange-500 stroke-none" />
                    <span>{streak} ngày liên tiếp</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 font-extrabold">
                    <Target size={12} />
                    <span>{totalPoints} điểm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      ) : (
        /* ==========================================================================
           EXAM ROOM HEADER - Stitch Updated Screen
           ========================================================================== */
        <header className="sticky top-0 z-50 w-full bg-[#ff7d54] text-white py-3 px-6 shadow-lg">
          <div className="max-w-[1200px] mx-auto flex justify-between items-center">
            
            {/* Candidate & Exam Info */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base leading-tight">Vũ Quốc Pháp</span>
                <span className="text-[11px] font-bold opacity-90 uppercase mt-0.5">SBD: 01202688</span>
              </div>
              <div className="h-8 w-px bg-white/20 hidden md:block"></div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider leading-none">Môn thi</span>
                <span className="font-extrabold text-xs mt-1">TOÁN HỌC - LỘ TRÌNH LEO NÚI MATH PEAK</span>
              </div>
            </div>

            {/* Timer & Primary Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full border border-white/20">
                <Clock size={16} className="animate-pulse" />
                <span className="font-black text-xl tracking-tight leading-none">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert("Đã lưu trạng thái bài làm hiện tại của bạn!")}
                  className="bg-white text-[#ff7d54] px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase text-xs shadow-sm"
                >
                  Lưu
                </button>
                <button 
                  onClick={handleQuizSubmit}
                  className="bg-[#241916] text-white px-5 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all uppercase text-xs shadow-md border border-white/10"
                >
                  Nộp bài
                </button>
              </div>
            </div>

          </div>
        </header>
      )}


      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 inset-0 z-40 bg-white border-t border-[#dfc0b7] flex flex-col p-6 gap-4 animate-fade-in">
          {[
            { id: 'home', label: 'Bàn Học', icon: BookOpen },
            { id: 'roadmap', label: 'Lộ Trình Leo Núi', icon: Compass },
            { id: 'blog', label: 'Blog & Tài Liệu', icon: FileText },
            { id: 'leaderboard', label: 'Himalaya Rank', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#ff7d54] text-white shadow-md' 
                    : 'text-[#57423b] hover:bg-[#fff8f6] hover:text-[#ff7d54]'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
          <hr className="border-[#dfc0b7] my-2" />
          {isLoggedIn ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <span className="text-sm font-bold text-orange-600 flex items-center gap-2">
                  <Flame size={16} className="fill-orange-500 stroke-none" /> Lửa học tập
                </span>
                <span className="font-extrabold text-orange-700">{streak} ngày</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-xl">
                <span className="text-sm font-bold text-[#006b58] flex items-center gap-2">
                  <Target size={16} /> Điểm tích lũy
                </span>
                <span className="font-extrabold text-[#006b58]">{totalPoints} Pts</span>
              </div>
              <button 
                onClick={() => navigateTo('profile')}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-[#241916]"
              >
                <User size={20} />
                Trang cá nhân
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigateTo('login')}
              className="w-full btn-premium py-3 rounded-2xl text-lg flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Đăng nhập tài khoản
            </button>
          )}
        </div>
      )}

      {/* ==========================================================================
         Main Workspace Pages Area
         ========================================================================== */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 pt-12 pb-16">
        
        {/* ==========================================================================
           PAGE: Tab Home (Bàn Học)
           ========================================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-16">
            
            {/* HERO SECTION */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 pt-4">
              {/* Hero Left */}
              <div className="flex-1 text-left space-y-6 max-w-xl">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#241916] leading-[1.15] tracking-tight">
                  Chinh phục đỉnh cao <br />
                  <span className="font-serif italic font-bold text-[#8c3315] pr-1" style={{ fontFamily: "'Playfair Display', serif" }}>Toán học</span> cùng Quizz <br />
                  Test! ⛰️
                </h2>
                <p className="text-base md:text-lg text-[#57423b] font-medium leading-relaxed">
                  Nền tảng luyện thi hàng đầu với kho đề phong phú, bám sát cấu trúc đề thi THPT Quốc gia. Học tập vui vẻ, tiến bộ mỗi ngày!
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button onClick={startQuiz} className="bg-[#8c3315] text-white hover:bg-[#72270e] font-extrabold text-sm px-8 py-3.5 rounded-full shadow-md transition-all cursor-pointer">
                    Bắt đầu ngay
                  </button>
                  <button onClick={() => navigateTo('roadmap')} className="bg-white text-[#8c3315] border border-[#8c3315] hover:bg-[#8c3315]/5 font-extrabold text-sm px-8 py-3.5 rounded-full transition-all cursor-pointer">
                    Xem lộ trình
                  </button>
                </div>
              </div>

              {/* Hero Right: 3D map/card sitting on top of soft peach circle blob */}
              <div className="flex-1 flex justify-center items-center relative">
                {/* Soft Peach Circle Blob background */}
                <div className="absolute w-[320px] h-[320px] md:w-[380px] md:h-[380px] bg-[#fdf2ee] rounded-full -z-10 blur-2xl opacity-90" />
                
                {/* 3D-styled card */}
                <div className="w-[300px] h-[300px] md:w-[340px] md:h-[340px] bg-[#fbf9f6] rounded-[48px] border border-[#dfc0b7]/50 shadow-2xl flex items-center justify-center p-8 relative overflow-hidden animate-float">
                  {/* Inner 3D card layout mimicking the map or mock card in the image */}
                  <div className="w-full h-full bg-[#f6f3ef] rounded-[36px] border border-white flex flex-col items-center justify-center p-6 relative shadow-inner">
                    {/* Minimal coordinate or center blue marker */}
                    <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center shadow-md animate-pulse">
                      <div className="w-2.5 h-2.5 rounded bg-sky-500" />
                    </div>
                    {/* Small abstract line grid */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION: Luyện tập theo sở thích */}
            <div className="space-y-8 pt-8">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold text-[#241916]">Luyện tập theo sở thích</h3>
                  <p className="text-sm text-[#8b716a] font-semibold">Chọn môn học và khối lớp để bắt đầu hành trình của bạn.</p>
                </div>
                {/* Filter Pills container in image style */}
                <div className="inline-flex items-center gap-1.5 bg-[#f0ded8] border border-[#dfc0b7] p-1 rounded-full self-start md:self-auto shrink-0 shadow-md">
                  <button className="bg-[#006b58] text-white font-black text-xs px-5 py-2.5 rounded-full shadow-md cursor-pointer hover:bg-[#005142] transition-colors">
                    Lớp 12
                  </button>
                  <button onClick={() => alert("Lớp 11 đang được cập nhật!")} className="text-[#8c3315] hover:bg-[#8c3315]/10 font-extrabold text-xs px-4 py-2 rounded-full cursor-pointer transition-all duration-200">
                    Lớp 11 (Sắp có)
                  </button>
                  <button onClick={() => alert("Lớp 10 đang được cập nhật!")} className="text-[#8c3315] hover:bg-[#8c3315]/10 font-extrabold text-xs px-4 py-2 rounded-full cursor-pointer transition-all duration-200">
                    Lớp 10 (Sắp có)
                  </button>
                </div>
              </div>

              {/* Two Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Card: Luyện Đề */}
                <div className="bg-[#fef9f7] border-2 border-[#dfc0b7] rounded-[32px] p-8 text-left space-y-6 relative hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                  <span className="absolute top-6 right-6 px-4 py-1.5 bg-[#fce5dd] text-[#8c3315] font-black text-xs rounded-full border border-[#f5cfc4]">
                    500+ Đề thi
                  </span>
                  <div className="w-14 h-14 bg-[#8c3315] rounded-2xl flex items-center justify-center text-white shadow-md">
                    <FileText size={28} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-extrabold text-[#241916]">Luyện đề</h4>
                    <p className="text-sm font-semibold text-[#57423b] leading-relaxed">
                      Tổng hợp các bộ đề thi thử THPT Quốc gia mới nhất từ các trường chuyên trên cả nước.
                    </p>
                  </div>
                  <button onClick={startQuiz} className="inline-flex items-center gap-2 text-base font-extrabold text-[#8c3315] hover:text-[#72270e] transition-colors pt-2 cursor-pointer">
                    Bắt đầu luyện <span className="text-lg">→</span>
                  </button>
                </div>

                {/* Right Card: Luyện Theo Chuyên Đề */}
                <div className="bg-[#f3faf8] border-2 border-[#006b58] rounded-[32px] p-8 text-left space-y-6 relative hover:scale-[1.01] hover:shadow-xl transition-all duration-300">
                  <span className="absolute top-6 right-6 px-4 py-1.5 bg-[#dcfce7] text-[#006b58] font-black text-xs rounded-full border border-[#bbf7d0]">
                    12 Chuyên đề
                  </span>
                  <div className="w-14 h-14 bg-[#006b58] rounded-2xl flex items-center justify-center text-white shadow-md">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <circle cx="6" cy="6" r="3" />
                      <path d="M6 9v6" />
                      <path d="M9 6h6" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-extrabold text-[#006b58]">Luyện theo chuyên đề</h4>
                    <p className="text-sm font-semibold text-[#57423b] leading-relaxed">
                      Tập trung ôn luyện từng mảng kiến thức: Giải tích, Hình học, Xác suất...
                    </p>
                  </div>
                  <button onClick={startQuiz} className="inline-flex items-center gap-2 text-base font-extrabold text-[#006b58] hover:text-[#005142] transition-colors pt-2 cursor-pointer">
                    Chọn chuyên đề <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* STATS BAR: Three horizontal metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {/* Stat 1 */}
              <div className="bg-[#fcf5f2] border border-[#dfc0b7]/50 rounded-3xl p-6 flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-[#fce5dd] border border-[#dfc0b7]/50 flex items-center justify-center text-[#ff7d54]">
                  <Target size={22} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black text-[#241916] leading-none">5,000+</div>
                  <div className="text-xs font-bold text-[#8b716a] mt-1.5">Đề thi chất lượng</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-[#fcf5f2] border border-[#dfc0b7]/50 rounded-3xl p-6 flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-[#dcfce7] border border-[#bbf7d0]/50 flex items-center justify-center text-[#006b58]">
                  <Sparkles size={22} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black text-[#241916] leading-none">1.2M+</div>
                  <div className="text-xs font-bold text-[#8b716a] mt-1.5">Lượt thi mỗi tháng</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-[#fcf5f2] border border-[#dfc0b7]/50 rounded-3xl p-6 flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-[#e0e7ff] border border-[#c7d2fe]/50 flex items-center justify-center text-[#6366f1]">
                  <Users size={22} className="stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-black text-[#241916] leading-none">55,000+</div>
                  <div className="text-xs font-bold text-[#8b716a] mt-1.5">Thành viên tích cực</div>
                </div>
              </div>
            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Roadmap (Lộ Trình Leo Núi)
           ========================================================================== */}
        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            
            {/* Page Title Header */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-[#241916]">Lộ trình leo núi Math Peak</h2>
              <p className="text-sm font-medium text-[#57423b]">
                Hành trình chinh phục đỉnh cao Toán học được thiết kế như một cuộc thám hiểm Himalaya. Vượt qua mỗi trạm để tích điểm và mở khóa các ải tiếp theo.
              </p>
            </div>

            {/* Mountain Climbing Map Layout */}
            <div className="card-premium bg-gradient-to-b from-[#fff8f6] to-[#ffe9e3] p-8 md:p-12 min-h-[600px] relative">
              
              {/* Climbing Path Rope Line */}
              <div className="absolute left-1/2 top-24 bottom-24 w-1 bg-gradient-to-b from-[#ff7d54] via-[#6366f1] to-[#dfc0b7] -translate-x-1/2 hidden md:block border-dashed border-2 border-transparent" style={{ strokeDasharray: '4 4' }} />

              <div className="space-y-12 relative">
                
                {ROADMAP_STATIONS.map((station, index) => {
                  const isEven = index % 2 === 0;
                  const isCurrent = station.isCurrent;
                  
                  return (
                    <div 
                      key={station.id} 
                      className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                        isEven ? 'md:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Space holder for alignment */}
                      <div className="flex-1 hidden md:block" />

                      {/* Station Badge Node (Center) */}
                      <div className="relative z-10 shrink-0">
                        <div className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center shadow-lg transition-all duration-300 ${
                          station.completed 
                            ? 'bg-[#006b58] border-[#74f9d8] text-white' 
                            : isCurrent 
                              ? 'bg-[#ff7d54] border-white text-white animate-pulse ring-4 ring-[#ff7d54]/30'
                              : 'bg-white border-[#dfc0b7] text-[#8b716a]'
                        }`}>
                          {station.completed ? (
                            <CheckCircle2 size={28} />
                          ) : (
                            <span className="font-extrabold text-lg">{index + 1}</span>
                          )}
                        </div>
                        {/* Altitude indicator bubble */}
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 mt-1 bg-indigo-100 border border-indigo-200 text-[#6366f1] font-extrabold text-[9px] px-2 py-0.5 rounded-full text-nowrap shadow-sm">
                          Độ cao: {station.altitude}
                        </div>
                      </div>

                      {/* Station Content Detail Card */}
                      <div className="flex-1 w-full">
                        <div className={`card-premium p-6 text-left border-2 transition-all ${
                          isCurrent 
                            ? 'border-[#ff7d54] shadow-lg transform -translate-y-1' 
                            : 'border-transparent'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="font-extrabold text-lg text-[#241916]">{station.name}</h3>
                            {isCurrent && (
                              <span className="shrink-0 px-2.5 py-0.5 bg-[#ff7d54]/10 rounded text-[#ff7d54] font-extrabold text-[10px] uppercase">
                                Mục tiêu hiện tại
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#57423b] mt-2 leading-relaxed">
                            {station.desc}
                          </p>

                          {/* Action Button for Station */}
                          <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#dfc0b7]/50">
                            {station.completed ? (
                              <div className="flex items-center gap-1 text-xs font-extrabold text-[#006b58]">
                                <Check size={14} /> Ải đã hoàn thành (+500 Pts)
                              </div>
                            ) : isCurrent ? (
                              <button 
                                onClick={startQuiz}
                                className="btn-premium py-1.5 px-4 text-xs flex items-center gap-1.5"
                              >
                                <Play size={12} fill="currentColor" /> Bắt đầu leo ải này
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-[#8b716a] flex items-center gap-1">
                                <XCircle size={12} /> Bị khóa (Vượt ải trước)
                              </span>
                            )}
                            <span className="text-[10px] font-extrabold text-[#8b716a]">Mức độ: {index + 1}/5</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Practice (Phòng Luyện Tập / Quiz Mode)
           ========================================================================== */}
        {/* ==========================================================================
           PAGE: Tab Practice (Phòng Luyện Tập / Quiz Mode)
           ========================================================================== */}
        {activeTab === 'practice' && !quizFinished && (
          <div className="space-y-6">
            
            {/* Question Navigation Strip */}
            <div className="bg-white border-2 border-[#dfc0b7] rounded-3xl p-5 shadow-sm text-left">
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex flex-col shrink-0 text-left">
                  <span className="text-[10px] font-extrabold text-[#8b716a] uppercase tracking-widest leading-none">Tiến độ làm bài</span>
                  <div className="text-base font-black text-[#ff7d54] mt-1.5 leading-none">
                    {Object.values(selectedAnswers).filter(ans => ans !== null).length} / 40 <span className="text-xs font-semibold text-[#8b716a]">Câu đã làm</span>
                  </div>
                </div>
                
                {/* Scrollable Circle Strip */}
                <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-2 py-1 mx-2">
                  {Array.from({ length: 40 }).map((_, idx) => {
                    const qNum = idx + 1;
                    const isCoreQuestion = idx < QUIZ_QUESTIONS.length;
                    const isAnswered = isCoreQuestion && selectedAnswers[idx] !== null;
                    const isActive = isCoreQuestion && activeQuestionIdx === idx;
                    
                    let circleStyle = "bg-white border-[#dfc0b7] text-[#8b716a]";
                    if (isAnswered) {
                      circleStyle = "bg-[#006b58] text-white border-transparent";
                    }
                    if (isActive) {
                      circleStyle = "bg-[#ff7d54] text-white border-[#ff7d54] ring-4 ring-[#ff7d54]/20 scale-110 shadow-sm";
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isCoreQuestion) {
                            setActiveQuestionIdx(idx);
                            document.getElementById(`question-card-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          } else {
                            alert("Các câu hỏi từ 5 - 40 đang được cập nhật thêm trong chuyên đề ôn luyện THPT Quốc Gia!");
                          }
                        }}
                        className={`w-9 h-9 rounded-full border text-xs font-bold flex items-center justify-center transition-all shrink-0 hover:border-[#ff7d54] ${circleStyle}`}
                      >
                        {qNum}
                      </button>
                    );
                  })}
                </div>
                
                {/* Help Trigger */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => alert("Gợi ý từ Mr. Peak: Hãy đọc kỹ bảng biến thiên ở câu 3, lưu ý các khoảng đồng biến (mũi tên hướng lên) và nghịch biến (mũi tên hướng xuống) nhé!")}
                    className="p-2 text-[#8b716a] hover:bg-[#ffe9e3]/50 rounded-full transition-colors"
                    title="Trợ giúp"
                  >
                    <HelpCircle size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Quiz Stacked Questions (left 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Stacked Cards */}
                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, idx) => (
                    <section 
                      key={q.id} 
                      id={`question-card-${idx}`}
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`bg-white rounded-3xl border-2 transition-all p-6 md:p-8 text-left space-y-6 scroll-mt-24 ${
                        activeQuestionIdx === idx 
                          ? 'border-[#ff7d54] shadow-md ring-2 ring-[#ff7d54]/5' 
                          : 'border-[#dfc0b7] hover:border-[#ff7d54]/40 shadow-sm'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-center border-b border-[#dfc0b7]/50 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-[#ff7d54] text-white px-3 py-1 rounded-xl text-xs font-black">
                            Câu {idx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-[#57423b]">
                            {idx === 0 || idx === 1 ? 'Đại số 10' : idx === 2 ? 'Dòng 3 Excel' : 'Giải tích 12'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-extrabold text-[#8b716a] uppercase tracking-wider hidden sm:inline">
                            Chuyên đề: Ôn thi THPT Quốc Gia
                          </span>
                          <button className="text-[#8b716a] hover:text-[#ff7d54] transition-colors">
                            <Bookmark size={14} className="fill-none" />
                          </button>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="space-y-4">
                        <p className="text-base font-extrabold text-[#241916] leading-relaxed">
                          {q.question}
                        </p>

                        {/* Visual mathematical charts / graphics if present */}
                        {q.image ? (
                          <div className="bg-[#fdfdfd] border border-[#dfc0b7]/50 rounded-2xl p-4 flex justify-center shadow-inner">
                            <div className="max-w-md w-full opacity-95">
                              <img 
                                alt="Bảng biến thiên" 
                                className="w-full h-auto mx-auto rounded-xl border border-[#dfc0b7] shadow-sm" 
                                src={q.image}
                              />
                            </div>
                          </div>
                        ) : (
                          idx < 2 && (
                            <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-3 text-center font-mono text-[#ff7d54] text-sm md:text-base font-bold select-none animate-pulse-soft">
                              {idx === 0 ? 'A = (3x² - 2x + 5) - (2x² + x - 3)' : '2(x - 3) + 5 = 3(x + 1) - 4x'}
                            </div>
                          )
                        )}
                      </div>

                      {/* Choice Radio Box Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((option, optIdx) => {
                          const isSelected = selectedAnswers[idx] === optIdx;
                          return (
                            <label key={optIdx} className="relative cursor-pointer group">
                              <input 
                                type="radio" 
                                name={`question-${idx}`} 
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedAnswers(prev => ({ ...prev, [idx]: optIdx }));
                                  setActiveQuestionIdx(idx);
                                }}
                                className="sr-only" 
                              />
                              <div className={`flex items-center p-4 border-2 rounded-2xl transition-all ${
                                isSelected 
                                  ? 'border-[#ff7d54] bg-[#ffe9e3]/30 shadow-sm' 
                                  : 'border-gray-100 group-hover:border-[#ff7d54]/20 bg-white'
                              }`}>
                                <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 font-extrabold text-xs mr-4 transition-all ${
                                  isSelected 
                                    ? 'bg-[#ff7d54] text-white border-[#ff7d54]' 
                                    : 'border-gray-200 text-gray-400'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="font-bold text-sm text-[#241916]">{option}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* Solution helper triggers ONLY after submit if they want to review */}
                      {quizFinished && (
                        <div className="bg-indigo-50/70 border-2 border-dashed border-[#6366f1]/30 rounded-2xl p-5 space-y-3 animate-fade-in">
                          <h4 className="font-extrabold text-sm text-[#6366f1] flex items-center gap-1.5">
                            <HelpCircle size={16} /> Lời giải chi tiết từ Mr. Peak:
                          </h4>
                          <p className="text-xs font-semibold text-[#57423b] leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      )}

                      {/* Clear selected option button */}
                      {selectedAnswers[idx] !== null && (
                        <div className="flex justify-end pt-1">
                          <button 
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [idx]: null }))}
                            className="text-xs font-extrabold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
                          >
                            Xóa lựa chọn
                          </button>
                        </div>
                      )}

                    </section>
                  ))}
                </div>

              </div>

              {/* Quiz Companion info sidebar (right 1 col) */}
              <div className="space-y-6">
                <div className="card-premium p-6 text-center space-y-5 sticky top-24">
                  <h3 className="text-base font-extrabold text-[#241916] uppercase tracking-wide">Cổ động viên leo núi</h3>
                  
                  <div className="relative w-32 h-32 mx-auto animate-float">
                    <TealCubeMascot className="w-full h-full" pose={
                      Object.values(selectedAnswers).filter(ans => ans !== null).length === QUIZ_QUESTIONS.length 
                        ? 'happy' 
                        : 'wave'
                    } />
                  </div>
                  
                  <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 relative text-left">
                    <p className="text-xs font-bold text-[#57423b] leading-relaxed">
                      {Object.values(selectedAnswers).filter(ans => ans !== null).length === 0 
                        ? '"Chào cậu! Hãy bắt đầu giải các câu hỏi trong đề nhé, tớ và Mr. Peak sẽ luôn đồng hành bên cạnh!"'
                        : Object.values(selectedAnswers).filter(ans => ans !== null).length < QUIZ_QUESTIONS.length
                          ? `"Tuyệt vời! Cậu đã làm xong ${Object.values(selectedAnswers).filter(ans => ans !== null).length}/${QUIZ_QUESTIONS.length} câu. Hãy rà soát kỹ nhé!"`
                          : `"Hoàn hảo! Cậu đã làm xong hết rồi đó, hãy rà soát lại thật kỹ trước khi nhấn Nộp bài nha!"`
                      }
                    </p>
                    <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#fff8f6] border-t border-l border-[#dfc0b7] rotate-45" />
                  </div>

                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={handleQuizSubmit}
                      className="w-full btn-premium py-3 text-sm flex items-center justify-center gap-2"
                    >
                      Nộp bài thi <Check size={16} />
                    </button>
                    
                    <div className="flex justify-between items-center text-[10px] font-black text-[#8b716a] uppercase tracking-widest pt-2">
                      <span>Quizz Test</span>
                      <span>Premium Math</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Result (Quiz Result Celebration Page)
           ========================================================================== */}
        {activeTab === 'result' && (
          <div className="max-w-2xl mx-auto space-y-8 relative">
            
            {/* Confetti simulation overlays */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="confetti-piece" style={{ left: '10%', animationDelay: '0s', backgroundColor: '#ff7d54' }} />
              <div className="confetti-piece" style={{ left: '30%', animationDelay: '1.2s', backgroundColor: '#6366f1' }} />
              <div className="confetti-piece" style={{ left: '50%', animationDelay: '0.4s', backgroundColor: '#45d0b1' }} />
              <div className="confetti-piece" style={{ left: '70%', animationDelay: '2s', backgroundColor: '#ffd043' }} />
              <div className="confetti-piece" style={{ left: '90%', animationDelay: '0.8s', backgroundColor: '#ff7d54' }} />
            </div>

            {/* Main Result Card */}
            <div className="card-premium p-10 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff7d54]/5 rounded-full blur-2xl" />
              
              <div className="relative w-48 h-48 mx-auto animate-float">
                <CheeseCubeMascot className="w-full h-full" pose="joyful" />
              </div>

              <div className="space-y-2">
                <span className="px-3.5 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 font-extrabold text-xs uppercase tracking-wider rounded-full">
                  🌟 Đã vượt ải xuất sắc! 🌟
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#241916]">Chinh Phục Trạm Đại Số Thành Công!</h2>
                <p className="text-sm font-medium text-[#57423b] max-w-md mx-auto">
                  Cheese Cube rất tự hào về bạn! Bạn đã chinh phục thêm được độ cao mới của đỉnh Himalaya Toán học.
                </p>
              </div>

              {/* Quiz Stats grids */}
              <div className="grid grid-cols-3 gap-4 py-4 max-w-md mx-auto">
                <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-[#8b716a] uppercase">Điểm đạt được</span>
                  <p className="text-2xl font-extrabold text-[#ff7d54] mt-1">+{correctAnswersCount * 100} Pts</p>
                </div>
                <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-[#8b716a] uppercase">Số câu đúng</span>
                  <p className="text-2xl font-extrabold text-[#006b58] mt-1">{correctAnswersCount}/{QUIZ_QUESTIONS.length}</p>
                </div>
                <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-[#8b716a] uppercase">Thời gian giải</span>
                  <p className="text-2xl font-extrabold text-[#6366f1] mt-1">4m 12s</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button 
                  onClick={() => navigateTo('roadmap')}
                  className="btn-premium"
                >
                  <Compass size={16} /> Tiếp tục lộ trình
                </button>
                <button 
                  onClick={startQuiz}
                  className="btn-secondary-premium"
                >
                  <RotateCcw size={16} /> Leo lại ải này
                </button>
              </div>

            </div>

            {/* Answer breakdown list */}
            <div className="card-premium p-6 text-left space-y-4">
              <h3 className="font-extrabold text-lg text-[#241916] flex items-center gap-2">
                <BookMarked className="text-[#ff7d54]" />
                Xem lại danh sách câu hỏi đã giải
              </h3>
              <div className="divide-y divide-[#dfc0b7]/50">
                {QUIZ_QUESTIONS.map((q, idx) => {
                  const uAns = userAnswers.find(item => item.questionId === q.id);
                  const isCorrect = uAns ? uAns.isCorrect : false;
                  
                  return (
                    <div key={q.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                      <div className={`mt-0.5 shrink-0 ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-bold text-sm text-[#241916] leading-relaxed">
                          Câu {idx + 1}: {q.question}
                        </h4>
                        <p className="text-xs font-semibold text-[#57423b]">
                          Đáp án đúng: <span className="text-emerald-700 font-extrabold">{q.options[q.answer]}</span>
                        </p>
                        {!isCorrect && uAns && (
                          <p className="text-xs font-semibold text-rose-700">
                            Đáp án bạn chọn: <span className="font-extrabold">{uAns.selected !== null ? q.options[uAns.selected] : "Không chọn"}</span>
                          </p>
                        )}
                        <div className="mt-2 bg-[#fff8f6] border border-[#dfc0b7]/60 rounded-xl p-3">
                          <p className="text-[11px] font-bold text-[#6366f1] mb-1">💡 Lời giải của Mr. Peak:</p>
                          <p className="text-[11px] font-medium text-[#57423b] leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Blog & Tài Liệu
           ========================================================================== */}
        {activeTab === 'blog' && (
          <div className="space-y-8">
            
            {/* Massive Hero Banner with sunset background */}
            <div className="card-premium bg-gradient-to-r from-[#ffe8df] via-[#fff1ec] to-[#fceee9] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,125,84,0.1)_0,transparent_100%)]" />
              <div className="text-center lg:text-left space-y-4 max-w-xl relative z-10">
                <span className="px-3.5 py-1 bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs rounded-full uppercase tracking-wider">
                  📖 Học liệu mở rộng
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-[#241916] leading-tight">
                  Kho Kiến Thức & <span className="text-[#ff7d54]">Bí Kíp Leo Đỉnh</span>
                </h2>
                <p className="text-sm md:text-base font-semibold text-[#57423b] leading-relaxed">
                  Tổng hợp bài viết phân tích chuyên sâu cấu trúc đề thi, phương pháp nhớ nhanh công thức lượng giác và mẹo giải tích được biên soạn bởi đội ngũ Quizz Test.
                </p>
                <div className="pt-2">
                  <div className="inline-flex bg-white p-1.5 rounded-full border border-[#dfc0b7] max-w-md w-full">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm tài liệu toán..." 
                      className="border-none bg-transparent outline-none px-4 py-2 text-sm font-medium w-full text-[#241916] placeholder-[#8b716a]"
                    />
                    <button className="btn-premium py-2 px-5 text-xs text-nowrap">Tìm kiếm</button>
                  </div>
                </div>
              </div>
              <div className="w-56 h-56 shrink-0 relative flex items-center justify-center animate-float z-10">
                <TealCubeMascot className="w-full h-full" pose="thumbs_up" />
              </div>
            </div>

            {/* Article category filters */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Tất cả bài viết', 'Đại số', 'Hình học', 'Giải tích', 'Tài liệu ôn thi', 'Sự kiện'].map((cat, idx) => (
                <button 
                  key={cat} 
                  className={`px-4.5 py-2 rounded-full font-bold text-xs transition-all ${
                    idx === 0 
                      ? 'bg-[#ff7d54] text-white shadow-md' 
                      : 'bg-white border border-[#dfc0b7] text-[#57423b] hover:bg-[#fff8f6] hover:text-[#ff7d54]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {BLOG_POSTS.map((post) => {
                // Color configuration mapping based on Design System
                let colorClass = "border-l-teal-500 bg-teal-50/15";
                let badgeClass = "bg-teal-100 text-teal-800";
                
                if (post.color === 'pink') {
                  colorClass = "border-l-rose-500 bg-rose-50/15";
                  badgeClass = "bg-rose-100 text-rose-800";
                } else if (post.color === 'blue') {
                  colorClass = "border-l-indigo-500 bg-indigo-50/15";
                  badgeClass = "bg-indigo-100 text-indigo-800";
                } else if (post.color === 'orange') {
                  colorClass = "border-l-orange-500 bg-orange-50/15";
                  badgeClass = "bg-orange-100 text-orange-800";
                }

                return (
                  <article 
                    key={post.id} 
                    className={`card-premium text-left p-6 flex flex-col justify-between border-l-8 ${colorClass} hover:scale-[1.01] transition-all`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={`px-2.5 py-0.5 rounded font-extrabold text-[10px] uppercase ${badgeClass}`}>
                          {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8b716a]">
                          <Calendar size={12} />
                          <span>{post.date}</span>
                        </div>
                      </div>
                      <h3 className="font-extrabold text-xl text-[#241916] leading-snug hover:text-[#ff7d54] cursor-pointer">
                        {post.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#57423b] leading-relaxed line-clamp-3">
                        {post.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#dfc0b7]/40 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-200 flex items-center justify-center font-bold text-[9px] text-orange-800">
                          T
                        </div>
                        <span className="font-extrabold text-[#57423b]">{post.author}</span>
                      </div>
                      <button className="text-xs font-extrabold text-[#ff7d54] hover:underline flex items-center gap-0.5">
                        Đọc tiếp <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Leaderboard (BXH Himalaya)
           ========================================================================== */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Leaderboard Header Title */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-[#241916]">Bảng xếp hạng leo núi Himalaya</h2>
              <p className="text-sm font-medium text-[#57423b]">
                Những học sinh xuất sắc nhất đã cắm cờ tại các mốc độ cao lý tưởng của đỉnh Peak. Chinh phục nhiều bài tập hơn để nâng thứ hạng của bạn!
              </p>
            </div>

            {/* Top 3 Podium layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              {/* Rank 2 (left) */}
              <div className="card-premium p-6 text-center space-y-3 order-2 md:order-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-300 flex items-center justify-center text-slate-800 font-extrabold text-lg">
                      TT
                    </div>
                    <div className="absolute top-[-8px] right-[-8px] bg-slate-300 border border-slate-400 text-slate-800 font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      2
                    </div>
                  </div>
                  <h3 className="font-extrabold text-base text-[#241916]">Trần Minh Tú</h3>
                  <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded text-slate-700 font-extrabold text-[10px] uppercase">
                    Chiến thần Đại số
                  </span>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/50">
                  <p className="text-lg font-extrabold text-[#ff7d54]">9,240 Pts</p>
                  <p className="text-[10px] font-bold text-[#8b716a]">Độ cao: 8,100m (Trạm 4)</p>
                </div>
              </div>

              {/* Rank 1 (center) */}
              <div className="card-premium p-8 text-center space-y-4 order-1 md:order-2 border-2 border-yellow-400 shadow-xl scale-105 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-[-5px] left-0 right-0 h-2 bg-gradient-to-r from-yellow-300 to-yellow-500" />
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-full bg-yellow-100 border-2 border-yellow-400 flex items-center justify-center text-yellow-800 font-extrabold text-2xl">
                      👑
                    </div>
                    <div className="absolute top-[-8px] right-[-8px] bg-yellow-400 border border-yellow-500 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      1
                    </div>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#241916]">Nguyễn Đăng Khoa</h3>
                  <span className="inline-block px-2.5 py-0.5 bg-yellow-100 rounded text-yellow-700 font-extrabold text-[10px] uppercase">
                    Cao thủ Tích phân
                  </span>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/50">
                  <p className="text-2xl font-extrabold text-[#ff7d54]">9,850 Pts</p>
                  <p className="text-[10px] font-bold text-[#8b716a]">Độ cao: 8,848m (Đỉnh Peak)</p>
                </div>
              </div>

              {/* Rank 3 (right) */}
              <div className="card-premium p-6 text-center space-y-3 order-3 md:order-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-800 font-extrabold text-lg">
                      LN
                    </div>
                    <div className="absolute top-[-8px] right-[-8px] bg-amber-500 border border-amber-600 text-white font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      3
                    </div>
                  </div>
                  <h3 className="font-extrabold text-base text-[#241916]">Phạm Lê Hoài Nam</h3>
                  <span className="inline-block px-2.5 py-0.5 bg-amber-100 rounded text-amber-700 font-extrabold text-[10px] uppercase">
                    Kiện tướng Hình học
                  </span>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/50">
                  <p className="text-lg font-extrabold text-[#ff7d54]">8,900 Pts</p>
                  <p className="text-[10px] font-bold text-[#8b716a]">Độ cao: 7,800m (Trạm 4)</p>
                </div>
              </div>

            </div>

            {/* List rankings table */}
            <div className="card-premium p-0 overflow-hidden">
              <div className="bg-gradient-to-r from-[#ffe9e3] to-[#fff3f0] p-4 font-extrabold text-xs text-[#57423b] uppercase tracking-wider flex justify-between items-center px-6">
                <div className="flex items-center gap-6">
                  <span className="w-8">Hạng</span>
                  <span>Nhà leo núi</span>
                </div>
                <div className="flex items-center gap-12">
                  <span className="hidden sm:inline-block w-32 text-center">Mốc chinh phục</span>
                  <span className="w-20 text-right">Điểm số</span>
                </div>
              </div>
              
              <div className="divide-y divide-[#dfc0b7]/40">
                {LEADERBOARD_USERS.map((user) => {
                  const isUser = user.name === 'Vũ Quốc Pháp';
                  return (
                    <div 
                      key={user.rank} 
                      className={`p-4 px-6 flex justify-between items-center transition-all ${
                        isUser ? 'bg-orange-50/50 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <span className={`w-8 font-extrabold text-sm ${
                          user.rank <= 3 ? 'text-[#ff7d54]' : 'text-[#8b716a]'
                        }`}>
                          #{user.rank}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${user.avatarColor} text-white font-extrabold text-xs flex items-center justify-center shadow-sm`}>
                            {user.name.split(' ').pop().slice(0,2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-[#241916] flex items-center gap-1.5">
                              {user.name} 
                              {isUser && <span className="px-1.5 py-0.5 bg-[#ff7d54]/10 rounded text-[#ff7d54] font-extrabold text-[9px]">Bạn</span>}
                            </h4>
                            <p className="text-[10px] font-semibold text-[#8b716a]">{user.level}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12 text-sm">
                        <div className="hidden sm:flex flex-col items-end w-32 shrink-0">
                          <span className="text-xs font-bold text-[#57423b]">{user.climbPct}% Đỉnh núi</span>
                          <div className="w-20 bg-[#ffe9e3] h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-[#ff7d54] h-full rounded-full" style={{ width: `${user.climbPct}%` }} />
                          </div>
                        </div>
                        <span className="w-20 font-extrabold text-right text-[#ff7d54]">{user.points} Pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Profile (Trang Cá Nhân)
           ========================================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            
            {/* Profile Overview Card */}
            <div className="card-premium p-8 text-center md:text-left flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-[#6366f1]/5 rounded-full blur-2xl" />
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#4f46e5] border-4 border-white flex items-center justify-center text-white font-extrabold text-3xl shadow-md shrink-0">
                VP
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h2 className="text-2xl font-extrabold text-[#241916]">Vũ Quốc Pháp</h2>
                  <span className="px-2.5 py-0.5 bg-[#ff7d54]/10 rounded text-[#ff7d54] font-extrabold text-[10px] uppercase">
                    Nhà leo núi Triển vọng
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#57423b] max-w-md">
                  Mục tiêu hiện tại: Vượt ải 2 "Vách đá đại số" và đạt độ cao 3,200m để mở khóa ải lượng giác.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-[#8b716a]">
                    <Target size={14} /> Điểm tích lũy: <strong className="text-[#ff7d54] font-extrabold">{totalPoints} Pts</strong>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#8b716a]">
                    <Flame size={14} className="text-orange-500 animate-pulse-soft" /> Ngọn lửa: <strong className="text-[#ff7d54] font-extrabold">{streak} ngày</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Climbing Medals */}
              <div className="card-premium p-6 text-left space-y-4">
                <h3 className="font-extrabold text-lg text-[#241916] flex items-center gap-2">
                  <Award className="text-[#ff7d54]" /> Huy hiệu đạt được
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 text-center space-y-2">
                    <span className="text-3xl">🏅</span>
                    <h4 className="font-extrabold text-xs text-[#241916]">Bánh Mì Vàng</h4>
                    <p className="text-[10px] font-bold text-[#8b716a]">Leo núi 7 ngày liên tiếp</p>
                  </div>
                  <div className="bg-[#fff8f6] border border-[#dfc0b7] rounded-2xl p-4 text-center space-y-2 opacity-50 relative">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center font-extrabold text-xs text-gray-500">🔒 Khóa</div>
                    <span className="text-3xl">🛡️</span>
                    <h4 className="font-extrabold text-xs text-[#241916]">Kiện Tướng Số Học</h4>
                    <p className="text-[10px] font-bold text-[#8b716a]">Đạt 10/10 tại trạm 3</p>
                  </div>
                </div>
              </div>

              {/* Progress Detail stats */}
              <div className="card-premium p-6 text-left space-y-4">
                <h3 className="font-extrabold text-lg text-[#241916] flex items-center gap-2">
                  <Activity className="text-[#006b58]" /> Thống kê quá trình học
                </h3>
                <div className="space-y-3 font-semibold text-xs text-[#57423b]">
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                    <span>Tổng số câu hỏi đã giải:</span>
                    <strong className="text-[#241916]">148 câu</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                    <span>Tỷ lệ chính xác trung bình:</span>
                    <strong className="text-emerald-700">82.5%</strong>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl">
                    <span>Bài viết đã đọc:</span>
                    <strong className="text-[#241916]">12 bài</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ==========================================================================
           PAGE: Tab Login (Đăng Nhập)
           ========================================================================== */}
        {activeTab === 'login' && (
          <div className="card-premium p-0 max-w-4xl mx-auto overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            
            {/* Left Column Mascot illustration under Sunset orange background */}
            <div className="flex-1 bg-gradient-to-b from-[#ffe8df] to-[#ffe9e3] p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-10 left-10 w-24 h-24 bg-[#ff7d54]/10 rounded-full blur-xl" />
              
              <div className="relative w-40 h-40 animate-float z-10">
                <CheeseCubeMascot className="w-full h-full" pose="happy" />
              </div>

              <div className="space-y-2 z-10">
                <h3 className="font-extrabold text-xl text-[#241916]">Chinh Phục Đỉnh Cao Toán Học</h3>
                <p className="text-xs font-semibold text-[#57423b] max-w-xs leading-relaxed">
                  Lưu trữ tiến trình leo núi của bạn, nhận cúp xếp hạng và giải bài cùng hội nhóm Cheese & Bánh Mì Mascot ngay hôm nay!
                </p>
              </div>
            </div>

            {/* Right Column Form interface */}
            <div className="flex-1 p-8 md:p-12 text-left flex flex-col justify-center space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-[#241916]">Xin chào nhà leo núi!</h2>
                <p className="text-xs font-medium text-[#8b716a]">Đăng nhập tài khoản Quizz Test của bạn để tiếp tục leo ải.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#57423b]">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="email@mathpeak.vn" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="input-premium"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-extrabold text-[#57423b]">Mật khẩu</label>
                    <a href="#" className="text-[11px] font-extrabold text-[#ff7d54] hover:underline">Quên mật khẩu?</a>
                  </div>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="input-premium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 font-semibold text-xs text-[#57423b]">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-[#ff7d54] focus:ring-[#ff7d54]" />
                  <label htmlFor="remember">Duy trì đăng nhập trên thiết bị này</label>
                </div>

                <button 
                  type="submit" 
                  className="w-full btn-premium py-3.5 text-sm flex items-center justify-center gap-1.5"
                >
                  <LogIn size={16} /> Đăng nhập ngay
                </button>
              </form>

              <div className="text-center font-bold text-xs text-[#8b716a] pt-2">
                Chưa có tài khoản? <a href="#" className="text-[#ff7d54] hover:underline">Đăng ký thành viên mới</a>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ==========================================================================
         Footer Area - 100% Stitch Matching
         ========================================================================== */}
      <footer className="w-full bg-[#fbf1ee] border-t border-[#dfc0b7]/50 py-10 mt-16 text-[#8c3315]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm font-medium">
          
          {/* Left: Brand logo & info */}
          <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
            <span className="font-black text-lg text-[#8c3315] tracking-tight">Quizz Test</span>
            <span className="text-xs text-[#8c3315]/70">© 2024 Quizz Test. Master the Peak.</span>
          </div>

          {/* Center: Horizontally aligned Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
            <a href="#" className="hover:underline hover:text-[#8c3315]/80 transition-all">About Us</a>
            <a href="#" className="hover:underline hover:text-[#8c3315]/80 transition-all">Curriculum</a>
            <a href="#" className="hover:underline hover:text-[#8c3315]/80 transition-all">Privacy Policy</a>
            <a href="#" className="hover:underline hover:text-[#8c3315]/80 transition-all">Contact Support</a>
          </div>

          {/* Right: Round icon utility buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="w-9 h-9 rounded-full border border-[#dfc0b7]/80 flex items-center justify-center text-[#8c3315] hover:bg-[#ffece6] transition-all">
              <FileText size={16} />
            </button>
            <button className="w-9 h-9 rounded-full border border-[#dfc0b7]/80 flex items-center justify-center text-[#8c3315] hover:bg-[#ffece6] transition-all">
              <Globe size={16} />
            </button>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default App;
