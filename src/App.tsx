import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/hooks/useLang";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import EmpireTerminalCard from "./components/empire/EmpireTerminalCard";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

const AppShell = () => {
  const location = useLocation();
  const isDarkPage = location.pathname === "/hansai" || location.pathname === "/empire";
  const isPortal = location.pathname === "/portal";
  const hideChrome = isDarkPage || isPortal;

  return (
    <AuthProvider>
      <LangProvider>
        {!isPortal && <Navbar variant={isDarkPage ? "dark" : "default"} />}
        <main className={isPortal ? "" : "min-h-screen"}>
          <AnimatedRoutes />
        </main>
        {!hideChrome && <Footer />}
        {!hideChrome && <EmpireTerminalCard />}
        <CookieConsent />
      </LangProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
