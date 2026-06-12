interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted max-w-2xl">{description}</p>}
    </header>
  );
}
