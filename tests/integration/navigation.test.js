import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  handleNavigation,
  shouldInspectNavigation,
  getStorageState,
  setSessionBypass,
  PRESETS
} from '../../extension/background/service_worker.js';

// Setup Mock Chrome API di global scope
class MockChromeStorage {
  constructor() {
    this.store = {};
  }
  async get(keys) {
    if (typeof keys === 'string') {
      return { [keys]: this.store[keys] };
    }
    if (Array.isArray(keys)) {
      const res = {};
      for (const k of keys) res[k] = this.store[k];
      return res;
    }
    if (typeof keys === 'object' && keys !== null) {
      const res = {};
      for (const [k, defaultVal] of Object.entries(keys)) {
        res[k] = this.store[k] !== undefined ? this.store[k] : defaultVal;
      }
      return res;
    }
    return { ...this.store };
  }
  async set(items) {
    Object.assign(this.store, items);
  }
  clear() {
    this.store = {};
  }
}

describe('Integrasi Service Worker & Pemeriksaan Navigasi (Fase 3)', () => {
  let mockStorage;
  let mockSessionStorage;
  let tabUpdates = [];

  beforeEach(async () => {
    mockStorage = new MockChromeStorage();
    mockSessionStorage = new MockChromeStorage();
    tabUpdates = [];
    await setSessionBypass([]);

    globalThis.chrome = {
      runtime: {
        id: 'mock-phishshield-id',
        getURL: path => `chrome-extension://mock-phishshield-id/${path}`
      },
      storage: {
        local: mockStorage,
        session: mockSessionStorage
      },
      tabs: {
        update: async (tabId, props) => {
          tabUpdates.push({ tabId, ...props });
        }
      },
      webNavigation: {
        onBeforeNavigate: {
          addListener: () => {}
        }
      }
    };
  });

  afterEach(async () => {
    delete globalThis.chrome;
    await setSessionBypass([]);
  });

  describe('Filter Navigasi (shouldInspectNavigation)', () => {
    it('Menerima frame utama (frameId === 0) dengan protokol http dan https', () => {
      assert.ok(shouldInspectNavigation({ frameId: 0, url: 'https://example.com' }));
      assert.ok(shouldInspectNavigation({ frameId: 0, url: 'http://example.com' }));
    });

    it('Mengabaikan subframe (frameId !== 0)', () => {
      assert.ok(!shouldInspectNavigation({ frameId: 1, url: 'https://evil.com' }));
      assert.ok(!shouldInspectNavigation({ frameId: 2, url: 'http://phishing.xyz' }));
    });

    it('Mengabaikan skema non-web (chrome://, file://, dsb)', () => {
      assert.ok(!shouldInspectNavigation({ frameId: 0, url: 'chrome://extensions' }));
      assert.ok(!shouldInspectNavigation({ frameId: 0, url: 'chrome://settings' }));
      assert.ok(!shouldInspectNavigation({ frameId: 0, url: 'file:///C:/path/file.html' }));
      assert.ok(!shouldInspectNavigation({ frameId: 0, url: 'about:blank' }));
    });

    it('Mengabaikan halaman ekstensi sendiri (chrome-extension://)', () => {
      assert.ok(
        !shouldInspectNavigation({
          frameId: 0,
          url: 'chrome-extension://mock-phishshield-id/warning/warning.html'
        })
      );
    });
  });

  describe('Skenario Deteksi & Pengalihan Navigasi', () => {
    it('Situs aman di Allowlist Bawaan TIDAK dialihkan', async () => {
      const res = await handleNavigation({
        tabId: 101,
        frameId: 0,
        url: 'https://www.google.com'
      });

      assert.strictEqual(res.action, 'allow');
      assert.strictEqual(res.reason, 'allowlisted');
      assert.strictEqual(tabUpdates.length, 0, 'tabs.update tidak boleh dipanggil');
    });

    it('Situs perbankan di Allowlist Bawaan (klikbca.com) TIDAK dialihkan', async () => {
      const res = await handleNavigation({
        tabId: 102,
        frameId: 0,
        url: 'https://klikbca.com/login'
      });

      assert.strictEqual(res.action, 'allow');
      assert.strictEqual(res.reason, 'allowlisted');
      assert.strictEqual(tabUpdates.length, 0);
    });

    it('Host berbahaya berisiko tinggi DIALIHKAN ke halaman peringatan', async () => {
      // klikbca-verifikasi-akun-secure.web.app adalah sampel phishing pada golden_features
      const res = await handleNavigation({
        tabId: 103,
        frameId: 0,
        url: 'http://klikbca-verifikasi-akun-secure.web.app'
      });

      assert.strictEqual(res.action, 'redirect');
      assert.strictEqual(res.reason, 'phishing_detected');
      assert.strictEqual(tabUpdates.length, 1, 'tabs.update harus dipanggil 1 kali');
      assert.strictEqual(tabUpdates[0].tabId, 103);

      const redirectUrl = tabUpdates[0].url;
      assert.ok(
        redirectUrl.startsWith('chrome-extension://mock-phishshield-id/warning/warning.html'),
        'Harus mengalihkan ke warning.html'
      );
      assert.ok(
        redirectUrl.includes('host=klikbca-verifikasi-akun-secure.web.app'),
        'Parameter URL harus menyertakan hostname'
      );
      assert.ok(redirectUrl.includes('score='), 'Parameter URL harus menyertakan skor');
      // Pastikan tidak membocorkan path atau query lengkap
      assert.ok(
        !redirectUrl.includes('http://klikbca-verifikasi-akun-secure.web.app'),
        'URL peringatan tidak boleh memuat skema URL penuh'
      );
    });

    it('Host berbahaya yang dimasukkan ke Whitelist Pengguna TIDAK dialihkan', async () => {
      // Masukkan host ke whitelist pribadi
      await mockStorage.set({
        userWhitelist: ['klikbca-verifikasi-akun-secure.web.app']
      });

      const res = await handleNavigation({
        tabId: 104,
        frameId: 0,
        url: 'http://klikbca-verifikasi-akun-secure.web.app'
      });

      assert.strictEqual(res.action, 'allow');
      assert.strictEqual(res.reason, 'allowlisted');
      assert.strictEqual(tabUpdates.length, 0);
    });

    it('Host berbahaya dengan Bypass Sesi Aktif TIDAK dialihkan', async () => {
      // Simulasikan pengguna telah menekan tombol "Lanjutkan" di halaman warning
      await mockSessionStorage.set({
        sessionBypass: ['klikbca-verifikasi-akun-secure.web.app']
      });

      const res = await handleNavigation({
        tabId: 105,
        frameId: 0,
        url: 'http://klikbca-verifikasi-akun-secure.web.app'
      });

      assert.strictEqual(res.action, 'allow');
      assert.strictEqual(res.reason, 'session_bypassed');
      assert.strictEqual(tabUpdates.length, 0);
    });

    it('Serangan spoofing domain (google.com.evil.top) TIDAK lolos allowlist dan dievaluasi model', async () => {
      const res = await handleNavigation({
        tabId: 106,
        frameId: 0,
        url: 'http://google.com.evil.top'
      });

      // Domain ini berakhiran .top (risky TLD), dievaluasi model
      assert.notStrictEqual(res.reason, 'allowlisted');
    });

    it('Evaluasi Preset: Seimbang (0.5) vs Ketat (0.7)', async () => {
      // Cari contoh URL dari golden_predictions yang memiliki skor di antara 0.5 dan 0.7
      const goldenPreds = JSON.parse(
        readFileSync(new URL('../../model/golden_predictions.json', import.meta.url), 'utf8')
      );
      const intermediateSample = goldenPreds.find(p => p.proba >= 0.51 && p.proba < 0.69);

      if (intermediateSample) {
        // 1. Pada preset default 'ketat' (threshold 0.7): skor di bawah 0.7 diizinkan
        await mockStorage.set({ preset: 'ketat', userWhitelist: [], sessionBypass: [] });
        const resKetat = await handleNavigation({
          tabId: 107,
          frameId: 0,
          url: intermediateSample.url
        });
        assert.strictEqual(resKetat.action, 'allow');

        // 2. Pada preset 'seimbang' (threshold 0.5): skor di atas 0.5 dialihkan!
        await mockStorage.set({ preset: 'seimbang', userWhitelist: [], sessionBypass: [] });
        const resSeimbang = await handleNavigation({
          tabId: 108,
          frameId: 0,
          url: intermediateSample.url
        });
        assert.strictEqual(resSeimbang.action, 'redirect');
      }
    });
  });
});
