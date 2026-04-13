import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

import Login from "./pages/Login";
import Index from "./pages/Index";
import PlateSearch from "./pages/PlateSearch";
import AddFine from "./pages/AddFine";
import ScanHistory from "./pages/ScanHistory";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminVehicles from "./pages/admin/Vehicles";
import AdminFines from "./pages/admin/Fines";
import AdminUsers from "./pages/admin/Users";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><PlateSearch /></ProtectedRoute>} />
            <Route path="/add-fine" element={<ProtectedRoute><AddFine /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><ScanHistory /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute><AdminRoute><AdminVehicles /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin/fines" element={<ProtectedRoute><AdminRoute><AdminFines /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><AdminRoute><AdminUsers /></AdminRoute></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
