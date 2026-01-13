import { Link, useLocation } from "react-router-dom";
import {
  Film,
  Tv,
  Users,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";

import { useAuth } from "../../../features/auth/hooks/useAuth";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  const navItems = [
    { label: "Cine", path: "/", icon: Film },
    { label: "Series", path: "/series", icon: Tv },
    { label: "Social", path: "/social", icon: Users, authRequired: true },
    {
      label: "Stats",
      path: "/stats",
      icon: LayoutDashboard,
      authRequired: true,
    },
  ];

  // Filtramos items que requieren sesión
  const filteredItems = navItems.filter((item) => !item.authRequired || user);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/50 flex justify-around items-center h-auto py-3 lg:hidden pb-safe">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = path === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative ${
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-primary/70"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          );
        })}
        {user && (
          <Link
            to="/profile"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative ${
              path === "/profile"
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-primary/70"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Perfil
            </span>
            {path === "/profile" && (
              <div className="absolute top-0 w-8 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            )}
          </Link>
        )}
      </nav>
    </>
  );
}
