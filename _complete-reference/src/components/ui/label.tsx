import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
};

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label className={cn("label text-sm font-medium text-slate-900", className)} {...props}>
      {children}
    </label>
  );
}
