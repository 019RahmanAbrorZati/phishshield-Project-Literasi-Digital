# PhishShield — Sprint Log & Backlog Agile

Dokumen ini mencatat backlog pengembangan agile per sprint (fase) dan log eksekusi berkala untuk ekstensi Chrome **PhishShield** (Capstone Project Teknik Informatika - Literasi Digital).

---

## 1. Parameter Model & Acuan Metrik Resmi

Model Random Forest diekspor dari scikit-learn dengan inferensi murni di sisi klien (in-browser) hanya menggunakan fitur **hostname**.

### Metrik Evaluasi Data Uji Dataset (Acuan Resmi)
| Preset | Ambang (*Threshold*) | Precision | Recall | False Positive Rate |
|---|---|---|---|---|
| **Seimbang** | 0,5 | 0,911 | 0,685 | 0,050 |
| **Ketat** *(Default)* | 0,7 | 0,964 | 0,601 | 0,017 |

- **F1-score pada ambang 0,5:** 0,782
- **Arsitektur Model:** Random Forest (60 estimator/pohon, ambang keputusan dasar 0,5)
- **Himpunan Fitur:** 16 fitur hostname terurut (`host_len`, `n_labels`, `n_subdomains`, `n_dots`, `n_hyphens`, `n_digits`, `digit_ratio`, `longest_label`, `tld_len`, `is_ip`, `has_punycode`, `is_free_hosting`, `is_dynamic_dns`, `risky_tld`, `n_sensitive_kw`, `entropy`).

---

## 2. Product Backlog (Fase 0 - Fase 11)

### Sprint 0 (Fase 0): Perencanaan dan Kerangka Repositori
- **Tujuan:** Menyiapkan struktur repositori, memvalidasi berkas model dan metrik acuan, membuat konfigurasi proyek dan pelacakan sprint.
- **Definisi Selesai (DoD):**
  1. Berkas model di `model/` lengkap (4 berkas) dan tidak diubah.
  2. Struktur direktori target terbentuk rapi.
  3. `package.json` terkonfigurasi dengan script pengujian `node --test tests/`.
  4. Repository Git diinisialisasi pada branch `main`, branch `feat/fase-0` selesai dan di-merge ke `main`.
  5. Backlog Agile terdokumentasi di `docs/SPRINT_LOG.md`.

### Sprint 1 (Fase 1): Ekstraksi Fitur (Inti)
- **Tujuan:** Melakukan porting persis logika ekstraksi 16 fitur hostname dari Python ke JavaScript murni (ES Modules).
- **Definisi Selesai (DoD):**
  1. `extension/lib/features.js` mengekspor `hostOf(url)` dan `hostFeatures(url)`.
  2. Konstanta dari `meta.json` disalin ke `extension/lib/meta.json` dan dimuat tanpa hardcode ganda.
  3. Tes unit `tests/unit/features.test.js` memvalidasi seluruh sampel di `golden_features.json` (toleransi float 1e-9, integer persis) dan menangani edge cases (IDN/punycode, IPv4, `co.id`, URL tanpa skema, URL tidak valid).
  4. Perbedaan JS vs Python tercatat di `docs/ARCHITECTURE.md`.
  5. Branch `feat/fase-1` lulus tes dan di-merge ke `main`.

### Sprint 2 (Fase 2): Mesin Inferensi Random Forest Klien
- **Tujuan:** Membangun modul inferensi pohon keputusan biner Random Forest di JavaScript menggunakan `Math.fround`.
- **Definisi Selesai (DoD):**
  1. `extension/lib/rf.js` mengimplementasikan `loadModel(json)` dan `predictProba(model, featureObj)`.
  2. Tes unit `tests/unit/rf.test.js` memvalidasi 300 data uji di `golden_predictions.json` (kesesuaian keputusan ≥ 99,9%, selisih proba ≤ 1e-4).
  3. Pengukuran waktu inferensi rata-rata per URL tercatat (ms).
  4. Branch `feat/fase-2` lulus tes dan di-merge ke `main`.

### Sprint 3 (Fase 3): Kerangka Ekstensi MV3 & Pemeriksaan Navigasi
- **Tujuan:** Membangun manifest MV3, logika allowlist bawaan yang aman, dan service worker untuk mendeteksi navigasi web.
- **Definisi Selesai (DoD):**
  1. `manifest.json` MV3 valid dengan izin minimal (`webNavigation`, `storage`).
  2. `extension/lib/allowlist.js` dan `allowlist.json` mengimplementasikan pencocokan persis dan wildcard `*.` tanpa celah subdomain suffix (`google.com.evil.top` ditolak).
  3. Service worker menangani lazy-loading model, cache in-memory, session bypass, dan pengalihan navigasi frame utama ke halaman peringatan dengan parameter `host` dan `score`.
  4. Pengujian integrasi dengan mock `chrome.*` lulus.
  5. Branch `feat/fase-3` di-merge ke `main`.

### Sprint 4 (Fase 4): Halaman Peringatan, Popup & Explainer
- **Tujuan:** Membuat antarmuka pengguna halaman peringatan yang edukatif, modul penjelas alasan risiko, dan popup kontrol.
- **Definisi Selesai (DoD):**
  1. `extension/lib/explain.js` memetakan fitur ke maksimal 4 alasan berbasis bahasa awam, dengan penekanan bahwa hasil adalah indikasi risiko.
  2. Halaman `warning/` bebas XSS (`textContent`, tanpa `innerHTML`), memiliki tombol "Kembali ke tempat aman" dan tombol bypass sesi.
  3. Popup menyediakan status risiko, pemilihan preset Seimbang/Ketat dengan metrik akurat, pengelolaan whitelist pengguna, dan tautan ke modul edukasi.
  4. Tes unit `tests/unit/explain.test.js` lulus.
  5. Branch `feat/fase-4` di-merge ke `main`.

### Sprint 5 (Fase 5): Modul Edukasi, Pre/Post-Test & Ekspor CSV
- **Tujuan:** Menyediakan materi edukasi literasi digital phishing, kuis evaluasi pre/post-test, dan skrip agregator hasil riset.
- **Definisi Selesai (DoD):**
  1. Halaman `education/` memuat 5 modul literasi phishing interaktif.
  2. Bank soal 10 butir pilihan ganda terpisah di `quiz_bank.json` untuk mode pre-test dan post-test.
  3. Penyimpanan anonim hasil tes di `chrome.storage.local` dan fitur ekspor CSV.
  4. Skrip Node `scripts/gabung_hasil.js` untuk menggabungkan banyak CSV responden dan menghitung selisih rata-rata skor pre/post-test.
  5. Tes unit untuk penilaian kuis, penyimpanan, ekspor CSV, dan skrip agregator lulus.
  6. Branch `feat/fase-5` di-merge ke `main`.

### Sprint 6 (Fase 6 - Opsional): Pemeriksaan Elemen Halaman Berbasis Aturan
- **Tujuan:** Menambahkan pemeriksaan konten halaman berbasis heuristik (DOM rules) menggunakan `activeTab` jika disetujui.
- **Definisi Selesai (DoD):** Fitur berjalan sebagai informasi tambahan terpisah dari model ML, dilengkapi tes fixture HTML.

### Sprint 7 (Fase 7): Pengujian Menyeluruh (Comprehensive Testing)
- **Tujuan:** Menjalankan pengujian regresi menyeluruh, uji integrasi end-to-end, dan uji kewajaran pada 50 situs sah Indonesia/global.
- **Definisi Selesai (DoD):**
  1. Seluruh suite tes di `tests/` lulus via `npm test`.
  2. Uji kewajaran pada `tests/fixtures/legit_hosts.json` dijalankan tanpa allowlist pada preset Seimbang & Ketat, hasilnya dilaporkan secara transparan di `docs/TESTING.md`.
  3. Dokumen `docs/TESTING.md` memuat strategi pengujian dan checklist uji manual interaktif.
  4. Branch `feat/fase-7` di-merge ke `main`.

### Sprint 8 (Fase 8): Keamanan dan Privasi
- **Tujuan:** Melakukan audit keamanan kode, CSP, pencegahan XSS, ketiadaan telemetri/network request, dan menyusun dokumen privasi.
- **Definisi Selesai (DoD):**
  1. Audit keamanan membuktikan 0 network request, 0 `eval`, CSP ketat, dan sanitasi XSS terverifikasi.
  2. Dokumen `docs/PRIVACY.md` selesai dan detail.
  3. Temuan audit dicatat di SPRINT_LOG.
  4. Branch `feat/fase-8` di-merge ke `main`.

### Sprint 9 (Fase 9): Dokumentasi Lengkap
- **Tujuan:** Menulis dokumentasi lengkap dan jujur mengenai arsitektur, panduan pengguna, serta batasan sistem.
- **Definisi Selesai (DoD):**
  1. `README.md` memuat deskripsi, instalasi, batasan sistem jujur (termasuk F1 0,782, precision 0,911, recall 0,685).
  2. `docs/ARCHITECTURE.md` memuat diagram alur Mermaid dan analisis komponen.
  3. `docs/USER_GUIDE.md` memuat petunjuk penggunaan bergambar/tangkapan layar.
  4. `CHANGELOG.md` diperbarui.
  5. Branch `feat/fase-9` di-merge ke `main`.

### Sprint 10 (Fase 10): CI/CD & Paket Rilis
- **Tujuan:** Menyiapkan otomasi GitHub Actions dan skrip pembuatan zip ekstensi siap distribusi.
- **Definisi Selesai (DoD):**
  1. `.github/workflows/ci.yml` tervalidasi.
  2. Skrip pengemasan zip berfungsi dan menghasilkan berkas zip siap muat.
  3. Tag Git `v1.0.0` dibuat.
  4. Branch `feat/fase-10` di-merge ke `main`.

### Sprint 11 (Fase 11): Ringkasan Laporan Capstone
- **Tujuan:** Memetakan seluruh artefak proyek ke dalam bab-bab laporan skripsi/capstone (Bab IV, VI, VII, VIII).
- **Definisi Selesai (DoD):**
  1. Dokumen `docs/RINGKASAN_LAPORAN.md` selesai dengan data faktual hasil pengujian.
  2. Checklist panduan manual untuk mahasiswa siap digunakan.

---

## 3. Log Sprint Aktif

### Sprint 0: Setup Repositori & Verifikasi Input Model
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Folder `model/` diverifikasi memuat 4 berkas input asli tanpa perubahan.
  - Metrik evaluasi resmi model disepakati dan dicatat.
  - Struktur direktori target (`extension/`, `model/`, `scripts/`, `tests/`, `docs/`, `.github/`) berhasil dibuat.
  - `package.json` dan `.gitignore` berhasil dibuat.
  - Pengujian awal framework `node --test tests/` dikonfigurasi.
  - Branch `feat/fase-0` dibuat, di-commit, dan di-merge ke `main`.

### Sprint 1: Ekstraksi Fitur Hostname (Inti)
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - `extension/lib/meta.json` dan `extension/lib/meta.js` berhasil dibuat berdasarkan `model/meta.json`.
  - `extension/lib/features.js` mem-port persis 16 fitur hostname dan kalkulasi Shannon Entropy.
  - `tests/unit/features.test.js` memvalidasi seluruh sampel di `golden_features.json` dengan kecocokan float presisi tinggi (< 1e-9) dan integer persis (100%).
  - Kasus tepi diuji secara komprehensif: URL tanpa skema, prefix www., IPv4, IPv6 brackets, second-level domains (co.id, go.id, ac.id), IDN/punycode, URL tidak valid, dan string kosong.
  - Perbedaan teknis Python vs JS didokumentasikan di `docs/ARCHITECTURE.md`.
  - Seluruh 21 tes unit di `features.test.js` lulus.
  - Branch `feat/fase-1` lulus tes dan di-merge ke `main`.

### Sprint 2: Mesin Inferensi Random Forest Klien
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - `extension/lib/rf.js` berhasil dibuat dengan fungsi `loadModel(json)`, `predictProba(model, featureObj)`, dan `predict(model, featureObj, threshold)`.
  - Inferensi menggunakan presisi float single (`Math.fround` / `Float32Array`) dan traversal pohon biner scikit-learn (`x <= threshold` ke kiri, selain itu ke kanan).
  - Validasi terhadap seluruh 300 data uji di `golden_predictions.json`:
    - Tingkat kesesuaian keputusan: 100,00% (300/300 sampel, target minimum ≥ 99,9%).
    - Selisih probabilitas maksimum: 9,8133e-8 (jauh di bawah batas toleransi ≤ 1e-4).
  - Pengukuran benchmark performa (50 iterasi x 300 URL = 15.000 evaluasi):
    - Waktu inferensi rata-rata per URL: 0,0058 ms (~5,8 µs).
    - Throughput inferensi: ~172.000 URL per detik di lingkungan Node.js.
  - Seluruh 6 pengujian unit di `rf.test.js` lulus (total 27 tes di repositori lulus).
  - Branch `feat/fase-2` di-merge ke `main`.


