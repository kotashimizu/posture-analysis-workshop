import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "danger";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
};

const variantClasses: Record<AlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-950",
  warning: "border-orange-200 bg-orange-50 text-orange-950",
  danger: "border-red-200 bg-red-50 text-red-950",
};

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const Icon = variant === "info" ? Info : AlertTriangle;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm leading-6",
        variantClasses[variant],
        className,
      )}
      role="alert"
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <div className="font-semibold">{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
