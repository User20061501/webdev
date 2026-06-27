import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Sparkles, Star, ChevronRight, Check, Sliders } from "lucide-react";
import { PhoneProduct } from "../../types";

interface CatalogProps {
  onSelectProduct: (product: PhoneProduct) => void;
  hideHeader?: boolean;
}

export default function Catalog({ onSelectProduct, hideHeader }: CatalogProps) {
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [priceRange, setPriceRange] = useState(250000); // Max cap
  const [selectedPopularity, setSelectedPopularity] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch product catalog on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const visibleData = Array.isArray(data) ? data.filter((p: any) => !p.hidden) : [];
          setProducts(visibleData);
        }
      } catch (err) {
        console.error("Error loading product catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          const sortCategories = (list: string[]) => {
            const main = list.filter(c => c.toLowerCase() !== "other" && c.toLowerCase() !== "others");
            const other = list.filter(c => c.toLowerCase() === "other" || c.toLowerCase() === "others");
            main.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
            return [...main, ...other];
          };
          setCategories(sortCategories(data));
        }
      } catch (e) {
        console.error("Error fetching categories:", e);
      }
    };
    fetchProducts();
    fetchCategories();
  }, []);

  // Generate brands dynamically based on active catalog
  const brands = ["All", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];

  // Filter products dynamically
  const filteredProducts = products.filter((product) => {
    const specsStr = Object.values(product.specs || {}).join(" ").toLowerCase();
    const matchesSearch =
      product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specsStr.includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrand === "All" || product.brand === selectedBrand;
    const matchesPrice = product.price <= priceRange;
    const matchesPopular = !selectedPopularity || product.isPopular;
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesBrand && matchesPrice && matchesPopular && matchesCategory;
  });

  return (
    <div id="product-catalog-section" className="bg-gray-50 py-16 sm:py-24 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Module Header */}
        {!hideHeader && (
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-1.5 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-amber-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>0% Interest EMI Eligible Appliances</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-wider uppercase">
              EXPLORE HOME APPLIANCES
            </h2>
            <p className="font-sans text-gray-500 text-sm mt-3 font-light">
              Browse our premium collection of customizable home appliances. Calculate installments, explore specifications, and book with direct purchase or 0% EMI!
            </p>
          </div>
        )}

        {/* Sleek Dynamic Catalog Control Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-4 sm:p-5 mb-10 flex flex-col gap-4">
          
          {/* Top row: Search input and Collapsible Filter button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search dynamic home appliances, specs, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a0605]/10 focus:border-[#4a0605] transition-all"
              />
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                showAdvancedFilters || priceRange < 250000 || selectedPopularity
                  ? "bg-[#4a0605] text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Filters</span>
              {(priceRange < 250000 || selectedPopularity) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Categories Tab Selector Row - streamlined */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex overflow-x-auto sm:flex-wrap gap-1.5 text-left pb-1 -mx-4 px-4 sm:pb-0 sm:-mx-0 sm:px-0 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                key="All"
                onClick={() => setSelectedCategory("All")}
                className={`flex-none px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedCategory === "All"
                    ? "bg-[#4a0605] text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 border border-gray-150 hover:bg-gray-100"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => {
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-none px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#4a0605] text-white shadow-sm"
                        : "bg-gray-50 text-gray-500 border border-gray-150 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced Filters section */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100 overflow-hidden"
            >
              {/* Price filter slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center space-x-1">
                    <Filter className="w-3 h-3" />
                    <span>Maximum Price Limit</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4a0605]">
                    NRs. {priceRange.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="250000"
                  step="2000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-[#4a0605] h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Best seller checkbox toggle and Reset buttons */}
              <div className="flex flex-row items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedPopularity}
                    onChange={(e) => setSelectedPopularity(e.target.checked)}
                    className="w-4 h-4 accent-[#4a0605] border-gray-300 rounded focus:ring-offset-0"
                  />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    Show Best Sellers Only
                  </span>
                </label>

                {(priceRange < 250000 || selectedPopularity || selectedCategory !== "All" || searchQuery !== "") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedBrand("All");
                      setPriceRange(250000);
                      setSelectedPopularity(false);
                      setSelectedCategory("All");
                    }}
                    className="text-[10px] font-black text-red-700 uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer select-none"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </div>

        {/* Loading layout helper */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((val) => (
              <div key={val} className="bg-white rounded-xl h-[420px] animate-pulse border border-gray-200/50 p-6 flex flex-col justify-between">
                <div className="h-44 bg-gray-100 rounded-lg"></div>
                <div className="h-6 bg-gray-100 rounded w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded w-1/3 mt-2"></div>
                <div className="h-10 bg-gray-100 rounded mt-6"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-16 text-center max-w-lg mx-auto">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="font-display font-bold text-gray-800 uppercase tracking-wider text-base mb-1">
              No products discovered
            </h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
              Adjust your search keywords or price filter boundaries to discover other amazing appliance choices.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBrand("All");
                setPriceRange(250000);
                setSelectedPopularity(false);
              }}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transform hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 ease-out cursor-pointer select-none"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="catalog-products-grid">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.model}
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.35), ease: "easeOut" }}
                onClick={() => onSelectProduct(product)}
                className="bg-white rounded-2xl border border-gray-100 hover:border-amber-500/20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(74,6,5,0.12)] transition-all duration-500 ease-out flex flex-col justify-between overflow-hidden group hover:-translate-y-2 cursor-pointer"
                id={`product-${product.model.replace(/\s+/g, "-").toLowerCase()}`}
              >
                {/* Image panel */}
                <div className="relative bg-gradient-to-b from-gray-50/70 to-white pt-6 pb-2 px-6 flex items-center justify-center overflow-hidden aspect-[4/3] h-48 select-none border-b border-gray-50">
                  {/* Subtle hover gradient illumination and radiant drop shadow backdrops */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#4a0605]/0 via-transparent to-amber-500/0 group-hover:from-[#4a0605]/[0.02] group-hover:to-amber-500/[0.04] transition-colors duration-500 pointer-events-none" />
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#4a0605]/[0.02] rounded-full blur-2xl group-hover:scale-150 transition-all duration-700 pointer-events-none" />

                  {/* Out of Stock banner overlay on image */}
                  {product.outOfStock && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-30 flex items-center justify-center animate-fadeIn">
                      <span className="bg-red-700 text-white text-[11px] font-black tracking-widest px-4 py-2 border border-red-800 shadow-md transform rotate-[-6deg] select-none">
                        OUT OF STOCK
                      </span>
                    </div>
                  )}

                  {/* Popular badge */}
                  {product.isPopular && (
                    <span className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-[#4a0605] text-[9px] font-black py-1 px-3 rounded-full uppercase tracking-widest shadow-sm ring-1 ring-yellow-300/30 transform group-hover:scale-105 transition-all duration-300">
                      <Star className="w-3 h-3 fill-[#4a0605]" />
                      <span>Best Seller</span>
                    </span>
                  )}

                  {/* Dynamic EMI status badge */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                    {product.emiAvailable !== false ? (
                      <span className="inline-flex flex-col items-center bg-[#4a0605] text-white text-[9px] font-bold py-1 px-2.5 uppercase tracking-wide shadow-sm border border-yellow-500/15 rounded-md transform group-hover:scale-105 transition-all duration-300">
                        <span className="text-[7px] font-light text-amber-200 uppercase tracking-widest leading-none mb-0.5">EMI Starts</span>
                        <span className="font-mono leading-none text-yellow-400 font-extrabold">NRs. {Math.round((product.price - (product.price * (product.minDownpaymentPercent || 30)) / 100) / Math.max(...(product.allowedTenures && product.allowedTenures.length > 0 ? product.allowedTenures : [3, 6, 9, 10, 12, 18]))).toLocaleString()}/mo</span>
                      </span>
                    ) : (
                      <span className="bg-white/90 backdrop-blur-xs text-gray-500 border border-gray-200/50 text-[8px] font-black py-1 px-2.5 uppercase tracking-wider rounded-full shadow-xs">
                        Direct Booking
                      </span>
                    )}
                  </div>

                  {/* Brand watermark */}
                  <span className="absolute text-5xl font-extrabold text-gray-100/40 uppercase select-none tracking-widest font-display rotate-12 -z-0">
                    {product.brand}
                  </span>
                  
                  <img
                    src={product.image}
                    alt={`${product.brand} ${product.model}`}
                    referrerPolicy="no-referrer"
                    className="h-[85%] w-auto object-contain relative z-10 transform group-hover:scale-[1.12] group-hover:-rotate-1.5 transition-transform duration-500 ease-out select-none"
                    onError={(e) => {
                      // fallback for generic branding pictures
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".fallback-catalog-img");
                      if (fallback) fallback.classList.remove("hidden");
                    }}
                  />
                  
                  {/* Local image fallback */}
                  <div className="fallback-catalog-img hidden w-2/3 h-[90%] bg-[#4a0605]/5 flex flex-col items-center justify-center text-center p-3 text-[#4a0605] rounded-lg">
                    <ApplianceIcon brand={product.brand} />
                  </div>
                </div>

                 {/* Content details description */}
                 <div className="p-6 flex flex-col items-start text-left flex-grow w-full">
                   <div className="flex items-center gap-2 flex-wrap">
                     <span className="text-[10px] font-mono font-black tracking-widest text-[#4a0605] bg-[#4a0605]/5 px-3 py-1 rounded-full border border-[#4a0605]/10 shadow-xs">
                       {product.brand.toUpperCase()}
                     </span>
                     {product.category && (
                       <span className="text-[9px] font-sans font-black tracking-widest text-rose-800 bg-rose-50/50 border border-rose-200/40 px-2.5 py-1 rounded-full uppercase">
                         {product.category}
                       </span>
                     )}
                   </div>
                   <h3 className="font-display font-bold text-lg text-gray-100/90 group-hover:text-[#4a0605] text-gray-900 tracking-tight mt-3 uppercase transition-colors leading-snug min-h-[2.5rem] flex items-center">
                     {product.model}
                   </h3>
                  
                  {/* Specifications Grid Tiles instead of plain bullet points */}
                  <div className="grid grid-cols-2 gap-2 mt-4 w-full">
                    {Object.entries(product.specs || {}).slice(0, 4).map(([key, value]) => (
                      <div 
                        key={key} 
                        className="bg-gray-50/60 hover:bg-gray-100/40 rounded-xl p-2.5 border border-gray-100 hover:border-gray-200/60 transition-all duration-300 flex flex-col justify-center gap-0.5 group/spec min-w-0"
                      >
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 font-black leading-none truncate group-hover/spec:text-gray-500 transition-colors">
                          {key}
                        </span>
                        <span className="text-xs text-gray-700 font-bold font-sans truncate leading-normal" title={value}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer and Price / Buttons CTA panel */}
                <div className="px-6 pb-6 pt-3 border-t border-gray-50 flex items-center justify-between w-full">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Price</span>
                    <span className="text-base font-mono font-black text-gray-900">
                      NRs. {product.price.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(product);
                    }}
                    className="py-2.5 px-5 bg-[#4a0605] text-white hover:bg-[#620908] font-display font-black tracking-widest text-[10px] uppercase rounded-full transform hover:scale-[1.08] active:scale-[0.94] flex items-center space-x-1.5 shadow-md shadow-[#4a0605]/15 hover:shadow-lg hover:shadow-[#4a0605]/30 active:shadow-sm transition-all duration-300 ease-out cursor-pointer select-none"
                  >
                    <span>DETAILS</span>
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// Inline fallback helper helper
function ApplianceIcon({ brand }: { brand: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold font-display">{brand.substring(0, 1)}</div>
      <div className="text-[10px] font-mono tracking-widest mt-1">PRODUCT</div>
    </div>
  );
}
