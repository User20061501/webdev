import React, { useState, useEffect } from "react";
import { X, Calendar, CheckCircle2, ChevronRight, Landmark, BadgePercent, Sliders, ZoomIn } from "lucide-react";
import { PhoneProduct } from "../../types";

interface PhoneDetailModalProps {
  product: PhoneProduct;
  onClose: () => void;
  onProceedToCheckout: (buyType: "Direct" | "EMI", selectedColor: string, emiDetails?: { tenure: number; downpayment: number; monthly: number }) => void;
}

export default function PhoneDetailModal({ product, onClose, onProceedToCheckout }: PhoneDetailModalProps) {
  const isEmiEnabled = product.emiAvailable !== false;
  const minDP = product.minDownpaymentPercent !== undefined ? product.minDownpaymentPercent : 30;
  const tenuresAvailable = (product.allowedTenures && product.allowedTenures.length > 0) 
    ? product.allowedTenures 
    : [3, 6, 9, 10, 12, 18];

  // Config state
  const [selectedColor, setSelectedColor] = useState(product.colorOptions[0] || "Standard");
  const [buyType, setBuyType] = useState<"Direct" | "EMI">(isEmiEnabled ? "EMI" : "Direct");

  // Multiple image gallery catalog slider
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

  // Scroll locks
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans" id="phone-detail-modal">
      
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Main card box container */}
      <div className="relative bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row z-10 max-h-[90vh]">
        
        {/* Close icon absolute layout button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left pane: Product showcase / branding */}
        <div className="md:w-5/12 bg-gray-50/70 p-8 flex flex-col justify-between items-center relative overflow-hidden select-none border-b md:border-b-0 md:border-r border-gray-100 min-h-[300px] md:min-h-[auto]">
          
          <div className="absolute top-6 left-6 flex items-center space-x-1.5 font-mono text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white border border-gray-100 px-2 py-1 shadow-sm">
            <Sliders className="w-3.5 h-3.5 text-yellow-650" />
            <span>{product.brand} Showcase</span>
          </div>

          <div className="w-full h-full flex flex-col items-center justify-center py-6 relative">
            <div
              className="relative overflow-hidden cursor-zoom-in rounded-xl bg-white/45 p-4 border border-gray-100 shadow-xs max-w-full flex items-center justify-center"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setIsHovered(false)}
            >
              <img
                src={imageList[activeImageIndex] || product.image}
                alt={product.model}
                style={{
                  transform: isHovered ? "scale(2.4)" : "scale(1)",
                  transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
                  transition: isHovered ? "transform 0.08s ease-out" : "transform 0.25s ease-out"
                }}
                className="max-h-[200px] md:max-h-[240px] w-auto object-contain drop-shadow-[4px_12px_24px_rgba(0,0,0,0.12)] filter pointer-events-none select-none"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement?.querySelector(".fallback-detail-img");
                  if (fallback) fallback.classList.remove("hidden");
                }}
              />
              
              {/* Hover overlay hint */}
              <div 
                className={`absolute bottom-3 right-3 flex items-center space-x-1.5 bg-[#4a0605] text-white text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md pointer-events-none select-none transition-all duration-300 ${
                  isHovered ? "opacity-0 scale-90 translate-y-2" : "opacity-90 scale-100 animate-pulse"
                }`}
              >
                <ZoomIn className="w-3 h-3" />
                <span>Hover to inspect</span>
              </div>
            </div>

            {/* Thumbnail Select list inside Modal */}
            {imageList.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-full">
                {imageList.map((imgUrl, thumbIdx) => (
                  <button
                    key={thumbIdx}
                    type="button"
                    onClick={() => setActiveImageIndex(thumbIdx)}
                    className={`relative w-10 h-10 rounded-md overflow-hidden border cursor-pointer transition-all p-0.5 bg-white flex items-center justify-center ${
                      activeImageIndex === thumbIdx
                        ? "border-[#4a0605] shadow-xs scale-105 bg-[#4a0605]/5 ring-2 ring-[#4a0605]/15"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${thumbIdx + 1}`} className="max-w-full max-h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Fallback image placeholder */}
            <div className="fallback-detail-img hidden w-48 h-48 bg-[#4a0605]/10 flex flex-col items-center justify-center text-[#4a0605] p-6 rounded-2xl text-center">
              <Landmark className="w-10 h-10 mb-2" />
              <div className="text-sm font-display font-medium uppercase tracking-wider">{product.model}</div>
            </div>
          </div>

          {/* Device Rating display bar */}
          <div className="flex items-center space-x-2 bg-white border border-gray-100/80 px-4 py-2 rounded-full shadow-sm">
            <span className="text-xs text-amber-500 font-bold">★ {product.rating || "4.8"}</span>
            <div className="w-[1px] h-3 bg-gray-200"></div>
            <span className="text-[10px] font-mono tracking-widest text-gray-400 font-semibold uppercase">0% Interest Rate</span>
          </div>
        </div>

        {/* Right pane: Setup config details, options, and live Sliders */}
        <div className="md:w-7/12 p-8 overflow-y-auto max-h-[85vh] md:max-h-[90vh] flex flex-col justify-between">
          
          {/* Section 1: Product brand and price tag */}
          <div className="text-left space-y-4">
            {product.outOfStock && (
              <div className="bg-red-50 border border-red-250/70 rounded-xl text-red-700 p-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 animate-pulse font-sans">
                <span className="w-2 h-2 rounded-full bg-red-600 block flex-shrink-0 animate-ping"></span>
                <span>This appliance is currently Out of Stock</span>
              </div>
            )}

            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#4a0605] bg-[#4a0605]/5 px-2.5 py-1 rounded">
                {product.brand}
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-gray-900 tracking-tight mt-3 uppercase leading-none">
                {product.model}
              </h1>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-xs text-gray-400 font-medium">Standard Retail Price:</span>
                <span className="text-xl font-mono font-black text-[#4a0605]">
                  NRs. {product.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Spec grid banner */}
            <div className="bg-gray-50 rounded-xl p-4.5 border border-gray-100 grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs text-gray-600 font-sans">
              {Object.entries(product.specs || {}).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-400 block font-light leading-none mb-1 text-[10px] uppercase">{key}</span>
                  <strong className="font-semibold text-gray-800 truncate block">{value}</strong>
                </div>
              ))}
              {Object.keys(product.specs || {}).length === 0 && (
                <div className="col-span-2 text-center text-gray-400 text-[11px] italic">
                  No hardware specifications recorded for this model.
                </div>
              )}
            </div>

            {/* Component 1: Custom color indicator selection */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest block text-left">
                Select Color Accent:
              </span>
              <div className="flex flex-wrap gap-2 justify-start">
                {product.colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transform hover:scale-[1.05] active:scale-[0.95] shadow-xs cursor-pointer transition-all duration-300 ease-out select-none ${
                      selectedColor === color
                        ? "bg-gray-900 text-white border-gray-900 font-semibold shadow-md shadow-gray-900/15"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Component 2: Choice between Buy Direct vs Installment mode */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest block text-left">
                Choose Payment Method:
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={!isEmiEnabled}
                  onClick={() => isEmiEnabled && setBuyType("EMI")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    !isEmiEnabled
                      ? "border-gray-150 bg-gray-50/50 text-gray-300 cursor-not-allowed opacity-50"
                      : buyType === "EMI"
                      ? "border-yellow-600 bg-amber-50/40 text-amber-950 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold uppercase tracking-widest">Buy on 0% EMI</span>
                    <BadgePercent className={`w-4 h-4 ${buyType === "EMI" ? "text-yellow-600" : "text-gray-300"}`} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-light mt-1 w-full leading-tight">
                    {!isEmiEnabled ? "EMI not eligible for this item." : "Flexible installment sliders with zero interest."}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBuyType("Direct")}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    buyType === "Direct"
                      ? "border-gray-900 bg-gray-50 text-gray-900 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full font-bold">
                    <span className="text-xs uppercase tracking-widest">Buy Directly</span>
                    <CheckCircle2 className={`w-4 h-4 ${buyType === "Direct" ? "text-gray-900" : "text-gray-400"}`} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-light mt-1 w-full leading-tight">
                    Pay standard retail price in single direct sum.
                  </span>
                </button>
              </div>
            </div>

            {/* Interactive sliders region - Only visible on EMI selection */}
            {buyType === "EMI" && (
              <div className="bg-[#4d0706]/5 rounded-xl p-5 border border-yellow-500/10 space-y-5 text-left transition-all">
                <div className="flex items-center space-x-2 text-amber-900 font-display font-semibold text-sm tracking-wide border-b border-gray-200/50 pb-2">
                  <Landmark className="w-4 h-4 text-[#4a0605]" />
                  <span>Interactive EMI Installment Planner (0% Interest)</span>
                </div>

                {/* Fixed Down payment percentage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold uppercase tracking-wider text-gray-500">
                      Down Payment (% - Fixed)
                    </span>
                    <span className="font-mono font-bold text-amber-900 text-sm">
                      {downpaymentPercentage}% &mdash; NRs. {downpaymentAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Grid tenure buttons instead of cluttered slide */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                    Installment Duration (Tenure Months)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tenuresAvailable.map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setEmiTenure(months)}
                        className={`w-11 h-11 rounded-full text-center font-mono text-xs font-bold transform hover:scale-[1.1] active:scale-[0.9] flex items-center justify-center cursor-pointer transition-all duration-300 ease-out shadow-xs select-none ${
                          emiTenure === months
                            ? "bg-[#4a0605] text-white border-2 border-yellow-500 shadow-md shadow-[#4a0605]/20 animate-pulse-once"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
                        }`}
                      >
                        {months}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculation outcomes summarized beautifully */}
                <div className="bg-white border border-gray-100 rounded-lg p-3.5 grid grid-cols-2 gap-4 text-center font-mono shadow-inner">
                  <div className="text-left">
                    <span className="text-[10px] text-gray-400 block uppercase leading-none mb-1">Downpayment</span>
                    <strong className="text-sm text-gray-800 block">
                      NRs. {downpaymentAmount.toLocaleString()}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#4a0605] block uppercase font-bold leading-none mb-1">Monthly Installment</span>
                    <strong className="text-base font-black text-[#4a0605] block">
                      NRs. {monthlyInstallment.toLocaleString()} / mo
                    </strong>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Action CTA buttons */}
          <div className="pt-6 border-t border-gray-100 flex items-center gap-4 mt-8">
            <button
              onClick={onClose}
              type="button"
              className="w-1/3 py-3.5 border border-gray-200 text-gray-600 font-display font-semibold tracking-wider text-xs uppercase hover:bg-gray-55 hover:text-gray-900 rounded-full transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 ease-out flex items-center justify-center select-none cursor-pointer"
            >
              Back
            </button>
            
            <button
              onClick={() => {
                if (!product.outOfStock) {
                  onProceedToCheckout(buyType, selectedColor, buyType === "EMI" ? { tenure: emiTenure, downpayment: downpaymentAmount, monthly: monthlyInstallment } : undefined);
                }
              }}
              type="button"
              disabled={!!product.outOfStock}
              className={`w-2/3 py-3.5 font-display font-bold tracking-widest text-xs uppercase flex items-center justify-center space-x-1.5 shadow-lg rounded-full transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 ease-out select-none ${
                product.outOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-[#4a0605] hover:bg-[#340202] text-white shadow-red-950/20 hover:shadow-red-950/30 cursor-pointer"
              }`}
            >
              <span>{product.outOfStock ? "UNAVAILABLE / OUT OF STOCK" : buyType === "EMI" ? "Reserve on EMI Order" : "Reserve Direct Booking"}</span>
              {!product.outOfStock && <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
