import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, History, LogOut, Shield, LayoutDashboard, Banknote } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/search", icon: Search, label: "Recherche" },
  { to: "/add-fine", icon: PlusCircle, label: "Amende" },
  { to: "/history", icon: History, label: "Historique" },
];

export default function OfficerLayout({ children }: { children: ReactNode }) {
  const { signOut, user, role } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">STFS</span>
        </div>
        <div className="flex items-center gap-2">
          {role === "super_admin" && (
            <Link to="/super-admin" className="p-2 rounded-lg hover:bg-accent transition-colors">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          {(role === "admin" || role === "super_admin") && (
            <Link to="/admin" className="p-2 rounded-lg hover:bg-accent transition-colors">
              <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          {(role === "cashier" || role === "admin" || role === "super_admin") && (
            <Link to="/cashier" className="p-2 rounded-lg hover:bg-accent transition-colors">
              <Banknote className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          <button onClick={signOut} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t">
        <div className="flex justify-around max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
