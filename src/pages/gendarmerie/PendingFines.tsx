import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GendarmerieLayout from "@/components/GendarmerieLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gavel, CheckCircle2, ClipboardList } from "lucide-react";

interface PendingFine {
  id: string;
  plate_number: string;
  owner_name: string;
  violation_type: string;
  location: string | null;
  notes: string | null;
  issued_at: string;
  amount: number | null;
  status: string;
}

const SUGGESTED: Record<string, number> = {
  "Excès de vitesse": 50000,
  "Stationnement interdit": 10000,
  "Feu rouge grillé": 30000,
  "Défaut de permis": 75000,
  "Défaut d'assurance": 60000,
  "Conduite dangereuse": 100000,
  "Défaut de contrôle technique": 25000,
  "Non-port de ceinture": 15000,
  "Utilisation du téléphone": 20000,
};

export default function PendingFines() {
  const [fines, setFines] = useState<PendingFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fines")
      .select("*")
      .eq("status", "pending_amount")
      .order("issued_at", { ascending: true });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setFines(data as PendingFine[]);
      const init: Record<string, string> = {};
      (data as PendingFine[]).forEach((f) => {
        init[f.id] = String(SUGGESTED[f.violation_type] ?? "");
      });
      setAmounts(init);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const setAmount = async (fine: PendingFine) => {
    const value = parseInt(amounts[fine.id]);
    if (!value || value <= 0) {
      toast({ title: "Montant invalide", description: "Saisis un montant en KMF.", variant: "destructive" });
      return;
    }
    setSaving(fine.id);
    const { error } = await supabase
      .from("fines")
      .update({
        amount: value,
        status: "unpaid",
        amount_set_by: user?.id,
        amount_set_at: new Date().toISOString(),
      })
      .eq("id", fine.id);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Montant fixé", description: `${value.toLocaleString()} KMF — amende transmise au caissier.` });
      setFines((prev) => prev.filter((f) => f.id !== fine.id));
    }
    setSaving(null);
  };

  return (
    <GendarmerieLayout>
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Gavel className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Amendes à tarifer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Fixe le montant des contraventions déclarées par les agents.
        </p>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && fines.length === 0 && (
          <Card className="border-2 border-success bg-success/5">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="font-bold text-success">Aucune amende en attente</p>
              <p className="text-sm text-muted-foreground">Tout est traité.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {fines.map((fine) => (
            <Card key={fine.id} className="border-l-4 border-l-warning">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-mono">{fine.plate_number}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(fine.issued_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning">
                    En attente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground text-xs block">Propriétaire</span>
                    <span>{fine.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Infraction</span>
                    <span className="font-medium">{fine.violation_type}</span>
                  </div>
                  {fine.location && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block">Lieu</span>
                      <span>{fine.location}</span>
                    </div>
                  )}
                  {fine.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground text-xs block">Notes</span>
                      <span className="text-muted-foreground italic">{fine.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Input
                    type="number"
                    placeholder="Montant en KMF"
                    value={amounts[fine.id] ?? ""}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [fine.id]: e.target.value }))}
                    min={0}
                    className="font-mono"
                  />
                  <Button
                    onClick={() => setAmount(fine)}
                    disabled={saving === fine.id}
                  >
                    {saving === fine.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-1" /> Fixer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </GendarmerieLayout>
  );
}
