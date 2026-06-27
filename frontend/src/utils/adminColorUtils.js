/**
 * adminColorUtils.js
 * Shared utility for resolving admin accent color palette from adminColor setting.
 * Used by all admin feature components that need theme-aware button/accent colors.
 */

/** Full palette per adminColor option */
const ADMIN_COLOR_PALETTES = {
  original: {
    // Light
    primary:         '#8c3315',
    primaryHover:    '#72270e',
    primaryBg:       '#fff3f0',
    primaryBgHover:  '#fde8e0',
    primaryText:     '#8c3315',
    primaryBorder:   '#f5c4b7',
    primaryLight:    '#fdf5f2',
    // Dark
    primaryDark:     '#e8825a',
    primaryBgDark:   'rgba(232,130,90,0.12)',
    primaryBgDarkHover: 'rgba(232,130,90,0.2)',
  },
  blue: {
    primary:         '#2563eb',
    primaryHover:    '#1d4ed8',
    primaryBg:       '#eff6ff',
    primaryBgHover:  '#dbeafe',
    primaryText:     '#1d4ed8',
    primaryBorder:   '#bfdbfe',
    primaryLight:    '#f0f7ff',
    primaryDark:     '#60a5fa',
    primaryBgDark:   'rgba(96,165,250,0.12)',
    primaryBgDarkHover: 'rgba(96,165,250,0.2)',
  },
  violet: {
    primary:         '#7c3aed',
    primaryHover:    '#6d28d9',
    primaryBg:       '#f5f3ff',
    primaryBgHover:  '#ede9fe',
    primaryText:     '#6d28d9',
    primaryBorder:   '#ddd6fe',
    primaryLight:    '#f8f6ff',
    primaryDark:     '#a78bfa',
    primaryBgDark:   'rgba(167,139,250,0.12)',
    primaryBgDarkHover: 'rgba(167,139,250,0.2)',
  },
  emerald: {
    primary:         '#059669',
    primaryHover:    '#047857',
    primaryBg:       '#ecfdf5',
    primaryBgHover:  '#d1fae5',
    primaryText:     '#047857',
    primaryBorder:   '#a7f3d0',
    primaryLight:    '#f0fdf8',
    primaryDark:     '#34d399',
    primaryBgDark:   'rgba(52,211,153,0.12)',
    primaryBgDarkHover: 'rgba(52,211,153,0.2)',
  },
  rose: {
    primary:         '#e11d48',
    primaryHover:    '#be123c',
    primaryBg:       '#fff1f2',
    primaryBgHover:  '#ffe4e6',
    primaryText:     '#be123c',
    primaryBorder:   '#fecdd3',
    primaryLight:    '#fff5f6',
    primaryDark:     '#fb7185',
    primaryBgDark:   'rgba(251,113,133,0.12)',
    primaryBgDarkHover: 'rgba(251,113,133,0.2)',
  },
  amber: {
    primary:         '#d97706',
    primaryHover:    '#b45309',
    primaryBg:       '#fffbeb',
    primaryBgHover:  '#fef3c7',
    primaryText:     '#b45309',
    primaryBorder:   '#fde68a',
    primaryLight:    '#fffdf0',
    primaryDark:     '#fbbf24',
    primaryBgDark:   'rgba(251,191,36,0.12)',
    primaryBgDarkHover: 'rgba(251,191,36,0.2)',
  },
  cyan: {
    primary:         '#0891b2',
    primaryHover:    '#0e7490',
    primaryBg:       '#ecfeff',
    primaryBgHover:  '#cffafe',
    primaryText:     '#0e7490',
    primaryBorder:   '#a5f3fc',
    primaryLight:    '#f0feff',
    primaryDark:     '#22d3ee',
    primaryBgDark:   'rgba(34,211,238,0.12)',
    primaryBgDarkHover: 'rgba(34,211,238,0.2)',
  },
};

/**
 * Get the resolved accent palette for the current adminColor + adminTheme.
 * @param {string} adminColor - one of 'original','blue','violet','emerald','rose','amber','cyan'
 * @param {string} adminTheme - 'light' | 'dark'
 * @returns {object} - resolved color values
 */
export function getAdminPalette(adminColor = 'original', adminTheme = 'light') {
  const p = ADMIN_COLOR_PALETTES[adminColor] || ADMIN_COLOR_PALETTES.original;
  const isDark = adminTheme === 'dark';
  return {
    isDark,
    // Main CTA button background
    btnBg:       isDark ? p.primaryDark     : p.primary,
    btnHover:    isDark ? p.primaryBgDarkHover : p.primaryHover,
    // Text in accent color
    accentText:  isDark ? p.primaryDark     : p.primaryText,
    // Soft tinted backgrounds (for badges, active states)
    accentBg:    isDark ? p.primaryBgDark   : p.primaryBg,
    accentBgHover: isDark ? p.primaryBgDarkHover : p.primaryBgHover,
    // Borders
    accentBorder: isDark ? 'var(--admin-border)' : p.primaryBorder,
    // Spinner / focus ring color
    accentColor:  isDark ? p.primaryDark    : p.primary,
    // Raw primary value
    primary:      p.primary,
  };
}
