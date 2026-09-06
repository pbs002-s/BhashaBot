"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { CaretDown, Check, Copy, Eye, EyeSlash, X } from "@phosphor-icons/react/dist/ssr";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* =========================================================================
   Bezel — the nested shell/core enclosure every major surface sits in.
   ========================================================================= */

export function Bezel({
  children,
  className,
  coreClassName,
  spotlight = false,
  as = "section",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  coreClassName?: string;
  spotlight?: boolean;
  as?: "section" | "article" | "div" | "aside";
  onClick?: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const track = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!spotlight || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      ref.current.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      ref.current.style.setProperty("--my", `${event.clientY - rect.top}px`);
    },
    [spotlight]
  );

  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      onMouseMove={spotlight ? track : undefined}
      onClick={onClick}
      className={cx(
        "rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient",
        spotlight && "spotlight",
        className
      )}
    >
      <div
        className={cx(
          "h-full rounded-core border border-line/60 bg-panel shadow-inset",
          coreClassName
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/* =========================================================================
   Type
   ========================================================================= */

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border border-line bg-panelCard px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.18em] text-fog",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionHead({
  title,
  hint,
  icon,
  actions,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-soft bg-panelCard text-signal">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-paper">
            {title}
          </h2>
          {hint ? <p className="mt-1 max-w-prose text-xs leading-relaxed text-fog">{hint}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* =========================================================================
   Buttons
   ========================================================================= */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "ghost" | "danger";
  size?: "sm" | "md";
  trailingIcon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
};

export function Button({
  variant = "quiet",
  size = "sm",
  trailingIcon,
  leadingIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-physical active:scale-[0.975] disabled:pointer-events-none disabled:opacity-45";
  const sizes = {
    sm: trailingIcon ? "pl-4 pr-1.5 py-1.5 text-xs" : "px-4 py-1.5 text-xs",
    md: trailingIcon ? "pl-5 pr-2 py-2.5 text-sm" : "px-5 py-2.5 text-sm",
  };
  const variants = {
    primary: "bg-signal text-onSignal hover:brightness-110 shadow-ambient",
    quiet: "border border-line bg-panelCard text-paper hover:border-lineLight hover:bg-panelHover",
    ghost: "text-fog hover:bg-panelCard hover:text-paper",
    danger: "border border-coral/40 bg-coral/10 text-coral hover:bg-coral/20",
  };

  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon ? (
        <span
          className={cx(
            "flex items-center justify-center rounded-full transition-transform duration-300 ease-physical group-hover:translate-x-0.5 group-hover:-translate-y-px",
            size === "sm" ? "h-6 w-6" : "h-8 w-8",
            variant === "primary" ? "bg-onSignal/15" : "bg-line/70"
          )}
        >
          {trailingIcon}
        </span>
      ) : null}
    </button>
  );
}

export function IconButton({
  label,
  active,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cx(
        "flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ease-physical active:scale-95",
        active
          ? "border-signal/40 bg-signal/12 text-signal"
          : "border-line bg-panelCard text-fog hover:border-lineLight hover:text-paper",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function CopyButton({ value, copyLabel, doneLabel }: { value: string; copyLabel: string; doneLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1800);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panelCard px-3 py-1.5 text-xs text-fog transition-colors duration-300 ease-physical hover:border-lineLight hover:text-paper"
    >
      {done ? <Check size={13} weight="bold" className="text-mint" /> : <Copy size={13} />}
      <span>{done ? doneLabel : copyLabel}</span>
    </button>
  );
}

/* =========================================================================
   Form fields
   ========================================================================= */

const fieldShell =
  "w-full rounded-soft border border-line bg-panelCard px-3 py-2 text-xs text-paper placeholder-fog/70 transition-colors duration-200 ease-physical focus:border-signal focus:outline-none";

export function Field({
  label,
  hint,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="text-[0.7rem] font-medium tracking-[0.01em] text-fog">
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="text-[0.7rem] leading-relaxed text-fog/80">{hint}</p> : null}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <input id={id} className={fieldShell} {...rest} />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <textarea id={id} className={cx(fieldShell, "resize-y leading-relaxed")} {...rest} />
    </Field>
  );
}

export function Select<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  hint?: string;
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string }>;
  className?: string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cx(fieldShell, "appearance-none pr-8")}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown
          size={12}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fog"
        />
      </div>
    </Field>
  );
}

export function SecretInput({
  label,
  hint,
  storedPreview,
  storedLabel,
  emptyLabel,
  value,
  onChange,
  onClear,
  clearLabel,
  placeholder,
}: {
  label: string;
  hint?: string;
  storedPreview: string;
  storedLabel: string;
  emptyLabel: string;
  value: string;
  onChange: (next: string) => void;
  onClear?: () => void;
  clearLabel: string;
  placeholder?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(fieldShell, "pr-9 font-mono")}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide" : "Show"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-fog transition-colors hover:text-paper"
          >
            {visible ? <EyeSlash size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {storedPreview && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 rounded-full border border-line bg-panelCard px-3 py-2 text-[0.7rem] text-fog transition-colors hover:border-coral/50 hover:text-coral"
          >
            <X size={11} weight="bold" />
            {clearLabel}
          </button>
        ) : null}
      </div>
      <p className={cx("font-mono text-[0.7rem]", storedPreview ? "text-mint" : "text-fog/80")}>
        {storedPreview ? `${storedLabel} ${storedPreview}` : emptyLabel}
      </p>
    </Field>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-soft border border-line bg-panelCard px-3.5 py-3 text-left transition-colors duration-300 ease-physical hover:border-lineLight"
    >
      <span className="min-w-0">
        <span className="block text-xs font-medium text-paper">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[0.7rem] leading-relaxed text-fog">{description}</span>
        ) : null}
      </span>
      <span
        className={cx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ease-physical",
          checked ? "bg-signal" : "bg-line"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-panel shadow-ambient transition-transform duration-300 ease-physical",
            checked ? "translate-x-[1.15rem]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  label?: string;
  size?: "sm" | "xs";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className="text-[0.7rem] font-medium text-fog">{label}</span> : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-panelCard p-1"
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.hint}
              onClick={() => onChange(o.value)}
              className={cx(
                "rounded-full transition-all duration-300 ease-physical",
                size === "xs" ? "px-2.5 py-1 text-[0.7rem]" : "px-3.5 py-1.5 text-xs",
                active
                  ? "bg-panel text-paper shadow-ambient"
                  : "text-fog hover:text-paper"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (next: number) => void;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-signal"
        />
        <span className="w-12 shrink-0 text-right font-mono text-xs text-paper">
          {format ? format(value) : value}
        </span>
      </div>
    </Field>
  );
}

/* =========================================================================
   Feedback
   ========================================================================= */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-soft", className)} />;
}

export function EmptyState({
  title,
  body,
  icon,
  action,
}: {
  title: string;
  body: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-shell border border-line bg-panelCard text-fog">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-sm font-semibold text-paper">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-fog">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "signal" | "mint" | "coral" | "sky" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "border-line bg-panelCard text-fog",
    signal: "border-signal/30 bg-signal/12 text-signal",
    mint: "border-mint/30 bg-mint/12 text-mint",
    coral: "border-coral/35 bg-coral/12 text-coral",
    sky: "border-sky/30 bg-sky/12 text-sky",
    violet: "border-violet/30 bg-violet/12 text-violet",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "signal",
}: {
  value: number;
  tone?: "signal" | "mint" | "coral" | "sky" | "violet" | "fog";
}) {
  const tones = {
    signal: "bg-signal",
    mint: "bg-mint",
    coral: "bg-coral",
    sky: "bg-sky",
    violet: "bg-violet",
    fog: "bg-fog",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        style={{ transform: `scaleX(${Math.max(0, Math.min(100, value)) / 100})` }}
        className={cx(
          "h-full origin-left rounded-full transition-transform duration-700 ease-settle",
          tones[tone]
        )}
      />
    </div>
  );
}
