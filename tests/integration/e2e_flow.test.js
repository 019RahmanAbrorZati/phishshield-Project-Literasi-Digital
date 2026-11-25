import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hostOf, hostFeatures } from '../../extension/lib/features.js';
import { loadModel, predictProba, predict } from '../../extension/lib/rf.js';
import { explainFeatures } from '../../extension/lib/explain.js';
import { isAllowed } from '../../extension/lib/allowlist.js';

const modelJson = JSON.parse(
  readFileSync(new URL('../../model/model_rf.json', import.meta.url), 'utf8')
);
const model = loadModel(modelJson);

describe('Uji Integrasi Alur Penuh (End-to-End Pipeline - Fase 7)', () => {
  it('Alur URL Phishing: Ekstraksi -> Prediksi -> Keputusan -> Alasan', () => {
    const inputUrl = 'http://klikbca-verifikasi-akun-secure.web.app/login?id=123';

    // 1. Ekstraksi Host
    const host = hostOf(inputUrl);
    assert.strictEqual(host, 'klikbca-verifikasi-akun-secure.web.app');

    // 2. Allowlist Check (Bukan allowlist)
    const allowed = isAllowed(host);
    assert.strictEqual(allowed, false);

    // 3. Ekstraksi Fitur Hostname
    const features = hostFeatures(inputUrl);
    assert.strictEqual(features.is_free_hosting, 1);
    assert.strictEqual(features.n_sensitive_kw, 3); // verif, akun, secure
    assert.strictEqual(features.n_hyphens, 3);

    // 4. Inferensi Model Random Forest
    const score = predictProba(model, features);
    assert.ok(score >= 0.7, `Skor harus tinggi (>= 0.7), didapat: ${score}`);

    // 5. Keputusan Preset (Ketat 0.7 dan Seimbang 0.5)
    const decKetat = predict(model, features, 0.7);
    const decSeimbang = predict(model, features, 0.5);
    assert.strictEqual(decKetat.isPhishing, true);
    assert.strictEqual(decSeimbang.isPhishing, true);

    // 6. Penjelasan Alasan Risiko
    const explanation = explainFeatures(features, host);
    assert.ok(explanation.reasons.length <= 4);
    assert.ok(explanation.reasons.some(r => r.includes('hosting gratis')));
    assert.ok(explanation.reasons.some(r => r.includes('kata kunci sensitif')));
    assert.ok(explanation.disclaimer.includes('indikasi risiko'));
  });

  it('Alur URL Aman Terdaftar di Allowlist Bawaan', () => {
    const inputUrl = 'https://www.google.com/search?q=literasi+digital';

    const host = hostOf(inputUrl);
    assert.strictEqual(host, 'google.com');

    // Lolos allowlist langsung sebelum model
    const allowed = isAllowed(host);
    assert.strictEqual(allowed, true);
  });

  it('Alur URL Alamat IP Langsung', () => {
    const inputUrl = 'http://103.45.67.89/portal';

    const host = hostOf(inputUrl);
    assert.strictEqual(host, '103.45.67.89');

    const features = hostFeatures(inputUrl);
    assert.strictEqual(features.is_ip, 1);

    const explanation = explainFeatures(features, host);
    assert.ok(explanation.reasons[0].includes('alamat IP numerik'));
  });

  it('Alur URL Homograf Punycode (xn--)', () => {
    const inputUrl = 'http://xn--gogle-qqa.com/login';

    const host = hostOf(inputUrl);
    const features = hostFeatures(inputUrl);
    assert.strictEqual(features.has_punycode, 1);

    const explanation = explainFeatures(features, host);
    assert.ok(explanation.reasons.some(r => r.includes('Punycode')));
  });
});
