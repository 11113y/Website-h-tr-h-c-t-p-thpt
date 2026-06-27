/**
 * AdminSidebar.jsx
 * Fixed left navigation sidebar for the Admin panel.
 * Purely presentational — receives all data via props.
 *
 * Props:
 *   activeTab    {string}   - current active tab id
 *   onNavigate   {function} - callback(tabId: string)
 *   currentUser  {object}   - { name, email, avatarUrl, role }
 *   onLogout     {function} - logout callback
 *   navItems     {Array}    - [{ id, label, icon }]
 *   adminTheme   {string}   - 'light' | 'dark'
 *   adminColor   {string}   - 'original' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan'
 */

import React, { useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';

/** Map adminColor → accent palette */
const COLOR_MAP = {
  original: {
    text:        '#8c3315',
    textDark:    '#e8825a',
    bg:          '#fff3f0',
    bgDark:      'rgba(232,130,90,0.12)',
    badge:       '#8c3315',
    badgeDark:   '#c0552b',
    border:      '#f5c4b7',
    borderDark:  '#5a2e1a',
  },
  blue: {
    text:        '#1d4ed8',
    textDark:    '#60a5fa',
    bg:          '#eff6ff',
    bgDark:      'rgba(96,165,250,0.12)',
    badge:       '#1d4ed8',
    badgeDark:   '#2563eb',
    border:      '#bfdbfe',
    borderDark:  '#1e3a5f',
  },
  violet: {
    text:        '#6d28d9',
    textDark:    '#a78bfa',
    bg:          '#f5f3ff',
    bgDark:      'rgba(167,139,250,0.12)',
    badge:       '#6d28d9',
    badgeDark:   '#7c3aed',
    border:      '#ddd6fe',
    borderDark:  '#2e1a5a',
  },
  emerald: {
    text:        '#047857',
    textDark:    '#34d399',
    bg:          '#ecfdf5',
    bgDark:      'rgba(52,211,153,0.12)',
    badge:       '#047857',
    badgeDark:   '#059669',
    border:      '#a7f3d0',
    borderDark:  '#0a3d2a',
  },
  rose: {
    text:        '#be123c',
    textDark:    '#fb7185',
    bg:          '#fff1f2',
    bgDark:      'rgba(251,113,133,0.12)',
    badge:       '#be123c',
    badgeDark:   '#e11d48',
    border:      '#fecdd3',
    borderDark:  '#4a0f1f',
  },
  amber: {
    text:        '#b45309',
    textDark:    '#fbbf24',
    bg:          '#fffbeb',
    bgDark:      'rgba(251,191,36,0.12)',
    badge:       '#b45309',
    badgeDark:   '#d97706',
    border:      '#fde68a',
    borderDark:  '#4a3010',
  },
  cyan: {
    text:        '#0e7490',
    textDark:    '#22d3ee',
    bg:          '#ecfeff',
    bgDark:      'rgba(34,211,238,0.12)',
    badge:       '#0e7490',
    badgeDark:   '#0891b2',
    border:      '#a5f3fc',
    borderDark:  '#083344',
  },
};

export default function AdminSidebar({ activeTab, onNavigate, currentUser, onLogout, navItems, adminTheme, adminColor }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isDark = adminTheme === 'dark';

  // Resolve accent palette based on selected color
  const palette = COLOR_MAP[adminColor] || COLOR_MAP.original;
  const accentText   = isDark ? palette.textDark   : palette.text;
  const accentBg     = isDark ? palette.bgDark      : palette.bg;
  const accentBadge  = isDark ? palette.badgeDark   : palette.badge;

  return (
    <aside
      className="w-64 h-screen sticky top-0 flex flex-col justify-between p-5 shrink-0 z-20 shadow-sm"
      style={{
        backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff',
        borderRight: isDark ? '1px solid var(--admin-border)' : '1px solid rgba(223, 192, 183, 0.4)',
      }}
    >

      {/* Top: logo + nav */}
      <div className="space-y-8">

        {/* Logo */}
        <div className="flex items-center gap-3 pl-1">
          <img src="/logo.png" alt="HIMA Logo" className="w-10 h-10 object-contain" />
          <div className="text-left">
            <h1
              className="text-base font-black tracking-tight leading-none"
              style={{ color: accentText }}
            >
              HIMA TEST
            </h1>
            <span
              className="inline-block mt-1 text-white font-extrabold text-[8px] px-2 py-0.5 rounded uppercase tracking-widest scale-95 origin-left"
              style={{ backgroundColor: accentBadge }}
            >
              ADMIN
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-left">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-xs transition-all uppercase tracking-wider"
                style={
                  isActive
                    ? {
                        backgroundColor: accentBg,
                        color: accentText,
                      }
                    : {
                        color: isDark ? 'var(--admin-text-muted)' : '#57423b',
                        backgroundColor: 'transparent',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = isDark ? 'var(--admin-surface-dim)' : '#f9fafb';
                    e.currentTarget.style.color = accentText;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = isDark ? 'var(--admin-text-muted)' : '#57423b';
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: unified options avatar trigger */}
      <div
        className="relative flex justify-start pt-4 w-full"
        style={{ borderTop: isDark ? '1px solid var(--admin-border)' : '1px solid rgba(223, 192, 183, 0.2)' }}
      >

        {/* Popover / Options Menu */}
        {showDropdown && (
          <div
            className="absolute bottom-16 left-0 p-2 rounded-2xl shadow-xl flex flex-col items-center gap-2 animate-slideUp z-30"
            style={{
              backgroundColor: isDark ? 'var(--admin-surface)' : '#ffffff',
              border: isDark ? '1px solid var(--admin-border)' : '1px solid rgba(223, 192, 183, 0.4)',
            }}
          >
            {/* Profile option */}
            <button
              onClick={() => {
                onNavigate('profile');
                setShowDropdown(false);
              }}
              title="Trang cá nhân"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === 'profile' ? accentBg : 'transparent',
                color: activeTab === 'profile' ? accentText : (isDark ? 'var(--admin-text-muted)' : '#6b7280'),
              }}
            >
              <User size={18} className="stroke-[2.5]" />
            </button>

            {/* Cấu hình option */}
            <button
              onClick={() => {
                onNavigate('settings');
                setShowDropdown(false);
              }}
              title="Cấu hình hệ thống"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: activeTab === 'settings' ? accentBg : 'transparent',
                color: activeTab === 'settings' ? accentText : (isDark ? 'var(--admin-text-muted)' : '#6b7280'),
              }}
            >
              <Settings size={18} className="stroke-[2.5]" />
            </button>

            {/* Đăng xuất option */}
            <button
              onClick={() => {
                onLogout();
                setShowDropdown(false);
              }}
              title="Đăng xuất"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ color: isDark ? 'var(--admin-text-muted)' : '#6b7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#2d1a1d' : '#fff1f2';
                e.currentTarget.style.color = '#e11d48';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = isDark ? 'var(--admin-text-muted)' : '#6b7280';
              }}
            >
              <LogOut size={18} className="stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Trigger Avatar Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center gap-3 p-1.5 rounded-2xl transition-all cursor-pointer focus:outline-none"
          style={{
            border: showDropdown
              ? (isDark ? '1px solid var(--admin-border)' : `1px solid ${palette.border}`)
              : '1px solid transparent',
            backgroundColor: showDropdown
              ? (isDark ? 'var(--admin-surface-dim)' : accentBg)
              : 'transparent',
          }}
          title="Tài khoản & Cấu hình"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full object-cover shadow-inner shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner shrink-0"
              style={{
                border: isDark ? '1px solid var(--admin-border)' : '1px solid rgba(223, 192, 183, 0.5)',
                backgroundColor: isDark ? 'var(--admin-surface-dim)' : '#ffffff',
                color: isDark ? 'var(--admin-text-muted)' : '#8b716a',
              }}
            >
              <User size={18} className="stroke-[1.5]" />
            </div>
          )}

          <div className="text-left min-w-0 flex-1">
            <p
              className="text-xs font-black truncate"
              style={{ color: isDark ? 'var(--admin-text-secondary)' : '#57423b' }}
            >
              {currentUser?.name || 'Admin'}
            </p>
            {currentUser?.email && (
              <p
                className="text-[10px] truncate font-semibold"
                style={{ color: isDark ? 'var(--admin-text-muted)' : '#9ca3af' }}
              >
                {currentUser.email}
              </p>
            )}
          </div>
        </button>

      </div>
    </aside>
  );
}
