import { describe, expect, it, vi } from "vitest";
import contactFormSource from "./ContactForm.tsx?raw";

import { contactEndpoint, makeContactSchema, submitContact } from "./ContactForm";
import { translations } from "@/data/translations";

const data = { name: "Test", email: "test@example.com", reason: "general", message: "Hallo" };
const ok = (status: number) => vi.fn(async () => new Response(null, { status })) as unknown as typeof fetch;

describe("submitContact", () => {
  it("never sends anything outside the production host (preview/localhost)", async () => {
    const f = ok(200);
    expect(await submitContact(data, { fetchImpl: f, turnstileToken: "t" })).toBe("preview"); // jsdom = localhost
    expect(await submitContact(data, { isProduction: false, fetchImpl: f, turnstileToken: "t" })).toBe("preview");
    expect(f).not.toHaveBeenCalled();
  });

  it("does not send without a Turnstile token", async () => {
    const f = ok(200);
    expect(await submitContact(data, { isProduction: true, fetchImpl: f })).toBe("captcha");
    expect(f).not.toHaveBeenCalled();
  });

  it("posts to the contact-submit Edge Function (never a direct table insert) and reports sent on 2xx", async () => {
    const f = ok(200);
    expect(await submitContact(data, { isProduction: true, fetchImpl: f, turnstileToken: "tok", website: "" })).toBe("sent");
    const [url, init] = vi.mocked(f).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(contactEndpoint());
    expect(url.endsWith("/functions/v1/contact-submit")).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ ...data, website: "", turnstileToken: "tok" });
    // Geen sleutels in de browserrequest: de functie draait zonder JWT-verificatie en verifieert Turnstile.
    expect(Object.keys(init.headers as Record<string, string>)).toEqual(["content-type"]);
  });

  it("maps 429 to limited, 403 to captcha, other failures to error (no false success)", async () => {
    const opts = { isProduction: true, turnstileToken: "tok" };
    expect(await submitContact(data, { ...opts, fetchImpl: ok(429) })).toBe("limited");
    expect(await submitContact(data, { ...opts, fetchImpl: ok(403) })).toBe("captcha");
    expect(await submitContact(data, { ...opts, fetchImpl: ok(400) })).toBe("error");
    expect(await submitContact(data, { ...opts, fetchImpl: ok(502) })).toBe("error");
    expect(await submitContact(data, { ...opts, fetchImpl: ok(503) })).toBe("error");
  });

  it("maps a network failure (rejected promise) to error instead of throwing", async () => {
    const f = vi.fn(async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;
    expect(await submitContact(data, { isProduction: true, turnstileToken: "tok", fetchImpl: f })).toBe("error");
  });

  it("no longer references a direct contact_submissions insert from the browser", () => {
    const src = contactFormSource;
    expect(src).not.toMatch(/\.from\(\s*["']contact_submissions/);
    expect(src).not.toMatch(/\.insert\(/);
  });
});

describe("makeContactSchema", () => {
  it("uses Dutch messages for the NL form", () => {
    const r = makeContactSchema(translations.nl.contact).safeParse({ ...data, email: "x" , name: "" });
    expect(r.success).toBe(false);
    const msgs = r.success ? [] : r.error.issues.map((i) => i.message);
    expect(msgs).toContain(translations.nl.contact.required);
    expect(msgs).toContain(translations.nl.contact.invalidEmail);
  });

  it("has limited/captcha messages in both languages", () => {
    for (const lang of ["en", "nl"] as const) {
      expect(translations[lang].contact.limitedMessage.length).toBeGreaterThan(10);
      expect(translations[lang].contact.captchaMessage.length).toBeGreaterThan(10);
    }
  });
});
