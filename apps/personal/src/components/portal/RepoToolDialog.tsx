import { useEffect, useState } from 'react';
import { ExternalLink, Check, Star, Lock, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { PortalTool } from '@/lib/api/portal';
import { toolReviewsApi } from '@/lib/api/toolReviews';
import { safeToolUrl } from '@/lib/portalToolPolicy';

interface Props { tool: PortalTool; userId: string; isAdmin: boolean; canUse: boolean; onClose: () => void; onOpen: (tool: PortalTool) => void; onEdit: (tool: PortalTool) => void }
export default function RepoToolDialog({ tool, userId, isAdmin, canUse, onClose, onOpen, onEdit }: Props) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [verdict, setVerdict] = useState('untested');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true); setLoadError(false);
    toolReviewsApi.get(tool.id, userId).then(review => {
      if (live) { setRating(review?.rating ?? 0); setVerdict(review?.verdict ?? 'untested'); setNotes(review?.notes ?? ''); }
    }).catch(() => { if (live) setLoadError(true); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [tool.id, userId]);
  const save = async () => {
    setSaving(true);
    try { await toolReviewsApi.save({ tool_id: tool.id, user_id: userId, rating, verdict, notes }); toast({ title: 'Beoordeling opgeslagen', description: 'Alleen jij ziet deze beoordeling.' }); }
    catch { toast({ title: 'Opslaan mislukt', description: 'Je tekst blijft staan. Probeer opnieuw.', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const cfg = tool.config;
  const source = safeToolUrl(cfg.repository_url);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader className="text-left pr-8">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" />Eigen tools</div>
        <DialogTitle className="text-2xl">{tool.name}</DialogTitle>
        <DialogDescription className="leading-relaxed">{tool.description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-2 sm:grid-cols-2">
        <section><h3 className="mb-3 text-sm font-semibold">Wat kun je ermee?</h3><ul className="space-y-2.5">{tool.features.map(feature => <li key={feature} className="flex gap-2 text-sm text-muted-foreground"><Check className="mt-0.5 shrink-0 text-primary" size={15} />{feature}</li>)}</ul></section>
        <section className="rounded-xl border border-border bg-secondary/40 p-4"><h3 className="mb-2 text-sm font-semibold">Probeer dit</h3><p className="text-sm leading-relaxed text-muted-foreground">{String(cfg.try_prompt || 'Open de tool en probeer een kleine taak uit je eigen werk.')}</p></section>
      </div>
      {typeof cfg.limitations === 'string' && <p className="rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-muted-foreground">{cfg.limitations}</p>}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <Button disabled={!canUse} onClick={() => onOpen(tool)} className="gap-2"><ExternalLink size={15} />Open tool<span className="sr-only"> in een nieuw tabblad</span></Button>
        {source && <a href={source} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground underline underline-offset-4">Over het project</a>}
        {isAdmin && <Button variant="ghost" size="sm" onClick={() => onEdit(tool)} className="ml-auto gap-2"><Settings size={14} />Instellingen</Button>}
        {!canUse && <p className="flex w-full items-start gap-2 text-xs text-muted-foreground"><Lock size={14} className="shrink-0" />{cfg.member_access === 'owner-only' ? 'Deze installatie bevat een persoonlijke werkruimte. Hans kan een eigen omgeving voor je klaarzetten.' : 'Je mag deze tool bekijken. Hans kan ook gebruikstoegang geven.'}</p>}
      </div>
      <section className="space-y-3"><div><h3 className="text-sm font-semibold">Mijn beoordeling</h3><p className="mt-1 text-xs text-muted-foreground">Hoe bruikbaar is deze tool voor jouw werk? Alleen jij ziet je notities.</p></div>
        {loading ? <p className="text-sm">Beoordeling laden…</p> : loadError ? <p role="alert" className="text-sm text-destructive">Je beoordeling kon niet worden geladen. Sluit dit venster en probeer opnieuw.</p> : <>
          <div className="flex items-center gap-1" role="group" aria-label="Waardering">{[1,2,3,4,5].map(n => <button key={n} type="button" aria-label={`${n} ${n === 1 ? 'ster' : 'sterren'}`} aria-pressed={rating === n} onClick={() => setRating(rating === n ? 0 : n)} className="rounded-md p-2 text-primary focus-visible:outline focus-visible:outline-2"><Star size={22} fill={n <= rating ? 'currentColor' : 'none'} /></button>)}</div>
          <label className="block text-xs font-medium">Mijn keuze<select value={verdict} onChange={e => setVerdict(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="untested">Nog proberen</option><option value="useful">Bruikbaar voor mij</option><option value="explore">Verder onderzoeken</option><option value="not-for-me">Past niet bij mijn werk</option></select></label>
          <label className="block text-xs font-medium">Notities<Textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={4000} placeholder="Wat werkte goed? Waar zou je dit voor gebruiken?" className="mt-1.5 min-h-24" /></label>
          <Button variant="outline" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Beoordeling opslaan'}</Button>
        </>}
      </section>
    </DialogContent>
  </Dialog>;
}
