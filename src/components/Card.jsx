
import { motion, AnimatePresence } from "motion/react";

const SPAN_CLASSES = {
  1: 'col-span-1',
  2: 'md:col-span-2'
};

const Card = ({
  title,
  name,
  meta,
  times,
  Icon,
  iconKey,
  progress,
  barColor = 'bg-emerald-400',
  span = '1'
}) => {
  const spanKey = Number(span);
  const spanClass = SPAN_CLASSES[spanKey] ?? 'col-span-1';

  const pct = Number.isFinite(Number(progress)) ? Math.max(0, Math.min(100, Number(progress))) : 0;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 ${spanClass}`}>
      <div className="text-xs text-gray-400 flex flex-row items-center gap-1 justify-between">
        <span>{title}</span>

        <div
          className="relative"
          style={{ width: 20, height: 20 }}
          aria-hidden
        >
          <AnimatePresence mode="sync" initial={false}>
            {Icon ? (
              <motion.span
                key={iconKey || 'icon'}
                style={{ position: 'absolute', inset: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                animate={prefersReduced ? { opacity: 1 } : { opacity: 1 }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                transition={{
                  duration: 0.28,
                  ease: 'easeInOut'
                }}
              >
                <Icon className="w-4 h-4 text-gray-100" />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="font-semibold text-lg mt-1">{name}</div>
      {meta ? <div className="text-xs text-gray-400 mt-1">{meta}</div> : null}
      {times ? <div className="text-xs text-gray-400 mt-2">{times}</div> : null}

      <div className="mt-3">
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-2 ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Card;
