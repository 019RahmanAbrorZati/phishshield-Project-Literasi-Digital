import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { explainFeatures, DISCLAIMER_TEXT } from '../../extension/lib/explain.js';

describe('Penjelas Alasan Risiko Hostname (explain.js - Fase 4)', () => {
  const baseFeatures = {
    host_len: 12,
    n_labels: 2,
    n_subdomains: 0,
    n_dots: 1,
    n_hyphens: 0,
    n_digits: 0,
    digit_ratio: 0.0,
    longest_label: 8,
    tld_len: 3,
    is_ip: 0,
    has_punycode: 0,
    is_free_hosting: 0,
    is_dynamic_dns: 0,
    risky_tld: 0,
    n_sensitive_kw: 0,
    entropy: 2.5
  };

  it('Menyertakan teks disclaimer bahwa hasil adalah indikasi bukan kepastian', () => {
    const res = explainFeatures(baseFeatures, 'example.com');
    assert.strictEqual(res.disclaimer, DISCLAIMER_TEXT);
    assert.ok(res.disclaimer.includes('indikasi risiko'));
    assert.ok(res.disclaimer.includes('bukan vonis kepastian'));
  });

  it('Mendeteksi penggunaan alamat IP langsung', () => {
    const res = explainFeatures({ ...baseFeatures, is_ip: 1 });
    assert.ok(res.reasons.some(r => r.includes('alamat IP numerik')));
  });

  it('Mendeteksi penggunaan Punycode / homograf', () => {
    const res = explainFeatures({ ...baseFeatures, has_punycode: 1 });
    assert.ok(res.reasons.some(r => r.includes('Punycode')));
  });

  it('Mendeteksi hosting gratis', () => {
    const res = explainFeatures({ ...baseFeatures, is_free_hosting: 1 });
    assert.ok(res.reasons.some(r => r.includes('hosting gratis')));
  });

  it('Mendeteksi Dynamic DNS', () => {
    const res = explainFeatures({ ...baseFeatures, is_dynamic_dns: 1 });
    assert.ok(res.reasons.some(r => r.includes('Dynamic DNS')));
  });

  it('Mendeteksi TLD berisiko tinggi', () => {
    const res = explainFeatures({ ...baseFeatures, risky_tld: 1 });
    assert.ok(res.reasons.some(r => r.includes('akhiran domain (TLD) yang berisiko')));
  });

  it('Mendeteksi kata kunci sensitif dengan jumlah kata yang tepat', () => {
    const res = explainFeatures({ ...baseFeatures, n_sensitive_kw: 3 });
    assert.ok(res.reasons.some(r => r.includes('Memuat 3 kata kunci sensitif')));
  });

  it('Mendeteksi banyak tanda hubung', () => {
    const res = explainFeatures({ ...baseFeatures, n_hyphens: 4 });
    assert.ok(res.reasons.some(r => r.includes('4 tanda hubung')));
  });

  it('Mendeteksi banyak subdomain', () => {
    const res = explainFeatures({ ...baseFeatures, n_subdomains: 3 });
    assert.ok(res.reasons.some(r => r.includes('3 tingkatan subdomain')));
  });

  it('Mendeteksi keacakan karakter / entropi tinggi', () => {
    const res = explainFeatures({ ...baseFeatures, entropy: 4.2 });
    assert.ok(res.reasons.some(r => r.includes('keacakan karakter')));
  });

  it('Membatasi maksimal 4 alasan terurut berdasarkan prioritas', () => {
    // Aktifkan banyak fitur sekaligus
    const multiFeatures = {
      ...baseFeatures,
      is_ip: 1, // priority 1
      has_punycode: 1, // priority 2
      is_free_hosting: 1, // priority 3
      is_dynamic_dns: 1, // priority 4
      risky_tld: 1, // priority 5
      n_sensitive_kw: 2, // priority 6
      n_hyphens: 3 // priority 7
    };
    const res = explainFeatures(multiFeatures, 'multi.test');
    assert.strictEqual(res.reasons.length, 4, 'Alasan maksimal harus tepat 4');
    // Memastikan alasan teratas adalah prioritas tertinggi
    assert.ok(res.reasons[0].includes('alamat IP numerik'));
    assert.ok(res.reasons[1].includes('Punycode'));
    assert.ok(res.reasons[2].includes('hosting gratis'));
    assert.ok(res.reasons[3].includes('Dynamic DNS'));
  });

  it('Tidak memuat klaim atau alasan di luar fitur model (mis. form login palsu)', () => {
    const allFeatures = {
      ...baseFeatures,
      is_ip: 1,
      is_free_hosting: 1,
      risky_tld: 1,
      n_sensitive_kw: 2
    };
    const res = explainFeatures(allFeatures, 'test.xyz');
    for (const r of res.reasons) {
      assert.ok(!r.toLowerCase().includes('formulir login'), 'Dilarang mengklaim formulir login');
      assert.ok(!r.toLowerCase().includes('konten halaman'), 'Dilarang mengklaim konten halaman');
      assert.ok(!r.toLowerCase().includes('sertifikat ssl'), 'Dilarang mengklaim SSL/HTTPS');
    }
  });

  it('Memberikan alasan default saat fitur spesifik tidak terpicu', () => {
    const res = explainFeatures(baseFeatures, 'safe.com');
    assert.strictEqual(res.reasons.length, 1);
    assert.ok(res.reasons[0].includes('Kombinasi struktur nama domain'));
  });
});
