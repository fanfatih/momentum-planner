"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { parseMoney } from "@/lib/format";
import { Icon, type IconName } from "./icons";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* Tombol */

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-cream hover:bg-brand-deep",
  secondary: "border border-ink/55 bg-paper text-ink hover:bg-cream-deep",
  ghost: "text-brand-deep hover:bg-brand-tint",
  accent: "bg-sun text-ink hover:bg-[#f58c38]",
  danger: "border border-brand/60 text-brand-deep hover:bg-brand-tint",
};

const BTN_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-semibold leading-tight transition-[background-color,border-color,transform] duration-150 active:translate-y-px disabled:opacity-45 disabled:active:translate-y-0";

export function buttonClass(variant: Variant = "primary", block = false) {
  return cx(BTN_BASE, VARIANT[variant], block && "w-full");
}

export function Button({
  variant = "primary",
  block = false,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean; icon?: IconName }) {
  return (
    <button type={type} className={cx(buttonClass(variant, block), className)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  className,
  filled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; filled?: boolean }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-grid size-11 shrink-0 place-items-center rounded-[10px] text-ink-soft transition-colors duration-150 hover:bg-cream-deep hover:text-ink active:bg-line disabled:opacity-45",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={20} filled={filled} />
    </button>
  );
}

/* Form */

const CONTROL =
  "w-full min-h-11 rounded-[8px] border border-ink/55 bg-paper px-3 text-[16px] text-ink placeholder:text-ink-soft hover:border-ink disabled:bg-cream-deep disabled:text-ink-soft";

function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-[13px] text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-[13px] font-semibold text-brand-deep">
          {error}
        </p>
      )}
    </div>
  );
}

type FieldMeta = { label: string; hint?: string; error?: string };

export function TextField({ label, hint, error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cx(CONTROL, error && "border-brand", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextAreaField({ label, hint, error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cx(CONTROL, "py-2.5", error && "border-brand", className)}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & FieldMeta) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select id={id} className={cx(CONTROL, "pr-8", className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

export function MoneyField({
  label,
  hint,
  error,
  value,
  onChange,
}: FieldMeta & { value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-soft">Rp</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cx(CONTROL, "pl-10 tabular-nums", error && "border-brand")}
          value={value ? value.toLocaleString("id-ID") : ""}
          placeholder="0"
          onChange={(e) => onChange(parseMoney(e.target.value))}
        />
      </div>
    </FieldShell>
  );
}

/* Pilihan */

export function Chip({
  selected,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "min-h-11 rounded-[8px] border px-3 text-sm font-semibold transition-colors duration-150 active:translate-y-px",
        selected ? "border-ink bg-ink text-cream" : "border-ink/55 bg-transparent text-ink hover:bg-cream-deep",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-[12px] bg-cream-deep p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-11 rounded-[9px] px-2 text-sm font-semibold transition-colors duration-150",
            value === o.value ? "bg-paper text-ink ring-1 ring-ink/25" : "text-ink-soft hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Tone = "neutral" | "leaf" | "brand" | "sun";
const TONE: Record<Tone, string> = {
  neutral: "bg-cream-deep text-ink-soft",
  leaf: "bg-leaf-tint text-leaf-deep",
  brand: "bg-brand-tint text-brand-deep",
  sun: "bg-butter text-ink",
};

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] px-2 py-0.5 text-xs font-semibold", TONE[tone])}>
      {children}
    </span>
  );
}

/* Permukaan dan status */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-[14px] border border-line bg-paper", className)}>{children}</div>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-2 w-full overflow-hidden rounded-[4px] bg-cream-deep"
    >
      <motion.div
        className="h-full rounded-[4px] bg-leaf-deep"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  level = 2,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="px-4 py-10 text-center">
      <div className="arch mx-auto grid h-24 w-[4.5rem] place-items-center border border-line bg-cream-deep text-brand">
        <Icon name={icon} size={26} />
      </div>
      <Heading className="mt-4 text-xl">{title}</Heading>
      <p className="mx-auto mt-1 max-w-[30ch] text-[15px] text-ink-soft">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function LoadingState({ what }: { what: string }) {
  return (
    <div role="status" aria-live="polite" className="px-5 py-8">
      <p className="text-sm text-ink-soft">Memuat {what} dari perangkat ini.</p>
      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="h-24 rounded-[14px] bg-cream-deep" />
        <div className="h-14 rounded-[14px] bg-cream-deep" />
        <div className="h-14 rounded-[14px] bg-cream-deep" />
      </div>
    </div>
  );
}

export function Notice({
  tone = "sun",
  children,
  action,
}: {
  tone?: "sun" | "brand";
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex items-start justify-between gap-3 rounded-[10px] px-3 py-2.5 text-sm",
        tone === "sun" ? "bg-butter text-ink" : "bg-brand-tint text-brand-deep",
      )}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

/* Bottom sheet dan dialog, memakai <dialog> bawaan supaya fokus terjebak dan Escape menutup. */

export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = "sheet",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "sheet" | "modal";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={variant}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <header className="flex items-center justify-between gap-3 border-b border-line py-2 pl-5 pr-2">
            <h2 id={titleId} className="text-xl">
              {title}
            </h2>
            <IconButton icon="close" label="Tutup" onClick={onClose} />
          </header>
          <div className="overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
        </>
      )}
    </dialog>
  );
}

/* Toast */

interface ToastItem {
  id: number;
  text: string;
}

let toasts: ToastItem[] = [];
let toastSeq = 0;
const toastListeners = new Set<() => void>();
const emitToast = () => toastListeners.forEach((l) => l());

export function toast(text: string) {
  const id = ++toastSeq;
  toasts = [...toasts, { id, text }].slice(-2);
  emitToast();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitToast();
  }, 3600);
}

const EMPTY_TOASTS: ToastItem[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => {
        toastListeners.delete(l);
      };
    },
    () => toasts,
    () => EMPTY_TOASTS,
  );
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-full max-w-[430px] flex-col items-center gap-2 px-4"
    >
      {items.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-[10px] bg-ink px-4 py-2.5 text-sm font-medium text-cream"
        >
          {t.text}
        </motion.div>
      ))}
    </div>
  );
}

/* Animasi masuk: memudar sambil naik, daftar muncul berurutan. */

export function Reveal({
  i = 0,
  as = "div",
  className,
  children,
}: {
  i?: number;
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
}) {
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </Comp>
  );
}

export function ConfirmDelete({
  open,
  what,
  onCancel,
  onConfirm,
  variant = "sheet",
}: {
  open: boolean;
  what: string;
  onCancel: () => void;
  onConfirm: () => void;
  variant?: "sheet" | "modal";
}) {
  return (
    <Sheet open={open} onClose={onCancel} title="Hapus data ini?" variant={variant}>
      <p className="text-[15px] text-ink-soft">
        <span className="font-semibold text-ink">{what}</span> akan dihapus dan tidak bisa dikembalikan.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button onClick={onConfirm} icon="trash">
          Hapus
        </Button>
      </div>
    </Sheet>
  );
}

export function useToggle(initial = false) {
  const [on, set] = useState(initial);
  return [on, () => set(true), () => set(false)] as const;
}
