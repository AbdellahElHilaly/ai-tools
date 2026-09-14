import { BookOpen, Home, Settings, Sparkles } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/quiz", label: "Quiz", icon: Sparkles },
  { to: "/library", label: "مكتبتي", icon: BookOpen },
  { to: "/config", label: "الإعدادات", icon: Settings }
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition ${isActive ? "bg-ink text-white" : "text-muted hover:bg-black/5"}`
      }
    >
      <Icon size={19} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1040px] items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-3 font-black" aria-label="AI Tools الرئيسية">
            <span className="grid size-9 place-items-center rounded-xl bg-ink text-white"><Sparkles size={19} /></span>
            <span>AI Tools</span>
          </NavLink>
          <nav className="hidden gap-1 sm:flex" aria-label="التنقل الرئيسي">
            {links.map((link) => <NavItem key={link.to} {...link} />)}
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-line bg-surface/95 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden" aria-label="التنقل الرئيسي">
        {links.map((link) => <NavItem key={link.to} {...link} />)}
      </nav>
    </>
  );
}
