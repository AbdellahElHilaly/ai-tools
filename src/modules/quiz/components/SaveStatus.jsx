import { CheckCircle2, CloudOff, LoaderCircle, Save } from "lucide-react";

const labels = {
  idle: "Autosave is ready",
  saving: "Saving…",
  saved: "Saved and synced",
  unsaved: "Not saved to your quizzes",
  error: "Saved on this device only"
};

export function SaveStatus({ status, error, onRetry, onSave }) {
  const Icon = status === "saving" ? LoaderCircle : status === "saved" ? CheckCircle2 : status === "error" ? CloudOff : Save;

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${status === "error" ? "border-accent text-danger" : "border-line text-muted"}`} role="status">
      <Icon size={16} className={status === "saving" ? "animate-spin" : ""} />
      <span>{labels[status] || labels.idle}</span>
      {error ? <span className="font-medium">{error}</span> : null}
      {status === "error" ? <button type="button" className="ml-auto underline" onClick={onRetry}>Retry sync</button> : null}
      {status === "unsaved" ? <button type="button" className="ml-auto text-brand underline" onClick={onSave}>Save to my quizzes</button> : null}
    </div>
  );
}
