/**
 * PhishShield - Background Service Worker (Manifest V3)
 *
 * Mengawasi navigasi peramban pada frame utama (frameId === 0),
 * mengevaluasi risiko hostname via Random Forest murni di sisi klien,
 * dan mengalihkan ke halaman peringatan jika terindikasi phishing.
 */

import { hostOf, hostFeatures } from '../lib/features.js';
import { DEFAULT_ALLOWLIST, isAllowed } from '../lib/allowlist.js';
import { predictProba } from '../lib/rf.js';
import MODEL from '../lib/model_data.js';

// Ambang batas preset
export const PRESETS = {
  seimbang: 0.5,
  ketat: 0.7
};

export const DEFAULT_PRESET = 'ketat';

// Fallback in-memory jika chrome.storage.session tidak tersedia (misal di Node.js / unit test)
let memorySessionBypass = [];

/**
 * Mendapatkan daftar hostname yang dibypass untuk sesi saat ini.
 * Menggunakan chrome.storage.session (terhapus otomatis saat peramban ditutup).
 * @returns {Promise<string[]>}
 */
export async function getSessionBypass() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    try {
      const res = await chrome.storage.session.get({ sessionBypass: [] });
      return Array.isArray(res.sessionBypass) ? res.sessionBypass : [];
    } catch {
      return memorySessionBypass;
    }
  }
  return memorySessionBypass;
}

/**
 * Memperbarui daftar hostname yang dibypass untuk sesi saat ini.
 * @param {string[]} list
 */
export async function setSessionBypass(list) {
  memorySessionBypass = Array.isArray(list) ? list : [];
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
    try {
      await chrome.storage.session.set({ sessionBypass: memorySessionBypass });
    } catch {
      // tetap aman di memorySessionBypass
    }
  }
}

/**
 * Memuat model Random Forest dari model_data.js (Static Import).
 * @returns {Promise<object>} Objek model Random Forest
 */
export async function getModel() {
  return MODEL;
}

/**
 * Membaca pengaturan aktif dari chrome.storage.local dan sessionBypass dari chrome.storage.session.
 * @returns {Promise<{ preset: string, threshold: number, userWhitelist: string[], sessionBypass: string[] }>}
 */
export async function getStorageState() {
  const defaults = {
    preset: DEFAULT_PRESET,
    userWhitelist: []
  };

  const sessionBypass = await getSessionBypass();

  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return {
      ...defaults,
      threshold: PRESETS[DEFAULT_PRESET],
      sessionBypass
    };
  }

  const data = await chrome.storage.local.get(defaults);
  const activePreset = data.preset === 'seimbang' ? 'seimbang' : 'ketat';
  const threshold = PRESETS[activePreset];

  return {
    preset: activePreset,
    threshold,
    userWhitelist: Array.isArray(data.userWhitelist) ? data.userWhitelist : [],
    sessionBypass
  };
}

/**
 * Memeriksa apakah URL memenuhi syarat evaluasi:
 * - Hanya frame utama (frameId === 0)
 * - Hanya skema web http/https
 * - Mengabaikan skema non-web (chrome://, file://, chrome-extension://, dsb.)
 *
 * @param {{ frameId: number, url: string }} details
 * @returns {boolean}
 */
export function shouldInspectNavigation(details) {
  if (!details || details.frameId !== 0 || !details.url) {
    return false;
  }

  const url = details.url.trim().toLowerCase();

  // Abaikan skema non-web
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Abaikan halaman ekstensi sendiri
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    if (url.startsWith(`chrome-extension://${chrome.runtime.id}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Logika inti penanganan navigasi.
 * @param {{ tabId: number, frameId: number, url: string }} details
 * @returns {Promise<{ action: 'allow'|'redirect'|'ignored', host?: string, score?: number, reason?: string }>}
 */
export async function handleNavigation(details) {
  if (!shouldInspectNavigation(details)) {
    return { action: 'ignored', reason: 'non_target_navigation' };
  }

  const host = hostOf(details.url);
  if (!host) {
    return { action: 'ignored', reason: 'empty_host' };
  }

  const state = await getStorageState();

  // 1. Periksa Allowlist Bawaan dan Whitelist Pengguna
  if (isAllowed(host, DEFAULT_ALLOWLIST, state.userWhitelist)) {
    return { action: 'allow', host, reason: 'allowlisted' };
  }

  // 2. Periksa Bypass Sesi Aktif
  if (state.sessionBypass.includes(host)) {
    return { action: 'allow', host, reason: 'session_bypassed' };
  }

  // 3. Muat Model dan Lakukan Inferensi
  const model = await getModel();
  const features = hostFeatures(details.url);
  const score = predictProba(model, features);

  // 4. Pengambilan Keputusan berdasarkan Ambang Preset Aktif
  if (score >= state.threshold) {
    // Alihkan ke halaman peringatan (hanya menyertakan host dan skor, TANPA URL lengkap)
    const warningBase = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL('warning/warning.html')
      : 'warning/warning.html';

    const warningUrl = `${warningBase}?host=${encodeURIComponent(host)}&score=${encodeURIComponent(score.toFixed(4))}`;

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.update) {
      await chrome.tabs.update(details.tabId, { url: warningUrl });
    }

    return { action: 'redirect', host, score, reason: 'phishing_detected', redirectUrl: warningUrl };
  }

  return { action: 'allow', host, score, reason: 'safe_score' };
}

// Inisialisasi saat Service Worker aktif di lingkungan Chrome Extension
if (typeof chrome !== 'undefined' && chrome.webNavigation && chrome.webNavigation.onBeforeNavigate) {
  // Listener navigasi
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    try {
      await handleNavigation(details);
    } catch (err) {
      console.error('[PhishShield] Kesalahan pada penanganan navigasi:', err);
    }
  });

  // Inisialisasi storage saat ekstensi dipasang / diperbarui
  if (chrome.runtime && chrome.runtime.onInstalled) {
    chrome.runtime.onInstalled.addListener(async () => {
      const current = await chrome.storage.local.get(['preset', 'userWhitelist']);
      const updates = {};
      if (!current.preset) updates.preset = DEFAULT_PRESET;
      if (!Array.isArray(current.userWhitelist)) updates.userWhitelist = [];
      if (Object.keys(updates).length > 0) {
        await chrome.storage.local.set(updates);
      }
    });
  }

  // Message handler untuk komunikasi dengan popup dan warning page
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      (async () => {
        try {
          if (message.action === 'getSettings') {
            const state = await getStorageState();
            sendResponse({ success: true, ...state });
          } else if (message.action === 'setPreset') {
            const preset = message.preset === 'seimbang' ? 'seimbang' : 'ketat';
            await chrome.storage.local.set({ preset });
            sendResponse({ success: true, preset });
          } else if (message.action === 'addWhitelist') {
            const hostToAdd = String(message.host || '').toLowerCase().trim();
            if (hostToAdd) {
              const state = await getStorageState();
              const list = Array.from(new Set([...state.userWhitelist, hostToAdd]));
              await chrome.storage.local.set({ userWhitelist: list });
              sendResponse({ success: true, userWhitelist: list });
            } else {
              sendResponse({ success: false, error: 'Host kosong' });
            }
          } else if (message.action === 'removeWhitelist') {
            const hostToRemove = String(message.host || '').toLowerCase().trim();
            const state = await getStorageState();
            const list = state.userWhitelist.filter(h => h !== hostToRemove);
            await chrome.storage.local.set({ userWhitelist: list });
            sendResponse({ success: true, userWhitelist: list });
          } else if (message.action === 'addSessionBypass') {
            const hostToBypass = String(message.host || '').toLowerCase().trim();
            if (hostToBypass) {
              const currentBypass = await getSessionBypass();
              const list = Array.from(new Set([...currentBypass, hostToBypass]));
              await setSessionBypass(list);
              sendResponse({ success: true, sessionBypass: list });
            } else {
              sendResponse({ success: false, error: 'Host kosong' });
            }
          } else if (message.action === 'inspectUrl') {
            const targetUrl = message.url;
            const host = hostOf(targetUrl);
            const model = await getModel();
            const features = hostFeatures(targetUrl);
            const score = predictProba(model, features);
            const state = await getStorageState();
            const allowed = isAllowed(host, DEFAULT_ALLOWLIST, state.userWhitelist);
            sendResponse({ success: true, host, score, features, allowed, threshold: state.threshold });
          } else {
            sendResponse({ success: false, error: 'Aksi tidak dikenal' });
          }
        } catch (err) {
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true; // asynchronous response
    });
  }
}
