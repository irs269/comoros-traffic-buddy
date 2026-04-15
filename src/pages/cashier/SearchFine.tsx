import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CashierLayout from "@/components/CashierLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, CheckCircle, Banknote, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface FineWithVehicle {
  id: string;
  plate_number: string;
  owner_name: string;
  violation_type: string;
  amount: number;
  status: string;
  issued_at: string;
  location: string | null;
  vehicle_id: string;
}

export default function CashierSearchFine() {
  const [plate, setPlate] = useState("");
  const [fines, setFines] = useState<FineWithVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setLoading(true);
    setSearched(true);
    setLastReceipt(null);
    try {
      const { data } = await supabase
        .from("fines")
        .select("*")
        .eq("plate_number", plate.trim().toUpperCase())
        .eq("status", "unpaid");
      setFines(data || []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de rechercher.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (fine: FineWithVehicle) => {
    if (!user) return;
    setPaying(fine.id);
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          fine_id: fine.id,
          amount_paid: fine.amount,
          payment_method: paymentMethod,
          paid_by_name: fine.owner_name,
          collected_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setLastReceipt({
        ...data,
        fine,
      });

      // Remove from list
      setFines((prev) => prev.filter((f) => f.id !== fine.id));

      toast({ title: "Paiement enregistré", description: `Reçu ${data.receipt_number}` });
    } catch (err: any) {
      toast({ title: "Erreur de paiement", description: err.message, variant: "destructive" });
    } finally {
      setPaying(null);
    }
  };

  const printReceipt = () => {
    if (!lastReceipt) return;
    const receipt = lastReceipt;
    const fine = receipt.fine;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Reçu ${receipt.receipt_number}</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
        h1 { text-align: center; font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 13px; }
        .total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>🏛️ STFS - REÇU DE PAIEMENT</h1>
      <div class="row"><span>N° Reçu:</span><strong>${receipt.receipt_number}</strong></div>
      <div class="row"><span>Date:</span><span>${new Date(receipt.created_at).toLocaleString("fr-FR")}</span></div>
      <hr/>
      <div class="row"><span>Plaque:</span><strong>${fine.plate_number}</strong></div>
      <div class="row"><span>Propriétaire:</span><span>${fine.owner_name}</span></div>
      <div class="row"><span>Infraction:</span><span>${fine.violation_type}</span></div>
      <div class="row"><span>Lieu:</span><span>${fine.location || "N/A"}</span></div>
      <div class="row"><span>Date infraction:</span><span>${new Date(fine.issued_at).toLocaleDateString("fr-FR")}</span></div>
      <hr/>
      <div class="row"><span>Mode paiement:</span><span>${receipt.payment_method === "cash" ? "Espèces" : receipt.payment_method === "mobile_money" ? "Mobile Money" : receipt.payment_method === "bank_transfer" ? "Virement" : receipt.payment_method}</span></div>
      <div class="row total"><span>MONTANT PAYÉ:</span><span>${fine.amount.toLocaleString()} KMF</span></div>
      <div class="footer">
        <p>Merci de votre paiement.</p>
        <p>Ce reçu fait foi de paiement.</p>
        <p>Smart Traffic Fine System - Comores</p>
      </div>
      <button onclick="window.print()" style="display:block;margin:20px auto;padding:10px 30px;font-size:14px;cursor:pointer;">🖨️ Imprimer</button>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <CashierLayout>
      <div className="space-y-4 pt-2">
        <h1 className="text-2xl font-bold">Encaisser une amende</h1>

        <div className="flex gap-2">
          <Input
            placeholder="Numéro de plaque..."
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="font-mono text-lg"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {searched && fines.length === 0 && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="border-2 border-success bg-success/5">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-2" />
                  <p className="font-bold text-success">AUCUNE AMENDE IMPAYÉE</p>
                  <p className="text-sm text-muted-foreground">Plaque: {plate}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {fines.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <Card className="border-2 border-danger bg-danger/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                    <CardTitle className="text-danger text-base">
                      {fines.length} amende{fines.length > 1 ? "s" : ""} impayée{fines.length > 1 ? "s" : ""}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="mb-3">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Mode de paiement</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Espèces</SelectItem>
                        <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                        <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {fines.map((fine) => (
                    <div key={fine.id} className="bg-card border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Infraction</span>
                        <span className="font-medium">{fine.violation_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Propriétaire</span>
                        <span>{fine.owner_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span>{new Date(fine.issued_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-danger">{fine.amount.toLocaleString()} KMF</span>
                        <Button
                          size="sm"
                          onClick={() => handlePay(fine)}
                          disabled={paying === fine.id}
                        >
                          {paying === fine.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <Banknote className="w-4 h-4 mr-1" />
                          )}
                          Encaisser
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {lastReceipt && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-success bg-success/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-bold text-success">PAIEMENT ENREGISTRÉ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>N° Reçu</span>
                  <span className="font-mono font-bold">{lastReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant</span>
                  <span className="font-bold">{lastReceipt.fine.amount.toLocaleString()} KMF</span>
                </div>
                <Button onClick={printReceipt} variant="outline" className="w-full mt-2">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer le reçu
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </CashierLayout>
  );
}
