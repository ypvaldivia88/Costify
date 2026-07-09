'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { WHATSAPP_SUPPORT_URL } from '@costify/shared/domain/subscription';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    question: '¿Funciona sin internet?',
    answer:
      'Sí. La app Android guarda tu inventario y fichas de costo en el dispositivo. Cuando vuelves a tener conexión, sincroniza con la nube automáticamente.',
  },
  {
    question: '¿Cómo pago la suscripción?',
    answer:
      'Después de registrarte, te conectamos por WhatsApp para confirmar el pago en USD. Un administrador activa tu cuenta en cuanto se verifica.',
  },
  {
    question: '¿Puedo usar solo la web?',
    answer:
      'Sí. La versión web tiene las mismas funciones de costos e inventario. La app Android es ideal si trabajas en el local con conexión intermitente.',
  },
  {
    question: '¿Maneja tasas de cambio CUP/USD?',
    answer:
      'Costify integra tasas de referencia para que puedas ver equivalentes al calcular precios. Tú defines los costos en la moneda que uses en tu negocio.',
  },
  {
    question: '¿Hay período de prueba?',
    answer:
      'No hay prueba automática. Puedes escribirnos por WhatsApp antes de registrarte si quieres resolver dudas sobre tu tipo de negocio.',
  },
] as const;

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 sm:px-6 py-16 md:py-20">
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.45 }}
      >
        <p className="font-data text-xs uppercase tracking-[0.2em] text-landing-sea mb-3">
          Preguntas frecuentes
        </p>
        <h2 className="font-display text-3xl sm:text-4xl text-landing-ink leading-tight">
          Dudas antes de empezar
        </h2>
      </motion.div>

      <div className="border-t border-landing-rule">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={item.question} className="border-b border-landing-rule">
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-4 min-h-14 py-4 text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-landing-brand'
                )}
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-display text-lg text-landing-ink">{item.question}</span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-landing-muted shrink-0 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-landing-muted leading-relaxed text-sm sm:text-base">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-landing-muted">
        ¿Otra duda?{' '}
        <a
          href={WHATSAPP_SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-landing-brand font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-brand rounded"
        >
          Escríbenos por WhatsApp
        </a>
      </p>
    </section>
  );
}
