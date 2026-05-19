import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function CredHero({ title = 'Panchanga Live', subtitle = 'Ancient calendar • premium UI demo' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.45]);

  return (
    <section ref={ref} className="py-12">
      <div className="max-w-5xl mx-auto text-center">
        <motion.h1
          className="cred-hero-title"
          style={{ y, opacity }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {title}
        </motion.h1>
        <motion.p className="mt-4 cred-subtle max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {subtitle}
        </motion.p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <motion.div whileHover={{ scale: 1.02 }}>
            <button className="cred-button cred-cta">Get Started</button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
