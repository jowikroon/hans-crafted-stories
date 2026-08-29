import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Work from "@/pages/Work";
import Writing from "@/pages/Writing";
import About from "@/pages/About";
import BlogPostPage from "@/pages/BlogPostPage";
import Portal from "@/pages/Portal";
import Wiki from "@/pages/Wiki";
import Empire from "@/pages/Empire";
import EmpireLayout from "@/components/empire/EmpireLayout";
import OpenClaw from "@/pages/OpenClaw";
import HansAI from "@/pages/HansAI";
import AIHub from "@/pages/AIHub";
import Templates from "@/pages/Templates";

import Privacy from "@/pages/Privacy";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";
import AmazonNlSpecialist from "@/pages/AmazonNlSpecialist";
import BolComConsultant from "@/pages/BolComConsultant";
import InterimEcommerceManager from "@/pages/InterimEcommerceManager";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/work" element={<PageTransition><Work /></PageTransition>} />
        <Route path="/writing" element={<PageTransition><Writing /></PageTransition>} />
        <Route path="/writing/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/amazon-nl-specialist" element={<PageTransition><AmazonNlSpecialist /></PageTransition>} />
        <Route path="/bol-com-consultant" element={<PageTransition><BolComConsultant /></PageTransition>} />
        <Route path="/interim-ecommerce-manager" element={<PageTransition><InterimEcommerceManager /></PageTransition>} />
        <Route path="/portal" element={<PageTransition><Portal /></PageTransition>} />
        <Route path="/wiki" element={<Navigate to="/empire/wiki" replace />} />
        <Route path="/empire" element={<PageTransition><EmpireLayout /></PageTransition>}>
          <Route index element={<Empire />} />
          <Route path="wiki" element={<Wiki />} />
          <Route path="openclaw" element={<OpenClaw />} />
        </Route>
        <Route path="/hansai" element={<HansAI />} />
        <Route path="/ai" element={<AIHub />} />
        <Route path="/templates" element={<PageTransition><Templates /></PageTransition>} />
        
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
