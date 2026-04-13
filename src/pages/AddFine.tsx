import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import OfficerLayout from "@/components/OfficerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CheckCircle } from "lucide-react";

const violationTypes = [
  "Excès de vitesse",
  "Stationnement interdit",
  "Feu rouge grillé",
  "Défaut de permis",
  "Défaut d'assurance",
  "Conduite dangereuse",
  "Défaut de contrôle technique",
  "Non-port de ceinture",
  "Utilisation du téléphone",
  "Autre",
];

export default function AddFine() {
  const [plateNumber, setPlateNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [violationType, setViolationType] = useState("");
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !ownerName || !violationType || !amount) return;

    setLoading(true);
    const normalizedPlate = plateNumber.trim().toUpperCase();

    // Upsert vehicle
    let { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("plate_number", normalizedPlate)
      .maybeSingle();

    if (!vehicle) {
      const { data: newVehicle, error } = await supabase
        .from("vehicles")
        .insert({ plate_number: normalizedPlate, owner_name: ownerName })
        .select("id")
        .single();
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      vehicle = newVehicle;
    }

    const { error } = await supabase.from("fines").insert({
      vehicle_id: vehicle!.id,
      plate_number: normalizedPlate,
      owner_name: ownerName,
      violation_type: violationType,
      amount: parseInt(amount),
      location: location || null,
      notes: notes || null,
      issued_by: user?.id,
    });

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPlateNumber("");
        setOwnerName("");
        setViolationType("");
        setAmount("");
        setLocation("");
        setNotes("");
      }, 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <OfficerLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <CheckCircle className="w-20 h-20 text-success" />
          <p className="text-xl font-bold text-success">Amende enregistrée !</p>
        </div>
      </OfficerLayout>
    );
  }

  return (
    <OfficerLayout>
      <div className="space-y-6 pt-2">
        <h1 className="text-2xl font-bold">Nouvelle Amende</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Numéro de plaque *</Label>
            <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value.toUpperCase())} placeholder="123 ABC KM" className="font-mono" required />
          </div>
          <div className="space-y-2">
            <Label>Nom du propriétaire *</Label>
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Nom complet" required />
          </div>
          <div className="space-y-2">
            <Label>Type d'infraction *</Label>
            <Select value={violationType} onValueChange={setViolationType} required>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>
                {violationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Montant (KMF) *</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" required min={0} />
          </div>
          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Moroni, rond-point Volo Volo" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails supplémentaires..." />
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            <PlusCircle className="w-5 h-5 mr-2" />
            {loading ? "Enregistrement..." : "Enregistrer l'amende"}
          </Button>
        </form>
      </div>
    </OfficerLayout>
  );
}
