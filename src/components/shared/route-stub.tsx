import { Construction } from "lucide-react";

/**
 * Placeholder for routes that exist in navigation but are not yet built.
 * Use this instead of a bare "coming soon" div so stubs look consistent.
 */
export function RouteStub({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <Construction className="size-10 text-fg-muted" aria-hidden />
      <h1 className="text-xl font-semibold text-fg-primary">{title}</h1>
      <p className="max-w-sm text-sm text-fg-secondary">
        This surface is scaffolded but not yet implemented.
      </p>
    </div>
  );
}
