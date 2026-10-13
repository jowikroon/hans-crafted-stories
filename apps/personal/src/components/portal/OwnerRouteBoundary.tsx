import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

const ownerRoutes = ['/write','/blog-cms','/music-cms','/release-set','/god-structure','/dashboards','/bijlagen','/samantha','/muziek/artist-radar'];
export const isOwnerRoute = (path: string) => ownerRoutes.some(route=>path===route||path.startsWith(route+'/'));
export default function OwnerRouteBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { loading: authLoading } = useAuth();
  const { isAdmin, loading } = useAdmin();
  if (!isOwnerRoute(pathname)) return <>{children}</>;
  if (loading || authLoading) return <p className="p-8 text-sm text-muted-foreground">Toegang controleren…</p>;
  if (!isAdmin) return <Navigate to="/portal" replace />;
  return <>{children}</>;
}
