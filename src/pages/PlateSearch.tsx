import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OfficerLayout from "@/components/OfficerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  status: "fine_found" | "no_fine" | "not_found";
  vehicle?: any;
  fines?: any[];
  totalAmount?: number;
}

export default function PlateSearch() {
  const [plate, setPlate] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setLoading(true);
    setResult(null);

    const normalizedPlate = plate.trim().toUpperCase();

    // Search vehicle
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("*")
      .eq("plate_number", normalizedPlate)
      .maybeSingle();

    if (!vehicle) {
      setResult({ status: "not_found" });
      // Log scan
      await supabase.from("scan_logs").insert({
        plate_number: normalizedPlate,
        result: "not_found",
        scanned_by: user?.id,
      });
      setLoading(false);
      return;
    }

    // Search unpaid fines
    const { data: fines } = await supabase
      .from("fines")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .eq("status", "unpaid");

    const unpaidFines = fines || [];
    const totalAmount = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
    const status = unpaidFines.length > 0 ? "fine_found" : "no_fine";

    // Log scan
    await supabase.from("scan_logs").insert({
      plate_number: normalizedPlate,
      result: status,
      fines_count: unpaidFines.length,
      total_amount: totalAmount,
      scanned_by: user?.id,
    });

    setResult({ status, vehicle, fines: unpaidFines, totalAmount });
    setLoading(false);
  };

  return (
    <OfficerLayout>
      <div className="space-y-6 pt-2">
        <h1 className="text-2xl font-bold">Recherche de Plaque</h1>

        <div className="flex gap-2">
          <Input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Ex: 123 ABC KM"
            className="text-lg h-12 font-mono"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading} className="h-12 px-6">
            <Search className="w-5 h-5" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {result.status === "fine_found" && (
                <Card className="border-2 border-danger bg-danger/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-danger flex items-center justify-center animate-pulse-alert">
                        <AlertTriangle className="w-6 h-6 text-danger-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-danger">AMENDES IMPAYÉES</p>
                        <p className="text-sm text-muted-foreground">Véhicule en infraction</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Plaque</span><span className="font-mono font-bold">{result.vehicle.plate_number}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Propriétaire</span><span className="font-semibold">{result.vehicle.owner_name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Amendes</span><span className="font-bold text-danger">{result.fines?.length}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Montant total</span><span className="font-bold text-danger text-lg">{result.totalAmount?.toLocaleString()} KMF</span></div>
                    </div>
                    {result.fines && result.fines.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="font-semibold text-sm">Détails des amendes :</p>
                        {result.fines.map((fine) => (
                          <div key={fine.id} className="flex justify-between text-sm bg-card rounded-lg p-2">
                            <span>{fine.violation_type}</span>
                            <span className="font-mono">{fine.amount.toLocaleString()} KMF</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.status === "no_fine" && (
                <Card className="border-2 border-success bg-success/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <CheckCircle className="w-16 h-16 text-success mx-auto" />
                    <p className="text-lg font-bold text-success">AUCUNE AMENDE</p>
                    <p className="text-muted-foreground">Plaque: <span className="font-mono font-bold">{result.vehicle.plate_number}</span></p>
                    <p className="text-muted-foreground">Propriétaire: {result.vehicle.owner_name}</p>
                  </CardContent>
                </Card>
              )}

              {result.status === "not_found" && (
                <Card className="border-2 border-warning bg-warning/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <Search className="w-16 h-16 text-warning mx-auto" />
                    <p className="text-lg font-bold text-warning">VÉHICULE NON TROUVÉ</p>
                    <p className="text-muted-foreground">La plaque <span className="font-mono font-bold">{plate}</span> n'est pas enregistrée</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </OfficerLayout>
  );
}
