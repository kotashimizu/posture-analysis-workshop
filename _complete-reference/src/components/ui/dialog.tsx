import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type DialogProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
};

export function Dialog({
  open,
  title,
  description,
  children,
  actionLabel,
  onAction,
}: DialogProps) {
  return open ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="space-y-2">
          <h2 id="dialog-title" className="text-xl font-semibold text-slate-950">
            {title}
          </h2>
          {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        <div className="mt-5 text-sm leading-7 text-slate-700">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </div>
  ) : null;
}
