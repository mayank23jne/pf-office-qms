import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '450px',
        padding: '14px 20px',
        borderRadius: '10px',
        background: isSuccess
          ? '#f0fdf4'
          : isError
          ? '#fef2f2'
          : '#eff6ff',
        border: isSuccess
          ? '1px solid #86efac'
          : isError
          ? '1px solid #fca5a5'
          : '1px solid #93c5fd',
        boxShadow: isSuccess
          ? '0 10px 25px rgba(22, 163, 74, 0.15)'
          : isError
          ? '0 10px 25px rgba(220, 38, 38, 0.15)'
          : '0 10px 25px rgba(29, 78, 216, 0.15)',
        color: isSuccess
          ? '#15803d'
          : isError
          ? '#b91c1c'
          : '#1e40af',
        fontWeight: 700,
        fontSize: '0.92rem',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {isSuccess && <CheckCircle2 size={22} style={{ color: '#16a34a' }} />}
        {isError && <AlertCircle size={22} style={{ color: '#dc2626' }} />}
        {!isSuccess && !isError && <CheckCircle2 size={22} style={{ color: '#1d4ed8' }} />}
      </div>
      <div style={{ flex: 1, lineHeight: '1.4' }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: isSuccess ? '#15803d' : isError ? '#b91c1c' : '#1e40af',
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
