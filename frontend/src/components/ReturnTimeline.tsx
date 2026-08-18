import type { ReturnStatusHistory } from "@/lib/api";
import { returnStatusColor, returnStatusLabel } from "@/lib/api";

export function ReturnTimeline({ history }: { history?: ReturnStatusHistory[] }) {
  if (!history?.length) return null;

  return (
    <div className="mt-4 border-t border-border-soft pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Historial de la devolución</p>
      <ol className="mt-3 space-y-3">
        {history.map((entry, index) => (
          <li key={entry.id} className="grid grid-cols-[1rem_1fr] gap-3 text-sm">
            <span className="relative mt-1 flex justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-olive" />
              {index < history.length - 1 && <span className="absolute top-3 h-[calc(100%+0.5rem)] w-px bg-border-soft" />}
            </span>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${returnStatusColor(entry.status)}`}>
                  {returnStatusLabel(entry.status)}
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(entry.created_at).toLocaleString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {entry.note && <p className="mt-1 text-xs leading-5 text-brown-muted">{entry.note}</p>}
              {entry.changed_by?.name && <p className="mt-1 text-[11px] text-stone-400">Actualizado por {entry.changed_by.name}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
