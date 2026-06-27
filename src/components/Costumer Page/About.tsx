import { Truck, ShieldCheck, Heart, CirclePercent, MapPin, CreditCard } from "lucide-react";
import { motion } from "motion/react";

export default function About() {
  return (
    <div id="about-section" className="bg-white py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Description Column Block - Matches user image format */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-20">
          
          <div className="md:col-span-5 text-left border-l-4 border-[#4a0605] pl-6 py-2">
            <span className="text-sm font-semibold tracking-wider text-gray-400 block uppercase mb-1">
              हाम्रो बारेमा (About Us)
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-wider leading-tight uppercase">
              RIAAN KO PASAL?
            </h2>
            <p className="text-xs font-semibold text-amber-900 bg-amber-500/10 inline-block px-3 py-1 rounded mt-3.5 border border-amber-500/20">
               🙏 "ग्राहक नै हाम्रो गौरव हुनुहुन्छ"
            </p>
          </div>

          <div className="md:col-span-7 text-left">
            <p className="font-sans text-base sm:text-lg text-gray-600 leading-relaxed font-light">
              &ldquo;Riaan ko pasal&rdquo; is a premier, local electronics hub located in the heart of{" "}
              <strong className="text-gray-900 font-semibold">Omsatiya-1, Thutipipal, Rupandehi, Lumbini, Nepal</strong>. We offer major
              electronic appliances including Fridges and Washing Machines, specializing specifically in a dynamic, premium wide range of
              brand new <strong className="text-gray-900 font-semibold">Mobile Phones</strong> from all globally recognized brands, delivered with instant, zero-interest EMI financing plans!
            </p>
            <p className="font-sans text-sm sm:text-base text-[#4a0605] leading-relaxed font-light mt-4 bg-amber-500/[0.03] p-4 rounded-xl border border-dashed border-amber-500/20">
              <strong>रियान को पसल (रियान इन्टरप्राइजेज)</strong> ओमसतिया-१, ठुटिपिपल, रुपन्देही, लुम्बिनी, नेपालमा अवस्थित एउटा प्रतिष्ठित र स्थानीय इलेक्ट्रोनिक्स पसल हो। यहाँ हजुरहरूले आफ्नो मनपर्ने स्मार्टफोन तथा ठूला घरायसी सामानहरू (फ्रिज, वासिङ मेसिन आदि) कुनै झन्झट बिना ०% ब्याज दरको सजिलो मासिक किस्ता (EMI) सुबिधामा सजिलै खरिद गर्न सक्नुहुन्छ।
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center mt-6 text-sm text-gray-500 font-medium">
              <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 px-3 py-1.5 rounded border border-amber-100">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Omsatiya-1, Thutipipal, Rupandehi, Lumbini, Nepal</span>
              </div>
              <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 px-3 py-1.5 rounded border border-rose-100">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Owned by Mr. Prakash Adhikari</span>
              </div>
            </div>
          </div>

        </div>

        {/* Divider line as shown in design.png */}
        <div className="w-full h-[1px] bg-gray-200/95 mb-16 sm:mb-24"></div>

        {/* "WHY US?" Cards matching icons & description from design.png */}
        <div className="text-center" id="why-us-section">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="font-display font-bold text-3xl text-gray-900 tracking-widest uppercase mb-16"
          >
            WHY US?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* 1. Free Home Delivery */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100 group-hover:bg-[#4a0605] group-hover:text-white transition-all duration-300 shadow-sm">
                <Truck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-gray-900 uppercase tracking-widest">
                  Free Home Delivery
                </h3>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3 text-amber-800" />
                  <span>निःशुल्क घर डेलिभरी</span>
                </span>
              </div>
              <p className="font-sans text-sm text-gray-500 max-w-[220px] font-light leading-relaxed">
                Get your product delivered straight to your home with zero shipping cost.
              </p>
            </motion.div>

            {/* 2. Built on Integrity */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100 group-hover:bg-[#4a0605] group-hover:text-white transition-all duration-300 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-gray-900 uppercase tracking-widest">
                  Built on Integrity
                </h3>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">🤝 इमान्दारिता र विश्वास</span>
              </div>
              <p className="font-sans text-sm text-gray-500 max-w-[220px] font-light leading-relaxed">
                Trust is the foundation of everything we do.
              </p>
            </motion.div>

            {/* 3. Customer Oriented */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100 group-hover:bg-[#4a0605] group-hover:text-white transition-all duration-300 shadow-sm">
                <Heart className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-gray-900 uppercase tracking-widest">
                  Customer Oriented
                </h3>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">💖 पूर्ण ग्राहक सन्तुष्टि</span>
              </div>
              <p className="font-sans text-sm text-gray-500 max-w-[220px] font-light leading-relaxed">
                Well established, personal customer services.
              </p>
            </motion.div>

            {/* 4. 0% EMI */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100 group-hover:bg-[#4a0605] group-hover:text-white transition-all duration-300 shadow-sm">
                <CirclePercent className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-gray-900 uppercase tracking-widest">
                  0% EMI
                </h3>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-800" />
                  <span>०% ब्याजदर सरल किस्ता</span>
                </span>
              </div>
              <p className="font-sans text-sm text-gray-500 max-w-[220px] font-light leading-relaxed">
                Buy mobile models in EMI with 0% interest rate.
              </p>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  );
}
