import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function PlatformRatingWidget() {
  const [hovered, setHovered]     = useState(0);
  const [selected, setSelected]   = useState(0);
  const [avg, setAvg]             = useState(0);
  const [count, setCount]         = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [visible, setVisible]     = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${BASE_URL}/api/platform-rating`);
      const d = await r.json();
      setAvg(d.avg ?? 0);
      setCount(d.count ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const saved = localStorage.getItem("platform_rating_v1");
    if (saved) { setSelected(parseInt(saved, 10)); setSubmitted(true); }
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [fetchStats]);

  const handleRate = async (stars: number) => {
    if (submitted || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE_URL}/api/platform-rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars }),
      });
      const d = await r.json();
      if (d.success) {
        setSelected(stars);
        setSubmitted(true);
        setAvg(d.avg ?? 0);
        setCount(d.count ?? 0);
        localStorage.setItem("platform_rating_v1", String(stars));
      }
    } catch {}
    setLoading(false);
  };

  const activeStars = hovered || selected;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          style={{ width: "max-content", maxWidth: "calc(100vw - 32px)" }}
        >
          <div
            className="pointer-events-auto flex items-center gap-4 px-5 py-3 rounded-2xl shadow-2xl border"
            style={{
              background: "rgba(255,255,255,0.97)",
              borderColor: "rgba(15,123,160,0.2)",
              boxShadow: "0 8px 40px rgba(15,28,63,0.14), 0 2px 8px rgba(15,28,63,0.06)",
              backdropFilter: "blur(12px)",
            }}
          >
            {submitted ? (
              <>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4" style={{ fill: i <= Math.round(avg) ? "#FBBF24" : "#E5E7EB", color: i <= Math.round(avg) ? "#F59E0B" : "#D1D5DB" }} />
                  ))}
                </div>
                <span className="text-[12px] font-bold text-[#0F1C3F]">
                  {avg.toFixed(1)} <span className="text-muted-foreground font-medium">({count.toLocaleString("ar-SA")} تقييم)</span>
                </span>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">شكراً!</span>
              </>
            ) : (
              <>
                <span className="text-[12px] font-bold text-[#0F1C3F] whitespace-nowrap">قيّم المنصة</span>
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onMouseEnter={() => setHovered(s)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => handleRate(s)}
                      disabled={loading}
                      className="transition-transform duration-100 focus:outline-none disabled:cursor-not-allowed"
                      style={{ transform: activeStars >= s ? "scale(1.2)" : "scale(1)" }}
                      aria-label={`${s} نجوم`}
                    >
                      <Star
                        className="w-5 h-5 transition-colors duration-100"
                        style={{
                          fill: activeStars >= s ? "#FBBF24" : "#E5E7EB",
                          color: activeStars >= s ? "#F59E0B" : "#D1D5DB",
                          filter: activeStars >= s ? "drop-shadow(0 1px 3px rgba(251,191,36,0.5))" : "none",
                        }}
                      />
                    </button>
                  ))}
                </div>
                {count > 0 && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {avg.toFixed(1)} ({count.toLocaleString("ar-SA")})
                  </span>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
