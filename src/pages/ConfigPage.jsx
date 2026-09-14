import { CheckCircle2, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="page stack gap-4">
      <header>
        <h1 className="page-title">{activeSection === "keys" ? "API keys" : "Account"}</h1>
      </header>

      {activeSection === "account" ? (
        <Card className="mx-auto w-full max-w-xl">
          {user ? (
            <div className="stack">
              <div className="flex items-center gap-3 border-b border-line pb-4 text-brand"><CheckCircle2 size={20} /><div><strong className="block">Signed in</strong><span className="text-sm">{user.email || "Secure guest session"}</span></div></div>
              {nextRoute ? <Link to={nextRoute}><Button className="w-full">Return to Quiz</Button></Link> : null}
              <Button variant="secondary" onClick={signOut}><LogOut size={18} /> Sign out</Button>
            </div>
          ) : (
            <form className="stack" onSubmit={submit}>
              <h2 className="m-0 text-lg font-black">{mode === "signin" ? "Sign in" : "Create account"}</h2>
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
        <div>
          <GroqKeySettings user={user} />
        </div>
      )}
    </div>
  );
}
