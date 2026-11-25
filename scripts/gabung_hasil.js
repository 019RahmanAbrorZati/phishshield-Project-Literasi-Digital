/**
 * PhishShield - Skrip Agregator Hasil Literasi Digital
 *
 * Menggabungkan beberapa file CSV hasil ekspor dari banyak responden/peramban
 * menjadi satu tabel gabungan, serta menghitung rata-rata skor Pre-test, Post-test,
 * dan selisih peningkatannya (gain score).
 *
 * Menangani kasus tepi:
 * - File CSV kosong / tanpa data
 * - ID ganda (mengambil entri terbaru berdasarkan timestamp)
 * - Responden yang hanya memiliki Pre-test (tanpa Post-test)
 */
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Mem-parsing string CSV menjadi array objek record.
 * @param {string} csvText - Konten teks file CSV
 * @returns {Array<{ id: string, mode: string, score: number, correct_count: number, total_questions: number, timestamp: string }>}
 */
export function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return []; // Hanya header atau kosong

  const headerLine = lines[0].toLowerCase().trim();
  const headers = headerLine.split(',').map(h => h.trim());

  const idIdx = headers.indexOf('id');
  const modeIdx = headers.indexOf('mode');
  const scoreIdx = headers.indexOf('score');
  const correctIdx = headers.indexOf('correct_count') !== -1 ? headers.indexOf('correct_count') : headers.indexOf('correctcount');
  const totalIdx = headers.indexOf('total_questions') !== -1 ? headers.indexOf('total_questions') : headers.indexOf('totalquestions');
  const timeIdx = headers.indexOf('timestamp');

  if (idIdx === -1 || modeIdx === -1 || scoreIdx === -1) {
    return []; // Format tidak valid
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    const id = cols[idIdx];
    const mode = cols[modeIdx]?.toLowerCase();
    const score = parseFloat(cols[scoreIdx]);

    if (!id || (mode !== 'pre' && mode !== 'post') || isNaN(score)) {
      continue; // Lewati baris tidak valid
    }

    records.push({
      id,
      mode,
      score,
      correct_count: correctIdx !== -1 && !isNaN(parseInt(cols[correctIdx])) ? parseInt(cols[correctIdx]) : Math.round(score / 10),
      total_questions: totalIdx !== -1 && !isNaN(parseInt(cols[totalIdx])) ? parseInt(cols[totalIdx]) : 10,
      timestamp: timeIdx !== -1 ? cols[timeIdx] : new Date().toISOString()
    });
  }

  return records;
}

/**
 * Mengagregasi daftar records dari berbagai file, menyaring duplikasi ID,
 * dan menghitung statistik pre vs post.
 * @param {Array<{ id: string, mode: string, score: number, timestamp: string }>} records
 * @returns {{
 *   uniqueRecords: Array<object>,
 *   respondents: Array<{ id: string, preScore: number|null, postScore: number|null, gain: number|null }>,
 *   stats: {
 *     totalRespondents: number,
 *     preCount: number,
 *     postCount: number,
 *     pairedCount: number,
 *     avgPre: number,
 *     avgPost: number,
 *     avgGainPaired: number
 *   }
 * }}
 */
export function aggregateRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      uniqueRecords: [],
      respondents: [],
      stats: {
        totalRespondents: 0,
        preCount: 0,
        postCount: 0,
        pairedCount: 0,
        avgPre: 0,
        avgPost: 0,
        avgGainPaired: 0
      }
    };
  }

  // Tangani duplikasi ID untuk mode yang sama: simpan entri terbaru berdasarkan timestamp
  const mapKey = (id, mode) => `${id}:::${mode}`;
  const latestRecordsMap = new Map();

  for (const r of records) {
    const key = mapKey(r.id, r.mode);
    if (!latestRecordsMap.has(key)) {
      latestRecordsMap.set(key, r);
    } else {
      const existing = latestRecordsMap.get(key);
      const existingTime = new Date(existing.timestamp || 0).getTime();
      const newTime = new Date(r.timestamp || 0).getTime();
      if (newTime >= existingTime) {
        latestRecordsMap.set(key, r);
      }
    }
  }

  const uniqueRecords = Array.from(latestRecordsMap.values());

  // Kelompokkan per responden
  const respondentMap = new Map();

  for (const r of uniqueRecords) {
    if (!respondentMap.has(r.id)) {
      respondentMap.set(r.id, {
        id: r.id,
        preScore: null,
        postScore: null,
        gain: null
      });
    }

    const resp = respondentMap.get(r.id);
    if (r.mode === 'pre') {
      resp.preScore = r.score;
    } else if (r.mode === 'post') {
      resp.postScore = r.score;
    }
  }

  // Hitung gain untuk responden berpasangan (paired)
  let sumPre = 0;
  let countPre = 0;
  let sumPost = 0;
  let countPost = 0;
  let sumGainPaired = 0;
  let pairedCount = 0;

  const respondents = Array.from(respondentMap.values());

  for (const resp of respondents) {
    if (resp.preScore !== null) {
      sumPre += resp.preScore;
      countPre++;
    }
    if (resp.postScore !== null) {
      sumPost += resp.postScore;
      countPost++;
    }
    if (resp.preScore !== null && resp.postScore !== null) {
      resp.gain = Number((resp.postScore - resp.preScore).toFixed(2));
      sumGainPaired += resp.gain;
      pairedCount++;
    }
  }

  const avgPre = countPre > 0 ? Number((sumPre / countPre).toFixed(2)) : 0;
  const avgPost = countPost > 0 ? Number((sumPost / countPost).toFixed(2)) : 0;
  const avgGainPaired = pairedCount > 0 ? Number((sumGainPaired / pairedCount).toFixed(2)) : 0;

  return {
    uniqueRecords,
    respondents,
    stats: {
      totalRespondents: respondents.length,
      preCount: countPre,
      postCount: countPost,
      pairedCount,
      avgPre,
      avgPost,
      avgGainPaired
    }
  };
}

/**
 * Menggabungkan beberapa file CSV di disk dan opsional menulis hasilnya ke file output.
 * @param {string[]} filePaths - Daftar path file CSV input
 * @param {string} [outputPath] - Path file CSV output opsional
 * @returns {{ combinedCsv: string, stats: object }}
 */
export function mergeCsvFiles(filePaths, outputPath = null) {
  const allRecords = [];

  for (const p of filePaths) {
    try {
      const content = readFileSync(p, 'utf8');
      const parsed = parseCsv(content);
      allRecords.push(...parsed);
    } catch (err) {
      console.warn(`[Peringatan] Gagal membaca file: ${p} (${err.message})`);
    }
  }

  const { uniqueRecords, stats, respondents } = aggregateRecords(allRecords);

  // Buat CSV gabungan terurut
  const headers = ['id', 'mode', 'score', 'correct_count', 'total_questions', 'timestamp'];
  const lines = [headers.join(',')];

  uniqueRecords.sort((a, b) => a.id.localeCompare(b.id) || a.mode.localeCompare(b.mode));

  for (const r of uniqueRecords) {
    lines.push([
      r.id,
      r.mode,
      r.score,
      r.correct_count,
      r.total_questions,
      r.timestamp
    ].join(','));
  }

  const combinedCsv = lines.join('\n');

  if (outputPath) {
    writeFileSync(outputPath, combinedCsv, 'utf8');
  }

  return { combinedCsv, stats, respondents };
}

// Eksekusi CLI jika dipanggil langsung via node scripts/gabung_hasil.js
if (process.argv[1] && process.argv[1].endsWith('gabung_hasil.js')) {
  const args = process.argv.slice(2);
  const inputFiles = [];
  let outputFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o' && i + 1 < args.length) {
      outputFile = args[++i];
    } else {
      inputFiles.push(args[i]);
    }
  }

  if (inputFiles.length === 0) {
    console.log('Penggunaan: node scripts/gabung_hasil.js <file1.csv> <file2.csv> ... [-o output.csv]');
    process.exit(0);
  }

  const { stats, respondents } = mergeCsvFiles(inputFiles, outputFile);

  console.log('\n=================================================');
  console.log('   HASIL AGREGASI DATA LITERASI PHISHING');
  console.log('=================================================');
  console.log(`Total Responden Terdaftar : ${stats.totalRespondents}`);
  console.log(`Responden Pre-Test        : ${stats.preCount}`);
  console.log(`Responden Post-Test       : ${stats.postCount}`);
  console.log(`Responden Lengkap (Pair)  : ${stats.pairedCount}`);
  console.log(`Rata-rata Skor Pre-Test   : ${stats.avgPre}`);
  console.log(`Rata-rata Skor Post-Test  : ${stats.avgPost}`);
  console.log(`Rata-rata Peningkatan     : ${stats.avgGainPaired >= 0 ? '+' : ''}${stats.avgGainPaired}`);
  console.log('=================================================\n');

  if (outputFile) {
    console.log(`[Sukses] File gabungan disimpan ke: ${outputFile}`);
  }
}
