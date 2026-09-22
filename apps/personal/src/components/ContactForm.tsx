import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";
import { isProductionHost } from "@/lib/config/productionHost";
import { ObfuscatedMailto } from "@/components/ObfuscatedMailto";

type ContactT = (typeof translations)["en"]["contact"];

// Lokaliseerde meldingen; server-side validatie is een aparte (backend) stap.
export const makeContactSchema = (t: Pick<ContactT, "required" | "invalidEmail">) =>
  z.object({
    name: z.string().trim().min(1, t.required).max(100),
    email: z.string().trim().min(1, t.required).email(t.invalidEmail).max(255),
    reason: z.string().min(1, t.required),
    message: z.string().trim().min(1, t.required).max(2000),
  });

type ContactData = z.infer<ReturnType<typeof makeContactSchema>>;
type Status = { kind: "idle" } | { kind: "success" | "error" | "preview" | "invalid"; text: string };

const FIELD_ORDER: (keyof ContactData)[] = ["name", "email", "reason", "message"];
const FIELD_IDS: Record<keyof ContactData, string> = {
  name: "contact-name",
  email: "contact-email",
  reason: "contact-reason",
  message: "contact-message",
};

/**
 * Verstuurt een contactaanvraag. Alleen op het productiedomein wordt er
 * werkelijk in `contact_submissions` geschreven; elders (Vercel-preview,
 * localhost) is het resultaat "preview" en gebeurt er niets.
 * Succes = insert zonder error (anon mag niet SELECTen, dus geen .select()).
 */
export async function submitContact(
  data: ContactData,
  opts: { isProduction?: boolean } = {},
): Promise<"sent" | "preview" | "error"> {
  if (!(opts.isProduction ?? isProductionHost())) return "preview";
  try {
    const { error } = await supabase
      .from("contact_submissions" as unknown)
      .insert([data] as unknown);
    return error ? "error" : "sent";
  } catch {
    return "error";
  }
}

const ContactForm = () => {
  const { lang } = useLang();
  const t = translations[lang].contact;
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<ContactData>({
    name: "",
    email: "",
    reason: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData, string>>>({ /* empty */ });

  const reasons = [
    { value: "freelance", label: t.reasonFreelance },
    { value: "job", label: t.reasonJob },
    { value: "collaboration", label: t.reasonCollaboration },
    { value: "general", label: t.reasonGeneral },
  ];

  const handleChange = (field: keyof ContactData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // aria-koppeling voor veldfouten (F4.6)
  const fieldA11y = (field: keyof ContactData) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `${FIELD_IDS[field]}-error` }
      : { "aria-invalid": false as const };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const result = makeContactSchema(t).safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactData, string>> = { /* empty */ };
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactData;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setStatus({ kind: "invalid", text: t.errorSummary });
      const first = FIELD_ORDER.find((f) => fieldErrors[f]);
      if (first) formRef.current?.querySelector<HTMLElement>(`#${FIELD_IDS[first]}`)?.focus();
      return;
    }

    setLoading(true);
    setStatus({ kind: "idle" });
    let outcome: "sent" | "preview" | "error" = "error";
    try {
      outcome = await submitContact(result.data);
    } finally {
      setLoading(false);
    }

    if (outcome === "error") {
      // Formulierwaarden blijven staan zodat de bezoeker opnieuw kan proberen.
      setStatus({ kind: "error", text: t.errorMessage });
      toast.error(t.errorMessage);
      return;
    }
    if (outcome === "preview") {
      setStatus({ kind: "preview", text: t.previewNotSent });
      toast.message(t.previewNotSent);
      return;
    }

    setStatus({ kind: "success", text: t.successMessage });
    toast.success(t.successMessage);
    setForm({ name: "", email: "", reason: "", message: "" });
    setErrors({ /* empty */ });
  };

  return (
    <motion.form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={loading}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="mt-8 grid gap-5 sm:grid-cols-2"
    >
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="contact-name" className="text-xs uppercase tracking-widest text-muted-foreground">
          {t.name}
        </Label>
        <Input
          id="contact-name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder={t.namePlaceholder}
          maxLength={100}
          className={errors.name ? "border-destructive" : ""}
          required
          {...fieldA11y("name")}
        />
        {errors.name && <p id="contact-name-error" className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="contact-email" className="text-xs uppercase tracking-widest text-muted-foreground">
          {t.email}
        </Label>
        <Input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder={t.emailPlaceholder}
          maxLength={255}
          className={errors.email ? "border-destructive" : ""}
          required
          {...fieldA11y("email")}
        />
        {errors.email && <p id="contact-email-error" className="text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Reason */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="contact-reason" className="text-xs uppercase tracking-widest text-muted-foreground">
          {t.reason}
        </Label>
        <Select value={form.reason} onValueChange={(v) => handleChange("reason", v)}>
          <SelectTrigger id="contact-reason" className={errors.reason ? "border-destructive" : ""} aria-required="true" {...fieldA11y("reason")}>
            <SelectValue placeholder={t.reasonPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {reasons.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.reason && <p id="contact-reason-error" className="text-xs text-destructive">{errors.reason}</p>}
      </div>

      {/* Message */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="contact-message" className="text-xs uppercase tracking-widest text-muted-foreground">
          {t.message}
        </Label>
        <Textarea
          id="contact-message"
          value={form.message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder={t.messagePlaceholder}
          maxLength={2000}
          rows={5}
          className={errors.message ? "border-destructive" : ""}
          required
          {...fieldA11y("message")}
        />
        {errors.message && <p id="contact-message-error" className="text-xs text-destructive">{errors.message}</p>}
      </div>

      {/* Submit */}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={loading} className="group gap-2">
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} className="transition-transform group-hover:translate-x-0.5" />
          )}
          {loading ? t.sending : t.send}
        </Button>
        <p role="status" aria-live="polite" className={`mt-3 text-sm ${status.kind === "success" ? "text-foreground" : status.kind === "idle" ? "sr-only" : "text-destructive"}`}>
          {status.kind === "idle" ? "" : status.text}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <ObfuscatedMailto user="hansvl3" domain="gmail.com" className="underline underline-offset-4 hover:text-foreground">
            {t.emailFallback}
          </ObfuscatedMailto>
        </p>
      </div>
    </motion.form>
  );
};

export default ContactForm;
