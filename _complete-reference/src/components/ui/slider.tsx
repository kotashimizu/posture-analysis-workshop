import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function Slider({ className, value, onValueChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={cn("h-2 w-full cursor-pointer rounded-lg bg-slate-200", className)}
      value={value}
      onChange={(event) => onValueChange(Number(event.currentTarget.value))}
      {...props}
    />
  );
}
