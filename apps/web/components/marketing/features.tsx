'use client';

import { motion } from 'motion/react';
import { BarChart3, Cloud, Package, Receipt, Smartphone, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const FEATURES = [
  {
    icon: Receipt,
    title: 'Ficha de costos completa',
    description:
      'Materias primas, gastos indirectos, salarios y margen — todo en un solo cálculo con impuestos incluidos.',
  },
  {
    icon: BarChart3,
    title: 'Precio sugerido al instante',
    description:
      'Ajusta margen markup o bruto y ve cómo cambia el precio de venta y la utilidad por unidad.',
  },
  {
    icon: Package,
    title: 'Inventario multi-almacén',
    description:
      'Controla stock, movimientos y alertas de mínimo por almacén desde la misma plataforma.',
  },
  {
    icon: Cloud,
    title: 'Sincronización en la nube',
    description:
      'Trabaja offline en web y Android. Tus datos se guardan en el dispositivo y se sincronizan con MongoDB al volver la conexión.',
  },
  {
    icon: Smartphone,
    title: 'Web y Android offline-first',
    description:
      'Opera en el local sin internet. Instala la web como app (PWA) o usa la APK de Android.',
  },
  {
    icon: Users,
    title: 'Equipos y roles',
    description:
      'Administrador del negocio y operadores con permisos diferenciados según tu plan.',
  },
] as const;

export function MarketingFeatures() {
  return (
    <section id="funciones" className="page-container py-12 md:py-20">
      <div className="max-w-2xl mb-10 md:mb-14">
        <p className="text-sm font-semibold text-brand mb-2">Funciones</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Todo lo que necesitas para fijar precios con confianza
        </h2>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed">
          Diseñado para panaderías, cafeterías, talleres y cualquier MIPYME que necesite saber cuánto
          cobrar sin perder margen.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {FEATURES.map(({ icon: Icon, title, description }, index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Card className="h-full space-y-3 hover:shadow-md transition-shadow">
              <div className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-muted text-brand">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
