import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { loadModel, predictProba, predict } from '../../extension/lib/rf.js';

const modelJson = JSON.parse(readFileSync(new URL('../../model/model_rf.json', import.meta.url), 'utf8'));
const goldenPredictions = JSON.parse(readFileSync(new URL('../../model/golden_predictions.json', import.meta.url), 'utf8'));

describe('Inferensi Random Forest (Fase 2)', () => {
  const model = loadModel(modelJson);

  describe('Fungsi loadModel()', () => {
    it('Berhasil memuat model valid dari objek JSON', () => {
      assert.strictEqual(model.feature_names.length, 16);
      assert.strictEqual(model.trees.length, 60);
      assert.strictEqual(model.threshold, 0.5);
    });

    it('Berhasil memuat model valid dari string JSON', () => {
      const loaded = loadModel(JSON.stringify(modelJson));
      assert.strictEqual(loaded.trees.length, 60);
    });

    it('Melemparkan error pada format model tidak valid', () => {
      assert.throws(() => loadModel(null), TypeError);
      assert.throws(() => loadModel({}), Error);
      assert.throws(() => loadModel({ feature_names: [] }), Error);
      assert.throws(() => loadModel({ feature_names: ['a'], trees: [] }), Error);
    });
  });

  describe('Validasi terhadap 300 Sampel golden_predictions.json', () => {
    it('Selisih probabilitas <= 1e-4 dan keputusan sama pada seluruh data uji', () => {
      let decisionMatches = 0;
      let probaWithinTolerance = 0;
      let maxDiff = 0;
      const total = goldenPredictions.length;

      for (let i = 0; i < total; i++) {
        const entry = goldenPredictions[i];
        const actualProba = predictProba(model, entry.features);
        const expectedProba = entry.proba;
        const diff = Math.abs(actualProba - expectedProba);

        if (diff > maxDiff) maxDiff = diff;
        if (diff <= 1e-4) probaWithinTolerance++;

        const actualDecision = actualProba >= model.threshold;
        const expectedDecision = expectedProba >= model.threshold;

        if (actualDecision === expectedDecision) {
          decisionMatches++;
        } else {
          assert.fail(
            `Kesesuaian keputusan gagal pada URL: ${entry.url}. Aktual: ${actualProba} (Phish: ${actualDecision}), Ekspektasi: ${expectedProba} (Phish: ${expectedDecision})`
          );
        }

        assert.ok(
          diff <= 1e-4,
          `Selisih proba pada ${entry.url} melebihi 1e-4: aktual ${actualProba}, ekspektasi ${expectedProba}, diff ${diff}`
        );
      }

      const matchRate = (decisionMatches / total) * 100;
      console.log(`\n  [Hasil Validasi Golden Predictions]`);
      console.log(`  - Total Sampel Uji: ${total}`);
      console.log(`  - Selisih Probabilitas Maksimum: ${maxDiff.toExponential(4)}`);
      console.log(`  - Probabilitas dalam Toleransi 1e-4: ${probaWithinTolerance}/${total} (${((probaWithinTolerance / total) * 100).toFixed(2)}%)`);
      console.log(`  - Kesesuaian Keputusan (>= 0.5): ${decisionMatches}/${total} (${matchRate.toFixed(2)}%)`);

      assert.strictEqual(decisionMatches, total, 'Kesesuaian keputusan harus 100%');
      assert.ok(matchRate >= 99.9, `Kesesuaian keputusan harus >= 99.9%, didapat: ${matchRate}%`);
    });

    it('Fungsi helper predict() mengembalikan struktur hasil yang benar', () => {
      const sample = goldenPredictions[0];
      const res = predict(model, sample.features);
      assert.strictEqual(typeof res.isPhishing, 'boolean');
      assert.strictEqual(typeof res.proba, 'number');
      assert.strictEqual(res.threshold, model.threshold);
      assert.strictEqual(res.isPhishing, res.proba >= model.threshold);
    });
  });

  describe('Pengukuran Performa Waktu Inferensi per URL', () => {
    it('Mengukur waktu inferensi rata-rata per URL di Node.js', () => {
      // Warm-up cache V8 JIT
      for (let i = 0; i < 50; i++) {
        predictProba(model, goldenPredictions[i % goldenPredictions.length].features);
      }

      const iterations = 50;
      const totalUrls = goldenPredictions.length * iterations;

      const start = performance.now();
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < goldenPredictions.length; i++) {
          predictProba(model, goldenPredictions[i].features);
        }
      }
      const end = performance.now();

      const totalTimeMs = end - start;
      const avgTimePerUrlMs = totalTimeMs / totalUrls;

      console.log(`\n  [Hasil Benchmark Inferensi Random Forest]`);
      console.log(`  - Total Evaluasi: ${totalUrls} prediksi (${iterations}x putaran pada 300 data)`);
      console.log(`  - Total Waktu Eksekusi: ${totalTimeMs.toFixed(2)} ms`);
      console.log(`  - Rata-rata Waktu per URL: ${avgTimePerUrlMs.toFixed(4)} ms (${(avgTimePerUrlMs * 1000).toFixed(1)} µs)`);
      console.log(`  - Throughput: ${(1000 / avgTimePerUrlMs).toFixed(0)} evaluasi URL per detik`);

      // Memastikan performa inferensi sangat cepat untuk ekstensi browser (< 1 ms per URL)
      assert.ok(
        avgTimePerUrlMs < 1.0,
        `Waktu inferensi harus < 1.0 ms per URL untuk menjaga responsivitas browser, didapat: ${avgTimePerUrlMs.toFixed(4)} ms`
      );
    });
  });
});
