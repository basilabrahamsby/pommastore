'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis with high-velocity, rapid-response settings
    const lenis = new Lenis({
      lerp: 0.25, // Fast linear interpolation (near native speed, frictionless)
      wheelMultiplier: 1.6, // Strong sensitivity multiplier for rapid scroll distance per tick
      touchMultiplier: 1.8,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    lenisRef.current = lenis;
    
    // Expose globally for debugging or external access if needed
    (window as any).lenis = lenis;

    let rafId: number;

    // Request Animation Frame Loop
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Cleanup on unmount to prevent event leaks and stop runaway loops
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      (window as any).lenis = null;
    };
  }, []);

  // Crucial: Listen to route changes to instantly recalibrate scroll metrics
  useEffect(() => {
    if (lenisRef.current) {
      // Reset scroll immediately upon entering a new route
      lenisRef.current.scrollTo(0, { immediate: true });
      
      // Fire a resize refresh slightly after DOM paints the new content 
      const timer = setTimeout(() => {
        lenisRef.current?.resize();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
