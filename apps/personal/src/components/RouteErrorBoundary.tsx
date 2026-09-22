import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { langFromPath } from "@/lib/i18n/routes";

/**
 * Vangnet rond de routes (i18n-audit 2026-09-22). Zonder boundary haalt React
 * bij één render-fout de hele app weg: een lege pagina zonder melding. Met
 * boundary blijven header en footer staan, ziet de bezoeker wat er misging en
 * kan hij herladen; de fout gaat naar de console (en naar GTM als die er is).
 * Reset zichzelf bij navigatie, zodat een fout op één pagina de rest niet
 * blokkeert.
 */
interface Props { resetKey: string; lang: "nl" | "en"; children: ReactNode }
interface State { error: Error | null }

class Boundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[route-error]", error, info.componentStack);
    try {
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: "route_error", error_message: String(error?.message || error), route: this.props.resetKey });
    } catch { /* analytics is optioneel */ }
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    const nl = this.props.lang === "nl";
    return (
      <section className="section-container py-20" role="alert" aria-live="assertive">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{nl ? "Er ging iets mis" : "Something went wrong"}</p>
        <h1 className="mt-3 text-2xl font-semibold">{nl ? "Deze pagina kon niet worden getoond." : "This page could not be displayed."}</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          {nl
            ? "De rest van de site werkt gewoon. Herlaad de pagina of ga terug naar de homepage."
            : "The rest of the site still works. Reload the page or go back to the homepage."}
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">{String(this.state.error.message || this.state.error).slice(0, 200)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">{nl ? "Herladen" : "Reload"}</button>
          <a href={nl ? "/nl" : "/"} className="rounded-full border border-border px-5 py-2 text-sm font-medium">{nl ? "Naar de homepage" : "Go to the homepage"}</a>
        </div>
      </section>
    );
  }
}

const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  return <Boundary resetKey={pathname} lang={langFromPath(pathname)}>{children}</Boundary>;
};

export default RouteErrorBoundary;
