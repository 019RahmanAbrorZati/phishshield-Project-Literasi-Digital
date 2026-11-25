/**
 * PhishShield - Education & Quiz Controller
 * Mengelola navigasi materi, kuis pre-test & post-test, kalkulasi skor,
 * penyimpanan lokal anonim, dan ekspor data ke format CSV.
 */
import { QUIZ_BANK } from './quiz_data.js';

/**
 * Menghitung skor kuis berdasarkan pilihan jawaban pengguna.
 * @param {Record<number, number>} userAnswers - Map nomor soal (1-based) ke indeks pilihan (0-based)
 * @param {Array<{ id: number, answer: number }>} questions - Daftar soal
 * @returns {{ correctCount: number, totalQuestions: number, score: number, details: Array<{ id: number, isCorrect: boolean, userAnswer: number, correctAnswer: number }> }}
 */
export function scoreQuiz(userAnswers, questions) {
  let correctCount = 0;
  const totalQuestions = questions.length;
  const details = [];

  for (let i = 0; i < totalQuestions; i++) {
    const q = questions[i];
    const userChoice = userAnswers[q.id];
    const isCorrect = userChoice === q.answer;
    if (isCorrect) correctCount++;
    details.push({
      id: q.id,
      isCorrect,
      userAnswer: userChoice,
      correctAnswer: q.answer
    });
  }

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  return { correctCount, totalQuestions, score, details };
}

/**
 * Mengonversi daftar riwayat hasil kuis menjadi format string CSV.
 * @param {Array<{ id: string, mode: string, score: number, correctCount: number, totalQuestions: number, timestamp: string }>} records
 * @returns {string} String CSV
 */
export function formatRecordsAsCsv(records) {
  const headers = ['id', 'mode', 'score', 'correct_count', 'total_questions', 'timestamp'];
  const rows = [headers.join(',')];

  if (Array.isArray(records)) {
    for (const r of records) {
      const row = [
        String(r.id || '').replace(/,/g, ''),
        String(r.mode || '').replace(/,/g, ''),
        r.score ?? 0,
        r.correctCount ?? r.correct_count ?? 0,
        r.totalQuestions ?? r.total_questions ?? 0,
        String(r.timestamp || '').replace(/,/g, '')
      ];
      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

/**
 * Menghitung statistik ringkasan rata-rata skor pre-test, post-test, dan selisihnya.
 * @param {Array<{ mode: string, score: number }>} records
 * @returns {{ avgPre: number, avgPost: number, gain: number, preCount: number, postCount: number }}
 */
export function calculateStats(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return { avgPre: 0, avgPost: 0, gain: 0, preCount: 0, postCount: 0 };
  }

  let sumPre = 0;
  let countPre = 0;
  let sumPost = 0;
  let countPost = 0;

  for (const r of records) {
    if (r.mode === 'pre') {
      sumPre += Number(r.score) || 0;
      countPre++;
    } else if (r.mode === 'post') {
      sumPost += Number(r.score) || 0;
      countPost++;
    }
  }

  const avgPre = countPre > 0 ? sumPre / countPre : 0;
  const avgPost = countPost > 0 ? sumPost / countPost : 0;
  const gain = avgPost - avgPre;

  return {
    avgPre: Number(avgPre.toFixed(1)),
    avgPost: Number(avgPost.toFixed(1)),
    gain: Number(gain.toFixed(1)),
    preCount: countPre,
    postCount: countPost
  };
}

// Inisialisasi DOM jika berada di lingkungan peramban
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inisialisasi ID Responden Anonim
    let respondentId = 'resp_' + Math.random().toString(36).substring(2, 10);
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get('respondent_id');
        if (stored.respondent_id) {
          respondentId = stored.respondent_id;
        } else {
          await chrome.storage.local.set({ respondent_id: respondentId });
        }
      }
    } catch (err) {
      console.warn('Gagal memuat respondent_id:', err);
    }

    const respIdEl = document.getElementById('display-resp-id');
    if (respIdEl) respIdEl.textContent = respondentId;

    // 2. Tab Navigation
    const tabs = document.querySelectorAll('.edu-tab-btn');
    const panes = document.querySelectorAll('.edu-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');

        if (targetId === 'pane-results') {
          loadAndRenderResults();
        }
      });
    });

    // 3. Render Pre-Test & Post-Test
    renderQuizPlayer('pane-pretest', 'pretest', QUIZ_BANK.pretest, respondentId);
    renderQuizPlayer('pane-posttest', 'posttest', QUIZ_BANK.posttest, respondentId);

    // 4. Inisialisasi Hasil & Ekspor
    await loadAndRenderResults();

    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
      btnExport.addEventListener('click', async () => {
        const records = await getStoredResults();
        const csvContent = formatRecordsAsCsv(records);
        downloadCsv(csvContent, `phishshield_results_${respondentId}.csv`);
      });
    }

    const btnClear = document.getElementById('btn-clear-results');
    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pengujian lokal ini?')) {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ quiz_results: [] });
          }
          await loadAndRenderResults();
        }
      });
    }
  });
}

/**
 * Merender form kuis interaktif (soal, pilihan, submit, feedback).
 */
function renderQuizPlayer(containerId, modeKey, questions, respondentId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  const isPre = modeKey === 'pretest';
  const modeLabel = isPre ? 'Pre-Test' : 'Post-Test';
  const modeCode = isPre ? 'pre' : 'post';

  // Header Card
  const headerCard = document.createElement('div');
  headerCard.className = 'quiz-header-card';
  const h2 = document.createElement('h2');
  h2.textContent = `Evaluasi ${modeLabel} (10 Soal Skenario)`;
  const pDesc = document.createElement('p');
  pDesc.className = 'section-desc';
  pDesc.textContent = isPre
    ? 'Kerjakan soal-soal berikut untuk mengukur pemahaman awal Anda sebelum membaca modul materi.'
    : 'Kerjakan soal-soal berikut setelah membaca modul untuk mengukur peningkatan pemahaman literasi digital Anda.';
  headerCard.appendChild(h2);
  headerCard.appendChild(pDesc);
  container.appendChild(headerCard);

  // Form container
  const form = document.createElement('form');
  form.className = 'quiz-form';
  const userAnswers = {};

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-${modeKey}-${q.id}`;

    const numBadge = document.createElement('span');
    numBadge.className = 'question-num';
    numBadge.textContent = `Soal ${idx + 1} dari ${questions.length}`;

    const scenarioEl = document.createElement('p');
    scenarioEl.className = 'question-scenario';
    scenarioEl.textContent = q.scenario;

    card.appendChild(numBadge);
    card.appendChild(scenarioEl);

    if (q.url) {
      const urlBox = document.createElement('div');
      urlBox.className = 'question-url-box';
      urlBox.textContent = `Contoh Tautan: ${q.url}`;
      card.appendChild(urlBox);
    }

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';

    q.options.forEach((optText, optIdx) => {
      const label = document.createElement('label');
      label.className = 'option-item';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `ans-${modeKey}-${q.id}`;
      radio.value = String(optIdx);
      radio.required = true;

      radio.addEventListener('change', () => {
        userAnswers[q.id] = optIdx;
        label.parentElement.querySelectorAll('.option-item').forEach(it => it.classList.remove('selected'));
        label.classList.add('selected');
      });

      const spanText = document.createElement('span');
      spanText.className = 'option-text';
      spanText.textContent = `${String.fromCharCode(65 + optIdx)}. ${optText}`;

      label.appendChild(radio);
      label.appendChild(spanText);
      optionsList.appendChild(label);
    });

    card.appendChild(optionsList);

    // Placeholder feedback penjelasan
    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'quiz-feedback';
    feedbackBox.style.display = 'none';
    card.appendChild(feedbackBox);

    form.appendChild(card);
  });

  // Tombol Kirim
  const submitBar = document.createElement('div');
  submitBar.className = 'quiz-submit-bar';
  const btnSubmit = document.createElement('button');
  btnSubmit.type = 'submit';
  btnSubmit.className = 'btn btn-primary';
  btnSubmit.textContent = `Kirim Jawaban & Lihat Pembahasan ${modeLabel}`;
  submitBar.appendChild(btnSubmit);
  form.appendChild(submitBar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.disabled = true;

    const result = scoreQuiz(userAnswers, questions);

    // Tampilkan pembahasan pada tiap soal
    questions.forEach(q => {
      const card = document.getElementById(`q-${modeKey}-${q.id}`);
      if (!card) return;
      const feedback = card.querySelector('.quiz-feedback');
      if (!feedback) return;

      const isCorrect = userAnswers[q.id] === q.answer;
      feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
      feedback.style.display = 'block';

      while (feedback.firstChild) feedback.removeChild(feedback.firstChild);

      const strongStatus = document.createElement('strong');
      strongStatus.textContent = isCorrect ? '✓ Jawaban Anda Benar! ' : '✗ Jawaban Kurang Tepat. ';

      const expText = document.createElement('span');
      expText.textContent = q.explanation;

      feedback.appendChild(strongStatus);
      feedback.appendChild(expText);
    });

    // Simpan hasil ke storage
    const newRecord = {
      id: respondentId,
      mode: modeCode,
      score: result.score,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString('id-ID')
    };

    await saveQuizResult(newRecord);

    alert(`Evaluasi ${modeLabel} Selesai!\nSkor Anda: ${result.score} (${result.correctCount}/${result.totalQuestions} Benar)\nSilakan periksa pembahasan di bawah.`);

    btnSubmit.textContent = `Selesai (Skor: ${result.score}/100)`;
  });

  container.appendChild(form);
}

/**
 * Menyimpan hasil kuis ke chrome.storage.local secara aman.
 */
async function saveQuizResult(record) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get({ quiz_results: [] });
      const list = Array.isArray(data.quiz_results) ? data.quiz_results : [];
      list.push(record);
      await chrome.storage.local.set({ quiz_results: list });
    }
  } catch (err) {
    console.warn('Gagal menyimpan hasil kuis:', err);
  }
}

/**
 * Mengambil daftar riwayat hasil dari storage.
 */
async function getStoredResults() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get({ quiz_results: [] });
      return Array.isArray(data.quiz_results) ? data.quiz_results : [];
    }
  } catch (err) {
    console.warn('Gagal mengambil riwayat kuis:', err);
  }
  return [];
}

/**
 * Memuat dan merender tabel riwayat hasil kuis dan ringkasan statistik.
 */
async function loadAndRenderResults() {
  const records = await getStoredResults();
  const stats = calculateStats(records);

  const preEl = document.getElementById('stat-avg-pre');
  const postEl = document.getElementById('stat-avg-post');
  const gainEl = document.getElementById('stat-gain');

  if (preEl) preEl.textContent = stats.preCount > 0 ? `${stats.avgPre}` : '-';
  if (postEl) postEl.textContent = stats.postCount > 0 ? `${stats.avgPost}` : '-';
  if (gainEl) {
    if (stats.preCount > 0 && stats.postCount > 0) {
      const sign = stats.gain >= 0 ? '+' : '';
      gainEl.textContent = `${sign}${stats.gain}`;
    } else {
      gainEl.textContent = '-';
    }
  }

  const tbody = document.getElementById('history-table-body');
  const emptyEl = document.getElementById('history-empty');

  if (tbody) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

    if (records.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
    } else {
      if (emptyEl) emptyEl.style.display = 'none';

      // Urutkan dari yang terbaru
      const sorted = [...records].reverse();
      for (const r of sorted) {
        const tr = document.createElement('tr');

        const tdTime = document.createElement('td');
        tdTime.textContent = r.date || r.timestamp;

        const tdId = document.createElement('td');
        tdId.textContent = r.id;

        const tdMode = document.createElement('td');
        tdMode.textContent = r.mode === 'pre' ? 'Pre-Test' : 'Post-Test';

        const tdCount = document.createElement('td');
        tdCount.textContent = `${r.correctCount || r.correct_count || 0}/${r.totalQuestions || r.total_questions || 10}`;

        const tdScore = document.createElement('td');
        tdScore.textContent = `${r.score}`;

        tr.appendChild(tdTime);
        tr.appendChild(tdId);
        tr.appendChild(tdMode);
        tr.appendChild(tdCount);
        tr.appendChild(tdScore);
        tbody.appendChild(tr);
      }
    }
  }
}

/**
 * Memicu unduhan file CSV di peramban.
 */
function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
