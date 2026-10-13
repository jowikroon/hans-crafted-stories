import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';

/** Members get a tools-only portal instead of the site's management navigation. */
export default function PortalChrome({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  if (location.pathname.startsWith('/portal') && !isAdmin) return null;
  return <>{children}</>;
}
