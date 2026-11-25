import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hostOf, hostFeatures, shannon } from '../../extension/lib/features.js';
import { META } from '../../extension/lib/meta.js';

const goldenFeatures = JSON.parse(readFileSync(new URL('../../model/golden_features.json', import.meta.url), 'utf8'));

describe('Ekstraksi Fitur Hostname (Fase 1)', () => {
  describe('Validasi terhadap golden_features.json (Acuan Python)', () => {
    for (const entry of goldenFeatures) {
      it(`Cocok persis dengan golden features untuk URL: ${entry.url}`, () => {
        const actual = hostFeatures(entry.url);
        const expected = entry.features;

        for (const [key, expVal] of Object.entries(expected)) {
          const actVal = actual[key];
          assert.notStrictEqual(actVal, undefined, `Fitur ${key} harus ada di hasil ekstraksi`);

          if (Number.isInteger(expVal)) {
            assert.strictEqual(
              actVal,
              expVal,
              `Nilai integer ${key} pada ${entry.url} tidak cocok (ekspektasi: ${expVal}, aktual: ${actVal})`
            );
          } else {
            const diff = Math.abs(actVal - expVal);
            assert.ok(
              diff <= 1e-9,
              `Nilai float ${key} pada ${entry.url} melebihi toleransi 1e-9 (ekspektasi: ${expVal}, aktual: ${actVal}, selisih: ${diff})`
            );
          }
        }
      });
    }
  });

  describe('Shannon Entropy', () => {
    it('Mengembalikan 0.0 untuk string kosong atau null/undefined', () => {
      assert.strictEqual(shannon(''), 0.0);
      assert.strictEqual(shannon(null), 0.0);
      assert.strictEqual(shannon(undefined), 0.0);
    });

    it('Mengembalikan 0.0 untuk string satu karakter tunggal berulang', () => {
      assert.strictEqual(shannon('aaaaa'), 0.0);
    });

    it('Menghitung entropi dengan benar untuk variasi karakter', () => {
      // String 'ab': n=2, -2 * (0.5 * log2(0.5)) = -2 * (0.5 * -1) = 1.0
      assert.strictEqual(shannon('ab'), 1.0);
    });
  });

  describe('Fungsi hostOf(url)', () => {
    it('Menangani URL tanpa skema dengan benar', () => {
      assert.strictEqual(hostOf('detik.com/berita'), 'detik.com');
      assert.strictEqual(hostOf('sub.example.com:8080/path'), 'sub.example.com');
    });

    it('Menghilangkan prefix www.', () => {
      assert.strictEqual(hostOf('https://www.google.com'), 'google.com');
      assert.strictEqual(hostOf('http://www.sub.domain.org/page'), 'sub.domain.org');
    });

    it('Mengonversi ke huruf kecil (lowercase)', () => {
      assert.strictEqual(hostOf('HTTP://WWW.EXAMPLE.COM/Path'), 'example.com');
    });

    it('Menangani alamat IPv4', () => {
      assert.strictEqual(hostOf('http://192.168.1.1:8080/'), '192.168.1.1');
    });

    it('Menghapus kurung siku pada alamat IPv6', () => {
      assert.strictEqual(hostOf('http://[2001:db8::1]:8080/path'), '2001:db8::1');
    });

    it('Menangani string kosong, null, undefined, dan URL tidak valid', () => {
      assert.strictEqual(hostOf(''), '');
      assert.strictEqual(hostOf(null), '');
      assert.strictEqual(hostOf(undefined), '');
      assert.strictEqual(hostOf('   '), '');
      assert.strictEqual(hostOf('http://[invalid-ipv6'), '');
      assert.strictEqual(hostOf('http://:80'), '');
    });
  });

  describe('Kasus Tepi (Edge Cases) pada hostFeatures(url)', () => {
    it('Kasus string kosong: seluruh nilai bernilai 0 atau aman', () => {
      const feat = hostFeatures('');
      assert.strictEqual(feat.host_len, 0);
      assert.strictEqual(feat.n_labels, 1);
      assert.strictEqual(feat.n_subdomains, 0);
      assert.strictEqual(feat.n_dots, 0);
      assert.strictEqual(feat.n_hyphens, 0);
      assert.strictEqual(feat.n_digits, 0);
      assert.strictEqual(feat.digit_ratio, 0.0);
      assert.strictEqual(feat.longest_label, 0);
      assert.strictEqual(feat.tld_len, 0);
      assert.strictEqual(feat.is_ip, 0);
      assert.strictEqual(feat.has_punycode, 0);
      assert.strictEqual(feat.is_free_hosting, 0);
      assert.strictEqual(feat.is_dynamic_dns, 0);
      assert.strictEqual(feat.risky_tld, 0);
      assert.strictEqual(feat.n_sensitive_kw, 0);
      assert.strictEqual(feat.entropy, 0.0);
    });

    it('Kasus second-level domain (co.id, go.id, ac.id)', () => {
      // kompas.co.id -> labels = [kompas, co, id], len 3, lastLabel 'id' (len 2), secondLast 'co' in SECOND_LEVEL
      // base = 3, n_sub = max(0, 3 - 3) = 0
      const f1 = hostFeatures('https://kompas.co.id');
      assert.strictEqual(f1.n_labels, 3);
      assert.strictEqual(f1.n_subdomains, 0);

      // portal.berita.co.id -> labels = [portal, berita, co, id], len 4
      // base = 3, n_sub = max(0, 4 - 3) = 1
      const f2 = hostFeatures('https://portal.berita.co.id');
      assert.strictEqual(f2.n_labels, 4);
      assert.strictEqual(f2.n_subdomains, 1);
    });

    it('Kasus domain biasa (.com, .org)', () => {
      // example.com -> labels = [example, com], base = 2, n_sub = max(0, 2 - 2) = 0
      const f1 = hostFeatures('https://example.com');
      assert.strictEqual(f1.n_subdomains, 0);

      // a.b.example.com -> labels = [a, b, example, com], len 4, base = 2, n_sub = 2
      const f2 = hostFeatures('https://a.b.example.com');
      assert.strictEqual(f2.n_subdomains, 2);
    });

    it('Kasus alamat IP (IPv4): n_subdomains harus 0 dan is_ip harus 1', () => {
      const f = hostFeatures('http://103.45.67.89');
      assert.strictEqual(f.is_ip, 1);
      assert.strictEqual(f.n_subdomains, 0);
      assert.strictEqual(f.n_digits, 9);
      assert.strictEqual(f.digit_ratio, 9 / 12);
    });

    it('Kasus IDN / Punycode: mendeteksi xn-- dan menghitung fitur dengan benar', () => {
      // Domain IDN m&uuml;nchen.de di URL diubah otomatis ke punycode xn--mnchen-3ya.de
      const f = hostFeatures('http://münchen.de');
      assert.strictEqual(f.has_punycode, 1);
      assert.ok(hostOf('http://münchen.de').includes('xn--'));
    });

    it('Kasus TLD berisiko (risky_tld)', () => {
      const f = hostFeatures('http://login-bca.xyz');
      assert.strictEqual(f.risky_tld, 1);
      assert.strictEqual(f.n_sensitive_kw, 1); // 'login'
    });

    it('Kasus Dynamic DNS dan Free Hosting', () => {
      const fDdns = hostFeatures('http://myaccount.duckdns.org');
      assert.strictEqual(fDdns.is_dynamic_dns, 1);
      assert.strictEqual(fDdns.n_sensitive_kw, 1); // 'account'

      const fFh = hostFeatures('http://secure-payment.firebaseapp.com');
      assert.strictEqual(fFh.is_free_hosting, 1);
      assert.strictEqual(fFh.n_sensitive_kw, 2); // 'secure', 'payment'
    });

    it('Memverifikasi urutan 16 fitur persis sesuai meta.features', () => {
      const f = hostFeatures('https://example.com');
      const keys = Object.keys(f);
      assert.deepStrictEqual(keys, META.features);
    });
  });
});
