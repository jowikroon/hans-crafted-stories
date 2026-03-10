import { useState } from "react";
import { cn } from "@/lib/utils";

const NODES = [
  { id: "edge", label: "Edge / CDN", sub: "Cloudflare Pages", x: 280, y: 30, color: "#34d399", bg: "#34d39915" },
  { id: "backend", label: "Backend", sub: "Supabase", x: 130, y: 140, color: "#60a5fa", bg: "#60a5fa15" },
  { id: "automation", label: "Automation", sub: "n8n", x: 430, y: 140, color: "#a78bfa", bg: "#a78bfa15" },
  { id: "compute", label: "Compute", sub: "2× Hostinger VPS", x: 280, y: 260, color: "#fbbf24", bg: "#fbbf2415" },
  { id: "ai", label: "AI Models", sub: "Claude + Ollama", x: 130, y: 370, color: "#f472b6", bg: "#f472b615" },
  { id: "monitoring", label: "Monitoring", sub: "n8n + Python", x: 430, y: 370, color: "#fb923c", bg: "#fb923c15" },
];

const EDGES = [
  { from: "edge", to: "backend", label: "Supabase JS" },
  { from: "edge", to: "automation", label: "Webhooks" },
  { from: "backend", to: "ai", label: "Edge Fns → API" },
  { from: "automation", to: "compute", label: "SSH + Docker" },
  { from: "automation", to: "backend", label: "service_role" },
  { from: "compute", to: "ai", label: "Ollama API" },
  { from: "monitoring", to: "compute", label: "Health scripts" },
  { from: "monitoring", to: "automation", label: "Cron schedules" },
];

function getNodeCenter(id: string) {
  const n = NODES.find(n => n.id === id);
  return n ? { x: n.x + 70, y: n.y + 30 } : { x: 0, y: 0 };
}

export default function ArchitectureDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 overflow-x-auto">
      <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 mb-3">Architecture Topology</p>
      <svg viewBox="0 0 580 430" className="w-full max-w-[580px] mx-auto" style={{ minWidth: 400 }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#3f3f46" />
          </marker>
        </defs>

        {/* Edges */}
        {EDGES.map((e, i) => {
          const from = getNodeCenter(e.from);
          const to = getNodeCenter(e.to);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const isActive = hovered === e.from || hovered === e.to;
          return (
            <g key={i}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isActive ? "#52525b" : "#27272a"}
                strokeWidth={isActive ? 1.5 : 1}
                markerEnd="url(#arrowhead)"
                strokeDasharray={isActive ? "none" : "4 3"}
              />
              <text x={midX} y={midY - 5} textAnchor="middle" fill="#52525b" fontSize="8" fontFamily="monospace">{e.label}</text>
            </g>
          );
        })}

        {/* Nodes */}
        {NODES.map(n => {
          const isActive = hovered === n.id;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={n.x} y={n.y} width={140} height={60} rx={10}
                fill={n.bg}
                stroke={isActive ? n.color : "#27272a"}
                strokeWidth={isActive ? 1.5 : 1}
              />
              <text x={n.x + 70} y={n.y + 25} textAnchor="middle" fill={n.color} fontSize="11" fontWeight="600">{n.label}</text>
              <text x={n.x + 70} y={n.y + 42} textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="monospace">{n.sub}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
