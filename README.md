# Riaan Ko Pasal — Premium Digital Store Hub 🛍️

Welcome to the official full-stack workspace of **Riaan Ko Pasal (Riaan Enterprises)**, located proudly in **Omsatiya-1, Thutipipal, Rupandehi, Nepal**! This is a modern, high-fidelity responsive web application designed for interactive customer browsing, 0% interest EMI calculations, direct and installment booking reservations, and an advanced AI Concierge Chatbot.

This repository is optimized for **Visual Studio Code (VS Code)** and local desktop development.

---

## 🚀 Quick Start (Local Setup)

To run this application locally on your computer, ensure you have **Node.js (version 18 or above)** installed, and follow these simple steps:

### 1. Extract and Open
Open the project directory in your terminal or launch **VS Code** and select *File -> Open Folder* on this workspace root.

### 2. Install Dependencies
Run the following standard command in your terminal to synchronize the project modules:
```bash
npm install
```

### 3. Setup Local Environment Variables
Create a file named `.env` in the root folder, and copy the default variables from `.env.example`:
```env
# Local Administrator Passcode (For staff dashboard access)
ADMIN_PASSCODE="riaan2026"
```
*(No complex Supabase credentials or database tokens are strictly required. If left blank, the app runs smoothly with offline JSON files in the `/data` directory as durable persistent fallbacks.)*

### 4. Boot the Development Server
Start the client + server combined full-stack environment by running:
```bash
npm run dev
```
Once initialized successfully, open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ VS Code Integration Goodies

We have pre-configured native VS Code behaviors inside the `.vscode/` directory to maximize your developer ergonomics:

*   **F5 Unified Debugging**: Open the **Run and Debug** tab in VS Code (`Ctrl+Shift+D` or `Cmd+Shift+D`) and choose:
    *   `Debug Server (npm run dev)`: Launches the backend server with immediate debug hooks.
    *   `Debug Client in Chrome`: Launches a browser attached to your client-side React code.
    *   `Full Stack App Debugger`: Launches and debugs both simultaneously.
*   **Automatic Tasks**: Run tests, code lints, package installations, and production builds directly via the VS Code Tasks menu (`Terminal -> Run Task...`).
*   **Tailwind Autocomplete CSS**: Auto-completion, validation, and hover info are enabled out-of-the-box for high-fidelity styled modifications.

---

## 📁 Workspace Architecture

The system uses a beautifully separated full-stack architecture (Express Backend + React 19 Client):

*   `backend/` : **Independent Backend Service Layer**
    *   `server.ts` : The primary Express gateway. Houses all `/api/*` endpoints for order bookings, custom reviews, audit logs, and the active products database. Serves the static React build in production.
    *   `db.ts` : The persistence layer. Connects to the cloud-hosted **Modular Firebase Firestore** database and handles safe local offline JSON caching fallback automatically.
*   `src/` : **Independent Frontend Client Layer (React + Vite)**
    *   `index.html` & `src/main.tsx` : SPA Entry points.
    *   `src/App.tsx` : Primary layout shell and navigation controller.
    *   `src/components/` : Modular UI components (e.g., `Catalog.tsx`, `ProductDetailPage.tsx`, `AdminSpreadsheet.tsx`, `ShoppingAI.tsx`).
*   `data/` : **Local Database Cache**
    *   Holds offline JSON backups used for local development or database connection fallbacks.

---

## 🌐 Running & Deploying Frontend and Backend Separately

If you prefer to decouple the frontend and backend completely (e.g., hosting the frontend on **Vercel/Netlify** and the backend API on **Render/Railway/Cloud Run**):

### 1. Running Separately on Local Machine
You can launch them independently on two different ports:
*   **Backend Server**: Inside `/backend/server.ts`, the Express app listens to `process.env.PORT || 3000`. You can start it using `npx tsx backend/server.ts`.
*   **Frontend Client**: Run Vite's development server directly with `npx vite` (which typically runs on port `5173`). Update `vite.config.ts` to add a proxy for `/api` requests to `http://localhost:3000`.

### 2. Deploying Separately to Production
*   **Frontend (Vercel / Netlify / Firebase Hosting)**:
    *   Your build command is `npm run build` (or `vite build`).
    *   Your build output directory is `dist/`.
    *   Configure an environment variable (e.g. `VITE_API_URL=https://your-backend-api.onrender.com`) and update your frontend fetch calls (e.g. in `/src`) to request `${import.meta.env.VITE_API_URL}/api/...` instead of relative paths.
*   **Backend (Render / Railway / Google Cloud Run)**:
    *   Create a clean standalone repository containing the `/backend` folder and `package.json`.
    *   Remove Vite-specific middleware from `server.ts` (the parts that check `process.env.NODE_ENV !== "production"` and call `createViteServer()`) since the backend will run purely as an API server.
    *   Set the start script to `tsx backend/server.ts` or bundle with `esbuild`.

---

## 📦 Bundling & Deployment (Integrated Mode)

To build a fully optimized, single-container production-ready release package:

```bash
npm run build
```
This single command:
1.  Compiles the React frontend assets into static files inside `dist/`.
2.  Bundles the Express backend `backend/server.ts` into a self-contained, high-performance CJS file at `dist/server.cjs` using `esbuild`.

To verify this integrated production build locally, run:
```bash
npm start
```

---

*“हामी ठुटिपिपल रुपन्देही बासीहरूको सेवामा समर्पित छौं”* (Serving Rupandehi, Lumbini area with pride.)
