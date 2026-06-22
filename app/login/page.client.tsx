'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Calculator, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const next = searchParams.get('next');
      if (user.role === 'super_admin') {
        router.replace('/admin');
        return;
      }
      router.replace(next && next !== '/login' ? next : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg grid-pattern text-foreground flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          className="w-full max-w-[420px] space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center space-y-4">
            <motion.div
              className="mx-auto relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mx-auto w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-glow">
                <Calculator className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-brand-light rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="w-3 h-3 text-brand-foreground" />
              </div>
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gradient-brand">Costify</h1>
              <p className="text-sm text-muted max-w-xs mx-auto leading-relaxed">
                Inicia sesión para gestionar tu negocio con precisión
              </p>
            </div>
          </div>

          <motion.div
            className="glass rounded-3xl p-6 sm:p-8 shadow-float"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
              />
              <Input
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {error && (
                <motion.p
                  className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {error}
                </motion.p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? 'Entrando…' : 'Iniciar sesión'}
              </Button>
            </form>
          </motion.div>

          <p className="text-center text-xs text-muted">
            Calculadora de costos para MIPYME en Cuba
          </p>
        </motion.div>
      </div>
    </div>
  );
}
