import { useState } from "react";
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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  reason: z.string().min(1, "Required"),
  message: z.string().trim().min(1, "Required").max(2000),
});

type ContactData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const { lang } = useLang();
  const t = translations[lang].contact;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ContactData>({
    name: "",
    email: "",
    reason: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactData, string>>>({});

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("contact_submissions" as any)
      .insert([result.data] as any);

    setLoading(false);

    if (error) {
      toast.error(t.errorMessage);
      return;
    }

    toast.success(t.successMessage);
    setForm({ name: "", email: "", reason: "", message: "" });
    setErrors({});
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
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
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      {/* Reason */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="contact-reason" className="text-xs uppercase tracking-widest text-muted-foreground">
          {t.reason}
        </Label>
        <Select value={form.reason} onValueChange={(v) => handleChange("reason", v)}>
          <SelectTrigger id="contact-reason" className={errors.reason ? "border-destructive" : ""}>
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
        {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
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
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
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
      </div>
    </motion.form>
  );
};

export default ContactForm;
