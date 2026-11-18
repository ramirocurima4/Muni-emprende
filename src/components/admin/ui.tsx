import Link from "next/link";
import type { ReactNode } from "react";
import { TONE_CLASSES, type Tone } from "@/lib/admin-labels";

export const ADMIN_INPUT_CLASS =
  "mt-1.5 min-h-[44px] w-full rounded-xl border border-brand-sky/40 bg-brand-cream px-3.5 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25";

export const ADMIN_LABEL_CLASS = "block text-sm font-bold text-brand-ink";

export const BTN_PRIMARY =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-green-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_SECONDARY =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-brand-sky/45 bg-white px-3.5 py-2 text-sm font-bold text-brand-sky-dark transition-colors hover:bg-brand-sky-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_AMBER =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-brand-amber/60 bg-brand-amber-soft px-3.5 py-2 text-sm font-bold text-brand-amber-text transition-colors hover:bg-[#FDE9BE] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_DANGER =
  "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#D98282] bg-[#FDF2F2] px-3.5 py-2 text-sm font-bold text-[#7A1C1C] transition-colors hover:bg-[#FADEDE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink lg:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brand-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-brand-sky/30 bg-white p-5 shadow-lg shadow-brand-sky/10 lg:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({
  title,
  description,
  count,
}: {
  title: string;
  description?: string;
  count?: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-brand-ink lg:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-brand-muted">{description}</p>
        ) : null}
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full bg-brand-sky-light px-3 py-1 text-xs font-extrabold text-brand-sky-dark">
          {count}
        </span>
      ) : null}
    </div>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
  href?: string;
}) {
  const accent: Record<Tone, string> = {
    green: "text-brand-green-dark",
    amber: "text-brand-amber-text",
    red: "text-[#7A1C1C]",
    sky: "text-brand-sky-dark",
    neutral: "text-brand-ink",
  };

  const content = (
    <>
      <p className="text-xs font-extrabold uppercase tracking-wider text-brand-muted">
        {label}
      </p>
      <p className={`mt-1.5 text-3xl font-black ${accent[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
    </>
  );

  const base =
    "block rounded-3xl border bg-white p-5 shadow-lg shadow-brand-sky/10";
  const border =
    tone === "amber"
      ? "border-brand-amber/50"
      : tone === "green"
        ? "border-brand-green/25"
        : "border-brand-sky/30";

  return href ? (
    <Link
      href={href}
      className={`${base} ${border} transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green`}
    >
      {content}
    </Link>
  ) : (
    <div className={`${base} ${border}`}>{content}</div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-sky/50 bg-brand-sky-tint/60 px-6 py-10 text-center">
      <p className="text-base font-extrabold text-brand-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-brand-muted">{description}</p>
      ) : null}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("pagina", String(target));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label="Paginación"
      className="mt-5 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={BTN_SECONDARY}>
          ← Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm font-semibold text-brand-muted">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={BTN_SECONDARY}>
          Siguientes →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
