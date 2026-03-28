import { useLocation } from "wouter";
import { Globe, PlusCircle } from "lucide-react";
import { useLang } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

const socialLinks = [
  {
    href: "https://twitter.com",
    title: "Twitter / X",
    hoverColor: "rgba(255,255,255,0.9)",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    href: "https://instagram.com",
    title: "Instagram",
    hoverColor: "#e1306c",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    href: "https://snapchat.com",
    title: "Snapchat",
    hoverColor: "#FFFC00",
    path: "M12.166.8C9.924.8 7.25 1.8 5.79 4.566c-.724 1.363-.582 3.695-.52 4.72a1.16 1.16 0 0 1-.44.038c-.42-.048-.855-.215-1.29-.497a.5.5 0 0 0-.284-.09.86.86 0 0 0-.517.194.706.706 0 0 0-.29.57c0 .486.427.84 1.278 1.053l.196.044c.368.073.614.22.714.427.088.183.056.407-.094.648-.424.685-1.11 1.145-1.94 1.296-.398.072-.8.094-1.22.065a.52.52 0 0 0-.062-.004c-.383 0-.63.217-.676.595-.03.24.013.44.128.59.277.365.947.593 2.044.697.082.01.155.053.21.117a2.42 2.42 0 0 1 .4.763c.048.153.118.248.218.3a.77.77 0 0 0 .356.08c.217 0 .47-.05.742-.103.439-.086.984-.192 1.668-.192.367 0 .748.035 1.13.108.76.14 1.313.612 1.94 1.146.737.633 1.574 1.35 2.965 1.35 1.39 0 2.228-.717 2.965-1.35.627-.534 1.18-1.006 1.94-1.146.382-.073.763-.108 1.13-.108.684 0 1.229.106 1.668.192.272.053.525.103.742.103a.77.77 0 0 0 .356-.08c.1-.052.17-.147.218-.3a2.42 2.42 0 0 1 .4-.763.336.336 0 0 1 .21-.117c1.097-.104 1.767-.332 2.044-.697.115-.15.158-.35.128-.59-.046-.378-.293-.595-.676-.595a.52.52 0 0 0-.062.004c-.42.03-.822.007-1.22-.065-.83-.151-1.516-.611-1.94-1.296-.15-.241-.182-.465-.094-.648.1-.207.346-.354.714-.427l.196-.044c.851-.213 1.278-.567 1.278-1.053a.706.706 0 0 0-.29-.57.86.86 0 0 0-.517-.194.5.5 0 0 0-.284.09c-.435.282-.87.449-1.29.497a1.16 1.16 0 0 1-.44-.038c.062-1.025.204-3.357-.52-4.72C17.082 1.8 14.408.8 12.166.8z",
  },
];

export function TopBar() {
  const { toggleLang, lang } = useLang();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";

  const handlePostProperty = () => {
    if (isAuthenticated) {
      navigate("/listings/new");
    } else {
      navigate("/login");
    }
  };

  return (
    <div
      className="w-full h-10 flex items-center px-4 md:px-6 lg:px-10 shrink-0 gap-3"
      style={{
        background: "linear-gradient(90deg, #071022 0%, #0F1C3F 40%, #0e6d8f 80%, #0a5f7e 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
      dir="rtl"
    >
      <div className="flex-1" />

      {/* Post property button — placed left of social icons so it stays in main content area (not hidden by right sidebar) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handlePostProperty}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold text-white bg-primary/80 hover:bg-primary transition-all border border-white/10 hover:border-white/20"
        >
          <PlusCircle className="w-3 h-3" />
          <span>{isAr ? "أضف إعلانك" : "Post Property"}</span>
        </button>
      </div>

      <span className="text-white/20 text-xs">|</span>

      {/* Social media icons */}
      <div className="flex items-center gap-0.5">
        {socialLinks.map(s => (
          <a
            key={s.title}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            title={s.title}
            className="p-1.5 rounded-md transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.45)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = s.hoverColor; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)"; }}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
              <path d={s.path} />
            </svg>
          </a>
        ))}
      </div>

      <span className="text-white/20 text-xs">|</span>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border shrink-0"
        style={{
          color: "rgba(255,255,255,0.9)",
          borderColor: "rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.07)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
        }}
        title={isAr ? "Switch to English" : "التبديل للعربية"}
      >
        <Globe className="w-3 h-3 flex-shrink-0" />
        <span style={{ opacity: isAr ? 0.5 : 1 }}>EN</span>
        <span className="text-white/25">·</span>
        <span style={{ opacity: isAr ? 1 : 0.5 }}>عربي</span>
      </button>
    </div>
  );
}
