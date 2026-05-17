import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}
