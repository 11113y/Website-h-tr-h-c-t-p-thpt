import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AlertCircle, HelpCircle, Edit } from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    title: '',
    message: '',
    defaultValue: '',
    resolve: null,
  });

  const [promptValue, setPromptValue] = useState('');
  const [toasts, setToasts] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (dialogState.isOpen && dialogState.type === 'prompt') {
      setPromptValue(dialogState.defaultValue || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [dialogState.isOpen, dialogState.type, dialogState.defaultValue]);

  const toast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const alert = (message, title = 'Thông báo') => {
    const lowerMessage = (message || '').toLowerCase();
    const lowerTitle = (title || '').toLowerCase();
    const isError = lowerMessage.includes('lỗi') || 
                    lowerMessage.includes('không thể') || 
                    lowerMessage.includes('thất bại') || 
                    lowerMessage.includes('error') || 
                    lowerTitle.includes('lỗi') || 
                    lowerTitle.includes('error');
    
    toast(message, isError ? 'error' : 'success');
    return Promise.resolve(true);
  };

  const confirm = (message, title = 'Xác nhận') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        defaultValue: '',
        resolve,
      });
    });
  };

  const prompt = (message, defaultValue = '', title = 'Nhập thông tin') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        defaultValue,
        resolve,
      });
    });
  };

  const handleClose = (confirmed) => {
    const { resolve, type } = dialogState;
    setDialogState({ isOpen: false, type: 'alert', title: '', message: '', defaultValue: '', resolve: null });
    
    if (resolve) {
      if (type === 'prompt') {
        resolve(confirmed ? promptValue : null);
      } else {
        resolve(confirmed);
      }
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt, toast }}>
      {children}
      {dialogState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '90%',
            maxWidth: 420,
            padding: 28,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            transform: 'scale(1)',
            animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: dialogState.type === 'confirm' 
                  ? 'var(--primary-light)' 
                  : dialogState.type === 'prompt' 
                    ? 'var(--warning-light)' 
                    : 'var(--accent-light)',
                color: dialogState.type === 'confirm' 
                  ? 'var(--primary)' 
                  : dialogState.type === 'prompt' 
                    ? 'var(--warning)' 
                    : 'var(--accent)',
              }}>
                {dialogState.type === 'confirm' ? (
                  <HelpCircle size={28} />
                ) : dialogState.type === 'prompt' ? (
                  <Edit size={28} />
                ) : (
                  <AlertCircle size={28} />
                )}
              </div>
              
              <div style={{ width: '100%' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  {dialogState.title}
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>
                  {dialogState.message}
                </p>
                
                {dialogState.type === 'prompt' && (
                  <input
                    ref={inputRef}
                    type="text"
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    className="form-control"
                    style={{
                      textAlign: 'left',
                      borderRadius: 12,
                      border: '1.5px solid var(--border)',
                      padding: '10px 14px',
                      fontSize: '0.95rem'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleClose(true);
                      } else if (e.key === 'Escape') {
                        handleClose(false);
                      }
                    }}
                  />
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 12, 
                width: '100%', 
                marginTop: 8 
              }}>
                {dialogState.type !== 'alert' && (
                  <button 
                    className="btn btn-ghost" 
                    style={{ flex: 1, height: 42, borderRadius: 12, fontWeight: 700 }}
                    onClick={() => handleClose(false)}
                  >
                    Hủy bỏ
                  </button>
                )}
                <button 
                  className={dialogState.type === 'confirm' 
                    ? "btn btn-primary" 
                    : dialogState.type === 'prompt' 
                      ? "btn btn-accent" 
                      : "btn btn-accent"}
                  style={{ flex: 1, height: 42, borderRadius: 12, fontWeight: 700 }}
                  onClick={() => handleClose(true)}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.92); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Toast notifications container fixed top right */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div 
            key={t.id}
            style={{
              pointerEvents: 'auto',
              background: t.type === 'error' ? '#fef2f2' : t.type === 'warning' ? '#fffbeb' : '#ecfdf5',
              border: `1px solid ${t.type === 'error' ? '#fecaca' : t.type === 'warning' ? '#fde68a' : '#a7f3d0'}`,
              color: t.type === 'error' ? '#991b1b' : t.type === 'warning' ? '#92400e' : '#065f46',
              padding: '12px 20px',
              borderRadius: 14,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 280,
              maxWidth: 400,
              animation: 'toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: t.type === 'error' ? '#ef4444' : t.type === 'warning' ? '#f59e0b' : '#10b981'
            }} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
