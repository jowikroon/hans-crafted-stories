import { describe, it, expect } from 'vitest';
import { gateLaunchTarget } from './portalGate';

describe('Portal gate launch', () => {
  it('posts to the auth path of a gated host', () => expect(gateLaunchTarget('lab-canvas.hansvanleeuwen.com', '/x?y=1'))
    .toEqual({ action: 'https://lab-canvas.hansvanleeuwen.com/__portal/auth', returnPath: '/x?y=1' }));
  it.each([null, 'evil.example', 'hansvanleeuwen.com', 'lab-canvas.hansvanleeuwen.com.evil.example', 'LAB-CANVAS.hansvanleeuwen.com'])(
    'never sends the session to %s', host => expect(gateLaunchTarget(host, '/')).toBeNull());
  it.each([null, '', '//evil.example', '/\\evil.example', 'https://evil.example'])(
    'falls back to / for return path %s', path => expect(gateLaunchTarget('chatdev.hansvanleeuwen.com', path)?.returnPath).toBe('/'));
});
