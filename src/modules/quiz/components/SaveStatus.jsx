import { CheckCircle2, CloudOff, LoaderCircle, Save } from "lucide-react";

const labels = {
  idle: "غادي يتحفظ تلقائياً",
  saving: "جاري الحفظ…",
  saved: "محفوظ ومزامن",
  unsaved: "غير محفوظ في المكتبة",
  error: "محفوظ في الجهاز فقط"
};

export function SaveStatus({ status, error, onRetry, onSave }) {
  const Icon = status === "saving" ? LoaderCircle : status === "saved" ? CheckCircle2 : status === "error" ? CloudOff : Save;

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${status === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-line bg-white text-muted"}`} role="status">
      <Icon size={16} className={status === "saving" ? "animate-spin" : ""} />
      <span>{labels[status] || labels.idle}</span>
      {error ? <span className="font-medium">{error}</span> : null}
      {status === "error" ? <button type="button" className="mr-auto underline" onClick={onRetry}>عاود المزامنة</button> : null}
      {status === "unsaved" ? <button type="button" className="mr-auto text-brand underline" onClick={onSave}>حفظ في مكتبتي</button> : null}
    </div>
  );
}
