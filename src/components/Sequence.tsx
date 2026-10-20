import { motion } from 'framer-motion';
import { useUI } from '../store';

/** An animated vertical flowchart of ordered steps (atonement "how salvation works", end-times order). */
export default function Sequence({ steps, color, title }: { steps: string[]; color?: string; title?: string }) {
  const reduced = useUI((s) => s.reducedMotion);
  const c = color ?? 'rgb(var(--accent))';
  return (
    <div className="card p-4 h-full">
      {title && <div className="display text-xl mb-3" style={{ color: c }}>{title}</div>}
      <ol className="flex flex-col items-stretch">
        {steps.map((s, i) => (
          <motion.li key={i} className="flex flex-col items-center" initial={{ opacity: 0.5, y: reduced ? 0 : -6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: reduced ? 0 : i * 0.18 }}>
            {i > 0 && <motion.span className="w-0.5 h-5" style={{ background: c }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ delay: reduced ? 0 : i * 0.18 - 0.08 }} />}
            {i > 0 && <span className="-mt-1 mb-0.5 text-[10px] leading-none" style={{ color: c }}>▼</span>}
            <span className="w-full rounded border px-3 py-2 text-[.9rem] font-serif text-center bg-surface" style={{ borderColor: c }}>
              <span className="tabular text-xs mr-1.5 opacity-70">{i + 1}</span>{s}
            </span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
