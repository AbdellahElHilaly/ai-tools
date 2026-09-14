import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { modules } from "../app/moduleRegistry";

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (new URLSearchParams(location.search).get("section") === "tools") {
      document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.search]);

  return (
    <div className="page stack gap-5">
      <header>
        <span className="eyebrow">Workspace</span>
        <h1 className="page-title">Choose a tool</h1>
      </header>

      <section id="tools" aria-labelledby="tools-title">
        <h2 id="tools-title" className="sr-only">Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(({ id, name, description, route, icon: Icon, theme }) => (
            <Link key={id} to={route} className={`module-card module-card--${theme} group flex items-center gap-4 rounded-3xl p-5`}>
              <span className="module-card__icon grid size-12 shrink-0 place-items-center rounded-2xl text-brand"><Icon size={23} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg">{name}</strong>
                <span className="muted mt-1 block text-sm leading-5">{description}</span>
              </span>
              <ArrowRight className="shrink-0 text-brand transition-transform group-hover:translate-x-1" size={19} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
