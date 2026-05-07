import { useState } from "react";
import { ChevronDown, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SHOOTING_GUIDE_ITEMS } from "@/content/shooting-guide";
import { cn } from "@/lib/utils";

export function ShootingGuide() {
  const [open, setOpen] = useState(true);

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <Ruler className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">撮影ガイド</h2>
            <p className="text-sm leading-6 text-slate-600">
              検出精度を保つため、撮影前に条件を確認します。
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen((current) => !current)}>
          <ChevronDown
            className={cn("h-5 w-5 transition", open ? "rotate-180" : "rotate-0")}
            aria-hidden="true"
          />
          <span className="sr-only">撮影ガイドを開閉</span>
        </Button>
      </div>
      {open ? (
        <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {SHOOTING_GUIDE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-lg bg-slate-50 p-3">
              <div className="label text-sm font-semibold text-slate-950">{item.title}</div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
