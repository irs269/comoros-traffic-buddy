import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, CheckSquare, LogOut, Shield } from "lucide-react";

const navItems = [
  { to: "/gendarmerie", icon: ClipboardList, label: "À traiter" },
  { to: "/gendarmerie/processed", icon: CheckSquare, label: "Traitées" },
];

export default function GendarmerieLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">STFS Gendarmerie</span>
        </div>
        <button onClick={signOut} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t">
        <div className="flex justify-around max-w-2xl mx-auto">
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
