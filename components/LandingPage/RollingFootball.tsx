'use client';

import React, { useEffect } from 'react';

interface RollingFootballProps {
  ballRef: React.RefObject<HTMLDivElement | null>;
}

export default function RollingFootball({ ballRef }: RollingFootballProps) {
  useEffect(() => {
    const positionBall = () => {
      if (!ballRef.current) return;

      const logo = document.querySelector('.nb-logo') as HTMLElement;
      if (logo) {
        const rect = logo.getBoundingClientRect();
        const ballSize = 44; // base size of the element
        // Sit right after the logo, vertically centered on it
        ballRef.current.style.left = `${rect.right + 6}px`;
        ballRef.current.style.top  = `${rect.top + rect.height / 2 - ballSize / 2}px`;
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(positionBall));
    window.addEventListener('resize', positionBall);
    return () => window.removeEventListener('resize', positionBall);
  }, [ballRef]);

  return (
    <div
      ref={ballRef}
      className="fixed z-60 pointer-events-none will-change-transform"
      style={{
        // Fallback position (overridden by useEffect above)
        top: '22px',
        left: '132px',
        width: '44px',
        height: '44px',
        // Start at 0.5 scale — tiny, nestled beside the logo.
        // GSAP scroll timeline will grow it from here.
        transform: 'scale(0.5)',
        transformOrigin: 'center center',
      }}
    >
      {/* Glow halo — subtle at small size, more visible as it grows */}
      <div className="absolute inset-[-6px] bg-[#00d4b6] rounded-full blur-lg opacity-20 animate-pulse" />
      {/* Shadow */}
      <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-7 h-1.5 bg-black/50 blur-sm rounded-full" />
      <img
        src="/football.png"
        alt="MDFLD Match Ball"
        className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(0,212,182,0.4)]"
      />
    </div>
  );
}