import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense, type ComponentType } from "react";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Work from "@/pages/Work";
import Writing from "@/pages/Writing";
import Music from "@/pages/Music";
import MusicSong from "@/pages/MusicSong";
import ArtistRadar from "@/pages/ArtistRadar";
import About from "@/pages/About";
import BlogPostPage from "@/pages/BlogPostPage";
import Portal from "@/pages/Portal";
import Wiki from "@/pages/Wiki";
import Privacy from "@/pages/Privacy";
import Rates from "@/pages/Rates";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";
import AmazonNlSpecialist from "@/pages/AmazonNlSpecialist";
import BolComConsultant from "@/pages/BolComConsultant";
import InterimEcommerceManager from "@/pages/InterimEcommerceManager";
import AiEcommerceAutomation from "@/pages/AiEcommerceAutomation";
import CaseStudyDetail from "@/pages/CaseStudyDetail";
import GodStructure from "@/pages/GodStructure";
import SamanthaAI from "@/pages/SamanthaAI";

/* WriteCMS is lazy-loaded — full Blog CMS shell at /write (3-mode: Write/Manage/Analytics).
   BlogCMS is kept for /blog-cms/voice/:id route only (VoiceTemplateEditor still uses it). */
const WriteCMS = lazy(() => import(/* webpackChunkName: "write-cms" */ "@/pages/WriteCMS"));

/* MusicCMS — songwriter Command Center op /music-cms, zusje van /write.
   Lazy-loaded en buiten de SSR-bundel, zelfde patroon als WriteCMS. */
const MusicCMS = lazy(() => import(/* webpackChunkName: "music-cms" */ "@/pages/MusicCMS"));

/* ReleaseSet — Neon House of Glass release-set (ingelogde subpagina via top-right menu). */
const ReleaseSet = lazy(() => import(/* webpackChunkName: "release-set" */ "@/pages/ReleaseSet"));

/* Dashboards — klant-dashboards (ConnectCarParts) achter login, via profielmenu. */
const DashboardsVandaag = lazy(() => import(/* webpackChunkName: "dashboards-vandaag" */ "@/pages/dashboards/Vandaag"));
const Dashboards = lazy(() => import(/* webpackChunkName: "dashboards" */ "@/pages/Dashboards"));
const DashboardsCcp = lazy(() => import(/* webpackChunkName: "dashboards-ccp" */ "@/pages/dashboards/DashboardsCcp"));
const DashboardsHvl = lazy(() => import(/* webpackChunkName: "dashboards-hvl" */ "@/pages/dashboards/DashboardsHvl"));
const DashboardsMpg = lazy(() => import(/* webpackChunkName: "dashboards-mpg" */ "@/pages/dashboards/DashboardsMpg"));

/* BlogCMS is lazy-loaded and excluded from the SSR bundle.
   During prerender (typeof window === "undefined"), the fallback renders instead. */
const BlogCMS = lazy(() => import(/* webpackChunkName: "blog-cms" */ "@/pages/BlogCMS"));
const VoiceTemplateEditor = lazy(() => import(/* webpackChunkName: "voice-template-editor" */ "@/components/portal/blog/VoiceTemplateEditor"));

const LANG_PREFIXES = ["", "/nl"] as const;

const BlogCMSFallback = () => <div className="min-h-screen bg-[hsl(220,18%,5%)]" />;

/* /blog-cms is retired — React CMS shell at /write is canonical.
   /write is now a React route (write-src.html is the archived static prototype). */
const BlogCMSToWriteRedirect = () => {
  if (typeof window !== "undefined") {
    window.location.replace("/write");
  }
  return <BlogCMSFallback />;
};

/* Legacy /blog/<slug> URLs still occur in older article content and external
   references; the canonical article path is /writing/<slug>. */
const LegacyBlogRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const { search, hash } = useLocation();
  return <Navigate to={`/writing/${slug ?? ""}${search}${hash}`} replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Eén URL per taal (HAN-167/HAN-83): elke gelokaliseerde route bestaat als
            EN-pad én als /nl-pad. De taal komt uit de URL (zie hooks/useLang). */}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/`} path={`${prefix}/`} element={<PageTransition><Index /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/work`} path={`${prefix}/work`} element={<PageTransition><Work /></PageTransition>} />
        ))}
        <Route path="/portfolio" element={<Navigate to="/work" replace />} />
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/work/connect-car-parts`} path={`${prefix}/work/connect-car-parts`} element={<PageTransition><CaseStudyDetail /></PageTransition>} />
        ))}
        <Route path="/writing" element={<PageTransition><Writing /></PageTransition>} />
        <Route path="/writing/:slug" element={<PageTransition><BlogPostPage /></PageTransition>} />
        <Route path="/blog" element={<Navigate to="/writing" replace />} />
        <Route path="/blog/:slug" element={<LegacyBlogRedirect />} />
        <Route path="/music" element={<PageTransition><Music /></PageTransition>} />
        <Route path="/music/:slug" element={<PageTransition><MusicSong /></PageTransition>} />
        <Route path="/muziek/artist-radar" element={<PageTransition><ArtistRadar /></PageTransition>} />
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/about`} path={`${prefix}/about`} element={<PageTransition><About /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/amazon-nl-specialist`} path={`${prefix}/amazon-nl-specialist`} element={<PageTransition><AmazonNlSpecialist /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/bol-com-consultant`} path={`${prefix}/bol-com-consultant`} element={<PageTransition><BolComConsultant /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/interim-ecommerce-manager`} path={`${prefix}/interim-ecommerce-manager`} element={<PageTransition><InterimEcommerceManager /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/ai-ecommerce-automation`} path={`${prefix}/ai-ecommerce-automation`} element={<PageTransition><AiEcommerceAutomation /></PageTransition>} />
        ))}
        <Route path="/portal" element={<PageTransition><Portal /></PageTransition>} />
        <Route path="/write" element={<Suspense fallback={<BlogCMSFallback />}><WriteCMS /></Suspense>} />
        <Route path="/write/:id" element={<Suspense fallback={<BlogCMSFallback />}><WriteCMS /></Suspense>} />
        <Route path="/music-cms" element={<Suspense fallback={<BlogCMSFallback />}><MusicCMS /></Suspense>} />
        <Route path="/music-cms/:id" element={<Suspense fallback={<BlogCMSFallback />}><MusicCMS /></Suspense>} />
        <Route path="/release-set" element={<Suspense fallback={<BlogCMSFallback />}><ReleaseSet /></Suspense>} />
        <Route path="/dashboards" element={<Suspense fallback={<BlogCMSFallback />}><DashboardsVandaag /></Suspense>} />
        <Route path="/dashboards/operatie" element={<Suspense fallback={<BlogCMSFallback />}><Dashboards /></Suspense>} />
        <Route path="/dashboards/ccp" element={<Suspense fallback={<BlogCMSFallback />}><DashboardsCcp /></Suspense>} />
        <Route path="/dashboards/hvl" element={<Suspense fallback={<BlogCMSFallback />}><DashboardsHvl /></Suspense>} />
        <Route path="/dashboards/mpg" element={<Suspense fallback={<BlogCMSFallback />}><DashboardsMpg /></Suspense>} />
        <Route path="/blog-cms" element={<BlogCMSToWriteRedirect />} />
        <Route path="/blog-cms/voice/:id" element={<Suspense fallback={<BlogCMSFallback />}><VoiceTemplateEditor /></Suspense>} />
        <Route path="/wiki" element={<PageTransition><Wiki /></PageTransition>} />
        <Route path="/god-structure" element={<GodStructure />} />
        <Route path="/samantha" element={<SamanthaAI />} />
        <Route path="/empire" element={<Navigate to="/samantha" replace />} />
        <Route path="/hansai" element={<Navigate to="/samantha" replace />} />
        <Route path="/hans-ai" element={<Navigate to="/samantha" replace />} />
        <Route path="/command" element={<Navigate to="/samantha" replace />} />
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/privacy`} path={`${prefix}/privacy`} element={<PageTransition><Privacy /></PageTransition>} />
        ))}
        {LANG_PREFIXES.map((prefix) => (
          <Route key={`${prefix}/rates`} path={`${prefix}/rates`} element={<PageTransition><Rates /></PageTransition>} />
        ))}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
