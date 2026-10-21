import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeToScroll(callback: () => void) {
  window.addEventListener('scroll', callback, { passive: true });
  window.addEventListener('resize', callback);
  return () => {
    window.removeEventListener('scroll', callback);
    window.removeEventListener('resize', callback);
  };
}

function hasScrolledPastFirstScreen() {
  return window.scrollY >= window.innerHeight;
}

/**
 * Mantém os atalhos móveis acima do rodapé e controla o retorno ao topo.
 * A tela cuida do conteúdo; este hook concentra observadores e sua limpeza.
 */
export function useWorkspaceScroll() {
  const showBackToTop = useSyncExternalStore(subscribeToScroll, hasScrolledPastFirstScreen, () => false);
  const footerRef = useRef<HTMLElement>(null);
  const scrollAnimation = useRef<number | null>(null);
  const [footerClearance, setFooterClearance] = useState(0);
  const isFooterVisible = footerClearance > 0;
  const floatingButtonStyle = {
    bottom: `max(calc(1.5rem + env(safe-area-inset-bottom)), ${footerClearance}px)`,
  };

  useEffect(() => {
    const cancelScroll = () => {
      if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
      scrollAnimation.current = null;
    };
    window.addEventListener('wheel', cancelScroll, { passive: true });
    window.addEventListener('touchstart', cancelScroll, { passive: true });
    window.addEventListener('keydown', cancelScroll);
    return () => {
      cancelScroll();
      window.removeEventListener('wheel', cancelScroll);
      window.removeEventListener('touchstart', cancelScroll);
      window.removeEventListener('keydown', cancelScroll);
    };
  }, []);

  const scrollBackToTop = () => {
    document.getElementById('dashboard-content')?.focus({ preventScroll: true });
    if (scrollAnimation.current !== null) cancelAnimationFrame(scrollAnimation.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollAnimation.current = null;
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    const startY = window.scrollY;
    const duration = Math.min(1800, 1200 + startY * 0.15);
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // Curva cosseno: começa devagar e freia gradualmente ao chegar ao topo.
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({ top: startY * (1 - eased), behavior: 'instant' });
      scrollAnimation.current = progress < 1 ? requestAnimationFrame(animate) : null;
    };
    scrollAnimation.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const updatePosition = () => {
      const top = footer.getBoundingClientRect().top;
      setFooterClearance(top < window.innerHeight ? window.innerHeight - top + 16 : 0);
    };
    const observer = new ResizeObserver(updatePosition);
    observer.observe(document.body);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return { showBackToTop, footerRef, isFooterVisible, floatingButtonStyle, scrollBackToTop };
}
