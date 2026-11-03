import type { useAlbumPrivateDetails } from "@/hooks/useAlbumPrivateDetails";

/** Private content arrives only after the database has authorized the owner. */
export default function AlbumOwnerPanel({ access }: { access: ReturnType<typeof useAlbumPrivateDetails> }) {
  const { isOwner, loading, error, details } = access;
  if (!isOwner) return null;
  return <section className="ma-private" aria-labelledby="ma-private-title">
    <div className="ma-section-heading"><div><p className="ma-eyebrow">Jouw albumruimte · privé</p><h2 id="ma-private-title">Het verhaal achter de plaat.</h2></div><span className="ma-owner-label">Alleen voor jou</span></div>
    <div aria-live="polite">{loading ? <p>Je privédetails worden geladen…</p> : !details || error ? <p>Je privégegevens konden niet worden geladen. Probeer de pagina opnieuw te openen.</p> : <>
      <p className="ma-private__story">{details.story}</p>
      <details className="ma-guide"><summary>Volledige brandguide <span aria-hidden="true">+</span></summary>
        <p className="ma-track-note">De volledige brontekst uit je vault. Voor het actuele beeld zijn de definitieve hoezen op deze pagina leidend.</p>
        <div className="ma-guide__content">{details.brandGuide}</div>
      </details>
    </>}</div>
  </section>;
}
