import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from "lucide-react";
import { ChatMessage } from "../../types";
import { AnimatePresence, motion } from "motion/react";

interface ShoppingAIProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingAI({ isOpen, onClose }: ShoppingAIProps) {
  const [language, setLanguage] = useState<"en" | "ne">("en");
  const [botConfig, setBotConfig] = useState<any>({
    botName: "Riaan",
    welcomeMessage: "Namaste and welcome! Riaan is here to assist you."
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "bot-welcome-en",
      role: "assistant",
      text: "Namaste and welcome! Riaan is here to assist you."
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep welcome message synced with chosen language
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && (prev[0].id.startsWith("bot-welcome-") || prev[0].id === "bot-welcome")) {
        return [{
          id: `bot-welcome-${language}`,
          role: "assistant",
          text: language === "ne"
            ? "नमस्ते र स्वागत छ! रियान तपाईंलाई सहयोग गर्न यहाँ हुनुहुन्छ।"
            : (botConfig.welcomeMessage || "Namaste and welcome! Riaan is here to assist you.")
        }];
      }
      return prev;
    });
  }, [language, botConfig.welcomeMessage]);

  // Fetch live products on mount and dynamic bot settings
  useEffect(() => {
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data.filter((p: any) => !p.hidden));
        }
      })
      .catch(err => console.error("Error loading products for Riaan bot:", err));

    fetch("/api/bot")
      .then(res => res.json())
      .then(data => {
        if (data && data.botName) {
          setBotConfig(data);
        }
      })
      .catch(err => console.error("Error loading chatbot config:", err));
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const textValue = (textToSend || userInput).trim();
    if (!textValue) return;

    if (!textToSend) {
      setUserInput("");
    }

    // Append client message
    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: textValue
    };
    setMessages(prev => [...prev, userMessage]);
    setGenerating(true);

    // Try to extract name from user message to make Riaan feel highly personalized!
    const nameMatch = textValue.match(/(?:my name is|i'm|i am|myself|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    let updatedUserName = userName;
    if (nameMatch && nameMatch[1]) {
      const cleanName = nameMatch[1].trim();
      setUserName(cleanName);
      updatedUserName = cleanName;
    }

    try {
      // Query server-side Gemini chat proxy
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textValue,
          history: messages.slice(-12),
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          const botReply: ChatMessage = {
            id: "bot-" + Date.now(),
            role: "assistant",
            text: data.reply
          };
          setMessages(prev => [...prev, botReply]);
          setGenerating(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Custom local API failed, cascading to dynamic client-side rule fallback.", err);
    }

    // Backup Rule-Based Offline Assistant Response Formulation
    setTimeout(() => {
      const replyText = getRiaanSmartResponse(textValue, updatedUserName, language);
      const botReply: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        text: replyText
      };
      setMessages(prev => [...prev, botReply]);
      setGenerating(false);
    }, 700);
  };

  // Native rule-based stateful assistant intelligence system named "Riaan"
  const getRiaanSmartResponse = (query: string, currentUserName: string, lang: "en" | "ne" = "en"): string => {
    const q = query.toLowerCase();
    const isNe = lang === "ne";
    const greetPrefix = isNe 
      ? (currentUserName ? `नमस्ते ${currentUserName} जी! ` : "नमस्ते! ")
      : (currentUserName ? `Namaste ${currentUserName}! ` : "Namaste! ");

    // Prakash Adhikari / Owner Inquiry
    if (q.includes("prakash") || q.includes("owner") || q.includes("adhikari") || q.includes("who is") || q.includes("मालिक") || q.includes("प्रकाश") || q.includes("अधिकारी")) {
      if (isNe) {
        return `${greetPrefix}रियान को पसल (Riaan Enterprises) श्री प्रकाश अधिकारीको आदरणीय निर्देशनमा सञ्चालित पारिवारिक स्टोर हो। उहाँ थुटिपिपल, रुपन्देही समुदायका अत्यन्त सम्मानित हुनुहुन्छ। उहाँकै सेवा नीति अन्तर्गत हामी रुपन्देही जिल्लाभरि नि:शुल्क डेलिभरी र ०% व्याज दरमा ईएमआई प्रिमियम सेवा प्रदान गर्दछौं!`;
      }
      return `${greetPrefix}Riaan Ko Pasal (Riaan Enterprises) is family-owned and operated under the esteemed guidance of Mr. Prakash Adhikari. He is a highly respected business figure in our Thutipipal, Rupandehi community. Under his direction, we guarantee original brand-authorized products with free home delivery in Rupandehi and pristine customer service!`;
    }

    // 0% Interest EMI Inquiries
    if (q.includes("emi") || q.includes("0%") || q.includes("interest") || q.includes("installment") || q.includes("instal") || q.includes("calcu") || q.includes("pay") || q.includes("downpayment") || q.includes("months") || q.includes("किस्ता") || q.includes("ब्याज") || q.includes("व्याज") || q.includes("इएमआई") || q.includes("ईएमआई")) {
      if (isNe) {
        return `${greetPrefix}हाम्रो विशेष **०% ब्याज ईएमआई (EMI) योजना** तपाइँको बजेट अनुकूल बनाउन डिजाइन गरिएको हो! 
      
कसरी चल्छ:
1. **लचिलो समयावधि**: तपाईं **३, ६, ९, १२, वा १८ महिना** सम्मको किस्ता अवधि रोज्न सक्नुहुन्छ।
2. **डाउनपेमेन्ट चयन**: तपाईं हाम्रो लाइभ सिमुलेटर स्लाइडर प्रयोग गरेर डाउनपेमेन्ट (१०% देखि ९०%) समायोजन गर्न सक्नुहुन्छ।
3. **शुन्य थप शुल्क**: कुनै अतिरिक्त ब्याज वा लुकेको शुल्क लाग्ने छैन!
4. **हिसाब कसरी गर्ने**: क्याटलगमा कुनै पनि उत्पादन कार्डमा क्लिक गरी **'DETAILS'** मा ट्याप गर्नुहोस् र किस्ता क्यालकुलेटर चलाउनुहोस्।

के तपाईं कुनै विशेष ब्रान्डहरू हेर्न चाहनुहुन्छ?`;
      }
      return `${greetPrefix}Our exclusive **0% Interest EMI Scheme** is designed to make premium home appliances and smartphones highly affordable for everyone! 
      
Here is how it works:
1. **Flexible Tenure**: You can select payout schedules of **3, 6, 9, 12, 18, or 24 months**.
2. **Fixed Downpayment**: Downpayment is fixed to the minimum percentage specified by the admin for each product model.
3. **No Hidden Costs**: There is absolutely **0% interest** and no markup premium!
4. **How to Calculate**: Simply click on any product card in the catalog, tap the **'DETAILS'** button, and choose the EMI option. You will see a live installment calculator.

Would you like me to recommend any specific brands?`;
    }

    // Location / Address / Shop info
    if (q.includes("riaan") || q.includes("store") || q.includes("location") || q.includes("where") || q.includes("locate") || q.includes("thutipipal") || q.includes("address") || q.includes("nepal") || q.includes("ठेगाना") || q.includes("कहाँ") || q.includes("पसल") || q.includes("लोकेसन")) {
      if (isNe) {
        return `${greetPrefix}**रियान को पसल** (Riaan Enterprises) सिद्धार्थ राजमार्ग नजिकै, **ओमसतिया-१, थुटिपिपल, रुपन्देही, लुम्बिनी, नेपाल** मा अवस्थित छ। 
      
हामी प्रिमियम घरेलु उपकरणहरू (फ्रिज, वासिङ मेसिन, एसी, टिभी) र स्मार्टफोनहरू बिक्री गर्दछौं। रुपन्देही वरपरका ग्राहकहरूको लागि हामी नि:शुल्क होम डेलिभरी र जडानको व्यवस्था मिलाउँछौं!`;
      }
      return `${greetPrefix}**Riaan Ko Pasal** (Riaan Enterprises) is located in the vibrant hub of **Omsatiya-1, Thutipipal, Rupandehi, Lumbini, Nepal** (near Siddhartha Highway). 
      
We are widely known for delivering premium home appliances (Fridges, Washing Machines, ACs, Smart TVs) and top-tier smartphones. Local customers are welcome to place online reservations on this platform! We coordinate free home delivery and pristine localized setup.`;
    }

    // How to buy / Checkout / Order placement process
    if (q.includes("order") || q.includes("buy") || q.includes("purchase") || q.includes("checkout") || q.includes("deliver") || q.includes("cart") || q.includes("status") || q.includes("अर्डर") || q.includes("किन्ने") || q.includes("किन्न") || q.includes("बुक") || q.includes("बुकिङ") || q.includes("डेलिभरी") || q.includes("ल्याउने")) {
      if (isNe) {
        return `${greetPrefix}हाम्रो पसलबाट सुरक्षित रूपमा सामान बुक गर्न एकदमै सजिलो छ:
      
**अर्डर प्रक्रिया**:
1. तलको क्याटलग ब्राउज गर्नुहोस् र आफ्नो मनपर्ने उपकरण छान्नुहोस्।
2. विवरणहरू हेर्न उत्पादनको फोटो वा नाममा ट्याप गर्नुहोस्।
3. **'DETAILS'** मा क्लिक गर्नुहोस्। त्यसपछि **'Buy Directly'** वा **'Buy on EMI'** रोज्नुहोस्।
4. आफ्नो नाम, मोबाइल नम्बर र घरको ठेगाना फारममा भर्नुहोस्।
5. **'Confirm Reservation'** मा क्लिक गर्नुहोस्। श्री प्रकाश अधिकारीको टिमले तुरुन्त फोन गरेर डेलिभरीको व्यवस्था मिलाउनेछ!`;
      }
      return `${greetPrefix}Securing your favorite home appliance or phone is simple and fully digital here!
      
**Step-by-step Ordering**:
1. Browse our catalog below and select any model.
2. Tap the brand filter or search bar to find options.
3. Click on the model to view full technical specifications.
4. Click **'DETAILS'**. Select either **'Buy Directly'** or **'Buy on EMI'** (to see calculated fixed downpayment and tenure).
5. Click **'Reserve on EMI Order'** or **'Reserve Direct Booking'**.
6. Input your Name, active Mobile Number, and Delivery Address in the form.
7. Click **'Confirm Reservation'**. Mr. Prakash Adhikari's dispatch team will immediately call you to verify details and bring it directly to your doorstep for free!`;
    }

    // Specific brand queries based on dynamic products
    const brandsInDatabase = Array.from(new Set(products.map(p => String(p.brand).toLowerCase()))) as string[];
    let matchedBrand = "";
    for (const b of brandsInDatabase) {
      if (q.includes(b)) {
        matchedBrand = b;
        break;
      }
    }

    // List of dynamic products matching brand
    if (matchedBrand) {
      const filtered = products.filter(p => p.brand.toLowerCase() === matchedBrand);
      if (filtered.length > 0) {
        if (isNe) {
          let response = `${greetPrefix}हजुर! हामीसँग **${filtered[0].brand}** का प्रिमियम मोडलहरू उपलब्ध छन्: \n\n`;
          filtered.slice(0, 4).forEach(p => {
            const isPEnabled = p.emiAvailable !== false;
            const minDP = p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 30;
            const allowedTenures = p.allowedTenures && p.allowedTenures.length > 0 ? p.allowedTenures : [3, 6, 9, 10, 12, 18];
            const maxTenure = Math.max(...allowedTenures);
            const emiEstimated = isPEnabled ? Math.round((p.price * (100 - minDP) / 100) / maxTenure) : 0;

            if (isPEnabled) {
              response += `• **${p.model}**: NRs. ${p.price.toLocaleString()}\n  *ईएमआई*: मात्र **NRs. ${emiEstimated.toLocaleString()}/महिना** बाट सुरु (${minDP}% डाउनपेमेन्ट, ${maxTenure} महिना)!\n\n`;
            } else {
              response += `• **${p.model}**: NRs. ${p.price.toLocaleString()}\n  *भुक्तानी*: सीधै पूरा रकम तिरेर मात्र (ईएमआई उपलब्ध छैन)।\n\n`;
            }
          });
          response += `तलको सूचीमा यी उत्पादनहरू क्लिक गरी 'DETAILS' मा गएर तुरुन्त बुक गर्नुहोस्!`;
          return response;
        }
        let response = `${greetPrefix}Yes! We carry a premium selection of **${filtered[0].brand}** models: \n\n`;
        filtered.slice(0, 4).forEach(p => {
          const isPEnabled = p.emiAvailable !== false;
          const minDP = p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 30;
          const allowedTenures = p.allowedTenures && p.allowedTenures.length > 0 ? p.allowedTenures : [3, 6, 9, 10, 12, 18];
          const maxTenure = Math.max(...allowedTenures);
          const emiEstimated = isPEnabled ? Math.round((p.price * (100 - minDP) / 100) / maxTenure) : 0;

          if (isPEnabled) {
            response += `• **${p.model}**: NRs. ${p.price.toLocaleString()}\n  *Est. EMI*: Starting from just **NRs. ${emiEstimated.toLocaleString()}/month** (${minDP}% downpayment over ${maxTenure} months)!\n\n`;
          } else {
            response += `• **${p.model}**: NRs. ${p.price.toLocaleString()}\n  *PaymentMode*: Outright direct purchase only (EMI not applicable for this model).\n\n`;
          }
        });
        response += `Simply click on any of these models below, click 'DETAILS' to check out custom EMI schedules or order directly!`;
        return response;
      }
    }

    // Search model match
    let matchedProduct = null;
    for (const p of products) {
      const modelLower = p.model.toLowerCase();
      if (q.includes(modelLower) || modelLower.includes(q)) {
        matchedProduct = p;
        break;
      }
    }

    if (matchedProduct) {
      const isPEnabled = matchedProduct.emiAvailable !== false;
      const minDP = matchedProduct.minDownpaymentPercent !== undefined ? matchedProduct.minDownpaymentPercent : 30;
      const allowedTenures = matchedProduct.allowedTenures && matchedProduct.allowedTenures.length > 0 ? matchedProduct.allowedTenures : [3, 6, 9, 10, 12, 18];

      let emiSection = "";
      if (isNe) {
        if (isPEnabled) {
          emiSection = `**०% ब्याज ईएमआई बुकिङ विकल्पहरू**:`;
          allowedTenures.slice(0, 3).forEach(months => {
            const installment = Math.round((matchedProduct.price * (100 - minDP) / 100) / months);
            emiSection += `\n- **${months}-महिना योजना**: मात्र **NRs. ${installment.toLocaleString()}/महिना** (${minDP}% न्यूनतम डाउनपेमेन्टमा)।`;
          });
        } else {
          emiSection = `**०% ब्याज ईएमआई बुकिङ विकल्पहरू**:\n- *विशेष नोट*: यस उत्पादनमा ईएमआई उपलब्ध छैन (सीधै पूरा भुक्तानी गरी किन्नुहोस्)।`;
        }
      } else {
        if (isPEnabled) {
          emiSection = `**0% EMI Purchase Pathways**:`;
          allowedTenures.slice(0, 3).forEach(months => {
            const installment = Math.round((matchedProduct.price * (100 - minDP) / 100) / months);
            emiSection += `\n- **${months}-Month Plan**: Approx. **NRs. ${installment.toLocaleString()}/month** (after ${minDP}% minimum downpayment).`;
          });
        } else {
          emiSection = `**0% EMI Purchase Pathways**:\n- *Note*: Under Mr. Prakash Adhikari's catalog guidelines, EMI is not available for this specific product (outright purchase only).`;
        }
      }

      if (isNe) {
        return `${greetPrefix}**${matchedProduct.brand} ${matchedProduct.model}** एकदमै उत्कृष्ट छनौट हो! यो उत्पादन रियान को पसलमा हाल उपलब्ध छ, यसको मूल्य **NRs. ${matchedProduct.price.toLocaleString()}** हो।

**मुख्य विशेषताहरू**:
• **डिस्प्ले**: ${matchedProduct.specs?.screen || "AMOLED High Refresh Rate"}
• **प्रोसेसर**: ${matchedProduct.specs?.processor || "High Performance Processor"}
• **क्यामरा**: ${matchedProduct.specs?.camera || "Pro Optics Camera System"}
• **ब्याट्री**: ${matchedProduct.specs?.battery || "Capacious battery"}
• **भण्डारण**: ${matchedProduct.specs?.storage || "Expanded storage"}

${emiSection}

थप बुझ्न र अर्डर गर्न तल देखाएको यस उत्पादनको 'DETAILS' मा क्लिक गर्नुहोस्!`;
      }

      return `${greetPrefix}The **${matchedProduct.brand} ${matchedProduct.model}** is an exceptional choice! It is currently in stock at Riaan Ko Pasal for **NRs. ${matchedProduct.price.toLocaleString()}**.

**Key Technical Details**:
• **Display**: ${matchedProduct.specs?.screen || "AMOLED High Refresh Rate"}
• **Processor**: ${matchedProduct.specs?.processor || "High Performance Gaming SoC"}
• **Camera**: ${matchedProduct.specs?.camera || "Pro Optics System"}
• **Power & Battery**: ${matchedProduct.specs?.battery || "Super Charge Capacious cell"}
• **Storage & Memory**: ${matchedProduct.specs?.storage || "Expanded Standard Storage space"}
• **Colors Choice**: ${(matchedProduct.colorOptions || []).join(", ")}

${emiSection}

Simply click on this product card in our catalog, select 'DETAILS', and submit your booking. Mr. Prakash Adhikari will coordinate your free home delivery!`;
    }

    // Name response
    if (q.includes("your name") || q.includes("who are you") || q.includes("u name") || q.includes("assist") || q.includes("तपाईंको नाम") || q.includes("तिमी को")) {
      if (isNe) {
        return `म **रियान** हुँ, तपाईंको निजी भर्चुअल सहयोगी! हाम्रो स्टोर **रियान को पसल** को तर्फबाट म तपाईंलाई किस्ता प्रक्रिया, ठेगाना, र स्मार्टफोन/घरेलु सामान छान्न मद्दत गर्न यहाँ उपलब्ध छु।`;
      }
      return `I am **Riaan**, your dedicated virtual assistant and store concierge! Named proudly after our enterprise **Riaan Ko Pasal**, I am built locally to provide blazing-fast answers about technical models, 0% EMI terms, and store info. I don't need any complex internet cloud models or extra setting keys to guide you!`;
    }

    // High budget or elite models
    if (q.includes("best") || q.includes("flagship") || q.includes("expensive") || q.includes("top") || q.includes("उत्कृष्ट") || q.includes("महँगो")) {
      const expensiveOnes = [...products].sort((a, b) => b.price - a.price).slice(0, 3);
      if (expensiveOnes.length > 0) {
        if (isNe) {
          let response = `${greetPrefix}हाम्रा सबैभन्दा उत्कृष्ट र फ्ल्यागसिप स्मार्टफोनहरू यस प्रकार छन्:\n\n`;
          expensiveOnes.forEach((p, idx) => {
            response += `${idx + 1}. **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()}\n   *मुख्य विशेषता*: ${p.specs?.processor || "उत्कृष्ट प्रोसेसर"} • ${p.specs?.camera || "उत्कृष्ट क्यामरा"}\n`;
          });
          response += `\nयी सबै उत्कृष्ट मोडलहरूमा **०% ब्याज दरमा सहज किस्ता (EMI)** को सुविधा उपलब्ध छ!`;
          return response;
        }
        let response = `${greetPrefix}Our most premium, top-tier flagship smartphones are:\n\n`;
        expensiveOnes.forEach((p, idx) => {
          response += `${idx + 1}. **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()}\n   *Highlight*: ${p.specs?.processor || "High speed CPU"} • ${p.specs?.camera || "Elite Camera"}\n`;
        });
        response += `\nAll our flagship models are eligible for **0% Interest EMI** with fixed low downpayment schemes to make them light on your wallet. Which one interests you?`;
        return response;
      }
    }

    // Budget, low price or affordable smartphones
    if (q.includes("cheap") || q.includes("budget") || q.includes("affordable") || q.includes("under") || q.includes("less than") || q.includes("minimum") || q.includes("मुनि") || q.includes("कम") || q.includes("सस्तो")) {
      const affordableOnes = [...products].sort((a, b) => a.price - b.price).slice(0, 3);
      if (affordableOnes.length > 0) {
        if (isNe) {
          let response = `${greetPrefix}हामीसँग उत्कृष्ट मूल्य र विशेषताहरू भएका बजेट-अनुकुल विकल्पहरू छन्:\n\n`;
          affordableOnes.forEach((p) => {
            response += `• **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}** (मासिक किस्ता मात्र NRs. ${(Math.round(p.price / 18)).toLocaleString()}/महिनाबाट सुरु!)\n`;
          });
          response += `\nतपाईं तलको मूल्य फिल्टर स्लाइडर तानेर पनि आफ्नो बजेट अनुसार खोज्न सक्नुहुन्छ!`;
          return response;
        }
        let response = `${greetPrefix}We have excellent, high-value, price-to-performance options that are highly budget-friendly:\n\n`;
        affordableOnes.forEach((p) => {
          response += `• **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}** (EMI from NRs. ${(Math.round(p.price / 18)).toLocaleString()}/month with zero interest!)\n`;
        });
        response += `\nYou can filter prices using our interactive Price Slider below to find the perfect match!`;
        return response;
      }
    }

    // Standard fallback response
    if (isNe) {
      return `रियान को पसलमा स्वागत छ! म तपाईंलाई निम्न विषयहरूमा सहयोग गर्न सक्छु:
• **०% ब्याज दरमा सहज ईएमआई (EMI)** र मासिक किस्ता गणना।
• स्मार्टफोन र विद्युतीय उपकरणका ब्रान्ड र विशेषताहरू।
• ओमसतिया-१, थुटिपिपल, रुपन्देहीमा अवस्थित हाम्रो भौतिक पसलको लोकेसन।
• पसल सञ्चालक श्री प्रकाश अधिकारी सम्बन्धी जानकारी।

कृपया कुनै पनि प्रश्न सोध्नुहोस् वा तल क्याटलगमा रहेको कुनै उत्पादनमा 'DETAILS' थिची किस्ता हिसाव सुरु गर्नुहोस्!`;
    }

    return `Greetings from Riaan! I am here to help you navigate our digital showroom. I can clarify:
• **0% Interest EMI terms** (repayment over 3 to 24 months, with fixed low downpayment on checkout)
• **Technical details & live prices** of dynamic smartphones (Apple, Samsung, Xiaomi, OnePlus, Realme, Vivo)
• **Store address** in Omsatiya-1, Thutipipal, Rupandehi, Lumbini, Nepal
• **Details about our owner**, Mr. Prakash Adhikari

Feel free to ask me anything or click on any smartphone in the showcase to start calculating EMI installments!`;
  };

  const presetPrompts = language === "ne" ? [
    "१ लाख मुनिका मोडलहरू के छन्?",
    "तपाईंको पसल कता छ?",
    "०% ब्याज ईएमआई कसरी चल्छ?",
    "पसलको मालिक को हुनुहुन्छ?"
  ] : [
    "Any models under 100K?",
    "Where is your shop?",
    "How does 0% EMI work?",
    "Who is the owner?"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.88, y: 40, filter: "blur(6px)" }}
          transition={{ type: "spring", damping: 25, stiffness: 320 }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:right-8 z-50 w-[calc(100vw-32px)] sm:w-96 h-[520px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200/80 flex flex-col font-sans text-left overflow-hidden"
          id="shopping-ai-panel"
        >
          {/* Drawer Head banner */}
          <div className="p-4 bg-gradient-to-r from-[#4a0605] to-[#3a0201] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
                <Bot className="w-5 h-5 text-yellow-500 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-semibold block text-yellow-500 uppercase tracking-widest font-mono">
                  {botConfig.botName || "Riaan"}
                </span>
                <span className="text-[10px] text-amber-200/75 tracking-wider block font-light">
                  {language === "ne" ? "आधिकारिक स्टोर सहयोगी" : "Official Store Concierge"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-black/25 rounded-full p-0.5 border border-white/10 shadow-inner select-none mr-1.5">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-full cursor-pointer select-none transition-all duration-200 ${
                    language === 'en' ? 'bg-amber-400 text-black shadow-xs' : 'text-amber-100/70 hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ne')}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-full cursor-pointer select-none transition-all duration-200 ${
                    language === 'ne' ? 'bg-amber-400 text-black shadow-xs' : 'text-amber-100/70 hover:text-white'
                  }`}
                >
                  नेपा
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1 text-amber-200/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Minimize chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Message list window */}
          <div 
            ref={scrollRef}
            className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50/70 spreadsheet-scroll"
            id="chat-messages-container"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Persona avatars */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user" ? "bg-gray-200 text-gray-700" : "bg-[#4a0605] text-yellow-500 shadow-xs"
                }`}>
                  {msg.role === "user" ? "U" : <Bot className="w-4 h-4" />}
                </div>

                {/* Content chat bubble */}
                <div className={`p-3 rounded-xl text-xs leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-gray-900 border-gray-950 text-white rounded-tr-none text-right shadow-xs"
                    : "bg-white border-gray-200/60 text-gray-800 rounded-tl-none text-left shadow-xs"
                }`}>
                  <p className="whitespace-pre-line text-left">
                    {msg.text.replace(/\*\*/g, "")}
                  </p>
                </div>
              </motion.div>
            ))}

            {generating && (
              <div className="flex items-center gap-2 mr-auto text-gray-400 font-mono text-[10px] animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4a0605]" />
                <span>{language === "ne" ? "रियान जवाफ तयार गर्दै हुनुहुन्छ..." : `${botConfig.botName || "Riaan"} is formulating...`}</span>
              </div>
            )}
          </div>

          {/* Input panel deck */}
          <div className="p-3.5 border-t border-gray-150 bg-white space-y-2.5">
            
            {/* Helper query tags visible on start - Styled ultra-compact to take less than 10% space */}
            {messages.length < 4 && (
              <div className="flex flex-row flex-nowrap overflow-x-auto gap-1.5 pb-1 -mx-3 px-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full items-center">
                {presetPrompts.map((p: string) => (
                  <button
                    key={p}
                    onClick={() => handleSendMessage(p)}
                    disabled={generating}
                    className="inline-block flex-none px-2.5 py-1 bg-gray-50 hover:bg-[#4a0605]/5 text-gray-600 hover:text-[#4a0605] text-[10px] rounded-full border border-gray-200/50 font-medium transition-all duration-200 disabled:opacity-50 whitespace-nowrap cursor-pointer select-none"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Action input box */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={language === "ne" ? "रियानलाई मोडल, EMI, वा ठेगानाबारे सोध्नुहोस्..." : "Ask Riaan about models, EMI, location..."}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !generating) handleSendMessage();
                }}
                disabled={generating}
                className="flex-grow px-3 py-2 border border-gray-250 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500/20 focus:border-[#4a0605]"
              />
              
              <button
                onClick={() => handleSendMessage()}
                disabled={generating || !userInput.trim()}
                className="p-2 bg-[#4a0605] text-white rounded-lg hover:bg-yellow-500 hover:text-black hover:scale-105 active:scale-[0.96] disabled:bg-gray-150 disabled:text-gray-300 disabled:scale-100 transition-all font-semibold cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
