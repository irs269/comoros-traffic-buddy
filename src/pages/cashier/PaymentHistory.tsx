import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CashierLayout from "@/components/CashierLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Receipt } from "lucide-react";

interface Payment {
  id: string;
  receipt_number: string;
  amount_paid: number;
  payment_method: string;
  paid_by_name: string;
  created_at: string;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      const all = (data || []) as Payment[];
      setPayments(all);

      const today = new Date().toDateString();
      const todayPayments = all.filter(
        (p) => new Date(p.created_at).toDateString() === today
      );
      setTodayTotal(todayPayments.reduce((s, p) => s + p.amount_paid, 0));
    };
    fetch();
  }, [user]);

  const methodLabel = (m: string) => {
    switch (m) {
      case "cash": return "Espèces";
      case "mobile_money": return "Mobile Money";
      case "bank_transfer": return "Virement";
      default: return m;
    }
  };

  return (
    <CashierLayout>
      <div className="space-y-4 pt-2">
        <h1 className="text-2xl font-bold">Historique des paiements</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total encaissé aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{todayTotal.toLocaleString()} KMF</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm font-bold">{p.receipt_number}</span>
                    <span className="font-bold text-success">{p.amount_paid.toLocaleString()} KMF</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>{p.paid_by_name}</span>
                    <span>{methodLabel(p.payment_method)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("fr-FR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {payments.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Aucun paiement enregistré</p>
            </div>
          )}
        </div>
      </div>
    </CashierLayout>
  );
}
