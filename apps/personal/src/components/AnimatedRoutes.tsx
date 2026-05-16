import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, type ComponentType } from "react";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Work from "@/pages/Work";
import Writing from "@/pages/Writing";
import About from "@/pages/About";
import BlogPostPage from "@/pages/BlogPostPage";
import Portal from "@/pages/Portal";
import Wiki from "@/pages/Wiki";
import Privacy from "@/pages/Privacy";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";
import AmazonNlSpecialist from "@/pages/AmazonNlSpecialist";
import BolComConsultant from "@/pages/BolComConsultant";
import InterimEcommerceManager from "@/pages/InterimEcommerceManager";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import GodStructure from "@/pages/GodStructure";
import SamanthaAI from "@/pages/SamanthaAI";

/* BlogCMS is lazy-loaded and excluded from the SSR bundle.
   During prerender (typeof window === "undefined"), the fallback renders instead. */
const BlogCMS = lazy(() => import(/* webpackChunkName: "blog-cms" */ "@/pages/BlogCMS"));
const VoiceTemplateEditor = lazy(() => import(/* webpackChunkName: "voice-template-editor" */ "@/components/portal/blog/VoiceTemplateEditor"));

const BlogCMSFallback = () => <div className="min-h-screen bg-[hsl(220,18%,5%)]" />;

/* /blog-cms is retired — Write.html shell at /write is canonical.
   /write is served as a static file (public/write.html), so we must do a full
   page navigation here, not a React Router <Navigate>. */
const BlogCMSToWriteRedirect = () => {
  if (typeof window !== "undefined") {
    window.location.replace("/write");
  }
  return <BlogCMSFallback />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/work" element={<PageTransition><Work /></PageTransition>} />
        <Route path="/work/connect-car-parts" element={<PageTransition><CaseStudyDetail /></PageTransition>} />
        <Route path="/writing" element={<PageTransition><Writing /></PageTransition>} />
        <Route path="/writing/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/amazon-nl-specialist" element={<PageTransition><AmazonNlSpecialist /></PageTransition>} />
        <Route path="/bol-com-consultant" element={<PageTransition><BolComConsultant /></PageTransition>} />
        <Route path="/interim-ecommerce-manager" element={<PageTransition><InterimEcommerceManager /></PageTransition>} />
        <Route path="/portal" element={<PageTransition><Portal /></PageTransition>} />
        <Route path="/blog-cms" element={<BlogCMSToWriteRedirect />} />
        <Route path="/blog-cms/voice/:id" element={<Suspense fallback={<BlogCMSFallback />}><VoiceTemplateEditor /></Suspense>} />
        <Route path="/wiki" element={<PageTransition><Wiki /></PageTransition>} />
        <Route path="/god-structure" element={<GodStructure />} />
        <Route path="/samantha" element={<SamanthaAI />} />
        <Route path="/empire" element={<Navigate to="/samantha" replace />} />
        <Route path="/hansai" element={<Navigate to="/samantha" replace />} />
        <Route path="/hans-ai" element={<Navigate to="/samantha" replace />} />
        <Route path="/command" element={<Navigate to="/samantha" replace />} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
