# PhishShield 🛡️

**PhishShield** adalah ekstensi peramban Google Chrome (Manifest V3) yang dirancang untuk mendeteksi indikasi phishing pada tautan web secara mandiri di sisi klien (*client-side only*) serta meningkatkan pemahaman pengguna melalui modul edukasi literasi digital interaktif.

Proyek ini dikembangkan sebagai karya tugas akhir (Capstone Project) mahasiswa Teknik Informatika dengan peminatan **Literasi Digital dan Keamanan Informasi**.

---

## 🌟 Fitur Utama

1. **Deteksi Phishing Sisi Klien (Client-Side Random Forest)**:
   - Mengevaluasi 16 fitur leksikal dan struktural dari *hostname* URL menggunakan model Random Forest (60 pohon keputusan).
   - Inferensi berjalan 100% lokal di memori peramban tanpa server backend (kecepatan inferensi ~5,8 µs per URL atau >150.000 evaluasi/detik).
2. **Jaminan Privasi Mutlak (Zero Network Footprint)**:
   - Tidak ada pengiriman data URL, riwayat penjelajahan, maupun telemetri ke jaringan eksternal (`0 fetch()`, `0 XMLHttpRequest`).
   - Seluruh pengaturan dan riwayat kuis tersimpan di penyimpanan lokal peramban (`chrome.storage.local`).
3. **Halaman Peringatan Edukatif**:
   - Menjelaskan alasan mengapa suatu situs dicurigai dalam bahasa awam yang mudah dipahami (maksimal 4 alasan terprioritas).
   - Menyertakan *disclaimer* transparan bahwa hasil deteksi adalah indikasi risiko berdasarkan pola alamat web, bukan vonis kepastian mutlak.
   - Tombol "Kembali ke Tempat Aman" dan opsi "Tetap Lanjutkan (Sesi Ini)" jika pengguna yakin situs tersebut aman.
4. **Preset Sensitivitas yang Dapat Disesuaikan**:
   - **Ketat (Ambang 0,7 - Default)**: Meminimalkan peringatan keliru (*false positive rate* hanya 1,7%).
   - **Seimbang (Ambang 0,5)**: Deteksi lebih sensitif untuk lingkungan belajar atau pengujian.
5. **Allowlist Bawaan & Whitelist Pengguna**:
   - Dilengkapi allowlist bawaan berisi 41 domain layanan publik, produktivitas, dan perbankan populer di Indonesia dan global.
   - Pengguna dapat menambahkan domain terpercaya secara fleksibel melalui tab Whitelist di popup (mendukung *exact domain* dan wildcard `*.domain.com`).
6. **Modul Pembelajaran Literasi Digital & Kuis Pre/Post-Test**:
   - Memuat 5 topik materi literasi phishing: anatomi URL, manipulasi homograf/typosquatting, bahaya subdomain gratis & Dynamic DNS, teknik verifikasi hover tautan, dan mitigasi darurat saat terjebak phishing.
   - Kuis pre-test dan post-test 10 butir soal skenario nyata untuk mengukur peningkatan pemahaman (*gain score*).
   - Fitur ekspor data respons ke file CSV untuk pelaporan riset akademis.
7. **Skrip Agregasi Data Riset (`scripts/gabung_hasil.js`)**:
   - CLI berbasis Node.js untuk menggabungkan file-file CSV dari banyak responden, menangani data ganda, dan menghitung statistik perolehan nilai (*Normalized Gain Score*).
8. **Inspeksi Elemen Halaman Lokal (Opsional)**:
   - Pemeriksaan berbasis aturan langsung pada tab aktif saat diminta pengguna (mendeteksi input kata sandi, formulir lintas domain, dan iframe tersembunyi).

---

## 📊 Metrik Evaluasi Model

Model Random Forest dilatih menggunakan himpunan fitur hostname leksikal dan dievaluasi pada dataset pengujian (*test set*) independen dengan metrik resmi berikut:

| Preset | Ambang Batas (*Threshold*) | Presisi (*Precision*) | Kepekaan (*Recall*) | Angka Positif Palsu (*FPR*) |
|---|---|---|---|---|
| **Seimbang** | 0,5 | 0,911 | 0,685 | 0,050 (5,0%) |
| **Ketat** | 0,7 (Default) | 0,964 | 0,601 | 0,017 (1,7%) |

- **F1-Score pada Ambang 0,5**: **0,782**
- **Kecepatan Inferensi Rata-rata**: **0,0058 ms** (~5,8 mikrosekon per URL) pada lingkungan pengujian Node.js.

---

## ⚠️ Keterbatasan Sistem (Klaim Jujur & Transparan)

Sebagai produk akademik yang beretika, keterbatasan PhishShield dijelaskan secara terbuka dan jujur:

1. **Bias Dataset Global**: Model dilatih terutama menggunakan dataset ancaman phishing global, sehingga beberapa pola phishing lokal khas Indonesia (misal penyalahgunaan singkatan instansi lokal atau modus APK Android via web) mungkin memiliki representasi fitur yang berbeda.
2. **Performa Deteksi**: Pada data uji dataset, model memiliki F1 0,782, precision 0,911, dan recall 0,685 pada ambang 0,5. Artinya, model tidak menjamin dapat mendeteksi 100% situs phishing yang ada di internet.
3. **Fokus Analisis Hanya pada Hostname**: Model deteksi utama **hanya mengevaluasi string hostname**. Model tidak memeriksa jalur URL (*path*), parameter pencarian (*query*), sertifikat SSL/HTTPS, maupun isi konten teks di halaman web.
4. **Situs Sah yang Diretas (*Compromised Legitimate Sites*)**: Model tidak dapat mendeteksi situs resmi atau bereputasi tinggi yang telah diretas oleh penyerang untuk menyisipkan halaman phishing, karena hostname situs tersebut berstatus sah.
5. **Risiko Peringatan Keliru (*False Positive*)**: Hostname yang memiliki banyak subdomain bertingkat atau label panjang dapat dicurigai oleh model meskipun situs tersebut sah. Oleh karena itu, allowlist bawaan dan preset Ketat (0,7) disediakan untuk memitigasi hal ini.
6. **Mekanisme Pengalihan Bersifat *Best Effort***: Pencegatan navigasi dilakukan pada tahap awal navigasi frame peramban (`onBeforeNavigate`). Ini bukan firewall jaringan mutlak di level sistem operasi/kernel.

---

## 📁 Struktur Repositori

```
phishshield/
├─ extension/                   # Ekstensi Chrome Manifest V3
│  ├─ manifest.json             # Konfigurasi ekstensi & perizinan minimal
│  ├─ background/
│  │  └─ service_worker.js      # Pengawas navigasi, filter skema, interceptor
│  ├─ popup/                    # Antarmuka popup (Status, Whitelist, Preset, Edukasi)
│  │  ├─ popup.html
│  │  ├─ popup.css
│  │  └─ popup.js
│  ├─ warning/                  # Halaman edukatif saat situs dicurigai
│  │  ├─ warning.html
│  │  ├─ warning.css
│  │  └─ warning.js
│  ├─ education/                # Modul literasi digital & pre/post-test
│  │  ├─ education.html
│  │  ├─ education.css
│  │  ├─ education.js
│  │  ├─ quiz_bank.json         # Bank soal skenario pre-test dan post-test
│  │  └─ quiz_data.js           # Eskpor modul data kuis
│  ├─ lib/                      # Pustaka logika murni (ES Modules)
│  │  ├─ features.js            # Ekstraksi 16 fitur leksikal hostname
│  │  ├─ rf.js                  # Mesin inferensi Random Forest (Float32)
│  │  ├─ explain.js             # Pemetaan fitur ke alasan bahasa awam
│  │  ├─ allowlist.js           # Logika pencocokan exact & wildcard domain
│  │  ├─ allowlist.json         # 41 domain sah terverifikasi awal
│  │  ├─ meta.json              # Daftar fitur dan konstanta kamus kata kunci
│  │  ├─ meta.js                # ES wrapper konstanta meta
│  │  ├─ model_data.js          # ES wrapper model pohon keputusan
│  │  └─ page_rules.js          # Heuristik DOM lokal (password, cross-domain, iframe)
│  └─ assets/                   # Ikon ekstensi (16x16, 48x48, 128x128)
├─ model/                       # Data model asli (scikit-learn export, read-only)
│  ├─ model_rf.json             # Struktur 60 pohon keputusan
│  ├─ meta.json                 # Meta fitur & konstanta kata kunci
│  ├─ golden_features.json      # Acuan kebenaran ekstraksi fitur (Python)
│  └─ golden_predictions.json   # Acuan kebenaran prediksi probabilitas (scikit-learn)
├─ scripts/
│  └─ gabung_hasil.js           # CLI penggabungan & analisis CSV hasil tes
├─ tests/                       # Rangkaian pengujian terotomatisasi (102 tes)
│  ├─ unit/
│  │  ├─ features.test.js       # Uji ekstraksi fitur vs golden features
│  │  ├─ rf.test.js             # Uji inferensi RF vs golden predictions & benchmark
│  │  ├─ allowlist.test.js      # Uji integritas allowlist & proteksi domain spoofing
│  │  ├─ explain.test.js        # Uji logika penjelas alasan & disclaimer
│  │  ├─ quiz.test.js           # Uji modul kuis, penskoran, & ekspor CSV
│  │  ├─ page_rules.test.js     # Uji heuristik elemen DOM lokal
│  │  ├─ gabung_hasil.test.js   # Uji agregasi CSV & perhitungan gain
│  │  └─ security_audit.test.js # Audit keamanan kode (0 fetch, 0 eval, CSP, XSS)
│  ├─ integration/
│  │  ├─ navigation.test.js     # Uji simulasi alur navigasi service worker
│  │  ├─ e2e_flow.test.js       # Uji alur utuh URL -> Fitur -> Prediksi -> Alasan
│  │  └─ legit_hosts.test.js    # Uji empiris model pada 50 situs sah Indonesia & global
│  └─ fixtures/
│     ├─ legit_hosts.json       # Daftar 50 situs populer untuk uji kewajaran
│     └─ pages/                 # Fixture halaman HTML (safe_page & phishing_page)
├─ docs/                        # Dokumentasi teknis & panduan lengkap
│  ├─ ARCHITECTURE.md           # Arsitektur sistem, diagram Mermaid, detail teknis
│  ├─ TESTING.md                # Laporan strategi pengujian & checklist uji manual
│  ├─ PRIVACY.md                # Kebijakan privasi & justifikasi izin ekstensi
│  ├─ USER_GUIDE.md             # Panduan penggunaan lengkap pengguna & penilai
│  └─ SPRINT_LOG.md             # Log sprint Agile bertahap per fase
├─ package.json                 # Konfigurasi dependensi uji (node:test bawaan)
├─ CHANGELOG.md                 # Catatan rilis dan riwayat perubahan
└─ README.md                    # Dokumentasi utama proyek
```

---

## 🚀 Panduan Instalasi di Google Chrome

Ekstensi ini tidak memerlukan proses *build* atau *compile* (menggunakan JavaScript murni).

1. Buka peramban **Google Chrome**.
2. Masuk ke halaman pengelolaan ekstensi dengan mengetikkan `chrome://extensions/` pada bilah alamat URL.
3. Aktifkan **Developer mode** (Mode pengembang) melalui *toggle* switch di pojok kanan atas.
4. Klik tombol **Load unpacked** (Muat yang belum dibongkar) di pojok kiri atas.
5. Arahkan dan pilih folder `extension/` dari repositori ini.
6. Ekstensi **PhishShield** akan terpasang dan ikon perisai biru akan muncul di bilah alat peramban Anda.
7. Disarankan untuk men-sematkan (*pin*) ikon ekstensi agar mudah diakses.

---

## 🧪 Menjalankan Rangkaian Pengujian Otomatis

Seluruh pengujian dibangun menggunakan modul bawaan Node.js (`node:test` dan `node:assert/strict`) tanpa dependensi pustaka pihak ketiga.

### Prasyarat:
- Node.js versi 18.0.0 atau lebih baru (direkomendasikan Node.js LTS).

### Menjalankan Seluruh Pengujian (102 Tes):
```bash
npm test
```

### Menjalankan Pengujian Spesifik:
```bash
# Uji inferensi model Random Forest & benchmark performa
node --test tests/unit/rf.test.js

# Uji ekstraksi fitur vs acuan Python
node --test tests/unit/features.test.js

# Uji audit keamanan & privasi kode
node --test tests/unit/security_audit.test.js

# Uji kewajaran pada 50 situs sah Indonesia & global
node --test tests/integration/legit_hosts.test.js
```

---

## 🛠️ Menggunakan Skrip Agregasi Data Riset (`gabung_hasil.js`)

Jika Anda melakukan pengujian literasi pada sekelompok pengguna/responden:

1. Kumpulkan file CSV hasil unduhan responden dari modul kuis (misal `hasil_peserta1.csv`, `hasil_peserta2.csv`).
2. Jalankan skrip melalui terminal:
   ```bash
   node scripts/gabung_hasil.js -o gabungan_responden.csv hasil_peserta1.csv hasil_peserta2.csv
   ```
3. Skrip akan otomatis:
   - Mengabaikan file kosong atau rusak.
   - Menghapus duplikasi entri dengan mempertahankan catatan waktu paling mutakhir.
   - Menggabungkan baris pre-test dan post-test untuk setiap responden unik berdasarkan ID.
   - Menghitung peningkatan nilai (*gain*) dan mencetak ringkasan statistik ke terminal.

---
