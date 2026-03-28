import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  ImageIcon, Upload, Trash2, Search, Copy, Check,
  FolderOpen, Grid3x3, List, X,
} from "lucide-react";
import {
  MediaItem, getMediaItems, uploadMedia, deleteMedia, updateMediaAlt,
} from "@/lib/api/media";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, clicking an image calls this instead of just browsing */
  onSelect?: (url: string) => void;
}

const FOLDERS = ["all", "general", "blog-images", "case-study-images", "og-images"];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const MediaLibraryModal = ({ open, onOpenChange, onSelect }: Props) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altValue, setAltValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMediaItems(folder === "all" ? undefined : folder);
      setItems(data);
    } catch (e: unknown) {
      toast({ title: "Error loading media", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const name = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
        await uploadMedia(file, name, folder === "all" ? "general" : folder);
      }
      toast({ title: `${files.length} file(s) uploaded` });
      load();
    } catch (e: unknown) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.file_name}"?`)) return;
    try {
      await deleteMedia(item.id, item.storage_path);
      toast({ title: "File deleted" });
      load();
    } catch (e: unknown) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.public_url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
    toast({ title: "URL copied to clipboard" });
  };

  const handleSaveAlt = async (item: MediaItem) => {
    try {
      await updateMediaAlt(item.id, altValue);
      setEditingAlt(null);
      load();
    } catch (e: unknown) {
      toast({ title: "Error saving alt text", description: e.message, variant: "destructive" });
    }
  };

  const filtered = search
    ? items.filter((i) =>
        i.file_name.toLowerCase().includes(search.toLowerCase()) ||
        i.alt_text.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ImageIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="font-display text-base">Media Library</DialogTitle>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                {filtered.length} file{filtered.length !== 1 ? "s" : ""}
                {folder !== "all" && ` in ${folder}`}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload size={13} className="mr-1.5" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border/30 bg-secondary/10">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full rounded-md border border-border/50 bg-card/50 py-1.5 pl-8 pr-3 text-xs outline-none placeholder:text-muted-foreground/30 focus:border-primary/40"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {FOLDERS.map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all ${
                  folder === f
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground/50 hover:text-muted-foreground border border-transparent"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
          <div className="flex rounded-md border border-border/50 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground/40"}`}
            >
              <Grid3x3 size={12} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground/40"}`}
            >
              <List size={12} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-12">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FolderOpen size={32} className="mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {search ? "No files match your search." : "No files uploaded yet."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Upload images to use across your blog posts and case studies.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-lg border border-border/60 bg-card/30 overflow-hidden transition-all hover:border-primary/30 ${
                    onSelect ? "cursor-pointer" : ""
                  }`}
                  onClick={onSelect ? () => { onSelect(item.public_url); onOpenChange(false); } : undefined}
                >
                  <div className="aspect-square bg-secondary/20">
                    <img
                      src={item.public_url}
                      alt={item.alt_text || item.file_name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[10px] font-medium text-foreground/80">{item.file_name}</p>
                    <p className="text-[9px] text-muted-foreground/40">{formatBytes(item.file_size)}</p>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyUrl(item); }}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:text-primary transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-background/90 border border-border/50 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-2.5 transition-all hover:border-primary/30 ${
                    onSelect ? "cursor-pointer" : ""
                  }`}
                  onClick={onSelect ? () => { onSelect(item.public_url); onOpenChange(false); } : undefined}
                >
                  <img
                    src={item.public_url}
                    alt={item.alt_text || item.file_name}
                    className="h-10 w-14 shrink-0 rounded object-cover bg-secondary/20"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground/80">{item.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/40">{formatBytes(item.file_size)}</span>
                      <span className="text-[10px] text-muted-foreground/40">{item.folder}</span>
                      {item.alt_text && (
                        <Badge variant="secondary" className="h-3.5 px-1 text-[8px]">ALT</Badge>
                      )}
                    </div>
                    {editingAlt === item.id ? (
                      <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={altValue}
                          onChange={(e) => setAltValue(e.target.value)}
                          className="h-6 text-[10px]"
                          placeholder="Alt text for accessibility & SEO"
                        />
                        <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleSaveAlt(item)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditingAlt(null)}>
                          <X size={10} />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingAlt(item.id); setAltValue(item.alt_text); }}
                      className="text-[10px] text-muted-foreground/40 hover:text-primary px-1.5 py-0.5 rounded transition-colors"
                    >
                      Alt
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyUrl(item); }}
                      className="text-muted-foreground/40 hover:text-primary p-1 rounded transition-colors"
                    >
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="text-muted-foreground/40 hover:text-destructive p-1 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibraryModal;
