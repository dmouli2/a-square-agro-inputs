import { getDb } from "@/lib/db";

export default async function AdminErrorsPage() {
  const errors = await getDb().errorLogs.list(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Error logs</h1>
        <p className="text-sm text-muted mt-1">
          The last {errors.length} server-side error{errors.length === 1 ? "" : "s"} caught by Server Actions and error
          boundaries — no external monitoring service is wired up, so this is the full record.
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted uppercase tracking-wide">
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Path</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-0 align-top hover:bg-primary-50/40">
                <td className="px-4 py-3 whitespace-nowrap text-muted">
                  {new Date(entry.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{entry.message}</p>
                  {entry.stack ? (
                    <pre className="mt-1 max-w-xl whitespace-pre-wrap break-words text-xs text-muted">{entry.stack}</pre>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">{entry.path ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {errors.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No errors logged yet.</p> : null}
      </div>
    </div>
  );
}
