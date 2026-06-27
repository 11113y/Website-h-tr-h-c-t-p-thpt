import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const location = useLocation();

  // Detect OS preference
  const getOSTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return 'light';
  };

  const [studentTheme, setStudentThemeState] = useState(() => {
    return localStorage.getItem('student-theme') || getOSTheme();
  });

  const [adminTheme, setAdminThemeState] = useState(() => {
    return localStorage.getItem('admin-theme') || getOSTheme();
  });

  const [studentColor, setStudentColorState] = useState(() => {
    return localStorage.getItem('student-color') || 'original';
  });

  const [adminColor, setAdminColorState] = useState(() => {
    return localStorage.getItem('admin-color') || 'original';
  });

  const setStudentTheme = (theme) => {
    setStudentThemeState(theme);
    localStorage.setItem('student-theme', theme);
  };

  const setStudentColor = (color) => {
    setStudentColorState(color);
    localStorage.setItem('student-color', color);
  };

  const setAdminTheme = (theme) => {
    setAdminThemeState(theme);
    localStorage.setItem('admin-theme', theme);
  };

  const setAdminColor = (color) => {
    setAdminColorState(color);
    localStorage.setItem('admin-color', color);
  };

  // Determine active theme and color based on path
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAuthPath = location.pathname === '/login' || location.pathname === '/register';
  const theme = isAuthPath ? 'light' : (isAdminPath ? adminTheme : studentTheme);
  const color = isAuthPath ? 'original' : (isAdminPath ? adminColor : studentColor);

  const toggleTheme = () => {
    if (isAdminPath) {
      setAdminTheme(adminTheme === 'light' ? 'dark' : 'light');
    } else {
      setStudentTheme(studentTheme === 'light' ? 'dark' : 'light');
    }
  };

  // Sync with document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync admin theme independently so we can scope admin dark mode CSS separately
  useEffect(() => {
    document.documentElement.setAttribute('data-admin-theme', adminTheme);
  }, [adminTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', color);
  }, [color]);

  // Listen to OS theme changes if no theme is explicitly set in localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const systemTheme = e.matches ? 'dark' : 'light';
      if (!localStorage.getItem('student-theme')) {
        setStudentThemeState(systemTheme);
      }
      if (!localStorage.getItem('admin-theme')) {
        setAdminThemeState(systemTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        color,
        toggleTheme,
        studentTheme,
        setStudentTheme,
        studentColor,
        setStudentColor,
        adminTheme,
        setAdminTheme,
        adminColor,
        setAdminColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
