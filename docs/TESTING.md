# Laporan Pengujian Menyeluruh (Test Report) - PhishShield

Dokumen ini mendokumentasikan strategi pengujian, hasil eksekusi pengujian otomatis, hasil tes kewajaran model pada 50 situs sah Indonesia dan global, serta checklist panduan pengujian manual pada peramban Google Chrome.

---

## 1. Strategi Pengujian

Pengujian PhishShield dirancang bertingkat (*multi-tiered testing*) untuk memastikan akurasi model, kestabilan logika heuristik, kinerja inferensi, dan integritas antarmuka peramban tanpa memerlukan pustaka pihak ketiga eksternal (*zero external test dependencies*):

1. **Unit Testing (`tests/unit/`):**
   - Menguji setiap fungsi secara terisolasi (Shannon Entropy, ekstraksi 16 fitur hostname, evaluasi pohon biner Random Forest, pencocokan pola allowlist, pembatasan alasan di explain engine, skoring kuis, ekspor CSV, dan parser agregator).
2. **Integration Testing (`tests/integration/`):**
   - Menguji integrasi antarmodul dalam alur utuh (*end-to-end pipeline*): URL input $\rightarrow$ normalisasi host $\rightarrow$ ekstraksi fitur $\rightarrow$ inferensi model $\rightarrow$ keputusan ambang $\rightarrow$ alasan risiko.
   - Menguji interaksi background service worker Manifest V3 menggunakan tiruan (*mock*) `chrome.*` API (`storage`, `tabs`, `webNavigation`).
3. **Tes Kewajaran Situs Sah (Fairness Reporting Test):**
   - Mengevaluasi model pembelajaran mesin murni **tanpa bantuan allowlist** terhadap 50 hostname situs populer di Indonesia dan dunia.
4. **Manual Verification Testing:**
   - Panduan checklist verifikasi interaktif langsung di peramban Google Chrome (mode pengembang).

---

## 2. Cara Menjalankan Pengujian Otomatis

Eksekusi seluruh suite pengujian menggunakan test runner bawaan Node.js (`node:test`):

```bash
# Menjalankan seluruh pengujian (unit dan integrasi)
npm test

# Atau langsung menggunakan binary Node:
node --test
```

---

## 3. Ringkasan Hasil Pengujian Otomatis

Seluruh suite pengujian otomatis dijalankan pada lingkungan **Node.js (>= 18.0.0, direkomendasikan Node.js LTS)**:

| Modul Pengujian | Berkas Uji | Jumlah Tes | Status | Keterangan Cakupan |
|---|---|---|---|---|
| Ekstraksi Fitur | `tests/unit/features.test.js` | 21 | **LULUS** | Golden features, Shannon entropy, IPv4, IPv6, punycode, IDN, second-level domain. |
| Inferensi RF | `tests/unit/rf.test.js` | 6 | **LULUS** | 300 data golden predictions (akurasi 100%, max error 9.81e-8, benchmark 0.006 ms/URL). |
| Allowlist & Pola | `tests/unit/allowlist.test.js` | 13 | **LULUS** | Exact match, wildcard `*.`, anti-spoofing (`google.com.evil.top`), user whitelist. |
| Penjelas Risiko | `tests/unit/explain.test.js` | 13 | **LULUS** | 10 pemicu fitur model, prioritas, batas max 4 alasan, disclaimer, zero false claims. |
| Kuis & CSV | `tests/unit/quiz.test.js` | 10 | **LULUS** | Struktur 10 pre & 10 post bank soal, scoring proporsional, format ekspor CSV. |
| Skrip Agregator | `tests/unit/gabung_hasil.test.js` | 7 | **LULUS** | Penggabungan multi-file, penanganan CSV kosong, duplikasi ID, dan hitung gain. |
| Aturan DOM (Opsional) | `tests/unit/page_rules.test.js` | 5 | **LULUS** | Evaluasi HTML fixture (safe vs phishing), password input, cross-domain form, hidden iframe. |
| Audit Keamanan Statis | `tests/unit/security_audit.test.js` | 11 | **LULUS** | 0 fetch/XHR, 0 eval, CSP ketat, anti-XSS, integritas allowlist & privasi. |
| Packaging Distribusi | `tests/unit/build_zip.test.js` | 2 | **LULUS** | Verifikasi pembuatan paket distribusi ZIP PKZIP & kelengkapan file ekstensi. |
| Integrasi SW & Navigasi | `tests/integration/navigation.test.js` | 11 | **LULUS** | Frame filter (frameId 0), pengalihan risiko, allowlist bypass, session bypass, preset test. |
| Integrasi Alur Penuh | `tests/integration/e2e_flow.test.js` | 4 | **LULUS** | URL $\rightarrow$ Fitur $\rightarrow$ Prediksi $\rightarrow$ Keputusan $\rightarrow$ Alasan secara end-to-end. |
| Tes Kewajaran Situs Sah | `tests/integration/legit_hosts.test.js` | 1 | **LULUS** | Evaluasi 50 situs sah pada preset Seimbang (0,5) vs Ketat (0,7). |
| **TOTAL** | **12 Berkas Uji** | **104** | **LULUS (100%)** | **0 Gagal, 0 Dibatalkan, 0 Dilewati.** |

---

## 4. Hasil Tes Kewajaran pada 50 Situs Sah (Model Saja Tanpa Allowlist)

Pengujian ini dijalankan pada berkas `tests/fixtures/legit_hosts.json` untuk mengukur kinerja murni model Random Forest tanpa intervensi lapisan allowlist bawaan.

### Rangkuman Statistik:
- **Total Situs Sah Diuji:** 50 hostname
- **Ditandai Phishing pada Preset Seimbang (Ambang 0,5):** 2 dari 50 situs (4,0% False Positive)
- **Ditandai Phishing pada Preset Ketat (Ambang 0,7):** 1 dari 50 situs (2,0% False Positive)

### Rincian Evaluasi Situs yang Ditandai (False Positive Model):
| Hostname Sah | Kategori | Skor Model | Ditandai Seimbang (0,5)? | Ditandai Ketat (0,7)? | Analisis Penyebab & Mitigasi |
|---|---|---|---|---|---|
| `ocbc.id` | Perbankan | **0,6609** | **YA (False Alarm)** | **TIDAK (Aman)** | Nama domain sangat pendek (4 karakter) dengan TLD `.id` memicu bobot probabilitas menengah. Terbukti bahwa **Preset Ketat (0,7) berhasil menekan false alarm ini**. |
| `seller.tokopedia.com` | E-Commerce | **0,8439** | **YA (False Alarm)** | **YA (False Alarm)** | Memiliki subdomain (`seller`) dan kata kunci yang memicu pola risiko pada model murni. Karena allowlist bawaan menerapkan pencocokan persis (*exact match*), domain ini kini telah ditambahkan secara eksplisit ke **Allowlist Bawaan** untuk menjamin pengguna tidak terganggu (sementara pengujian `legit_hosts.test.js` tetap mengevaluasi model murni tanpa bantuan allowlist). Pengguna juga dapat memasukkan pola wildcard `*.tokopedia.com` pada Whitelist pribadi. |

> **Kesimpulan Ilmiah:** Hasil pengujian pada 50 sampel situs sah ini memberikan indikasi empiris awal bahwa keputusan menghadirkan **Allowlist Bawaan** dan menetapkan **Preset Ketat (0,7) sebagai default** berperan penting dalam menekan potensi positif palsu (*false positive*) pada domain sah populer di Indonesia.

---

## 5. Checklist Panduan Pengujian Manual di Peramban

Gunakan checklist ini untuk memverifikasi fungsionalitas ekstensi secara interaktif di Google Chrome:

- [ ] **1. Pemuatan Ekstensi (*Load Unpacked*):**
  - Buka `chrome://extensions`, aktifkan *Developer mode*.
  - Klik *Load unpacked*, pilih folder `extension/`.
  - Ekstensi muncul tanpa pesan galat dengan ikon perisai biru.
- [ ] **2. Situs Sah Umum Tidak Terganggu:**
  - Buka `https://www.google.com`, `https://www.detik.com`, `https://bca.co.id`.
  - Halaman terbuka normal tanpa pengalihan atau gangguan navigasi.
- [ ] **3. Pengalihan Host Berisiko ke Halaman Peringatan:**
  - Buka URL uji sintetis: `http://klikbca-verifikasi-akun-secure.web.app`.
  - Peramban segera dialihkan ke `warning.html?host=...&score=...`.
  - Halaman peringatan menampilkan hostname, estimasi skor risiko, dan poin alasan berbahasa Indonesia.
- [ ] **4. Mekanisme Bypass Sesi:**
  - Pada halaman peringatan, klik tombol *"Saya Paham Risikonya, Lanjutkan"*.
  - Peramban melanjutkan pembukaan situs tersebut tanpa kembali dialihkan pada sesi yang sama.
- [ ] **5. Manajemen Whitelist Pengguna:**
  - Buka popup ekstensi pada toolbar peramban.
  - Masuk ke tab **Whitelist**, tambahkan domain uji (misal: `*.unesa.ac.id`).
  - Pastikan domain muncul di daftar, dan coba tombol *Hapus* untuk memastikan sinkronisasi penyimpanan lokal.
- [ ] **6. Pengalihan Preset Sensitivitas:**
  - Pada popup tab **Preset**, pilih opsi *Seimbang (Ambang 0,5)* atau *Ketat (Ambang 0,7)*.
  - Verifikasi bahwa angka *Precision*, *Recall*, dan *False Positive Rate* sesuai dengan tabel resmi dataset.
- [ ] **7. Pengerjaan Pre-Test & Post-Test:**
  - Klik tab **Belajar** pada popup, buka modul edukasi.
  - Selesaikan 10 butir soal Pre-Test, periksa kemunculan pembahasan jawaban.
  - Baca 5 modul edukasi, lalu selesaikan 10 butir soal Post-Test.
- [ ] **8. Ekspor CSV & Penggabungan Hasil:**
  - Pada tab *Hasil & Ekspor CSV*, klik tombol *"Ekspor Hasil ke CSV"*.
  - Berkas CSV berhasil diunduh ke komputer pengguna.
  - Uji skrip penggabung di terminal: `node scripts/gabung_hasil.js phishshield_results_*.csv -o gabungan.csv`.
