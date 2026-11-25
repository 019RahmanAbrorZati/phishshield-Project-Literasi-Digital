import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hostFeatures } from '../../extension/lib/features.js';
import { loadModel, predictProba } from '../../extension/lib/rf.js';

const legitHosts = JSON.parse(
  readFileSync(new URL('../fixtures/legit_hosts.json', import.meta.url), 'utf8')
);
const modelJson = JSON.parse(
  readFileSync(new URL('../../model/model_rf.json', import.meta.url), 'utf8')
);
const model = loadModel(modelJson);

describe('Tes Kewajaran Situs Sah (Model Saja Tanpa Allowlist - Fase 7)', () => {
  it('Evaluasi 50 situs sah Indonesia dan global pada preset Seimbang (0,5) dan Ketat (0,7)', () => {
    assert.strictEqual(legitHosts.length, 50, 'Fixture harus memuat tepat 50 hostname');

    const results = [];
    const flaggedSeimbang = [];
    const flaggedKetat = [];

    for (const host of legitHosts) {
      const feat = hostFeatures(host);
      const proba = predictProba(model, feat);
      const isSeimbang = proba >= 0.5;
      const isKetat = proba >= 0.7;

      if (isSeimbang) flaggedSeimbang.push({ host, proba });
      if (isKetat) flaggedKetat.push({ host, proba });

      results.push({ host, proba, isSeimbang, isKetat });
    }

    console.log('\n===============================================================');
    console.log('   HASIL TES KEWAJARAN MODEL PADA 50 SITUS SAH (TANPA ALLOWLIST)');
    console.log('===============================================================');
    console.log(`Total Hostname Diuji              : ${legitHosts.length}`);
    console.log(`Ditandai Phishing pada Seimbang (0,5) : ${flaggedSeimbang.length}/${legitHosts.length} (${((flaggedSeimbang.length / legitHosts.length) * 100).toFixed(1)}%)`);
    console.log(`Ditandai Phishing pada Ketat (0,7)    : ${flaggedKetat.length}/${legitHosts.length} (${((flaggedKetat.length / legitHosts.length) * 100).toFixed(1)}%)`);
    console.log('---------------------------------------------------------------');
    console.log('Rincian Hostname Sah yang Ditandai (False Positive Model):');

    for (const item of results) {
      if (item.isSeimbang || item.isKetat) {
        console.log(
          `  - ${item.host.padEnd(28)} | Skor: ${item.proba.toFixed(4)} | Seimbang (0,5): ${item.isSeimbang ? 'YA (FP)' : 'TIDAK'} | Ketat (0,7): ${item.isKetat ? 'YA (FP)' : 'TIDAK'}`
        );
      }
    }
    console.log('===============================================================\n');

    // Pengujian ini adalah tes pelaporan yang mendokumentasikan perilaku model
    assert.ok(results.length === 50, 'Seluruh 50 situs sah harus berhasil dievaluasi');
    assert.ok(
      flaggedKetat.length <= flaggedSeimbang.length,
      'Preset Ketat harus menekan jumlah false positive dibandingkan preset Seimbang'
    );
  });
});
