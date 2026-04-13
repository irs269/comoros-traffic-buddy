import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Car, AlertTriangle, CheckCircle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalFines: 0, unpaid: 0, paid: 0, totalVehicles: 0, totalAmount: 0, paidAmount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: fines } = await supabase.from("fines").select("amount, status");
      const { count: vehicleCount } = await supabase.from("vehicles").select("*", { count: "exact", head: true });

      const allFines = fines || [];
      const unpaid = allFines.filter((f) => f.status === "unpaid");
      const paid = allFines.filter((f) => f.status === "paid");

      setStats({
        totalFines: allFines.length,
        unpaid: unpaid.length,
        paid: paid.length,
        totalVehicles: vehicleCount || 0,
        totalAmount: allFines.reduce((s, f) => s + f.amount, 0),
        paidAmount: paid.reduce((s, f) => s + f.amount, 0),
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Amendes", value: stats.totalFines, icon: FileText, color: "text-primary" },
    { title: "Impayées", value: stats.unpaid, icon: AlertTriangle, color: "text-danger" },
    { title: "Payées", value: stats.paid, icon: CheckCircle, color: "text-success" },
    { title: "Véhicules", value: stats.totalVehicles, icon: Car, color: "text-warning" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Montant Total des Amendes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAmount.toLocaleString()} KMF</p>
              <p className="text-sm text-muted-foreground mt-1">Recouvré: {stats.paidAmount.toLocaleString()} KMF</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {stats.totalAmount > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0}%
              </p>
              <div className="w-full bg-muted rounded-full h-3 mt-2">
                <div
                  className="bg-success rounded-full h-3 transition-all"
                  style={{ width: `${stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
