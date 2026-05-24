export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-border bg-[image:var(--gradient-navy)] px-5 py-8 text-white sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/75 sm:text-base">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
