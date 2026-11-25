# Ringkasan Eksekutif & Pemetaan Laporan Capstone Project
**PhishShield — Ekstensi Chrome Deteksi Phishing Berbasis Klien untuk Edukasi Literasi Digital**

Dokumen ini disusun sebagai panduan komprehensif bagi mahasiswa Teknik Informatika dalam menyusun naskah laporan tugas akhir / capstone project (Tema: **Literasi Digital dan Keamanan Informasi**). Seluruh data, metrik, arsitektur, dan hasil pengujian yang dicantumkan di sini telah diverifikasi secara empiris melalui kode dan pengujian terotomatisasi di repositori.

---

## 1. Identitas Proyek & Abstrak Eksekutif

- **Judul Produk**: PhishShield — Ekstensi Peramban Pendeteksi Indikasi Phishing Berbasis Klien dengan Modul Edukasi Literasi Digital Interaktif
- **Platform**: Google Chrome (Manifest V3, Pure JavaScript ES Modules, Zero External Runtime Dependencies)
- **Tema Capstone**: Literasi Digital, Kesadaran Keamanan Siber (*Cybersecurity Awareness*), Pembelajaran Mesin di Sisi Klien (*Client-Side Machine Learning*).
- **Latar Belakang**:
  Tingginya angka kejahatan siber phishing di Indonesia sering kali menyasar pengguna awam melalui manipulasi rekayasa sosial (*social engineering*) dan alamat web palsu. Solusi keamanan berbasis cloud konvensional sering kali menimbulkan kekhawatiran privasi karena mengirimkan seluruh riwayat penelusuran pengguna ke server eksternal, serta hanya memberikan peringatan biner ("Blokir") tanpa memberikan penjelasan yang mendidik.
- **Kebaruan & Kontribusi Proyek**:
  1. **Privasi Penuh (Zero Network Footprint)**: Melakukan inferensi model *Random Forest* (60 pohon keputusan) sepenuhnya di dalam peramban pengguna dalam waktu ~5,8 mikrosekon per URL, tanpa memanggil API jaringan (`0 fetch()`, `0 XMLHttpRequest`).
  2. **Peringatan Edukatif Transparan**: Mengubah fitur teknis alamat web menjadi alasan risiko berbasis bahasa awam (maksimal 4 poin terprioritas) dilengkapi *disclaimer* indikasi risiko.
  3. **Intervensi Literasi Digital Terukur**: Menyediakan modul pembelajaran 5 topik terintegrasi beserta pre-test dan post-test 10 butir soal skenario, lengkap dengan ekspor CSV lokal dan skrip agregasi data riset (`gabung_hasil.js`) untuk mengukur peningkatan pemahaman pengguna (*normalized gain score*).

---

## 2. Pemetaan Bab Laporan Capstone

Berikut adalah pemetaan materi dan luaran teknis proyek ke dalam struktur bab laporan tugas akhir:

```
Naskah Laporan Capstone               Komponen / Dokumen Acuan di Repositori
├─ Bab IV: Perancangan Arsitektur ─── docs/ARCHITECTURE.md, extension/manifest.json
├─ Bab VI: Implementasi Sistem ────── extension/lib/, extension/warning/, extension/education/
├─ Bab VII: Pengujian & Evaluasi ──── docs/TESTING.md, tests/ (104 tes lulus), model/
├─ Bab VIII: Keamanan & Privasi ───── docs/PRIVACY.md, tests/unit/security_audit.test.js
└─ Bab IX: Kesimpulan & Keterbatasan  README.md, docs/RINGKASAN_LAPORAN.md
```

---

### A. Bab IV: Perancangan Arsitektur Sistem

Poin-poin arsitektur yang dapat langsung dimasukkan ke Bab IV:

1. **Arsitektur Chrome Extension Manifest V3 (MV3)**:
   - Menggunakan *Service Worker* di latar belakang (`background/service_worker.js`) yang berjalan secara *event-driven* (hidup hanya saat ada navigasi, hemat daya dan memori).
   - Menggunakan komunikasi modular ES Modules murni tanpa *bundler* atau *compiler* rumit (Webpack/Vite tidak diperlukan), mempermudah audit kode sumber.
2. **Pencegatan Navigasi Real-Time (`onBeforeNavigate`)**:
   - Memantau event navigasi frame utama (`frameId === 0`).
   - Menyaring skema internal (`chrome://`, `file://`, `chrome-extension://`).
   - Menerapkan alur berjenjang: **Allowlist Bawaan $\rightarrow$ Whitelist Pengguna $\rightarrow$ Session Bypass $\rightarrow$ Ekstraksi Fitur $\rightarrow$ Inferensi Model ML $\rightarrow$ Pengalihan Edukatif**.
3. **Penyimpanan Lokal Mandiri (`chrome.storage.local`)**:
   - Seluruh status persistensi (pilihan preset sensitivitas, daftar putih domain pengguna, pengecualian sesi sementara, dan rekaman jawaban kuis) tersimpan secara luring (*offline*) di penyimpanan lokal peramban.

*(Gunakan diagram Mermaid yang tersedia di `docs/ARCHITECTURE.md` untuk visualisasi arsitektur dan alur navigasi).*

---

### B. Bab VI: Implementasi Perangkat Lunak

Rincian modul implementasi untuk Bab VI:

1. **Ekstraksi Fitur Hostname Leksikal (`extension/lib/features.js`)**:
   - Porting persis dari pustaka acuan Python (`urllib.parse`, `math`, `re`).
   - Menghitung 16 fitur leksikal dari string hostname:
     - Struktural: `host_len`, `n_labels`, `n_subdomains`, `n_dots`, `n_hyphens`, `n_digits`, `longest_label`, `tld_len`.
     - Statistik: `digit_ratio`, `entropy` (Shannon Entropy berbasis frekuensi karakter).
     - Pola Ancaman Khusus: `is_ip`, `has_punycode` (homograf IDN), `is_free_hosting`, `is_dynamic_dns`, `risky_tld`, `n_sensitive_kw`.
   - Mengatasi perbedaan teknis Python vs JS (pembersihan tanda kurung siku IPv6, penanganan normalisasi Punycode otomatis oleh peramban, dan penanganan presisi IEEE 754 float64).
2. **Mesin Inferensi Random Forest Klien (`extension/lib/rf.js`)**:
   - Mengevaluasi 60 pohon keputusan scikit-learn (`model/model_rf.json`).
   - Menggunakan `Math.fround` (float32) untuk menyamakan presisi batas pemisahan node scikit-learn.
   - Mengagregasi probabilitas kelas positif dari seluruh pohon dan membandingkannya dengan ambang preset.
3. **Allowlist Bawaan Heuristik (`extension/lib/allowlist.js`)**:
   - 41 domain resmi populer di Indonesia (KlikBCA, BCA, Mandiri, BNI, BRI, Tokopedia, Seller Tokopedia, Shopee, DJP, Pajak, Detik, Kompas, dsb) dan global (Google, Colab, Classroom, Microsoft, Microsoft Login, Teams, Apple, GitHub, Telegram, Wikipedia, dsb).
   - Aturan pencocokan ketat: *exact match* dan *dot-bounded wildcard* `*.` (mencegah eksploitasi akhiran domain seperti `google.com.attacker.xyz`).
   - Larangan keras terhadap platform penampung konten pengguna (*user-content platforms* seperti `docs.google.com`, `sites.google.com`, `github.io`, `web.app`).
4. **Modul Penjelas Alasan Edukatif (`extension/lib/explain.js`)**:
   - Memetakan 12 pemicu fitur ke alasan berbahasa awam yang diprioritaskan berdasarkan bobot risiko.
   - Membatasi tampilan maksimal 4 alasan teratas agar pengguna awam tidak mengalami kelebihan beban kognitif (*cognitive overload*).
   - Menyertakan teks *disclaimer* wajib: *"Peringatan ini merupakan indikasi risiko berdasarkan pola alamat web, bukan kepastian."*
5. **Antarmuka Pengguna (UI) Aman dari Celah XSS**:
   - Halaman Peringatan (`warning/warning.html`): Bebas `innerHTML` (100% menggunakan `textContent` / `document.createElement`), tombol kembali aman, dan tombol bypass sesi sementara.
   - Popup Kontrol (`popup/popup.html`): 4 tab navigasi (Status tab aktif, Whitelist pribadi, Pengaturan preset, dan Navigasi modul edukasi).
6. **Modul Edukasi Literasi Digital & Evaluasi Kuis (`extension/education/`)**:
   - Memuat 5 materi literasi terstruktur (Anatomi URL, Homograf/Typosquatting, Hosting Gratisan, Link Hovering, Mitigasi Darurat).
   - Kuis Pre-Test (10 soal skenario) dan Post-Test (10 soal skenario setara) lengkap dengan pembahasan edukatif interaktif.
   - Ekspor data respons terstruktur ke file CSV (`phishshield_results_<uuid>.csv`).
7. **Skrip Agregasi Data Riset (`scripts/gabung_hasil.js`)**:
   - Alat CLI Node.js untuk menggabungkan file-file CSV dari banyak responden, membersihkan file rusak/kosong, mendeduplikasi ID responden ganda, dan menghitung statistik *Normalized Gain Score*.
8. **Modul Inspeksi Elemen DOM Lokal (`extension/lib/page_rules.js`)**:
   - Fitur pendukung *on-demand* pada tab aktif untuk memeriksa kolom password, formulir lintas domain (*cross-domain form action*), dan iframe tersembunyi.
   - Dipisahkan secara tegas dari model pembelajaran mesin utama.

---

### C. Bab VII: Pengujian Fungsional, Integrasi & Analisis Performa

Seluruh data pengujian berikut dihasilkan secara nyata dari eksekusi `npm test`:

#### 1. Rekapitulasi Rangkaian Pengujian Terotomatisasi (104 Pengujian Lulus 100%)
| Kategori Pengujian | Berkas Uji | Jumlah Tes | Status |
|---|---|---|---|
| **Ekstraksi Fitur** | `tests/unit/features.test.js` | 21 | LULUS (Selisih numerik $< 10^{-9}$ vs Python) |
| **Inferensi Model RF** | `tests/unit/rf.test.js` | 6 | LULUS (Akurasi 100% vs 300 data scikit-learn) |
| **Aturan Allowlist** | `tests/unit/allowlist.test.js` | 13 | LULUS (Pertahanan spoofing suffix domain) |
| **Penjelas Alasan** | `tests/unit/explain.test.js` | 13 | LULUS (Maks 4 alasan, disclaimer wajib) |
| **Modul Kuis & CSV** | `tests/unit/quiz.test.js` | 10 | LULUS (Struktur bank soal, penskoran, CSV) |
| **Skrip Agregasi CLI** | `tests/unit/gabung_hasil.test.js` | 7 | LULUS (Deduplikasi, pembersihan, gain score) |
| **Inspeksi Elemen DOM** | `tests/unit/page_rules.test.js` | 5 | LULUS (Password, cross-domain, hidden iframe) |
| **Audit Keamanan Statis**| `tests/unit/security_audit.test.js` | 11 | LULUS (0 fetch, 0 eval, CSP, anti-XSS) |
| **Skrip Packaging ZIP** | `tests/unit/build_zip.test.js` | 2 | LULUS (Verifikasi PKZIP & berkas rilis) |
| **Simulasi Navigasi SW**| `tests/integration/navigation.test.js` | 11 | LULUS (Filter skema, pengalihan, bypass) |
| **Alur Utuh (End-to-End)**| `tests/integration/e2e_flow.test.js` | 4 | LULUS (URL $\rightarrow$ Fitur $\rightarrow$ RF $\rightarrow$ UI) |
| **Uji Kewajaran Situs Sah**| `tests/integration/legit_hosts.test.js` | 1 | LULUS (Evaluasi empiris 50 situs sah) |
| **TOTAL** | **12 File Pengujian** | **104 Tes** | **100% LULUS (Durasi ~450 ms)** |

#### 2. Validasi Terhadap Acuan Kebenaran (*Golden Dataset*)
- **Sampel Acuan Fitur (`golden_features.json`)**: 20 URL uji ekstrem (IPv4, IPv6, Punycode, TLD berisiko, subdomain bertingkat) dievaluasi dengan selisih numerik $< 10^{-9}$ dibandingkan pustaka Python.
- **Sampel Acuan Prediksi (`golden_predictions.json`)**: 300 URL uji acak dari scikit-learn dievaluasi:
  - Kesesuaian keputusan klasifikasi (ambang 0,5): **300/300 sampel (100,00%)**.
  - Selisih nilai probabilitas maksimum: **$9,8133 \times 10^{-8}$** (jauh lebih presisi dari toleransi $10^{-4}$).

#### 3. Benchmark Performa Waktu Eksekusi
- **Pengujian Kecepatan**: 15.000 evaluasi (50 putaran $\times$ 300 URL).
- **Waktu Inferensi Rata-rata per URL**: **0,0058 ms – 0,0066 ms** (~5,8 hingga 6,6 mikrosekon).
- **Throughput Inferensi**: **>150.000 evaluasi URL per detik** pada lingkungan Node.js.
- **Kesimpulan**: Ekstensi tidak menimbulkan latensi navigasi yang dapat dirasakan oleh pengguna (*zero perceptible browsing delay*).

#### 4. Pengujian Kewajaran Empiris pada 50 Situs Sah Indonesia & Global (Tanpa Allowlist)
Model pembelajaran mesin diuji murni tanpa bantuan allowlist terhadap 50 situs sah populer untuk mengukur risiko positif palsu:
- **Preset Seimbang (Ambang 0,5)**: 2 dari 50 situs sah ditandai phishing (**4,0% FPR**), yaitu `ocbc.id` (skor 0,6609) dan `seller.tokopedia.com` (skor 0,8439).
- **Preset Ketat (Ambang 0,7 - Default)**: Hanya 1 dari 50 situs sah yang ditandai phishing (**2,0% FPR**), yaitu `seller.tokopedia.com` (skor 0,8439). Domain pendek `ocbc.id` (0,6609) berhasil lolos aman.
- **Kesimpulan**: Pemilihan ambang batas 0,7 sebagai default terbukti secara empiris mampu menekan alarm keliru pada situs perbankan resmi dengan nama domain pendek.

#### 5. Metrik Evaluasi Resmi Model pada Data Uji Dataset (*Test Dataset*)
| Preset | Ambang Batas (*Threshold*) | Presisi (*Precision*) | Kepekaan (*Recall*) | Angka Positif Palsu (*FPR*) |
|---|---|---|---|---|
| **Seimbang** | 0,5 | 0,911 | 0,685 | 0,050 (5,0%) |
| **Ketat** | 0,7 (Default) | 0,964 | 0,601 | 0,017 (1,7%) |

- **F1-Score pada Ambang 0,5**: **0,782**

---

### D. Bab VIII: Analisis Keamanan & Privasi

Poin-poin analisis keamanan untuk Bab VIII:

1. **Prinsip *Privacy by Design* & *Zero Network Footprint***:
   - Audit kode statis (`security_audit.test.js`) membuktikan tidak ada pemanggilan `fetch()`, `XMLHttpRequest`, `WebSocket`, maupun API jaringan keluar lainnya di seluruh folder `extension/`.
   - Tidak ada pengumpulan data telemetri, crash report pihak ketiga, maupun pelacakan perilaku (bebas dari Google Analytics, Mixpanel, Sentry, dsb).
2. **Keamanan Eksekusi Kode Dinamis**:
   - 0 penggunaan `eval()` atau pembuatan fungsi dinamis (`new Function()`).
   - Seluruh kode bersifat statis dan deterministik.
3. **Pencegahan Celah Cross-Site Scripting (XSS)**:
   - Parameter URL (`host`, `score`) di halaman peringatan dirender menggunakan `element.textContent`, bukan `innerHTML`.
   - Diuji kebal terhadap berbagai variasi payload serangan injeksi XSS (misal `<script>alert(1)</script>`, `"><img src=x onerror=...>`, dsb).
4. **Kebijakan Keamanan Konten (CSP) Ketat**:
   ```json
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self';"
   }
   ```
   Melarang skrip inline dan skrip jarak jauh dari CDN eksternal.
5. **Justifikasi Izin Peramban (*Least Privilege Principle*)**:
   - `webNavigation`: Mencegat navigasi frame utama sebelum konten berbahaya dimuat.
   - `storage`: Menyimpan konfigurasi preset, whitelist, dan hasil kuis secara luring.
   - `activeTab` & `scripting`: Hanya diaktifkan saat pengguna secara sadar mengklik tombol inspeksi di popup.
   - **Tanpa `host_permissions` luas**: Tidak meminta izin `<all_urls>` atau `*://*/*`, menjamin ekstensi tidak memiliki akses terhadap cookie, sesi login, atau lalu lintas data situs web lain di latar belakang.

---

### E. Bab Keterbatasan & Saran Pengembangan

Poin keterbatasan jujur dan saran yang wajib dicantumkan pada bab penutup laporan:

1. **Keterbatasan Sistem**:
   - **Bias Dataset Global**: Model dilatih dari repositori ancaman global, sehingga modus operandi lokal yang sangat spesifik (misal penipuan berkedok kurir paket APK Android via web) membutuhkan fitur kontekstual tambahan.
   - **Performa Model**: F1 0,782, precision 0,911, dan recall 0,685 pada data uji (ambang 0,5). Model tidak menjamin deteksi 100% dari seluruh ancaman baru di internet.
   - **Fokus Leksikal Hostname**: Model tidak membaca jalur URL (*path*), query, sertifikat TLS/SSL, maupun konten teks di halaman web.
   - **Situs Sah yang Diretas (*Compromised Legitimate Sites*)**: Model tidak dapat mendeteksi situs sah bereputasi baik yang telah disusupi skrip phishing oleh peretas.
   - **Risiko Positif Palsu pada Subdomain Bertingkat**: Layanan sah dengan hierarki subdomain panjang (seperti `seller.tokopedia.com`) dapat terpicu false alarm jika tidak tercakup di allowlist.
   - **Mekanisme *Best Effort***: Pencegatan navigasi terjadi pada peramban tingkat aplikasi, bukan firewall tingkat jaringan atau sistem operasi.
2. **Saran Pengembangan Selanjutnya**:
   - Integrasi model NLP ringan sisi klien untuk menganalisis kemiripan semantik nama instansi lokal Indonesia (mendeteksi *typosquatting* merek lokal).
   - Penambahan pemeriksaan usia domain (*domain age*) melalui cache luring domain terdaftar.
   - Peningkatan variasi soal literasi digital berdasarkan tren penipuan siber terkini di Indonesia.

---

## 3. Checklist Aksi Mandiri untuk Mahasiswa

Langkah-langkah praktis yang perlu Anda lakukan untuk melengkapi naskah laporan skripsi, lampiran, dan bahan presentasi:

- [ ] **1. Mengambil Tangkapan Layar Asli di Google Chrome**:
  - Pasang folder `extension/` via `chrome://extensions` (*Load unpacked*).
  - Buka popup dan ambil tangkapan layar untuk 4 tab: **Tab Status**, **Tab Whitelist**, **Tab Pengaturan**, dan **Tab Edukasi**.
  - Buka halaman peringatan dengan membuka tautan pengujian (misal `http://login-verifikasi-bca.top` atau langsung `chrome-extension://<ID>/warning/warning.html?host=login-verifikasi-bca.top&score=0.92`) dan ambil tangkapan layar antarmuka peringatan.
  - Buka modul edukasi `chrome-extension://<ID>/education/education.html` dan ambil tangkapan layar materi serta kuis interaktif.
  - Masukkan tangkapan layar tersebut ke Bab Implementasi sesuai penanda di [USER_GUIDE.md](./USER_GUIDE.md).

- [ ] **2. Melakukan Uji Coba Pengguna (*User Testing*) / Eksperimen Literasi**:
  - Bagikan modul kuis (Pre-Test dan Post-Test) kepada sejumlah rekan mahasiswa/responden.
  - Minta setiap responden mengunduh file CSV hasil tes mereka via tombol *"Unduh Hasil Tes (CSV)"*.
  - Kumpulkan seluruh file CSV ke dalam satu folder.
  - Jalankan skrip agregasi:
    ```bash
    node scripts/gabung_hasil.js -o hasil_gabungan_responden.csv path/ke/folder_csv/*.csv
    ```
  - Catat nilai rata-rata pre-test, post-test, dan *average gain score* yang tercetak di layar terminal untuk dimasukkan ke Bab Pembahasan/Hasil Penelitian.

- [ ] **3. Menyalin Tabel & Metrik Resmi ke Laporan**:
  - Gunakan tabel metrik resmi di Bagian 2.C dokumen ini (Ambang 0,5: Prec 0,911, Rec 0,685, FPR 0,050; Ambang 0,7: Prec 0,964, Rec 0,601, FPR 0,017; F1 0,782).
  - Salin tabel hasil pengujian 104 tes otomatis untuk Lampiran Laporan Pengujian Perangkat Lunak.

- [ ] **4. Menyiapkan Paket Rilis untuk Penguji / Dosen Pembimbing**:
  - File paket distribusi siap pakai telah tersedia di folder `dist/`:
    `dist/phishshield-v1.0.0.zip` (ukuran ~800 KB).
  - Berkas zip ini dapat langsung diserahkan kepada dosen penguji untuk dipasang dan diuji secara mandiri tanpa memerlukan instalasi Node.js.
