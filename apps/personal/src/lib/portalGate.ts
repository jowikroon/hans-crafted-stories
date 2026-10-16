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
