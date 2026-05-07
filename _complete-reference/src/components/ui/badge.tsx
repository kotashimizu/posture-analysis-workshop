import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-blue-100 bg-blue-50 text-blue-950",
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  warning: "border-orange-100 bg-orange-50 text-orange-800",
  danger: "border-red-100 bg-red-50 text-red-800",
  outline: "border-slate-200 bg-white text-slate-700",
};

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
