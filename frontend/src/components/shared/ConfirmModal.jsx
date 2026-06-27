/**
 * ConfirmModal.jsx
 * Branded Yes/No confirm dialog + Info/Success/Error alert modal.
 * Replaces all native browser alert() and confirm() calls.
 *
 * Props:
 *   show        {boolean}  - whether modal is visible
 *   title       {string}   - modal title
 *   message     {string}   - modal body text
 *   type        {string}   - 'success' | 'error' | 'warning' | 'info'
 *   isAlert     {boolean}  - if true, shows only "Đóng" button (no cancel)
 *   onConfirm   {function} - called when user clicks confirm / "Đóng"
 *   onCancel    {function} - called when user clicks cancel (only if !isAlert)
 *   onClose     {function} - called to reset modal state from parent
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const TYPE_CONFIG = {
  success: {
    icon:       <CheckCircle className="w-6 h-6 text-[#006b58]" />,
    iconBg:     'bg-[#e6fcf4]',
    confirmCls: 'bg-[#006b58] hover:bg-[#005044] text-white',
    confirmTxt: 'Đóng',
  },
  error: {
    icon:       <XCircle className="w-6 h-6 text-rose-600" />,
    iconBg:     'bg-rose-50',
    confirmCls: 'bg-rose-600 hover:bg-rose-700 text-white',
    confirmTxt: 'Đóng',
  },
  warning: {
    icon:       <AlertTriangle className="w-6 h-6 text-amber-500" />,
    iconBg:     'bg-amber-50',
    confirmCls: 'bg-[#8c3315] hover:bg-[#72270e] text-white',
    confirmTxt: 'Xác nhận',
  },
  info: {
    icon:       <Info className="w-6 h-6 text-[#006b58]" />,
    iconBg:     'bg-[#e6fcf4]',
    confirmCls: 'bg-[#006b58] hover:bg-[#005044] text-white',
    confirmTxt: 'Đóng',
  },
};

export default function ConfirmModal({
  show      = false,
  title     = 'Thông báo',
  message   = '',
  type      = 'info',
  isAlert   = false,
  onConfirm = null,
  onCancel  = null,
  onClose,
}) {
  if (!show) return null;

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose)   onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose)  onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#dfc0b7]/50 rounded-[28px] w-full max-w-md shadow-2xl p-6 space-y-5 animate-scaleIn text-left">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center shrink-0`}>
              {cfg.icon}
            </div>
            <h3 className="text-base font-black text-[#241916] leading-snug">{title}</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm font-semibold text-[#57423b] leading-relaxed whitespace-pre-line pl-13">
          {message}
        </p>

        {/* Actions */}
        <div className={`flex gap-3 pt-1 ${isAlert ? 'justify-end' : 'justify-end'}`}>
          {!isAlert && (
            <button
              onClick={handleCancel}
              className="px-5 py-2 rounded-full text-xs font-black border border-[#dfc0b7] text-[#57423b] hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-full text-xs font-black transition-all shadow-sm ${cfg.confirmCls}`}
          >
            {isAlert ? 'Đóng' : cfg.confirmTxt}
          </button>
        </div>
      </div>
    </div>
  );
}
