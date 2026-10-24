import type { ReactNode } from "react";
import "./neon-workspace.css";

export default function NeonWorkspace({ library, artwork, cover }: { library: ReactNode; artwork: ReactNode; cover?: string }) {
  return <div className="neon-workspace">
    <header className="neon-workspace-header"><div><p className="neon-artist">JOWIKROON</p><h1>NEON</h1><p className="neon-subtitle">The Signal Between</p><p className="neon-workspace-intro">Eén plek voor het album in ontwikkeling.</p><svg viewBox="0 0 180 40" className="neon-signal" aria-hidden="true"><path d="M2 22H54Q64 22 70 16Q76 7 82 22Q88 36 94 22Q100 10 107 22H178" /></svg></div>{cover && <img src={cover} alt="NEON: twee handen op een donkere achtergrond" />}</header>
    <nav className="neon-section-nav" aria-label="Op deze albumpagina"><a href="#development">Development web pages</a><a href="#neon-beeldbank">Beeldbank</a><a href="#neon-projectbronnen">Projectbronnen</a></nav>
    <section id="neon-projectbronnen" className="neon-project-sources" aria-labelledby="neon-project-sources-heading">
      <div className="neon-section-heading"><div><h2 id="neon-project-sources-heading">Projectbronnen</h2><p>De lokale SecondBrainVault is de kennisbron. Deze privékoppelingen geven toegang tot de back-up, leeskopie en albumwerkmap.</p></div></div>
      <div className="neon-project-source-grid">
        <a href="https://github.com/jowikroon/hansos-vault-backup" target="_blank" rel="noopener noreferrer"><span className="neon-source-role">GitHub · privéback-up</span><strong>SecondBrainVault</strong><span>Versiegeschiedenis van de kennisbank.</span><span className="neon-source-action">Open back-up <span aria-hidden="true">↗</span></span></a>
        <a href="https://drive.google.com/drive/folders/1JxDsFNmLzWA62gzXXpezbfZjJ7nAO002" target="_blank" rel="noopener noreferrer"><span className="neon-source-role">Drive · geselecteerde leeskopie</span><strong>Vault Shadow</strong><span>Een selectie van de kennisbank om te raadplegen.</span><span className="neon-source-action">Open leeskopie <span aria-hidden="true">↗</span></span></a>
        <a href="https://drive.google.com/drive/folders/1YSnqyAtWDloNDezyVjHP3Wj0Qkp4143a" target="_blank" rel="noopener noreferrer"><span className="neon-source-role">Drive · media en bibliotheek</span><strong>NEON Album</strong><span>Gedeelde albumbeelden en werkbestanden.</span><span className="neon-source-action">Open albumwerkmap <span aria-hidden="true">↗</span></span></a>
      </div>
      <p className="neon-source-note">Koppelingen gecontroleerd op 24 oktober 2026. Een kopie kan achterlopen; controleer de bestandsdatum. Deze links starten geen synchronisatie.</p>
    </section>
    {library}
    <section id="neon-beeldbank" aria-label="NEON Beeldbank">{artwork}</section>
  </div>;
}
