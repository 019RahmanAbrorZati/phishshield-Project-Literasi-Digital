import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, aggregateRecords, mergeCsvFiles } from '../../scripts/gabung_hasil.js';

describe('Skrip Agregator Data Evaluasi (gabung_hasil.js - Fase 5)', () => {
  describe('Fungsi parseCsv()', () => {
    it('Mem-parsing baris CSV valid menjadi array objek', () => {
      const csv = `id,mode,score,correct_count,total_questions,timestamp
resp_01,pre,50,5,10,2026-11-25T10:00:00Z
resp_01,post,80,8,10,2026-11-25T10:30:00Z`;

      const res = parseCsv(csv);
      assert.strictEqual(res.length, 2);
      assert.strictEqual(res[0].id, 'resp_01');
      assert.strictEqual(res[0].mode, 'pre');
      assert.strictEqual(res[0].score, 50);
      assert.strictEqual(res[1].score, 80);
    });

    it('Menangani string CSV kosong atau hanya header dengan aman', () => {
      assert.deepStrictEqual(parseCsv(''), []);
      assert.deepStrictEqual(parseCsv('   \n  '), []);
      assert.deepStrictEqual(parseCsv('id,mode,score,correct_count,total_questions,timestamp'), []);
    });

    it('Mengabaikan baris rusak atau tidak lengkap', () => {
      const csv = `id,mode,score,correct_count,total_questions,timestamp
resp_valid,pre,60,6,10,2026-11-25T10:00:00Z
corrupted_line_without_enough_commas
,invalid_mode,not_a_number,0,10,`;

      const res = parseCsv(csv);
      assert.strictEqual(res.length, 1);
      assert.strictEqual(res[0].id, 'resp_valid');
    });
  });

  describe('Fungsi aggregateRecords() & Kasus Tepi', () => {
    it('Kasus CSV kosong: mengembalikan struktur statistik dengan nilai 0', () => {
      const { uniqueRecords, respondents, stats } = aggregateRecords([]);
      assert.strictEqual(uniqueRecords.length, 0);
      assert.strictEqual(respondents.length, 0);
      assert.strictEqual(stats.totalRespondents, 0);
      assert.strictEqual(stats.avgPre, 0);
      assert.strictEqual(stats.avgPost, 0);
      assert.strictEqual(stats.avgGainPaired, 0);
    });

    it('Kasus responden yang hanya memiliki Pre-test (tanpa Post-test)', () => {
      const records = [
        { id: 'resp_complete', mode: 'pre', score: 60, timestamp: '2026-11-25T10:00:00Z' },
        { id: 'resp_complete', mode: 'post', score: 90, timestamp: '2026-11-25T10:30:00Z' },
        { id: 'resp_only_pre', mode: 'pre', score: 70, timestamp: '2026-11-25T11:00:00Z' }
      ];

      const { respondents, stats } = aggregateRecords(records);

      assert.strictEqual(stats.totalRespondents, 2);
      assert.strictEqual(stats.preCount, 2);
      assert.strictEqual(stats.postCount, 1);
      assert.strictEqual(stats.pairedCount, 1, 'Hanya ada 1 responden yang memiliki pre dan post');

      // Rata-rata Pre: (60 + 70) / 2 = 65.00
      assert.strictEqual(stats.avgPre, 65);
      // Rata-rata Post: 90 / 1 = 90.00
      assert.strictEqual(stats.avgPost, 90);
      // Peningkatan Paired: 90 - 60 = 30.00
      assert.strictEqual(stats.avgGainPaired, 30);

      const respOnlyPre = respondents.find(r => r.id === 'resp_only_pre');
      assert.strictEqual(respOnlyPre.preScore, 70);
      assert.strictEqual(respOnlyPre.postScore, null);
      assert.strictEqual(respOnlyPre.gain, null);
    });

    it('Kasus ID Ganda: mengambil entri terbaru berdasarkan timestamp', () => {
      const records = [
        // resp_01 mengerjakan pre-test 2 kali (awal 50, revisi 70 dengan waktu lebih baru)
        { id: 'resp_01', mode: 'pre', score: 50, timestamp: '2026-11-25T08:00:00Z' },
        { id: 'resp_01', mode: 'pre', score: 70, timestamp: '2026-11-25T09:00:00Z' },
        { id: 'resp_01', mode: 'post', score: 90, timestamp: '2026-11-25T10:00:00Z' }
      ];

      const { uniqueRecords, respondents, stats } = aggregateRecords(records);

      // Harus menyaring duplikasi pre-test, tersisa 2 records unik untuk resp_01 (1 pre, 1 post)
      assert.strictEqual(uniqueRecords.length, 2);

      const resp01 = respondents.find(r => r.id === 'resp_01');
      assert.strictEqual(resp01.preScore, 70, 'Harus memakai skor pre-test yang terbaru (70)');
      assert.strictEqual(resp01.postScore, 90);
      assert.strictEqual(resp01.gain, 20); // 90 - 70 = 20

      assert.strictEqual(stats.avgPre, 70);
      assert.strictEqual(stats.avgPost, 90);
      assert.strictEqual(stats.avgGainPaired, 20);
    });

    it('Menghitung statistik kelompok secara menyeluruh dari banyak responden', () => {
      const records = [
        { id: 'r1', mode: 'pre', score: 40, timestamp: '2026-11-25T10:00:00Z' },
        { id: 'r1', mode: 'post', score: 80, timestamp: '2026-11-25T11:00:00Z' },
        { id: 'r2', mode: 'pre', score: 50, timestamp: '2026-11-25T10:00:00Z' },
        { id: 'r2', mode: 'post', score: 90, timestamp: '2026-11-25T11:00:00Z' },
        { id: 'r3', mode: 'pre', score: 60, timestamp: '2026-11-25T10:00:00Z' },
        { id: 'r3', mode: 'post', score: 100, timestamp: '2026-11-25T11:00:00Z' }
      ];

      const { stats } = aggregateRecords(records);
      assert.strictEqual(stats.totalRespondents, 3);
      assert.strictEqual(stats.pairedCount, 3);
      assert.strictEqual(stats.avgPre, 50); // (40+50+60)/3 = 50
      assert.strictEqual(stats.avgPost, 90); // (80+90+100)/3 = 90
      assert.strictEqual(stats.avgGainPaired, 40); // 90 - 50 = 40
    });
  });
});
