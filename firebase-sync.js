// ============================================================
// FIREBASE SYNC — BERKAH MULIA ADV
// Fungsi: baca/tulis data dari localStorage <-> Firebase
// AMAN: tidak menghapus data yang tidak diminta
// ============================================================

import {
  database, ref, set, get, update, onValue,
  dbPath, log
} from "./firebase-config.js";

// ============================================================
// DAFTAR KEY YANG DISINKRONKAN
// Tambahkan key lain di sini jika perlu
// ============================================================
export const SYNC_KEYS = [
  "BERKAH_MULIA_PAYROLL_SYNC_STATUS_V1",
  "BERKAH_MULIA_ABSENSI_MONTHLY_ARCHIVE_V1",
  "BM_COMPANY_CONTRACT_V1",
  "BERKAH_MULIA_BORONGAN_PAYROLL_V2",
  "BM_KAS_BESAR_ACTIVE_DB",
  "BM_OWNER_SNAPSHOT_V1",
  "BM_KAS_BESAR_IMPORT_EXCEL_V1",
  "BM_V3_FRESH_SALES_DB_V1",
  "BM_V3_FRESH_KAS_ACTIVE_DB",
  "BM_UNIFIED_MASTER_V3",
  "BM_SCHEMA_VERSION",
  "BM_INTEGRATION_UPDATED_AT",
  "BM_COMPANY_CONTRACT_V2",
  "BM_V3_KAS_LAST_SAVED_AT",
  "BM_KAS_PIN_SHA256",
  "BM_KAS_LAST_SAVED_AT",
  "BM_ABSENSI_GAJI_V4",
  "BM_PORTAL_SYNC_LOCAL_UPDATED_AT",
  "BM_BAGI_HASIL_SIMPLE_V1",
  "BERKAH_CLEAN_START_JULY_2026_V1",
  "BM_KAS_IMPORT_EXCEL_V1",
  "BM_ENTERPRISE_V1",
  "BM_COMPANY_CODE",
  "BM_V3_FRESH_KAS_BESAR",
  "BERKAH_SLIP_SELECTED_2026-07",
  "BM_V3_FRESH_ABSENSI_GAJI_V1",
  "BM_ACCOUNTING_TAX_V4",
  "BM_V3_PAYROLL_SYNC_STATUS_V1",
  "BERKAH_SLIP_SELECTED_2026-08",
  "BM_KAS_PIN_HASH",
  "BM_V3_FRESH_KAS",
  "BM_COMPANY_INFO",
  "BM_OWNER_SETTINGS",
  "BM_SYNC_META"
];

// ============================================================
// PUSH: localStorage → Firebase (backup ke cloud)
// ============================================================
export async function pushToFirebase(keys = SYNC_KEYS) {
  const result = { pushed: [], skipped: [], errors: [] };

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) { result.skipped.push(key); continue; }

      // Coba parse JSON, kalau gagal simpan sebagai string
      let value;
      try { value = JSON.parse(raw); }
      catch { value = raw; }

      await set(ref(database, dbPath("data", key)), {
        value: value,
        savedAt: new Date().toISOString(),
        source: "localStorage"
      });

      result.pushed.push(key);
      log(`✅ PUSH: ${key}`);
    } catch (err) {
      result.errors.push({ key, error: err.message });
      console.error(`❌ PUSH GAGAL: ${key}`, err);
    }
  }

  log("📤 PUSH selesai:", result);
  return result;
}

// ============================================================
// PULL: Firebase → localStorage (restore dari cloud)
// ============================================================
export async function pullFromFirebase(keys = SYNC_KEYS) {
  const result = { pulled: [], skipped: [], errors: [] };

  for (const key of keys) {
    try {
      const snap = await get(ref(database, dbPath("data", key)));
      if (!snap.exists()) { result.skipped.push(key); continue; }

      const data = snap.val();
      const value = data?.value ?? data;

      // Simpan ke localStorage sebagai JSON string
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }

      result.pulled.push(key);
      log(`✅ PULL: ${key}`);
    } catch (err) {
      result.errors.push({ key, error: err.message });
      console.error(`❌ PULL GAGAL: ${key}`, err);
    }
  }

  log("📥 PULL selesai:", result);
  return result;
}

// ============================================================
// AUTO-SYNC: localStorage → Firebase setiap N detik
// ============================================================
let autoSyncTimer = null;

export function startAutoSync(intervalMs = 60000) { // default 60 detik
  stopAutoSync();
  log(`▶️ Auto-sync ON (setiap ${intervalMs / 1000}s)`);
  autoSyncTimer = setInterval(() => {
    pushToFirebase().catch(e => console.error("Auto-sync error:", e));
  }, intervalMs);
}

export function stopAutoSync() {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
    log("⏹️ Auto-sync OFF");
  }
}

// ============================================================
// REALTIME LISTENER: Firebase → aplikasi (opsional)
// Pakai ini kalau mau live update antar device
// ============================================================
export function listenFirebase(key, callback) {
  const r = ref(database, dbPath("data", key));
  return onValue(r, (snap) => {
    if (!snap.exists()) return;
    const value = snap.val()?.value ?? snap.val();
    callback(value);
  });
}

// ============================================================
// BACKUP PENUH: dump semua key ke 1 file JSON
// ============================================================
export function exportBackupJSON() {
  const backup = {};
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try { backup[key] = JSON.parse(raw); }
    catch { backup[key] = raw; }
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `berkah_mulia_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  log("💾 Backup diunduh");
}

// ============================================================
// RESTORE: import file JSON backup → localStorage + Firebase
// ============================================================
export async function importBackupJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          const str = typeof value === "object" ? JSON.stringify(value) : String(value);
          localStorage.setItem(key, str);
          // Langsung push ke Firebase
          await set(ref(database, dbPath("data", key)), {
            value: value,
            savedAt: new Date().toISOString(),
            source: "restore"
          });
          count++;
        }
        log(`✅ Restore selesai: ${count} key`);
        resolve(count);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ============================================================
// CEK STATUS KONEKSI FIREBASE
// ============================================================
export async function checkFirebaseConnection() {
  try {
    await set(ref(database, dbPath("_health", "ping")), {
      at: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    log("✅ Firebase terhubung");
    return true;
  } catch (err) {
    console.error("❌ Firebase TIDAK terhubung:", err);
    return false;
  }
}