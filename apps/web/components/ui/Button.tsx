import { cn } from '@/lib/utils';
import type { ComponentProps, ReactElement } from 'react';
import { ShadcnButton, shadcnButtonVariants } from '@/components/ui/shadcn-button';

type LegacyVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type LegacySize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ComponentProps<typeof ShadcnButton>, 'variant' | 'size'> {
  variant?: LegacyVariant | ComponentProps<typeof ShadcnButton>['variant'];
  size?: LegacySize | ComponentProps<typeof ShadcnButton>['size'];
  asChild?: boolean;
}

const variantMap: Record<LegacyVariant, ComponentProps<typeof ShadcnButton>['variant']> = {
  primary: 'default',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
  outline: 'outline',
};

const sizeMap: Record<LegacySize, ComponentProps<typeof ShadcnButton>['size']> = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

function resolveVariant(variant: ButtonProps['variant']) {
  if (!variant) return 'default' as const;
  if (variant in variantMap) return variantMap[variant as LegacyVariant];
  return variant as ComponentProps<typeof ShadcnButton>['variant'];
}

function resolveSize(size: ButtonProps['size']) {
  if (!size) return 'default' as const;
  if (size in sizeMap) return sizeMap[size as LegacySize];
  return size as ComponentProps<typeof ShadcnButton>['size'];
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild,
  children,
  ...props
}: ButtonProps) {
  const resolvedVariant = resolveVariant(variant);
  const resolvedSize = resolveSize(size);
  const classes = cn(
    resolvedVariant === 'default' && 'bg-brand-gradient shadow-glow hover:brightness-110',
    className
  );

  if (asChild && children && typeof children === 'object' && 'type' in (children as ReactElement)) {
    return (
      <ShadcnButton
        variant={resolvedVariant}
        size={resolvedSize}
        className={classes}
        render={children as ReactElement}
        nativeButton={false}
        {...props}
      />
    );
  }

  return (
    <ShadcnButton variant={resolvedVariant} size={resolvedSize} className={classes} {...props}>
      {children}
    </ShadcnButton>
  );
}

export { shadcnButtonVariants };
