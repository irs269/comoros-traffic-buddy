import { Link } from "react-router-dom";
import { Search, PlusCircle, History, Camera } from "lucide-react";
import { motion } from "framer-motion";
import OfficerLayout from "@/components/OfficerLayout";

const actions = [
  { to: "/search", icon: Search, label: "Rechercher\nPlaque", color: "bg-primary text-primary-foreground" },
  { to: "/add-fine", icon: PlusCircle, label: "Nouvelle\nAmende", color: "bg-warning text-warning-foreground" },
  { to: "/history", icon: History, label: "Historique\nRecherches", color: "bg-secondary text-secondary-foreground" },
  { to: "/scan", icon: Camera, label: "Scanner\nPlaque", color: "bg-accent text-accent-foreground" },
];

export default function OfficerHome() {
  return (
    <OfficerLayout>
      <div className="space-y-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold">Bienvenue, Agent</h1>
          <p className="text-muted-foreground">Système de Contraventions Routières</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {actions.map(({ to, icon: Icon, label, color, disabled }, i) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {disabled ? (
                <div className={`${color} rounded-2xl p-6 flex flex-col items-center justify-center text-center h-36 opacity-50 cursor-not-allowed`}>
                  <Icon className="w-10 h-10 mb-2" />
                  <span className="text-sm font-semibold whitespace-pre-line">{label}</span>
                </div>
              ) : (
                <Link to={to} className={`${color} rounded-2xl p-6 flex flex-col items-center justify-center text-center h-36 hover:opacity-90 transition-all active:scale-95 shadow-sm`}>
                  <Icon className="w-10 h-10 mb-2" />
                  <span className="text-sm font-semibold whitespace-pre-line">{label}</span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </OfficerLayout>
  );
}
