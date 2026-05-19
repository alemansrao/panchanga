import { useRef } from 'react';
import { motion } from 'motion/react';

export default function CredCard({ children, className = '', onClick, title }) {
  const ref = useRef(null);

  function handlePointerMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = -y * 6;
    const ry = x * 10;
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    el.style.transition = 'transform 120ms ease';
  }

  function handlePointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      className={`cred-card ${className}`}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      {title ? <div className="text-xs cred-subtle mb-2">{title}</div> : null}
      {children}
    </motion.div>
  );
}
