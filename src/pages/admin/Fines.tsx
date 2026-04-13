import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Check } from "lucide-react";

export default function AdminFines() {
  const [fines, setFines] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchFines = async () => {
    const { data } = await supabase.from("fines").select("*").order("created_at", { ascending: false });
    setFines(data || []);
  };

  useEffect(() => { fetchFines(); }, []);

  const filtered = fines.filter((f) => {
    const matchSearch = f.plate_number.toLowerCase().includes(search.toLowerCase()) ||
      f.owner_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("fines").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Amende marquée comme payée" });
      fetchFines();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Amendes</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="unpaid">Impayées</SelectItem>
              <SelectItem value="paid">Payées</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plaque</TableHead>
                  <TableHead className="hidden md:table-cell">Propriétaire</TableHead>
                  <TableHead>Infraction</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono font-bold text-sm">{f.plate_number}</TableCell>
                    <TableCell className="hidden md:table-cell">{f.owner_name}</TableCell>
                    <TableCell className="text-sm">{f.violation_type}</TableCell>
                    <TableCell className="font-mono text-sm">{f.amount.toLocaleString()} KMF</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "paid" ? "default" : "destructive"}>
                        {f.status === "paid" ? "Payée" : "Impayée"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {f.status === "unpaid" && (
                        <Button variant="ghost" size="sm" onClick={() => markPaid(f.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune amende</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
