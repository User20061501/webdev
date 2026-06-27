import React, { useState, useEffect } from "react";
import { ArrowLeft, Landmark, BadgePercent, CheckCircle2, Sliders, Star, ShieldCheck, Heart, Truck, Check, HelpCircle, ZoomIn } from "lucide-react";
import { PhoneProduct } from "../../types";

interface ProductDetailPageProps {
  product: PhoneProduct;
  onBack: () => void;
  onProceedToCheckout: (buyType: "Direct" | "EMI", selectedColor: string, emiDetails?: { tenure: number; downpayment: number; monthly: number }) => void;
}

export default function ProductDetailPage({ product, onBack, onProceedToCheckout }: ProductDetailPageProps) {
  const isEmiEnabled = product.emiAvailable !== false;
  const minDP = product.minDownpaymentPercent !== undefined ? product.minDownpaymentPercent : 30;
  const tenuresAvailable = (product.allowedTenures && product.allowedTenures.length > 0)
    ? product.allowedTenures
    : [3, 6, 9, 10, 12, 18];

  // Config state
  const [selectedColor, setSelectedColor] = useState(product.colorOptions[0] || "Standard");
  const [buyType, setBuyType] = useState<"Direct" | "EMI">("Direct");

  // Multiple images catalog gallery
  const imageList = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image].filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Interactive EMI inputs
  const [emiTenure, setEmiTenure] = useState<number>(
    tenuresAvailable.includes(12) ? 12 : tenuresAvailable[0] || 12
  );
  const [downpaymentPercentage, setDownpaymentPercentage] = useState<number>(minDP);

  // Computed variables
  const downpaymentAmount = Math.round((product.price * downpaymentPercentage) / 100);
  const remainingPrincipal = product.price - downpaymentAmount;
  const monthlyInstallment = emiTenure > 0 ? Math.round(remainingPrincipal / emiTenure) : 0;

  // Zoom & Magnifier interaction state
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = ((touch.clientX - left) / width) * 100;
      const y = ((touch.clientY - top) / height) * 100;
      setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      setIsHovered(true);
    }
  };

  // Dynamic reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Form states for custom customer reviews and ratings submissions
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewLocation, setNewReviewLocation] = useState("");
  const [newReviewStars, setNewReviewStars] = useState(5);
  const [newReviewContent, setNewReviewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch reviews from server database
  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchReviews();
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewContent.trim()) {
      setSubmitError("कृपया आफ्नो नाम र प्रतिक्रिया लेख्नुहोस् (Please write name and message)");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newReviewName.trim(),
          location: newReviewLocation.trim() || undefined,
          stars: newReviewStars,
          content: newReviewContent.trim(),
          productId: product.id,
          productModel: product.model
        })
      });

      if (res.ok) {
        setNewReviewName("");
        setNewReviewLocation("");
        setNewReviewStars(5);
        setNewReviewContent("");
        setSubmitSuccess(true);
        fetchReviews(); // reload comments instantly
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "प्रतिक्रिया सुरक्षित गर्न सकिएन।");
      }
    } catch (err) {
      setSubmitError("सर्भरसँग सम्पर्क हुन सकेन। पछि फेरि प्रयास गर्नुहोला।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50/50 min-h-screen pt-36 sm:pt-40 md:pt-44 pb-16 font-sans text-left" id="product-detail-page-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation button */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-[#4a0605] font-semibold transition-all mb-8 group cursor-pointer"
          id="btn-product-detail-back"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1.5 transition-transform" />
          <span>उत्पादन सूचीमा फर्कनुहोस् (Back to Catalog)</span>
        </button>

        {/* Main Product Frame Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-150/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 mb-12">
          
          {/* Left Column: Huge visual gallery card */}
          <div className="lg:col-span-5 bg-gradient-to-b from-gray-50/80 to-white/30 p-8 sm:p-12 flex flex-col justify-between items-center relative overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-gray-100">
            {/* Background branding watermarks and accent lights */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#4a0605]/[0.01] via-transparent to-amber-500/[0.03] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#4a0605]/[0.02] rounded-full blur-3xl pointer-events-none" />
            
            {/* Ribbon Tags */}
            <div className="w-full flex items-center justify-end relative z-10 mb-8 sm:mb-0">
              <span className="text-xs font-mono text-gray-400 font-bold uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-md shadow-xs">
                {product.brand}
              </span>
            </div>

            {/* Core Featured Image Display */}
            <div className="my-8 flex flex-col items-center justify-center p-4 w-full relative">
              <div
                className="relative overflow-hidden cursor-zoom-in rounded-2xl bg-white p-6 border border-gray-100 shadow-xs max-w-full flex items-center justify-center select-none"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setIsHovered(false)}
              >
                <img
                  src={imageList[activeImageIndex] || product.image}
                  alt={`${product.brand} ${product.model}`}
                  style={{
                    transform: isHovered ? "scale(2.5)" : "scale(1)",
                    transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
                    transition: isHovered ? "transform 0.08s ease-out" : "transform 0.25s ease-out"
                  }}
                  className="max-h-[280px] sm:max-h-[340px] w-auto object-contain drop-shadow-[4px_16px_32px_rgba(74,6,5,0.1)] pointer-events-none select-none"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement?.querySelector(".fallback-detail-page-img");
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                
                {/* Visual hover inspect badge */}
                <div 
                  className={`absolute bottom-3 right-3 flex items-center space-x-1.5 bg-[#4a0605] text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md pointer-events-none select-none transition-all duration-300 ${
                    isHovered ? "opacity-0 scale-90 translate-y-2" : "opacity-90 scale-100 animate-pulse"
                  }`}
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Hover to magnify</span>
                </div>
              </div>

              {/* Thumbnail Selector Gallery */}
              {imageList.length > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 mb-4 max-w-full">
                  {imageList.map((imgUrl, thumbIdx) => (
                    <button
                      key={thumbIdx}
                      type="button"
                      onClick={() => setActiveImageIndex(thumbIdx)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border cursor-pointer transition-all p-1 bg-white flex items-center justify-center ${
                        activeImageIndex === thumbIdx
                          ? "border-[#4a0605] shadow-xs scale-105 bg-[#4a0605]/5 ring-2 ring-[#4a0605]/15"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${thumbIdx + 1}`} className="max-w-full max-h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              <div className="fallback-detail-page-img hidden w-56 h-56 bg-[#4a0605]/5 flex flex-col items-center justify-center text-[#4a0605] p-6 rounded-2xl text-center">
                <Landmark className="w-12 h-12 mb-2" />
                <div className="text-sm font-display font-medium uppercase tracking-wider">{product.model}</div>
              </div>
            </div>

          </div>

          {/* Right Column: Configuration, Pricing & Calculators */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
            
            <div className="space-y-6">
              
              {/* Availability Banner */}
              {product.outOfStock && (
                <div className="bg-red-50 border border-red-200/50 rounded-2xl text-red-700 p-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-650 block flex-shrink-0 animate-ping"></span>
                  <span>यो सामग्री तत्काल स्टकमा उपलब्ध छैन (This item is temporarily Out of Stock)</span>
                </div>
              )}

              {/* Header Title Information */}
              <div>
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  {product.category && (
                    <span className="text-[10px] font-sans font-black uppercase tracking-widest text-rose-800 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200/40">
                      {product.category}
                    </span>
                  )}
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#4a0605] bg-[#4a0605]/5 px-3 py-1.5 rounded-full border border-[#4a0605]/10">
                    {product.brand.toUpperCase()}
                  </span>
                </div>
                <h1 className="font-display font-black text-3xl sm:text-4xl text-gray-905 tracking-tight uppercase leading-none">
                  {product.model}
                </h1>
              </div>

              {/* Value Price block card */}
              <div className="bg-gray-55/70 rounded-2xl p-5 border border-gray-100 flex items-center justify-between gap-2.5">
                <div className="text-left font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">कुल नगद खरिद मूल्य (Price)</span>
                  <span className="text-3xl font-mono font-black text-[#4a0605] mt-1 block">
                    NRs. {product.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Hardware Specifications Information Grid */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-[#4a0605] uppercase tracking-widest block">
                  विवरण सूची (Specifications)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(product.specs || {}).map(([key, value]) => (
                    <div 
                      key={key} 
                      className="bg-gray-50/40 hover:bg-gray-50 rounded-xl p-3 border border-gray-100 transition-colors flex flex-col justify-center gap-0.5"
                    >
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-black leading-none">
                        {key}
                      </span>
                      <span className="text-xs text-gray-800 font-bold max-w-full truncate" title={value}>
                        {value}
                      </span>
                    </div>
                  ))}
                  {Object.keys(product.specs || {}).length === 0 && (
                    <div className="col-span-2 text-center text-gray-400 text-xs italic py-4 bg-gray-50 rounded-xl border border-dashed">
                      सामग्रीको प्राविधिक विवरण रेकर्ड गरिएको छैन।
                    </div>
                  )}
                </div>
              </div>

              {/* Color Configuration swatch circle selectors */}
              <div className="space-y-2.5 pt-2 border-t border-gray-50">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest block">
                  मनपर्ने रङ रोज्नुहोस् (Select Color)
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {product.colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4.5 py-2 rounded-full text-xs font-semibold border transform hover:scale-[1.04] active:scale-[0.96] transition-all select-none cursor-pointer ${
                        selectedColor === color
                          ? "bg-[#4a0605] text-white border-[#4a0605] shadow-md shadow-[#4a0605]/15 font-bold"
                          : "bg-white text-gray-650 border-gray-200 hover:bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods Choice layout switcher */}
              <div className="space-y-3 pt-3 border-t border-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!product.outOfStock) {
                        setBuyType("Direct");
                        onProceedToCheckout("Direct", selectedColor);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-center min-h-[72px] transition-all select-none cursor-pointer ${
                      buyType === "Direct"
                        ? "border-[#4a0605] bg-[#4a0605]/[0.02] text-[#4a0605] ring-2 ring-[#4a0605]/10 shadow-sm"
                        : "border-gray-250 bg-white text-gray-550 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                        <span>BUY NOW</span>
                      </span>
                      {buyType === "Direct" && <div className="w-2.5 h-2.5 rounded-full bg-[#4a0605] animate-ping" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!isEmiEnabled}
                    onClick={() => {
                      if (isEmiEnabled && !product.outOfStock) {
                        setBuyType("EMI");
                        onProceedToCheckout("EMI", selectedColor, {
                          tenure: emiTenure,
                          downpayment: downpaymentAmount,
                          monthly: monthlyInstallment
                        });
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-center min-h-[72px] transition-all select-none ${
                      !isEmiEnabled
                        ? "border-gray-150 bg-gray-50/50 text-gray-300 cursor-not-allowed opacity-40"
                        : buyType === "EMI"
                        ? "border-[#4a0605] bg-[#4a0605]/[0.02] text-[#4a0605] ring-2 ring-[#4a0605]/10 shadow-sm"
                        : "border-gray-250 bg-white text-gray-550 hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                        <BadgePercent className="w-4.5 h-4.5 text-yellow-600 font-bold" />
                        <span>Buy with 0% EMI</span>
                      </span>
                      {buyType === "EMI" && <div className="w-2.5 h-2.5 rounded-full bg-[#4a0605] animate-ping" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Slide Down calculation section - Visible only on EMI option selection */}
              {buyType === "EMI" && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 space-y-6 text-left transition-all duration-300 animate-fadeIn shadow-xs">
                  <div className="flex items-center space-x-2 text-[#4a0605] font-display font-black text-xs tracking-wider border-b border-gray-100 pb-3 uppercase">
                    <Sliders className="w-4 h-4 text-[#4a0605]" />
                    <span>EMI किस्ता क्याल्कुलेटर (0% Interest Rate Plan)</span>
                  </div>

                  {/* Fixed DP selector */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold uppercase tracking-wider text-gray-500 text-[10px]">
                        सुरुवाती भुक्तानी प्रतिशत (Down Payment % - Fixed)
                      </span>
                      <span className="font-mono font-bold text-[#4a0605] text-xs bg-[#4a0605]/5 px-3 py-1 rounded-full border border-[#4a0605]/10 flex items-center gap-1">
                        <span className="font-black text-[13px]">{downpaymentPercentage}%</span>
                        <span className="text-gray-400">&bull;</span>
                        <span className="font-semibold text-gray-700">NRs. {downpaymentAmount.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Gripping Monthly Duration buttons options */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                      किस्ता बुझाउने अवधि (Tenure Months)
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {tenuresAvailable.map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setEmiTenure(months)}
                          className={`w-11 h-11 rounded-full text-center font-mono text-xs font-bold transform active:scale-95 flex items-center justify-center cursor-pointer transition-all select-none ${
                            emiTenure === months
                              ? "bg-[#4a0605] text-white font-black shadow-md shadow-[#4a0605]/15 ring-2 ring-offset-2 ring-[#4a0605]/30"
                              : "bg-white text-gray-650 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          {months}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Splendid computation summarized results block */}
                  <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4.5 grid grid-cols-2 gap-4 text-left font-sans shadow-xs mt-4">
                    <div className="border-r border-gray-200 pr-3 flex flex-col justify-center">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider mb-1">Downpayment (सुरु बुकिङ)</span>
                      <strong className="text-base font-extrabold text-gray-800 font-mono">
                        NRs. {downpaymentAmount.toLocaleString()}
                      </strong>
                    </div>
                    <div className="pl-3 flex flex-col justify-center text-right">
                      <span className="text-[10px] text-[#4a0605] block uppercase font-black tracking-wider mb-1">Monthly Cost (मासिक किस्ता)</span>
                      <strong className="text-base font-black text-[#4a0605] font-mono">
                        NRs. {monthlyInstallment.toLocaleString()} <span className="text-[10px] font-normal text-[#4a0605]/80">/ महिना</span>
                      </strong>
                    </div>
                  </div>

                </div>
              )}

              {/* Primary Direct / EMI Booking Action Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!product.outOfStock) {
                      onProceedToCheckout(buyType, selectedColor, buyType === "EMI" ? { tenure: emiTenure, downpayment: downpaymentAmount, monthly: monthlyInstallment } : undefined);
                    }
                  }}
                  disabled={!!product.outOfStock}
                  className={`w-full py-4.5 rounded-2xl font-display font-bold text-xs uppercase tracking-widest text-center shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    product.outOfStock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                      : "bg-[#4a0605] hover:bg-[#340202] text-white hover:shadow-xl shadow-red-950/20 hover:shadow-red-950/30"
                  }`}
                >
                  <span>{product.outOfStock ? "सामग्री स्टकमा छैन (Out of Stock)" : buyType === "EMI" ? "किस्ता बुकिङ गर्नुहोस् (Buy on EMI)" : "अहिले नै खरिद गर्नुहोस् (Buy Now)"}</span>
                </button>
              </div>

              {/* Product Specific Badges or Trust Pillars */}
              <div className="w-full space-y-3.5 bg-gray-50/40 border border-gray-150 p-5 rounded-2xl shadow-xs mt-6">
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="bg-green-50 text-green-700 p-1.5 rounded-full shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">१००% सक्कली तथा ब्राण्ड अधिकृत सामान</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700 border-t border-gray-150/50 pt-3">
                  <div className="bg-[#4a0605]/5 text-[#4a0605] p-1.5 rounded-full shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#4a0605]" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">सजिलो ब्याजदर रहित मासिक किस्ता (0% EMI)</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Local Testimonial and Customer Feedback Review Board Grid */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-150/40 text-left grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Reviews List */}
          <div className="lg:col-span-7">
            {(() => {
              const totalStars = reviews.reduce((sum, r) => sum + (Number(r.stars) || 5), 0);
              const computedAverage = reviews.length > 0 ? (totalStars / reviews.length).toFixed(1) : null;
              const ratingDisplayStr = computedAverage 
                ? `${computedAverage} / 5.0 (ग्राहक रेटिङ समूह)` 
                : "रेटिङ उपलब्ध छैन (No reviews yet)";

              return (
                <>
                  <div className="border-b border-gray-100 pb-5 mb-8 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                    <div>
                      <h2 className="font-display font-bold text-xl sm:text-2xl text-gray-900 tracking-wider uppercase">
                        ग्राहकका भनाइहरू (Community Reviews)
                      </h2>
                      <p className="text-xs text-gray-400 mt-1 font-light font-sans">
                        ठुटिपिपल, रुपन्देहीका सम्मानित क्रेताहरूबाट प्राप्त केही अनुभवहरू।
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-[#4a0605] font-bold bg-[#4a0605]/5 px-3 py-1 rounded-full border border-[#4a0605]/10 shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>{ratingDisplayStr}</span>
                    </div>
                  </div>

                  {loadingReviews ? (
                    <div className="text-left font-mono text-xs text-gray-400 py-6 animate-pulse">
                      प्रतिक्रियाहरू लोड हुँदैछ... (Loading thoughts)
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center italic text-xs text-gray-400 py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/20 px-4">
                      <div>
                        <p className="font-medium text-gray-600 mb-1">कुनै प्रतिक्रिया फेला परेन।</p>
                        <p className="text-[10px] text-gray-400 leading-normal font-sans font-light">
                          पहिलो प्रतिक्रिया लेखेर आफ्नो अनुभव साझा गर्ने पहिलो बन्नुहोस्! (No customer reviews recorded yet)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                      {reviews.map((rev, i) => (
                        <div key={rev.id || i} className="bg-gray-50/45 rounded-2xl p-5 border border-gray-100/70 hover:shadow-xs transition-shadow">
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <div>
                              <strong className="text-sm text-gray-900 font-bold block">{rev.name}</strong>
                              <span className="text-[10px] text-gray-400 font-mono">{rev.location || "ठुटिपिपल, रुपन्देही"}</span>
                            </div>
                            <div className="flex text-amber-500">
                              {Array.from({ length: rev.stars || 5 }).map((_, starIdx) => (
                                <Star key={starIdx} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-650 font-sans leading-relaxed italic">
                            &ldquo;{rev.content}&rdquo;
                          </p>
                          <div className="text-right text-[9px] text-gray-400 font-mono mt-3 leading-none select-none">
                            Verified Purchase: {rev.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Right Side: Rating & Comment Submission Form */}
          <div className="lg:col-span-5 bg-gray-50/40 rounded-2xl p-6 border border-gray-150/40 self-start">
            <h3 className="font-display font-extrabold text-[#4a0605] text-sm uppercase tracking-wider mb-1">
              प्रतिक्रिया तथा रेटिङ थप्नुहोस्
            </h3>
            <p className="text-[11px] text-gray-400 mb-4 leading-normal font-light">
              रियान को पसलमा तपाईंको अनुभव कस्तो रह्यो? कृपया रेटिङ तथा प्रतिक्रिया सबमिट गर्नुहोस्। 
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">नाम (Your Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. सरेश के.सी."
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#4a0605] text-xs p-2.5 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">स्थान (Location)</label>
                <input
                  type="text"
                  placeholder="e.g. ठुटिपिपल, रुपन्देही"
                  value={newReviewLocation}
                  onChange={(e) => setNewReviewLocation(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#4a0605] text-xs p-2.5 rounded-xl focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">रेटिङ (Rating Stars) *</label>
                <div className="flex items-center space-x-1.5 pt-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewStars(star)}
                      className="transform hover:scale-115 active:scale-90 transition-transform focus:outline-none cursor-pointer p-0.5"
                    >
                      <Star
                        className={`w-5.5 h-5.5 ${
                          newReviewStars >= star
                            ? "text-amber-500 fill-amber-400"
                            : "text-gray-200"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">प्रतिक्रिया (Comments) *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="रियान को पसलको उत्कृष्ट सेवा सम्बन्धी आफ्नो टिप्पणी लेख्नुहोस्..."
                  value={newReviewContent}
                  onChange={(e) => setNewReviewContent(e.target.value)}
                  className="w-full bg-white border border-gray-200 focus:border-[#4a0605] text-xs p-2.5 rounded-xl focus:outline-none transition-colors resize-none"
                />
              </div>

              {submitError && (
                <div className="text-red-700 text-[10px] font-semibold p-2 rounded bg-red-50 border border-red-100">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="text-emerald-700 text-[10px] font-semibold p-2 rounded bg-emerald-50 border border-emerald-100 animate-fadeIn">
                  प्रतिक्रिया सफलतापूर्वक थपियो! (Review submitted successfully!)
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 bg-[#4a0605] text-white hover:bg-[#340202] text-[10px] font-bold uppercase tracking-widest rounded-full transition-all focus:outline-none transform active:scale-95 shadow-md flex items-center justify-center ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span>{isSubmitting ? "पठाउँदै... (SUBMITTING)" : "प्रतिक्रिया सुरक्षित गर्नुहोस्"}</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
