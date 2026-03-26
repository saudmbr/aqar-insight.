import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
// ScrollArea is used for the skipped rows list
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";

// ── DB fields the user can map to ──────────────────────────────────────────
const DB_FIELDS = [
  { key: "city",         label: "المدينة",                required: true  },
  { key: "district",     label: "الحي",                   required: true  },
  { key: "propertyType", label: "نوع العقار",             required: true  },
  { key: "listingType",  label: "نوع العملية (sale/rent)", required: true  },
  { key: "price",        label: "السعر",                  required: true  },
  { key: "area",         label: "المساحة (م²)",           required: true  },
  { key: "year",         label: "السنة",                  required: true  },
  { key: "month",        label: "الشهر",                  required: true  },
  { key: "recordedAt",   label: "تاريخ التسجيل",          required: true  },
  { key: "bedrooms",     label: "غرف النوم",              required: false },
  { key: "bathrooms",    label: "دورات المياه",           required: false },
  { key: "notes",        label: "ملاحظات",                required: false },
] as const;

type DbFieldKey = (typeof DB_FIELDS)[number]["key"];

// ── Auto-detect column names ────────────────────────────────────────────────
const AUTO_MATCH: Record<DbFieldKey, string[]> = {
  city:         ["المدينة", "مدينة", "city", "مدينه"],
  district:     ["الحي", "حي", "district", "neighborhood"],
  propertyType: ["نوع العقار", "نوع_العقار", "property_type", "propertytype", "النوع", "type"],
  listingType:  ["نوع العملية", "نوع_العملية", "listing_type", "listingtype", "العملية"],
  price:        ["السعر", "السعر الإجمالي", "price", "سعر", "التكلفة"],
  area:         ["المساحة", "مساحة", "area", "المساحه"],
  year:         ["السنة", "سنة", "year", "السنه"],
  month:        ["الشهر", "شهر", "month"],
  recordedAt:   ["تاريخ التسجيل", "تاريخ_التسجيل", "recorded_at", "recordedat", "التاريخ", "تاريخ", "date"],
  bedrooms:     ["غرف النوم", "غرف_النوم", "غرف", "bedrooms", "rooms", "bedroom"],
  bathrooms:    ["دورات المياه", "دورات_المياه", "حمامات", "bathrooms", "bathroom"],
  notes:        ["ملاحظات", "notes", "ملاحظه"],
};

function autoDetectMapping(headers: string[]): Record<string, DbFieldKey | "__skip__"> {
  const mapping: Record<string, DbFieldKey | "__skip__"> = {};
  for (const h of headers) {
    const lower = h.trim().toLowerCase();
    let matched: DbFieldKey | "__skip__" = "__skip__";
    for (const [field, aliases] of Object.entries(AUTO_MATCH)) {
      if (aliases.some(a => a.toLowerCase() === lower)) {
        matched = field as DbFieldKey;
        break;
      }
    }
    mapping[h] = matched;
  }
  return mapping;
}

// ── Parse file on client ───────────────────────────────────────────────────
async function parseFileClient(file: File): Promise<{ headers: string[]; preview: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  if (rows.length === 0) return { headers: [], preview: [] };
  const headers = Object.keys(rows[0]);
  const preview = rows.slice(0, 5).map(r =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k,
        v instanceof Date ? v.toISOString().split("T")[0] : String(v),
      ])
    )
  );
  return { headers, preview };
}

// ── Import result type ─────────────────────────────────────────────────────
interface ImportResult {
  imported: number;
  total: number;
  skipped: { rowIndex: number; reason: string }[];
}

type Step = 1 | 2 | 3;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, DbFieldKey | "__skip__">>({});
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setMapping({});
    setResult(null);
    setIsParsing(false);
    setIsImporting(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      toast({ title: "نوع الملف غير مدعوم", description: "الرجاء رفع ملف .csv أو .xlsx", variant: "destructive" });
      return;
    }
    setFile(f);
    setIsParsing(true);
    try {
      const { headers: h, preview: p } = await parseFileClient(f);
      if (h.length === 0) {
        toast({ title: "الملف فارغ", description: "لا يحتوي الملف على بيانات", variant: "destructive" });
        setIsParsing(false);
        return;
      }
      setHeaders(h);
      setPreview(p);
      setMapping(autoDetectMapping(h));
      setStep(2);
    } catch {
      toast({ title: "فشل قراءة الملف", description: "تأكد من صحة الملف وأنه ليس محمياً", variant: "destructive" });
    }
    setIsParsing(false);
  }, [toast]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const setColMapping = (uploadedCol: string, dbField: DbFieldKey | "__skip__") => {
    setMapping(prev => ({ ...prev, [uploadedCol]: dbField }));
  };

  const mappedRequiredFields = DB_FIELDS.filter(f => f.required).map(f => f.key);
  const assignedFields = Object.values(mapping).filter(v => v !== "__skip__") as DbFieldKey[];
  const missingRequired = mappedRequiredFields.filter(k => !assignedFields.includes(k as DbFieldKey));

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));

      const resp = await fetch("/api/properties/import", { method: "POST", body: formData });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "خطأ في الخادم" }));
        throw new Error(err.error ?? "خطأ غير معروف");
      }
      const data: ImportResult = await resp.json();
      setResult(data);
      setStep(3);

      // Invalidate all related queries so every page refreshes
      await queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/kpis"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/price-trends"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/property-types"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics/yearly-comparison"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/districts/comparison"] });

      toast({
        title: data.imported > 0 ? "تم الاستيراد بنجاح" : "لم يُستورد أي سجل",
        description: `تم إضافة ${data.imported.toLocaleString("ar-SA")} سجلاً من أصل ${data.total.toLocaleString("ar-SA")}`,
        variant: data.imported > 0 ? "default" : "destructive",
      });
    } catch (err) {
      toast({ title: "فشل الاستيراد", description: String((err as Error).message), variant: "destructive" });
    }
    setIsImporting(false);
  };

  const downloadTemplate = () => {
    window.open("/api/properties/import/template", "_blank");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" dir="rtl">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {step === 1 && "استيراد بيانات العقارات"}
              {step === 2 && "ربط الأعمدة وعرض البيانات"}
              {step === 3 && "نتائج الاستيراد"}
            </DialogTitle>
            {/* Step indicator */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s ? "bg-primary text-primary-foreground" :
                    step > s  ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                  </div>
                  {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-300" : "bg-border"}`} />}
                </div>
              ))}
            </div>
          </div>
          {/* Step labels */}
          <div className="flex gap-1 text-xs text-muted-foreground mt-1">
            <span className={`flex-1 text-center ${step === 1 ? "text-primary font-medium" : ""}`}>رفع الملف</span>
            <span className="w-8" />
            <span className={`flex-1 text-center ${step === 2 ? "text-primary font-medium" : ""}`}>ربط الأعمدة</span>
            <span className="w-8" />
            <span className={`flex-1 text-center ${step === 3 ? "text-primary font-medium" : ""}`}>النتائج</span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-1 pb-4">

            {/* ── STEP 1: Upload ────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6 pt-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInput} />
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-muted-foreground">جاري قراءة الملف...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-lg">اسحب الملف هنا أو انقر للاختيار</p>
                        <p className="text-muted-foreground text-sm mt-1">يدعم ملفات .xlsx و .xls و .csv</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template download */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">قالب Excel الجاهز</p>
                      <p className="text-xs text-muted-foreground">تحميل ملف Excel يحتوي على الأعمدة الصحيحة وبيانات تجريبية</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 shrink-0">
                    <Download className="w-4 h-4" />
                    تحميل القالب
                  </Button>
                </div>

                {/* Field reference */}
                <div className="p-4 rounded-xl border border-border/50 space-y-2">
                  <p className="text-sm font-medium text-foreground mb-3">الأعمدة المطلوبة والاختيارية</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {DB_FIELDS.map(f => (
                      <div key={f.key} className="flex items-center gap-2 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full ${f.required ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        <span className={f.required ? "font-medium" : "text-muted-foreground"}>{f.label}</span>
                        {f.required && <span className="text-primary text-[10px]">*</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Column Mapping + Preview ─────────────────────── */}
            {step === 2 && (
              <div className="space-y-6 pt-4">
                {/* File info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file?.name}</p>
                    <p className="text-xs text-muted-foreground">{headers.length} عمود مكتشف</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="shrink-0 gap-1 text-muted-foreground">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    تغيير الملف
                  </Button>
                </div>

                {/* Missing required fields warning */}
                {missingRequired.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">
                      حقول مطلوبة لم تُربط بعد:{" "}
                      <strong>
                        {missingRequired.map(k => DB_FIELDS.find(f => f.key === k)?.label).join("، ")}
                      </strong>
                    </p>
                  </div>
                )}

                {/* Mapping grid */}
                <div>
                  <p className="text-sm font-semibold mb-3 text-foreground">ربط الأعمدة بالحقول</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {headers.map(h => {
                      const current = mapping[h] ?? "__skip__";
                      const isRequired = current !== "__skip__" && DB_FIELDS.find(f => f.key === current)?.required;
                      return (
                        <div key={h} className="flex items-center gap-2 p-2 rounded-lg border border-border/40 bg-card">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">عمود الملف</p>
                            <p className="text-sm font-medium truncate text-foreground" title={h}>{h}</p>
                          </div>
                          <div className="text-muted-foreground shrink-0 px-1">←</div>
                          <div className="w-44 shrink-0">
                            <Select
                              value={current}
                              onValueChange={(v) => setColMapping(h, v as DbFieldKey | "__skip__")}
                            >
                              <SelectTrigger className={`h-8 text-xs ${isRequired ? "border-primary/50" : ""}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__skip__" className="text-muted-foreground text-xs">— تجاهل —</SelectItem>
                                {DB_FIELDS.map(f => (
                                  <SelectItem
                                    key={f.key}
                                    value={f.key}
                                    className="text-xs"
                                    disabled={assignedFields.includes(f.key) && current !== f.key}
                                  >
                                    {f.label}{f.required ? " *" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preview table */}
                {preview.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-foreground">معاينة البيانات (أول {preview.length} صفوف)</p>
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              {headers.map(h => (
                                <TableHead key={h} className="text-right text-xs whitespace-nowrap py-2 px-3">
                                  <div className="space-y-0.5">
                                    <div className="font-medium text-foreground">{h}</div>
                                    {mapping[h] && mapping[h] !== "__skip__" && (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal text-primary border-primary/30">
                                        {DB_FIELDS.find(f => f.key === mapping[h])?.label}
                                      </Badge>
                                    )}
                                    {mapping[h] === "__skip__" && (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal text-muted-foreground">
                                        مُتجاهَل
                                      </Badge>
                                    )}
                                  </div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.map((row, i) => (
                              <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                                {headers.map(h => (
                                  <TableCell key={h} className="text-xs py-1.5 px-3 whitespace-nowrap max-w-[140px] truncate">
                                    {row[h] ?? "—"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Results ───────────────────────────────────────── */}
            {step === 3 && result && (
              <div className="space-y-6 pt-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-center">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي الصفوف</p>
                    <p className="text-2xl font-bold">{result.total.toLocaleString("ar-SA")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs text-emerald-700">تم استيرادها</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{result.imported.toLocaleString("ar-SA")}</p>
                  </div>
                  <div className={`p-4 rounded-xl border text-center ${result.skipped.length > 0 ? "bg-red-50 border-red-200" : "bg-muted/20 border-border/40"}`}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {result.skipped.length > 0 ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-muted-foreground" />}
                      <p className={`text-xs ${result.skipped.length > 0 ? "text-red-700" : "text-muted-foreground"}`}>تم تخطيها</p>
                    </div>
                    <p className={`text-2xl font-bold ${result.skipped.length > 0 ? "text-red-700" : "text-foreground"}`}>{result.skipped.length.toLocaleString("ar-SA")}</p>
                  </div>
                </div>

                {/* Success banner */}
                {result.imported > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">
                      تم إضافة {result.imported.toLocaleString("ar-SA")} سجلاً إلى قاعدة البيانات. ستظهر البيانات في لوحة التحكم والمخططات والفلاتر فوراً.
                    </p>
                  </div>
                )}

                {/* Skipped rows */}
                {result.skipped.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      الصفوف المرفوضة ({result.skipped.length})
                    </p>
                    <div className="border border-border/50 rounded-xl overflow-hidden">
                      <ScrollArea className="h-48">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-right text-xs w-20 py-2 px-3">رقم الصف</TableHead>
                              <TableHead className="text-right text-xs py-2 px-3">سبب الرفض</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.skipped.map((s, i) => (
                              <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/5"}>
                                <TableCell className="text-xs py-1.5 px-3 font-mono text-muted-foreground">{s.rowIndex}</TableCell>
                                <TableCell className="text-xs py-1.5 px-3 text-destructive">{s.reason}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40 flex-shrink-0">
          {step === 1 && (
            <>
              <Button variant="outline" onClick={handleClose}>إلغاء</Button>
              <p className="text-xs text-muted-foreground">الحجم الأقصى: 10 ميغابايت</p>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                رجوع
              </Button>
              <div className="flex items-center gap-3">
                {missingRequired.length > 0 && (
                  <p className="text-xs text-amber-600">
                    {missingRequired.length} حقل مطلوب غير مربوط
                  </p>
                )}
                <Button
                  onClick={handleImport}
                  disabled={missingRequired.length > 0 || isImporting}
                  className="gap-2 font-bold"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isImporting ? "جاري الاستيراد..." : "ابدأ الاستيراد"}
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => { reset(); }} className="gap-2">
                <Upload className="w-4 h-4" />
                استيراد ملف آخر
              </Button>
              <Button onClick={handleClose} className="font-bold">
                إغلاق ومتابعة
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
