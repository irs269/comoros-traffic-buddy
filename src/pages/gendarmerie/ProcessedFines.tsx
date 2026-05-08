import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GendarmerieLayout from "@/components/GendarmerieLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckSquare } from "lucide-react";

interface Fine {
  id: string;
  plate_number: string;
  owner_name: string;
  violation_type: string;
  amount: number;
  status: string;
  amount_set_at: string;
}

export default function ProcessedFines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("fines")
        .select("*")
        .eq("amount_set_by", user.id)
        .order("amount_set_at", { ascending: false })
        .limit(100);
      setFines((data as Fine[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <GendarmerieLayout>
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Amendes traitées</h1>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && fines.length === 0 && (
          <p className="text-center text-muted-foreground py-10">Aucune amende traitée pour le moment.</p>
        )}

        <div className="space-y-2">
          {fines.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono font-semibold">{f.plate_number}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {f.violation_type} — {f.owner_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(f.amount_set_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{f.amount.toLocaleString()} KMF</p>
                  <Badge variant={f.status === "paid" ? "default" : "outline"} className="text-xs">
                    {f.status === "paid" ? "Payée" : "Impayée"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </GendarmerieLayout>
  );
}
