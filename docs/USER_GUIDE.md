# Panduan Pengguna & Pengujian PhishShield
**Ekstensi Chrome Deteksi Phishing Berbasis Klien untuk Edukasi Literasi Digital**

Panduan ini disusun untuk membantu pengguna umum, mahasiswa, dan tim penguji/penilai Capstone Project dalam memasang, mengoperasikan, dan mengevaluasi seluruh fitur pada ekstensi **PhishShield**.

---

## Daftar Isi
1. [Panduan Instalasi di Google Chrome](#1-panduan-instalasi-di-google-chrome)
2. [Mengenal Antarmuka Popup Ekstensi](#2-mengenal-antarmuka-popup-ekstensi)
3. [Alur Deteksi & Halaman Peringatan Edukatif](#3-alur-deteksi--halaman-peringatan-edukatif)
4. [Mengelola Daftar Putih (Whitelist) Pribadi](#4-mengelola-daftar-putih-whitelist-pribadi)
5. [Mengatur Preset Sensitivitas Deteksi](#5-mengatur-preset-sensitivitas-deteksi)
6. [Modul Pembelajaran Literasi & Kuis Pre/Post-Test](#6-modul-pembelajaran-literasi--kuis-prepost-test)
7. [Panduan Ekspor & Agregasi Data Riset (Untuk Penguji/Peneliti)](#7-panduan-ekspor--agregasi-data-riset-untuk-pengujipeneliti)
8. [Tanya Jawab & Pemecahan Masalah (FAQ)](#8-tanya-jawab--pemecahan-masalah-faq)

---

## 1. Panduan Instalasi di Google Chrome

PhishShield adalah ekstensi berbasis Manifest V3 murni tanpa dependensi eksternal, sehingga tidak memerlukan proses *build* atau *compiler*.

### Langkah-langkah Memasang:
1. Pastikan peramban Google Chrome telah terpasang di komputer Anda.
2. Buka tab baru di Chrome dan ketikkan alamat berikut pada bilah URL:
   ```text
   chrome://extensions/
   ```
3. Di sudut kanan atas halaman tersebut, aktifkan tombol sakelar **Developer mode** (Mode pengembang).
4. Di bilah menu kiri atas yang muncul, klik tombol **Load unpacked** (Muat yang belum dibongkar).
5. Pada jendela penjelajah berkas (*file explorer*), arahkan dan pilih folder `extension/` di dalam repositori PhishShield ini.
6. Ekstensi **PhishShield** akan langsung aktif dan terdaftar di halaman ekstensi Chrome.
7. Klik ikon *puzzle* (Ekstensi) di pojok kanan atas toolbar Chrome, lalu klik ikon **Pin** (Sematkan) di samping PhishShield agar ikon perisai biru selalu terlihat di bilah peramban.

```text
[Tangkapan Layar: Memuat folder extension/ di halaman chrome://extensions via tombol Load unpacked dengan Developer Mode aktif]
```

---

## 2. Mengenal Antarmuka Popup Ekstensi

Untuk membuka menu kontrol utama, klik ikon perisai biru PhishShield pada toolbar peramban. Antarmuka popup menyediakan 4 tab navigasi utama:

```text
[Tangkapan Layar: Tampilan keseluruhan popup PhishShield yang memuat 4 tab: Status, Whitelist, Pengaturan, dan Edukasi]
```

### Tab 1: Status
- **Analisis Hostname Real-time**: Menampilkan hostname tab yang sedang aktif (misalnya `id.wikipedia.org`).
- **Skor Risiko Phishing**: Menampilkan persentase probabilitas hasil evaluasi model Random Forest (misalnya `0.02%` atau `87.40%`).
- **Lencana Status (*Badge*)**:
  - 🟢 **Situs Aman**: Situs terdaftar di Allowlist bawaan atau memiliki skor di bawah ambang batas.
  - 🔴 **Berisiko Phishing**: Hostname terindikasi memiliki pola phishing dan melebihi ambang batas preset.
  - ⚪ **Daftar Putih**: Situs dimasukkan oleh pengguna ke Whitelist pribadi.
- **Tombol "Tambah ke Whitelist"**: Memasukkan hostname tab aktif ke whitelist pribadi dengan satu kali klik.
- **Inspeksi Elemen Halaman (Opsional)**: Tombol *"Periksa Elemen Halaman Ini"* untuk menjalankan audit DOM lokal terhadap kolom kata sandi, formulir lintas domain, dan iframe tersembunyi.

```text
[Tangkapan Layar: Popup Tab Status menampilkan status hijau 'Situs Terdaftar di Allowlist' pada situs populer]
```

---

## 3. Alur Deteksi & Halaman Peringatan Edukatif

Saat Anda menjelajah web dan peramban mencoba membuka alamat URL yang memiliki pola hostname mencurigakan (misalnya `login-verifikasi-bca.top`), PhishShield akan mencegat navigasi secara otomatis sebelum halaman tersebut selesai dimuat.

Peramban akan dialihkan ke **Halaman Peringatan Edukatif (`warning.html`)**:

```text
[Tangkapan Layar: Halaman peringatan warning.html dengan latar belakang peringatan yang jelas, menampilkan hostname mencurigakan dan kartu alasan risiko]
```

### Elemen-elemen pada Halaman Peringatan:
1. **Identifikasi Situs**: Menampilkan nama hostname yang dicurigai beserta skor estimasi risiko phishing.
2. **Kartu Alasan Risiko (Bahasa Awam)**: Menjelaskan alasan spesifik mengapa situs tersebut dicurigai, misalnya:
   - *"Alamat web menggunakan domain tingkat atas (TLD) berisiko tinggi (.top) yang sering disalahgunakan untuk penipuan."*
   - *"Ditemukan kata kunci sensitif (login, verifikasi) pada alamat web yang bukan domain resmi perbankan."*
   - *"Alamat web memiliki tanda hubung atau struktur subdomain bertingkat yang tidak lazim."*
3. **Catatan Transparansi (*Disclaimer*)**:
   - Menegaskan bahwa peringatan ini adalah *indikasi risiko berdasarkan pola alamat web*, bukan vonis kepastian mutlak.
4. **Tombol Tindakan Pengguna**:
   - **Kembali ke Tempat Aman (Direkomendasikan)**: Menutup tab atau mengarahkan pengguna kembali ke halaman aman sebelumnya.
   - **Tetap Lanjutkan (Sesi Ini)**: Tombol opsi lanjutan bagi pengguna yang yakin situs tersebut aman. Menekan tombol ini akan mengaktifkan *session bypass* sementara untuk hostname tersebut selama sesi peramban berjalan.

---

## 4. Mengelola Daftar Putih (Whitelist) Pribadi

Jika ada situs lokal, intranet kantor, portal kampus, atau situs khusus yang sering Anda gunakan dan tidak ingin diperiksa oleh model, Anda dapat mengelolanya melalui **Tab Whitelist**:

```text
[Tangkapan Layar: Popup Tab Whitelist dengan formulir penambahan domain dan daftar domain terpercaya pengguna]
```

### Menambahkan Domain:
1. Buka popup PhishShield, lalu klik tab **Whitelist**.
2. Masukkan nama domain pada kolom isian, contoh:
   - Domain persis: `siakad.kampus.ac.id`
   - Pola wildcard: `*.kampus.ac.id` (otomatis melindungi semua subdomain kampus).
3. Klik tombol **Tambah**. Domain akan langsung tersimpan di penyimpanan lokal peramban.

### Menghapus Domain:
- Klik tombol **Hapus** berwarna merah di samping nama domain yang ingin Anda keluarkan dari daftar putih.

---

## 5. Mengatur Preset Sensitivitas Deteksi

PhishShield menyediakan dua preset sensitivitas yang dapat diatur melalui **Tab Pengaturan**:

```text
[Tangkapan Layar: Popup Tab Pengaturan menampilkan perbandingan metrik resmi antara Preset Ketat dan Preset Seimbang]
```

| Preset | Ambang Batas (*Threshold*) | Karakteristik Penggunaan | Rekomendasi |
|---|---|---|---|
| **Ketat (Default)** | **0,7** | Menekan alarm keliru (*false positive rate* sangat rendah: 1,7%). Hanya situs dengan anomali pola hostname yang kuat yang akan dicegat. | **Sangat direkomendasikan untuk penggunaan sehari-hari.** |
| **Seimbang** | **0,5** | Deteksi lebih sensitif (*recall* 68,5%), namun tingkat false alarm sedikit lebih tinggi (5,0%). | Cocok untuk demonstrasi pengujian, pelatihan literasi, atau lingkungan dengan kewaspadaan tinggi. |

### Cara Mengganti Preset:
1. Masuk ke tab **Pengaturan** pada popup.
2. Pilih salah satu radio button (*Ketat* atau *Seimbang*).
3. Klik tombol **Simpan Pengaturan**. Pengaturan baru akan langsung diterapkan seketika pada background service worker.

---

## 6. Modul Pembelajaran Literasi & Kuis Pre/Post-Test

Untuk membuka modul literasi digital lengkap:
- Klik tab **Edukasi** pada popup, lalu klik tombol **"Buka Modul Edukasi Lengkap"**, atau
- Buka tautan langsung pada tab peramban Anda melalui URL ekstensi:
  ```text
  chrome-extension://<EXTENSION_ID>/education/education.html
  ```

```text
[Tangkapan Layar: Halaman utama modul edukasi literasi digital education.html dengan navigasi 5 materi pembelajaran]
```

### Materi Pembelajaran yang Disediakan:
1. **Modul 1: Anatomi Alamat Web (URL)** — Memahami perbedaan domain utama (*hostname*) vs jalur direktori (*path*).
2. **Modul 2: Manipulasi Homograf & Typosquatting** — Mengenal tipuan karakter mirip (Punycode) dan salah ketik yang disengaja.
3. **Modul 3: Layanan Hosting Gratisan & Dynamic DNS** — Mengapa penipu menyukai subdomain gratisan (`.pages.dev`, `.firebaseapp.com`, Dynamic DNS).
4. **Modul 4: Teknik Mengarahkan Kursor (Link Hovering)** — Cara memeriksa ke mana tautan sebenarnya mengarah sebelum mengkliknya.
5. **Modul 5: Mitigasi Darurat Saat Terlanjur Terjebak** — Tindakan cepat jika Anda terlanjur mengisi kata sandi atau data bank di situs palsu.

```text
[Tangkapan Layar: Antarmuka kuis interaktif menampilkan studi kasus skenario phishing, 4 opsi jawaban, dan penjelasan jawaban edukatif]
```

### Mengikuti Evaluasi Pemahaman (Pre-Test & Post-Test):
- **Pre-Test**: Berisi 10 butir soal studi kasus untuk mengukur tingkat kewaspadaan dan pengetahuan dasar pengguna sebelum membaca materi.
- **Post-Test**: Berisi 10 butir soal dengan tingkat kesulitan setara untuk mengukur peningkatan pemahaman pengguna setelah mempelajari materi.
- Setiap selesai menjawab, sistem akan menampilkan skor akhir, jumlah jawaban benar, dan ulasan edukatif mendalam untuk setiap nomor soal.

---

## 7. Panduan Ekspor & Agregasi Data Riset (Untuk Penguji/Peneliti)

Modul evaluasi PhishShield dilengkapi fitur ekspor data terstruktur untuk mendukung pengumpulan data eksperimen literasi digital.

### A. Mengekspor Data dari Peramban Responden:
1. Setelah responden menyelesaikan Pre-Test atau Post-Test pada `education.html`, gulir ke bagian **"Riwayat & Ekspor Hasil Tes"**.
2. Klik tombol **"Unduh Hasil Tes (CSV)"**.
3. Peramban akan mengunduh file dengan format:
   ```text
   phishshield_results_<uuid>.csv
   ```
   Isi file berupa rekaman baris terstruktur:
   `id,mode,score,correct_count,total_questions,timestamp`

### B. Menggabungkan Hasil Banyak Responden (`scripts/gabung_hasil.js`):
Repositori ini menyediakan skrip CLI berbasis Node.js untuk menggabungkan file-file CSV dari puluhan atau ratusan responden.

1. Tempatkan semua file CSV yang telah dikumpulkan ke dalam satu folder (misalnya `hasil_peserta/`).
2. Jalankan skrip melalui terminal:
   ```bash
   node scripts/gabung_hasil.js -o rekap_akhir.csv hasil_peserta/*.csv
   ```
3. Fitur otomatis skrip:
   - **Pembersihan Data**: File kosong atau korup otomatis dilewati tanpa menghentikan proses.
   - **Deduplikasi Cerdas**: Jika seorang responden memiliki beberapa rekaman untuk mode yang sama, rekaman dengan stempel waktu terbaru yang akan digunakan.
   - **Penghitungan Gain**: Menghitung selisih nilai post-test dikurangi pre-test untuk setiap responden yang telah menyelesaikan kedua tes.
   - **Rekapitulasi Statistik**: Menampilkan ringkasan rata-rata skor pre-test, post-test, dan *average gain score* langsung di layar terminal.

```text
[Tangkapan Layar: Tampilan output terminal Node.js saat menjalankan skrip gabung_hasil.js yang menghasilkan tabel ringkasan evaluasi peserta]
```

---

## 8. Tanya Jawab & Pemecahan Masalah (FAQ)

### T: Mengapa situs perbankan resmi seperti KlikBCA atau DJP Online tidak terblokir?
**J:** PhishShield menyertakan *Allowlist Bawaan* yang memuat 35 domain resmi perbankan, instansi pemerintah, dan platform teknologi terpercaya di Indonesia dan global. Domain-domain ini diperiksa terlebih dahulu sebelum model dieksekusi untuk memastikan kelancaran aktivitas harian pengguna.

### T: Bagaimana jika situs kampus atau portal internal kantor saya terindikasi phishing?
**J:** Anda dapat menambahkan domain tersebut ke **Whitelist Pribadi** melalui tab Whitelist pada popup. Setelah ditambahkan, PhishShield tidak akan pernah memblokir alamat tersebut.

### T: Mengapa model tidak mendeteksi tautan phishing seperti `https://docs.google.com/forms/d/e/.../viewform`?
**J:** Sesuai prinsip desain sistem, PhishShield sengaja dirancang untuk mengevaluasi fitur **hostname saja** demi menjaga privasi penuh tanpa memeriksa konten halaman. Platform seperti Google Docs menampung miliaran konten pengguna yang sah, sehingga mendeteksi konten formulir di platform tersebut membutuhkan analisis isi halaman (*content inspection*) yang sengaja dihindari demi privasi data pengguna. Sebagai solusinya, Modul 3 pada edukasi PhishShield memberikan edukasi khusus mengenai bahaya formulir phishing di platform hosting publik.

### T: Apakah ekstensi ini membebani penggunaan CPU atau RAM peramban?
**J:** Tidak. Mesin inferensi Random Forest dioptimalkan dengan presisi `Float32Array` dan hanya membutuhkan waktu sekitar **0,0058 ms** (~5,8 mikrodetik) per URL. Beban komputasi ini sangat ringan dan hampir tidak dapat diukur oleh pengguna.

### T: Apakah data riwayat penjelajahan saya dikirim ke internet?
**J:** **Sama sekali tidak.** Seluruh kode ekstensi tidak memiliki pemanggilan jaringan keluar (`0 fetch()`, `0 XMLHttpRequest`). Seluruh inferensi dan penyimpanan data berjalan 100% di komputer lokal Anda.
