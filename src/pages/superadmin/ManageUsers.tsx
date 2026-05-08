import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AppRole } from "@/hooks/useAuth";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  badge_number: string | null;
  phone: string | null;
  role: AppRole;
  role_id: string;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  gendarmerie: "Gendarmerie",
  cashier: "Caissier",
  officer: "Agent",
};

const roleBadgeColors: Record<AppRole, string> = {
  super_admin: "bg-primary text-primary-foreground",
  admin: "bg-warning text-warning-foreground",
  gendarmerie: "bg-danger text-danger-foreground",
  cashier: "bg-success text-success-foreground",
  officer: "bg-secondary text-secondary-foreground",
};

export default function ManageUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    if (profiles && roles) {
      const merged = profiles.map((p) => {
        const r = roles.find((r) => r.user_id === p.user_id);
        return {
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
          badge_number: p.badge_number,
          phone: p.phone,
          role: (r?.role as AppRole) || "officer",
          role_id: r?.id || "",
        };
      });
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, roleId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("id", roleId);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
    );
    toast({ title: "Rôle modifié", description: `Le rôle a été changé en ${roleLabels[newRole]}` });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{u.full_name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {u.badge_number && <span>Badge: {u.badge_number}</span>}
                    {u.phone && <span>Tél: {u.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleBadgeColors[u.role]}>{roleLabels[u.role]}</Badge>
                  <Select
                    value={u.role}
                    onValueChange={(val) => changeRole(u.user_id, u.role_id, val as AppRole)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="officer">Agent</SelectItem>
                      <SelectItem value="gendarmerie">Gendarmerie</SelectItem>
                      <SelectItem value="cashier">Caissier</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && users.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
