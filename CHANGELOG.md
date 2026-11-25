# Catatan Perubahan (Changelog)
Semua perubahan penting pada proyek **PhishShield** didokumentasikan dalam berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan mematuhi [Semantic Versioning](https://semver.org/).

---

## [Unreleased] - Fase 9

### Ditambahkan
- **Dokumentasi Lengkap Proyek**:
  - `README.md`: Panduan utama repositori yang memuat deskripsi produk, daftar fitur utama, metrik resmi evaluasi model, bagian keterbatasan jujur & transparan, struktur direktori repositori, panduan instalasi di Google Chrome, dan cara menjalankan 102 pengujian otomatis.
  - `docs/ARCHITECTURE.md`: Diperkaya dengan 3 diagram alur Mermaid (Arsitektur Komponen Sistem, Alur Keputusan Navigasi, dan Pemetaan Penjelas Alasan Risiko), detail inferensi Random Forest float32 di sisi klien, pemisahan arsitektural inspeksi elemen DOM lokal, serta perbandingan teknis Python vs JavaScript.
  - `docs/USER_GUIDE.md`: Panduan pengguna komprehensif langkah demi langkah untuk pengguna awam dan penguji capstone, mencakup instalasi Chrome via *Load unpacked*, eksplorasi 4 tab popup, navigasi halaman peringatan edukatif, pengelolaan whitelist, penyesuaian preset sensitivitas, pengerjaan kuis literasi digital, ekspor CSV, penggunaan CLI `gabung_hasil.js`, dan FAQ. Dilengkapi penanda tangkapan layar `[Tangkapan Layar: ...]`.
  - `CHANGELOG.md`: Catatan riwayat rilis dan progres per fase pengembangan.

---

## [0.8.0] - 2026-11-25 (Fase 8: Keamanan & Privasi)

### Ditambahkan
- `tests/unit/security_audit.test.js`: Rangkaian 11 pengujian unit audit keamanan kode statis untuk memastikan:
  - 0 pemanggilan `fetch()` atau `XMLHttpRequest` (Zero Network Footprint).
  - 0 pemanggilan `eval()` atau `Function` constructor dinamis.
  - 0 penggunaan `innerHTML` atau `document.write` pada seluruh berkas JavaScript.
  - 0 pencatatan URL lengkap pengguna ke `console.log`.
  - Kebijakan Keamanan Konten (CSP) ketat pada `manifest.json` (`script-src 'self'`) tanpa skrip inline pada file HTML.
  - Ketiadaan izin luas `host_permissions`.
  - Ketahanan pembuat alasan (`explainFeatures`) terhadap variasi serangan payload XSS.
  - Ketiadaan platform penampung konten pengguna di Allowlist bawaan serta pencegahan bypass *domain suffix*.
- `docs/PRIVACY.md`: Dokumen kebijakan privasi dan keamanan komprehensif yang menjabarkan arsitektur *Privacy by Design*, cakupan data yang diproses (hanya hostname leksikal), penyimpanan eksklusif di `chrome.storage.local`, jaminan tanpa telemetri/analitik, dan tabel justifikasi teknis seluruh izin peramban (`webNavigation`, `storage`, `activeTab`, `scripting`).

---

## [0.7.0] - 2026-11-25 (Fase 7: Pengujian Menyeluruh)

### Ditambahkan
- `tests/fixtures/legit_hosts.json`: Himpunan 50 hostname situs sah populer di Indonesia (perbankan, e-commerce, media berita, portal instansi pemerintah) dan global.
- `tests/integration/e2e_flow.test.js`: Pengujian integrasi alur utuh (*end-to-end*) dari URL masukan $\rightarrow$ ekstraksi fitur $\rightarrow$ evaluasi model RF $\rightarrow$ keputusan ambang $\rightarrow$ penjelas alasan risiko.
- `tests/integration/legit_hosts.test.js`: Pengujian empiris kewajaran model tanpa allowlist terhadap 50 situs sah, membuktikan preset Ketat (0,7) berhasil menekan angka positif palsu hingga 2,0% (1/50 situs) dan meloloskan domain perbankan pendek seperti `ocbc.id`.
- `docs/TESTING.md`: Laporan komprehensif strategi pengujian, rekapitulasi pengujian terotomatisasi, analisis kewajaran empiris, dan checklist 8 langkah pengujian manual di peramban Chrome.

---

## [0.6.0] - 2026-11-25 (Fase 6 Opsional: Inspeksi Elemen Halaman Lokal)

### Ditambahkan
- Penambahan izin terisolasi `activeTab` dan `scripting` di `manifest.json`.
- `extension/lib/page_rules.js`: Logika inspeksi DOM lokal berbasis aturan heuristik untuk memeriksa input password, formulir lintas domain (*cross-domain form action*), dan iframe tersembunyi berukuran 0x0 piksel.
- `tests/fixtures/pages/safe_page.html` & `tests/fixtures/pages/phishing_page.html`: Halaman tiruan lokal untuk pengujian aturan heuristik.
- `tests/unit/page_rules.test.js`: Pengujian unit aturan DOM lokal.
- Tombol *"Periksa Elemen Halaman Ini"* di antarmuka popup untuk memicu inspeksi secara *on-demand*.

---

## [0.5.0] - 2026-11-25 (Fase 5: Modul Edukasi Literasi & Evaluasi Kuis)

### Ditambahkan
- `extension/education/quiz_bank.json` & `quiz_data.js`: Bank soal literasi digital memuat 10 butir soal skenario pre-test dan 10 butir soal skenario post-test setara lengkap dengan kunci jawaban dan ulasan edukatif.
- `extension/education/education.html`, `education.css`, `education.js`: Modul pembelajaran mandiri memuat 5 topik literasi phishing dan sistem kuis interaktif dengan penskoran otomatis, penyimpanan lokal anonim, serta fitur ekspor CSV.
- `scripts/gabung_hasil.js`: Skrip CLI Node.js untuk menggabungkan file-file CSV dari banyak responden, menangani deduplikasi ID, menyaring file kosong, dan menghitung skor peningkatan (*gain*).
- `tests/unit/quiz.test.js` & `tests/unit/gabung_hasil.test.js`: Pengujian unit modul kuis dan skrip agregasi data.

---

## [0.4.0] - 2026-11-25 (Fase 4: Halaman Peringatan, Popup & Explainer)

### Ditambahkan
- `extension/lib/explain.js`: Logika pemetaan 16 fitur leksikal hostname ke maksimal 4 alasan berbasis bahasa awam yang terurut berdasarkan prioritas risiko, lengkap dengan teks *disclaimer* transparansi.
- `extension/warning/warning.html`, `warning.css`, `warning.js`: Antarmuka halaman peringatan edukatif dengan tombol "Kembali ke Tempat Aman" dan opsi "Tetap Lanjutkan (Sesi Ini)" (aman dari XSS, 0 `innerHTML`).
- `extension/popup/popup.html`, `popup.css`, `popup.js`: Antarmuka kontrol popup 4 tab (Status, Whitelist, Pengaturan Preset, dan Edukasi).
- `tests/unit/explain.test.js`: Pengujian pemetaan fitur dan pembatasan maksimal 4 alasan.

---

## [0.3.0] - 2026-11-25 (Fase 3: Kerangka MV3 & Filter Navigasi)

### Ditambahkan
- `extension/manifest.json`: Konfigurasi Manifest V3 dengan perizinan minimal (`webNavigation`, `storage`) dan CSP ketat.
- `extension/lib/allowlist.json` & `allowlist.js`: Allowlist bawaan 35 domain sah Indonesia & global dengan pencocokan ketat *exact host* dan wildcard `*.` berbatas titik.
- `extension/lib/model_data.js`: Modul ES pembungkus data pohon keputusan untuk lazy loading bebas `fetch()`.
- `extension/background/service_worker.js`: Pengawas navigasi frame utama (`frameId === 0`) dengan pengalihan aman ke halaman peringatan.
- Aset ikon ekstensi (16x16, 48x48, 128x128 piksel).
- `tests/unit/allowlist.test.js` & `tests/integration/navigation.test.js`: Pengujian aturan allowlist dan simulasi alur navigasi peramban.

---

## [0.2.0] - 2026-11-25 (Fase 2: Mesin Inferensi Random Forest Sisi Klien)

### Ditambahkan
- `extension/lib/rf.js`: Mesin evaluasi 60 pohon keputusan scikit-learn di sisi klien dengan presisi `Math.fround` (Float32).
- `tests/unit/rf.test.js`: Pengujian validasi terhadap 300 data uji acuan `golden_predictions.json` (kesesuaian 100%, selisih probabilitas maks $9,81 \times 10^{-8}$) dan benchmark performa kecepatan ($0,0058\text{ ms}$ per URL).

---

## [0.1.0] - 2026-11-25 (Fase 1: Ekstraksi Fitur Leksikal Hostname)

### Ditambahkan
- `extension/lib/features.js`: Modul porting fungsi ekstraksi fitur dari Python ke JavaScript murni (menghitung 16 fitur leksikal dan entropi Shannon).
- `extension/lib/meta.js`: Modul pembungkus konstanta kamus kata kunci dan TLD berisiko dari `meta.json`.
- `tests/unit/features.test.js`: Pengujian terhadap 20 data acuan `golden_features.json` dengan selisih numerik $< 10^{-9}$.

---

## [0.0.1] - 2026-11-25 (Fase 0: Inisialisasi Repositori & Perencanaan)

### Ditambahkan
- Pemindahan dan verifikasi integritas 4 berkas model di `model/` (`model_rf.json`, `meta.json`, `golden_features.json`, `golden_predictions.json`).
- Struktur repositori awal, berkas konfigurasi `.gitignore`, `package.json` (`node:test`), dan backlog Agile di `docs/SPRINT_LOG.md`.
