// Tool hosts behind the portal gate Worker (workers/portal-gate). The portal
// only hands its session token to these hosts, never to an arbitrary one.
export const GATED_HOSTS = [
  'chatdev.hansvanleeuwen.com',
  'reverse.hansvanleeuwen.com',
  'lab-autodev.hansvanleeuwen.com',
  'lab-browser.hansvanleeuwen.com',
  'lab-canvas.hansvanleeuwen.com',
  'lab-changes.hansvanleeuwen.com',
  'lab-demo.hansvanleeuwen.com',
  'lab-notes.hansvanleeuwen.com',
  'lab-repos.hansvanleeuwen.com',
] as const;

export type GateLaunch = { action: string; returnPath: string };

/** Validates /portal/launch?host=&return= and returns where to POST the session, or null. */
export function gateLaunchTarget(host: string | null, returnPath: string | null): GateLaunch | null {
  if (!host || !(GATED_HOSTS as readonly string[]).includes(host)) return null;
  const path = returnPath && /^\/(?![/\\])/.test(returnPath) ? returnPath : '/';
  return { action: `https://${host}/__portal/auth`, returnPath: path };
}

/**
 * Clears the gate cookie on every tool host. Same-site no-cors requests carry
 * and accept the host's cookie, so this works from the portal origin.
 * Best effort: a host that is down simply keeps its cookie until it expires.
 */
export async function clearGateSessions(timeoutMs = 3000): Promise<void> {
  await Promise.race([
    Promise.allSettled(GATED_HOSTS.map(host =>
      fetch(`https://${host}/__portal/logout`, { mode: 'no-cors', credentials: 'include', cache: 'no-store' }))),
    new Promise(resolve => setTimeout(resolve, timeoutMs)),
  ]);
}
