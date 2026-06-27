import React from 'react';
import { BookOpen, Compass, FileText, Trophy, LogIn, User, Flame, Target } from 'lucide-react';

const NAV_TABS = [
  { id: 'home', label: 'Trang chủ', icon: BookOpen },
  { id: 'blog', label: 'Blog & Tài Liệu', icon: FileText },
  { id: 'leaderboard', label: 'Himalaya Rank', icon: Trophy }
];

export default function MobileMenu({ isLoggedIn, activeTab, streak, totalPoints, navigateTo }) {
  return (
    <div className="md:hidden fixed top-20 inset-0 z-40 bg-white border-t border-[#dfc0b7] flex flex-col p-6 gap-4 animate-fade-in">
      {NAV_TABS.map((tab) => {
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
              <img src="/mascot_cheese-removebg-preview.png" alt="Streak" className="w-5 h-5 object-contain shrink-0" /> Lửa học tập
            </span>
            <span className="font-extrabold text-orange-700">{streak} ngày</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-100 rounded-xl">
            <span className="text-sm font-bold text-[#006b58] flex items-center gap-2">
              <img src="/mascot_banhmi-removebg-preview.png" alt="Points" className="w-5 h-5 object-contain shrink-0" /> Điểm tích lũy
            </span>
            <span className="font-extrabold text-[#006b58]">{totalPoints} điểm</span>
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
  );
}
