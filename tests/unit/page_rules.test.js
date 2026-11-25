import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluatePageRules,
  inspectPageHtml,
  RULES_DISCLAIMER
} from '../../extension/lib/page_rules.js';

const safePageHtml = readFileSync(
  new URL('../fixtures/pages/safe_page.html', import.meta.url),
  'utf8'
);
const phishingPageHtml = readFileSync(
  new URL('../fixtures/pages/phishing_page.html', import.meta.url),
  'utf8'
);

describe('Pemeriksaan Elemen Halaman Berbasis Aturan (Fase 6 Opsional)', () => {
  describe('Evaluasi Fixture HTML Lokal', () => {
    it('Halaman Aman (safe_page.html) tidak memicu peringatan berbahaya', () => {
      const result = inspectPageHtml(safePageHtml, 'https://portal-berita.id/artikel');

      assert.strictEqual(result.hasPasswordField, false, 'Tidak boleh ada field password');
      assert.strictEqual(result.hasExternalFormAction, false, 'Tidak boleh ada form eksternal');
      assert.strictEqual(result.hiddenIframeCount, 0, 'Tidak boleh ada hidden iframe');
      assert.strictEqual(result.totalIframeCount, 1, 'Memiliki 1 iframe normal');
      assert.ok(
        result.findings.some(f => f.rule === 'no_anomalies_found'),
        'Harus menghasilkan status tidak ada anomali'
      );
    });

    it('Halaman Phishing (phishing_page.html) mendeteksi 3 anomali heuristik', () => {
      const result = inspectPageHtml(phishingPageHtml, 'https://bank-login-tiruan.com/masuk');

      // 1. Password field terdeteksi
      assert.strictEqual(result.hasPasswordField, true);
      assert.ok(result.findings.some(f => f.rule === 'password_field_present'));

      // 2. Form mengirim data ke domain luar (attacker-server.xyz)
      assert.strictEqual(result.hasExternalFormAction, true);
      assert.ok(result.externalActions.some(url => url.includes('attacker-server.xyz')));
      assert.ok(result.findings.some(f => f.rule === 'external_form_action'));

      // 3. Iframe tersembunyi terdeteksi
      assert.strictEqual(result.hiddenIframeCount, 1);
      assert.ok(result.findings.some(f => f.rule === 'hidden_iframes_present'));
    });
  });

  describe('Fungsi evaluatePageRules() & Keterbatasan Heuristik', () => {
    it('Form dengan aksi relatif (/login) tidak dianggap sebagai cross-domain', () => {
      const res = evaluatePageRules({
        currentUrl: 'https://mysite.com/portal',
        hasPasswordField: true,
        forms: [{ action: '/api/login', method: 'POST' }],
        iframes: []
      });

      assert.strictEqual(res.hasExternalFormAction, false);
      assert.strictEqual(res.externalActions.length, 0);
    });

    it('Menyertakan teks disclaimer transparansi bahwa aturan bukan hasil ML', () => {
      const res = evaluatePageRules({
        currentUrl: 'https://example.com',
        hasPasswordField: false,
        forms: [],
        iframes: []
      });

      assert.strictEqual(res.disclaimer, RULES_DISCLAIMER);
      assert.ok(res.disclaimer.includes('aturan heuristik DOM'));
      assert.ok(res.disclaimer.includes('bukan hasil pembelajaran mesin (ML)'));
    });

    it('Menangani data input kosong / tidak valid dengan aman', () => {
      const res = evaluatePageRules(null);
      assert.strictEqual(res.hasPasswordField, false);
      assert.strictEqual(res.hasExternalFormAction, false);
      assert.strictEqual(res.hiddenIframeCount, 0);
      assert.strictEqual(res.findings.length, 1);
    });
  });
});
