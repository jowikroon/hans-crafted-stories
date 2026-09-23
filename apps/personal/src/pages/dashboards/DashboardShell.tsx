import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useForcedTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  domain: string;
  children: ReactNode;
}

/**
 * Gedeelde schil voor alle /dashboards/*-routes.
 * Inloggen is niet genoeg: admin is vereist. De echte poort zijn de RLS-policies;
 * deze gate is er om een zinnige melding te tonen in plaats van een lege pagina.
 */
export default function DashboardShell({ title, domain, children }: Props) {
  useForcedTheme("light");
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F0] px-6">
        <div className="max-w-sm text-center">
          <Lock className="mx-auto mb-3 text-[#7E7A6F]" size={28} />
          <h1 className="text-lg font-semibold text-[#15140F]">Inloggen vereist</h1>
          <p className="mt-1 text-sm text-[#7E7A6F]">Deze dashboards zijn alleen voor beheerders.</p>
          <Link to="/portal" className="mt-4 inline-block rounded-full bg-[#15140F] px-5 py-2 text-sm text-[#FBF8F0]">
            Naar het portaal
          </Link>
        </div>
      </div>
    );
  }
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FBF8F0] text-sm text-[#7E7A6F]">Laden…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF8F0] px-6 text-center">
        <p className="text-sm text-[#7E7A6F]">Geen toegang tot de dashboards.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F0] pt-20">
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <header className="mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7E7A6F]">{domain}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#15140F]">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
