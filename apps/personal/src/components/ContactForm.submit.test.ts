import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => ({ insert })) },
}));

import { makeContactSchema, submitContact } from "./ContactForm";
import { supabase } from "@/integrations/supabase/client";
import { translations } from "@/data/translations";

const data = { name: "Test", email: "test@example.com", reason: "general", message: "Hallo" };

describe("submitContact", () => {
  beforeEach(() => {
    insert.mockReset();
    vi.mocked(supabase.from).mockClear();
  });

  it("never writes to Supabase outside the production host (preview/localhost)", async () => {
    expect(await submitContact(data)).toBe("preview"); // jsdom = localhost
    expect(await submitContact(data, { isProduction: false })).toBe("preview");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("reports sent only when the insert returns no error", async () => {
    insert.mockResolvedValueOnce({ error: null });
    expect(await submitContact(data, { isProduction: true })).toBe("sent");
    expect(supabase.from).toHaveBeenCalledWith("contact_submissions");
  });

  it("maps an insert error to error (no false success)", async () => {
    insert.mockResolvedValueOnce({ error: { message: "rls" } });
    expect(await submitContact(data, { isProduction: true })).toBe("error");
  });

  it("maps a network failure (rejected promise) to error instead of throwing", async () => {
    insert.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await submitContact(data, { isProduction: true })).toBe("error");
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
});
