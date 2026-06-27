import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, BookOpen, Award, FileText, Users, LogOut, User, Settings, LayoutDashboard, Menu, X, ChevronDown, Bookmark, Folder, MessageSquare } from 'lucide-react';

export default function AppHeader() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleLogout = () => { logout(); navigate('/'); setUserMenuOpen(false); };
  const handleSearch = (e) => { e.preventDefault(); if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`); };

  const navLinks = [
    { to: '/', label: 'Trang chủ', end: true },
    { to: '/learn', label: 'Học tập' },
    { to: '/exams', label: 'Đề thi' },
    { to: '/grapher', label: 'Vẽ đồ thị' },
    { to: '/formulas', label: 'Kho công thức' },
    { to: '/blog', label: 'Blog' },
    { to: '/leaderboard', label: 'Bảng xếp hạng' },
  ];

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : 'U';

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <NavLink to="/" className="header-logo">
          <div className="header-logo-icon">📐</div>
          <span>TD Math</span>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="header-nav">
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => isActive ? 'active' : ''}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <form className="header-search" onSubmit={handleSearch} style={{ marginLeft: 'auto' }}>
          <Search size={15} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bài học..." />
        </form>

        {/* Auth actions */}
        <div className="header-actions">
          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 12px', borderRadius:'var(--radius-full)', cursor:'pointer', fontWeight:700 }}
              >
                <div className="avatar avatar-sm" style={{ background:'#fff', color:'var(--primary)', fontSize:'.7rem' }}>{initials}</div>
                <span style={{ fontSize:'.875rem' }}>{user?.name?.split(' ').slice(-1)[0]}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <>
                  <div onClick={() => setUserMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:999 }} />
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', border:'1px solid var(--border)', minWidth:200, zIndex:1000, overflow:'hidden', animation:'slideUp .15s ease' }}>
                    <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                      <div style={{ fontWeight:800, color:'var(--text)' }}>{user?.name}</div>
                      <div style={{ fontSize:'.8rem', color:'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    {[
                      { icon: <User size={15}/>, label:'Hồ sơ', to:'/profile' },
                      { icon: <Bookmark size={15}/>, label:'Câu hỏi đã lưu', to:'/saved-questions' },
                      { icon: <Folder size={15}/>, label:'Bộ sưu tập', to:'/collections' },
                      { icon: <MessageSquare size={15}/>, label:'Góp ý & phản hồi', to:'/feedback' },
                      ...(isAdmin ? [{ icon: <LayoutDashboard size={15}/>, label:'Quản trị', to:'/admin' }] : []),
                    ].map(item => (

                      <button key={item.to} onClick={() => { navigate(item.to); setUserMenuOpen(false); }}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', width:'100%', background:'none', border:'none', cursor:'pointer', color:'var(--text)', fontWeight:600, fontSize:'.875rem', transition:'background var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                    <button onClick={handleLogout}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', width:'100%', background:'none', border:'none', cursor:'pointer', color:'var(--danger)', fontWeight:600, fontSize:'.875rem', borderTop:'1px solid var(--border)' }}>
                      <LogOut size={15}/>Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.4)' }} onClick={() => navigate('/login')}>Đăng nhập</button>
              <button className="btn btn-accent btn-sm" onClick={() => navigate('/register')}>Đăng ký</button>
            </>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="mobile-menu-toggle"
            aria-label={menuOpen ? 'Dong menu' : 'Mo menu'}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--primary-dark)', padding:'12px 20px', display:'flex', flexDirection:'column', gap:4, zIndex:999 }}>
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)}
              style={{ padding:'10px 12px', color:'rgba(255,255,255,.9)', fontWeight:600, borderRadius:'var(--radius-sm)', fontSize:'.9rem' }}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
