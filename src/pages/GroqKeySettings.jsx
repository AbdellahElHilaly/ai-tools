import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { groqKeyService } from "../core/llm/groqKeyService";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { ErrorNotice } from "../shared/components/Feedback";

const statusDetails = {
  valid: { label: "Valid", className: "border-secondary text-brand", icon: CheckCircle2 },
  invalid: { label: "Invalid", className: "border-danger text-danger", icon: CircleAlert },
  untested: { label: "Not tested", className: "border-line text-muted", icon: KeyRound }
};

function StatusBadge({ status }) {
  const details = statusDetails[status] || statusDetails.untested;
  const Icon = details.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${details.className}`}>
      <Icon size={14} aria-hidden="true" />
      {details.label}
    </span>
  );
}

function SavedKey({ item, busyAction, onTest, onDelete }) {
  const isBusy = busyAction?.endsWith(item.id);
  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="break-words">{item.label}</strong>
            <StatusBadge status={item.status} />
          </div>
          <code dir="ltr" className="muted mt-2 block text-sm">{item.key_hint}</code>
          {item.last_test_message ? <p className="muted mb-0 mt-2 text-xs leading-5">{item.last_test_message}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isBusy}
            onClick={() => onTest(item.id)}
            aria-label={`Test ${item.label}`}
          >
            {busyAction === `test:${item.id}` ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Test
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={isBusy}
            onClick={() => onDelete(item)}
            aria-label={`Delete ${item.label}`}
          >
            {busyAction === `delete:${item.id}` ? <LoaderCircle className="animate-spin" size={16} /> : <Trash2 size={16} />}
            <span className="sr-only sm:not-sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </li>
  );
}

export function GroqKeySettings({ user }) {
  const [keys, setKeys] = useState([]);
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadKeys = useCallback(async () => {
    if (!user) {
      setKeys([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setKeys(await groqKeyService.list());
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function run(action, task) {
    setBusyAction(action);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusyAction("");
    }
  }

  async function saveKey(event) {
    event.preventDefault();
    await run("save", async () => {
      const result = await groqKeyService.save({ label, apiKey });
      setLabel("");
      setApiKey("");
      setShowKey(false);
      setMessage(result.message);
      await loadKeys();
    });
  }

  async function testDraft() {
    await run("test:draft", async () => {
      const result = await groqKeyService.testDraft({ apiKey });
      setMessage(result.message);
    });
  }

  async function testSaved(keyId) {
    await run(`test:${keyId}`, async () => {
      const result = await groqKeyService.testSaved({ keyId });
      setMessage(result.message);
      await loadKeys();
    });
  }

  async function deleteKey(item) {
    if (!window.confirm(`Delete “${item.label}” permanently?`)) return;
    await run(`delete:${item.id}`, async () => {
      await groqKeyService.remove({ keyId: item.id });
      setMessage("The key was permanently deleted.");
      await loadKeys();
    });
  }

  const validDraft = /^gsk_[A-Za-z0-9_-]{16,236}$/.test(apiKey.trim());

  return (
    <Card className="lg:col-span-2">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-secondary text-brand">
          <KeyRound size={20} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">Groq API Keys</span>
          <h2 className="mb-1 mt-1 text-xl font-black">Your keys</h2>
          <p className="muted m-0 text-sm leading-6">Keys are encrypted in Supabase Vault. A full key is never shown again after saving.</p>
        </div>
      </div>

      {!user ? (
        <div className="rounded-xl border border-line p-4 text-sm">
          Sign in from Account settings to add and manage your keys.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <form className="stack content-start" onSubmit={saveKey}>
            <label className="stack gap-2 text-sm font-bold">
              Key name
              <input
                className="min-h-12 rounded-xl border border-line bg-canvas px-4 outline-none focus:border-brand"
                maxLength={40}
                placeholder="Example: Primary key"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
            </label>
            <label className="stack gap-2 text-sm font-bold">
              Groq API key
              <span className="relative">
                <input
                  dir="ltr"
                  className="min-h-12 w-full rounded-xl border border-line bg-canvas py-3 pl-4 pr-12 outline-none focus:border-brand"
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="gsk_..."
                  required
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted hover:text-ink"
                  onClick={() => setShowKey((value) => !value)}
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" disabled={!validDraft || Boolean(busyAction)} onClick={testDraft}>
                {busyAction === "test:draft" ? <LoaderCircle className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
                Test before saving
              </Button>
              <Button disabled={!validDraft || Boolean(busyAction) || keys.length >= 10}>
                {busyAction === "save" ? <LoaderCircle className="animate-spin" size={17} /> : <Plus size={17} />}
                Save key
              </Button>
            </div>
            <p className="muted m-0 text-xs leading-5">Save up to 10 keys. If one fails, Quiz automatically tries the next available key.</p>
          </form>

          <section aria-labelledby="saved-groq-keys">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 id="saved-groq-keys" className="m-0 text-base font-black">Saved keys</h3>
              <span className="muted text-xs">{keys.length}/10</span>
            </div>
            {loading ? (
              <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted" role="status">
                <LoaderCircle className="animate-spin" size={18} /> Loading keys…
              </div>
            ) : keys.length ? (
              <ul className="m-0 grid list-none gap-3 p-0">
                {keys.map((item) => (
                  <SavedKey key={item.id} item={item} busyAction={busyAction} onTest={testSaved} onDelete={deleteKey} />
                ))}
              </ul>
            ) : (
              <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">
                No keys saved yet.
              </div>
            )}
          </section>
        </div>
      )}

      <div className="mt-4" aria-live="polite">
        {error ? <ErrorNotice>{error}</ErrorNotice> : null}
        {message ? (
          <p className="m-0 flex items-center gap-2 rounded-xl border border-secondary p-4 text-sm font-semibold text-brand">
            <CheckCircle2 size={18} aria-hidden="true" /> {message}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
