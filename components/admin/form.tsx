"use client";

import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";

// Shared form primitives for admin pages. Every input = 1.5px ink border,
// paper bg, no border-radius. Every button = mono uppercase tracking-[0.18em].

type FieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? (
        <span
          className="font-mono text-[10px] tracking-wider"
          style={{ color: C.inkMute }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  background: C.paper,
  color: C.ink,
  border: `1.5px solid ${C.ink}`,
  borderRadius: 0,
  padding: "8px 10px",
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: 13,
};

export const buttonBaseClass =
  "inline-flex items-center justify-center font-mono text-[11px] tracking-[0.18em] uppercase font-bold";

export function PrimaryButton({
  children,
  type = "submit",
  name,
  value,
  formAction,
  className = "",
}: {
  children: React.ReactNode;
  type?: "submit" | "button" | "reset";
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
}) {
  return (
    <button
      type={type}
      name={name}
      value={value}
      formAction={formAction}
      className={`${buttonBaseClass} px-5 py-3 ${className}`}
      style={{ background: C.ink, color: C.paper, border: `1.5px solid ${C.ink}` }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  name,
  value,
  formAction,
  className = "",
}: {
  children: React.ReactNode;
  type?: "submit" | "button" | "reset";
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
}) {
  return (
    <button
      type={type}
      name={name}
      value={value}
      formAction={formAction}
      className={`${buttonBaseClass} px-5 py-3 ${className}`}
      style={{
        background: "transparent",
        color: C.ink,
        border: `1.5px solid ${C.ink}`,
      }}
    >
      {children}
    </button>
  );
}
