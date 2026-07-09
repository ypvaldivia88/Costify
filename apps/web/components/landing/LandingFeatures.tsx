'use client';

import { motion } from 'motion/react';

const FEATURES = [
  {
    title: 'Ficha de costo clara',
    detail: 'Materias primas, mano de obra e indirectos en una sola vista — sin hojas sueltas.',
    value: 'Precisión',
  },
  {
    title: 'Inventario y almacenes',
    detail: 'Controla entradas, salidas y stock mínimo antes de que falte mercancía.',
    value: 'Control',
  },
  {
    title: 'Funciona sin internet',
    detail: 'La app Android guarda tus datos localmente y sincroniza cuando hay conexión.',
    value: 'Offline',
  },
] as const;

export function LandingFeatures() {
  return (
    <section id="beneficios" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20">
      <motion.div
        className="mb-10 md:mb-14 max-w-2xl"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.45 }}
      >
        <p className="font-data text-xs uppercase tracking-[0.2em] text-landing-sea mb-3">
          Lo que resuelve
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-landing-ink leading-tight">
          Tu libreta de costos, digital y al día
        </h2>
      </motion.div>

      <div className="max-w-3xl">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="ledger-row"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5% 0px' }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
          >
            <div>
              <h3 className="font-display text-xl text-landing-ink">{feature.title}</h3>
              <p className="text-landing-muted mt-1.5 text-sm sm:text-base leading-relaxed">
                {feature.detail}
              </p>
            </div>
            <span className="font-data text-xs uppercase tracking-wider text-landing-copper shrink-0">
              {feature.value}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
