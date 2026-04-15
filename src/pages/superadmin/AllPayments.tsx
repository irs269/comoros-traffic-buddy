import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, Receipt } from "lucide-react";

interface Payment {
  id: string;
  receipt_number: string;
  amount_paid: number;
  payment_method: string;
  paid_by_name: string;
  created_at: string;
}

export default function AllPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      const all = (data || []) as Payment[];
      setPayments(all);
      setTotal(all.reduce((s, p) => s + p.amount_paid, 0));
    };
    fetch();
  }, []);

  const methodLabel = (m: string) => {
    switch (m) {
      case "cash": return "Espèces";
      case "mobile_money": return "Mobile Money";
      case "bank_transfer": return "Virement";
      default: return m;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Tous les paiements</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total recouvré</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{total.toLocaleString()} KMF</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Reçu</TableHead>
                  <TableHead>Payeur</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.receipt_number}</TableCell>
                    <TableCell>{p.paid_by_name}</TableCell>
                    <TableCell>{methodLabel(p.payment_method)}</TableCell>
                    <TableCell className="font-bold">{p.amount_paid.toLocaleString()} KMF</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Aucun paiement
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
