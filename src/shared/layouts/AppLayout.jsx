import {
  BookMarked,
  BrainCircuit,
  House,
  KeyRound,
  Menu,
  PanelLeftClose,
  Settings2,
  Sparkles,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const primaryLinks = [
  { to: "/", label: "Home", icon: House, matches: (path) => path === "/" },
  { to: "/quiz", label: "Quiz", icon: BrainCircuit, matches: (path) => path === "/quiz" || path === "/library" },
  { to: "/config", label: "Settings", icon: Settings2, matches: (path) => path === "/config" }
];

const contextLinks = {
  home: [
    { to: "/", label: "Overview", icon: House, exact: true },
    { to: "/?section=tools", label: "Tools", icon: Sparkles, search: "section=tools" }
  ],
  quiz: [
    { to: "/quiz", label: "New quiz", icon: BrainCircuit, exact: true },
    { to: "/library", label: "My quizzes", icon: BookMarked, pathname: "/library" }
  ],
  settings: [
    { to: "/config?section=account", label: "Account", icon: UserRound, search: "section=account" },
    { to: "/config?section=keys", label: "API keys", icon: KeyRound, search: "section=keys" }
  ]
};

function sectionFor(pathname) {
  if (pathname === "/config") return "settings";
  if (pathname === "/quiz" || pathname === "/library") return "quiz";
  return "home";
}

function PrimaryItem({ item, pathname, onNavigate }) {
  const Icon = item.icon;
  const active = item.matches(pathname);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-11 items-center gap-3 border-l-2 px-4 text-sm font-semibold transition-colors ${active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function ContextItem({ item, location }) {
  const Icon = item.icon;
  const defaultSettingsAccount = item.search === "section=account" && location.pathname === "/config" && !location.search.includes("section=");
  const active = defaultSettingsAccount || (item.pathname
    ? location.pathname === item.pathname
    : item.search
      ? location.search.includes(item.search)
      : item.exact && location.pathname === item.to && !location.search);
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-3 text-[11px] font-semibold transition-colors ${active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const section = sectionFor(location.pathname);
  const bottomLinks = useMemo(() => contextLinks[section], [section]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-xl md:hidden">
        <Link to="/" className="flex items-center gap-3 font-black" aria-label="AI Tools home">
          <Sparkles className="text-brand" size={22} />
          <span>AI Tools</span>
        </Link>
        <button type="button" className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {drawerOpen ? <button type="button" className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu overlay" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-line bg-surface transition-transform duration-200 md:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex min-h-16 items-center justify-between border-b border-line px-5">
          <Link to="/" className="flex items-center gap-3 font-black" aria-label="AI Tools home">
            <Sparkles className="text-brand" size={23} />
            <span>AI Tools</span>
          </Link>
          <button type="button" className="icon-button md:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <PanelLeftClose size={20} />
          </button>
        </div>
        <nav className="grid gap-1 py-4" aria-label="Primary navigation">
          {primaryLinks.map((item) => <PrimaryItem key={item.to} item={item} pathname={location.pathname} onNavigate={() => setDrawerOpen(false)} />)}
        </nav>
      </aside>

      <main className="pt-14 md:ml-56 md:pt-0">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-line bg-surface/95 px-2 pb-[max(.25rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:left-56 md:mx-auto md:max-w-md md:rounded-t-xl md:border-x" aria-label={`${section} navigation`}>
        {bottomLinks.map((item) => <ContextItem key={item.to} item={item} location={location} />)}
      </nav>
    </div>
  );
}
