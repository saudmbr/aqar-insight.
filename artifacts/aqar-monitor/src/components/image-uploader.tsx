import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, ArrowUp, ArrowDown, Link, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/jpg": "JPG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

function getImageSrc(path: string): string {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path;
}

interface UploadingFile {
  id: string;
  name: string;
  preview: string;
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  maxImages?: number;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  maxImages = 10,
  label = "الصور",
}: ImageUploaderProps) {
  const paths: string[] = value
    ? value.split("\n").map(s => s.trim()).filter(Boolean)
    : [];

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePaths = useCallback((newPaths: string[]) => {
    onChange(newPaths.filter(Boolean).join("\n"));
  }, [onChange]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `نوع الملف غير مدعوم. الصيغ المقبولة: JPG، PNG، WebP.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `حجم الملف كبير جداً. الحد الأقصى 5 ميغابايت.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const error = validateFile(file);
    if (error) return null;

    const preview = URL.createObjectURL(file);
    const id = crypto.randomUUID();

    setUploading(prev => [...prev, { id, name: file.name, preview, progress: 10 }]);

    try {
      const urlRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!urlRes.ok) throw new Error("فشل في الحصول على رابط الرفع");

      const { uploadURL, objectPath } = await urlRes.json();

      setUploading(prev =>
        prev.map(u => u.id === id ? { ...u, progress: 40 } : u)
      );

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) throw new Error("فشل في رفع الصورة");

      setUploading(prev =>
        prev.map(u => u.id === id ? { ...u, progress: 100 } : u)
      );

      setTimeout(() => {
        setUploading(prev => prev.filter(u => u.id !== id));
        URL.revokeObjectURL(preview);
      }, 600);

      return objectPath as string;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع أثناء الرفع";
      setUploading(prev =>
        prev.map(u => u.id === id ? { ...u, error: msg, progress: 0 } : u)
      );
      setTimeout(() => {
        setUploading(prev => prev.filter(u => u.id !== id));
        URL.revokeObjectURL(preview);
      }, 3000);
      return null;
    }
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = maxImages - paths.length - uploading.length;
    if (remaining <= 0) return;

    const toUpload = arr.slice(0, remaining);
    const results = await Promise.all(toUpload.map(uploadFile));
    const newPaths = results.filter((p): p is string => Boolean(p));
    if (newPaths.length > 0) {
      updatePaths([...paths, ...newPaths]);
    }
  }, [paths, uploading.length, maxImages, uploadFile, updatePaths]);

  const handleDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeImage = (idx: number) => {
    const newPaths = [...paths];
    newPaths.splice(idx, 1);
    updatePaths(newPaths);
  };

  const moveImage = (idx: number, dir: -1 | 1) => {
    const newPaths = [...paths];
    const target = idx + dir;
    if (target < 0 || target >= newPaths.length) return;
    [newPaths[idx], newPaths[target]] = [newPaths[target], newPaths[idx]];
    updatePaths(newPaths);
  };

  const addUrl = () => {
    const url = urlInput.trim();
    setUrlError("");
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setUrlError("الرابط غير صالح. يجب أن يبدأ بـ http:// أو https://");
      return;
    }
    if (paths.includes(url)) {
      setUrlError("هذا الرابط موجود مسبقاً");
      return;
    }
    updatePaths([...paths, url]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const canAddMore = paths.length + uploading.length < maxImages;

  return (
    <div className="space-y-4" dir="rtl">
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group",
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleInputChange}
          />

          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              dragging ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
            )}>
              <Upload className={cn(
                "w-7 h-7 transition-colors",
                dragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground" data-testid="uploader-dropzone-text">
                {dragging ? "أفلت الصور هنا" : "اسحب الصور أو انقر للاختيار"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG، PNG، WebP · حجم أقصى 5 ميغابايت لكل صورة
                {maxImages > 1 && ` · حتى ${maxImages} صور`}
              </p>
            </div>
          </div>
        </div>
      )}

      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <img src={u.preview} alt="" className="w-full h-full object-cover" />
                {!u.error && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{u.name}</p>
                {u.error ? (
                  <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{u.error}</span>
                  </div>
                ) : (
                  <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {paths.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {paths.map((path, idx) => (
            <div
              key={path}
              className="group relative rounded-xl overflow-hidden border border-border bg-muted aspect-square"
            >
              <img
                src={getImageSrc(path)}
                alt={`صورة ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='12'%3Eصورة%3C/text%3E%3C/svg%3E";
                }}
              />

              {idx === 0 && (
                <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow" data-testid="main-image-badge">
                  رئيسية
                </div>
              )}

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, -1)}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                    title="تحريك للأمام"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
                {idx < paths.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 1)}
                    className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
                    title="تحريك للخلف"
                  >
                    <ArrowDown className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-7 h-7 rounded-full bg-red-500/90 hover:bg-red-600 flex items-center justify-center shadow-sm transition-colors"
                  title="حذف الصورة"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {paths.length === 0 && uploading.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="w-4 h-4" />
          <span>لم يتم إضافة صور بعد. الصورة الأولى ستكون الصورة الرئيسية.</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          {paths.length} / {maxImages} صور
        </p>
        <button
          type="button"
          onClick={() => {
            setShowUrlInput(!showUrlInput);
            setUrlError("");
            setUrlInput("");
          }}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
        >
          <Link className="w-3.5 h-3.5" />
          إضافة عبر رابط
        </button>
      </div>

      {showUrlInput && (
        <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-sm font-medium">إضافة صورة عبر رابط URL</p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrl())}
              className="h-10 rounded-xl font-mono text-sm flex-1"
              dir="ltr"
            />
            <Button type="button" size="sm" onClick={addUrl} className="rounded-xl h-10 px-4">
              إضافة
            </Button>
          </div>
          {urlError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {urlError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
