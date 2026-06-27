import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getChapters, getGlobalStats } from '../api/subjects';
import { getStats } from '../api/users';
import { getExams } from '../api/exams';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, FileText, Award, TrendingUp, ArrowRight, Star, Users, Zap, Calculator, GraduationCap } from 'lucide-react';
import StreakBanner from '../components/StreakBanner';
const GRADE_ICONS = ['🔢','➕','✖️','📐','📏','📊','📈','🧮','∫','🔬','📚','🎓'];

// Native, Interactive 3D Math Parallax component
// Resolves the 403 Forbidden errors by using local, hardware-accelerated CSS 3D transforms.
const InteractiveMath3D = () => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position relative to center of the element
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Calculate rotation angles (max 15 degrees)
    const rotateX = -(mouseY / (height / 2)) * 15;
    const rotateY = (mouseX / (width / 2)) * 15;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden animate-fadeIn" 
      style={{ 
        minHeight: '340px',
        perspective: '1000px',
        cursor: 'pointer'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow Backdrop */}
      <div 
        className="absolute w-80 h-80 rounded-full filter blur-[60px] opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(circle, var(--accent) 0%, var(--primary) 100%)',
          animationDuration: '4s'
        }}
      />
      
      {/* 3D Glassmorphic Interactive container */}
      <div 
        className="relative p-6 rounded-[28px] border border-white/25 shadow-2xl backdrop-blur-md flex flex-col items-center justify-center space-y-6"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          width: '280px',
          height: '280px',
          boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Glowing Center Ring (3D Parallax: translateZ(60px)) */}
        <div 
          className="w-24 h-24 rounded-full border-[3px] border-dashed border-amber-300 flex items-center justify-center animate-spin" 
          style={{ 
            animationDuration: '24s',
            transform: 'translateZ(60px)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div style={{ transform: 'rotate(-30deg)' }}>
            <Calculator size={44} className="text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]" />
          </div>
        </div>
        
        {/* Floating formulas (3D Parallax: translateZ(40px)) */}
        <div className="text-center space-y-1.5" style={{ transform: 'translateZ(45px)' }}>
          <span className="text-xs font-black tracking-widest text-amber-200 uppercase">MathPeak 3D Interactive</span>
          <div className="text-base font-bold text-white font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">f(x) = ∫ e^x dx</div>
          <div className="text-xs text-white/80 font-mono">π ≈ 3.14159265...</div>
        </div>
        
        {/* Decorative elements with extreme 3D depth */}
        <div 
          className="absolute -top-4 -left-6 w-12 h-12 bg-indigo-500/30 border border-white/20 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg animate-float"
          style={{ 
            animationDelay: '1s',
            transform: 'translateZ(75px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          a²
        </div>
        <div 
          className="absolute -bottom-2 -right-6 w-14 h-14 bg-purple-500/30 border border-white/20 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg animate-float"
          style={{ 
            animationDelay: '2.5s',
            transform: 'translateZ(85px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          √x
        </div>
        <div 
          className="absolute top-1/2 -right-8 w-10 h-10 bg-amber-500/30 border border-white/20 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg animate-float"
          style={{ 
            animationDelay: '4s',
            transform: 'translateZ(65px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          sinθ
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { isLoggedIn, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chaptersMap, setChaptersMap] = useState({});
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, examRes, statsRes] = await Promise.all([
          getSubjects(),
          getExams({ limit: 6 }),
          getGlobalStats().catch(() => null)
        ]);
        const fetchedSubjects = subRes.data?.subjects || subRes.data || [];
        setSubjects(fetchedSubjects);
        setRecentExams(examRes.data?.exams || examRes.data || []);
        
        if (statsRes && statsRes.data) {
          setGlobalStats(statsRes.data);
        }

        // Fetch chapters for all subjects in parallel
        try {
          const chaptersData = await Promise.all(
            fetchedSubjects.map(sub => getChapters(sub.id).catch(() => null))
          );
          const newChaptersMap = {};
          fetchedSubjects.forEach((sub, idx) => {
            const res = chaptersData[idx];
            newChaptersMap[sub.id] = res?.data?.chapters || res?.data || [];
          });
          setChaptersMap(newChaptersMap);
        } catch (chErr) {
          console.error("Error fetching chapters:", chErr);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      getStats()
        .then(sRes => setStats(sRes.data))
        .catch(() => {});
    }
  }, [isLoggedIn, user]);

  return (
    <>
      {/* Hero */}
      <div className="hero">
        <div className="container hero-content-wrapper">
          <div className="hero-text">
            <h1>Học Toán Thông Minh<br/>Chinh Phục Mọi Kỳ Thi</h1>
            <p>Lộ trình học tập cá nhân hoá, kho đề thi phong phú và giải thích chi tiết giúp bạn tiến bộ mỗi ngày.</p>
            <div className="hero-actions">
              <button className="btn btn-accent btn-lg" onClick={() => navigate('/learn')}>
                <BookOpen size={18}/> Bắt đầu học ngay
              </button>
              <button className="btn btn-outline btn-lg" style={{ borderColor:'rgba(255,255,255,.6)', color:'#fff' }} onClick={() => navigate('/exams')}>
                <FileText size={18}/> Xem kho đề thi
              </button>
            </div>
          </div>
          <div className="hero-spline-container">
            <InteractiveMath3D />
          </div>
        </div>
      </div>

      <div className="container">
        {isLoggedIn && (
          <StreakBanner user={user} refreshUser={refreshUser} />
        )}

        {/* Stats bar */}
        {isLoggedIn && stats && (
          <div className="home-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, margin:'24px 0', padding:'20px', background:'var(--bg-card)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-sm)', border:'1px solid var(--border)' }}>
            {[
              { icon:'/streak.png', label:'Streak', value:`${stats.streak || 0} ngày` },
              { icon:'/start.png', label:'Điểm', value: stats.points || 0 },
              { icon:'/da_lam.png', label:'Bài đã làm', value: stats.totalAttempts || 0 },
              { icon:'/da_hoc.png', label:'Bài học xong', value: stats.completedLessons || 0 },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <img src={s.icon} alt={s.label} style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--primary)' }}>{s.value}</div>
                <div style={{ fontSize:'.8rem', color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        <section className="section">
          <div className="home-feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
            {[
              { icon:<BookOpen size={28} color="var(--primary)"/>, title:'Học theo lộ trình', desc:'Từ cơ bản đến nâng cao theo bài học, chuyên đề, bài tập có cấu trúc rõ ràng.', href:'/learn' },
              { icon:<FileText size={28} color="var(--accent)"/>, title:'Kho đề thi', desc:'Hàng trăm đề thi thử THPT, đề kiểm tra học kỳ được cập nhật thường xuyên.', href:'/exams' },
              { icon:<Award size={28} color="#f59e0b"/>, title:'Bảng xếp hạng', desc:'Thi đua cùng bạn bè, leo hạng và nhận phần thưởng khi đạt thành tích cao.', href:'/leaderboard' },
            ].map(f => (
              <div key={f.title} className="card" style={{ cursor:'pointer' }} onClick={() => navigate(f.href)}>
                <div className="card-body">
                  <div style={{ marginBottom:12 }}>{f.icon}</div>
                  <h3 style={{ marginBottom:6 }}>{f.title}</h3>
                  <p style={{ color:'var(--text-muted)', fontSize:'.875rem', marginBottom:16 }}>{f.desc}</p>
                  <span style={{ color:'var(--primary)', fontWeight:700, fontSize:'.875rem', display:'flex', alignItems:'center', gap:4 }}>
                    Khám phá <ArrowRight size={15}/>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subjects */}
        {subjects.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Lớp học</div>
                <div className="section-divider" />
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/learn')}>Xem tất cả</button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 24,
              marginTop: 16
            }}>
              {subjects.map((sub, idx) => {
                // Determine icon and color scheme based on grade/index
                let icon = <BookOpen size={36} style={{ color: '#ff6b6b' }} />;
                let cardBg = 'rgba(255, 107, 107, 0.05)';
                let borderColor = '#ffe3e3';
                let hoverBorder = '#ff6b6b';

                if (idx % 3 === 1) {
                  icon = <Calculator size={36} style={{ color: '#4d7cff' }} />;
                  cardBg = 'rgba(77, 124, 255, 0.05)';
                  borderColor = '#e3ebff';
                  hoverBorder = '#4d7cff';
                } else if (idx % 3 === 2) {
                  icon = <GraduationCap size={36} style={{ color: '#10b981' }} />;
                  cardBg = 'rgba(16, 185, 129, 0.05)';
                  borderColor = '#d1fae5';
                  hoverBorder = '#10b981';
                }

                return (
                  <div 
                    key={sub.id} 
                    onClick={() => navigate(`/learn/${sub.id}`)}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      border: `1.5px solid ${borderColor}`,
                      padding: '32px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    className="grade-card"
                    onMouseEnter={(e) => {
                      setHoveredId(sub.id);
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = hoverBorder;
                      e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      setHoveredId(null);
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = borderColor;
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                    }}
                  >
                    {/* Upper content row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, width: '100%' }}>
                      {/* Circle icon container */}
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: cardBg,
                        flexShrink: 0
                      }}>
                        {icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: 900,
                          color: '#1e293b',
                          marginBottom: 6
                        }}>
                          {sub.name && sub.name.includes('Lớp') ? sub.name.substring(sub.name.indexOf('Lớp')) : `Lớp ${sub.grade}`}
                        </h3>
                        <p style={{
                          fontSize: '0.9rem',
                          color: '#64748b',
                          margin: 0,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <Zap size={14} style={{ color: '#f59e0b' }} />
                          {sub.chapterCount || 0} chuyên đề học tập
                        </p>
                      </div>
                    </div>

                    {/* Chapter list container - visible on hover */}
                    <div style={{
                      maxHeight: hoveredId === sub.id ? '260px' : '0px',
                      opacity: hoveredId === sub.id ? 1 : 0,
                      overflowY: 'auto',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      textAlign: 'left'
                    }}>
                      {chaptersMap[sub.id] && chaptersMap[sub.id].length > 0 ? (
                        <>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Danh sách chuyên đề:
                          </div>
                          {chaptersMap[sub.id].map(ch => (
                            <div 
                              key={ch.id} 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/learn/${sub.id}`);
                              }}
                              style={{
                                fontSize: '0.85rem',
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: '#f8fafc',
                                color: '#334155',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                border: '1px solid #f1f5f9',
                                transition: 'all 0.2s'
                              }}
                              className="chapter-hover-item"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = cardBg;
                                e.currentTarget.style.borderColor = hoverBorder;
                                e.currentTarget.style.color = hoverBorder;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.borderColor = '#f1f5f9';
                                e.currentTarget.style.color = '#334155';
                              }}
                            >
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ch.name || ch.title}
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>
                          Chưa có chuyên đề nào
                        </div>
                      )}
                    </div>

                    {/* Cute floating background shape */}
                    <div style={{
                      position: 'absolute',
                      right: -10,
                      bottom: -10,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: cardBg,
                      opacity: 0.5,
                      pointerEvents: 'none'
                    }} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Global System Stats */}
        {globalStats && (
          <section className="section" style={{ margin: '0', padding: '16px 0' }}>
            <div className="section-header" style={{ marginBottom: 16 }}>
              <div>
                <div className="section-title">TD Math Qua Những Con Số</div>
                <div className="section-divider" style={{ width: 80, height: 4, background: 'var(--primary)', borderRadius: 2, marginTop: 6 }} />
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16
            }}>
              {[
                { 
                  icon: <Users size={28} style={{ color: 'var(--primary)' }} />, 
                  label: 'Thành viên', 
                  value: (globalStats.total_students ?? 0).toLocaleString('vi-VN'),
                  desc: 'Học sinh đang học tập và ôn luyện',
                  color: 'rgba(var(--primary-rgb), 0.1)',
                  textColor: 'var(--primary)'
                },
                { 
                  icon: <FileText size={28} style={{ color: '#f59e0b' }} />, 
                  label: 'Số đề thi', 
                  value: (globalStats.total_exams ?? 0).toLocaleString('vi-VN'),
                  desc: 'Đề kiểm tra, đề thi thử chất lượng cao',
                  color: 'rgba(245, 158, 11, 0.1)',
                  textColor: '#d97706'
                },
                { 
                  icon: <Zap size={28} style={{ color: '#10b981' }} />, 
                  label: 'Số lượt làm bài', 
                  value: (globalStats.total_attempts ?? 0).toLocaleString('vi-VN'),
                  desc: 'Lượt thi thử và luyện tập thành công',
                  color: 'rgba(16, 185, 129, 0.1)',
                  textColor: '#059669'
                }
              ].map((s, idx) => (
                <div 
                  key={idx} 
                  className="stat-card"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = s.textColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: s.color,
                    flexShrink: 0
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.textColor, margin: '4px 0 2px 0', lineHeight: 1.1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent exams */}
        {recentExams.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Đề thi mới nhất</div>
                <div className="section-divider" />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
              {recentExams.map(exam => (
                <div key={exam.id} className="card exam-card" style={{ cursor:'pointer' }} onClick={() => navigate(`/exams/${exam.id}`)}>
                  <div className="card-body exam-card-body">
                    <span className="badge badge-primary" style={{ marginBottom:10 }}>{exam.grade || 'THPT'}</span>
                    <h3 style={{ fontSize:'1rem', marginBottom:8 }}>{exam.title}</h3>
                    <div style={{ display:'flex', alignItems:'center', gap:16, color:'var(--text-muted)', fontSize:'.8rem', marginBottom:12 }}>
                      <span>⏱️ {exam.time_limit_minutes || 90} phút</span>
                      <span>📝 {exam.question_count || 0} câu</span>
                    </div>
                    <button className="btn btn-primary btn-sm exam-card-button" style={{ width:'100%' }}>Làm bài</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {!isLoggedIn && (
          <section className="section">
            <div style={{ background:'linear-gradient(135deg,var(--primary) 0%,#4f46e5 100%)', borderRadius:'var(--radius-lg)', padding:'40px', textAlign:'center', color:'#fff' }}>
              <h2 style={{ color:'#fff', marginBottom:8 }}>Tạo tài khoản miễn phí ngay hôm nay!</h2>
              <p style={{ color:'rgba(255,255,255,.85)', marginBottom:24 }}>Tham gia cùng hàng nghìn học sinh đang học toán hiệu quả trên TD Math.</p>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>Đăng ký ngay</button>
                <button className="btn btn-outline btn-lg" style={{ borderColor:'rgba(255,255,255,.5)', color:'#fff' }} onClick={() => navigate('/login')}>Đăng nhập</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
