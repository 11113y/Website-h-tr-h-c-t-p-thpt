import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStats, getAnalytics, getHistory, restoreStreak, updateProfile } from '../api/users';
import { User, BarChart2, History, Flame, Star, Edit2, Check, X, Award, AlertCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../contexts/DialogContext';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { alert, confirm } = useDialog();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [hoveredChapter, setHoveredChapter] = useState(null);
  const [hoveredTimelinePoint, setHoveredTimelinePoint] = useState(null);

  useEffect(() => {
    getStats().then(r => setStats(r.data?.user || r.data)).catch(() => {});
    if (tab === 'analytics') {
      getAnalytics()
        .then(r => setAnalytics(r.data?.radar || r.data || []))
        .catch(() => {});
      getHistory()
        .then(r => setHistory(r.data?.history || r.data || []))
        .catch(() => {});
    }
    if (tab === 'history') {
      getHistory().then(r => setHistory(r.data?.history || r.data || [])).catch(() => {});
    }
  }, [tab]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const handleRestoreStreak = async () => {
    const confirmRestore = await confirm('Khôi phục chuỗi ngày học tập (Streak) bằng 50 điểm tích lũy?');
    if (!confirmRestore) return;
    setRestoring(true);
    try {
      await restoreStreak();
      await refreshUser();
      alert('Khôi phục Streak thành công! Hãy duy trì học tập mỗi ngày nhé.');
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data?.error || 'Không thể khôi phục streak');
    }
    setRestoring(false);
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const strongChapters = analytics ? analytics.filter(c => c.status === 'strong' || c.accuracy >= 80) : [];
  const weakChapters = analytics ? analytics.filter(c => c.status === 'weak' || c.accuracy < 50) : [];
  const averageChapters = analytics ? analytics.filter(c => c.status === 'average' || (c.accuracy >= 50 && c.accuracy < 80)) : [];

  // Summary logic for best/worst exam and topic
  let highestExam = null;
  let lowestExam = null;
  if (history && history.length > 0) {
    let maxSc = -1;
    let minSc = 11;
    history.forEach(h => {
      const s = Number(h.score) || 0;
      if (s > maxSc) {
        maxSc = s;
        highestExam = h;
      }
      if (s < minSc) {
        minSc = s;
        lowestExam = h;
      }
    });
  }

  let strongestChapter = null;
  let weakestChapter = null;
  if (analytics && analytics.length > 0) {
    let maxAcc = -1;
    let minAcc = 101;
    analytics.forEach(c => {
      const a = Number(c.accuracy) || 0;
      if (a > maxAcc) {
        maxAcc = a;
        strongestChapter = c;
      }
      if (a < minAcc) {
        minAcc = a;
        weakestChapter = c;
      }
    });
  }

  const renderRadarChart = () => {
    if (!analytics || analytics.length === 0) return null;
    
    // Pad to at least 3 items to make a valid polygon
    const radarData = [...analytics];
    if (radarData.length < 3) {
      while (radarData.length < 3) {
        radarData.push({
          chapter_id: `placeholder_${radarData.length}`,
          chapter_name: `Chuyên đề ${radarData.length === 1 ? 'Hình học' : 'Đại số'}`,
          accuracy: 0,
          correct: 0,
          total: 0,
          status: 'weak'
        });
      }
    }

    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const r = 90; // max radius for 100%
    const numPoints = radarData.length;

    // Concentric grid lines
    const levels = [20, 40, 60, 80, 100];
    const gridPolygons = levels.map(level => {
      const points = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const radius = (level / 100) * r;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return points.join(' ');
    });

    // Web lines from center to outer vertices
    const webLines = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      webLines.push({ x1: cx, y1: cy, x2: x, y2: y });
    }

    // User's performance polygon
    const userPoints = [];
    const dataPoints = [];
    radarData.forEach((d, i) => {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const radius = (d.accuracy / 100) * r;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      userPoints.push(`${x},${y}`);
      dataPoints.push({ x, y, chapter: d });
    });
    const userPolygonPoints = userPoints.join(' ');

    return (
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width={size + 50} height={size + 50} viewBox={`0 0 ${size + 50} ${size + 50}`} style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary-light)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15" />
            </radialGradient>
          </defs>

          {/* Grid concentric polygons */}
          {gridPolygons.map((pts, idx) => (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          ))}

          {/* Value labels for grid lines (e.g. 50%, 100%) */}
          {levels.map((level, idx) => {
            const angle = -Math.PI / 2; // draw along the top vertical line
            const radius = (level / 100) * r;
            const x = cx + radius * Math.cos(angle) + 6;
            const y = cy + radius * Math.sin(angle) - 2;
            return (
              <text
                key={idx}
                x={x}
                y={y}
                fill="var(--text-light)"
                fontSize="9"
                fontWeight="700"
              >
                {level}%
              </text>
            );
          })}

          {/* Web axis lines */}
          {webLines.map((line, idx) => (
            <line
              key={idx}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="var(--border)"
              strokeWidth="1.2"
            />
          ))}

          {/* User value polygon */}
          {userPoints.length > 0 && (
            <polygon
              points={userPolygonPoints}
              fill="url(#radarGrad)"
              stroke="var(--primary)"
              strokeWidth="3"
              style={{ transition: 'all 0.5s ease' }}
            />
          )}

          {/* Vertex labels (chapter names) */}
          {radarData.map((d, i) => {
            const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
            const labelDist = r + 24;
            const x = cx + labelDist * Math.cos(angle);
            const y = cy + labelDist * Math.sin(angle);

            let textAnchor = 'middle';
            if (Math.cos(angle) > 0.15) textAnchor = 'start';
            else if (Math.cos(angle) < -0.15) textAnchor = 'end';

            let dy = "0.35em";
            if (Math.sin(angle) > 0.8) dy = "1em";
            else if (Math.sin(angle) < -0.8) dy = "-0.2em";

            // Shorten name if too long
            const displayName = d.chapter_name.length > 25 
              ? d.chapter_name.slice(0, 22) + '...' 
              : d.chapter_name;

            return (
              <g key={d.chapter_id}>
                <text
                  x={x}
                  y={y}
                  dy={dy}
                  textAnchor={textAnchor}
                  fill="var(--text)"
                  fontSize="11"
                  fontWeight="700"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setHoveredChapter(d)}
                >
                  {displayName}
                </text>
                <text
                  x={x}
                  y={y}
                  dy={dy === "-0.2em" ? "-1.3em" : (dy === "1em" ? "2.1em" : "1.4em")}
                  textAnchor={textAnchor}
                  fill="var(--primary)"
                  fontSize="10"
                  fontWeight="800"
                >
                  {d.accuracy}%
                </text>
              </g>
            );
          })}

          {/* Interactive dots */}
          {dataPoints.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="6"
              fill="var(--bg-card)"
              stroke="var(--primary)"
              strokeWidth="3"
              style={{ transition: 'all 0.5s ease', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredChapter(pt.chapter)}
              onMouseLeave={() => setHoveredChapter(null)}
            />
          ))}
        </svg>

        {/* Hover chapter details box */}
        {hoveredChapter && (
          <div style={{
            position: 'absolute',
            bottom: -5,
            background: 'var(--bg-card)',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 10,
            fontSize: '0.85rem',
            textAlign: 'left',
            minWidth: 180,
            pointerEvents: 'none'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{hoveredChapter.chapter_name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <span style={{ color: 'var(--text-muted)' }}>Độ chính xác:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{hoveredChapter.accuracy}%</span>
            </div>
            {hoveredChapter.total > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ color: 'var(--text-muted)' }}>Số câu làm:</span>
                <span style={{ fontWeight: 700 }}>{hoveredChapter.correct}/{hoveredChapter.total}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderScoreTimeline = () => {
    if (!history || history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Chưa có lịch sử làm bài để vẽ xu hướng điểm số.
        </div>
      );
    }

    // Get up to 10 latest attempts, chronological (oldest to newest)
    const attempts = [...history]
      .slice(0, 10)
      .reverse();

    const N = attempts.length;
    const width = 500;
    const height = 220;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Y-coordinate generator for score 0..10
    const getY = (score) => {
      const val = Number(score) || 0;
      return paddingTop + chartHeight - (val / 10) * chartHeight;
    };

    // X-coordinate generator
    const getX = (index) => {
      if (N <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (N - 1)) * chartWidth;
    };

    // Construct path line & gradient area path
    let linePath = '';
    let areaPath = '';
    
    if (N > 0) {
      const points = attempts.map((a, i) => ({ x: getX(i), y: getY(a.score) }));
      
      // Line path
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      
      // Area path
      areaPath = `${linePath} L ${points[N-1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    const yTicks = [0, 2, 4, 6, 8, 10];

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(tick => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-light)"
                  fontSize="10"
                  fontWeight="700"
                >
                  {tick}đ
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {N > 0 && (
            <path
              d={areaPath}
              fill="url(#scoreAreaGrad)"
            />
          )}

          {/* Connection line */}
          {N > 0 && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points dots */}
          {attempts.map((a, i) => {
            const x = getX(i);
            const y = getY(a.score);
            const isHovered = hoveredTimelinePoint && hoveredTimelinePoint.index === i;
            
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 8 : 5}
                  fill="var(--bg-card)"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                  onMouseEnter={() => setHoveredTimelinePoint({ ...a, index: i, x, y })}
                  onMouseLeave={() => setHoveredTimelinePoint(null)}
                />
                {/* Small labels on X-axis */}
                <text
                  x={x}
                  y={height - paddingBottom + 18}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  #{N - i}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Timeline Tooltip */}
        {hoveredTimelinePoint && (
          <div style={{
            position: 'absolute',
            left: `${(hoveredTimelinePoint.x / width) * 100}%`,
            top: hoveredTimelinePoint.y - 65,
            transform: 'translateX(-50%)',
            background: 'var(--text)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            padding: '6px 10px',
            boxShadow: 'var(--shadow)',
            zIndex: 10,
            fontSize: '0.8rem',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 800 }}>{hoveredTimelinePoint.exam_title || hoveredTimelinePoint.title || `Đề thi #${hoveredTimelinePoint.exam_id}`}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <span>Điểm số:</span>
              <strong style={{ color: 'var(--warning)' }}>{Number(hoveredTimelinePoint.score).toFixed(1)} / 10</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getScoreDistribution = () => {
    const bins = [
      { label: '0-2đ', count: 0, color: 'var(--danger)' },
      { label: '2-4đ', count: 0, color: '#f97316' },
      { label: '4-6đ', count: 0, color: 'var(--warning)' },
      { label: '6-8đ', count: 0, color: '#06b6d4' },
      { label: '8-10đ', count: 0, color: 'var(--success)' }
    ];

    history.forEach(h => {
      const score = Number(h.score) || 0;
      if (score >= 0 && score <= 2.0) bins[0].count++;
      else if (score > 2.0 && score <= 4.0) bins[1].count++;
      else if (score > 4.0 && score <= 6.0) bins[2].count++;
      else if (score > 6.0 && score <= 8.0) bins[3].count++;
      else if (score > 8.0 && score <= 10.0) bins[4].count++;
    });

    return bins;
  };

  const renderScoreDistribution = () => {
    if (!history || history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Chưa có lịch sử làm bài để thống kê phân bố điểm.
        </div>
      );
    }

    const bins = getScoreDistribution();
    const maxCount = Math.max(...bins.map(b => b.count), 1);
    
    return (
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingBottom: 10, background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: '20px 12px 10px' }}>
        {bins.map((bin, i) => {
          const pct = (bin.count / maxCount) * 100;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {bin.count > 0 ? bin.count : '0'}
              </span>
              <div 
                style={{
                  height: `${Math.max(pct, 5)}%`,
                  width: '100%',
                  background: bin.color,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.4s ease',
                  cursor: 'pointer',
                  opacity: 0.85
                }}
                title={`Khoảng điểm ${bin.label}: ${bin.count} lượt thi`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1.0';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                  e.currentTarget.style.transform = 'scale(1.0)';
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 8, whiteSpace: 'nowrap' }}>
                {bin.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container" style={{ maxWidth: 900, padding: '32px 16px' }}>
      {/* Profile header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className="avatar avatar-xl">{initials}</div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} style={{ maxWidth: 260 }} />
                <button className="btn btn-success btn-sm" onClick={handleSave} disabled={saving}><Check size={16} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={16} /></button>
              </div>
            ) : (
              <h1 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                {user?.name || user?.username}
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setName(user?.name || ''); setEditing(true); }}><Edit2 size={15} /></button>
              </h1>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-accent">🔥 {user?.streakCount || user?.streak_count || 0} ngày streak</span>
              <span className="badge badge-primary">⭐ {(user?.points || 0).toLocaleString()} điểm</span>
              {user?.role === 'admin' && <span className="badge badge-danger">Admin</span>}
            </div>
          </div>
          {(user?.streakCount === 0 || user?.streak_count === 0) && (
            <button className="btn btn-accent btn-sm" onClick={handleRestoreStreak} disabled={restoring}>
              <Flame size={15} style={{ marginRight: 4 }} /> {restoring ? 'Đang khôi phục...' : 'Khôi phục Streak (50đ)'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          { id: 'overview', label: 'Tổng quan', icon: <Star size={15} /> },
          { id: 'analytics', label: 'Phân tích học lực', icon: <BarChart2 size={15} /> },
          { id: 'history', label: 'Lịch sử làm bài', icon: <History size={15} /> }
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} <span style={{ marginLeft: 6 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16 }}>
          {[
            { label: 'Streak hiện tại', value: `${user?.streakCount || user?.streak_count || 0} ngày`, icon: '🔥' },
            { label: 'Tổng điểm', value: (user?.points || 0).toLocaleString(), icon: '⭐' },
            { label: 'Bài học đã xong', value: ((user?.completedLessons?.length || 0) + (user?.completedMaterials?.length || 0)) + ' bài', icon: '✅' },
            { label: 'Tài liệu đã mở', value: (user?.unlockedDocuments?.length || 0) + ' file', icon: '📂' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: 20 }}>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.icon}</div>
                <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!analytics ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : analytics.length === 0 ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <BarChart2 size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p>Hãy tham gia làm các đề thi thử để có kết quả phân tích học lực</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/exams')} style={{ marginTop: 12 }}>Làm bài kiểm tra ngay</button>
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: Radar & Detail List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award size={18} color="var(--primary)" /> Biểu đồ Radar Chuyên đề
                    </h3>
                  </div>
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '24px 12px' }}>
                    {renderRadarChart()}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart2 size={18} color="var(--primary)" /> Chi tiết độ chính xác theo chuyên đề
                    </h3>
                  </div>
                  <div className="card-body" style={{ maxHeight: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {analytics.map(c => {
                      const accuracyColor = c.accuracy >= 80 ? 'var(--success)' : c.accuracy < 50 ? 'var(--danger)' : 'var(--warning)';
                      return (
                        <div key={c.chapter_id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 600 }}>{c.chapter_name}</span>
                            <span style={{ fontWeight: 700, color: accuracyColor }}>{c.accuracy}% ({c.correct}/{c.total} câu)</span>
                          </div>
                          <div style={{ height: 8, width: '100%', background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${c.accuracy}%`, background: accuracyColor, borderRadius: 4, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Highlights / Đánh giá nhanh */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--success)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CHUYÊN ĐỀ MẠNH NHẤT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                    {strongestChapter ? strongestChapter.chapter_name : '—'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>
                    {strongestChapter ? `${strongestChapter.accuracy}% độ chính xác` : 'Chưa xác định'}
                  </div>
                </div>

                <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CHUYÊN ĐỀ YẾU NHẤT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                    {weakestChapter ? weakestChapter.chapter_name : '—'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 700, marginTop: 2 }}>
                    {weakestChapter ? `${weakestChapter.accuracy}% độ chính xác` : 'Chưa xác định'}
                  </div>
                </div>

                <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ĐỀ THI ĐIỂM CAO NHẤT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {highestExam ? (highestExam.exam_title || highestExam.title) : '—'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                    {highestExam ? `${Number(highestExam.score).toFixed(1)} / 10 điểm` : 'Chưa thi'}
                  </div>
                </div>

                <div className="card" style={{ padding: 16, borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ĐỀ THI ĐIỂM THẤP NHẤT</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {lowestExam ? (lowestExam.exam_title || lowestExam.title) : '—'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--warning)', fontWeight: 700, marginTop: 2 }}>
                    {lowestExam ? `${Number(lowestExam.score).toFixed(1)} / 10 điểm` : 'Chưa thi'}
                  </div>
                </div>
              </div>

              {/* Row 3: Timeline & Distribution */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <History size={18} color="var(--accent)" /> Xu hướng Điểm số (10 bài gần nhất)
                    </h3>
                  </div>
                  <div className="card-body" style={{ padding: '20px 16px' }}>
                    {renderScoreTimeline()}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart2 size={18} color="var(--success)" /> Phổ phân bố điểm số
                    </h3>
                  </div>
                  <div className="card-body" style={{ padding: '20px 16px' }}>
                    {renderScoreDistribution()}
                  </div>
                </div>
              </div>

              {/* Row 4: Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
                {/* Strong points */}
                <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
                  <div className="card-header" style={{ background: 'var(--success-light)' }}>
                    <h4 style={{ margin: 0, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award size={18} /> Kiến thức vững vàng (≥80%)
                    </h4>
                  </div>
                  <div className="card-body">
                    {strongChapters.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có chuyên đề nào đạt độ chính xác trên 80%</p>
                    ) : (
                      <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {strongChapters.map(c => (
                          <li key={c.chapter_id} style={{ marginBottom: 6 }}>
                            <strong>{c.chapter_name}</strong> - Rất tốt! Hãy tiếp tục duy trì phong độ.
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Weak points & Recommendations */}
                <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
                  <div className="card-header" style={{ background: 'var(--danger-light)' }}>
                    <h4 style={{ margin: 0, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={18} /> Kiến thức yếu - Cần ôn tập (&lt;50%)
                    </h4>
                  </div>
                  <div className="card-body">
                    {weakChapters.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tuyệt vời! Không có chuyên đề nào dưới 50% độ chính xác</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <ul style={{ paddingLeft: 20, margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
                          {weakChapters.map(c => (
                            <li key={c.chapter_id} style={{ marginBottom: 6 }}>
                              <strong>{c.chapter_name}</strong> ({c.accuracy}%)
                            </li>
                          ))}
                        </ul>
                        <div style={{ background: 'var(--primary-light)', padding: 12, borderRadius: 'var(--radius)', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'flex-start', border: '1px solid var(--primary-border)' }}>
                          <BookOpen size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>Gợi ý ôn tập:</strong> Bạn nên ôn tập lại các bài giảng lý thuyết và làm các bài kiểm tra ngắn thuộc các chuyên đề trên để cải thiện kết quả.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Chưa có lịch sử làm bài</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Đề thi</th>
                    <th>Điểm số</th>
                    <th>Điểm thưởng</th>
                    <th>Thời gian làm</th>
                    <th>Ngày nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{h.exam_title || h.title || `Đề thi #${h.exam_id}`}</td>
                      <td>
                        <span className={`badge ${h.score >= 5 ? 'badge-success' : 'badge-danger'}`} style={{ minWidth: 45, textAlign: 'center' }}>
                          {Number(h.score || 0).toFixed(1)}/10
                        </span>
                      </td>
                      <td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>+{h.points_earned || 0}đ</span></td>
                      <td>{h.time_spent_seconds ? `${Math.floor(h.time_spent_seconds / 60)}m ${h.time_spent_seconds % 60}s` : '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                        {h.completed_at ? new Date(h.completed_at).toLocaleString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
