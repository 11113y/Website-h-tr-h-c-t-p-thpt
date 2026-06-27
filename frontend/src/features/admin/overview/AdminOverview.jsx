/**
 * AdminOverview.jsx — View
 * Dashboard tab: KPI cards, line chart, donut chart, user activity table, popular tests.
 * All heavy state logic lives in useAdminOverview hook.
 */
import React, { useEffect, useState } from 'react';
import { TrendingUp, ShieldCheck, Eye, Bell, Settings, Search, Flame, Users, BookOpen, Award, FileText } from 'lucide-react';
import { useAdminOverview } from './useAdminOverview';
import { getRelativeTime, getAvatarColor, formatCategoryType } from '../../../utils/adminHelpers';
import Pagination from '../../../components/shared/Pagination';
import { useTheme } from '../../../utils/ThemeContext';
import { getAdminPalette } from '../../../utils/adminColorUtils';

export default function AdminOverview({ onViewUserDetail }) {
  const { adminColor, adminTheme } = useTheme();
  const p = getAdminPalette(adminColor, adminTheme);
  const vm = useAdminOverview();
  const [activityPage, setActivityPage] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const ACTIVITY_LIMIT = 5;

  useEffect(() => { vm.fetchDashboard(); }, []);

  const stats = vm.stats;

  const kpis = [
    { label: 'Tổng người dùng',     value: stats ? stats.totalStudents.toLocaleString() : '...', icon: <Users size={20} className="text-blue-600" />, bg: { backgroundColor: adminTheme === 'dark' ? 'rgba(59,130,246,0.12)' : '#eff6ff' } },
    { label: 'Đề thi đang mở',      value: stats ? stats.totalTests.toLocaleString() : '...',    icon: <BookOpen size={20} style={{ color: p.accentText }} />, bg: { backgroundColor: p.accentBg } },
    { label: 'Lượt thi hoàn thành', value: stats ? stats.totalAttemptsCount.toLocaleString() : '...', icon: <Award size={20} className="text-emerald-600" />, bg: { backgroundColor: adminTheme === 'dark' ? 'rgba(16,185,129,0.12)' : '#e6fcf4' } },
    { label: 'Bài viết & Tài liệu', value: stats ? stats.totalArticles.toLocaleString() : '...', icon: <FileText size={20} className="text-amber-600" />, bg: { backgroundColor: adminTheme === 'dark' ? 'rgba(245,158,11,0.12)' : '#fffbeb' } },
  ];

  const userStats = stats?.userStats || [];
  const totalActivityPages = Math.ceil(userStats.length / ACTIVITY_LIMIT);
  const pagedActivities = userStats.slice((activityPage - 1) * ACTIVITY_LIMIT, activityPage * ACTIVITY_LIMIT);

  // Calculations are handled inside vm.moetSegments

  return (
    <div className="space-y-8 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2 border-b border-[#dfc0b7]/20">
        <div className="text-left space-y-1">
          <h2 className="text-3xl font-black text-[#241916]">Tổng quan hệ thống</h2>
          <p className="text-xs font-bold text-[#8b716a]">Bảng điều khiển quản trị hệ thống HIMA TEST. Cập nhật thời gian thực.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => onViewUserDetail && onViewUserDetail(null, 'profile')}
            className="p-2.5 bg-white border border-[#dfc0b7]/50 hover:bg-gray-50 rounded-full text-gray-500 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Hồ sơ cá nhân"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white border border-[#dfc0b7]/50 rounded-[28px] p-6 text-left space-y-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner" style={k.bg}>{k.icon}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#8b716a] uppercase tracking-wider">{k.label}</span>
              <p className="text-2xl font-black text-[#241916]">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line chart */}
        <div className="lg:col-span-2 bg-white border border-[#dfc0b7]/50 rounded-[32px] p-6 text-left space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg text-[#241916] flex items-center gap-2">
              <TrendingUp size={20} style={{ color: p.accentText }} /> Tăng trưởng người dùng
            </h3>
            <select value={vm.rangeLabel} onChange={(e) => vm.setRangeLabel(e.target.value)} className="border rounded-full px-4 py-1.5 text-xs font-black focus:outline-none shadow-sm" style={{ backgroundColor: p.accentBg, borderColor: p.accentBorder, color: p.accentText }}>
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Tháng này</option>
            </select>
          </div>
          <div className="relative pt-4" style={{ minHeight: '220px' }}>
            <svg viewBox="0 0 500 200" className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={p.btnBg} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={p.btnBg} stopOpacity="0.00" />
                </linearGradient>
              </defs>
              <line x1="0" y1="50" x2="500" y2="50" stroke={adminTheme === 'dark' ? '#332a26' : '#f3f4f6'} strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke={adminTheme === 'dark' ? '#332a26' : '#f3f4f6'} strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke={adminTheme === 'dark' ? '#332a26' : '#f3f4f6'} strokeWidth="1" />
              
              {/* Vertical guideline on hover */}
              {hoveredPoint && (
                <line 
                  x1={hoveredPoint.x} 
                  y1={20} 
                  x2={hoveredPoint.x} 
                  y2={180} 
                  stroke={p.btnBg} 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />
              )}

              {vm.chartPoints.length > 0 && (
                <>
                  <path d={vm.areaPath.replace(/#4f46e5/g, p.btnBg)} fill="url(#chartGradient)" />
                  <path d={vm.linePath.replace(/#4f46e5/g, p.btnBg)} fill="none" stroke={p.btnBg} strokeWidth="4" strokeLinecap="round" />
                  {vm.chartPoints.map((pt, idx) => {
                    const isHovered = hoveredPoint?.label === pt.label;
                    return (
                      <g key={idx}>
                        {isHovered && (
                          <circle cx={pt.x} cy={pt.y} r={10} fill={p.btnBg} fillOpacity="0.25" />
                        )}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={isHovered ? 6 : (vm.chartPoints.length <= 7 ? 5 : 3.5)} 
                          fill={isHovered ? "#ffffff" : p.btnBg} 
                          stroke={p.btnBg} 
                          strokeWidth={isHovered ? 3 : 2} 
                        />
                        {/* Large invisible catch area for mouse events */}
                        <circle 
                          cx={pt.x} 
                          cy={pt.y} 
                          r={20} 
                          fill="transparent" 
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    );
                  })}
                </>
              )}
            </svg>

            {/* Absolute Glassmorphic Tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute bg-slate-900/90 backdrop-blur-sm text-white text-[11px] px-3 py-2 rounded-2xl shadow-xl border border-slate-700 pointer-events-none transition-all duration-150 z-20 space-y-0.5"
                style={{
                  left: `${(hoveredPoint.x / 500) * 100}%`,
                  top: `${(hoveredPoint.y / 200) * 100 - 15}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <p className="font-extrabold text-slate-400 text-[9px] uppercase tracking-wider">{hoveredPoint.label}</p>
                <p className="font-black text-xs" style={{ color: p.accentText }}>{hoveredPoint.count} học viên</p>
              </div>
            )}

            <div className="absolute left-0 right-0 bottom-0 text-[10px] font-black text-[#8b716a] h-6 relative mt-2">
              {vm.chartPoints.map((pt, idx) => {
                const shouldShow = vm.chartPoints.length <= 7 || idx === 0 || idx === vm.chartPoints.length - 1 || idx % Math.ceil(vm.chartPoints.length / 5) === 0;
                if (!shouldShow) return null;
                return (
                  <span key={idx} style={{ position: 'absolute', left: `${(pt.x / 500) * 100}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    {pt.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] p-6 text-left space-y-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-black text-lg text-[#241916] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#006b58]" /> Kết quả học tập
          </h3>
          <div className="relative flex justify-center py-4">
            <svg viewBox="0 0 160 160" className="w-36 h-36">
              <circle cx={80} cy={80} r={60} fill="none" stroke="#f3f4f6" strokeWidth="15" />
              {vm.moetSegments.map((seg, idx) => {
                if (seg.percent === 0) return null;
                return (
                  <circle
                    key={idx}
                    cx={80}
                    cy={80}
                    r={60}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="15"
                    strokeDasharray={`${seg.arc} 377`}
                    strokeLinecap={seg.percent === 100 ? 'butt' : 'round'}
                    transform={`rotate(${seg.rotation} 80 80)`}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[#241916]">{vm.moetPassRate}%</span>
              <span className="text-[8px] font-black text-[#8b716a] tracking-widest uppercase">Đạt chuẩn</span>
            </div>
          </div>
          <div className="space-y-2 pt-2 max-h-44 overflow-y-auto pr-1">
            {vm.moetSegments.map((seg, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-extrabold text-[#57423b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="truncate max-w-[120px]" title={seg.label}>{seg.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-right">
                  <span className="text-[9px] font-bold text-gray-400">({seg.count} lượt)</span>
                  <span style={{ color: seg.color }} className="font-black w-8">{seg.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User activity table + Popular tests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-[#dfc0b7]/50 rounded-[32px] overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-6 flex justify-between items-center border-b border-[#dfc0b7]/30">
              <h3 className="font-black text-lg text-[#241916]">Thống kê hoạt động học viên</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-black text-[#8b716a] uppercase tracking-wider">
                    <th className="py-2.5 px-6">Học sinh</th>
                    <th className="py-2.5 px-6">Số lượt thi</th>
                    <th className="py-2.5 px-6">Lần cuối</th>
                    <th className="py-2.5 px-6">Điểm trung bình</th>
                    <th className="py-2.5 px-6 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dfc0b7]/20">
                  {pagedActivities.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-xs font-bold text-[#8b716a]">Chưa có hoạt động gần đây</td></tr>
                  ) : pagedActivities.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 px-6 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(u.email)} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                          {u.user.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-[#241916]">{u.user}</p>
                          <p className="text-[10px] font-bold text-[#8b716a] mt-0.5">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-6"><span className="text-xs font-extrabold text-[#57423b]">{u.totalAttempts} lượt</span></td>
                      <td className="py-2.5 px-6"><span className="text-xs font-bold text-[#8b716a]">{getRelativeTime(u.submittedAt)}</span></td>
                      <td className="py-2.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider ${u.avgScore >= 8.0 ? 'bg-emerald-100 text-emerald-800' : u.avgScore >= 5.0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                          {u.avgScore.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-center">
                        <button 
                          onClick={() => onViewUserDetail(u.id)} 
                          title="Chi tiết"
                          className="p-2 border rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm inline-flex items-center justify-center bg-white border-slate-200 text-slate-600"
                          onMouseEnter={(e) => { e.currentTarget.style.color = p.accentText; e.currentTarget.style.backgroundColor = p.accentBg; e.currentTarget.style.borderColor = p.accentBorder; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = ''; e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.borderColor = ''; }}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={activityPage} totalPages={totalActivityPages} onPageChange={setActivityPage} />
        </div>

        {/* Popular tests */}
        <div className="bg-white border border-[#dfc0b7]/50 rounded-[32px] p-6 text-left space-y-4 shadow-sm flex flex-col">
          <h3 className="font-black text-lg text-[#241916] flex items-center gap-2">
            <Flame size={20} className="text-[#8c3315]" /> Đề thi phổ biến nhất
          </h3>
          <div className="divide-y divide-[#dfc0b7]/20">
            {stats?.popularTests?.length > 0 ? stats.popularTests.slice(0, 5).map((t, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-orange-100 text-[#8c3315] font-black text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="text-left">
                    <p className="text-xs font-black text-[#241916] line-clamp-1">{t.title}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase border`} style={t.category?.startsWith('EXAM') || t.category === 'EXAM' ? { backgroundColor: p.accentBg, color: p.accentText, borderColor: p.accentBorder } : { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#ffedd5' }}>
                      {formatCategoryType(t.category)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#006b58]">{t.attemptsCount}</span>
                  <p className="text-[8px] font-bold text-[#8b716a] mt-0.5">lượt thi</p>
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-xs font-bold text-gray-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
