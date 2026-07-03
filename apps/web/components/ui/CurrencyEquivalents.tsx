'use client';

import { useExchangeRatesContext } from '@/hooks/use-exchange-rates-context';
import { formatCurrency } from '@costify/shared/format/currency';

interface CurrencyEquivalentsProps {
  cupAmount: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function CurrencyEquivalents({
  cupAmount,
  className = '',
  size = 'sm',
}: CurrencyEquivalentsProps) {
  const { formatEquivalents } = useExchangeRatesContext();
  const equivalents = formatEquivalents(cupAmount);

  if (!equivalents || cupAmount <= 0) return null;

  return (
    <p
      className={`text-muted tabular-nums ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}
    >
      {formatCurrency(cupAmount)} · {equivalents}
    </p>
  );
}

interface CurrencyEquivalentsOnlyProps {
  cupAmount: number;
  className?: string;
}

/** Solo muestra equivalencias sin repetir el CUP */
export function CurrencyEquivalentsOnly({ cupAmount, className = '' }: CurrencyEquivalentsOnlyProps) {
  const { formatEquivalents } = useExchangeRatesContext();
  const equivalents = formatEquivalents(cupAmount);

  if (!equivalents || cupAmount <= 0) return null;

  return <p className={`text-xs text-muted tabular-nums ${className}`}>{equivalents}</p>;
}
