'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface CostLine {
  label: string;
  amount: number;
}

const LINES: CostLine[] = [
  { label: 'Harina (2 kg)', amount: 3.2 },
  { label: 'Manteca vegetal', amount: 1.8 },
  { label: 'Mano de obra', amount: 4.5 },
  { label: 'Gastos indirectos', amount: 1.1 },
];

const MARGIN_PERCENT = 35;
const SUBTOTAL = LINES.reduce((sum, line) => sum + line.amount, 0);
const MARGIN = Math.round(SUBTOTAL * (MARGIN_PERCENT / 100) * 100) / 100;
const TOTAL = Math.round((SUBTOTAL + MARGIN) * 100) / 100;

function useCountUp(target: number, active: boolean, durationMs = 800) {
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (reduced) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased * 100) / 100);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, durationMs, reduced, target]);

  return value;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('es', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function CostSheetMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const totalAnimated = useCountUp(TOTAL, inView);

  return (
    <motion.div
      ref={ref}
      className="w-full max-w-md mx-auto lg:mx-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={cn(
          'rounded-sm border border-landing-rule bg-landing-surface shadow-[0_12px_40px_rgba(28,25,23,0.08)]',
          'dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden'
        )}
      >
        <div className="px-5 py-4 border-b border-landing-rule bg-landing-paper/60">
          <p className="text-[10px] uppercase tracking-[0.2em] text-landing-muted font-data">
            Ficha de costo
          </p>
          <h3 className="font-display text-xl text-landing-ink mt-1">Pan de mantequilla</h3>
          <p className="text-xs text-landing-muted mt-0.5">Rendimiento: 24 unidades</p>
        </div>

        <div className="px-5 py-3 space-y-0">
          {LINES.map((line, index) => (
            <motion.div
              key={line.label}
              className="flex items-baseline justify-between gap-4 py-2.5 border-b border-dashed border-landing-rule/80"
              initial={{ opacity: 0, x: -8 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.08, duration: 0.35 }}
            >
              <span className="text-sm text-landing-ink">{line.label}</span>
              <span className="font-data text-sm text-landing-copper tabular-nums">
                {formatUsd(line.amount)}
              </span>
            </motion.div>
          ))}

          <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-dashed border-landing-rule/80">
            <span className="text-sm text-landing-muted">Subtotal materias + mano de obra</span>
            <span className="font-data text-sm text-landing-ink tabular-nums">
              {formatUsd(SUBTOTAL)}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-dashed border-landing-rule/80">
            <span className="text-sm text-landing-muted">
              Margen de ganancia ({MARGIN_PERCENT}%)
            </span>
            <span className="font-data text-sm text-landing-sea tabular-nums">
              {formatUsd(MARGIN)}
            </span>
          </div>
        </div>

        <div className="px-5 py-4 bg-landing-paper/40 border-t border-landing-rule">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-landing-muted font-data">
                Precio sugerido / unidad
              </p>
              <p className="font-display text-3xl text-landing-brand mt-1 tabular-nums">
                {formatUsd(totalAnimated / 24)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.15em] text-landing-muted font-data">
                Lote completo
              </p>
              <p className="font-data text-lg text-landing-copper tabular-nums mt-1">
                {formatUsd(totalAnimated)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
