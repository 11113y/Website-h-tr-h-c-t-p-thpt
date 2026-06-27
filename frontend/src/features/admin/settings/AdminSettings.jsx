import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Clock, 
  Save, 
  Flame,
  Palette,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../../../utils/ThemeContext';

export default function AdminSettings({ showAlert, adminTheme: propAdminTheme, setAdminTheme: propSetAdminTheme, adminColor: propAdminColor, setAdminColor: propSetAdminColor }) {
  const themeContext = useTheme();

  const adminTheme = propAdminTheme !== undefined ? propAdminTheme : themeContext.adminTheme;
  const setAdminTheme = propSetAdminTheme !== undefined ? propSetAdminTheme : themeContext.setAdminTheme;
  const adminColor = propAdminColor !== undefined ? propAdminColor : themeContext.adminColor;
  const setAdminColor = propSetAdminColor !== undefined ? propSetAdminColor : themeContext.setAdminColor;
  const [streakWarningMessage, setStreakWarningMessage] = useState('');
  const [streakLostMessage, setStreakLostMessage] = useState('');
  const [streakRestoredTitle, setStreakRestoredTitle] = useState('');
  const [streakRestoredMessage, setStreakRestoredMessage] = useState('');
  const [streakLostConfirmTitle, setStreakLostConfirmTitle] = useState('');
  const [streakLostConfirmMessage, setStreakLostConfirmMessage] = useState('');
  const [examCountdownDate, setExamCountdownDate] = useState('');
  const [examCountdownEnabled, setExamCountdownEnabled] = useState(false);
  const [streakRestorePoints, setStreakRestorePoints] = useState('1000');
  const [aiChatCost, setAiChatCost] = useState('5');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        if (res.data && res.data.success) {
          const settings = res.data.settings || {};
          setStreakWarningMessage(settings.streak_warning_message || '');
          setStreakLostMessage(settings.streak_lost_message || '');
          setStreakRestoredTitle(settings.streak_restored_title || '');
          setStreakRestoredMessage(settings.streak_restored_message || '');
          setStreakLostConfirmTitle(settings.streak_lost_confirm_title || '');
          setStreakLostConfirmMessage(settings.streak_lost_confirm_message || '');
          setStreakRestorePoints(settings.streak_restore_points || '1000');
          setAiChatCost(settings.ai_chat_cost || '5');
          setExamCountdownEnabled(settings.exam_countdown_enabled === 'true');
          
          if (settings.exam_countdown_date) {
            const d = new Date(settings.exam_countdown_date);
            const pad = (num) => String(num).padStart(2, '0');
            const localDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setExamCountdownDate(localDateTime);
          } else {
            setExamCountdownDate('');
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        showAlert('Không thể tải cấu hình hệ thống.', 'Lỗi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Adjust number values with helper buttons
  const adjustStreakPoints = (amount) => {
    setStreakRestorePoints(prev => {
      const val = parseInt(prev, 10) || 0;
      return Math.max(0, val + amount).toString();
    });
  };

  const adjustAiCost = (amount) => {
    setAiChatCost(prev => {
      const val = parseInt(prev, 10) || 0;
      return Math.max(0, val + amount).toString();
    });
  };

  // Save Settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isoExamDate = examCountdownDate ? new Date(examCountdownDate).toISOString() : '';

      const settingsArray = [
        { key: 'streak_warning_message', value: streakWarningMessage },
        { key: 'streak_lost_message', value: streakLostMessage },
        { key: 'streak_restored_title', value: streakRestoredTitle },
        { key: 'streak_restored_message', value: streakRestoredMessage },
        { key: 'streak_lost_confirm_title', value: streakLostConfirmTitle },
        { key: 'streak_lost_confirm_message', value: streakLostConfirmMessage },
        { key: 'exam_countdown_date', value: isoExamDate },
        { key: 'exam_countdown_enabled', value: String(examCountdownEnabled) },
        { key: 'streak_restore_points', value: String(streakRestorePoints) },
        { key: 'ai_chat_cost', value: String(aiChatCost) }
      ];

      const res = await axios.put('/api/settings', { settings: settingsArray });
      if (res.data && res.data.success) {
        showAlert(res.data.message || 'Lưu cấu hình hệ thống thành công!', 'Thành công', 'success');
      } else {
        showAlert(res.data.message || 'Lưu thất bại.', 'Lỗi', 'error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showAlert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.', 'Lỗi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-[#8c3315]" />
        <span className="text-xs font-bold text-[#8b716a] animate-pulse">Đang tải cấu hình hệ thống...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fadeIn max-w-3xl mx-auto pb-12">
      {/* Header Area */}
      <div className="pb-5 border-b border-[#dfc0b7]/25">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-[#fff3f0] text-[#8c3315] rounded-2xl shadow-inner">
            <Settings size={22} className="animate-spin-slow" />
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-[#241916] tracking-tight">
            Cấu hình hệ thống
          </h2>
        </div>
        <p className="text-xs font-semibold text-[#8b716a] leading-relaxed mt-1.5">
          Quản lý các thông số vận hành cốt lõi, thông báo nhắc nhở Streak và đồng hồ đếm ngược kỳ thi THPT Quốc gia.
        </p>
      </div>

      {/* Main Settings Form stacked from top to bottom */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: STREAK CONFIGURATION */}
        <div className="bg-white border border-[#dfc0b7]/40 rounded-[28px] p-6 shadow-sm space-y-6">
          <div className="space-y-1">
            <h4 className="text-base font-black text-[#241916] flex items-center gap-2">
              <Flame size={18} className="text-[#8c3315]" />
              Cấu hình Streak & Điểm giải cứu
            </h4>
            <p className="text-xs text-[#8b716a] font-semibold">
              Thiết lập thông điệp cảnh báo sắp mất chuỗi học tập và số điểm phô mai cần dùng để cứu chuỗi.
            </p>
          </div>

          {/* Warning Message Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">
                Nội dung thông báo sắp mất Streak (Trang chủ)
              </label>
              <span className="text-[10px] font-bold text-[#8b716a]">
                {streakWarningMessage.length}/250 ký tự
              </span>
            </div>
            <textarea
              value={streakWarningMessage}
              onChange={(e) => setStreakWarningMessage(e.target.value.slice(0, 250))}
              placeholder="Nhập nội dung nhắc nhở khi học viên sắp đứt chuỗi..."
              rows={3}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white focus:ring-4 focus:ring-[#8c3315]/5 rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Lost Message Input */}
          <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/15">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">
                Nội dung thông báo đã mất Streak (Trang chủ)
              </label>
              <span className="text-[10px] font-bold text-[#8b716a]">
                {streakLostMessage.length}/250 ký tự
              </span>
            </div>
            <textarea
              value={streakLostMessage}
              onChange={(e) => setStreakLostMessage(e.target.value.slice(0, 250))}
              placeholder="Nhập nội dung thông báo khi học viên đã đứt chuỗi và cần cứu..."
              rows={3}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white focus:ring-4 focus:ring-[#8c3315]/5 rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Popup Restored Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#dfc0b7]/15">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider block">
                Tiêu đề popup Khôi phục thành công
              </label>
              <input
                type="text"
                value={streakRestoredTitle}
                onChange={(e) => setStreakRestoredTitle(e.target.value)}
                placeholder="VD: ĐÃ KHÔI PHỤC STREAK!"
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-xl text-xs font-bold text-[#241916] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider block">
                Tiêu đề popup Xác nhận mất Streak
              </label>
              <input
                type="text"
                value={streakLostConfirmTitle}
                onChange={(e) => setStreakLostConfirmTitle(e.target.value)}
                placeholder="VD: ĐÃ MẤT CHUỖI HỌC TẬP!"
                required
                className="w-full px-4 py-2.5 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white rounded-xl text-xs font-bold text-[#241916] outline-none transition-all"
              />
            </div>
          </div>

          {/* Popup Restored Message */}
          <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/15">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">
                Nội dung popup Khôi phục thành công (Dùng {'{streakValue}'} làm biến số)
              </label>
              <span className="text-[10px] font-bold text-[#8b716a]">
                {streakRestoredMessage.length}/350 ký tự
              </span>
            </div>
            <textarea
              value={streakRestoredMessage}
              onChange={(e) => setStreakRestoredMessage(e.target.value.slice(0, 350))}
              placeholder="Nhập nội dung hiển thị trong popup khôi phục thành công..."
              rows={3}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white focus:ring-4 focus:ring-[#8c3315]/5 rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Popup Lost Confirm Message */}
          <div className="space-y-2 pt-4 border-t border-[#dfc0b7]/15">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">
                Nội dung popup Xác nhận mất Streak
              </label>
              <span className="text-[10px] font-bold text-[#8b716a]">
                {streakLostConfirmMessage.length}/350 ký tự
              </span>
            </div>
            <textarea
              value={streakLostConfirmMessage}
              onChange={(e) => setStreakLostConfirmMessage(e.target.value.slice(0, 350))}
              placeholder="Nhập nội dung hiển thị trong popup xác nhận mất chuỗi..."
              rows={3}
              required
              className="w-full px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white focus:ring-4 focus:ring-[#8c3315]/5 rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* streak_restore_points: hidden from UI – value-based, not text */}
        </div>

        {/* SECTION 2: AI ASSISTANCE – ai_chat_cost is value-based, hidden from UI */}

        {/* SECTION 3: EXAM COUNTDOWN */}
        <div className="bg-white border border-[#dfc0b7]/40 rounded-[28px] p-6 shadow-sm space-y-6">
          {/* Section header + toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-black text-[#241916] flex items-center gap-2">
                <Clock size={18} className="text-[#8c3315]" />
                Đồng hồ đếm ngược kỳ thi THPT
              </h4>
              <p className="text-xs text-[#8b716a] font-semibold">
                Cập nhật mốc thời gian bắt đầu kỳ thi THPT Quốc gia. Bật để hiển thị đồng hồ đếm ngược ở trang chủ, tắt để ẩn.
              </p>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => setExamCountdownEnabled(prev => !prev)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                examCountdownEnabled ? 'bg-[#8c3315]' : 'bg-gray-200'
              }`}
              title={examCountdownEnabled ? 'Đang bật – nhấn để tắt' : 'Đang tắt – nhấn để bật'}
            >
              <span
                className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  examCountdownEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Countdown Date Input – only editable when enabled */}
          <div className={`space-y-2 transition-opacity duration-200 ${examCountdownEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="text-[10px] font-black text-[#57423b] uppercase tracking-wider">
              Thời gian diễn ra kỳ thi
            </label>
            <input
              type="datetime-local"
              value={examCountdownDate}
              onChange={(e) => setExamCountdownDate(e.target.value)}
              disabled={!examCountdownEnabled}
              className="w-full max-w-md px-4 py-3 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#8c3315] focus:bg-white focus:ring-4 focus:ring-[#8c3315]/5 rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all disabled:cursor-not-allowed"
            />
            {!examCountdownEnabled && (
              <p className="text-[10px] font-bold text-gray-400">Bật công tắc để chỉnh sửa thời gian kỳ thi.</p>
            )}
          </div>
        </div>

        {/* SECTION 4: ADMIN THEME SELECTION */}
        <div className="bg-white border border-[#dfc0b7]/40 rounded-[28px] p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fff8f6] border border-[#dfc0b7] text-[#8c3315] flex items-center justify-center">
              <Palette size={20} />
            </div>
            <div>
              <h4 className="text-base font-black text-[#241916]">Giao diện trang quản trị (Admin Theme)</h4>
              <p className="text-xs text-[#8b716a] font-semibold">
                Tùy chỉnh chế độ hiển thị và màu sắc dành riêng cho các trang của quản trị viên (không ảnh hưởng đến học sinh).
              </p>
            </div>
          </div>

          {/* Chế độ hiển thị */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#8b716a] uppercase tracking-wider">Chế độ hiển thị</label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setAdminTheme('light')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-extrabold transition-all cursor-pointer ${
                  adminTheme === 'light'
                    ? 'border-[#8c3315] bg-[#fff8f6] text-[#8c3315]'
                    : 'border-[#dfc0b7]/60 hover:border-[#8c3315]/40 text-[#57423b]'
                }`}
              >
                <Sun size={18} />
                Sáng
                {adminTheme === 'light' && <Check size={14} className="ml-1" />}
              </button>
              <button
                type="button"
                onClick={() => setAdminTheme('dark')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-extrabold transition-all cursor-pointer ${
                  adminTheme === 'dark'
                    ? 'border-[#8c3315] bg-[#fff8f6] text-[#8c3315]'
                    : 'border-[#dfc0b7]/60 hover:border-[#8c3315]/40 text-[#57423b]'
                }`}
              >
                <Moon size={18} />
                Tối
                {adminTheme === 'dark' && <Check size={14} className="ml-1" />}
              </button>
            </div>
          </div>

          {/* Màu chủ đạo */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#8b716a] uppercase tracking-wider">Màu chủ đạo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { id: 'original', name: 'Màu gốc', colorClass: 'bg-[#ff7d54]' },
                { id: 'blue', name: 'Blue', colorClass: 'bg-[#3b82f6]' },
                { id: 'violet', name: 'Violet', colorClass: 'bg-[#8b5cf6]' },
                { id: 'emerald', name: 'Emerald', colorClass: 'bg-[#10b981]' },
                { id: 'rose', name: 'Rose', colorClass: 'bg-[#f43f5e]' },
                { id: 'amber', name: 'Amber', colorClass: 'bg-[#f59e0b]' },
                { id: 'cyan', name: 'Cyan', colorClass: 'bg-[#06b6d4]' },
              ].map((c) => {
                const isSelected = adminColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAdminColor(c.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all relative cursor-pointer ${
                      isSelected
                        ? 'border-[#8c3315] bg-[#fff8f6] scale-105'
                        : 'border-[#dfc0b7]/50 hover:border-[#dfc0b7] bg-white'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full ${c.colorClass} shadow-inner mb-2 block`} />
                    <span className="text-[10px] font-black text-[#57423b]">{c.name}</span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8c3315] text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Action Bar */}
        <div className="flex items-center justify-between bg-white border border-[#dfc0b7]/40 rounded-2xl p-4 shadow-sm mt-6">
          <span className="text-[10px] font-bold text-[#8b716a] hidden sm:inline-block">
            * Mọi thay đổi sẽ áp dụng ngay lập tức sau khi lưu
          </span>
          
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3 bg-[#8c3315] hover:bg-[#72270e] active:scale-95 disabled:bg-gray-300 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:shadow-none transition-all cursor-pointer ml-auto"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Lưu cấu hình</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
