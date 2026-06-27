import { useEffect, useState } from "react";
import { ShoppingBag, Database, MessageSquare, Menu, X, Landmark } from "lucide-react";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAiAssistant: () => void;
  isAdminAuthorized: boolean;
}

export default function Navbar({ currentView, onNavigate, onOpenAiAssistant, isAdminAuthorized }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ticker").then((res) => (res.ok ? res.json() : null)).catch(() => null),
      fetch("/api/products")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => (Array.isArray(data) ? data.filter((p: any) => !p.hidden) : []))
        .catch(() => [])
    ])
      .then(([tickerData, data]) => {
        let nepaliItems: string[] = [
          "नमस्ते र हार्दिक स्वागत छ !",
          "०% ब्याज दरमा सजिलो किस्ता (EMI) सुबिधा उपलब्ध !",
          "रुपन्देही जिल्लाभरि नि:शुल्क डेलिभरी !"
        ];

        let englishItems: string[] = [
          "Warm Welcome to Riaan Ko Pasal!",
          "[EMI] 0% Interest Easy EMI Installments Available!",
          "Free Delivery All Over Rupandehi District!"
        ];

        if (tickerData && Array.isArray(tickerData.nepali) && tickerData.nepali.length > 0) {
          nepaliItems = tickerData.nepali;
        }
        if (tickerData && Array.isArray(tickerData.english) && tickerData.english.length > 0) {
          englishItems = tickerData.english;
        }

        const dynamicMap: Record<string, Set<string>> = {};
        
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((p) => {
            if (p.brand && p.category) {
              const formattedCat = p.category.trim();
              if (formattedCat) {
                if (!dynamicMap[formattedCat]) {
                  dynamicMap[formattedCat] = new Set();
                }
                dynamicMap[formattedCat].add(p.brand.trim());
              }
            }
          });
        }

        // Helper translate functions to separate Nepali and English category labels
        const getNepaliCategoryLabel = (categoryName: string): string => {
          const cleaned = categoryName.toUpperCase().trim();
          if (cleaned === "MOBILE" || cleaned === "PHONES") return "मोबाइल";
          if (cleaned === "TV" || cleaned === "TELEVISION") return "टिभी";
          if (cleaned === "FRIDGE" || cleaned === "REFRIGERATOR") return "फ्रिज";
          if (cleaned === "AC" || cleaned === "AIR CONDITIONER") return "एसी";
          if (cleaned === "WASHING MACHINE" || cleaned === "WASHER") return "वासिङ मेसिन";
          if (cleaned === "OTHER") return "अन्य सामग्री";
          return categoryName;
        };

        const getEnglishCategoryLabel = (categoryName: string): string => {
          const cleaned = categoryName.toUpperCase().trim();
          if (cleaned === "MOBILE" || cleaned === "PHONES") return "Mobile Phones";
          if (cleaned === "TV" || cleaned === "TELEVISION") return "Smart TVs";
          if (cleaned === "FRIDGE" || cleaned === "REFRIGERATOR") return "Refrigerators";
          if (cleaned === "AC" || cleaned === "AIR CONDITIONER") return "Air Conditioners";
          if (cleaned === "WASHING MACHINE" || cleaned === "WASHER") return "Washing Machines";
          return categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();
        };

        const finalNepali = [...nepaliItems];
        const finalEnglish = [...englishItems];

        Object.entries(dynamicMap).forEach(([cat, brandsSet]) => {
          if (brandsSet.size > 0) {
            const brandListAsString = Array.from(brandsSet).join(", ");
            finalNepali.push(`${getNepaliCategoryLabel(cat)}: ${brandListAsString}`);
            finalEnglish.push(`${getEnglishCategoryLabel(cat)}: ${brandListAsString}`);
          }
        });

        // Combine with Nepali items, a super spacious decorated central separator, and English items
        setTickerItems([
          ...finalNepali,
          "               ★   ★   ★   ★   ★               ",
          ...finalEnglish,
          "               ★   ★   ★   ★   ★               "
        ]);
      })
      .catch((err) => {
        console.error("Error updating products for live ticker tape:", err);
      });
  }, [currentView]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    
    // Smooth scroll to top for home
    if (view === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#3e0504]/95 backdrop-blur-md shadow-lg py-3 border-b border-yellow-600/20"
          : "bg-[#4a0605] py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleLinkClick("home")}
          className="flex items-center space-x-3 cursor-pointer group"
          id="nav-brand-container"
        >
          <div className="relative w-11 h-11 bg-amber-500/10 rounded-full flex items-center justify-center p-1 border border-yellow-500/30 overflow-hidden">
            <img
              src="/ganesha.png"
              alt="Ganesha Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter brightness-110 drop-shadow-[0_0_3px_rgba(234,179,8,0.5)]"
              onError={(e) => {
                // Return fallback icon if image does not exist yet
                e.currentTarget.style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector(".fallback-ganesha");
                if (fallback) fallback.classList.remove("hidden");
              }}
            />
            {/* Fallback Vector Ornament */}
            <div className="fallback-ganesha hidden w-full h-full flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-8 h-8 filter drop-shadow-[0_1px_3px_rgba(234,179,8,0.3)] animate-pulse"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="goldGradNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <g>
                  {/* Crown */}
                  <path d="M100 25 C100 12, 106 8, 100 3 C94 8, 100 12, 100 25" stroke="url(#goldGradNav)" strokeWidth="6" strokeLinecap="round" />
                  <path d="M82 35 C88 27, 112 27, 118 35" stroke="url(#goldGradNav)" strokeWidth="5" strokeLinecap="round" />
                  {/* Ears */}
                  <path d="M98 46 C35 46, 30 95, 62 106 C72 111, 83 100, 88 95" stroke="url(#goldGradNav)" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M102 46 C165 46, 170 95, 138 106 C128 111, 117 100, 112 95" stroke="url(#goldGradNav)" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Nose-Trunk */}
                  <path d="M100 63 C101 90, 128 115, 122 150 C116 182, 74 182, 69 150 C66 134, 80 123, 93 128" stroke="url(#goldGradNav)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg sm:text-xl text-yellow-500 tracking-wider leading-none uppercase">
              Riaan Ko Pasal
            </span>
            <span className="text-[10px] tracking-widest text-amber-200 uppercase mt-0.5 font-mono">
              Riaan Enterprises
            </span>
          </div>
        </div>

        {/* Desktop Links - Matches user design request exactly */}
        <div className="hidden md:flex items-center space-x-8" id="nav-desktop-links">
          {/* Secret, Clean DOM-Only Button for Staff Portal */}
          <button
            onClick={() => handleLinkClick("admin")}
            id="secret-portal-button"
            aria-hidden="true"
            tabIndex={-1}
            className="opacity-0 absolute w-0 h-0 pointer-events-none select-none sr-only"
            style={{ width: 0, height: 0, margin: 0, padding: 0, border: 0, space: "none", overflow: "hidden" }}
          >
            Staff Portal Backdoor
          </button>

          <button
            onClick={() => handleLinkClick("home")}
            id="btn-nav-home"
            className={`font-display text-sm tracking-widest uppercase font-medium transition-colors ${
              currentView === "home" ? "text-yellow-500 underline decoration-solid decoration-2 underline-offset-8" : "text-amber-100 hover:text-yellow-400"
            }`}
          >
            HOME
          </button>
          
          <button
            onClick={() => handleLinkClick("about")}
            id="btn-nav-about"
            className={`font-display text-sm tracking-widest uppercase font-medium transition-colors ${
              currentView === "about" ? "text-yellow-500 underline decoration-solid decoration-2 underline-offset-8" : "text-amber-100 hover:text-yellow-400"
            }`}
          >
            ABOUT US
          </button>

          <button
            onClick={() => handleLinkClick("catalog")}
            id="btn-nav-buy"
            className={`font-display text-sm tracking-widest uppercase font-medium transition-colors flex items-center space-x-1.5 ${
              currentView === "catalog" || currentView === "products" || currentView === "product-detail" ? "text-yellow-500 underline decoration-solid decoration-2 underline-offset-8" : "text-amber-100 hover:text-yellow-400"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BUY NOW</span>
          </button>

          {isAdminAuthorized && (
            <button
              onClick={() => handleLinkClick("admin")}
              id="btn-nav-admin"
              className={`font-display text-[10px] tracking-widest uppercase font-mono px-4 py-2 rounded-full border transform hover:scale-[1.04] active:scale-[0.96] ${
                currentView === "admin"
                  ? "bg-yellow-500 text-maroon-950 border-yellow-500 font-bold shadow-md shadow-yellow-500/20"
                  : "text-amber-200 hover:text-white border-dashed border-amber-500/30 hover:border-solid hover:border-yellow-500 hover:bg-yellow-500/10 hover:shadow-[0_0_10px_rgba(234,179,8,0.35)]"
              } flex items-center space-x-1.5 transition-all duration-300 ease-out cursor-pointer select-none`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>SHOP ADMIN</span>
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="btn-mobile-menu"
            className="text-amber-100 p-2 hover:text-yellow-500 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer links */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#4a0605] border-t border-yellow-600/10 px-4 py-4 space-y-3 shadow-inner" id="nav-mobile-menu">
          <button
            onClick={() => handleLinkClick("home")}
            className="block w-full text-left px-3 py-2 text-base font-medium text-amber-100 hover:text-yellow-400 rounded-md hover:bg-yellow-950/30"
          >
            HOME
          </button>
          <button
            onClick={() => handleLinkClick("about")}
            className="block w-full text-left px-3 py-2 text-base font-medium text-amber-100 hover:text-yellow-400 rounded-md hover:bg-yellow-950/30"
          >
            ABOUT US
          </button>
          <button
            onClick={() => handleLinkClick("catalog")}
            className="block w-full text-left px-3 py-2 text-base font-medium text-amber-100 hover:text-yellow-400 rounded-md hover:bg-yellow-950/30 flex items-center space-x-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BUY NOW</span>
          </button>


          {isAdminAuthorized && (
            <>
              <div className="border-t border-yellow-600/15 my-2 pt-2"></div>
              <button
                onClick={() => handleLinkClick("admin")}
                className="block w-full text-left px-3 py-2 text-sm font-mono text-amber-200 hover:text-white rounded-md hover:bg-yellow-950/30 flex items-center space-x-2"
              >
                <Database className="w-4 h-4" />
                <span>SHOP ADMIN (Spreadsheet)</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Dynamic Infinite Category & Brand Marquee Ticker Tape with Smooth 60fps Scrolling */}
      <div className={`w-full border-t border-yellow-600/15 py-1.5 mt-2.5 overflow-hidden select-none relative z-10 shadow-inner flex items-center transition-colors duration-300 ${scrolled ? "bg-[#3e0504]/95" : "bg-[#4a0605]"}`}>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marqueeCustom {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-marquee-custom {
            display: flex;
            white-space: nowrap;
            width: max-content;
            animation: marqueeCustom 90s linear infinite;
            will-change: transform;
          }
          .animate-marquee-custom:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="animate-marquee-custom text-[11px] font-mono tracking-wider text-amber-100/90 gap-16 whitespace-pre">
          <span className="flex items-center gap-16 select-none">
            <span>{tickerItems.join("   ★   ")}</span>
            <span className="text-yellow-500 font-bold">★</span>
            <span>{tickerItems.join("   ★   ")}</span>
            <span className="text-yellow-500 font-bold">★</span>
          </span>
          <span className="flex items-center gap-16 select-none">
            <span>{tickerItems.join("   ★   ")}</span>
            <span className="text-yellow-500 font-bold">★</span>
            <span>{tickerItems.join("   ★   ")}</span>
            <span className="text-yellow-500 font-bold">★</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
