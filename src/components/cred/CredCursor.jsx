import { useEffect } from 'react';

export default function CredCursor() {
  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'cred-spotlight';
    document.body.appendChild(el);

    let hideTimer = null;
    function onMove(e) {
      const x = e.clientX;
      const y = e.clientY;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.opacity = '1';
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        el.style.opacity = '0';
      }, 1600);
    }

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (el.parentNode) el.parentNode.removeChild(el);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
