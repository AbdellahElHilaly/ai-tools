import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { publicConfig } from "../core/config/publicConfig";
import { useAuth } from "../core/supabase/AuthProvider";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { ErrorNotice } from "../shared/components/Feedback";
import { GroqKeySettings } from "./GroqKeySettings";

export function ConfigPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestedNext = params.get("next");
  const activeSection = params.get("section") === "keys" ? "keys" : "account";
  const nextRoute = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : null;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signin") {
        await signIn(email, password);
        if (nextRoute) navigate(nextRoute);
      } else {
        const data = await signUp(email, password);
        setMessage(data.session ? "Your account is ready." : "Check your inbox to confirm your account, then sign in.");
        if (data.session && nextRoute) navigate(nextRoute);
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page stack gap-6">
      <header>
        <span className="eyebrow">Settings</span>
        <h1 className="page-title">{activeSection === "keys" ? "API keys" : "Account"}</h1>
        <p className="page-copy">{activeSection === "keys" ? "Add, test, and remove Groq keys without exposing them in the browser." : "Manage your secure account and cross-device quiz sync."}</p>
      </header>

      {activeSection === "account" ? (
        <Card className="mx-auto w-full max-w-2xl">
          <div className="mb-5 flex items-center gap-3"><ShieldCheck className="text-brand" /><h2 className="m-0 text-xl font-black">Secure sync</h2></div>
          {user ? (
            <div className="stack">
              <div className="flex items-center gap-3 rounded-xl border border-secondary p-4 text-brand"><CheckCircle2 size={20} /><div><strong className="block">Connected</strong><span className="text-sm">{user.email || "Secure guest session"}</span></div></div>
              {nextRoute ? <Link to={nextRoute}><Button className="w-full">Return to Quiz</Button></Link> : null}
              <Button variant="secondary" onClick={signOut}><LogOut size={18} /> Sign out</Button>
            </div>
          ) : (
            <form className="stack" onSubmit={submit}>
              <label className="stack gap-2 text-sm font-bold">Email address<input className="min-h-12 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-brand" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label className="stack gap-2 text-sm font-bold">Password<input className="min-h-12 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-brand" type="password" minLength="8" autoComplete={mode === "signin" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              {error ? <ErrorNotice>{error}</ErrorNotice> : null}
              {message ? <p className="m-0 rounded-xl border border-secondary p-4 text-sm text-brand">{message}</p> : null}
              <Button disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
              <Button type="button" variant="ghost" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>{mode === "signin" ? "Need an account? Create one" : "I already have an account"}</Button>
            </form>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          <Card>
            <span className="eyebrow">AI provider</span>
            <h2 className="mb-1 mt-3 text-xl font-black">Groq</h2>
            <p className="muted mt-0 leading-7">Fast, structured generation for focused quiz plans and questions.</p>
            <div className="mt-5 rounded-xl border border-line p-4"><span className="muted block text-xs">Model</span><strong className="mt-1 block text-sm">{publicConfig.defaultModel}</strong></div>
          </Card>
          <GroqKeySettings user={user} />
        </div>
      )}
    </div>
  );
}
