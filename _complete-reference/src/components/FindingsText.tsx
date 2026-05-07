import { ClipboardList } from "lucide-react";

type FindingsTextProps = {
  findings: string[];
};

export function FindingsText({ findings }: FindingsTextProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <ClipboardList className="h-4 w-4 text-blue-900" aria-hidden="true" />
        自動生成所見
      </div>
      <ol className="space-y-2 text-sm leading-7 text-slate-700">
        {findings.map((finding) => (
          <li key={finding}>{finding}</li>
        ))}
      </ol>
    </div>
  );
}
