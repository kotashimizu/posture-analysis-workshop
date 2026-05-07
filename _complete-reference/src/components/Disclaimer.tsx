import { DISCLAIMER_TEXT } from "@/content/disclaimer";

export function Disclaimer() {
  return (
    <div className="space-y-2 text-sm leading-7 text-slate-600">
      {DISCLAIMER_TEXT.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
