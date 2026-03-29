import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, Link, Video, Loader2, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4", "video/quicktime", "video/x-msvideo",
  "video/x-ms-wmv", "video/webm", "video/mpeg",
];
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

function getVideoSrc(path: string): string {
  if (!path) return "";
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path;
}

function isYoutubeOrVimeo(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function getYoutubeEmbed(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

interface VideoUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export function VideoUploader({ value, onChange }: VideoUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      setUploadError("نوع الملف غير مدعوم. الصيغ المقبولة: MP4، MOV، AVI، WebM");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setUploadError("حجم الفيديو كبير جداً. الحد الأقصى 200 ميغابايت");
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(10);

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
      setProgress(40);

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!putRes.ok) throw new Error("فشل في رفع الفيديو");

      setProgress(100);
      onChange(objectPath as string);
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع أثناء الرفع";
      setUploadError(msg);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      e.target.value = "";
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    setUrlError("");
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setUrlError("الرابط غير صالح. يجب أن يبدأ بـ http:// أو https://");
      return;
    }
    onChange(url);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const clear = () => {
    onChange("");
    setUploadError(null);
  };

  const hasVideo = Boolean(value);
  const embedUrl = value ? getYoutubeEmbed(value) : null;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Preview */}
      {hasVideo && (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-black group">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              src={getVideoSrc(value)}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
          )}
          <button
            type="button"
            onClick={clear}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-600/90 hover:bg-red-700 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
            title="حذف الفيديو"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            <Play className="w-3 h-3 fill-white" />
            {isYoutubeOrVimeo(value) ? "يوتيوب / Vimeo" : "فيديو مرفق"}
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!hasVideo && !uploading && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
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
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/mpeg,.mp4,.mov,.avi,.webm,.mpeg"
            className="sr-only"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-3 pointer-events-none">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
              dragging ? "bg-primary/20" : "bg-muted group-hover:bg-primary/10"
            )}>
              <Video className={cn(
                "w-7 h-7 transition-colors",
                dragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                {dragging ? "أفلت الفيديو هنا" : "اسحب الفيديو أو انقر للاختيار"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                MP4، MOV، AVI، WebM · حجم أقصى 200 ميغابايت
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/30">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-2">جاري رفع الفيديو...</p>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        </div>
      )}

      {/* Error */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="mr-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* URL input toggle */}
      {!hasVideo && !uploading && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setShowUrlInput(!showUrlInput); setUrlError(""); setUrlInput(""); }}
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
            إضافة عبر رابط (يوتيوب / Vimeo / مباشر)
          </button>
        </div>
      )}

      {showUrlInput && !hasVideo && (
        <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-sm font-medium">رابط الفيديو</p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=... أو رابط مباشر"
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
