import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const [sent, setSent] = useState(false);
  const target = gateLaunchTarget(params.get('host'), params.get('return'));

  useEffect(() => {
    if (!target || loading || !session || sent) return;
    setSent(true);
    formRef.current?.submit();
  }, [target, loading, session, sent]);

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
      {target && session && (
        <form ref={formRef} method="POST" action={target.action} className="hidden">
          <input type="hidden" name="token" value={session.access_token} />
          <input type="hidden" name="return" value={target.returnPath} />
        </form>
      )}
    </main>
  );
}
