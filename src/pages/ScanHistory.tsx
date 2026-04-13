import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OfficerLayout from "@/components/OfficerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Search, Clock } from "lucide-react";

interface ScanLog {
  id: string;
  plate_number: string;
  result: string;
  fines_count: number | null;
  total_amount: number | null;
  created_at: string;
}

export default function ScanHistory() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [filter, setFilter] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scan_logs")
      .select("*")
      .eq("scanned_by", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setLogs(data || []));
  }, [user]);

  const filtered = logs.filter((l) =>
    l.plate_number.toLowerCase().includes(filter.toLowerCase())
  );

  const getIcon = (result: string) => {
    if (result === "fine_found") return <AlertTriangle className="w-5 h-5 text-danger" />;
    if (result === "no_fine") return <CheckCircle className="w-5 h-5 text-success" />;
    return <Search className="w-5 h-5 text-warning" />;
  };

  return (
    <OfficerLayout>
      <div className="space-y-4 pt-2">
        <h1 className="text-2xl font-bold">Historique</h1>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrer par plaque..."
          className="font-mono"
        />
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucun historique</p>
          )}
          {filtered.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center gap-3">
                {getIcon(log.result)}
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-sm">{log.plate_number}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                {log.result === "fine_found" && (
                  <div className="text-right">
                    <p className="text-xs text-danger font-semibold">{log.fines_count} amende(s)</p>
                    <p className="text-xs font-mono">{log.total_amount?.toLocaleString()} KMF</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OfficerLayout>
  );
}
