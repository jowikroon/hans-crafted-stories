import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Work from "@/pages/Work";
import Writing from "@/pages/Writing";
import About from "@/pages/About";
import BlogPostPage from "@/pages/BlogPostPage";
import Portal from "@/pages/Portal";
import BlogManager from "@/pages/BlogManager";
import NotFound from "@/pages/NotFound";

const SeoCMS = lazy(() => import("@/pages/SeoCMS"));

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
        <Route path="/portal" element={<PageTransition><Portal /></PageTransition>} />
        <Route path="/portal/blog" element={<PageTransition><BlogManager /></PageTransition>} />
        <Route path="/seo-cms" element={<Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" /></div>}><PageTransition><SeoCMS /></PageTransition></Suspense>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
