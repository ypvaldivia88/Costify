'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    q: '¿Necesito internet para usar Costify?',
    a: 'Tanto la app Android como la web guardan tus datos localmente y funcionan sin conexión después del primer inicio de sesión. La sincronización con la nube requiere internet.',
  },
  {
    q: '¿Cómo activo mi cuenta después de registrarme?',
    a: 'Tras registrarte eliges un plan y contactas por WhatsApp para confirmar el pago. Un administrador activa tu tenant en minutos.',
  },
  {
    q: '¿Puedo tener varios usuarios en mi negocio?',
    a: 'Sí. El administrador del tenant puede crear operadores con acceso limitado según tu suscripción activa.',
  },
  {
    q: '¿Qué monedas soporta la calculadora?',
    a: 'Los costos se expresan en CUP con conversión desde USD, EUR y otras divisas usando tasas TRMI cuando están disponibles.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Los datos se almacenan en MongoDB Atlas con respaldo en la nube. Puedes exportar tu workspace desde Ajustes → Respaldo.',
  },
] as const;

export function MarketingFaq() {
  return (
    <section id="faq" className="page-container py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-brand mb-2 text-center">FAQ</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-center mb-8">
          Preguntas frecuentes
        </h2>

        <Accordion className="w-full">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <AccordionItem key={q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
