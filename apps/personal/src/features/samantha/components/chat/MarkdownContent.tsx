import { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const parts = useMemo(() => {
    const segments: { type: "text" | "code"; content: string; lang?: string }[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
      segments.push({ type: "code", content: match[2], lang: match[1] || undefined });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) segments.push({ type: "text", content: content.slice(lastIndex) });
    return segments;
  }, [content]);

  const renderInline = (text: string) =>
    text.split(/(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] font-mono">{part.slice(1, -1)}</code>;
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{linkMatch[1]}</a>;
      return <span key={i}>{part}</span>;
    });

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {parts.map((part, i) => {
        if (part.type === "code") {
          return (
            <div key={i} className="my-2 rounded-xl bg-black/30 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono">{part.lang || "code"}</span>
                <button onClick={() => { navigator.clipboard.writeText(part.content); setCopiedIdx(i); setTimeout(() => setCopiedIdx(null), 2000); }} className="flex items-center gap-1 text-[9px] text-white/30 hover:text-white/60 transition-colors">
                  {copiedIdx === i ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-white/70">{part.content}</pre>
            </div>
          );
        }
        return (
          <div key={i}>
            {part.content.split("\n").map((line, j) => {
              if (line.startsWith("- ") || line.startsWith("* ")) return <div key={j} className="flex gap-2 py-0.5"><span className="text-white/40 shrink-0">•</span><span>{renderInline(line.slice(2))}</span></div>;
              if (/^\d+\.\s/.test(line)) return <div key={j} className="flex gap-2 py-0.5"><span className="text-white/40 shrink-0 font-mono text-xs">{line.match(/^\d+/)?.[0]}.</span><span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span></div>;
              if (!line.trim()) return <div key={j} className="h-2" />;
              return <div key={j} className="py-0.5">{renderInline(line)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}
