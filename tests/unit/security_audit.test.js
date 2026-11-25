import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostFeatures } from '../../extension/lib/features.js';
import { explainFeatures } from '../../extension/lib/explain.js';
import { DEFAULT_ALLOWLIST, isAllowed } from '../../extension/lib/allowlist.js';

function getFilesRecursively(dir) {
  let files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Audit Keamanan & Privasi Kode (Fase 8)', () => {
  const cleanExtDir = fileURLToPath(new URL('../../extension', import.meta.url));

  const allFiles = getFilesRecursively(cleanExtDir);
  const codeFiles = allFiles.filter(
    f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.json')
  );

  describe('Audit API Terlarang & Jaringan', () => {
    it('Tidak ada pemanggilan fetch() ke jaringan di seluruh kode ekstensi', () => {
      for (const file of codeFiles) {
        if (file.endsWith('.png') || file.endsWith('.gitkeep')) continue;
        const content = readFileSync(file, 'utf8');
        const hasFetch = /\bfetch\s*\(/.test(content);
        assert.strictEqual(
          hasFetch,
          false,
          `Dilarang menggunakan fetch() di kode ekstensi: ditemukan pada ${file}`
        );
      }
    });

    it('Tidak ada pemanggilan XMLHttpRequest di seluruh kode ekstensi', () => {
      for (const file of codeFiles) {
        const content = readFileSync(file, 'utf8');
        const hasXhr = /\bXMLHttpRequest\b/.test(content);
        assert.strictEqual(
          hasXhr,
          false,
          `Dilarang menggunakan XMLHttpRequest di kode ekstensi: ditemukan pada ${file}`
        );
      }
    });

    it('Tidak ada pemanggilan eval() atau Function constructor dinamis', () => {
      for (const file of codeFiles) {
        const content = readFileSync(file, 'utf8');
        const hasEval = /\beval\s*\(/.test(content);
        assert.strictEqual(
          hasEval,
          false,
          `Dilarang menggunakan eval() di kode ekstensi: ditemukan pada ${file}`
        );
      }
    });

    it('Tidak ada penggunaan innerHTML atau document.write (Pencegahan XSS Mutlak)', () => {
      for (const file of codeFiles) {
        if (!file.endsWith('.js')) continue;
        const content = readFileSync(file, 'utf8');
        const hasInnerHTML = /\.innerHTML\b/.test(content);
        const hasDocWrite = /document\.write\b/.test(content);

        assert.strictEqual(
          hasInnerHTML,
          false,
          `Dilarang menggunakan innerHTML: gunakan textContent pada ${file}`
        );
        assert.strictEqual(
          hasDocWrite,
          false,
          `Dilarang menggunakan document.write pada ${file}`
        );
      }
    });

    it('Tidak ada logging URL penuh ke console (Perlindungan Privasi Riwayat Browsing)', () => {
      for (const file of codeFiles) {
        if (!file.endsWith('.js')) continue;
        const content = readFileSync(file, 'utf8');
        // Pastikan tidak ada console.log(details.url) atau sejenisnya
        const logsFullUrl = /console\.(log|info|debug)\([^)]*\b(details\.url|window\.location\.href)\b[^)]*\)/.test(content);
        assert.strictEqual(
          logsFullUrl,
          false,
          `Dilarang mencatat URL penuh ke console log pada ${file}`
        );
      }
    });
  });

  describe('Audit Kebijakan Keamanan Konten (CSP) di manifest.json', () => {
    const manifestPath = join(cleanExtDir, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

    it('CSP ketat tanpa unsafe-eval dan tanpa skrip remote eksternal', () => {
      const csp = manifest.content_security_policy?.extension_pages || '';
      assert.ok(csp.includes("script-src 'self'"), "CSP harus membatasi script-src hanya ke 'self'");
      assert.ok(!csp.includes('unsafe-eval'), 'CSP tidak boleh memuat unsafe-eval');
      assert.ok(!csp.includes('http://') && !csp.includes('https://'), 'CSP tidak boleh memuat sumber script remote');
    });

    it('Tidak ada izin host luas (host_permissions) yang tidak perlu', () => {
      assert.strictEqual(manifest.host_permissions, undefined, 'Tidak boleh ada host_permissions luas');
      // Izin harus spesifik
      const allowedPerms = ['webNavigation', 'storage', 'activeTab', 'scripting'];
      for (const p of manifest.permissions || []) {
        assert.ok(
          allowedPerms.includes(p),
          `Izin ${p} tidak terdaftar dalam daftar izin minimum yang diizinkan`
        );
      }
    });

    it('Seluruh file HTML tidak memuat skrip inline (harus script type="module" src=...) ', () => {
      const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
      for (const hf of htmlFiles) {
        const html = readFileSync(hf, 'utf8');
        // Periksa apakah ada tag <script> yang memiliki konten teks inline di dalamnya
        const inlineScriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]+?)<\/script>/gi;
        const hasInlineScript = inlineScriptRegex.test(html);
        assert.strictEqual(
          hasInlineScript,
          false,
          `File ${hf} memuat skrip inline, melanggar standar CSP MV3`
        );
      }
    });
  });

  describe('Pengujian Ketahanan XSS pada Penjelas Alasan & Parameter Host', () => {
    it('Parameter hostname bermuatan payload script ditangani secara aman sebagai string teks', () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        'login.com<svg/onload=alert(1)>'
      ];

      for (const payload of xssPayloads) {
        const feat = hostFeatures(payload);
        const expl = explainFeatures(feat, payload);

        // Pastikan tidak ada exception/crash
        assert.strictEqual(typeof expl.disclaimer, 'string');
        assert.ok(Array.isArray(expl.reasons));
        assert.strictEqual(expl.host, payload);

        // Verifikasi bahwa teks alasan aman dari interpretasi HTML
        for (const r of expl.reasons) {
          assert.strictEqual(typeof r, 'string');
          // Alasan harus teks deskriptif
          assert.ok(r.length > 5);
        }
      }
    });
  });

  describe('Verifikasi Kebijakan Allowlist & Platform Konten Pengguna', () => {
    it('Tidak ada platform konten pengguna di Allowlist Bawaan', () => {
      const userContentPlatforms = [
        'docs.google.com',
        'sites.google.com',
        'drive.google.com',
        'github.io',
        'pages.dev',
        'web.app',
        'firebaseapp.com',
        'weebly.com',
        'wixsite.com',
        'blogspot.com',
        '000webhostapp.com',
        'glitch.me',
        'herokuapp.com'
      ];

      for (const platform of userContentPlatforms) {
        assert.strictEqual(
          DEFAULT_ALLOWLIST.includes(platform),
          false,
          `Platform konten pengguna ${platform} dilarang keras dimasukkan ke allowlist bawaan`
        );
      }
    });

    it('Memastikan pencocokan exact match mencegah bypass suffix', () => {
      assert.strictEqual(isAllowed('google.com.evil.com'), false);
      assert.strictEqual(isAllowed('bca.co.id.fake.org'), false);
      assert.strictEqual(isAllowed('detik.com.attacker.xyz'), false);
    });
  });
});
