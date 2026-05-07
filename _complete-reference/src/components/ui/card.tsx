import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: BaseProps) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: BaseProps) {
  return (
    <div className={cn("space-y-1.5 p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: BaseProps) {
  return (
    <div className={cn("text-lg font-semibold text-slate-950", className)} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ className, children, ...props }: BaseProps) {
  return (
    <div className={cn("text-sm leading-6 text-slate-600", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: BaseProps) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: BaseProps) {
  return (
    <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
