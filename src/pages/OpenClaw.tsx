import { useState, useEffect } from "react";
import { Bot, ExternalLink, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const OpenClaw = () => {
  const [openclawUrl, setOpenclawUrl] = useState(() => {
    return localStorage.getItem("openclaw_url") || "http://localhost:3000";
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrl, setTempUrl] = useState(openclawUrl);

  useEffect(() => {
    document.title = "OpenClaw AI — Sovereign Operations";
  }, []);

  const saveUrl = () => {
    setOpenclawUrl(tempUrl);
    localStorage.setItem("openclaw_url", tempUrl);
    setIsEditingUrl(false);
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          <h2 className="text-lg font-semibold">OpenClaw Interface</h2>
          <Shield size={14} className="ml-2 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Self-hosted & Secure</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditingUrl ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                className="h-8 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://your-openclaw-instance.com"
              />
              <Button size="sm" onClick={saveUrl} variant="default">Save</Button>
              <Button size="sm" onClick={() => setIsEditingUrl(false)} variant="ghost">Cancel</Button>
            </div>
          ) : (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => setIsEditingUrl(true)}>
                <Settings size={14} />
                Configure URL
              </Button>
              <a href={openclawUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="default" className="h-8 gap-2">
                  <ExternalLink size={14} />
                  Open in New Tab
                </Button>
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border bg-secondary/10 shadow-sm">
        {openclawUrl ? (
          <iframe 
            src={openclawUrl} 
            className="h-full w-full border-0" 
            title="OpenClaw"
            allow="microphone; camera; clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Bot size={48} className="mb-4 opacity-20" />
            <p>Please configure your OpenClaw instance URL.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenClaw;
