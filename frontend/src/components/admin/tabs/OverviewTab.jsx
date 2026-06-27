import React, { useState } from 'react';
import { TrendingUp, Award, Users, BookOpen, MessageSquare, Clock, BarChart2, Zap } from 'lucide-react';

export default function OverviewTab({ stats }) {
  const [chartType, setChartType] = useState('attempts'); // 'attempts' or 'users'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!stats) return null;

  // 1. Fill missing dates helper to construct smooth 30-day growth trends
  const fillMissingDates = (rawData) => {
    const result = [];
    const dataMap = new Map(rawData.map(item => [item.date, item.count]));
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      result.push({
        date: dateString,
        displayDate: d.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }),
        count: dataMap.get(dateString) || 0
      });
    }
    return result;
  };

  const attemptsTrend = fillMissingDates(stats.growth_attempts || []);
  const usersTrend = fillMissingDates(stats.growth_users || []);
  const activeTrend = chartType === 'attempts' ? attemptsTrend : usersTrend;

  // Calculate coordinates for SVG
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;
  
  const maxVal = Math.max(...activeTrend.map(d => d.count), 5);
  
  // Create points
  const points = activeTrend.map((item, index) => {
    const x = padLeft + (index / (activeTrend.length - 1)) * chartW;
    const y = padTop + chartH - (item.count / maxVal) * chartH;
    return { x, y, item, index };
  });
  
  // SVG Path generator
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaD = pathD + ` L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;
  }

  // Color theme
  const chartColor = chartType === 'attempts' ? '#2563eb' : '#059669';
  const gradStart = chartType === 'attempts' ? 'rgba(37, 99, 235, 0.45)' : 'rgba(5, 150, 105, 0.45)';
  const gradEnd = chartType === 'attempts' ? 'rgba(37, 99, 235, 0.0)' : 'rgba(5, 150, 105, 0.0)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat Cards Row */}
      <div className="admin-overview-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
          borderColor: 'transparent', 
          borderRadius: 20,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 24, zIndex: 2, position: 'relative' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#1e40af', lineHeight: 1 }}>
              {stats.stats?.total_students || 0}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={14} /> Tổng học viên
            </div>
          </div>
          <Users size={80} style={{ position: 'absolute', right: -10, bottom: -10, color: 'rgba(30, 64, 175, 0.06)', zIndex: 1 }} />
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', 
          borderColor: 'transparent', 
          borderRadius: 20,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 24, zIndex: 2, position: 'relative' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#c2410c', lineHeight: 1 }}>
              {stats.stats?.total_exams || 0}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c2d12', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={14} /> Tổng đề thi
            </div>
          </div>
          <BookOpen size={80} style={{ position: 'absolute', right: -10, bottom: -10, color: 'rgba(194, 65, 12, 0.06)', zIndex: 1 }} />
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', 
          borderColor: 'transparent', 
          borderRadius: 20,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 24, zIndex: 2, position: 'relative' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#047857', lineHeight: 1 }}>
              {stats.stats?.total_attempts || 0}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064e3b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} /> Lượt làm bài
            </div>
          </div>
          <TrendingUp size={80} style={{ position: 'absolute', right: -10, bottom: -10, color: 'rgba(4, 120, 87, 0.06)', zIndex: 1 }} />
        </div>

        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', 
          borderColor: 'transparent', 
          borderRadius: 20,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ padding: 24, zIndex: 2, position: 'relative' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#be123c', lineHeight: 1 }}>
              {stats.stats?.pending_feedbacks || 0}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4c0519', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} /> Phản hồi chờ duyệt
            </div>
          </div>
          <MessageSquare size={80} style={{ position: 'absolute', right: -10, bottom: -10, color: 'rgba(190, 18, 60, 0.06)', zIndex: 1 }} />
        </div>
      </div>

      {/* Row 2: Charts & Top Exams */}
      <div className="admin-overview-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Growth Chart */}
        <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={18} style={{ color: chartColor }} />
                Biểu đồ tăng trưởng
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0' }}>Theo dõi số liệu hoạt động trong 30 ngày qua</p>
            </div>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
              <button
                onClick={() => setChartType('attempts')}
                style={{
                  border: 'none',
                  background: chartType === 'attempts' ? '#fff' : 'transparent',
                  color: chartType === 'attempts' ? '#1e293b' : '#64748b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: chartType === 'attempts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Lượt làm bài
              </button>
              <button
                onClick={() => setChartType('users')}
                style={{
                  border: 'none',
                  background: chartType === 'users' ? '#fff' : 'transparent',
                  color: chartType === 'users' ? '#1e293b' : '#64748b',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: chartType === 'users' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Học sinh mới
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', height: svgHeight }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradStart} />
                  <stop offset="100%" stopColor={gradEnd} />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padTop + ratio * chartH;
                const gridVal = Math.round(maxVal * (1 - ratio));
                return (
                  <g key={i}>
                    <line x1={padLeft} y1={y} x2={svgWidth - padRight} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Path */}
              {areaD && <path d={areaD} fill="url(#chart-grad)" />}

              {/* Stroke Path */}
              {pathD && <path d={pathD} fill="none" stroke={chartColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Date Labels (X-Axis) */}
              {activeTrend.map((item, index) => {
                if (index % 6 !== 0 && index !== activeTrend.length - 1) return null;
                const x = padLeft + (index / (activeTrend.length - 1)) * chartW;
                return (
                  <text key={index} x={x} y={svgHeight - 15} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
                    {item.displayDate}
                  </text>
                );
              })}

              {/* Hover Circles & Interactive Areas */}
              {points.map((p) => (
                <g key={p.index}>
                  {hoveredIndex === p.index && (
                    <>
                      <line x1={p.x} y1={padTop} x2={p.x} y2={padTop + chartH} stroke={chartColor} strokeWidth="1.5" strokeDasharray="2,2" />
                      <circle cx={p.x} cy={p.y} r="6" fill={chartColor} stroke="#fff" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    </>
                  )}
                  {/* Invisible interactive rectangle bar */}
                  <rect
                    x={p.x - chartW / activeTrend.length / 2}
                    y={padTop}
                    width={chartW / activeTrend.length}
                    height={chartH}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(p.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              ))}
            </svg>

            {/* Floating Tooltip */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div style={{
                position: 'absolute',
                left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                top: `${(points[hoveredIndex].y / svgHeight) * 100 - 25}%`,
                transform: 'translate(-50%, -100%)',
                background: '#1e293b',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.75rem',
                fontWeight: 700,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: 10
              }}>
                <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{points[hoveredIndex].item.date}</span>
                <span>{points[hoveredIndex].item.count} {chartType === 'attempts' ? 'lượt làm' : 'học sinh mới'}</span>
                {/* Tooltip Arrow */}
                <div style={{
                  position: 'absolute',
                  bottom: -4,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: 8,
                  height: 8,
                  background: '#1e293b'
                }} />
              </div>
            )}
          </div>
        </div>

        {/* Most Attempted Exams */}
        <div className="card" style={{ padding: 24, borderRadius: 20, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} style={{ color: '#d97706' }} />
              Đề thi làm nhiều nhất
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 16px 0' }}>Top 5 đề thi được làm nhiều nhất</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {stats.top_exams?.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', fontSize: '0.85rem' }}>
                Chưa có dữ liệu làm bài
              </div>
            ) : stats.top_exams?.map((exam, i) => (
              <div key={exam.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden', marginRight: 8 }}>
                  <span style={{
                    minWidth: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: i === 0 ? '#fef3c7' : i === 1 ? '#e2e8f0' : i === 2 ? '#ffedd5' : '#f1f5f9',
                    color: i === 0 ? '#d97706' : i === 1 ? '#475569' : i === 2 ? '#c2410c' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.75rem'
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={exam.title}>
                    {exam.title}
                  </span>
                </div>
                <span style={{
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: '#d97706',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}>
                  {exam.count} lượt
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Attempts */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={18} style={{ color: 'var(--primary)' }} />
          Lượt thi hoàn thành gần nhất
        </h3>
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div className="table-wrapper" style={{ margin: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Đề thi</th>
                  <th>Điểm số</th>
                  <th>Thời gian hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentAttempts?.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                      Chưa có lượt thi nào được hoàn thành gần đây
                    </td>
                  </tr>
                ) : stats.recentAttempts?.slice(0, 10).map((att, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.8rem'
                        }}>
                          {att.username ? att.username.charAt(0).toUpperCase() : 'A'}
                        </div>
                        {att.username || 'Ẩn danh'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{att.exam_title || 'Đề thi'}</td>
                    <td>
                      <span className="badge" style={{
                        background: Number(att.score || 0) >= 8.0 ? '#d1fae5' : Number(att.score || 0) >= 5.0 ? '#fef3c7' : '#fee2e2',
                        color: Number(att.score || 0) >= 8.0 ? '#065f46' : Number(att.score || 0) >= 5.0 ? '#92400e' : '#991b1b',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '4px 10px',
                        borderRadius: 8
                      }}>
                        {Number(att.score || 0).toFixed(1)}/10
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        {new Date(att.completed_at).toLocaleString('vi-VN')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
