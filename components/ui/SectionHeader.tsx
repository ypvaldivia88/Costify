import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-emerald-700" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
        {description && <p className="text-sm text-zinc-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}
