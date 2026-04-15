import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Car, FileText, Users, ArrowLeft, LogOut, Shield, Banknote } from "lucide-react";

const adminItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/admin/vehicles", icon: Car, label: "Véhicules" },
  { to: "/admin/fines", icon: FileText, label: "Amendes" },
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
];

const superAdminItems = [
  { to: "/super-admin", icon: Shield, label: "Super Admin" },
  { to: "/super-admin/users", icon: Users, label: "Gestion rôles" },
  { to: "/super-admin/payments", icon: Banknote, label: "Paiements" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, role } = useAuth();
  const location = useLocation();

  const sidebarItems = [
    ...adminItems,
    ...(role === "super_admin" ? superAdminItems : []),
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <Shield className="w-7 h-7 text-sidebar-primary" />
          <span className="font-bold text-lg">STFS Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
            App Mobile
          </Link>
          <button onClick={signOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden sticky top-0 z-40 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold">STFS Admin</span>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="w-5 h-5" /></Link>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-accent"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-b overflow-x-auto px-2">
          {sidebarItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
