import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import axios from '../api/client';
import { useDialog } from '../contexts/DialogContext';

export default function StreakBanner({ user, refreshUser }) {
  const navigate = useNavigate();
  const { alert, confirm } = useDialog();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const { streakStatus, streakCost, activeStreak, streakCount } = user;

  // We only show the banner if status is 'warning' or 'lost'
  if (streakStatus !== 'warning' && streakStatus !== 'lost') {
    return null;
  }

  const handleRestore = async () => {
    const isConfirmed = await confirm(
      `Bạn có muốn dùng ${streakCost} điểm để khôi phục chuỗi học tập 🔥 ${streakCount} ngày không?`
    );
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const res = await axios.post('/users/restore-streak');
      if (res.data?.success) {
        await alert('Khôi phục chuỗi học tập thành công! Tiếp tục duy trì phong độ nhé! 🔥');
        refreshUser();
      } else {
        alert(res.data?.message || 'Có lỗi xảy ra khi khôi phục chuỗi.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không đủ điểm để khôi phục chuỗi học tập.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToExams = () => {
    navigate('/exams');
  };

  return (
    <div className="container" style={{ marginTop: 16, marginBottom: 8 }}>
      {streakStatus === 'warning' && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: '16px',
            padding: '16px 24px',
            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.1), 0 4px 6px -2px rgba(245, 158, 11, 0.05)',
            animation: 'pulse 2s infinite ease-in-out',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                background: '#f59e0b',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)'
              }}
            >
              <Flame size={20} className="animate-bounce" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
                Sắp mất chuỗi học tập!
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', color: '#b45309', fontWeight: 600 }}>
                Bạn đang có chuỗi học tập 🔥 <strong>{activeStreak} ngày</strong>. Hãy hoàn thành 1 bài kiểm tra hôm nay để giữ chuỗi!
              </p>
            </div>
          </div>
          <button 
            onClick={handleGoToExams}
            className="btn btn-primary"
            style={{
              background: '#d97706',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 6px rgba(217, 119, 6, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Sparkles size={16} /> Làm bài kiểm tra ngay
          </button>
        </div>
      )}

      {streakStatus === 'lost' && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fca5a5',
            borderRadius: '16px',
            padding: '16px 24px',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -2px rgba(239, 68, 68, 0.05)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                background: '#ef4444',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, color: '#991b1b', fontSize: '1rem' }}>
                Đã mất chuỗi học tập!
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.875rem', color: '#b91c1c', fontWeight: 600 }}>
                Bạn đã bỏ lỡ ngày học và mất chuỗi học tập (từng đạt 🔥 <strong>{streakCount} ngày</strong>). Bạn hiện có <strong>{user.points} điểm</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={handleRestore}
            disabled={loading}
            className="btn"
            style={{
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { if(!loading) e.currentTarget.style.transform = 'none' }}
          >
            <RotateCcw size={16} /> Khôi phục chuỗi ({streakCost} điểm)
          </button>
        </div>
      )}
    </div>
  );
}
