export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="mb-6">
      {eyebrow ? <p className="mb-2 text-sm font-medium text-neutral-500">{eyebrow}</p> : null}
      <h1 className="text-2xl font-semibold tracking-normal text-neutral-900">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p> : null}
    </header>
  );
}
