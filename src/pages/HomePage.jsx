import { ArrowRight, ShieldCheck, Sparkles, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { modules } from "../app/moduleRegistry";
import { Card } from "../shared/components/Card";

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get("section") === "tools") {
      document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.search]);

  return (
    <div className="page stack gap-8">
      <section className="grid gap-5 py-5 sm:py-10">
        <span className="eyebrow">Small tools. Clear outcomes.</span>
        <h1 className="page-title max-w-3xl">Learn and work with AI, without the clutter.</h1>
        <p className="page-copy">Choose a tool, describe your goal, and follow a focused step-by-step flow with automatic progress saving.</p>
      </section>

      <section id="tools" aria-labelledby="tools-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Modules</span>
            <h2 id="tools-title" className="mb-0 mt-2 text-2xl font-black">Tools</h2>
          </div>
          <span className="muted text-sm">{modules.length} available</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ id, name, description, route, icon: Icon, status }) => (
            <Link key={id} to={route} className="group">
              <Card className="h-full transition duration-200 group-hover:-translate-y-1 group-hover:border-brand">
                <div className="mb-8 flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl border border-secondary text-brand"><Icon /></span>
                  <span className="rounded-full border border-line px-3 py-1 text-xs font-bold">{status}</span>
                </div>
                <h3 className="m-0 text-xl font-black">{name}</h3>
                <p className="muted mb-6 mt-2 leading-7">{description}</p>
                <span className="flex items-center gap-2 font-bold text-brand">Open tool <ArrowRight size={17} /></span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Application benefits">
        {[
          [Sparkles, "Content shaped around your goal"],
          [WifiOff, "Progress saved locally"],
          [ShieldCheck, "Protected AI credentials"]
        ].map(([Icon, text]) => (
          <div key={text} className="flex items-center gap-3 rounded-2xl border border-line p-4 text-sm font-bold">
            <Icon className="text-brand" size={19} /> {text}
          </div>
        ))}
      </section>
    </div>
  );
}
