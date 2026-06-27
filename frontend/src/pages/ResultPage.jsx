import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Home, Trophy, Target, Percent, Star } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

export default function ResultPage() {
  const { examId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;
  const questions = state?.questions || [];
  const { isLoggedIn, user, refreshUser } = useAuth();
  const { alert: showDialogAlert } = useDialog();
  const didRefreshRef = React.useRef(false);

  React.useEffect(() => {
    if (!isLoggedIn || didRefreshRef.current) return;
    didRefreshRef.current = true;

    if (user?.streakStatus === 'warning') {
      refreshUser().then(() => {
        setTimeout(() => {
          showDialogAlert('Chúc mừng! Bạn đã giữ chuỗi học tập thành công! 🔥');
        }, 100);
      });
    } else {
      refreshUser();
    }
  }, [isLoggedIn]);

  if (!result) return (
    <div className="container" style={{ padding:'60px 16px', textAlign:'center' }}>
      <p style={{ color:'var(--text-muted)' }}>Không tìm thấy kết quả</p>
      <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => navigate('/exams')}>Quay lại kho đề</button>
    </div>
  );

  const score = result.attempt?.score ?? result.score ?? 0;
  const correct = result.correct_count ?? result.results?.filter(r => r.isCorrect)?.length ?? 0;
  const total = result.total_questions ?? questions.length;
  const pct = total ? Math.round(correct / total * 100) : 0;
  const pts = result.points_earned ?? 0;

  const grade = score >= 8 ? 'Xuất sắc' : score >= 6.5 ? 'Khá' : score >= 5 ? 'Trung bình' : 'Cần cố gắng';
  const gradeEmoji = score >= 8 ? '🏆' : score >= 6.5 ? '👍' : score >= 5 ? '📚' : '💪';

  // Dark gradient based on grade
  const gradients = {
    'Xuất sắc':  'linear-gradient(135deg, #1e3a5f 0%, #1a4b8c 100%)',
    'Khá':       'linear-gradient(135deg, #1a3a2e 0%, #155e3a 100%)',
    'Trung bình':'linear-gradient(135deg, #3b2200 0%, #6b3a00 100%)',
    'Cần cố gắng':'linear-gradient(135deg, #2d0a0a 0%, #7f1d1d 100%)',
  };
  const scoreColors = {
    'Xuất sắc':  '#60a5fa',
    'Khá':       '#34d399',
    'Trung bình':'#fbbf24',
    'Cần cố gắng':'#f87171',
  };

  const bg = gradients[grade];
  const scoreColor = scoreColors[grade];

  const stats = [
    { icon: Trophy, label: 'Điểm số', value: score.toFixed(1), color: scoreColor },
    { icon: Target,  label: 'Số câu đúng', value: `${correct}/${total}`, color: '#34d399' },
    { icon: Percent, label: 'Tỉ lệ đúng', value: `${pct}%`, color: '#a78bfa' },
    { icon: Star,    label: 'Điểm tích lũy', value: `+${pts}đ`, color: '#fbbf24' },
  ];

  return (
    <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 16px' }}>
      <div style={{ maxWidth:560, width:'100%' }}>

        {/* Score hero card */}
        <div style={{
          background: bg,
          borderRadius:24, padding:'48px 32px', textAlign:'center',
          marginBottom:20, boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontSize:'1.5rem', marginBottom:12 }}>{gradeEmoji}</div>
          <div style={{ fontSize:'5.5rem', fontWeight:900, lineHeight:1, color: scoreColor, textShadow:`0 0 40px ${scoreColor}60` }}>
            {score.toFixed(1)}
          </div>
          <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#fff', marginTop:10 }}>{grade}</div>
          <div style={{ color:'rgba(255,255,255,0.65)', marginTop:6, fontSize:'0.9rem' }}>
            Đúng {correct}/{total} câu · {pct}%
          </div>
        </div>

        {/* Stats grid */}
        <div className="result-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:16, padding:'18px 20px',
              display:'flex', alignItems:'center', gap:14,
            }}>
              <div style={{
                width:40, height:40, borderRadius:10, flexShrink:0,
                background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <s.icon size={20} color={s.color}/>
              </div>
              <div>
                <div style={{ fontSize:'1.3rem', fontWeight:900, color: s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="result-actions" style={{ display:'flex', gap:10 }}>
          <button
            className="btn btn-primary"
            style={{ flex:1, justifyContent:'center', fontWeight:800 }}
            onClick={() => navigate(`/exams/${examId}`)}
          >
            <RotateCcw size={16}/> Làm lại
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex:1, justifyContent:'center', fontWeight:700 }}
            onClick={() => navigate('/exams')}
          >
            <Home size={16}/> Kho đề thi
          </button>
        </div>

      </div>
    </div>
  );
}
