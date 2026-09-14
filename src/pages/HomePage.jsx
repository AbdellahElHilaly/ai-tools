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
        <h1 className="page-title">Home</h1>
      </header>

      <section id="tools" aria-labelledby="tools-title">
        <h2 id="tools-title" className="mb-3 mt-0 text-base font-bold">Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(({ id, name, description, route, icon: Icon }) => (
            <Link key={id} to={route} className="surface group flex items-center gap-4 p-4 transition-colors hover:border-brand">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-secondary text-brand"><Icon size={21} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block">{name}</strong>
                <span className="muted mt-1 block text-sm leading-5">{description}</span>
              </span>
              <ArrowRight className="shrink-0 text-muted transition-colors group-hover:text-brand" size={18} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
