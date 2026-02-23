import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import EmpireTerminalCard from "./components/empire/EmpireTerminalCard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            <AnimatedRoutes />
          </main>
          <Footer />
          <EmpireTerminalCard />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
