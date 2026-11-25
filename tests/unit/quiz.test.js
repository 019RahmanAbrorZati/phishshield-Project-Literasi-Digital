import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scoreQuiz, formatRecordsAsCsv, calculateStats } from '../../extension/education/education.js';

const quizBank = JSON.parse(
  readFileSync(new URL('../../extension/education/quiz_bank.json', import.meta.url), 'utf8')
);

describe('Modul Evaluasi Kuis & Ekspor CSV (Fase 5)', () => {
  describe('Struktur Bank Soal quiz_bank.json', () => {
    it('Memuat tepat 10 butir soal pada pretest', () => {
      assert.strictEqual(Array.isArray(quizBank.pretest), true);
      assert.strictEqual(quizBank.pretest.length, 10);
    });

    it('Memuat tepat 10 butir soal pada posttest', () => {
      assert.strictEqual(Array.isArray(quizBank.posttest), true);
      assert.strictEqual(quizBank.posttest.length, 10);
    });

    it('Setiap soal memiliki 4 opsi jawaban dan index jawaban benar yang valid', () => {
      const allQuestions = [...quizBank.pretest, ...quizBank.posttest];

      for (const q of allQuestions) {
        assert.ok(q.scenario && typeof q.scenario === 'string', `Soal ${q.id} harus memiliki teks skenario`);
        assert.strictEqual(q.options.length, 4, `Soal ${q.id} harus memiliki 4 opsi pilihan`);
        assert.ok(q.answer >= 0 && q.answer <= 3, `Soal ${q.id} answer index harus 0, 1, 2, atau 3`);
        assert.ok(q.explanation && typeof q.explanation === 'string', `Soal ${q.id} harus memiliki penjelasan`);
      }
    });

    it('Contoh tautan adalah sintetis dan aman (tidak memuat situs phishing nyata)', () => {
      const allQuestions = [...quizBank.pretest, ...quizBank.posttest];
      for (const q of allQuestions) {
        if (q.url) {
          assert.ok(
            q.url.includes('example') ||
            q.url.includes('.xyz') ||
            q.url.includes('.app') ||
            q.url.includes('.dev') ||
            q.url.includes('.top') ||
            q.url.includes('.org') ||
            q.url.includes('.id') ||
            q.url.includes('.online') ||
            q.url.includes('.net') ||
            q.url.includes('103.') ||
            q.url.includes('194.') ||
            q.url.includes('xn--') ||
            q.url.includes('tokopedla') ||
            q.url.includes('paypa1'),
            `Tautan ${q.url} harus aman dan sintetis`
          );
        }
      }
    });
  });

  describe('Fungsi scoreQuiz()', () => {
    const questions = [
      { id: 1, answer: 1 },
      { id: 2, answer: 2 },
      { id: 3, answer: 0 },
      { id: 4, answer: 3 },
      { id: 5, answer: 1 }
    ];

    it('Menghitung skor 100 jika seluruh jawaban benar', () => {
      const answers = { 1: 1, 2: 2, 3: 0, 4: 3, 5: 1 };
      const res = scoreQuiz(answers, questions);
      assert.strictEqual(res.correctCount, 5);
      assert.strictEqual(res.totalQuestions, 5);
      assert.strictEqual(res.score, 100);
    });

    it('Menghitung skor proporsional secara akurat (3 dari 5 benar = 60)', () => {
      const answers = { 1: 1, 2: 0, 3: 0, 4: 3, 5: 0 };
      const res = scoreQuiz(answers, questions);
      assert.strictEqual(res.correctCount, 3);
      assert.strictEqual(res.score, 60);
    });

    it('Menghitung skor 0 jika seluruh jawaban salah', () => {
      const answers = { 1: 0, 2: 0, 3: 1, 4: 0, 5: 0 };
      const res = scoreQuiz(answers, questions);
      assert.strictEqual(res.correctCount, 0);
      assert.strictEqual(res.score, 0);
    });
  });

  describe('Fungsi formatRecordsAsCsv()', () => {
    it('Menghasilkan format CSV yang valid lengkap dengan header', () => {
      const records = [
        {
          id: 'resp_abc123',
          mode: 'pre',
          score: 60,
          correctCount: 6,
          totalQuestions: 10,
          timestamp: '2026-11-25T15:00:00.000Z'
        },
        {
          id: 'resp_abc123',
          mode: 'post',
          score: 90,
          correctCount: 9,
          totalQuestions: 10,
          timestamp: '2026-11-25T15:30:00.000Z'
        }
      ];

      const csv = formatRecordsAsCsv(records);
      const lines = csv.split('\n');

      assert.strictEqual(lines[0], 'id,mode,score,correct_count,total_questions,timestamp');
      assert.strictEqual(lines[1], 'resp_abc123,pre,60,6,10,2026-11-25T15:00:00.000Z');
      assert.strictEqual(lines[2], 'resp_abc123,post,90,9,10,2026-11-25T15:30:00.000Z');
    });

    it('Menghasilkan header saja jika input kosong', () => {
      const csv = formatRecordsAsCsv([]);
      assert.strictEqual(csv, 'id,mode,score,correct_count,total_questions,timestamp');
    });
  });

  describe('Fungsi calculateStats()', () => {
    it('Menghitung rata-rata pre, post, dan gain secara akurat', () => {
      const records = [
        { mode: 'pre', score: 60 },
        { mode: 'pre', score: 80 },
        { mode: 'post', score: 90 },
        { mode: 'post', score: 100 }
      ];

      const stats = calculateStats(records);
      assert.strictEqual(stats.avgPre, 70);
      assert.strictEqual(stats.avgPost, 95);
      assert.strictEqual(stats.gain, 25);
      assert.strictEqual(stats.preCount, 2);
      assert.strictEqual(stats.postCount, 2);
    });
  });
});
