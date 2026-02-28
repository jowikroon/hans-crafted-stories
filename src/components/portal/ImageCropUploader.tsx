import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, X, Image as ImageIcon, ZoomIn, RotateCcw, Crop } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  imageUrl: string;
  onImageChange: (url: string) => void;
  storagePath: string; // e.g. "blog-images" or "case-study-images"
  filePrefix: string;  // e.g. slug or identifier
  aspectRatio?: number;
  label?: string;
  hint?: string;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.92);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

const ImageCropUploader = ({
  imageUrl,
  onImageChange,
  storagePath,
  filePrefix,
  aspectRatio = 4 / 3,
  label = "Cover Image",
  hint = "Recommended: 1200×900px (4:3). You can crop after selecting.",
}: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleCropAndUpload = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      const path = `${storagePath}/${filePrefix}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("bucket").upload(path, croppedBlob, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpeg",
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
      onImageChange(urlData.publicUrl);
      setCropDialogOpen(false);
      setRawImage(null);
      toast.success("Image cropped & uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async () => {
    if (!rawImage) return;
    // Upload original without cropping
    setUploading(true);
    try {
      const res = await fetch(rawImage);
      const blob = await res.blob();
      const path = `${storagePath}/${filePrefix}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("bucket").upload(path, blob, {
        cacheControl: "3600",
        upsert: true,
        contentType: blob.type,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("bucket").getPublicUrl(path);
      onImageChange(urlData.publicUrl);
      setCropDialogOpen(false);
      setRawImage(null);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{label}</label>
          {imageUrl && (
            <button
              type="button"
              onClick={() => {
                // Allow re-crop of existing image
                setRawImage(imageUrl);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCropDialogOpen(true);
              }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Crop size={12} />
              Re-crop
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/60">{hint}</p>

        {imageUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-border group">
            <img src={imageUrl} alt="Cover" className="h-44 w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-white/90 p-2 text-foreground shadow-sm hover:bg-white transition-colors"
                  title="Replace image"
                >
                  <Upload size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onImageChange("")}
                  className="rounded-full bg-white/90 p-2 text-destructive shadow-sm hover:bg-white transition-colors"
                  title="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-all ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-muted-foreground/40 hover:bg-secondary/30"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ImageIcon size={20} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Drag & drop or <span className="font-medium text-primary">click to browse</span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">JPG, PNG, WebP up to 10MB</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!uploading) setCropDialogOpen(open); }}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Crop size={18} className="text-primary" />
              Crop Image
            </DialogTitle>
            <DialogDescription>
              Drag to reposition and use the slider to zoom. The highlighted area will be used.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop area */}
            <div className="relative h-[340px] w-full overflow-hidden rounded-lg bg-black/95">
              {rawImage && (
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  showGrid
                  style={{
                    containerStyle: { borderRadius: "0.5rem" },
                  }}
                />
              )}
            </div>

            {/* Zoom control */}
            <div className="flex items-center gap-3 px-1">
              <ZoomIn size={14} className="shrink-0 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(v) => setZoom(v[0])}
                className="flex-1"
              />
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center">
              Drag to reposition · Scroll or use slider to zoom · The highlighted area will be shown on the blog card
            </p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipCrop}
              disabled={uploading}
              className="text-muted-foreground"
            >
              Skip crop, upload original
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setCropDialogOpen(false); setRawImage(null); }} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleCropAndUpload} disabled={uploading}>
                {uploading ? "Uploading…" : "Crop & Upload"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCropUploader;
