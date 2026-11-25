import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_ALLOWLIST, matchesPattern, isAllowed } from '../../extension/lib/allowlist.js';

const allowlistJson = JSON.parse(
  readFileSync(new URL('../../extension/lib/allowlist.json', import.meta.url), 'utf8')
);

describe('Allowlist & Aturan Pencocokan Domain (Fase 3)', () => {
  describe('Integritas DEFAULT_ALLOWLIST', () => {
    it('DEFAULT_ALLOWLIST cocok dengan isi allowlist.json', () => {
      assert.deepStrictEqual(DEFAULT_ALLOWLIST, allowlistJson);
    });

    it('Tidak ada platform penampung konten pengguna (user-content) di allowlist', () => {
      const forbiddenHosts = [
        'docs.google.com',
        'sites.google.com',
        'drive.google.com',
        'github.io',
        'web.app',
        'firebaseapp.com',
        'weebly.com',
        'wixsite.com',
        'blogspot.com'
      ];

      for (const forbidden of forbiddenHosts) {
        assert.ok(
          !DEFAULT_ALLOWLIST.includes(forbidden),
          `Allowlist tidak boleh memuat platform konten pengguna: ${forbidden}`
        );
      }
    });

    it('Seluruh entri adalah host persis (tidak ada yang memakai wildcard)', () => {
      for (const entry of DEFAULT_ALLOWLIST) {
        assert.ok(!entry.startsWith('*.'), `Entri bawaan tidak boleh berawalan wildcard: ${entry}`);
      }
    });
  });

  describe('Fungsi matchesPattern()', () => {
    it('Mencocokkan hostname persis (exact match)', () => {
      assert.ok(matchesPattern('google.com', 'google.com'));
      assert.ok(matchesPattern('www.google.com', 'google.com'));
      assert.ok(matchesPattern('bca.co.id', 'bca.co.id'));
    });

    it('Mencocokkan pola wildcard *. hanya dengan batas titik', () => {
      assert.ok(matchesPattern('unesa.ac.id', '*.unesa.ac.id'));
      assert.ok(matchesPattern('sia.unesa.ac.id', '*.unesa.ac.id'));
      assert.ok(matchesPattern('sub.portal.unesa.ac.id', '*.unesa.ac.id'));
    });

    it('Menolak serangan domain mirip / subdomain suffix pada wildcard *.', () => {
      assert.ok(!matchesPattern('evilunesa.ac.id', '*.unesa.ac.id'));
      assert.ok(!matchesPattern('unesa.ac.id.evil.top', '*.unesa.ac.id'));
      assert.ok(!matchesPattern('fake-unesa.ac.id', '*.unesa.ac.id'));
    });
  });

  describe('Uji Pertahanan Serangan Penipuan Domain (Spoofing) pada isAllowed()', () => {
    it('Menolak google.com.evil.top (TIDAK boleh lolos allowlist)', () => {
      assert.strictEqual(isAllowed('google.com.evil.top'), false);
    });

    it('Menolak evilgoogle.com (TIDAK boleh lolos allowlist)', () => {
      assert.strictEqual(isAllowed('evilgoogle.com'), false);
    });

    it('Menolak accounts.google.com.evil.xyz (TIDAK boleh lolos allowlist)', () => {
      assert.strictEqual(isAllowed('accounts.google.com.evil.xyz'), false);
    });

    it('Menolak bca.co.id.phishing.click', () => {
      assert.strictEqual(isAllowed('bca.co.id.phishing.click'), false);
    });

    it('Menolak subdomain dari host exact jika tidak ada di allowlist (mis. docs.google.com)', () => {
      // google.com adalah exact match, bukan wildcard
      assert.strictEqual(isAllowed('docs.google.com'), false);
      assert.strictEqual(isAllowed('sites.google.com'), false);
      assert.strictEqual(isAllowed('drive.google.com'), false);
    });
  });

  describe('Situs Sah Populer di Allowlist Bawaan', () => {
    it('Meloloskan situs-situs yang terdaftar resmi', () => {
      assert.ok(isAllowed('google.com'));
      assert.ok(isAllowed('www.google.com'));
      assert.ok(isAllowed('accounts.google.com'));
      assert.ok(isAllowed('bca.co.id'));
      assert.ok(isAllowed('klikbca.com'));
      assert.ok(isAllowed('tokopedia.com'));
      assert.ok(isAllowed('shopee.co.id'));
      assert.ok(isAllowed('detik.com'));
      assert.ok(isAllowed('kompas.com'));
      assert.ok(isAllowed('djp.go.id'));
      assert.ok(isAllowed('pajak.go.id'));
    });
  });

  describe('Integrasi Whitelist Pribadi Pengguna', () => {
    it('Meloloskan host yang didaftarkan ke userWhitelist', () => {
      const userList = ['internal.kampus.ac.id', '*.mycompany.com'];
      assert.ok(isAllowed('internal.kampus.ac.id', DEFAULT_ALLOWLIST, userList));
      assert.ok(isAllowed('dashboard.mycompany.com', DEFAULT_ALLOWLIST, userList));
      assert.ok(isAllowed('mycompany.com', DEFAULT_ALLOWLIST, userList));

      // Domain lain yang tidak ada tetap ditolak
      assert.ok(!isAllowed('othercompany.com', DEFAULT_ALLOWLIST, userList));
      assert.ok(!isAllowed('evilmycompany.com', DEFAULT_ALLOWLIST, userList));
    });
  });
});
