import { AlertCircle, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "لحظة، كنوجد كلشي…" }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center" role="status">
      <LoaderCircle className="animate-spin text-brand" size={28} />
      <p className="m-0 font-semibold">{label}</p>
      <span className="muted text-sm">يمكنك تبقى في نفس الصفحة.</span>
    </div>
  );
}

export function ErrorNotice({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
      <AlertCircle className="mt-0.5 shrink-0" size={18} />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="surface grid min-h-64 place-items-center p-8 text-center">
      <div className="stack max-w-sm justify-items-center">
        {Icon ? <Icon className="text-brand" size={34} /> : null}
        <h2 className="m-0 text-xl font-extrabold">{title}</h2>
        <p className="muted m-0 leading-7">{description}</p>
        {action}
      </div>
    </div>
  );
}
