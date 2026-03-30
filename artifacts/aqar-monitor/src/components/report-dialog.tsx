import { useState } from "react";
import { Flag, X, ChevronDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const REPORT_REASONS = [
  "محتوى مضلل أو كاذب",
  "احتيال أو نصب",
  "بيانات التواصل خاطئة",
  "إعلان مكرر",
  "محتوى مسيء أو غير لائق",
  "سعر مبالغ فيه",
  "الإعلان منتهي أو تم البيع",
  "أخرى",
];

interface ReportDialogProps {
  targetType: "listing" | "marketer" | "service_provider" | "customer_request";
  targetId: number;
  targetTitle?: string;
  trigger?: React.ReactNode;
}

export function ReportDialog({ targetType, targetId, targetTitle, trigger }: ReportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, targetTitle, reason, details }),
      });
      if (!res.ok) throw new Error("فشل الإرسال");
      setSubmitted(true);
    } catch {
      toast({ title: "خطأ", description: "فشل إرسال البلاغ، حاول مرة أخرى", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setSubmitted(false); setReason(""); setDetails(""); }, 300);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/5"
          >
            <Flag className="w-3.5 h-3.5" />
            إبلاغ
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="rounded-3xl border-border max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Flag className="w-4 h-4 text-destructive" />
              </div>
              إبلاغ عن محتوى
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground">تم إرسال البلاغ</h3>
              <p className="text-sm text-muted-foreground">شكراً لمساعدتنا في الحفاظ على جودة المنصة. سيتم مراجعة بلاغك من قِبل الإدارة.</p>
              <Button onClick={handleClose} className="rounded-xl mt-2">إغلاق</Button>
            </div>
          ) : (
            <div className="space-y-4 mt-1">
              {targetTitle && (
                <div className="bg-muted/50 rounded-2xl px-4 py-3 border border-border/60">
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">المحتوى المُبلَّغ عنه:</p>
                  <p className="text-sm font-bold text-foreground line-clamp-2">{targetTitle}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">سبب البلاغ <span className="text-destructive">*</span></label>
                <div className="relative">
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                    style={{ color: "#111827", background: "#fff" }}
                  >
                    <option value="" style={{ color: "#111827", background: "#fff" }}>— اختر السبب</option>
                    {REPORT_REASONS.map(r => (
                      <option key={r} value={r} style={{ color: "#111827", background: "#fff" }}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">تفاصيل إضافية (اختياري)</label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="أضف أي تفاصيل تساعدنا على معالجة البلاغ…"
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">بلاغك سيكون سرياً ولن يطّلع عليه صاحب المحتوى. فقط مدير المنصة يمكنه رؤيته.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={!reason || submitting}
                  className="flex-1 rounded-xl font-bold h-11"
                  style={{ background: "#dc2626" }}
                >
                  {submitting ? "جاري الإرسال…" : "إرسال البلاغ"}
                </Button>
                <Button variant="outline" onClick={handleClose} className="rounded-xl h-11 px-5 font-bold border-border">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
