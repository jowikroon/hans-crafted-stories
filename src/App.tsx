import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";

const queryClient = new QueryClient();

const DARK_PAGES = ["/seo-cms", "/portal/blog"];

const AppShell = () => {
  const location = useLocation();
  const isDarkPage = DARK_PAGES.some((p) => location.pathname.startsWith(p));

  return (
    <AuthProvider>
      <Navbar />
      <main className={`min-h-screen ${isDarkPage ? "bg-[#0a0a0a]" : ""}`}>
        <AnimatedRoutes />
      </main>
      {!isDarkPage && <Footer />}
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
