import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Check, 
  Edit3, 
  Trash, 
  Phone, 
  User, 
  Home, 
  HelpCircle,
  Plus,
  X,
  Smartphone,
  CheckCircle,
  Package,
  Star,
  Image as ImageIcon,
  Sliders,
  Award,
  MessageSquare,
  Eye,
  EyeOff,
  Bot,
  Sparkles,
  Trash2,
  Settings,
  BookOpen,
  CheckCircle2,
  LayoutGrid,
  Filter,
  Calendar,
  DollarSign,
  CheckSquare,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Bell,
  ExternalLink,
  CreditCard,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { OrderItem, PhoneProduct } from "../../types";

interface AdminSpreadsheetProps {
  adminSession: { username: string; passcode: string; role: "Owner" | "Admin" | "Moderator" };
  onLogout: () => void;
}

const sortCategories = (list: string[]): string[] => {
  const main = list.filter(c => c.toLowerCase() !== "other" && c.toLowerCase() !== "others");
  const other = list.filter(c => c.toLowerCase() === "other" || c.toLowerCase() === "others");
  main.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return [...main, ...other];
};

export default function AdminSpreadsheet({ adminSession, onLogout }: AdminSpreadsheetProps) {
  const defaultTab = adminSession.role === "Moderator" ? "products" : "orders";
  const [activeTab, setActiveTab ] = useState<"orders" | "products" | "reviews" | "staff_logs" | "chatbot">(defaultTab);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  
  const [ordersSearch, setOrdersSearch] = useState("");
  const [productsSearch, setProductsSearch] = useState("");
  const [reviewsSearch, setReviewsSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");

  // Grid/Cards view modes and filters (Option 4 Agile Bento Board integration)
  const [viewMode, setViewMode] = useState<"spreadsheet" | "bento" | "finance">("bento"); // Default to option 4 so they see it instantly!
  const [financeSubTab, setFinanceSubTab] = useState<"emi" | "direct" | "canceled">("emi");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [buyTypeFilter, setBuyTypeFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<keyof OrderItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const getSortIndicator = (field: keyof OrderItem) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity ml-1.5 inline-block" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3 h-3 text-red-500 scale-110 ml-1.5 inline-block" />;
    }
    return <ArrowDown className="w-3 h-3 text-red-500 scale-110 ml-1.5 inline-block" />;
  };

  const handleSort = (field: keyof OrderItem) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // New staff form state
  const [newStaffUser, setNewStaffUser] = useState("");
  const [newStaffPass, setNewStaffPass] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"Owner" | "Admin" | "Moderator" | string>("Admin");

  // Inline editing state for staff passcodes
  const [editingStaffUser, setEditingStaffUser] = useState<string | null>(null);
  const [editingPasscode, setEditingPasscode] = useState("");
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  const getHeaders = (withContentType = false) => {
    const headers: Record<string, string> = {
      "X-Staff-Username": adminSession.username,
      "X-Staff-Passcode": adminSession.passcode
    };
    if (withContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  };

  // Non-blocking iframe-safe Toast states
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (message: string, isError = true) => {
    if (isError) {
      setErrorToast(message);
      setTimeout(() => setErrorToast(prev => prev === message ? null : prev), 4500);
    } else {
      setSuccessToast(message);
      setTimeout(() => setSuccessToast(prev => prev === message ? null : prev), 4500);
    }
  };

  // Inline action confirmations to bypass iframe sandbox restrictions
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmDeleteCategoryName, setConfirmDeleteCategoryName] = useState<string | null>(null);
  
  // Real-time booking edits
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [selectedEmiOrderForReminders, setSelectedEmiOrderForReminders] = useState<OrderItem | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Ticker Customizer State
  const [tickerNepali, setTickerNepali] = useState<string[]>([]);
  const [tickerEnglish, setTickerEnglish] = useState<string[]>([]);
  const [loadingTicker, setLoadingTicker] = useState(false);
  const [savingTicker, setSavingTicker] = useState(false);
  const [newTickerNepaliMsg, setNewTickerNepaliMsg] = useState("");
  const [newTickerEnglishMsg, setNewTickerEnglishMsg] = useState("");

  // Chatbot State Customizer variables
  const [botName, setBotName] = useState("Riaan");
  const [botWelcome, setBotWelcome] = useState("");
  const [botInstruction, setBotInstruction] = useState("");
  const [botPresets, setBotPresets] = useState<string[]>([]);
  const [newPresetPrompt, setNewPresetPrompt] = useState("");
  const [loadingBot, setLoadingBot] = useState(false);
  const [savingBot, setSavingBot] = useState(false);
  const [botFaqs, setBotFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [faqFeedback, setFaqFeedback] = useState<string | null>(null);

  const parseInstructionToFaqs = (instructionText: string) => {
    const parsed: { id: string; question: string; answer: string }[] = [];
    
    if (instructionText.includes("Q:") || /q\s*:/i.test(instructionText)) {
      const lines = instructionText.split(/\n+/);
      let currentQ = "";
      let currentA = "";
      
      lines.forEach((line) => {
        const qMatch = line.trim().match(/^(?:Q|Question)\s*:\s*(.*)/i);
        const aMatch = line.trim().match(/^(?:A|Answer|Response)\s*:\s*(.*)/i);
        
        if (qMatch) {
          if (currentQ && currentA) {
            parsed.push({
              id: "faq-" + Math.random().toString(36).substring(2, 9),
              question: currentQ.trim(),
              answer: currentA.trim()
            });
            currentQ = "";
            currentA = "";
          }
          currentQ = qMatch[1];
        } else if (aMatch) {
          currentA = aMatch[1];
        } else {
          if (currentQ && !currentA) {
            currentQ += " " + line.trim();
          } else if (currentA) {
            currentA += " " + line.trim();
          }
        }
      });
      if (currentQ && currentA) {
        parsed.push({
          id: "faq-" + Math.random().toString(36).substring(2, 9),
          question: currentQ.trim(),
          answer: currentA.trim()
        });
      }
    }

    if (parsed.length === 0) {
      if (instructionText.toLowerCase().includes("thutipipal") || instructionText.toLowerCase().includes("location")) {
        parsed.push({
          id: "faq-loc",
          question: "Where is Riaan Ko Pasal located, and what is your address?",
          answer: "Riaan Ko Pasal (Riaan Enterprises) is proudly located in Omsatiya-1, Thutipipal, Rupandehi, Nepal near Siddhartha Highway."
        });
      }
      if (instructionText.toLowerCase().includes("emi") || instructionText.toLowerCase().includes("interest")) {
        parsed.push({
          id: "faq-emi",
          question: "How does the 0% Interest EMI plan work, and who qualifies?",
          answer: "We offer completely customizable 0% Interest EMI plans over 3, 6, 9, 12, or 18 months with 0% interest and 0% markup! Customers choose their preferred downpayment slider, submit, and Mr. Prakash Adhikari's team will contact you directly."
        });
      }
      if (instructionText.toLowerCase().includes("prakash") || instructionText.toLowerCase().includes("owner")) {
        parsed.push({
          id: "faq-owner",
          question: "Who is the owner, and can I contact them directly?",
          answer: "Our showroom is owned and supervised by Mr. Prakash Adhikari, an esteemed local entrepreneur in Rupandehi known for honest hospitality and reliable product guarantees."
        });
      }
      if (instructionText.toLowerCase().includes("delivery") || instructionText.toLowerCase().includes("ship")) {
        parsed.push({
          id: "faq-del",
          question: "Do you offer home delivery and basic installation setup?",
          answer: "Yes! We provide immediate 100% free home doorstep delivery and installation for any home appliance bundle across the entire Rupandehi district territory."
        });
      }
    }

    if (parsed.length === 0) {
      parsed.push(
        {
          id: "faq-default-1",
          question: "What products are available at the store?",
          answer: "We offer premium energy-efficient Refrigerators/Fridges, Split Inverter Air Conditioners (AC), Front/Top Load Washing Machines, and Smart Ultra HD LED Televisions."
        },
        {
          id: "faq-default-2",
          question: "How can I book or purchase an appliance?",
          answer: "Select your desired product, adjust the down payment percentage slider or select direct outright purchase, and fill out your delivery credentials in the checkout popup securely."
        }
      );
    }

    return parsed;
  };

  // Dynamic Product Form State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [formId, setFormId] = useState(""); // empty indicates ADDING, non-empty indicates EDITING
  const [formBrand, setFormBrand] = useState("LG");
  const [formModel, setFormModel] = useState("");
  const [formPrice, setFormPrice] = useState<number>(65000);
  const [formSpecs, setFormSpecs] = useState<{ key: string; value: string }[]>([
    { key: "Capacity", value: "" },
    { key: "Energy Rating", value: "" },
    { key: "Type", value: "" }
  ]);
  const [formColors, setFormColors] = useState("White, Brushed Steel");
  const [formImage, setFormImage] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formOutOfStock, setFormOutOfStock] = useState(false);
  const [formHidden, setFormHidden] = useState(false);
  const [formEmiAvailable, setFormEmiAvailable] = useState(true);
  const [formMinDownpaymentPercent, setFormMinDownpaymentPercent] = useState<number>(30);
  const [formAllowedTenures, setFormAllowedTenures] = useState<number[]>([3, 6, 9, 10, 12, 18]);

  // Customizable Dynamic Categories Config State
  const [categories, setCategories] = useState<string[]>(sortCategories(["Mobile", "TV", "Fridge", "AC", "Washing Machine", "Other"]));
  const [formCategory, setFormCategory] = useState<string>("AC");
  const [newCatInput, setNewCatInput] = useState<string>("");
  const [isAddingNewCat, setIsAddingNewCat] = useState<boolean>(false);

  // Poll for realtime spreadsheet updates (Orders)
  useEffect(() => {
    if (adminSession.role === "Moderator") {
      setLoadingOrders(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: getHeaders()
        });
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            // Sort reverse chronologically
            setOrders(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          } else {
            console.warn("Expected JSON response from /api/orders, but got:", contentType);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
          console.warn("Network connection standby: Failed to fetch order sheets rows. This is normal during server hot-restarts.");
        } else {
          console.error("Error fetching order sheets rows:", err);
        }
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();

    // Polling setup for live sync
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [refreshTrigger, adminSession]);

  // Fetch dynamic products from dynamic json file
  const fetchProductsList = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/products", {
        headers: getHeaders()
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setProducts(data);
        } else {
          console.warn("Expected JSON response from /api/products, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch products list.");
      } else {
        console.error("Failed to load dynamic store catalog products:", err);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const res = await fetch("/api/categories", {
        headers: getHeaders()
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setCategories(sortCategories(data));
        } else {
          console.warn("Expected JSON response from /api/categories, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch categories.");
      } else {
        console.error("Failed to load category database:", err);
      }
    }
  };

  const fetchReviewsList = async () => {
    if (adminSession.role !== "Owner") {
      setLoadingReviews(false);
      return;
    }
    try {
      setLoadingReviews(true);
      const res = await fetch("/api/reviews", {
        headers: getHeaders()
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setReviews(data);
        } else {
          console.warn("Expected JSON response from /api/reviews, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch reviews.");
      } else {
        console.error("Failed to load reviews database:", err);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchStaffList = async () => {
    if (adminSession.role !== "Owner") return;
    try {
      setLoadingStaff(true);
      const res = await fetch("/api/staff", {
        headers: getHeaders()
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setStaffList(data);
        } else {
          console.warn("Expected JSON response from /api/staff, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch staff list.");
      } else {
        console.error("Failed to load staff:", err);
      }
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (adminSession.role !== "Owner") return;
    try {
      setLoadingAudit(true);
      const res = await fetch("/api/audit", {
        headers: getHeaders()
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setAuditLogs(data);
        } else {
          console.warn("Expected JSON response from /api/audit, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch audit logs.");
      } else {
        console.error("Failed to load audit:", err);
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchTickerData = async () => {
    try {
      setLoadingTicker(true);
      const res = await fetch("/api/ticker");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setTickerNepali(data.nepali || []);
          setTickerEnglish(data.english || []);
        } else {
          console.warn("Expected JSON response from /api/ticker, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch ticker data.");
      } else {
        console.error("Failed to load ticker data:", err);
      }
    } finally {
      setLoadingTicker(false);
    }
  };

  const handleSaveTicker = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSavingTicker(true);
      const res = await fetch("/api/ticker", {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({
          nepali: tickerNepali,
          english: tickerEnglish
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTickerNepali(data.ticker.nepali);
        setTickerEnglish(data.ticker.english);
        showToast("Announcements ticker tape configuration saved successfully!", false);
        fetchAuditLogs();
      } else {
        const errVal = await res.json();
        showToast(errVal.error || "Failed to save ticker configuration.", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Network error saving ticker configuration.", true);
    } finally {
      setSavingTicker(false);
    }
  };

  const fetchBotData = async () => {
    try {
      setLoadingBot(true);
      const res = await fetch("/api/bot");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setBotName(data.botName || "Riaan");
          setBotWelcome(data.welcomeMessage || "");
          setBotInstruction(data.systemInstruction || "");
          setBotPresets(data.presetPrompts || []);
          
          const loadedFaqs = data.faqs || [];
          if (loadedFaqs.length > 0) {
            setBotFaqs(loadedFaqs);
          } else {
            setBotFaqs(parseInstructionToFaqs(data.systemInstruction || ""));
          }
        } else {
          console.warn("Expected JSON response from /api/bot, but got:", contentType);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.toString()?.includes("Failed to fetch")) {
        console.warn("Network connection standby: Failed to fetch bot configuration.");
      } else {
        console.error("Failed to load bot configuration dynamically:", err);
      }
    } finally {
      setLoadingBot(false);
    }
  };

  const handleSaveBot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSavingBot(true);
      const res = await fetch("/api/bot", {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({
          botName,
          welcomeMessage: botWelcome,
          systemInstruction: botInstruction,
          presetPrompts: botPresets,
          faqs: botFaqs
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBotName(data.bot.botName);
        setBotWelcome(data.bot.welcomeMessage);
        setBotInstruction(data.bot.systemInstruction);
        setBotPresets(data.bot.presetPrompts);
        setBotFaqs(data.bot.faqs || []);
        showToast("AI Chatbot configurations saved successfully!", false);
        fetchAuditLogs();
      } else {
        const errVal = await res.json();
        showToast(errVal.error || "Failed to save chatbot configuration settings.", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Network error trying to rewrite chatbot configurations.", true);
    } finally {
      setSavingBot(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newStaffUser.trim();
    const cleanPass = newStaffPass.trim();
    if (!cleanUser || !cleanPass) {
      showToast("Username and passcode are both required.", true);
      return;
    }

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          username: cleanUser,
          passcode: cleanPass,
          role: newStaffRole
        })
      });

      if (res.ok) {
        showToast(`Staff member "${cleanUser}" successfully registered!`, false);
        setNewStaffUser("");
        setNewStaffPass("");
        setNewStaffRole("Admin");
        fetchStaffList();
        fetchAuditLogs();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to register staff member.", true);
      }
    } catch (err) {
      showToast("Network failure adding staff member.", true);
    }
  };

  const handleDeleteStaff = async (usernameToDelete: string) => {
    try {
      const res = await fetch(`/api/staff/${encodeURIComponent(usernameToDelete)}`, {
        method: "DELETE",
        headers: getHeaders()
      });

      if (res.ok) {
        showToast(`Privileges revoked for "${usernameToDelete}".`, false);
        fetchStaffList();
        fetchAuditLogs();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to revoke staff credentials.", true);
      }
    } catch (err) {
      showToast("Network error during revocation.", true);
    }
  };

  const handleSavePasscode = async (usernameToUpdate: string, newPass: string) => {
    const cleanPass = newPass.trim();
    if (!cleanPass) {
      showToast("Passcode cannot be empty.", true);
      return;
    }

    try {
      const res = await fetch(`/api/staff/${encodeURIComponent(usernameToUpdate)}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ passcode: cleanPass })
      });

      if (res.ok) {
        showToast(`Passcode updated successfully for "${usernameToUpdate}".`, false);
        // If updating own passcode, update the in-memory session passcode to keep the session active and authorized
        if (usernameToUpdate.toLowerCase() === adminSession.username.toLowerCase()) {
          adminSession.passcode = cleanPass;
        }
        setEditingStaffUser(null);
        fetchStaffList();
        fetchAuditLogs();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to update passcode.", true);
      }
    } catch (err) {
      showToast("Network error updating passcode.", true);
    }
  };

  const handleClearAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit/clear", {
        method: "POST",
        headers: getHeaders()
      });
      if (res.ok) {
        showToast("System audit logs have been successfully cleared.", false);
        fetchAuditLogs();
      } else {
        showToast("Failed to clear audit traces.", true);
      }
    } catch (err) {
      showToast("Network error trying to clear audit.", true);
    }
  };

  const handleToggleHideReview = async (reviewId: string, currentHidden: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ hidden: !currentHidden })
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, hidden: !currentHidden } : r));
        showToast(`Review visibility updated successfully!`, false);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update review status.", true);
      }
    } catch (err) {
      console.error("Error toggling review visibility:", err);
      showToast("Could not update review visibility.", true);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
        showToast("The customer review has been permanently deleted.", false);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to delete review.", true);
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      showToast("Could not complete review delete operation.", true);
    } finally {
      setConfirmDeleteReviewId(null);
    }
  };

  useEffect(() => {
    fetchProductsList();
    fetchCategoriesList();
    if (adminSession.role === "Owner" || adminSession.role === "Admin") {
      fetchBotData();
    }
    if (adminSession.role === "Owner") {
      fetchReviewsList();
      fetchStaffList();
      fetchAuditLogs();
      fetchTickerData();
    }
  }, [adminSession]);

  // Handle live status editing
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
      }
    } catch (err) {
      console.error("Failed to update status cell:", err);
    }
  };

  // Inline notes save
  const saveNotesCell = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify({ notes: tempNotes })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, notes: tempNotes } : o));
        setEditingCellId(null);
      }
    } catch (err) {
      console.error("Failed to sync notes:", err);
    }
  };

  // Live order finance update helper
  const handleFinanceUpdate = async (id: string, updates: Partial<OrderItem>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
        showToast("Financial record updated successfully.", false);
      } else {
        showToast("Failed to update financial record.", true);
      }
    } catch (err) {
      console.error("Failed to update order finance details:", err);
      showToast("Network error updating financial record.", true);
    }
  };

  // Export full table columns into raw download CSV spreadsheet
  const exportToCSV = () => {
    if (orders.length === 0) {
      showToast("No customer reservation data currently available in database to export.", true);
      return;
    }

    const headers = [
      "Order ID",
      "Timestamp",
      "Buyer Name",
      "Contact Phone",
      "Address",
      "Brand",
      "Product Model",
      "Selected Color",
      "Payment Type",
      "EMI Tenure (m)",
      "Downpayment (NRs)",
      "Monthly Installment (NRs)",
      "Order Status",
      "Action Notes"
    ];

    const csvRows = [headers.join(",")];

    orders.forEach((o) => {
      const row = [
        o.id,
        new Date(o.timestamp).toLocaleString().replace(",", " "),
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerContact}"`,
        `"${o.customerAddress.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        o.brand,
        o.model,
        o.selectedColor,
        o.buyType,
        o.emiTenure || "N/A",
        o.emiDownpayment || 0,
        o.emiMonthly || 0,
        o.status,
        `"${(o.notes || "").replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Riaan_Ko_Pasal_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Catalog CRUD Functions
  const handleOpenAddProduct = () => {
    setFormId("");
    setFormBrand("LG");
    setFormModel("");
    setFormPrice(65000);
    setFormSpecs([
      { key: "Capacity", value: "250 Litres" },
      { key: "Energy Rating", value: "3 Star" },
      { key: "Type", value: "Double Door Fridge" }
    ]);
    setFormColors("Brushed Steel, elegant Inox");
    setFormImage("");
    setFormImages([]);
    setFormIsPopular(false);
    setFormOutOfStock(false);
    setFormHidden(false);
    setFormEmiAvailable(true);
    setFormMinDownpaymentPercent(30);
    setFormAllowedTenures([3, 6, 9, 10, 12, 18]);
    setFormCategory(categories[0] || "Mobile");
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (p: PhoneProduct) => {
    setFormId(p.id || "");
    setFormBrand(p.brand);
    setFormModel(p.model);
    setFormPrice(p.price);
    const specsList = Object.entries(p.specs || {}).map(([key, value]) => ({ key, value: String(value) }));
    setFormSpecs(specsList.length > 0 ? specsList : [{ key: "Capacity", value: "" }]);
    setFormColors((p.colorOptions || []).join(", "));
    setFormImage(p.image || "");
    setFormImages(p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []));
    setFormIsPopular(!!p.isPopular);
    setFormOutOfStock(!!p.outOfStock);
    setFormHidden(!!p.hidden);
    setFormEmiAvailable(p.emiAvailable !== undefined ? !!p.emiAvailable : true);
    setFormMinDownpaymentPercent(p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 30);
    setFormAllowedTenures(p.allowedTenures || [3, 6, 9, 10, 12, 18]);
    setFormCategory(p.category || "Mobile");
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim() || !formModel.trim() || formPrice <= 0) {
      showToast("Please ensure the Brand, Model and Price are valid details.", true);
      return;
    }

    const specsObj: Record<string, string> = {};
    formSpecs.forEach((item) => {
      if (item.key.trim() && item.value.trim()) {
        specsObj[item.key.trim()] = item.value.trim();
      }
    });

    const fallbackImg = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600";
    const resolvedImage = formImages.length > 0 ? formImages[0] : (formImage.trim() || fallbackImg);
    const resolvedImages = formImages.length > 0 ? formImages : [resolvedImage];

    const payload = {
      brand: formBrand.trim(),
      model: formModel.trim(),
      price: Number(formPrice),
      specs: specsObj,
      colorOptions: formColors.split(",").map(c => c.trim()).filter(c => c.length > 0),
      isPopular: formIsPopular,
      outOfStock: formOutOfStock,
      hidden: formHidden,
      image: resolvedImage,
      images: resolvedImages,
      category: formCategory,
      emiAvailable: formEmiAvailable,
      minDownpaymentPercent: Number(formMinDownpaymentPercent),
      allowedTenures: formAllowedTenures
    };

    try {
      const url = formId ? `/api/products/${formId}` : "/api/products";
      const method = formId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(true),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsProductFormOpen(false);
        await fetchProductsList();
        showToast("Database updated successfully!", false);
      } else {
        const err = await res.json();
        showToast(err.error || "Catalog recording failed.", true);
      }
    } catch (err) {
      console.error("Failed submitting store database updates:", err);
      showToast("A hardware connectivity issue has occurred.", true);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });

      if (res.ok) {
        await fetchProductsList();
        showToast(`"${name}" has been permanently deleted from catalog.`, false);
      } else {
        const err = await res.json();
        showToast(err.error || "Product deletion failed.", true);
      }
    } catch (err) {
      console.error("Error deleting catalog item:", err);
      showToast("Database is currently unresponsive.", true);
    } finally {
      setConfirmDeleteProductId(null);
    }
  };

  // Searching filter and sorting logic
  const filteredOrders = orders.filter((o) => {
    const terms = ordersSearch.toLowerCase();
    const matchesSearch = (
      o.customerName.toLowerCase().includes(terms) ||
      o.id.toLowerCase().includes(terms) ||
      o.customerContact.includes(terms) ||
      o.customerAddress.toLowerCase().includes(terms) ||
      o.model.toLowerCase().includes(terms) ||
      o.brand.toLowerCase().includes(terms)
    );
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const matchesBuyType = buyTypeFilter === "All" || o.buyType === buyTypeFilter;
    return matchesSearch && matchesStatus && matchesBuyType;
  }).sort((a, b) => {
    if (!sortField) return 0;

    const valA = a[sortField];
    const valB = b[sortField];

    // Special sort for timestamp/dates
    if (sortField === "timestamp") {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
    }

    // Special sort for numeric values
    if (sortField === "emiTenure" || sortField === "emiMonthly" || sortField === "emiDownpayment") {
      const numA = valA === null ? 0 : Number(valA);
      const numB = valB === null ? 0 : Number(valB);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    // Alphabetic string sort
    const strA = String(valA || "").toLowerCase();
    const strB = String(valB || "").toLowerCase();

    if (strA < strB) return sortDirection === "asc" ? -1 : 1;
    if (strA > strB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const filteredProducts = products.filter((p) => {
    const terms = productsSearch.toLowerCase();
    return (
      p.model.toLowerCase().includes(terms) ||
      p.brand.toLowerCase().includes(terms) ||
      (p.specs?.processor || "").toLowerCase().includes(terms) ||
      (p.specs?.storage || "").toLowerCase().includes(terms)
    );
  });

  // Calculate reservation stats
  const totalBookingsCount = orders.length;
  const emiOrdersCount = orders.filter(o => o.buyType === "EMI").length;
  const totalPendingFinanceEst = orders.reduce((sum, o) => sum + ((o.buyType === "EMI" && (o.status === "Confirmed" || o.status === "Delivered" || o.status === "Paid")) ? o.emiMonthly : 0), 0);
  const newBookingsCount = orders.filter(o => o.status === "New").length;

  // Real-time calculation helpers for Finance view mode
  const getOrderTotal = (o: OrderItem) => {
    if (o.totalPrice) return Number(o.totalPrice);
    if (o.buyType === "EMI") {
      return Number(o.emiDownpayment || 0) + (Number(o.emiMonthly || 0) * (o.emiTenure || 0));
    }
    const match = o.notes.match(/NRs\.\s*([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return 0; 
  };

  const activeOrdersForFinance = orders.filter(o => 
    o.status === "Confirmed" || o.status === "Delivered" || o.status === "Paid"
  );
  const directOrdersForFinance = activeOrdersForFinance.filter(o => o.buyType === "Direct");
  const emiOrdersForFinance = activeOrdersForFinance.filter(o => o.buyType === "EMI");
  const canceledOrdersForFinance = orders.filter(o => o.status === "Canceled");

  // Outright/Direct math:
  const directSoldTotal = directOrdersForFinance.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const directEarned = directOrdersForFinance.reduce((sum, o) => {
    return (o.status === "Paid" || o.status === "Delivered" || o.paymentStatus === "Paid") ? sum + getOrderTotal(o) : sum;
  }, 0);
  const directPending = Math.max(0, directSoldTotal - directEarned);

  // EMI math:
  const emiSoldTotal = emiOrdersForFinance.reduce((sum, o) => sum + getOrderTotal(o), 0);
  const emiEarned = emiOrdersForFinance.reduce((sum, o) => {
    const downpayment = Number(o.emiDownpayment || 0);
    const installmentsCollected = Number(o.emiMonthly || 0) * Number(o.emiPaidMonths || 0);
    return sum + downpayment + installmentsCollected;
  }, 0);
  const emiPending = Math.max(0, emiSoldTotal - emiEarned);

  // Consolidated Math:
  const totalGrossSold = directSoldTotal + emiSoldTotal;
  const totalEarnedToDate = directEarned + emiEarned;
  const totalPendingOutstanding = directPending + emiPending;
  const emiCollectionRate = emiSoldTotal > 0 ? (emiEarned / emiSoldTotal) * 100 : 0;

  return (
    <div id="shopkeeper-spreadsheet-hub" className="py-12 sm:py-16 bg-slate-50 min-h-screen text-left relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-100/30 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-amber-50/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hub Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-black uppercase text-amber-900 bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
              Merchant Admin Management Gateway
            </span>
            <h1 className="font-sans font-black text-2xl sm:text-3xl text-gray-900 tracking-tight mt-3 uppercase">
              Staff Portal Control Panel
            </h1>
            <p className="text-sm font-sans text-gray-400 font-light mt-1">
              Welcome back, <span className="font-semibold text-[#4a0605]">{adminSession.username}</span> ({adminSession.role})
            </p>
          </div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="flex flex-wrap items-center gap-2.5 shadow-sm rounded-xl p-1.5 bg-white border border-gray-200/60 font-mono text-xs backdrop-blur-sm shadow-slate-100/80"
          >
            <span className="px-3 py-1.5 text-gray-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Secure Session
            </span>
            <div className="h-4 w-px bg-gray-200 my-auto"></div>
            <button
              onClick={onLogout}
              className="px-4 py-1.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-lg transform hover:scale-[1.04] active:scale-[0.96] transition-all duration-300 ease-out flex items-center gap-1 cursor-pointer select-none shadow-sm hover:shadow-md"
              title="Close Portal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Cohesive Navigation Tabs bar with dynamic layoutId highlight sliders */}
        <div id="admin-interactive-tab-rail" className="relative flex p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-300/40 mb-10 max-w-full overflow-x-auto no-scrollbar font-sans select-none gap-2 font-medium">
          {(adminSession.role === "Owner" || adminSession.role === "Admin") && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`relative py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
                activeTab === "orders" ? "text-red-950 font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {activeTab === "orders" && (
                <motion.div
                  layoutId="activeAdminTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/80 z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#4a0605]" />
                <span>Reservations RealSheet ({orders.length})</span>
              </span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab("products")}
            className={`relative py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
              activeTab === "products" ? "text-red-950 font-black" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {activeTab === "products" && (
              <motion.div
                layoutId="activeAdminTabBackground"
                className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/80 z-0"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#4a0605]" />
              <span>Catalog Management ({products.length})</span>
            </span>
          </button>

          {adminSession.role === "Owner" && (
            <button
              onClick={() => setActiveTab("reviews")}
              className={`relative py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
                activeTab === "reviews" ? "text-red-950 font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {activeTab === "reviews" && (
                <motion.div
                  layoutId="activeAdminTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/80 z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#4a0605]" />
                <span>Reviews ({reviews.length})</span>
              </span>
            </button>
          )}

          {adminSession.role === "Owner" && (
            <button
              onClick={() => setActiveTab("staff_logs")}
              className={`relative py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
                activeTab === "staff_logs" ? "text-red-950 font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {activeTab === "staff_logs" && (
                <motion.div
                  layoutId="activeAdminTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/80 z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <User className="w-4 h-4 text-[#4a0605]" />
                <span>Staff & Logs ({staffList.length})</span>
              </span>
            </button>
          )}

          {(adminSession.role === "Owner" || adminSession.role === "Admin") && (
            <button
              onClick={() => setActiveTab("chatbot")}
              className={`relative py-3 px-6 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center space-x-2 transition-all duration-300 cursor-pointer ${
                activeTab === "chatbot" ? "text-red-950 font-black" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {activeTab === "chatbot" && (
                <motion.div
                  layoutId="activeAdminTabBackground"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/80 z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#4a0605]" />
                <span>AI Chatbot Settings</span>
              </span>
            </button>
          )}
        </div>

        {/* TAB 1: Live Bookings Sheet */}
        {activeTab === "orders" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Dashboard Stat deck cards with staggered spring entrances */}
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans"
            >
              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 15 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
                }}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/45 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-widest font-mono">Total Reservations</span>
                  <strong className="text-3xl font-black text-slate-900 font-mono block mt-1 tracking-tight">{totalBookingsCount}</strong>
                  <span className="text-[10px] text-blue-500 font-semibold mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Fulfillment backlog
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 text-blue-600 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
              </motion.div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 15 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
                }}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/45 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-widest font-mono">New (Uncontacted)</span>
                  <strong className="text-3xl font-black text-amber-600 font-mono block mt-1 tracking-tight">{newBookingsCount}</strong>
                  <span className="text-[10px] text-amber-500 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Immediate Dial Required
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 text-amber-600 shadow-inner">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
              </motion.div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 15 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
                }}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/45 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-widest font-mono">EMI Ratio</span>
                  <strong className="text-3xl font-black text-purple-600 font-mono block mt-1 tracking-tight">
                    {totalBookingsCount > 0 ? Math.round((emiOrdersCount / totalBookingsCount) * 100) : 0}%
                  </strong>
                  <span className="text-[10px] text-purple-500 font-semibold mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    {emiOrdersCount} bookings on EMI terms
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-purple-50 text-purple-600 shadow-inner">
                  <Sliders className="w-6 h-6" />
                </div>
              </motion.div>

              <motion.div 
                variants={{
                  hidden: { opacity: 0, scale: 0.9, y: 15 },
                  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } }
                }}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/45 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-widest font-mono">Monthly EMI Pipeline</span>
                  <strong className="text-3xl font-black text-rose-700 font-mono block mt-1 tracking-tight">NRs. {totalPendingFinanceEst.toLocaleString()}</strong>
                  <span className="text-[10px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Active finance pipeline
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 text-rose-700 font-mono font-black text-center text-sm shadow-inner flex items-center justify-center min-w-[56px] h-[56px]">
                  Rs
                </div>
              </motion.div>
            </motion.div>

            {/* Live Sheets Container */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col font-sans"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md flex flex-col gap-4">
                {/* Search, Action Buttons and View Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  
                  {/* Left Side: Search + View Switcher */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-xl">
                    <div className="relative flex-grow group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-900 transition-colors">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search reservations..."
                        value={ordersSearch}
                        onChange={(e) => setOrdersSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-900/10 focus:border-red-950/40 transition-all duration-300 placeholder-slate-400"
                      />
                    </div>

                    {/* Fluid View Switcher segment */}
                    <div className="flex bg-slate-200/60 p-1 rounded-xl items-center gap-1.5 self-start sm:self-auto">
                      <button
                        onClick={() => setViewMode("spreadsheet")}
                        className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          viewMode === "spreadsheet" ? "bg-white text-red-950 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-red-900" />
                        <span>RealSheet</span>
                      </button>

                      <button
                        onClick={() => setViewMode("bento")}
                        className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          viewMode === "bento" ? "bg-white text-red-950 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 text-red-900 animate-pulse" />
                        <span>Bento Board</span>
                      </button>

                      <button
                        onClick={() => setViewMode("finance")}
                        className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          viewMode === "finance" ? "bg-white text-emerald-950 shadow-sm font-extrabold" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                        <span>Ledger & EMI</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Sync & Exports */}
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setRefreshTrigger(prev => prev + 1)}
                      className="px-4 py-2.5 text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:text-red-950 rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-red-909 ${loadingOrders ? "animate-spin" : ""}`} />
                      <span>SYNC SPREADSHEET</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={exportToCSV}
                      className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD SPREADSHEET</span>
                    </motion.button>
                  </div>

                </div>

                {/* Sub-Filters Pill Row */}
                <div className="flex flex-wrap items-center gap-y-3 gap-x-6 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar py-1">
                  
                  {/* Status Pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1"><Filter className="w-3 h-3" /> Status:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", "New", "Contacted", "Confirmed", "Canceled"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                            statusFilter === st
                              ? "bg-red-950 border-red-950 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          }`}
                        >
                          {st === "All" ? "All Statuses" : st === "Confirmed" ? "Approved" : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-4 w-px bg-slate-200 hidden md:block"></div>

                  {/* Payment Type Pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Type:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["All", "EMI", "Direct Buy"].map((tp) => (
                        <button
                          key={tp}
                          onClick={() => setBuyTypeFilter(tp)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                            buyTypeFilter === tp
                              ? "bg-[#4a0605] border-[#4a0605] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                          }`}
                        >
                          {tp}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Table */}
              {viewMode === "spreadsheet" && (
              <div className="overflow-x-auto spreadsheet-scroll max-w-full">
                <table className="w-full min-w-[1600px] border-collapse text-left border-b border-gray-150">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 text-[10px] font-mono tracking-widest uppercase border-b border-slate-800 text-center select-none shadow-sm">
                      <th className="w-12 border-r border-slate-800 py-3.5 font-bold">#</th>
                      <th 
                        onClick={() => handleSort("id")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[125px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>ORDER ID</span>
                          {getSortIndicator("id")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("timestamp")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[140px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>DATE</span>
                          {getSortIndicator("timestamp")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("customerName")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[160px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>BUYER NAME</span>
                          {getSortIndicator("customerName")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("customerContact")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[120px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>CONTACT NO</span>
                          {getSortIndicator("customerContact")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("customerAddress")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[220px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>DELIVERY ADDRESS</span>
                          {getSortIndicator("customerAddress")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("brand")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[100px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>BRAND</span>
                          {getSortIndicator("brand")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("model")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[200px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>MODEL</span>
                          {getSortIndicator("model")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("selectedColor")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[120px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>STYLE</span>
                          {getSortIndicator("selectedColor")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("buyType")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[115px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>PAYMENT TYPE</span>
                          {getSortIndicator("buyType")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("emiTenure")}
                        className="p-3 border-r border-slate-800 tracking-widest font-bold min-w-[110px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>TENURE</span>
                          {getSortIndicator("emiTenure")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("emiMonthly")}
                        className="p-3 border-r border-slate-800 tracking-widest text-right min-w-[110px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-end gap-1 py-0.5">
                          <span>MONTHLY EST</span>
                          {getSortIndicator("emiMonthly")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("emiDownpayment")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[110px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>DOWNPAYMENT</span>
                          {getSortIndicator("emiDownpayment")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("status")}
                        className="p-3 border-r border-slate-800 tracking-widest min-w-[155px] cursor-pointer hover:bg-slate-800 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>STATUS</span>
                          {getSortIndicator("status")}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort("notes")}
                        className="p-3 font-mono tracking-widest min-w-[280px] cursor-pointer hover:bg-slate-850 transition-colors group select-none"
                      >
                        <div className="flex items-center justify-center gap-1 py-0.5">
                          <span>ACTION NOTES (Double click to edit)</span>
                          {getSortIndicator("notes")}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="divide-y divide-gray-150">
                    {loadingOrders ? (
                      <tr>
                        <td colSpan={15} className="p-12 text-center text-xs text-gray-400 font-semibold font-mono animate-pulse">
                          Syncing live booking cells from shop backend...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="p-12 text-center text-xs text-gray-400 font-mono uppercase bg-gray-50/20">
                          No matching spreadsheet orders found in database rows.
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence>
                        {filteredOrders.map((order, idx) => {
                          const orderDate = new Date(order.timestamp);
                          const isEditingNotes = editingCellId === order.id;

                          // Get active marker colors
                          const statusDotClass = 
                            order.status === "New" ? "bg-amber-500 animate-ping" :
                            order.status === "Contacted" ? "bg-blue-500" :
                            order.status === "Confirmed" ? "bg-emerald-500 animate-pulse" :
                            order.status === "Delivered" ? "bg-emerald-500" :
                            order.status === "Paid" ? "bg-green-500" :
                            "bg-rose-500";

                          return (
                            <motion.tr 
                              key={order.id} 
                              layoutId={`order-row-${order.id}`}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              transition={{ duration: 0.25, ease: "easeOut", delay: idx * 0.04 }}
                              whileHover={{ 
                                backgroundColor: "rgba(248, 250, 252, 0.9)",
                                scale: 1.002,
                                transition: { duration: 0.12 }
                              }}
                              className={`font-mono text-[11px] text-slate-700 transition-colors border-b border-slate-100 ${
                                order.status === "New" ? "bg-amber-50/20 font-medium" : ""
                              }`}
                            >
                              <td className="bg-slate-50/80 border-r border-slate-200 text-center font-bold text-slate-400 select-none text-[9px] py-3.5">
                                {idx + 1}
                              </td>

                              <td className="p-3 border-r border-slate-100 font-bold text-slate-900 select-all truncate min-w-[125px]">
                                <span className="hover:text-red-950 transition-colors">{order.id}</span>
                              </td>

                              <td className="p-3 border-r border-slate-100 text-slate-400 whitespace-nowrap min-w-[140px]">
                                {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>

                              <td className="p-3 border-r border-slate-100 font-semibold text-slate-800 flex items-center space-x-1.5 whitespace-nowrap min-w-[160px]">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[150px]">{order.customerName}</span>
                              </td>

                              <td className="p-3 border-r border-slate-100 font-bold text-blue-900 whitespace-nowrap min-w-[120px]">
                                <a href={`tel:${order.customerContact}`} className="hover:underline flex items-center space-x-1">
                                  <Phone className="w-3 h-3 text-blue-400" />
                                  <span>{order.customerContact}</span>
                                </a>
                              </td>

                              <td className="p-3 border-r border-slate-100 text-left min-w-[220px] max-w-[300px] truncate" title={order.customerAddress}>
                                <span className="truncate flex items-center space-x-1.5 text-slate-600">
                                  <Home className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{order.customerAddress}</span>
                                </span>
                              </td>

                              <td className="p-3 border-r border-slate-100 text-center font-bold text-xs whitespace-nowrap min-w-[100px]">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase ${
                                  order.brand === "Samsung" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                  order.brand === "Apple" ? "bg-slate-950 text-yellow-100 border border-slate-900" :
                                  order.brand === "Xiaomi" ? "bg-orange-50 text-orange-700 border border-orange-100" : "bg-red-50 text-red-900 border border-red-100"
                                }`}>
                                  {order.brand}
                                </span>
                              </td>

                              <td className="p-3 border-r border-slate-100 font-bold text-slate-900 truncate min-w-[200px] max-w-[250px]" title={order.model}>
                                {order.model}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-left text-slate-500 truncate min-w-[120px] max-w-[160px]">
                                {order.selectedColor}
                              </td>

                              <td className="p-3 border-r border-slate-100 text-center whitespace-nowrap min-w-[115px]">
                                <span 
                                  onClick={() => {
                                    if (order.buyType === "EMI") setSelectedEmiOrderForReminders(order);
                                  }}
                                  title={order.buyType === "EMI" ? "Click to view monthly EMI reminders & schedule" : undefined}
                                  className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider transition-all select-none ${
                                    order.buyType === "EMI" ? "bg-purple-50 hover:bg-purple-100 hover:text-purple-900 border border-purple-200 cursor-pointer shadow-xs" : "bg-slate-50 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {order.buyType.toUpperCase()}
                                </span>
                              </td>

                              <td className="p-3 border-r border-slate-100 text-center font-semibold text-slate-500 whitespace-nowrap min-w-[110px]">
                                {order.buyType === "EMI" ? `${order.emiTenure} Months` : "Direct Buy"}
                              </td>

                              <td className="p-3 border-r border-slate-100 font-black text-right pr-3 text-slate-900 whitespace-nowrap min-w-[110px]">
                                {order.buyType === "EMI" ? `NRs. ${order.emiMonthly?.toLocaleString()}` : "N/A"}
                              </td>

                              <td className="p-3 border-r border-slate-100 font-medium text-right pr-3 text-slate-400 whitespace-nowrap min-w-[110px]">
                                {order.buyType === "EMI" ? `NRs. ${order.emiDownpayment?.toLocaleString()}` : "N/A"}
                              </td>

                              <td className="p-2 border-r border-slate-100 text-center min-w-[170px]">
                                <div className="flex items-center space-x-1.5 px-1">
                                  <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotClass}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotClass.replace("animate-ping", "").replace("animate-pulse", "")}`}></span>
                                  </span>
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className={`p-1.5 text-[10px] font-black uppercase rounded-lg border focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer w-full text-center transition-all ${
                                      order.status === "New" ? "bg-amber-50 text-amber-900 border-amber-200/60" :
                                      order.status === "Contacted" ? "bg-blue-50 text-blue-700 border-blue-200/60" :
                                      order.status === "Confirmed" ? "bg-emerald-50 text-emerald-950 border-emerald-200/60" :
                                      order.status === "Delivered" ? "bg-emerald-50 text-emerald-800 border-emerald-200/60" :
                                      order.status === "Paid" ? "bg-green-100 text-green-800 border-green-200" :
                                      "bg-rose-50 text-rose-800 border-rose-200/60"
                                    }`}
                                  >
                                    <option value="New">● NEW ORDER</option>
                                    <option value="Contacted">● CONTACTED</option>
                                    <option value="Confirmed">✓ CONFIRMED / APPROVED</option>
                                    <option value="Canceled">✕ CANCELED</option>
                                  </select>
                                </div>
                              </td>

                              {/* Remarks Column with inline double click trigger */}
                              <td className="p-2 text-left select-text relative min-w-[280px]">
                                {isEditingNotes ? (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center space-x-1.5 w-full bg-amber-50/50 p-1 rounded-xl border border-amber-200 shadow-inner"
                                  >
                                    <input
                                      type="text"
                                      value={tempNotes}
                                      onChange={(e) => setTempNotes(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveNotesCell(order.id);
                                        if (e.key === "Escape") setEditingCellId(null);
                                      }}
                                      className="w-full bg-white border border-amber-300 text-[11px] py-1 px-2 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
                                      placeholder="Enter to Save, Esc to cancel"
                                      autoFocus
                                    />
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => saveNotesCell(order.id)}
                                      className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center shadow"
                                    >
                                      <Check className="w-3.5 h-3.5 font-bold" />
                                    </motion.button>
                                  </motion.div>
                                ) : (
                                  <div 
                                    onDoubleClick={() => {
                                      setEditingCellId(order.id);
                                      setTempNotes(order.notes || "");
                                    }}
                                    className="w-full text-xs text-slate-500 truncate max-w-[270px] cursor-text min-h-[1.5rem] flex items-center justify-between group py-1.5 px-2 hover:bg-slate-100/80 rounded-lg transition-all"
                                    title="Double click cell to edit remarks"
                                  >
                                    <span className="truncate italic flex-grow text-left text-slate-400">
                                      {order.notes || "Double-click to write notes..."}
                                    </span>
                                    <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 flex-shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                              </td>

                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
              )}

              {/* Option 4 Bento kanban board view container */}
              {viewMode === "bento" && (
                <div className="overflow-x-auto pb-6 bg-slate-50/40 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 min-w-[1080px] xl:min-w-0">
                    {[
                      { id: "new", title: "New Bookings", statuses: ["New"], dotClass: "bg-amber-500 shadow-sm shadow-amber-500/20" },
                      { id: "contacted", title: "In-Contact", statuses: ["Contacted"], dotClass: "bg-blue-500 shadow-sm shadow-blue-500/20" },
                      { id: "confirmed", title: "Approved", statuses: ["Confirmed"], dotClass: "bg-emerald-500 shadow-sm shadow-emerald-500/20" },
                      { id: "canceled", title: "Canceled", statuses: ["Canceled"], dotClass: "bg-slate-400 shadow-sm shadow-slate-400/20" }
                    ].map((lane) => {
                      const laneOrders = filteredOrders.filter(o => lane.statuses.includes(o.status));
                      return (
                        <div 
                          key={lane.id} 
                          className="flex flex-col bg-slate-100/60 border border-slate-200/50 rounded-2xl p-4 min-h-[450px]"
                        >
                          {/* Lane Header */}
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/40 select-none">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${lane.dotClass}`}></span>
                              <span className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">{lane.title}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 font-mono">
                              {laneOrders.length}
                            </span>
                          </div>

                          {/* Cards Stack */}
                          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[1450px] no-scrollbar flex-grow pb-4">
                            {laneOrders.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 opacity-40 text-center flex-grow">
                                <Package className="w-8 h-8 text-slate-400 stroke-1" />
                                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mt-2">Zero bookings</span>
                              </div>
                            ) : (
                              laneOrders.map((order) => {
                                const orderDate = new Date(order.timestamp);
                                return (
                                  <motion.div
                                    key={order.id}
                                    layoutId={`kanban-card-${order.id}`}
                                    whileHover={{ y: -3, scale: 1.015, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                                    className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm flex flex-col gap-3 relative overflow-hidden group font-sans shrink-0"
                                  >
                                    {/* Brand background accent lines */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                                      order.brand === "Samsung" ? "bg-blue-500" :
                                      order.brand === "Apple" ? "bg-slate-950" :
                                      order.brand === "Xiaomi" ? "bg-orange-500" : "bg-red-650"
                                    }`}></div>

                                    <div className="flex items-start justify-between min-w-0">
                                      <div className="min-w-0 flex-grow">
                                        <span className="block text-[10px] font-mono text-slate-400 font-semibold truncate hover:text-red-955 select-all" title={order.id}>
                                          {order.id.slice(0, 16)}...
                                        </span>
                                        <h4 className="text-xs font-black text-slate-800 font-sans mt-0.5 truncate flex items-center gap-1">
                                          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                          <span className="truncate">{order.customerName}</span>
                                        </h4>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase flex-shrink-0 ml-1.5 ${
                                        order.brand === "Samsung" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                                        order.brand === "Apple" ? "bg-slate-950 text-yellow-100 border border-slate-900" :
                                        order.brand === "Xiaomi" ? "bg-orange-50 text-orange-750 border border-orange-100" : "bg-red-50 text-red-900 border border-red-100"
                                      }`}>
                                        {order.brand}
                                      </span>
                                    </div>

                                    <div className="text-[11px] text-slate-600 font-sans bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                                      <div className="font-bold text-slate-800 line-clamp-1" title={order.model}>
                                        {order.model}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center justify-between">
                                        <span>Color: {order.selectedColor}</span>
                                        <span className="font-bold text-slate-500">{orderDate.toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>
                                      </div>
                                    </div>

                                    {/* Booking finance status */}
                                    <div className="flex items-center justify-between text-[10px] font-mono select-none">
                                      <div className="flex items-center gap-1">
                                        <span 
                                          onClick={() => {
                                            if (order.buyType === "EMI") setSelectedEmiOrderForReminders(order);
                                          }}
                                          title={order.buyType === "EMI" ? "Click to view monthly EMI reminders & schedule" : undefined}
                                          className={`px-2 py-0.5 rounded-full font-bold uppercase transition-all select-none cursor-pointer ${
                                            order.buyType === "EMI" ? "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100" : "bg-slate-50 text-slate-600 border border-slate-200"
                                          }`}
                                        >
                                          {order.buyType}
                                        </span>
                                        {order.buyType === "EMI" && (
                                          <button
                                            onClick={() => setSelectedEmiOrderForReminders(order)}
                                            title="View EMI Reminders Schedule"
                                            className="p-1 bg-red-950/5 text-red-950 hover:bg-red-950 hover:text-white rounded-lg transition-all border border-red-950/10 cursor-pointer flex items-center justify-center shadow-xs"
                                          >
                                            <Bell className="w-2.5 h-2.5 text-amber-600" />
                                          </button>
                                        )}
                                      </div>
                                      {order.buyType === "EMI" ? (
                                        <div className="text-right">
                                          <span className="font-black text-slate-900 block">NRs. {order.emiMonthly?.toLocaleString()}/mo</span>
                                          <span className="text-[9px] text-slate-400 block font-medium">{order.emiTenure}m tenure</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic font-sans text-[9px]">Full Payment</span>
                                      )}
                                    </div>

                                    <div className="text-[10px] text-slate-600 bg-blue-50/20 p-2 rounded-lg border border-blue-100/40 flex flex-col gap-1 select-all font-sans">
                                      <a href={`tel:${order.customerContact}`} className="hover:underline flex items-center gap-1.5 font-bold text-blue-900">
                                        <Phone className="w-3 h-3 text-blue-400" />
                                        <span>{order.customerContact}</span>
                                      </a>
                                      <div className="text-[9.5px] text-slate-500 font-medium line-clamp-1 flex items-center gap-1.5">
                                        <Home className="w-3 h-3 text-slate-350 flex-shrink-0" />
                                        <span className="truncate" title={order.customerAddress}>{order.customerAddress}</span>
                                      </div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                                      {/* Click notes widget */}
                                      {editingCellId === order.id ? (
                                        <div className="flex items-center gap-1.5 bg-amber-50/50 p-1 rounded-lg border border-amber-200">
                                          <input
                                            type="text"
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") saveNotesCell(order.id);
                                              if (e.key === "Escape") setEditingCellId(null);
                                            }}
                                            className="w-full bg-white border border-amber-300 text-[10px] py-1 px-1.5 rounded font-mono focus:outline-none"
                                            placeholder="Esc to cancel"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => saveNotesCell(order.id)}
                                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5 font-bold" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div 
                                          onClick={() => {
                                            setEditingCellId(order.id);
                                            setTempNotes(order.notes || "");
                                          }}
                                          className="text-[10px] text-slate-400 italic bg-slate-50/60 p-1.5 rounded hover:bg-slate-100/80 transition-colors cursor-pointer truncate max-w-full flex items-center justify-between group"
                                          title="Click to write remarks"
                                        >
                                          <span className="truncate">{order.notes || "Write status notes..."}</span>
                                          <Edit3 className="w-3 h-3 text-slate-350 group-hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      )}

                                      {/* Fast promotable action buttons */}
                                      <div className="flex items-center gap-1.5 mt-1 select-none">
                                        <select
                                          value={order.status}
                                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                          className={`p-1.5 text-[9px] font-black uppercase rounded-lg border focus:outline-none cursor-pointer flex-grow text-center transition-all ${
                                            order.status === "New" ? "bg-amber-50 text-amber-900 border-amber-200" :
                                            order.status === "Contacted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                            order.status === "Confirmed" ? "bg-emerald-50 text-emerald-950 border-emerald-200" :
                                            order.status === "Delivered" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                            order.status === "Paid" ? "bg-green-105 text-green-800 border-green-200" :
                                            "bg-rose-50 text-rose-800 border-rose-200"
                                          }`}
                                        >
                                          <option value="New">● NEW ORDER</option>
                                          <option value="Contacted">● CONTACTED</option>
                                          <option value="Confirmed">✓ CONFIRMED</option>
                                          <option value="Canceled">✕ CANCELED</option>
                                        </select>

                                        {/* Promote to helper state action */}
                                        {order.status !== "Confirmed" && order.status !== "Canceled" && (
                                          <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                              const nextStatusMap: Record<string, string> = {
                                                "New": "Contacted",
                                                "Contacted": "Confirmed"
                                              };
                                              const next = nextStatusMap[order.status];
                                              if (next) handleStatusChange(order.id, next);
                                            }}
                                            title={`Promote reservation to ${
                                              order.status === "New" ? "Contacted" : "Confirmed (Approved)"
                                            }`}
                                            className="p-1.5 bg-red-950 hover:bg-black text-white rounded-lg cursor-pointer flex items-center justify-center font-bold"
                                          >
                                            <ArrowRight className="w-3.5 h-3.5 font-black" />
                                          </motion.button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Finance & EMI Ledger Dashboard View */}
              {viewMode === "finance" && (
                <div className="bg-slate-50/50 p-6 flex flex-col gap-6 border-t border-slate-100 animate-fadeIn">
                  
                  {/* Financial KPI Summary Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Tile 1: Total Sold Value */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block font-mono">Gross Sales Booked</span>
                        <span className="text-xl font-black text-slate-900 block font-mono">NRs. {totalGrossSold.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-slate-500 block">
                          Direct: NRs. {directSoldTotal.toLocaleString()} | EMI: NRs. {emiSoldTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Tile 2: Total Collected */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 block font-mono">Total Cash Collected</span>
                        <span className="text-xl font-black text-emerald-700 block font-mono">NRs. {totalEarnedToDate.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-emerald-600/80 block">
                          Direct Paid: NRs. {directEarned.toLocaleString()} | EMI Paid: NRs. {emiEarned.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Tile 3: Total Pending */}
                    <div className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-sm flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 block font-mono">Outstanding Receivable</span>
                        <span className="text-xl font-black text-amber-700 block font-mono">NRs. {totalPendingOutstanding.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-amber-600/80 block">
                          Direct Rem: NRs. {directPending.toLocaleString()} | EMI Rem: NRs. {emiPending.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50/70 text-amber-600 rounded-xl">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Tile 4: Success Rate */}
                    <div className="bg-white p-5 rounded-2xl border border-purple-200/60 shadow-sm flex items-center justify-between">
                      <div className="space-y-1 w-full max-w-[180px]">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 block font-mono">EMI Collection Efficiency</span>
                        <span className="text-xl font-black text-purple-700 block font-mono">{emiCollectionRate.toFixed(1)}%</span>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 font-mono">
                          <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${emiCollectionRate}%` }}></div>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Award className="w-5 h-5" />
                      </div>
                    </div>

                  </div>

                  {/* Sub-Tabs Selector */}
                  <div className="flex bg-slate-200/40 p-1 rounded-xl self-start gap-1">
                    <button
                      onClick={() => setFinanceSubTab("emi")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        financeSubTab === "emi" ? "bg-white text-red-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#4a0605]" />
                      <span>Active EMI Portfolios ({emiOrdersForFinance.length})</span>
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("direct")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        financeSubTab === "direct" ? "bg-white text-red-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Direct Buy Billings ({directOrdersForFinance.length})</span>
                    </button>
                    <button
                      onClick={() => setFinanceSubTab("canceled")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        financeSubTab === "canceled" ? "bg-white text-red-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Canceled Orders ({canceledOrdersForFinance.length})</span>
                    </button>
                  </div>

                  {/* Sub-Tab content table */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    
                    {financeSubTab === "emi" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                              <th className="p-4">Customer Details</th>
                              <th className="p-4">Product Details</th>
                              <th className="p-4">Total Price</th>
                              <th className="p-4">Downpayment</th>
                              <th className="p-4">Monthly Instalment</th>
                              <th className="p-4">Installments Paid progress</th>
                              <th className="p-4">Total Collected</th>
                              <th className="p-4">Total Remaining</th>
                              <th className="p-4 text-center">
                                <span className="inline-flex items-center gap-1">
                                  <span>EMI Reminders</span>
                                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                              </th>
                              <th className="p-4 text-center">Actions</th>
                              <th className="p-4 text-center">Delivery Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emiOrdersForFinance.length === 0 ? (
                              <tr>
                                <td colSpan={11} className="p-12 text-center text-slate-400 italic">
                                  No active EMI booking portfolios recorded.
                                </td>
                              </tr>
                            ) : (
                              emiOrdersForFinance.map((order) => {
                                const totalVal = getOrderTotal(order);
                                const paidMonths = order.emiPaidMonths || 0;
                                const tenure = order.emiTenure || 1;
                                const pct = Math.min(100, Math.max(0, (paidMonths / tenure) * 100));
                                const totalPaid = Number(order.emiDownpayment || 0) + (Number(order.emiMonthly || 0) * paidMonths);
                                const totalRem = Math.max(0, totalVal - totalPaid);
                                const isPaidEMI = paidMonths === tenure;

                                return (
                                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800 text-xs">{order.customerName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customerContact}</div>
                                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={order.customerAddress}>{order.customerAddress}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800">{order.model}</div>
                                      <div className="text-[10px] text-slate-400">{order.brand} ({order.selectedColor})</div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-700">
                                      NRs. {totalVal.toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-slate-500">
                                      NRs. {Number(order.emiDownpayment || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-slate-600 font-semibold">
                                      NRs. {Number(order.emiMonthly || 0).toLocaleString()}/mo
                                    </td>
                                    <td className="p-4 w-[180px]">
                                      <div className="flex items-center gap-2 select-none">
                                        <button
                                          disabled={paidMonths <= 0}
                                          onClick={() => handleFinanceUpdate(order.id, { emiPaidMonths: Math.max(0, paidMonths - 1) })}
                                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs transition-colors disabled:opacity-40 cursor-pointer"
                                        >
                                          -
                                        </button>
                                        <span className="font-mono font-bold text-slate-800 text-[11px] min-w-[35px] text-center">
                                          {paidMonths} / {tenure}
                                        </span>
                                        <button
                                          disabled={paidMonths >= tenure}
                                          onClick={() => {
                                            const nextPaid = Math.min(tenure, paidMonths + 1);
                                            const updates: Partial<OrderItem> = { emiPaidMonths: nextPaid };
                                            if (nextPaid === tenure) {
                                              updates.paymentStatus = "Paid";
                                            }
                                            handleFinanceUpdate(order.id, updates);
                                          }}
                                          className="w-5 h-5 rounded bg-red-900 hover:bg-black text-white flex items-center justify-center font-black text-xs transition-colors disabled:opacity-40 cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                      </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-emerald-600">
                                      NRs. {totalPaid.toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-amber-600 font-semibold">
                                      NRs. {totalRem.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center select-none">
                                      <button
                                        onClick={() => setSelectedEmiOrderForReminders(order)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/5 text-red-950 hover:bg-[#4a0605] hover:text-white rounded-lg text-[10px] font-bold transition-all border border-red-950/10 cursor-pointer shadow-xs hover:shadow-sm"
                                      >
                                        <Bell className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                        <span>Schedule & Remind</span>
                                      </button>
                                    </td>
                                    <td className="p-4 text-center">
                                      {pct === 100 ? (
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-black tracking-wider uppercase text-[9px] px-2 py-1 rounded-lg">
                                          <Check className="w-3 h-3" /> Fully Paid
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            const updates: Partial<OrderItem> = { emiPaidMonths: tenure, paymentStatus: "Paid" };
                                            handleFinanceUpdate(order.id, updates);
                                          }}
                                          className="px-2 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-200 rounded text-[9px] font-bold text-slate-600 transition-colors cursor-pointer"
                                        >
                                          Clear All
                                        </button>
                                      )}
                                    </td>
                                    <td className="p-4 text-center select-none">
                                      <button
                                        onClick={() => {
                                          const isDel = order.deliveryStatus === "Delivered" || order.status === "Delivered" || order.status === "Paid";
                                          const updates: Partial<OrderItem> = {
                                            deliveryStatus: isDel ? "Not Delivered" : "Delivered"
                                          };
                                          handleFinanceUpdate(order.id, updates);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border font-mono cursor-pointer min-w-[110px] text-center ${
                                          (order.deliveryStatus === "Delivered" || order.status === "Delivered" || order.status === "Paid")
                                            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                            : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                                        }`}
                                      >
                                        {(order.deliveryStatus === "Delivered" || order.status === "Delivered" || order.status === "Paid") ? "Delivered" : "Not Delivered"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {financeSubTab === "direct" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                              <th className="p-4">Customer Details</th>
                              <th className="p-4">Product Details</th>
                              <th className="p-4">Total Amount</th>
                              <th className="p-4">Order Status</th>
                              <th className="p-4">Payment Status</th>
                              <th className="p-4">Collection Date</th>
                              <th className="p-4 text-center">Actions</th>
                              <th className="p-4 text-center">Delivery Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {directOrdersForFinance.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                  No active Direct booking entries.
                                </td>
                              </tr>
                            ) : (
                              directOrdersForFinance.map((order) => {
                                const totalVal = getOrderTotal(order);
                                const isPaid = order.status === "Paid" || order.paymentStatus === "Paid";
                                const isDelivered = order.deliveryStatus === "Delivered" || order.status === "Delivered" || order.status === "Paid";

                                return (
                                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800 text-xs">{order.customerName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customerContact}</div>
                                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={order.customerAddress}>{order.customerAddress}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800">{order.model}</div>
                                      <div className="text-[10px] text-slate-400">{order.brand} ({order.selectedColor})</div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-700">
                                      NRs. {totalVal.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${
                                        order.status === "New" ? "bg-amber-100 text-amber-800" :
                                        order.status === "Contacted" ? "bg-blue-100 text-blue-800" :
                                        order.status === "Confirmed" ? "bg-emerald-100 text-emerald-800" :
                                        order.status === "Delivered" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                                      }`}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest ${
                                        isPaid ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800 animate-pulse"
                                      }`}>
                                        {isPaid ? "Paid" : "Pending"}
                                      </span>
                                    </td>
                                    <td className="p-4 text-slate-400 font-mono select-none">
                                      {new Date(order.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                      <button
                                        onClick={() => {
                                          const updates: Partial<OrderItem> = {
                                            paymentStatus: isPaid ? "Pending" : "Paid"
                                          };
                                          handleFinanceUpdate(order.id, updates);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                          isPaid 
                                            ? "bg-slate-50 hover:bg-rose-50 text-slate-600 border-slate-200 hover:border-rose-200" 
                                            : "bg-emerald-600 hover:bg-black text-white border-transparent"
                                        }`}
                                      >
                                        {isPaid ? "Mark Unpaid" : "Mark Paid"}
                                      </button>
                                    </td>
                                    <td className="p-4 text-center select-none">
                                      <button
                                        onClick={() => {
                                          const updates: Partial<OrderItem> = {
                                            deliveryStatus: isDelivered ? "Not Delivered" : "Delivered"
                                          };
                                          handleFinanceUpdate(order.id, updates);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border font-mono cursor-pointer min-w-[110px] text-center ${
                                          isDelivered
                                            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                            : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                                        }`}
                                      >
                                        {isDelivered ? "Delivered" : "Not Delivered"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {financeSubTab === "canceled" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
                              <th className="p-4">Customer Details</th>
                              <th className="p-4">Product Details</th>
                              <th className="p-4">Total Amount</th>
                              <th className="p-4">Buy Type</th>
                              <th className="p-4">Canceled Date</th>
                              <th className="p-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {canceledOrdersForFinance.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                  No canceled orders recorded.
                                </td>
                              </tr>
                            ) : (
                              canceledOrdersForFinance.map((order) => {
                                const totalVal = getOrderTotal(order);
                                return (
                                  <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800 text-xs">{order.customerName}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{order.customerContact}</div>
                                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-0.5" title={order.customerAddress}>{order.customerAddress}</div>
                                    </td>
                                    <td className="p-4">
                                      <div className="font-bold text-slate-800">{order.model}</div>
                                      <div className="text-[10px] text-slate-400">{order.brand} ({order.selectedColor})</div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-700">
                                      NRs. {totalVal.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono uppercase ${
                                        order.buyType === "EMI" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                                      }`}>
                                        {order.buyType}
                                      </span>
                                    </td>
                                    <td className="p-4 text-slate-400 font-mono select-none">
                                      {new Date(order.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                      <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold uppercase text-[9px] px-2.5 py-1.5 rounded-lg">
                                        ✕ Canceled
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>

                </div>
              )}

              <div className="bg-gray-100 border-t border-gray-200 p-2 text-[10.5px] text-gray-400 font-mono flex items-center justify-between select-none">
                {/* <span>Spreadsheet Grid: 14 Columns x {filteredOrders.length} active database entries. Realtime pipeline enabled.</span> */}
                <span className="font-bold text-[#4a0605]">Store Owner: Prakash Adhikari</span>
              </div>
            </motion.div>

          </div>
        )}
         {/* TAB 2: Appliance & Product Store Catalog Editor */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Catalog Statistics summary block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Registered Catalog Products</span>
                  <strong className="text-2xl font-black text-[#4a0605] font-mono block mt-1">{products.length} Models</strong>
                </div>
                <div className="p-3 bg-red-50 text-[#4a0605] rounded-full">
                  <Sliders className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Bestselling Display Products</span>
                  <strong className="text-2xl font-black text-amber-600 font-mono block mt-1">
                    {products.filter(p => p.isPopular).length} models
                  </strong>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Catalog Grid Toolbar & List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-205 overflow-hidden flex flex-col font-sans">
              
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search brand, model, specs..."
                    value={productsSearch}
                    onChange={(e) => setProductsSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchProductsList}
                    className="p-2 bg-white text-gray-500 hover:text-black rounded border border-gray-200 hover:bg-gray-50 shadow-sm cursor-pointer"
                    title="Refresh list"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} />
                  </button>

                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 bg-[#4a0605] hover:bg-[#5f0a09] text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1 transition-all shadow-md shadow-[#4a0605]/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD</span>
                  </button>
                </div>
              </div>

              {/* Product Grid Table */}
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-[1100px] border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-100 text-gray-400 text-[10px] font-mono border-b border-gray-200 uppercase tracking-widest select-none">
                      <th className="p-3 w-16 text-center">Media</th>
                      <th className="p-3 w-28">Brand</th>
                      <th className="p-3 w-48">Model Name</th>
                      <th className="p-3 w-36">Base Retail Price</th>
                      <th className="p-3">Core Specifications Summary</th>
                      <th className="p-3 w-48">Color Variants</th>
                      <th className="p-3 w-28 text-center">Flag</th>
                      <th className="p-3 w-32 text-center">Out of Stock?</th>
                      <th className="p-3 w-28 text-center">Hidden?</th>
                      <th className="p-3 w-28 text-center">Manage</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-150 font-sans text-xs text-gray-700">
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={10} className="p-16 text-center text-gray-400 font-semibold font-mono animate-pulse">
                          Syncing active store inventory...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-16 text-center text-gray-400 italic">
                          No appliance models match current keywords. Click &quot;Add&quot; to introduce a new item.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id || p.model} className="hover:bg-gray-50/50 transition-colors">
                          {/* Image preview */}
                          <td className="p-3 text-center">
                            <div className="w-10 h-10 bg-gray-50 border border-gray-150 rounded overflow-hidden flex items-center justify-center select-none shadow-sm">
                              {p.image ? (
                                <img 
                                  src={p.image} 
                                  alt={p.model}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-img');
                                    if (fallback) fallback.classList.remove('hidden');
                                  }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : null}
                              <div className={`fallback-img ${p.image ? 'hidden' : ''} text-[#4a0605] flex items-center justify-center`}>
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </td>

                          {/* Brand */}
                          <td className="p-3 font-bold text-gray-900 uppercase tracking-wider font-mono text-[11px]">
                            {p.brand}
                          </td>

                          {/* Model */}
                          <td className="p-3">
                            <div className="font-bold text-gray-900 text-sm">{p.model}</div>
                            {p.category && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-150 rounded text-[9px] font-bold uppercase tracking-wider leading-none font-mono">
                                {p.category}
                              </span>
                            )}
                          </td>

                          {/* Price */}
                          <td className="p-3 font-mono font-bold text-[#4a0605] text-[13px]">
                            NRs. {p.price.toLocaleString()}
                          </td>

                          {/* Specs */}
                          <td className="p-3 text-gray-500">
                            <div className="space-y-0.5 text-[10.5px]">
                              {Object.entries(p.specs || {}).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-gray-400 font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Colors */}
                          <td className="p-3 text-[10.5px] max-w-[150px] truncate" title={(p.colorOptions || []).join(", ")}>
                            <div className="flex flex-wrap gap-1">
                              {(p.colorOptions || []).map((col) => (
                                <span key={col} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9.5px] border border-gray-200/50">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Popular flag */}
                          <td className="p-3 text-center flex flex-col items-center justify-center space-y-1">
                            <div>
                              {p.isPopular ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-yellow-400 text-amber-950 rounded text-[9.5px] font-bold uppercase tracking-wider shadow-sm select-none">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>Bestseller</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-[9.5px] uppercase select-none">
                                  Regular
                                </span>
                              )}
                            </div>
                            <div>
                              {p.emiAvailable !== false ? (
                                <span className="inline-flex flex-col items-center bg-green-50 text-green-700 border border-green-200 pl-1.5 pr-1.5 py-0.5 rounded text-[9px] select-none text-center leading-none">
                                  <span className="font-bold uppercase tracking-wider">EMI: {p.minDownpaymentPercent || 30}% Min</span>
                                  <span className="text-[8px] opacity-75 mt-0.5 font-mono">[{ (p.allowedTenures || [3, 6, 9, 10, 12, 18]).join(",") }m]</span>
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 bg-red-50 text-red-650 border border-red-150 rounded text-[9px] uppercase select-none font-bold leading-none tracking-wider font-sans">
                                  No EMI
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Out of Stock Checkbox */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                id={`out-of-stock-checkbox-${p.id}`}
                                checked={!!p.outOfStock}
                                onChange={async (e) => {
                                  const newStatus = e.target.checked;
                                  try {
                                    const res = await fetch(`/api/products/${p.id}`, {
                                      method: "PUT",
                                      headers: getHeaders(true),
                                      body: JSON.stringify({ outOfStock: newStatus })
                                    });
                                    if (res.ok) {
                                      setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, outOfStock: newStatus } : prod));
                                      showToast(`Stock status successfully updated for "${p.model}".`, false);
                                    } else {
                                      showToast("Failed to update stock status.", true);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    showToast("Network error updating stock status.", true);
                                  }
                                }}
                                className="w-4.5 h-4.5 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer transition-all"
                              />
                            </div>
                          </td>

                          {/* Hidden Toggle Button */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={async () => {
                                  const newHiddenStatus = !p.hidden;
                                  try {
                                    const res = await fetch(`/api/products/${p.id}`, {
                                      method: "PUT",
                                      headers: getHeaders(true),
                                      body: JSON.stringify({ hidden: newHiddenStatus })
                                    });
                                    if (res.ok) {
                                      setProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, hidden: newHiddenStatus } : prod));
                                      showToast(`Visibility status updated for "${p.model}".`, false);
                                    } else {
                                      showToast("Failed to update visibility status.", true);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    showToast("Network error updating visibility status.", true);
                                  }
                                }}
                                className={`p-1.5 rounded border transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold ${
                                  p.hidden
                                    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                    : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                }`}
                                title={p.hidden ? "Unhide this product (invisible to customers)" : "Hide this product (visible to customers)"}
                              >
                                {p.hidden ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Hidden</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Visible</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                              {confirmDeleteProductId === p.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded p-1 animate-fadeIn select-none">
                                  <span className="text-[10px] font-bold text-red-700 uppercase font-mono px-1">Retire?</span>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id || "", p.model)}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleOpenEditProduct(p)}
                                    className="p-1.5 bg-gray-100 hover:bg-yellow-500 hover:text-black rounded border border-gray-200 transition-colors cursor-pointer"
                                    title="Edit product details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setConfirmDeleteProductId(p.id || "")}
                                    className="p-1.5 bg-gray-100 hover:bg-red-800 hover:text-white rounded border border-gray-200 transition-colors cursor-pointer"
                                    title="Delete product from store catalog"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Customer Reviews Management Panel */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Reviews Statistics blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Total Reviews Received</span>
                  <strong className="text-2xl font-black text-[#4a0605] font-mono block mt-1">{reviews.length}</strong>
                </div>
                <div className="p-3 bg-red-50 text-[#4a0605] rounded-full">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Average Rating Star Count</span>
                  <strong className="text-2xl font-black text-amber-600 font-mono block mt-1">
                    {reviews.length > 0 
                      ? (reviews.reduce((acc, r) => acc + Number(r.stars), 0) / reviews.length).toFixed(1) 
                      : "0.0"} / 5.0
                  </strong>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5 flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Hidden / Moderated Reviews</span>
                  <strong className="text-2xl font-black text-gray-700 font-mono block mt-1">
                    {reviews.filter(r => r.hidden).length} reviews
                  </strong>
                </div>
                <div className="p-3 bg-gray-100 text-gray-600 rounded-full">
                  <EyeOff className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search reviews by name, location, or comment text..."
                  value={reviewsSearch}
                  onChange={(e) => setReviewsSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-255 rounded-lg text-xs font-sans text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#4a0605] focus:bg-white"
                />
              </div>
              <div className="text-xs font-mono text-gray-400 w-full sm:w-auto text-right">
                Showing <strong>{reviews.filter(r => {
                  const term = reviewsSearch.toLowerCase();
                  return (
                    (r.name || "").toLowerCase().includes(term) ||
                    (r.location || "").toLowerCase().includes(term) ||
                    (r.content || "").toLowerCase().includes(term)
                  );
                }).length}</strong> of {reviews.length} entries
              </div>
            </div>

            {/* Interactive Reviews list spreadsheet */}
            <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm overflow-hidden">
              {loadingReviews ? (
                <div className="py-12 text-center text-xs font-mono text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
                  <span>Loading reviews ledger...</span>
                </div>
              ) : reviews.filter(r => {
                const term = reviewsSearch.toLowerCase();
                return (
                  (r.name || "").toLowerCase().includes(term) ||
                  (r.location || "").toLowerCase().includes(term) ||
                  (r.content || "").toLowerCase().includes(term)
                );
              }).length === 0 ? (
                <div className="py-16 text-center text-sm font-sans text-gray-400">
                  No reviews match your filter parameters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Reviewer Details</th>
                        <th className="py-3 px-4">Rating Given</th>
                        <th className="py-3 px-4">Date Submittted</th>
                        <th className="py-3 px-4 w-2/5">Review Comments</th>
                        <th className="py-3 px-4 text-center">Status Visibility</th>
                        <th className="py-3 px-4 text-center">Admin Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reviews.filter(r => {
                        const term = reviewsSearch.toLowerCase();
                        return (
                          (r.name || "").toLowerCase().includes(term) ||
                          (r.location || "").toLowerCase().includes(term) ||
                          (r.content || "").toLowerCase().includes(term)
                        );
                      }).map((rev) => (
                        <tr 
                          key={rev.id} 
                          className={`hover:bg-gray-50/50 transition-colors ${rev.hidden ? "bg-gray-50/30 opacity-75" : ""}`}
                        >
                          {/* Reviewer Name & Location */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">{rev.name}</div>
                            <div className="text-[10px] text-gray-400 font-light mt-0.5">{rev.location || "N/A"}</div>
                          </td>
                          
                          {/* Star Rating count */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${
                                    i < Number(rev.stars) 
                                      ? "fill-amber-400 text-amber-400" 
                                      : "text-gray-200"
                                  }`} 
                                />
                              ))}
                              <span className="text-[10px] font-mono font-bold text-gray-500 ml-1">({rev.stars}★)</span>
                            </div>
                          </td>

                          {/* Review Date */}
                          <td className="py-4 px-4 font-mono text-[10px] text-gray-400 whitespace-nowrap">
                            {rev.date}
                          </td>

                          {/* Raw Comment feedback */}
                          <td className="py-4 px-4 font-sans text-xs text-gray-700 leading-relaxed italic pr-6 whitespace-pre-line">
                            "{rev.content}"
                          </td>

                          {/* Public Visibility Indicator Status */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {rev.hidden ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-gray-150 text-gray-600 border border-gray-200">
                                <EyeOff className="w-3 h-3" />
                                <span>HIDDEN</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-emerald-50 text-emerald-750 border border-emerald-100">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>PUBLIC</span>
                              </span>
                            )}
                          </td>

                          {/* Admin interaction controls */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {confirmDeleteReviewId === rev.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1 animate-fadeIn select-none">
                                  <span className="text-[10px] font-bold text-red-700 uppercase font-mono px-1">Retire?</span>
                                  <button
                                    onClick={() => handleDeleteReview(rev.id)}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteReviewId(null)}
                                    className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-750 rounded text-[10px] font-bold uppercase transition-all cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <>
                                  {/* Toggle visibility */}
                                  <button
                                    onClick={() => handleToggleHideReview(rev.id, !!rev.hidden)}
                                    className={`p-1.5 rounded-lg border transition-all text-xs cursor-pointer select-none ${
                                      rev.hidden 
                                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200" 
                                        : "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                    }`}
                                    title={rev.hidden ? "Publish review to storefront" : "Hide review from storefront"}
                                  >
                                    {rev.hidden ? (
                                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold px-1 py-0.5">
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>UNHIDE</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold px-1 py-0.5">
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>HIDE</span>
                                      </span>
                                    )}
                                  </button>

                                  {/* Extreme Delete option */}
                                  <button
                                    onClick={() => setConfirmDeleteReviewId(rev.id)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition-all cursor-pointer select-none"
                                    title="Permanently delete review"
                                  >
                                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold px-1 py-0.5">
                                      <Trash className="w-3.5 h-3.5" />
                                      <span>DELETE</span>
                                    </span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Announcement Ticker Tape Editor - Owner Only, moved to Reviews tab */}
            {adminSession.role === "Owner" && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-xs relative font-sans">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display mb-4 flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-[#4a0605]" />
                  <span>Live Announcement Ticker Tape</span>
                </h3>

                <div className="space-y-6 font-sans">
                  {/* Nepali Messages Section */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                      नेपाली सन्देशहरू (Nepali Announcements)
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {tickerNepali.map((msg, idx) => (
                        <div key={`ne-${idx}`} className="flex items-center gap-2 bg-gray-50 border border-gray-200/50 p-2 rounded-lg group">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickerNepali(prev => prev.map((item, i) => i === idx ? val : item));
                            }}
                            className="w-full text-xs font-sans text-gray-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-600 rounded px-1.5 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => setTickerNepali(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer flex shrink-0"
                            title="Delete message"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {tickerNepali.length === 0 && (
                        <div className="text-[10px] text-gray-400 italic py-2">
                          No active Nepali announcements set.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="नयाँ नेपाली समाचार/सन्देश लेख्नुहोस्..."
                        value={newTickerNepaliMsg}
                        onChange={(e) => setNewTickerNepaliMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newTickerNepaliMsg.trim();
                            if (trimmed) {
                              setTickerNepali(prev => [...prev, trimmed]);
                              setNewTickerNepaliMsg("");
                            }
                          }
                        }}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newTickerNepaliMsg.trim();
                          if (trimmed) {
                            setTickerNepali(prev => [...prev, trimmed]);
                            setNewTickerNepaliMsg("");
                          }
                        }}
                        className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer border border-gray-300 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* English Messages Section */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                      English Announcements (अंग्रेजी सन्देशहरू)
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {tickerEnglish.map((msg, idx) => (
                        <div key={`en-${idx}`} className="flex items-center gap-2 bg-gray-50 border border-gray-200/50 p-2 rounded-lg group">
                          <input
                            type="text"
                            value={msg}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTickerEnglish(prev => prev.map((item, i) => i === idx ? val : item));
                            }}
                            className="w-full text-xs font-sans text-gray-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-600 rounded px-1.5 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => setTickerEnglish(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer flex shrink-0"
                            title="Delete message"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {tickerEnglish.length === 0 && (
                        <div className="text-[10px] text-gray-400 italic py-2">
                          No active English announcements set.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type new English announcement..."
                        value={newTickerEnglishMsg}
                        onChange={(e) => setNewTickerEnglishMsg(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newTickerEnglishMsg.trim();
                            if (trimmed) {
                              setTickerEnglish(prev => [...prev, trimmed]);
                              setNewTickerEnglishMsg("");
                            }
                          }
                        }}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = newTickerEnglishMsg.trim();
                          if (trimmed) {
                            setTickerEnglish(prev => [...prev, trimmed]);
                            setNewTickerEnglishMsg("");
                          }
                        }}
                        className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all cursor-pointer border border-gray-300 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveTicker()}
                    disabled={savingTicker}
                    className="w-full py-2.5 bg-[#4a0605] hover:bg-[#5f0a09] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                  >
                    {savingTicker ? "Updating Ticker..." : "Save Ticker Messages"}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* TAB 4: Staff & Security Records Logs Panels */}
        {activeTab === "staff_logs" && adminSession.role === "Owner" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Split Grid: 1st side is Staff Registrations, 2nd side is Logs Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
              
              {/* Staff Accounts Management Center */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display mb-4 flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-[#4a0605]" />
                    <span>Register New Staff Account</span>
                  </h3>
                  
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. sumit_sharma"
                        value={newStaffUser}
                        onChange={(e) => setNewStaffUser(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605] focus:bg-white animate-fadeIn"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                        Secret Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newStaffPass}
                        onChange={(e) => setNewStaffPass(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605] focus:bg-white animate-fadeIn"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                        Role Privileges Level
                      </label>
                      <select
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-sans text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605]"
                      >
                        <option value="Admin">Admin (Sheet & Catalog access)</option>
                        <option value="Moderator">Moderator (Catalog only access)</option>
                        <option value="Owner">Owner (All portal systems access)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#4a0605] hover:bg-[#5f0a09] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm text-center"
                    >
                      Create Registered Staff
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-[#4a0605]" />
                      <span>Active Store Staff Database ({staffList.length})</span>
                    </h3>
                  </div>

                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full border-collapse text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[9px] font-mono uppercase text-gray-400 font-bold tracking-wider">
                          <th className="py-2.5 px-3">Username</th>
                          <th className="py-2.5 px-3">Passcode</th>
                          <th className="py-2.5 px-3">Role Level</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {loadingStaff ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400 font-mono text-[10px]">
                              Gathering staff registries...
                            </td>
                          </tr>
                        ) : staffList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400">
                              No staff found besides default Owner.
                            </td>
                          </tr>
                        ) : (
                          staffList.map((st) => (
                            <tr key={st.username} className="hover:bg-gray-50/50">
                              <td className="py-3 px-3 font-semibold text-gray-900 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>{st.username}</span>
                              </td>
                              {editingStaffUser === st.username ? (
                                <td className="py-1 px-3">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingPasscode}
                                      onChange={(e) => setEditingPasscode(e.target.value)}
                                      className="p-1 px-2 border border-gray-300 rounded text-xs w-28 text-gray-900 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[#4a0605]"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          handleSavePasscode(st.username, editingPasscode);
                                        } else if (e.key === "Escape") {
                                          setEditingStaffUser(null);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSavePasscode(st.username, editingPasscode)}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer inline-flex"
                                      title="Save passcode"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingStaffUser(null)}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors cursor-pointer inline-flex"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              ) : (
                                <td className="py-3 px-3 align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-gray-600 font-medium select-all">{st.passcode}</span>
                                    <button
                                      onClick={() => {
                                        setEditingStaffUser(st.username);
                                        setEditingPasscode(st.passcode);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all cursor-pointer inline-flex"
                                      title="Edit staff passcode"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                              <td className="py-3 px-3">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  st.role === "Owner"
                                    ? "bg-purple-100 text-purple-800"
                                    : st.role === "Admin"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {st.role}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {st.username !== adminSession.username ? (
                                  confirmDeleteUser === st.username ? (
                                    <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                                      <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Delete?</span>
                                      <button
                                        onClick={() => {
                                          handleDeleteStaff(st.username);
                                          setConfirmDeleteUser(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase rounded transition-colors cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setConfirmDeleteUser(null)}
                                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[9px] uppercase rounded transition-colors cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setConfirmDeleteUser(st.username);
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer inline-flex"
                                      title="Revoke and delete staff credentials"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  )
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-mono font-light italic pr-2">Logged In</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>


              </div>

              {/* Security Audit Trail Logs */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-display flex items-center gap-2">
                        <Sliders className="w-4.5 h-4.5 text-[#4a0605]" />
                        <span>Security Audit trail Logs</span>
                      </h3>
                    </div>

                    {/* Security Audit logs are fully transparent and cannot be cleared */}
                  </div>

                  <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-xs">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                        <Search className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search logs by staff operator or audit message..."
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white"
                      />
                    </div>

                    <div className="text-[10px] font-mono text-gray-400">
                      Logs: <strong>{
                        auditLogs.filter(log => {
                          const term = auditSearch.toLowerCase();
                          return (
                            (log.username || "").toLowerCase().includes(term) ||
                            (log.role || "").toLowerCase().includes(term) ||
                            (log.action || "").toLowerCase().includes(term)
                          );
                        }).length
                      }</strong> total traces
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                    <table className="w-full border-collapse text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Operator Info</th>
                          <th className="py-3 px-4">Action Event Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 divide-dotted bg-white">
                        {loadingAudit ? (
                          <tr>
                            <td colSpan={3} className="py-12 text-center text-gray-400 font-mono text-xs">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-gray-350 mb-2" />
                              <span>Parsing audit trail database...</span>
                            </td>
                          </tr>
                        ) : auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-12 text-center text-gray-400 font-sans">
                              No security audit logs recorded yet. Action log will populate as staff perform operations.
                            </td>
                          </tr>
                        ) : (
                          auditLogs
                            .filter(log => {
                              const term = auditSearch.toLowerCase();
                              return (
                                (log.username || "").toLowerCase().includes(term) ||
                                (log.role || "").toLowerCase().includes(term) ||
                                (log.action || "").toLowerCase().includes(term)
                              );
                            })
                            .map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50/50 bg-white text-[11px] leading-tight">
                                <td className="py-3 px-4 font-mono text-[9px] text-gray-400 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString("np-NP", { hour12: true })}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="font-semibold text-gray-900">{log.username}</div>
                                  <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{log.role}</div>
                                </td>
                                <td className="py-3 px-4 text-gray-700">
                                  <span className="font-medium text-gray-800">{log.action}</span>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === "chatbot" && (adminSession.role === "Owner" || adminSession.role === "Admin") && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-display font-black tracking-tight text-[#4a0605] uppercase flex items-center gap-2">
                    <Bot className="w-6 h-6 text-[#4a0605]" />
                    <span>AI Concierge Chatbot Controller</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage your store's automated client advisor! This updates rules, preset questions, and core guidelines dynamically.
                  </p>
                </div>
              </div>

              {loadingBot ? (
                <div className="py-24 text-center font-mono text-xs text-gray-400 w-full">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-red-900" />
                  <span>Loading chatbot configuration database...</span>
                </div>
              ) : (
                <div className="space-y-6 font-sans">
                  
                  {/* First Row: Bot Name and Welcome Message */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Virtual Advisor Name
                      </label>
                      <input
                        type="text"
                        value={botName}
                        onChange={(e) => setBotName(e.target.value)}
                        placeholder="e.g. Riaan"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Dynamic Client Greeting Welcome Message
                      </label>
                      <textarea
                        value={botWelcome}
                        onChange={(e) => setBotWelcome(e.target.value)}
                        placeholder="Namaste! Welcome..."
                        rows={3}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white resize-y"
                        required
                      />
                    </div>
                  </div>

                  {/* Second Row: Knowledge Base / FAQ (Structured Q&A Cards) */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-[#4a0605]" />
                          <span>AI Concierge Knowledge Base (FAQ Form)</span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const parsed = parseInstructionToFaqs(botInstruction);
                            setBotFaqs(parsed);
                            setFaqFeedback(`Successfully analyzed system instructions and extracted ${parsed.length} structured FAQ records!`);
                            setTimeout(() => setFaqFeedback(null), 4000);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-[10px] font-bold text-gray-700 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                          title="Extract Questions and Answers from current persona guidelines text"
                        >
                          <BookOpen className="w-3 h-3 text-[#4a0605]" />
                          <span>Analyze & Extract Q&As</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newId = "faq-" + Math.random().toString(36).substring(2, 9);
                            setBotFaqs(prev => [...prev, { id: newId, question: "", answer: "" }]);
                          }}
                          className="px-2.5 py-1.5 bg-gray-950 hover:bg-gray-800 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Q&A Pair</span>
                        </button>
                      </div>
                    </div>

                    {faqFeedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2 ml-1 animate-fade-in">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>{faqFeedback}</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {botFaqs.length === 0 ? (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                          <p className="text-xs text-gray-400 italic font-mono mb-2">No active FAQs defined yet.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setBotFaqs([
                                {
                                  id: "faq-1",
                                  question: "Where is Riaan Ko Pasal located?",
                                  answer: "Riaan Ko Pasal (Riaan Enterprises) is located at Omsatiya-1, Thutipipal, Rupandehi, Nepal near Siddhartha Highway."
                                },
                                {
                                  id: "faq-2",
                                  question: "Do you offer 0% Interest EMI plans?",
                                  answer: "Yes, we proudly offer absolute 0% Interest EMI plans over 3, 6, 9, 12, or 18 months, with zero added interest or hidden costs!"
                                }
                              ]);
                            }}
                            className="text-xs text-[#4a0605] underline font-bold"
                          >
                            Populate standard default store FAQs
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-[480px] overflow-y-auto pr-1">
                          {botFaqs.map((faq, index) => (
                            <div key={faq.id || index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all relative group flex flex-col md:flex-row gap-3 items-start">
                              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gray-900 text-white font-mono text-[9px] flex items-center justify-center font-bold shadow">
                                {index + 1}
                              </span>
                              
                              <div className="flex-1 space-y-2 w-full">
                                <div>
                                  <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase block mb-1">Question</span>
                                  <input
                                    type="text"
                                    value={faq.question}
                                    placeholder="e.g. What is the address of Riaan Enterprises?"
                                    onChange={(e) => {
                                      const updatedVal = e.target.value;
                                      setBotFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, question: updatedVal } : f));
                                    }}
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:bg-white focus:ring-1 focus:ring-gray-400 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-gray-500 tracking-wider uppercase block mb-1">Expected Chat Response / Answer</span>
                                  <textarea
                                    value={faq.answer}
                                    rows={2}
                                    placeholder="e.g. Our showroom is open 7 days a week, near Thutipipal Siddhartha Highway. Feel free to stop by!"
                                    onChange={(e) => {
                                      const updatedVal = e.target.value;
                                      setBotFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, answer: updatedVal } : f));
                                    }}
                                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:bg-white focus:ring-1 focus:ring-gray-400 focus:outline-none resize-none leading-relaxed"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setBotFaqs(prev => prev.filter(f => f.id !== faq.id));
                                }}
                                className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors md:self-center cursor-pointer flex-shrink-0"
                                title="Delete Q&A Pair"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Collapsible advanced prompt configuration for guidelines */}
                    <div className="border border-gray-200 rounded-xl bg-gray-50/50">
                      <details className="group">
                        <summary className="flex items-center justify-between p-3 cursor-pointer select-none font-bold text-xs text-gray-700 hover:text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5 text-gray-400" />
                            <span>Advanced Chatbot Custom Guidelines & Personality Prompts</span>
                          </div>
                          <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 border-t border-gray-200 space-y-2 bg-white rounded-b-xl">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                              Chatbot Behavior Guidelines (System Rules)
                            </label>
                            <span className="text-[9px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                              SYSTEM INSTRUCTION
                            </span>
                          </div>
                          <textarea
                            value={botInstruction}
                            onChange={(e) => setBotInstruction(e.target.value)}
                            placeholder="You are Riaan's Smart Assistant..."
                            rows={6}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-220 rounded-lg text-[11px] text-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white resize-y leading-relaxed"
                          />
                          <p className="text-[10px] text-gray-400 font-light mt-1">
                            Defines the chatbot context, location, owner name, language, and tone. Insert <strong>{"{{PRODUCTS_CATALOG}}"}</strong> to auto-inject the active items catalog instantly into its context!
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* Third Row: Presets prompt questions */}
                  <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200/60 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Client Suggestion Suggestive Proactive Prompts</span>
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 py-1">
                      {botPresets.length === 0 ? (
                        <span className="text-xs text-gray-400 font-mono italic">No instant presets configured. Add some below.</span>
                      ) : (
                        botPresets.map((p, pIdx) => (
                          <div key={pIdx} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-800 text-xs rounded-full flex items-center gap-2 shadow-sm font-semibold">
                            <span>{p}</span>
                            <button
                              type="button"
                              onClick={() => setBotPresets(prev => prev.filter((_, idx) => idx !== pIdx))}
                              className="text-gray-400 hover:text-red-700 transition-colors font-bold text-sm cursor-pointer"
                              title="Delete prompt"
                            >
                              &times;
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2 max-w-xl">
                      <input
                        type="text"
                        placeholder="Add new suggestion prompt..."
                        value={newPresetPrompt}
                        onChange={(e) => setNewPresetPrompt(e.target.value)}
                        className="flex-grow px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const clean = newPresetPrompt.trim();
                            if (clean && !botPresets.includes(clean)) {
                              setBotPresets(prev => [...prev, clean]);
                              setNewPresetPrompt("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newPresetPrompt.trim();
                          if (clean && !botPresets.includes(clean)) {
                            setBotPresets(prev => [...prev, clean]);
                            setNewPresetPrompt("");
                          }
                        }}
                        className="px-3 py-2 bg-gray-900 text-white hover:bg-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Add Suggestion
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => fetchBotData()}
                      className="px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveBot()}
                      disabled={savingBot}
                      className="px-6 py-2.5 bg-[#4a0605] hover:bg-[#5f0a09] disabled:bg-gray-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      {savingBot ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Bot Settings...</span>
                        </>
                      ) : (
                        <span>Save Chatbot Settings</span>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

         {/* MODAL OVERLAY: Dynamic Smartphone Add/Edit Form */}
      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 font-sans animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-250 w-full max-w-2xl overflow-hidden text-left flex flex-col max-h-[92vh] animate-slideIn">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 bg-[#4a0605] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300">
                  {formId ? "Staff Database Editor" : "Registered Catalog Intake"}
                </span>
                <h3 className="text-lg font-display font-black tracking-tight uppercase mt-0.5">
                  {formId ? `Modify ${formModel}` : "Add New Appliance Option"}
                </h3>
              </div>
              <button
                onClick={() => setIsProductFormOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProductSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
              
              {/* Row 1: Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LG, Samsung, Whirlpool"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605] focus:border-[#4a0605]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Model Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5-Star Frost Free Double Door Fridge"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605] focus:border-[#4a0605]"
                  />
                </div>
              </div>

              {/* Row 2: Price */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Retail Price (NRs in Nepal)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-mono text-xs font-bold">NRs</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      placeholder="e.g. 64999"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605] focus:border-[#4a0605]"
                    />
                  </div>
                </div>
              </div>

              {/* Product Category Selection (Dynamic Creator & Destroyer) */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-grow space-y-1.5 text-left">
                    <label className="text-xs font-bold uppercase text-gray-700 tracking-wider">Product Category Tag</label>
                    <div className="flex gap-2">
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="flex-grow bg-white border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605]"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                        className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-amber-950 font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer whitespace-nowrap"
                        title="Configure Categories"
                      >
                        {isAddingNewCat ? "Lock selection" : "Edit Lists"}
                      </button>
                    </div>
                  </div>
                </div>

                {isAddingNewCat && (
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-3.5 text-left">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-mono block uppercase">Add New Category Option</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Smart TV, Microwave, Smartwatch"
                          value={newCatInput}
                          onChange={(e) => setNewCatInput(e.target.value)}
                          className="flex-grow bg-white border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605]"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!newCatInput.trim()) return;
                            try {
                              const res = await fetch("/api/categories", {
                                method: "POST",
                                headers: getHeaders(true),
                                body: JSON.stringify({ name: newCatInput })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setCategories(sortCategories(data.categories));
                                setFormCategory(newCatInput.trim());
                                setNewCatInput("");
                                showToast(`Category "${newCatInput}" added successfully!`, false);
                              } else {
                                const err = await res.json();
                                showToast(err.error || "Failed to add category", true);
                              }
                            } catch (e) {
                              console.error(e);
                              showToast("Error adding category.", true);
                            }
                          }}
                          className="px-3 py-2 bg-[#4a0605] text-white font-bold text-xs uppercase tracking-wider rounded transition-all hover:bg-[#5f0a09] cursor-pointer"
                        >
                          SAVE
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-mono block uppercase">Delete Categories (Click × to retire)</span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded border border-gray-100">
                        {categories.map((cat) => {
                          const isConfirming = confirmDeleteCategoryName === cat;
                          return (
                            <span
                              key={cat}
                              className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs shadow-xs transition-all ${
                                isConfirming 
                                  ? "bg-red-50 border border-red-300 text-red-800 font-bold animate-pulse" 
                                  : "bg-gray-50 border border-gray-150 text-gray-700"
                              }`}
                            >
                              {isConfirming ? (
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await fetch(`/api/categories/${encodeURIComponent(cat)}`, {
                                        method: "DELETE",
                                        headers: getHeaders()
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        const sortedCats = sortCategories(data.categories);
                                        setCategories(sortedCats);
                                        if (formCategory === cat) {
                                          setFormCategory(sortedCats[0] || "");
                                        }
                                        showToast(`Successfully deleted category "${cat}".`, false);
                                      } else {
                                        showToast("Failed to delete category.", true);
                                      }
                                    } catch (e) {
                                      console.error(e);
                                      showToast("Failed to delete category.", true);
                                    } finally {
                                      setConfirmDeleteCategoryName(null);
                                    }
                                  }}
                                  className="text-[10px] text-red-650 hover:text-red-800 transition-colors uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer"
                                >
                                  <span>🚨 Click to Delete</span>
                                </button>
                              ) : (
                                <span>{cat}</span>
                              )}
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isConfirming) {
                                    setConfirmDeleteCategoryName(null);
                                  } else {
                                    setConfirmDeleteCategoryName(cat);
                                    // Auto-reset after 5 seconds if not clicked
                                    setTimeout(() => setConfirmDeleteCategoryName(p => p === cat ? null : p), 5000);
                                  }
                                }}
                                className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] transition-colors cursor-pointer ${
                                  isConfirming 
                                    ? "bg-gray-250 hover:bg-gray-300 text-gray-700" 
                                    : "bg-red-100 hover:bg-red-250 text-red-650"
                                }`}
                                title={isConfirming ? "Cancel deletion" : "Delete category option"}
                              >
                                {isConfirming ? "✕" : "✕"}
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Specifications Header */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#4a0605]">Hardware Specifications</h4>
                <p className="text-[10px] text-gray-400 font-light">Add custom specification fields according to the appliance type</p>
              </div>

              {/* Dynamic Customizable Specs Inputs */}
              <div className="space-y-3">
                {formSpecs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder="Specification Key (e.g. Capacity)"
                        value={spec.key}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[index].key = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        placeholder="Value (e.g. 250 Litres)"
                        value={spec.value}
                        onChange={(e) => {
                          const updated = [...formSpecs];
                          updated[index].value = e.target.value;
                          setFormSpecs(updated);
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formSpecs.filter((_, i) => i !== index);
                        setFormSpecs(updated.length > 0 ? updated : [{ key: "", value: "" }]);
                      }}
                      className="p-2 text-red-650 hover:bg-red-50 rounded cursor-pointer"
                      title="Remove specification field"
                    >
                      <Trash className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormSpecs([...formSpecs, { key: "", value: "" }])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Specification Field</span>
                </button>
              </div>

              {/* Presentation Options Header */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#4a0605]">Presentation & Aesthetics</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Aesthetic Colors (Comma-separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="Brushed Steel, elegant Inox, Glossy White"
                    value={formColors}
                    onChange={(e) => setFormColors(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2.5 text-xs text-gray-900 focus:outline-none"
                  />
                  <p className="text-[9.5px] text-gray-400 leading-none">Separate variants with standard commas (e.g. &quot;Silver, Black&quot;)</p>
                </div>

                {/* Rich Image Upload Section (Multiple Images Support) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Product Images Setup (Multiple Supported)</label>
                    <span className="text-[10px] bg-[#4a0605]/10 text-[#4a0605] font-mono px-2 py-0.5 rounded font-black">
                      {formImages.length} {formImages.length === 1 ? 'image' : 'images'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {/* Render existing images */}
                    {formImages.map((img, index) => (
                      <div key={index} className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col items-center justify-center p-1 group shadow-xs">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-contain" />
                        
                        {/* Status tag */}
                        <div className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[8px] rounded font-mono font-bold uppercase shadow-sm ${
                          index === 0 
                            ? "bg-emerald-600 text-white" 
                            : "bg-gray-100 text-gray-650 border border-gray-200"
                        }`}>
                          {index === 0 ? "★ Primary" : `#${index + 1}`}
                        </div>

                        {/* Interactive hovered buttons overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 font-sans">
                          {index !== 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const reordered = [...formImages];
                                const [target] = reordered.splice(index, 1);
                                reordered.unshift(target);
                                setFormImages(reordered);
                              }}
                              className="bg-white hover:bg-amber-100 text-amber-805 text-[8px] font-bold px-2 py-1 rounded shadow-sm w-full uppercase tracking-wider transition-all"
                              title="Make this the Primary cover image"
                            >
                              Make Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formImages.filter((_, i) => i !== index);
                              setFormImages(updated);
                            }}
                            className="bg-red-650 hover:bg-red-750 text-white font-bold p-1 rounded shadow-sm flex items-center justify-center gap-1 w-full text-[8px] uppercase tracking-wider transition-all"
                            title="Remove this image"
                          >
                            <Trash className="w-2.5 h-2.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Uniform addition tile for smooth layout flow */}
                    <label className="relative aspect-square border-2 border-dashed border-gray-300 hover:border-[#4a0605] hover:bg-white rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50 cursor-pointer transition-all">
                      <Plus className="w-5 h-5 mb-1 text-gray-450" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            const totalFiles = files.length;
                            const newImages: string[] = new Array(totalFiles);
                            let loadedCount = 0;

                            for (let i = 0; i < totalFiles; i++) {
                              const file = files[i];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  newImages[i] = String(event.target.result);
                                }
                                loadedCount++;
                                if (loadedCount === totalFiles) {
                                  const filteredNew = newImages.filter(Boolean);
                                  setFormImages(prev => [...prev, ...filteredNew]);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight">
                    Upload multiple product models/variants images from your local system (JPG, PNG and WebP formats supported). The first image listed as (★ Primary) will automatically represent the primary display card inside the consumer catalogs. Hover over any auxiliary thumbnail to make it Primary or remove it.
                  </p>
                </div>

                {/* Checkbox for Popular option */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#4a0605] accent-[#4a0605] focus:outline-none focus:ring-offset-0"
                    />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Highlight: Flag as a store &quot;Best Seller / Popular&quot; model!
                    </span>
                  </label>
                </div>

                {/* Checkbox for Out of Stock option */}
                <div className="pt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formOutOfStock}
                      onChange={(e) => setFormOutOfStock(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-red-600 accent-red-600 focus:outline-none focus:ring-offset-0"
                    />
                    <span className="text-xs font-bold text-red-750 uppercase tracking-wide">
                      Inventory: Mark as &quot;Out of Stock&quot; (Customers cannot place details order)
                    </span>
                  </label>
                </div>

                {/* Checkbox for Hidden option */}
                <div className="pt-1.5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formHidden}
                      onChange={(e) => setFormHidden(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-red-600 accent-red-600 focus:outline-none focus:ring-offset-0"
                    />
                    <span className="text-xs font-bold text-red-750 uppercase tracking-wide">
                      Visibility: Hide this product from customer catalog (keeps record in database but hides from end-users)
                    </span>
                  </label>
                </div>

                {/* Customizable EMI Settings (Merchant Toggle) */}
                <div className="pt-4 border-t border-gray-100 space-y-3.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#4a0605]">EMI Scheme Configuration</h4>
                  
                  <div className="pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formEmiAvailable}
                        onChange={(e) => setFormEmiAvailable(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-[#4a0605] accent-[#4a0605] focus:outline-none focus:ring-offset-0"
                      />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Enable 0% Interest EMI Scheme for this appliance / product
                      </span>
                    </label>
                  </div>

                  {formEmiAvailable && (
                    <div className="bg-[#4d0706]/5 border border-yellow-500/10 rounded-xl p-4.5 space-y-4 text-xs animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-bold uppercase text-amber-900 tracking-wider">
                            Minimum Downpayment Required
                          </label>
                          <select
                            value={formMinDownpaymentPercent}
                            onChange={(e) => setFormMinDownpaymentPercent(Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded p-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#4a0605]"
                          >
                            <option value={10}>10% Minimum Downpayment</option>
                            <option value={20}>20% Minimum Downpayment</option>
                            <option value={30}>30% Minimum Downpayment</option>
                            <option value={40}>40% Minimum Downpayment</option>
                            <option value={50}>50% Minimum Downpayment</option>
                            <option value={60}>60% Minimum Downpayment</option>
                            <option value={70}>70% Minimum Downpayment</option>
                            <option value={80}>80% Minimum Downpayment</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="block text-xs font-bold uppercase text-amber-900 tracking-wider">
                            Installment Time Period Options
                          </label>
                          <span className="text-[10px] text-gray-400 block pb-1 font-light">
                            Select one or more active installment tenures (months):
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {[3, 6, 9, 10, 12, 18, 24].map((tenure) => {
                              const isChecked = formAllowedTenures.includes(tenure);
                              return (
                                <button
                                  key={tenure}
                                  type="button"
                                  onClick={() => {
                                    if (isChecked) {
                                      if (formAllowedTenures.length > 1) {
                                        setFormAllowedTenures(formAllowedTenures.filter(t => t !== tenure));
                                      } else {
                                        showToast("Please keep at least one active installment duration option.", true);
                                      }
                                    } else {
                                      setFormAllowedTenures([...formAllowedTenures, tenure].sort((a,b) => a - b));
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                                    isChecked
                                      ? "bg-[#4a0605] text-white border-[#4a0605] shadow-xs"
                                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                  }`}
                                >
                                  {tenure}m
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-6 border-t border-gray-150 flex items-center justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="px-5 py-2.5 rounded border border-gray-250 text-xs font-bold uppercase text-gray-500 hover:text-black hover:bg-gray-50 cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4a0605] hover:bg-[#5f0a09] text-white rounded text-xs font-bold uppercase tracking-wider shadow-md shadow-[#4a0605]/20 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{formId ? "APPLY MODIFICATION" : "REGISTER ENTRY"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EMI REMINDERS & INSTALLMENT SCHEDULE MODAL */}
      {selectedEmiOrderForReminders && (() => {
        const order = selectedEmiOrderForReminders;
        const tenure = order.emiTenure || 1;
        const paidMonths = order.emiPaidMonths || 0;
        const sentMonths = order.emiSentMonths || [];

        // Helper to handle incrementing/decrementing installments paid from the modal
        const handleMarkMonthPaidToggle = async (monthNum: number, markPaid: boolean) => {
          let newPaidCount = paidMonths;
          if (markPaid) {
            newPaidCount = Math.max(monthNum, paidMonths); // Mark up to this month as paid
          } else {
            newPaidCount = Math.max(0, monthNum - 1); // Mark down to previous month
          }
          
          const updates: Partial<OrderItem> = { 
            emiPaidMonths: newPaidCount,
            paymentStatus: newPaidCount === tenure ? "Paid" : "Pending"
          };

          try {
            const res = await fetch(`/api/orders/${order.id}`, {
              method: "PUT",
              headers: getHeaders(true),
              body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error("Failed to update payment status");
            const data = await res.json();
            if (data.success && data.order) {
              // Update local state
              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updates } : o));
              setSelectedEmiOrderForReminders(prev => prev && prev.id === order.id ? { ...prev, ...updates } : prev);
              showToast(`Updated payment progress: Month ${newPaidCount}/${tenure} is now recorded as paid!`, false);
            }
          } catch (err: any) {
            showToast(err.message || "Could not update payment status.", true);
          }
        };

        // Helper to mark a reminder as "sent"
        const handleToggleSentReminder = async (monthNum: number) => {
          const isCurrentlySent = sentMonths.includes(monthNum);
          const newSentMonths = isCurrentlySent
            ? sentMonths.filter(m => m !== monthNum)
            : [...sentMonths, monthNum];

          const updates: Partial<OrderItem> = {
            emiSentMonths: newSentMonths
          };

          try {
            const res = await fetch(`/api/orders/${order.id}`, {
              method: "PUT",
              headers: getHeaders(true),
              body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error("Failed to update reminder log");
            const data = await res.json();
            if (data.success && data.order) {
              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updates } : o));
              setSelectedEmiOrderForReminders(prev => prev && prev.id === order.id ? { ...prev, ...updates } : prev);
              showToast(isCurrentlySent ? `Unmarked Month ${monthNum} reminder log.` : `Logged Month ${monthNum} reminder as sent successfully!`, false);
            }
          } catch (err: any) {
            showToast(err.message || "Failed logging reminder state.", true);
          }
        };

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 font-sans animate-fadeIn">
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-250 w-full max-w-3xl overflow-hidden text-left flex flex-col max-h-[92vh] animate-slideIn">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-150 bg-[#4a0605] text-white flex justify-between items-center select-none">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <Bell className="w-5 h-5 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300 block">
                      Active Installments Ledger & Communications
                    </span>
                    <h3 className="text-base font-display font-black tracking-tight uppercase mt-0.5">
                      EMI Schedule: {order.customerName}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedEmiOrderForReminders(null)}
                  className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all text-lg font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-grow space-y-6">
                
                {/* Meta details cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Customer Details</span>
                    <span className="text-xs font-black text-slate-800">{order.customerName}</span>
                    <a href={`tel:${order.customerContact}`} className="text-[11px] text-blue-600 font-mono hover:underline font-bold mt-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-500" />
                      <span>{order.customerContact}</span>
                    </a>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">Selected Appliance</span>
                    <span className="text-xs font-black text-slate-800">{order.brand} {order.model}</span>
                    <span className="text-[10px] text-slate-500 font-medium mt-1">Color: {order.selectedColor}</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400">EMI Portfolio Status</span>
                    <span className="text-xs font-black text-slate-800">
                      NRs. {order.emiMonthly?.toLocaleString()}/mo
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-205">
                        {paidMonths} / {tenure} Paid
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black font-mono uppercase ${
                        paidMonths === tenure ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {paidMonths === tenure ? "Completed" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Installments list */}
                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase font-mono font-black tracking-widest text-slate-500 select-none">
                    MONTHLY INSTALLMENTS LEDGER
                  </h4>

                  <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2.5 bg-slate-100/60 border border-slate-200 rounded-xl text-[9px] uppercase font-mono font-black tracking-wider text-slate-500 select-none">
                    <span className="sm:col-span-3">Installment Month</span>
                    <span className="sm:col-span-3">Due Date</span>
                    <span className="sm:col-span-2">Amount</span>
                    <span className="sm:col-span-4 text-right">Actions</span>
                  </div>

                  <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/20 divide-y divide-slate-150 text-xs">
                    
                    {Array.from({ length: tenure }).map((_, idx) => {
                      const monthNum = idx + 1;
                      const isPaid = monthNum <= paidMonths;
                      const isSent = sentMonths.includes(monthNum);
                      
                      // Calculate due date (base timestamp + monthNum)
                      const orderDate = new Date(order.timestamp || Date.now());
                      const dueDate = new Date(orderDate);
                      dueDate.setMonth(dueDate.getMonth() + monthNum);
                      
                      const isOverdue = !isPaid && dueDate < new Date();

                      // Format templates
                      const remainingTotal = (tenure - paidMonths) * (order.emiMonthly || 0);
                      const whatsappTextNepali = `नमस्ते ${order.customerName}! रियान को पसल (Riaan Ko Pasal) बाट हजुरको ${order.brand} ${order.model} को किस्ताबापत NRs. ${order.emiMonthly?.toLocaleString()} (महिना ${monthNum}/${tenure}) को भुक्तानी मिति ${dueDate.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' })} सम्ममा गर्नुहुन विनम्र अनुरोध छ। हालसम्म भुक्तानी: ${paidMonths}/${tenure} महिना। धन्यवाद!`;
                      const whatsappTextEnglish = `Namaste ${order.customerName}! This is a friendly reminder from Riaan Ko Pasal that your monthly installment of NRs. ${order.emiMonthly?.toLocaleString()} for ${order.brand} ${order.model} (Month ${monthNum}/${tenure}) is due on ${dueDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}. Paid: ${paidMonths}/${tenure} months. Remaining: NRs. ${remainingTotal.toLocaleString()}. Thank you!`;

                      const cleanContact = order.customerContact.replace(/\D/g, "");
                      const formattedPhone = cleanContact.length === 10 ? `977${cleanContact}` : cleanContact;
                      const whatsappUrlEn = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappTextEnglish)}`;
                      const whatsappUrlNe = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappTextNepali)}`;

                      return (
                        <div key={monthNum} className={`p-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-4 transition-all ${
                          isPaid ? "bg-emerald-50/10 hover:bg-emerald-50/20" :
                          isOverdue ? "bg-rose-50/30 hover:bg-rose-50/40" : "bg-white hover:bg-slate-50"
                        }`}>
                          
                          {/* Column 1: Month Name & Badges */}
                          <div className="sm:col-span-3 flex flex-wrap items-center gap-2 text-left">
                            <span className="font-bold text-slate-800 whitespace-nowrap">Month {monthNum}</span>
                            
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                                ✓ Paid
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-rose-50 border border-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full uppercase animate-pulse whitespace-nowrap">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Overdue</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-amber-50 border border-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                                Upcoming
                              </span>
                            )}

                            {isSent && (
                              <span className="inline-flex items-center gap-1 text-[9px] bg-blue-50 border border-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                                <span>Sent</span>
                                <Bell className="w-2.5 h-2.5 text-blue-600" />
                              </span>
                            )}
                          </div>
                          
                          {/* Column 2: Due Date */}
                          <div className="sm:col-span-3 text-left">
                            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block sm:hidden">Due Date</span>
                            <span className="text-slate-700 font-medium whitespace-nowrap">
                              {dueDate.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Column 3: Amount */}
                          <div className="sm:col-span-2 text-left">
                            <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block sm:hidden">Amount</span>
                            <span className="font-bold text-slate-800 whitespace-nowrap">
                              NRs. {order.emiMonthly?.toLocaleString()}
                            </span>
                          </div>

                          {/* Column 4: Actions */}
                          <div className="sm:col-span-4 flex flex-wrap sm:flex-row items-center sm:justify-end gap-1.5">
                            
                            {/* WhatsApp Nepali */}
                            <a 
                              href={whatsappUrlNe} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => {
                                if (!isSent) handleToggleSentReminder(monthNum);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[9px] transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                              title="Send Nepali WhatsApp Reminder"
                            >
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-100" />
                              <span>Remind (नेपाली)</span>
                            </a>

                            {/* WhatsApp English */}
                            <a 
                              href={whatsappUrlEn} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={() => {
                                if (!isSent) handleToggleSentReminder(monthNum);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#4a0605] hover:bg-black text-white font-bold rounded-lg text-[9px] transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                              title="Send English WhatsApp Reminder"
                            >
                              <ExternalLink className="w-2.5 h-2.5 text-amber-300" />
                              <span>Remind (EN)</span>
                            </a>

                            {/* Sent toggle manual logging */}
                            <button
                              onClick={() => handleToggleSentReminder(monthNum)}
                              className={`p-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                isSent 
                                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" 
                                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                              title={isSent ? "Unmark reminder as sent" : "Mark reminder as sent manually"}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                            </button>

                            {/* Mark paid / unpaid inline */}
                            {isPaid ? (
                              <button
                                onClick={() => handleMarkMonthPaidToggle(monthNum, false)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Mark Unpaid
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMarkMonthPaidToggle(monthNum, true)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Collect Payment
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Helpful tips */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 text-slate-600 text-[11px] leading-relaxed select-none text-left">
                  <h5 className="font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>How the automated reminders work:</span>
                  </h5>
                  <p>
                    Installment months are calculated automatically starting from the initial reservation booking date ({new Date(order.timestamp || Date.now()).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}). Clicking <strong>"Remind"</strong> will automatically compose a custom WhatsApp message to the customer's phone number ({order.customerContact}), logging the status as notified.
                  </p>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-150 bg-slate-50 flex items-center justify-end select-none">
                <button
                  onClick={() => setSelectedEmiOrderForReminders(null)}
                  className="px-5 py-2.5 bg-white border border-slate-250 text-slate-700 rounded-lg text-xs font-bold uppercase hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-xs"
                >
                  Close Schedule
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Dynamic Non-Blocking Notification Toasts */}
      {(errorToast || successToast) && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm font-sans pointer-events-auto">
          {errorToast && (
            <div className="bg-red-900 border border-red-800 text-white rounded-xl shadow-2xl p-4 flex items-center space-x-3 backdrop-blur-sm bg-red-900/95 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider block text-red-300">Action Refused</span>
                <p className="text-xs text-red-50 leading-relaxed mt-0.5">{errorToast}</p>
              </div>
              <button onClick={() => setErrorToast(null)} className="text-red-300 hover:text-white text-xs cursor-pointer font-bold px-1.5">×</button>
            </div>
          )}
          {successToast && (
            <div className="bg-emerald-900 border border-emerald-800 text-white rounded-xl shadow-2xl p-4 flex items-center space-x-3 backdrop-blur-sm bg-emerald-900/95 animate-fadeIn">
              <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
              <div className="flex-1">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider block text-emerald-300">Success</span>
                <p className="text-xs text-emerald-50 leading-relaxed mt-0.5">{successToast}</p>
              </div>
              <button onClick={() => setSuccessToast(null)} className="text-emerald-300 hover:text-white text-xs cursor-pointer font-bold px-1.5">×</button>
            </div>
          )}
        </div>
      )}

      </div>
    </div>
  );
}
