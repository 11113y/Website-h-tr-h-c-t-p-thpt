import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Flame, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ by_points: [], by_streak: [] });
  const [activeTab, setActiveTab] = useState('points'); // 'points' or 'streak'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(res => {
        setData({
          by_points: res.data?.by_points || [],
          by_streak: res.data?.by_streak || []
        });
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const list = activeTab === 'points' ? data.by_points : data.by_streak;

  const rankBadge = (i) => {
    if (i === 0) return { icon: '🥇', cls: 'gold' };
    if (i === 1) return { icon: '🥈', cls: 'silver' };
    if (i === 2) return { icon: '🥉', cls: 'bronze' };
    return { icon: String(i + 1), cls: '' };
  };

  return (
    <div className="container" style={{ maxWidth: 700, padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Trophy size={48} color="var(--warning)" style={{ margin: '0 auto 12px' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Bảng Xếp Hạng</h1>
        <p style={{ color: 'var(--text-muted)' }}>Top học sinh xuất sắc nhất hệ thống</p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--bg-alt, #f1f5f9)', 
        padding: 4, 
        borderRadius: 12, 
        marginBottom: 24,
        gap: 4
      }}>
        <button
          onClick={() => setActiveTab('points')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'points' ? '#fff' : 'transparent',
            color: activeTab === 'points' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'points' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Award size={16} />
          Theo điểm số
        </button>
        <button
          onClick={() => setActiveTab('streak')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'streak' ? '#fff' : 'transparent',
            color: activeTab === 'streak' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'streak' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Flame size={16} />
          Chuỗi ngày học (Streak)
        </button>
      </div>

      <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="page-loading" style={{ padding: '40px 0' }}><div className="spinner" /></div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Chưa có dữ liệu xếp hạng
            </div>
          ) : (
            list.map((entry, i) => {
              const rank = rankBadge(i);
              const isMe = user && entry.id === user.id;
              const initial = (entry.username || '?')[0].toUpperCase();

              return (
                <div 
                  key={entry.id || i} 
                  className="lb-row" 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isMe ? 'var(--primary-light)' : undefined,
                    transition: 'background 0.2s ease'
                  }}
                >
                  <div className={`lb-rank ${rank.cls}`} style={{ 
                    fontSize: i < 3 ? '1.3rem' : '.95rem',
                    fontWeight: 800,
                    width: 32,
                    textAlign: 'center'
                  }}>
                    {rank.icon}
                  </div>
                  <div className="avatar avatar-md" style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: isMe ? 'var(--primary)' : 'var(--bg-alt, #e2e8f0)',
                    color: isMe ? '#fff' : 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem' }}>
                      {entry.username}
                      {isMe && <span className="badge badge-primary" style={{ fontSize: '.7rem', padding: '2px 6px' }}>Bạn</span>}
                    </div>
                    <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Flame size={12} color="var(--accent)" /> {entry.streak_count || 0} ngày streak
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {(entry.points || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>điểm</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
