'use client';

/**
 * @file components/Toast.tsx
 * @description Custom branded toast notification — matches #020606 dark theme + #00d4b6 accent
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Added to wishlist', 'wishlist');
 *   showToast('Removed from wishlist', 'remove');
 *   showToast('Something went wrong', 'error');
 *   showToast('Login to save items', 'info');
 *
 *   // In JSX:
 *   <ToastContainer />
 */

import React, { useState, useCallback, useRef } from 'react';
import { Heart, X, AlertCircle, Info } from 'lucide-react';

type ToastType = 'wishlist' | 'remove' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
    leaving: boolean;
}

const ACCENT = '#00d4b6';

const CONFIG: Record<ToastType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    wishlist: {
        icon: <Heart size={14} fill="#ff3c50" color="#ff3c50" />,
        color: '#ff3c50',
        bg: 'rgba(255,60,80,0.08)',
        border: 'rgba(255,60,80,0.25)',
    },
    remove: {
        icon: <Heart size={14} fill="none" color="rgba(255,255,255,0.4)" />,
        color: 'rgba(255,255,255,0.55)',
        bg: 'rgba(255,255,255,0.04)',
        border: 'rgba(255,255,255,0.1)',
    },
    error: {
        icon: <AlertCircle size={14} color="#f87171" />,
        color: '#f87171',
        bg: 'rgba(248,113,113,0.08)',
        border: 'rgba(248,113,113,0.25)',
    },
    info: {
        icon: <Info size={14} color={ACCENT} />,
        color: ACCENT,
        bg: 'rgba(0,212,182,0.08)',
        border: 'rgba(0,212,182,0.25)',
    },
};

let _counter = 0;

export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: number) => {
        // Mark as leaving (triggers exit animation)
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
        // Remove after animation
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timers.current.delete(id);
        }, 350);
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++_counter;
        setToasts(prev => [...prev.slice(-2), { id, message, type, leaving: false }]);

        const timer = setTimeout(() => dismiss(id), 3200);
        timers.current.set(id, timer);
    }, [dismiss]);

    const ToastContainer = useCallback(() => (
        <>
            <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0)   scale(1); }
          to   { opacity: 0; transform: translateY(8px)  scale(0.95); }
        }
        .toast-item {
          animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
        }
        .toast-item.leaving {
          animation: toastOut 0.3s ease forwards;
        }
        .toast-dismiss:hover { opacity: 1 !important; }
      `}</style>
            <div style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'none',
            }}>
                {toasts.map(toast => {
                    const cfg = CONFIG[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`toast-item${toast.leaving ? ' leaving' : ''}`}
                            style={{
                                pointerEvents: 'all',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 16px 10px 14px',
                                background: `rgba(13,21,21,0.96)`,
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: `1px solid ${cfg.border}`,
                                borderLeft: `3px solid ${cfg.color}`,
                                borderRadius: 10,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                minWidth: 220,
                                maxWidth: 320,
                                // Subtle inner glow matching type color
                                backgroundImage: `radial-gradient(ellipse 80% 60% at 0% 50%, ${cfg.bg}, transparent 70%)`,
                            }}
                        >
                            {/* Icon */}
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                {cfg.icon}
                            </div>

                            {/* Message */}
                            <span style={{
                                fontFamily: "'Barlow', sans-serif",
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#fff',
                                flex: 1,
                                lineHeight: 1.3,
                            }}>
                                {toast.message}
                            </span>

                            {/* Dismiss */}
                            <button
                                className="toast-dismiss"
                                onClick={() => dismiss(toast.id)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.3)', opacity: 0.6,
                                    display: 'flex', alignItems: 'center', padding: 2,
                                    transition: 'opacity 0.15s', flexShrink: 0,
                                }}
                                aria-label="Dismiss"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    ), [toasts, dismiss]);

    return { showToast, ToastContainer };
}