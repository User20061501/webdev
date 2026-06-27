import { useState } from "react";
import { ArrowRight, Sliders, Sparkles } from "lucide-react";

interface HeroProps {
  onNavigate: (view: string) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const candidateImages = ["/logo.png", "/logo.jpg", "/child_phone.png"];
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  const handleImageError = () => {
    if (candidateIndex < candidateImages.length - 1) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const currentImgSrc = candidateImages[candidateIndex];

  return (
    <div
      id="hero-banner"
      className="relative w-full min-h-[550px] md:min-h-[620px] bg-gradient-to-r from-[#4d0706] via-[#350202] to-[#420404] pt-36 sm:pt-40 pb-12 flex items-center overflow-hidden border-b-4 border-yellow-600/30"
    >
      {/* Decorative Traditional Indian/Nepali Mandala Background Vector Layer */}
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay flex items-center justify-center">
        <svg width="600" height="600" viewBox="0 0 100 100" fill="currentColor" className="text-yellow-500 animate-spin-slow">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <path d="M50 10 L50 90 M10 50 L90 50 M22 22 L78 78 M22 78 L78 22" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left column: Text content */}
        <div className="md:col-span-7 flex flex-col items-start space-y-6 text-left" id="hero-text-container">
          {/* Accent Ribbon */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/35 px-3.5 py-1 rounded-full text-yellow-400 text-xs font-semibold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>0% Interest EMI Installments</span>
            </div>
            <div className="flex items-center space-x-2 bg-rose-500/15 border border-rose-500/30 px-3.5 py-1.5 rounded-full text-rose-200 text-xs font-medium tracking-wide select-none">
              <span>🙏 नमस्ते र हार्दिक स्वागत छ!</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white tracking-wider leading-tight uppercase">
              EMI AVAILABLE
            </h1>
            <p className="font-sans text-lg sm:text-xl text-amber-100 font-light tracking-wide max-w-xl">
              Buy premium home appliances & mobile phones with 0% interest on EMI. All popular brands are in stock!
            </p>
            <p className="text-sm text-yellow-400/90 font-sans tracking-wider leading-relaxed font-normal">
              🏡 ठुटिपिपल, रुपन्देहीमा अवस्थित रियान को पसलमा यहाँहरूलाई हार्दिक स्वागत छ।
            </p>
          </div>

          {/* Prompt action buttons matching the layout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("catalog")}
              id="btn-hero-buy"
              className="py-4 px-9 bg-white text-[#4a0605] font-display font-bold tracking-widest uppercase text-sm rounded-full transform hover:scale-[1.04] active:scale-[0.96] hover:bg-yellow-400 hover:text-[#2d0202] transition-all duration-300 ease-out shadow-xl shadow-black/30 hover:shadow-yellow-500/30 text-center select-none"
            >
              BUY NOW
            </button>
            
            <button
              onClick={() => onNavigate("about")}
              id="btn-hero-learn"
              className="py-4 px-8 border border-amber-500/40 rounded-full font-display font-medium tracking-widest text-amber-200 text-sm hover:border-yellow-400 hover:text-yellow-400 hover:bg-white/5 transform hover:scale-[1.04] active:scale-[0.96] transition-all duration-300 ease-out text-center flex items-center justify-center space-x-2 select-none"
            >
              <span>LEARN MORE</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex items-center space-x-2.5 text-xs text-amber-300/70 font-mono mt-2 pt-2 border-t border-white/5 w-full">
            <span>Our Products : Smartphones, Washing Machine, Fridge, Fan & Daily Home Appliances </span>
          </div>
        </div>

        {/* Right column: Image element as shown in layout sketch */}
        <div className="md:col-span-5 flex justify-center relative select-none" id="hero-image-container">
          <div className="relative w-full max-w-[340px] sm:max-w-[400px] h-auto aspect-square flex items-center justify-center">
            {/* Elegant Amber Glow Effect behind the image */}
            <div className="absolute w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-yellow-500/10 to-transparent blur-3xl -z-10 animate-pulse"></div>
            
            {!hasFailedAll ? (
              <img
                src={currentImgSrc}
                alt="Riaan Ko Pasal Showcase"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain filter drop-shadow-[4px_10px_20px_rgba(0,0,0,0.6)] select-none transform hover:scale-102 transition-transform duration-500 pointer-events-none"
                onError={handleImageError}
              />
            ) : (
              /* High fidelity placeholder fallback inside CSS in case neither image is available */
              <div className="w-full h-[380px] bg-gradient-to-b from-yellow-950/20 to-yellow-900/10 rounded-2xl border border-yellow-500/20 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4 animate-bounce">
                  <Sliders className="w-8 h-8" />
                </div>
                <p className="font-display font-bold text-yellow-500 text-sm tracking-widest uppercase mb-1">
                  RIAAN KO PASAL
                </p>
                <p className="text-xs text-amber-200/60 max-w-xs font-light">
                  Please place your uploaded <span className="font-mono text-yellow-500 font-medium">logo.png</span> image inside the directory to view your custom storefront child illustration!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
