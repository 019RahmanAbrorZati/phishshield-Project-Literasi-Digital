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

### Sprint 3: Kerangka Ekstensi MV3 & Pemeriksaan Navigasi
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - `extension/manifest.json` MV3 dibuat dengan izin minimal (`webNavigation`, `storage`), CSP aman, dan background service worker module.
  - Ikon placeholder PNG beresolusi 16x16, 48x48, 128x128 dihasilkan di `extension/assets/`.
  - `extension/lib/allowlist.json` dan `extension/lib/allowlist.js` mengimplementasikan aturan pencocokan ketat exact host dan wildcard domain `*.` dengan batas titik (lolos pengujian anti-spoofing domain).
  - Platform konten pengguna (user-content) seperti `docs.google.com`, `*.github.io`, `*.web.app` dipastikan tidak ada di allowlist.
  - `extension/background/service_worker.js` dibuat untuk memeriksa navigasi frame utama (`frameId === 0`), menyaring skema web http/https, memuat model secara lazy, dan mengalihkan navigasi berisiko ke `warning.html` dengan parameter `host` dan `score` (tanpa URL lengkap).
  - Komunikasi pesan (`chrome.runtime.onMessage`) dan penyimpanan `chrome.storage.local` mendukung manajemen preset, whitelist, dan session bypass.
  - Pengujian integrasi `tests/integration/navigation.test.js` dan unit `tests/unit/allowlist.test.js` lulus 100% (total 51 tes di repositori lulus).
  - Branch `feat/fase-3` di-merge ke `main`.

### Sprint 4: Halaman Peringatan, Popup & Explainer
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - `extension/lib/explain.js` memetakan 16 fitur hostname ke maksimal 4 alasan berbasis bahasa awam yang terurut berdasarkan prioritas risiko, lengkap dengan teks disclaimer transparansi (indikasi vs kepastian).
  - `tests/unit/explain.test.js` memvalidasi seluruh pemicu fitur, pembatasan 4 alasan, disclaimer, dan memastikan tidak ada klaim palsu di luar fitur model (13 tes lulus).
  - Halaman `warning/warning.html`, `warning.css`, `warning.js` selesai dengan tampilan edukatif, aksesibel (kontras tinggi, keyboard accessible), tombol "Kembali ke tempat aman" dan tombol "Lanjutkan" (bypass sesi).
  - Bebas celah XSS (seluruh render parameter `host` dan alasan menggunakan `textContent` / `document.createElement`, 0 `innerHTML`).
  - Popup `popup/popup.html`, `popup.css`, `popup.js` selesai dengan 4 tab:
    1. Status tab aktif (analisis hostname real-time, skor risiko, tombol cepat whitelist).
    2. Manajemen Whitelist pribadi pengguna (tambah domain / wildcard `*.`, hapus, render persisten).
    3. Pengaturan Preset (Ketat ambang 0,7 default vs Seimbang ambang 0,5) lengkap dengan tabel metrik resmi dataset dan catatan transparan.
    4. Navigasi modul edukasi literasi phishing.
  - Seluruh 64 tes di repositori lulus via `npm test`.
  - Branch `feat/fase-4` di-merge ke `main`.

### Sprint 5: Modul Edukasi, Pre/Post-Test & Ekspor CSV
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - `extension/education/quiz_bank.json` & `quiz_data.js` memuat 10 butir soal skenario pre-test dan 10 butir soal setara post-test lengkap dengan 4 opsi pilihan, kunci jawaban, dan pembahasan edukatif.
  - Halaman `education/education.html`, `education.css`, `education.js` memuat 5 materi literasi digital phishing (struktur hostname, typosquatting & homograf, hosting gratis & dynamic DNS, cara hover tautan, langkah darurat).
  - Sistem kuis interaktif pre-test dan post-test otomatis menilai jawaban, menampilkan pembahasan, dan menyimpan riwayat secara anonim di `chrome.storage.local`.
  - Fitur ekspor CSV di peramban (`phishshield_results_<id>.csv`) menghasilkan data terstruktur (`id,mode,score,correct_count,total_questions,timestamp`).
  - Skrip agregasi Node.js `scripts/gabung_hasil.js` dibuat untuk menggabungkan file-file CSV dari banyak responden, menangani CSV kosong, entri ID ganda (mengambil yang terbaru), responden yang hanya memiliki pre-test, dan menghitung skor gain rata-rata.
  - Seluruh pengujian unit `tests/unit/quiz.test.js` dan `tests/unit/gabung_hasil.test.js` lulus (total 81 tes di repositori lulus 100%).
  - Branch `feat/fase-5` di-merge ke `main`.

### Sprint 6 (Opsional): Pemeriksaan Elemen Halaman Berbasis Aturan
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Izin `activeTab` dan `scripting` ditambahkan ke `manifest.json` (tanpa memerlukan host permissions luas).
  - `extension/lib/page_rules.js` mengimplementasikan 3 aturan heuristik: keberadaan field input kata sandi, formulir yang dikirim ke domain eksternal (cross-domain action), dan keberadaan iframe tersembunyi.
  - Hasil evaluasi dirancang murni sebagai informasi tambahan di popup dan BUKAN input bagi model Random Forest.
  - Teks disclaimer transparansi ditegaskan bahwa aturan heuristik ini bukan hasil ML dan memiliki keterbatasan.
  - Fixture HTML lokal dibuat di `tests/fixtures/pages/safe_page.html` dan `phishing_page.html`.
  - Pengujian unit `tests/unit/page_rules.test.js` memvalidasi ketiga aturan heuristik dan fixture HTML (5 tes lulus, total 86 tes di repositori lulus).
  - Tombol interaktif "Periksa Elemen Halaman Ini" diintegrasikan ke popup.
  - Branch `feat/fase-6` di-merge ke `main`.

### Sprint 7: Pengujian Menyeluruh (Comprehensive Testing)
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Struktur pengujian tertata rapi di `tests/unit/` dan `tests/integration/`.
  - Uji integrasi alur utuh `tests/integration/e2e_flow.test.js` memvalidasi konversi URL $\rightarrow$ fitur $\rightarrow$ prediksi $\rightarrow$ keputusan $\rightarrow$ alasan risiko.
  - Fixture `tests/fixtures/legit_hosts.json` memuat 50 situs sah Indonesia dan global.
  - Tes kewajaran `tests/integration/legit_hosts.test.js` membuktikan secara empiris:
    - Tanpa allowlist, model murni hanya menandai 2 dari 50 situs sah pada preset Seimbang (4,0% false positive) dan 1 dari 50 situs sah pada preset Ketat (2,0% false positive: `seller.tokopedia.com`).
    - Preset Ketat berhasil menekan false alarm pada `ocbc.id` (skor 0,6609 lolos aman pada ambang 0,7).
  - Dokumen `docs/TESTING.md` selesai disusun memuat strategi pengujian, tabel hasil 91 tes, analisis kewajaran empiris, dan 8 poin checklist panduan uji manual di Google Chrome.
  - Seluruh 91 tes lulus 100% via `npm test`.
  - Branch `feat/fase-7` di-merge ke `main`.

### Sprint 8: Keamanan, Privasi & Audit Kode
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Audit kode statis `tests/unit/security_audit.test.js` (11 tes unit):
    - 0 pemanggilan `fetch()` atau `XMLHttpRequest` di seluruh kode ekstensi (terjamin Zero Network Footprint).
    - 0 pemanggilan `eval()` atau pembuatan fungsi dinamis (`Function`).
    - 0 penggunaan `innerHTML` atau `document.write` pada seluruh file JavaScript (bebas celah injeksi DOM XSS).
    - 0 pencatatan URL lengkap ke `console.log` (menjaga privasi histori penelusuran pengguna).
    - Verifikasi CSP ketat di `manifest.json` (`script-src 'self'`), melarang skrip inline dan skrip remote.
    - Verifikasi tidak adanya `host_permissions` luas (`<all_urls>` atau `*://*/*`), izin terbatas hanya pada `webNavigation`, `storage`, `activeTab`, dan `scripting`.
    - Ketahanan fungsi pembuat alasan (`explainFeatures`) dan penanganan parameter URL terhadap serangan payload XSS.
    - Verifikasi allowlist bawaan terbebas dari platform konten pengguna (`docs.google.com`, `sites.google.com`, `*.github.io`, dsb) dan pembuktian aturan exact match mencegah bypass suffix domain.
  - Penyusunan dokumen kebijakan privasi dan keamanan komprehensif di `docs/PRIVACY.md` yang merinci prinsip Privacy by Design, cakupan data yang diproses (hanya hostname), mekanisme penyimpanan lokal di `chrome.storage.local`, jaminan ketiadaan telemetri/analitik, serta tabel justifikasi teknis tiap izin peramban.
  - Rangkaian pengujian bertambah dari 91 menjadi 102 tes (seluruh 102 tes lulus 100% via `npm test`).
  - Branch `feat/fase-8` di-merge ke `main`.

### Sprint 9: Dokumentasi Menyeluruh
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Penyusunan dokumen `README.md` yang mencakup gambaran umum produk, arsitektur, daftar fitur utama, metrik resmi evaluasi model pada dataset (F1 0,782, Precision 0,911, Recall 0,685 pada ambang 0,5), bagian keterbatasan sistem yang transparan dan jujur, bagan struktur repositori, serta panduan instalasi dan pengujian.
  - Pembaruan dokumen `docs/ARCHITECTURE.md` dengan penambahan 3 diagram alur Mermaid (Arsitektur Komponen Sistem, Alur Keputusan Navigasi, dan Pemetaan Penjelas Alasan Risiko), detail inferensi Random Forest float32 di sisi klien, pemisahan arsitektural modul heuristik DOM lokal, serta komparasi teknis Python vs JavaScript.
  - Penyusunan panduan pengguna komprehensif di `docs/USER_GUIDE.md` untuk pengguna awam dan penguji capstone, mencakup langkah instalasi Chrome via *Load unpacked*, panduan 4 tab popup, navigasi halaman peringatan edukatif, pengelolaan whitelist, penyesuaian preset sensitivitas, pengerjaan kuis literasi digital, ekspor CSV, penggunaan CLI `gabung_hasil.js`, dan FAQ lengkap dengan penanda placeholder tangkapan layar `[Tangkapan Layar: ...]`.
  - Penyusunan `CHANGELOG.md` mematuhi standar *Keep a Changelog* yang mendokumentasikan progres rilis dari Fase 0 hingga Fase 9.
  - Seluruh 102 pengujian unit dan integrasi tetap lulus 100% via `npm test`.
  - Branch `feat/fase-9` di-merge ke `main`.

### Sprint 10: Integrasi CI & Rilis Paket
- **Tanggal:** 25 November 2026
- **Status:** SELESAI
- **Hasil:**
  - Konfigurasi alur kerja CI terotomatisasi di `.github/workflows/ci.yml` yang mencakup pengujian multi-platform (Ubuntu, Windows, macOS) pada matriks Node.js 18.x, 20.x, dan 22.x serta pembangunan paket rilis.
  - Pembuatan skrip kemasan mandiri zero-dependency `scripts/build_zip.js` yang menghasilkan paket distribusi peramban berekstensi PKZIP standar (`dist/phishshield-v1.0.0.zip`).
  - Penambahan skrip `"build": "node scripts/build_zip.js"` pada `package.json`.
  - Penambahan pengujian unit `tests/unit/build_zip.test.js` untuk memverifikasi integritas struktur berkas zip.
  - Sinkronisasi versi rilis `1.0.0` pada `package.json` dan `extension/manifest.json`.
  - Pembaruan `CHANGELOG.md` merilis versi `[1.0.0]`.
  - Rangkaian pengujian bertambah dari 102 menjadi 104 tes (seluruh 104 tes lulus 100% via `npm test`).
  - Branch `feat/fase-10` di-merge ke `main`, dilanjutkan pembuatan tag Git `v1.0.0`.







