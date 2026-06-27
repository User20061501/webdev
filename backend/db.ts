import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import fs from "fs";
import path from "path";

// Suppress annoying and benign Firebase JS SDK BloomFilter internal warning logs
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  const hasBloomFilterError = args.some(arg => {
    if (!arg) return false;
    const str = typeof arg === "string" ? arg : (arg.message || String(arg));
    return str.includes("BloomFilter error") || str.includes("BloomFilterError");
  });
  if (hasBloomFilterError) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Load Firebase applet configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let config: any = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error("[FIREBASE] Error reading config file:", err);
  }
}

const firebaseApp = getApps().length === 0 ? initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
}) : getApps()[0];

const databaseId = config.firestoreDatabaseId || "(default)";
console.log(`[FIREBASE] Connecting to modular Firestore database "${databaseId}" in project "${config.projectId}"`);

const modularDb = initializeFirestore(firebaseApp, {}, databaseId);

// Custom Compat-over-Modular Wrapper to run on Server as client REST/gRPC using API Key
class CompatDocumentReference {
  constructor(public rawRef: any) {}
  
  get id() {
    return this.rawRef.id;
  }
  
  get ref() {
    return this;
  }

  async get() {
    const snap = await getDoc(this.rawRef);
    return {
      exists: snap.exists(),
      data: () => snap.data() as any
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    await setDoc(this.rawRef, data, { merge: options?.merge ?? false });
  }

  async delete() {
    await deleteDoc(this.rawRef);
  }
}

class CompatCollectionReference {
  constructor(private collectionName: string) {}

  doc(docId?: string) {
    let finalDocId = docId;
    if (!finalDocId) {
      finalDocId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    const rawRef = doc(modularDb, this.collectionName, finalDocId);
    return new CompatDocumentReference(rawRef);
  }

  async get() {
    const rawCollection = collection(modularDb, this.collectionName);
    const snap = await getDocs(rawCollection);
    const docs = snap.docs.map(rawDoc => {
      const compatDocRef = new CompatDocumentReference(rawDoc.ref);
      return {
        id: rawDoc.id,
        ref: compatDocRef,
        data: () => rawDoc.data()
      };
    });
    return {
      forEach: (callback: (d: any) => void) => {
        docs.forEach(callback);
      },
      docs
    };
  }
}

class CompatBatch {
  private batchInstance = writeBatch(modularDb);

  set(compatRef: CompatDocumentReference, data: any) {
    this.batchInstance.set(compatRef.rawRef, data);
  }

  delete(compatRef: CompatDocumentReference) {
    this.batchInstance.delete(compatRef.rawRef);
  }

  async commit() {
    await this.batchInstance.commit();
  }
}

export const db = {
  collection(collectionName: string) {
    return new CompatCollectionReference(collectionName);
  },
  batch() {
    return new CompatBatch();
  }
};

// Helper: safe settings doc references
export const getSettingsDoc = (docId: string) => db.collection("settings").doc(docId);

// Helper for local JSON persistence fallbacks
function readLocalJson<T>(filename: string, defaultVal: T): T {
  const filePath = path.join(process.cwd(), "data", filename);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8").trim();
      return data ? JSON.parse(data) : defaultVal;
    } catch (err) {
      console.warn(`[LOCAL DB] Error reading local file ${filename}:`, err);
    }
  }
  return defaultVal;
}

function writeLocalJson<T>(filename: string, val: T): void {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(val, null, 2), "utf-8");
  } catch (err) {
    console.error(`[LOCAL DB] Error writing local file ${filename}:`, err);
  }
}

// 1. Brand Categories
function sortCategoriesList(list: string[]): string[] {
  const main = list.filter(c => c.toLowerCase() !== "other" && c.toLowerCase() !== "others");
  const other = list.filter(c => c.toLowerCase() === "other" || c.toLowerCase() === "others");
  main.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return [...main, ...other];
}

export async function getCategories(): Promise<string[]> {
  const catLocalFile = "categories.json";
  const defaults = ["Mobile", "TV", "Fridge", "AC", "Washing Machine", "Other"];
  try {
    const doc = await getSettingsDoc("categories").get();
    if (doc.exists) {
      const list = (doc.data()?.list as string[]) || [];
      const sorted = sortCategoriesList(list);
      writeLocalJson(catLocalFile, sorted);
      return sorted;
    }
    const initialList = sortCategoriesList(readLocalJson(catLocalFile, defaults));
    try {
      await getSettingsDoc("categories").set({ list: initialList });
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed categories in Firestore, using local fallback:", dbErr.message);
    }
    return initialList;
  } catch (err: any) {
    console.warn("[DB] Error in getCategories, falling back to local storage:", err.message);
    return sortCategoriesList(readLocalJson(catLocalFile, defaults));
  }
}

export async function saveCategories(list: string[]): Promise<void> {
  const catLocalFile = "categories.json";
  const sorted = sortCategoriesList(list);
  writeLocalJson(catLocalFile, sorted);
  try {
    await getSettingsDoc("categories").set({ list: sorted });
  } catch (err: any) {
    console.warn("[DB] Failed to save categories to Firestore, saved locally:", err.message);
  }
}

// 2. Products Catalog
export async function getProducts(): Promise<any[]> {
  const file = "products.json";
  const defaults: any[] = [];
  try {
    const snapshot = await db.collection("products").get();
    const items: any[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    if (items.length > 0) {
      writeLocalJson(file, items);
      return items;
    }
    
    // Seed
    const initialCatalog = readLocalJson(file, defaults);
    try {
      const batch = db.batch();
      initialCatalog.forEach(p => {
        const pId = p.id || ("prod-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5));
        const { id, ...data } = p;
        const ref = db.collection("products").doc(pId);
        batch.set(ref, data);
      });
      await batch.commit();
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed products count in Firestore:", dbErr.message);
    }
    return initialCatalog;
  } catch (err: any) {
    console.warn("[DB] Error in getProducts, falling back to local file:", err.message);
    return readLocalJson(file, defaults);
  }
}

export async function saveProduct(id: string, productData: any): Promise<void> {
  const file = "products.json";
  const list = readLocalJson<any[]>(file, []);
  const idx = list.findIndex(p => p.id === id);
  const cleanData = { ...productData };
  delete cleanData.id;
  
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cleanData, id };
  } else {
    list.push({ ...cleanData, id });
  }
  writeLocalJson(file, list);

  try {
    await db.collection("products").doc(id).set(cleanData, { merge: true });
  } catch (err: any) {
    console.warn("[DB] Failed to save product to Firestore, saved locally:", err.message);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const file = "products.json";
  const list = readLocalJson<any[]>(file, []);
  writeLocalJson(file, list.filter(p => p.id !== id));

  try {
    await db.collection("products").doc(id).delete();
  } catch (err: any) {
    console.warn("[DB] Failed to delete product from Firestore, deleted locally:", err.message);
  }
}

// 3. Customer Reviews
export async function getReviews(): Promise<any[]> {
  const file = "reviews.json";
  const defaults: any[] = [
    {
      id: "rev-default-1",
      name: "सरेश के.सी.",
      location: "ठुटिपिपल-४, रुपन्देही",
      stars: 5,
      date: "2026-05-15",
      content: "रियान को पसलबाट किस्तामा मोबाइल लिएको एकदमै सजिलो प्रक्रिया छ।"
    }
  ];
  try {
    const snapshot = await db.collection("reviews").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    if (list.length > 0) {
      writeLocalJson(file, list);
      return list;
    }
    
    const initialReviews = readLocalJson(file, defaults);
    try {
      const batch = db.batch();
      initialReviews.forEach(r => {
        const { id, ...data } = r;
        const ref = db.collection("reviews").doc(id || ("rev-" + Date.now().toString(36)));
        batch.set(ref, data);
      });
      await batch.commit();
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed reviews in Firestore:", dbErr.message);
    }
    return initialReviews;
  } catch (err: any) {
    console.warn("[DB] Error in getReviews, falling back to local file:", err.message);
    return readLocalJson(file, defaults);
  }
}

export async function saveReview(id: string, reviewData: any): Promise<void> {
  const file = "reviews.json";
  const list = readLocalJson<any[]>(file, []);
  const idx = list.findIndex(r => r.id === id);
  const cleanData = { ...reviewData };
  delete cleanData.id;
  
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cleanData, id };
  } else {
    list.push({ ...cleanData, id });
  }
  writeLocalJson(file, list);

  try {
    await db.collection("reviews").doc(id).set(cleanData, { merge: true });
  } catch (err: any) {
    console.warn("[DB] Failed to save review to Firestore:", err.message);
  }
}

export async function deleteReview(id: string): Promise<void> {
  const file = "reviews.json";
  const list = readLocalJson<any[]>(file, []);
  writeLocalJson(file, list.filter(r => r.id !== id));

  try {
    await db.collection("reviews").doc(id).delete();
  } catch (err: any) {
    console.warn("[DB] Failed to delete review from Firestore:", err.message);
  }
}

// 4. Staff Accounts
export async function getStaff(): Promise<any[]> {
  const file = "staff.json";
  const ADMIN_PASSCODE = (process.env.ADMIN_PASSCODE || "riaan2026").trim();
  const defaults = [
    {
      username: "prakash",
      passcode: ADMIN_PASSCODE || "riaan2026",
      role: "Owner",
      createdAt: new Date().toISOString()
    }
  ];
  try {
    const snapshot = await db.collection("staff").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ username: doc.id, ...doc.data() });
    });
    if (list.length > 0) {
      writeLocalJson(file, list);
      return list;
    }
    
    const initialStaff = readLocalJson(file, defaults);
    try {
      const batch = db.batch();
      initialStaff.forEach(s => {
        const { username, ...fields } = s;
        const ref = db.collection("staff").doc(username.trim().toLowerCase());
        batch.set(ref, fields);
      });
      await batch.commit();
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed staff in Firestore:", dbErr.message);
    }
    return initialStaff;
  } catch (err: any) {
    console.warn("[DB] Error in getStaff, falling back to local file:", err.message);
    return readLocalJson(file, defaults);
  }
}

export async function saveStaff(username: string, staffData: any): Promise<void> {
  const file = "staff.json";
  const key = username.trim().toLowerCase();
  const list = readLocalJson<any[]>(file, []);
  const idx = list.findIndex(s => s.username.trim().toLowerCase() === key);
  const cleanData = { ...staffData };
  delete cleanData.username;

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cleanData, username: key };
  } else {
    list.push({ ...cleanData, username: key });
  }
  writeLocalJson(file, list);

  try {
    await db.collection("staff").doc(key).set(cleanData, { merge: true });
  } catch (err: any) {
    console.warn("[DB] Failed to save staff to Firestore:", err.message);
  }
}

export async function deleteStaff(username: string): Promise<void> {
  const file = "staff.json";
  const key = username.trim().toLowerCase();
  const list = readLocalJson<any[]>(file, []);
  writeLocalJson(file, list.filter(s => s.username.trim().toLowerCase() !== key));

  try {
    await db.collection("staff").doc(key).delete();
  } catch (err: any) {
    console.warn("[DB] Failed to delete staff from Firestore:", err.message);
  }
}

// 5. Customer Booking Orders
export async function getOrders(): Promise<any[]> {
  const file = "orders.json";
  try {
    const snapshot = await db.collection("orders").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    if (list.length > 0) {
      writeLocalJson(file, list);
      return list;
    }
    
    const initialOrders = readLocalJson<any[]>(file, []);
    if (initialOrders.length > 0) {
      try {
        const batch = db.batch();
        initialOrders.forEach(o => {
          const { id, ...data } = o;
          const ref = db.collection("orders").doc(id);
          batch.set(ref, data);
        });
        await batch.commit();
      } catch (dbErr: any) {
        console.warn("[DB] Failed to seed orders in Firestore:", dbErr.message);
      }
    }
    return initialOrders;
  } catch (err: any) {
    console.warn("[DB] Error in getOrders, falling back to local file:", err.message);
    return readLocalJson<any[]>(file, []);
  }
}

export async function saveOrder(id: string, orderData: any): Promise<void> {
  const file = "orders.json";
  const list = readLocalJson<any[]>(file, []);
  const idx = list.findIndex(o => o.id === id);
  const cleanData = { ...orderData };
  delete cleanData.id;

  if (idx !== -1) {
    list[idx] = { ...list[idx], ...cleanData, id };
  } else {
    list.push({ ...cleanData, id });
  }
  writeLocalJson(file, list);

  try {
    await db.collection("orders").doc(id).set(cleanData, { merge: true });
  } catch (err: any) {
    console.warn("[DB] Failed to save order to Firestore:", err.message);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const file = "orders.json";
  const list = readLocalJson<any[]>(file, []);
  writeLocalJson(file, list.filter(o => o.id !== id));

  try {
    await db.collection("orders").doc(id).delete();
  } catch (err: any) {
    console.warn("[DB] Failed to delete order from Firestore:", err.message);
  }
}

// 6. Audit Logging
export async function getAudit(): Promise<any[]> {
  const file = "audit.json";
  try {
    const snapshot = await db.collection("audit").get();
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, ...doc.data() });
    });
    const sorted = list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    if (sorted.length > 0) {
      writeLocalJson(file, sorted);
      return sorted;
    }
    
    const initialLogs = readLocalJson<any[]>(file, []);
    if (initialLogs.length > 0) {
      try {
        const batch = db.batch();
        initialLogs.forEach(l => {
          const { id, ...data } = l;
          const ref = db.collection("audit").doc(id);
          batch.set(ref, data);
        });
        await batch.commit();
      } catch (dbErr: any) {
        console.warn("[DB] Failed to seed audit logs in Firestore:", dbErr.message);
      }
    }
    return initialLogs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  } catch (err: any) {
    console.warn("[DB] Error in getAudit, falling back to local file:", err.message);
    const list = readLocalJson<any[]>(file, []);
    return list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
  }
}

export async function addAuditLog(log: any): Promise<void> {
  const file = "audit.json";
  const list = readLocalJson<any[]>(file, []);
  const cleanData = { ...log };
  const id = log.id || ("log-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5));
  delete cleanData.id;

  list.push({ ...cleanData, id });
  writeLocalJson(file, list);

  try {
    await db.collection("audit").doc(id).set(cleanData);
  } catch (err: any) {
    console.warn("[DB] Failed to write audit log to Firestore:", err.message);
  }
}

export async function clearAuditLogs(): Promise<void> {
  const file = "audit.json";
  writeLocalJson(file, []);

  try {
    const snapshot = await db.collection("audit").get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err: any) {
    console.warn("[DB] Failed to clear audit logs from Firestore:", err.message);
  }
}

// 7. Announcement Ticker
export async function getTicker(): Promise<any> {
  const file = "ticker.json";
  const defaults = {
    nepali: [
      "नमस्ते र हार्दिक स्वागत छ !",
      "०% ब्याज दरमा सजिलो किस्ता (EMI) सुबिधा उपलब्ध !",
      "रुपन्देही जिल्लाभरि नि:शुल्क डेलिभरी !"
    ],
    english: [
      "Warm Welcome to Riaan Ko Pasal!",
      "[EMI] 0% Interest Easy EMI Installments Available!",
      "Free Delivery All Over Rupandehi District!"
    ]
  };
  try {
    const doc = await getSettingsDoc("ticker").get();
    if (doc.exists) {
      const data = doc.data();
      writeLocalJson(file, data);
      return data;
    }
    
    const initialTicker = readLocalJson(file, defaults);
    try {
      await getSettingsDoc("ticker").set(initialTicker);
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed ticker in Firestore:", dbErr.message);
    }
    return initialTicker;
  } catch (err: any) {
    console.warn("[DB] Error in getTicker, falling back to local file:", err.message);
    return readLocalJson(file, defaults);
  }
}

export async function saveTicker(tickerData: any): Promise<void> {
  const file = "ticker.json";
  writeLocalJson(file, tickerData);

  try {
    await getSettingsDoc("ticker").set(tickerData);
  } catch (err: any) {
    console.warn("[DB] Failed to save ticker to Firestore:", err.message);
  }
}

// 8. AI Bot Settings
export async function getBotConfig(): Promise<any> {
  const file = "bot.json";
  const defaults = {
    botName: "Riaan",
    welcomeMessage: "Namaste and welcome! Riaan is here to assist you.",
    systemInstruction: "You are 'Riaan's Smart Assistant'...",
    presetPrompts: []
  };
  try {
    const doc = await getSettingsDoc("bot").get();
    if (doc.exists) {
      const data = doc.data();
      writeLocalJson(file, data);
      return data;
    }
    
    const initialBot = readLocalJson(file, defaults);
    try {
      await getSettingsDoc("bot").set(initialBot);
    } catch (dbErr: any) {
      console.warn("[DB] Failed to seed bot config in Firestore:", dbErr.message);
    }
    return initialBot;
  } catch (err: any) {
    console.warn("[DB] Error in getBotConfig, falling back to local file:", err.message);
    return readLocalJson(file, defaults);
  }
}

export async function saveBotConfig(botData: any): Promise<void> {
  const file = "bot.json";
  writeLocalJson(file, botData);

  try {
    await getSettingsDoc("bot").set(botData);
  } catch (err: any) {
    console.warn("[DB] Failed to save bot config to Firestore:", err.message);
  }
}
