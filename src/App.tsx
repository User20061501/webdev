import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate, useLocation, useParams } from "react-router-dom";
import { Facebook, Instagram, Music } from "lucide-react";
import Navbar from "./components/Costumer Page/Navbar";
import Hero from "./components/Costumer Page/Hero";
import Catalog from "./components/Costumer Page/Catalog";
import About from "./components/Costumer Page/About";
import ProductDetailPage from "./components/Costumer Page/ProductDetailPage";
import PhoneDetailModal from "./components/Costumer Page/PhoneDetailModal";
import CheckoutModal from "./components/Costumer Page/CheckoutModal";
import AdminSpreadsheet from "./components/Portal/AdminSpreadsheet";
import AdminLoginGate from "./components/Portal/AdminLoginGate";
import ShoppingAI from "./components/Costumer Page/ShoppingAI";

import { PhoneProduct } from "./types";

interface ProductDetailRouteWrapperProps {
  products: PhoneProduct[];
  previousView: string;
  onProceedToCheckout: (
    buyType: "Direct" | "EMI",
    selectedColor: string,
    emiDetails?: { tenure: number; downpayment: number; monthly: number }
  ) => void;
}

function ProductDetailRouteWrapper({
  products,
  previousView,
  onProceedToCheckout
}: ProductDetailRouteWrapperProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = products.find((p) => p.id?.toString() === id);

  if (!product) {
    return (
      <div className="pt-32 pb-24 text-center">
        <h2 className="text-xl font-bold text-gray-750">Product not found</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-5 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <ProductDetailPage
      product={product}
      onBack={() => {
        if (previousView === "products") {
          navigate("/products");
        } else {
          navigate("/");
        }
      }}
      onProceedToCheckout={onProceedToCheckout}
    />
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [previousView, setPreviousView] = useState<string>("home");
  const [aiBotOpen, setAiBotOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [adminSession, setAdminSession] = useState<{ username: string; passcode: string; role: "Owner" | "Admin" | "Moderator" } | null>(null);
  const [products, setProducts] = useState<PhoneProduct[]>([]);

  // Selected purchase paths
  const [selectedProduct, setSelectedProduct] = useState<PhoneProduct | null>(null);
  const [checkoutProductData, setCheckoutProductData] = useState<{
    product: PhoneProduct;
    selectedColor: string;
    buyType: "Direct" | "EMI";
    emiDetails?: { tenure: number; downpayment: number; monthly: number };
  } | null>(null);

  useEffect(() => {
    // Prefetch products for state-deep lookup
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const visibleProducts = Array.isArray(data) ? data.filter((p: any) => !p.hidden) : [];
        setProducts(visibleProducts);
      })
      .catch((err) => console.error("Error prefetching products:", err));

    const savedSessionStr = localStorage.getItem("riaan_admin_session");
    if (savedSessionStr) {
      try {
        const session = JSON.parse(savedSessionStr);
        setAdminSession(session);
        setIsAdminAuthorized(true);
      } catch (e) {
        localStorage.removeItem("riaan_admin_session");
      }
    }
  }, []);

  const handleAdminSuccess = (session: { username: string; passcode: string; role: "Owner" | "Admin" | "Moderator" }) => {
    localStorage.setItem("riaan_admin_session", JSON.stringify(session));
    setAdminSession(session);
    setIsAdminAuthorized(true);
    navigate("/portal");
  };

  const handleAdminLogout = async () => {
    if (adminSession) {
      try {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: {
            "X-Staff-Username": adminSession.username,
            "X-Staff-Passcode": adminSession.passcode
          }
        });
      } catch (err) {
        console.error("Failed to call logout API:", err);
      }
    }
    localStorage.removeItem("riaan_admin_session");
    setAdminSession(null);
    setIsAdminAuthorized(false);
    navigate("/");
  };

  // Convert current path to compatible 'currentView' string for components that depend on it (Navbar & Footer highlight indicators)
  let currentView = "home";
  const path = location.pathname.toLowerCase();
  if (path === "/portal" || path === "/portal/") {
    currentView = "admin";
  } else if (path === "/products" || path === "/products/") {
    currentView = "products";
  } else if (path.startsWith("/product/")) {
    currentView = "product-detail";
  }

  const handleNavigation = (view: string) => {
    if (view === "admin") {
      navigate("/portal");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (view === "catalog" || view === "products") {
      navigate("/products");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      if (view === "about") {
        setTimeout(() => {
          const doc = document.getElementById("about-section");
          if (doc) {
            doc.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleProceedToCheckout = (
    buyType: "Direct" | "EMI",
    selectedColor: string,
    emiDetails?: { tenure: number; downpayment: number; monthly: number }
  ) => {
    let product = selectedProduct;
    if (!product) {
      const match = location.pathname.match(/\/product\/([^/]+)/);
      if (match) {
        const id = match[1];
        product = products.find((p) => p.id?.toString() === id) || null;
      }
    }

    if (product) {
      setCheckoutProductData({
        product,
        selectedColor,
        buyType,
        emiDetails
      });
      setSelectedProduct(null);
    }
  };

  const handleOrderSuccess = () => {
    setCheckoutProductData(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-yellow-500 selection:text-black">
      
      {/* 1. Header Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigation}
        onOpenAiAssistant={() => setAiBotOpen(true)}
        isAdminAuthorized={isAdminAuthorized}
      />

      {/* 2. Core Body Views Rendering via true frontend routing */}
      <main className="flex-grow">
        <Routes>
          <Route 
            path="/" 
            element={
              <div>
                {/* Burgundy banner display header */}
                <Hero onNavigate={handleNavigation} />
                
                {/* Interactive Catalog listings */}
                <Catalog 
                  onSelectProduct={(phone) => {
                    setPreviousView("home");
                    navigate(`/product/${phone.id}`);
                  }} 
                />

                {/* Explains corporate store layout */}
                <About />
              </div>
            } 
          />

          <Route 
            path="/products" 
            element={
              <div className="pt-16">
                <Catalog 
                  hideHeader={true}
                  onSelectProduct={(phone) => {
                    setPreviousView("products");
                    navigate(`/product/${phone.id}`);
                  }} 
                />
              </div>
            } 
          />

          <Route 
            path="/portal" 
            element={
              <div className="pt-32">
                {isAdminAuthorized && adminSession ? (
                  <AdminSpreadsheet 
                    adminSession={adminSession} 
                    onLogout={handleAdminLogout} 
                  />
                ) : (
                  <AdminLoginGate 
                    onSuccess={handleAdminSuccess} 
                    onCancel={() => handleNavigation("home")} 
                  />
                )}
              </div>
            } 
          />

          <Route 
            path="/product/:id" 
            element={
              <ProductDetailRouteWrapper 
                products={products} 
                previousView={previousView} 
                onProceedToCheckout={handleProceedToCheckout} 
              />
            } 
          />
        </Routes>
      </main>

      {/* 3. Global Footer Elements matching design.png */}
      <footer className="bg-white py-10 border-t border-gray-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div 
            className="text-sm text-gray-400 font-sans tracking-tight text-center sm:text-left select-none flex flex-col sm:flex-row items-center sm:items-center gap-x-2 gap-y-1 transition-colors"
            title="All Rights Reserved. © Riaan Ko Pasal"
          >
            <span>All Rights Reserved. © {new Date().getFullYear()} Riaan Ko Pasal</span>
            <span className="hidden sm:inline-block text-gray-300">|</span>
            <span className="text-xs text-amber-900/60 font-semibold font-sans">"हामी ठुटिपिपल रुपन्देही बासीहरूको सेवामा समर्पित छौं"</span>
          </div>

          <div className="flex items-center space-x-6 text-[#171717] font-sans text-xs">
            <a 
              href="https://www.facebook.com/share/18hUMAmQWU/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#4a0605] transform hover:scale-110 transition-all flex items-center justify-center border border-gray-150 p-2.5 rounded-full"
              title="Facebook Feed"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/riaankopasal.com.np"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#4a0605] transform hover:scale-110 transition-all flex items-center justify-center border border-gray-150 p-2.5 rounded-full"
              title="Instagram Page"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://www.tiktok.com/@007riaanenterprises"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#4a0605] transform hover:scale-110 transition-all flex items-center justify-center border border-gray-150 p-2.5 rounded-full"
              title="TikTok Profile"
            >
              <Music className="w-5 h-5" />
            </a>
          </div>

        </div>
      </footer>

      {/* 4. Overlay detail specification modals */}
      {selectedProduct && (
        <PhoneDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {/* 5. Overlay checkout details card collection sheet */}
      {checkoutProductData && (
        <CheckoutModal
          product={checkoutProductData.product}
          selectedColor={checkoutProductData.selectedColor}
          buyType={checkoutProductData.buyType}
          emiDetails={checkoutProductData.emiDetails}
          onClose={() => setCheckoutProductData(null)}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {/* 6. Sliding Smart Conversational Agent panel & Floating Action Button */}
      {!aiBotOpen && (
        <button
          onClick={() => setAiBotOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-[#4a0605] text-white hover:bg-yellow-500 hover:text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-yellow-500/25 group cursor-pointer"
          title="Chat with Shopping Assistant"
        >
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:rotate-12 transition-transform">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
          </div>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-display text-[10px] tracking-wider uppercase font-extrabold pl-0 group-hover:pl-2 leading-none whitespace-nowrap">
            Shop Bot
          </span>
        </button>
      )}

      <ShoppingAI
        isOpen={aiBotOpen}
        onClose={() => setAiBotOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
