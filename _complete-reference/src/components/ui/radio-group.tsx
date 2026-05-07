import {
  createContext,
  useContext,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  name: string;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  children: ReactNode;
};

function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioGroupItem must be used inside RadioGroup");
  }
  return context;
}

export function RadioGroup({
  value,
  onValueChange,
  name = "radio-group",
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn("grid gap-2", className)} role="radiogroup" {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  value,
  className,
  children,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
  value: string;
  children: ReactNode;
}) {
  const context = useRadioGroupContext();
  const checked = context.value === value;

  return (
    <label
      className={cn(
        "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 text-sm transition",
        checked ? "border-blue-800 ring-1 ring-blue-800" : "border-slate-200 hover:border-slate-300",
        className,
      )}
    >
      <input
        type="radio"
        className="mt-1 h-4 w-4 accent-blue-900"
        name={context.name}
        value={value}
        checked={checked}
        onChange={() => context.onValueChange(value)}
        {...props}
      />
      <span className="leading-6 text-slate-800">{children}</span>
    </label>
  );
}
