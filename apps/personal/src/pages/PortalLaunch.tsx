import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useForcedTheme } from '@/hooks/useTheme';
import { gateLaunchTarget } from '@/lib/portalGate';
import { Button } from '@/components/ui/button';

/**
 * Hand-off page for the portal gate Worker: a tool without a gate cookie sends
 * the browser here, and this page POSTs the portal session back to that tool.
 * The portal login is the only login; no second sign-in per tool.
 */
export default function PortalLaunch() {
  useForcedTheme('light');
  const [params] = useSearchParams();
  const { session, loading, signInWithGoogle } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const target = gateLaunchTarget(params.get('host'), params.get('return'));
  const hasTarget = target !== null;

  // Read the session at hand-off time and refresh a token about to expire, so
  // the Worker never receives one that lapses on the way.
  useEffect(() => {
    if (!hasTarget || loading || !session || started.current) return;
    started.current = true;
    void (async () => {
      let { data: { session: current } } = await supabase.auth.getSession();
      if (current?.expires_at && current.expires_at * 1000 - Date.now() < 60_000) {
        current = (await supabase.auth.refreshSession()).data.session ?? current;
      }
      setToken(current?.access_token ?? null);
    })();
  }, [hasTarget, loading, session]);

  useEffect(() => { if (token) formRef.current?.submit(); }, [token]);

  let body = <p>Tool openen…</p>;
  if (!target) body = <p>Onbekende tool-link. Open de tool vanuit de portal.</p>;
  else if (!loading && !session) body = (
    <>
      <p className="mb-4">Log in op de portal om deze tool te openen. Daarna ga je automatisch door.</p>
      <div className="flex gap-3">
        <Button onClick={signInWithGoogle}>Inloggen met Google</Button>
        <Button variant="outline" asChild><Link to="/portal">Naar de portal</Link></Button>
      </div>
    </>
  );

  return (
    <main className="min-h-screen flex items-center justify-center p-6 text-sm text-foreground">
      <div className="max-w-md">{body}</div>
      {target && token && (
        <form ref={formRef} method="POST" action={target.action} className="hidden">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="return" value={target.returnPath} />
        </form>
      )}
    </main>
  );
}
