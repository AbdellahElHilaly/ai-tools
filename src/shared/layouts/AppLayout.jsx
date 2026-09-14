import { Menu, PanelLeftClose, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  contextualNavigation,
  isContextItemActive,
  primaryNavigation,
  resolveNavigationSection
} from "../../app/navigationRegistry";
import { resolveModuleTheme } from "../../app/themeRegistry";

function PrimaryItem({ item, pathname, onNavigate }) {
  const Icon = item.icon;
  const active = item.isActive(pathname);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="primary-nav-item"
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function ContextItem({ item, location }) {
  const Icon = item.icon;
  const active = isContextItemActive(item, location);
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className="context-nav-item"
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function Brand() {
  return (
    <Link to="/" className="brand-mark" aria-label="AI Tools home">
      <span className="brand-mark__icon"><Sparkles size={20} /></span>
      <span>AI Tools</span>
    </Link>
  );
}

export function AppLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const section = resolveNavigationSection(location.pathname);
  const theme = resolveModuleTheme(location.pathname);
  const bottomLinks = useMemo(() => contextualNavigation[section], [section]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.documentElement.dataset.moduleTheme = theme.id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.chromeColor);
  }, [theme]);

  return (
    <div className={`app-shell ${theme.className}`} data-module-theme={theme.id}>
      <header className="app-header md:hidden">
        <Brand />
        <button type="button" className="icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {drawerOpen ? <button type="button" className="drawer-scrim md:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu overlay" /> : null}

      <aside className={`app-sidebar ${drawerOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="app-sidebar__brand">
          <Brand />
          <button type="button" className="icon-button md:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <PanelLeftClose size={20} />
          </button>
        </div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {primaryNavigation.map((item) => <PrimaryItem key={item.to} item={item} pathname={location.pathname} onNavigate={() => setDrawerOpen(false)} />)}
        </nav>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="context-nav" aria-label={`${section} navigation`}>
        {bottomLinks.map((item) => <ContextItem key={item.to} item={item} location={location} />)}
      </nav>
    </div>
  );
}
