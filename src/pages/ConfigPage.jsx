import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { publicConfig } from "../core/config/publicConfig";
import { useAuth } from "../core/supabase/AuthProvider";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { ErrorNotice } from "../shared/components/Feedback";

export function ConfigPage() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "signin") await signIn(email, password);
      else {
        const data = await signUp(email, password);
        setMessage(data.session ? "تم إنشاء الحساب." : "تحقق من بريدك لتأكيد الحساب، ثم سجّل الدخول.");
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="page stack gap-6">
      <header><span className="eyebrow">Config</span><h1 className="page-title">الإعدادات</h1><p className="page-copy">إعدادات قليلة وواضحة. مفاتيح Groq تبقى في الخادم ولا تظهر هنا.</p></header>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center gap-3"><ShieldCheck className="text-brand" /><h2 className="m-0 text-xl font-black">المزامنة الآمنة</h2></div>
          {user ? (
            <div className="stack">
              <div className="flex items-center gap-3 rounded-xl bg-[var(--color-brand-soft)] p-4 text-brand"><CheckCircle2 size={20} /><div><strong className="block">متصل</strong><span className="text-sm">{user.email || "جلسة ضيف آمنة"}</span></div></div>
              <Button variant="secondary" onClick={signOut}><LogOut size={18} /> تسجيل الخروج</Button>
            </div>
          ) : (
            <form className="stack" onSubmit={submit}>
              <label className="stack gap-2 text-sm font-bold">البريد الإلكتروني<input className="min-h-12 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-brand" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label className="stack gap-2 text-sm font-bold">كلمة المرور<input className="min-h-12 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-brand" type="password" minLength="8" autoComplete={mode === "signin" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              {error ? <ErrorNotice>{error}</ErrorNotice> : null}
              {message ? <p className="m-0 rounded-xl bg-[var(--color-brand-soft)] p-4 text-sm text-brand">{message}</p> : null}
              <Button disabled={busy}>{busy ? "لحظة…" : mode === "signin" ? "دخول" : "إنشاء حساب"}</Button>
              <Button type="button" variant="ghost" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>{mode === "signin" ? "ليس لديك حساب؟ أنشئ واحداً" : "عندي حساب بالفعل"}</Button>
            </form>
          )}
        </Card>
        <Card>
          <span className="eyebrow">AI Provider</span>
          <h2 className="mb-1 mt-3 text-xl font-black">Groq</h2>
          <p className="muted mt-0 leading-7">نموذج إنتاج قوي مع إجابات JSON مضبوطة للكويز.</p>
          <div className="mt-5 rounded-xl border border-line bg-canvas p-4"><span className="muted block text-xs">النموذج</span><strong dir="ltr" className="mt-1 block text-sm">{publicConfig.defaultModel}</strong></div>
        </Card>
      </div>
    </div>
  );
}
