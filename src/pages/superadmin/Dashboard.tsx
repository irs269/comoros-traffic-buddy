import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Car, AlertTriangle, CheckCircle, Users, Banknote, Shield, ScanLine } from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalFines: 0, unpaid: 0, paid: 0, totalVehicles: 0,
    totalAmount: 0, paidAmount: 0, totalUsers: 0,
    totalScans: 0, totalPayments: 0, todayPayments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [finesRes, vehiclesRes, usersRes, scansRes, paymentsRes] = await Promise.all([
        supabase.from("fines").select("amount, status"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("scan_logs").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount_paid, created_at"),
      ]);

      const allFines = finesRes.data || [];
      const unpaid = allFines.filter((f) => f.status === "unpaid");
      const paid = allFines.filter((f) => f.status === "paid");

      const allPayments = paymentsRes.data || [];
      const today = new Date().toDateString();
      const todayPayments = allPayments.filter(
        (p) => new Date(p.created_at).toDateString() === today
      );

      setStats({
        totalFines: allFines.length,
        unpaid: unpaid.length,
        paid: paid.length,
        totalVehicles: vehiclesRes.count || 0,
        totalAmount: allFines.reduce((s, f) => s + f.amount, 0),
        paidAmount: paid.reduce((s, f) => s + f.amount, 0),
        totalUsers: usersRes.count || 0,
        totalScans: scansRes.count || 0,
        totalPayments: allPayments.length,
        todayPayments: todayPayments.reduce((s, p) => s + p.amount_paid, 0),
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Amendes", value: stats.totalFines, icon: FileText, color: "text-primary" },
    { title: "Impayées", value: stats.unpaid, icon: AlertTriangle, color: "text-danger" },
    { title: "Payées", value: stats.paid, icon: CheckCircle, color: "text-success" },
    { title: "Véhicules", value: stats.totalVehicles, icon: Car, color: "text-warning" },
    { title: "Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { title: "Scans effectués", value: stats.totalScans, icon: ScanLine, color: "text-muted-foreground" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Super Admin - Tableau de bord</h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ title, value, icon: Icon, color }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`w-5 h-5 ${color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Montant Total Amendes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAmount.toLocaleString()} KMF</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Montant Recouvré</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{stats.paidAmount.toLocaleString()} KMF</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Encaissé Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.todayPayments.toLocaleString()} KMF</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Taux de Recouvrement Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-bold">
                {stats.totalAmount > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0}%
              </p>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-success rounded-full h-4 transition-all"
                    style={{ width: `${stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
