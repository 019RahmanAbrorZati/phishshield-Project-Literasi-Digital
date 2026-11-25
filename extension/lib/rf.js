/**
 * PhishShield - Random Forest Inference Engine
 * Menjalankan inferensi Random Forest scikit-learn murni di sisi klien.
 * Menggunakan Math.fround (float32) dan traversal pohon biner.
 */

/**
 * Memuat dan memvalidasi objek model Random Forest.
 * @param {object|string} json - Objek JSON model atau string JSON
 * @returns {object} Objek model yang telah divalidasi
 */
export function loadModel(json) {
  const model = typeof json === 'string' ? JSON.parse(json) : json;
  if (!model || typeof model !== 'object') {
    throw new TypeError('Model harus berupa objek JSON yang valid');
  }
  if (!Array.isArray(model.feature_names) || model.feature_names.length === 0) {
    throw new Error('Format model tidak valid: feature_names harus berupa array');
  }
  if (!Array.isArray(model.trees) || model.trees.length === 0) {
    throw new Error('Format model tidak valid: trees harus berupa array berisi pohon');
  }
  return model;
}

/**
 * Menghitung probabilitas phishing dari objek fitur menggunakan model Random Forest.
 * - Mengurutkan nilai fitur sesuai feature_names dari model
 * - Mengonversi ke single-precision float (float32 / Math.fround)
 * - Melakukan traversal pohon: jika x <= threshold ke cabang kiri, selain itu ke cabang kanan
 * - Menghitung rata-rata probabilitas daun dari seluruh pohon
 *
 * @param {object} model - Model Random Forest dari loadModel()
 * @param {Record<string, number>} featureObj - Objek fitur (misal dari hostFeatures)
 * @returns {number} Probabilitas phishing (0.0 hingga 1.0)
 */
export function predictProba(model, featureObj) {
  if (!model || !Array.isArray(model.trees) || model.trees.length === 0) {
    throw new Error('Model Random Forest belum dimuat dengan benar');
  }

  const featureNames = model.feature_names;
  const nFeatures = featureNames.length;
  const featArr = new Float32Array(nFeatures);

  for (let i = 0; i < nFeatures; i++) {
    const name = featureNames[i];
    const val = featureObj[name] ?? 0;
    featArr[i] = Math.fround(Number(val));
  }

  const trees = model.trees;
  const nTrees = trees.length;
  let totalProb = 0;

  for (let t = 0; t < nTrees; t++) {
    const tree = trees[t];
    const left = tree.left;
    const right = tree.right;
    const feature = tree.feature;
    const threshold = tree.threshold;
    const prob = tree.prob;

    let node = 0;
    while (left[node] !== -1) {
      const featIdx = feature[node];
      const val = featArr[featIdx];
      const thresh = threshold[node];

      if (val <= thresh) {
        node = left[node];
      } else {
        node = right[node];
      }
    }
    totalProb += prob[node];
  }

  return totalProb / nTrees;
}

/**
 * Memprediksi apakah suatu URL berisiko phishing berdasarkan ambang batas (threshold).
 * @param {object} model - Model Random Forest
 * @param {Record<string, number>} featureObj - Objek fitur
 * @param {number} [threshold] - Ambang batas keputusan (default: model.threshold)
 * @returns {{ isPhishing: boolean, proba: number, threshold: number }}
 */
export function predict(model, featureObj, threshold = model.threshold ?? 0.5) {
  const proba = predictProba(model, featureObj);
  return {
    isPhishing: proba >= threshold,
    proba,
    threshold
  };
}
