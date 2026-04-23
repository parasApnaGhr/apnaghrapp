import React from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type ShellProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  compact?: boolean;
};

export const pageTransition = {
  initial: { opacity: 0, y: 20, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(8px)" },
};

export function StitchShell({ title, eyebrow, subtitle, actions, children, compact }: ShellProps) {
  return (
    <div className="min-h-screen bg-[var(--stitch-bg)] text-[var(--stitch-ink)]">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.06),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.04),_transparent_30%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(15,15,15,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,15,15,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>
      <motion.div
        className={`relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-24 pt-4 md:px-8 ${compact ? "gap-6" : "gap-10"} md:pb-10`}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <header className="stitch-panel sticky top-4 z-40 flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            {eyebrow ? <p className="stitch-eyebrow">{eyebrow}</p> : null}
            <div className="flex items-center gap-3">
              <Link to="/" className="text-lg font-black tracking-[-0.12em] md:text-xl">
                APNAGHR
              </Link>
              <span className="hidden h-5 w-px bg-[var(--stitch-line)] md:block" />
              <h1 className="font-headline text-xl font-black uppercase tracking-[-0.04em] md:text-2xl">
                {title}
              </h1>
            </div>
            {subtitle ? <p className="max-w-3xl text-sm text-[var(--stitch-muted)] md:text-base">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </header>
        {children}
      </motion.div>
    </div>
  );
}

export function StitchCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`stitch-panel ${className}`}>{children}</section>;
}

export function StitchSectionHeader({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        {eyebrow ? <p className="stitch-eyebrow">{eyebrow}</p> : null}
        <h2 className="font-headline text-xl font-black uppercase tracking-[-0.04em] md:text-2xl">{title}</h2>
        {copy ? <p className="max-w-2xl text-sm text-[var(--stitch-muted)]">{copy}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StitchKpi({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="stitch-panel flex min-h-[150px] flex-col justify-between gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="stitch-eyebrow">{label}</p>
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--stitch-line)] bg-[var(--stitch-soft)]">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
      <div>
        <p className="font-headline text-4xl font-black tracking-[-0.06em]">{value}</p>
        {detail ? <p className="mt-2 text-sm text-[var(--stitch-muted)]">{detail}</p> : null}
      </div>
    </div>
  );
}

export function StitchButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      {...props}
      className={`stitch-button stitch-button-${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function StitchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`stitch-input ${props.className || ""}`.trim()} />;
}

export function StitchSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`stitch-input ${props.className || ""}`.trim()} />;
}

export function StitchTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`stitch-input ${props.className || ""}`.trim()} />;
}

export function StitchSkeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`stitch-skeleton ${className}`.trim()} />;
}

export function StitchLoadingPage({ label = "Loading screen" }: { label?: string }) {
  return (
    <StitchShell title="Loading" subtitle={label} compact>
      <div className="grid gap-4 md:grid-cols-3">
        <StitchSkeleton className="h-40 rounded-[28px]" />
        <StitchSkeleton className="h-40 rounded-[28px]" />
        <StitchSkeleton className="h-40 rounded-[28px]" />
      </div>
      <StitchSkeleton className="h-72 rounded-[28px]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <StitchSkeleton key={index} className="h-80 rounded-[28px]" />
        ))}
      </div>
    </StitchShell>
  );
}

export function StitchBottomDock({
  items,
}: {
  items: Array<{ label: string; to: string; icon: LucideIcon }>;
}) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 md:hidden">
      <div className="stitch-panel grid grid-cols-5 gap-1 p-2">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-[20px] px-2 py-3 text-[10px] font-bold uppercase tracking-[0.18em] transition ${
                isActive ? "bg-[var(--stitch-ink)] text-[var(--stitch-bg)]" : "text-[var(--stitch-muted)]"
              }`
            }
          >
            <Icon className="mb-1 h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function StitchModal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            className="stitch-panel max-h-[90vh] w-full max-w-4xl overflow-auto p-5 md:p-7"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
