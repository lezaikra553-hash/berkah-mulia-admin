// ============================================================
// FIREBASE CONFIG — BERKAH MULIA ADV
// JANGAN UBAH KONFIGURASI INI KECUALI DIMINTA ADMIN
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getDatabase, ref, set, get, update, child, onValue, remove, push }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ==== KONFIGURASI (JANGAN DIUBAH) ====
const firebaseConfig = {
  apiKey: "AIzaSyCZrhbD-US4tnMNTE4OM44GkttcfzvtylY",
  authDomain: "berkah-mulia.firebaseapp.com",
  databaseURL: "https://berkah-mulia-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "berkah-mulia",
  storageBucket: "berkah-mulia.firebasestorage.app",
  messagingSenderId: "936843128698",
  appId: "1:936843128698:web:1de517de4b836bb66770c3",
  measurementId: "G-YGP1582TJ9"
};

// ==== INIT ====
const app = initializeApp(firebaseConfig);
let analytics = null;
try { analytics = getAnalytics(app); } catch (e) { console.warn("Analytics skip:", e); }

const database = getDatabase(app);

// ==== ROOT PATH (semua data Berkah Mulia ada di sini) ====
export const ROOT_PATH = "berkah_mulia";

// ==== EXPORT ====
export { app, analytics, database, ref, set, get, update, child, onValue, remove, push };

// ==== HELPER: Path lengkap ====
export function dbPath(...parts) {
  return [ROOT_PATH, ...parts].filter(Boolean).join("/");
}

// ==== HELPER: Log dengan prefix ====
export function log(...args) {
  console.log("🔥 [BM-FIREBASE]", ...args);
}