# Kebijakan Privasi & Keamanan Data (Privacy & Security Policy)
**PhishShield — Ekstensi Deteksi Phishing Berbasis Klien untuk Edukasi Literasi Digital**

Dokumen ini menjelaskan komitmen privasi, arsitektur keamanan data, dan justifikasi teknis izin peramban yang diterapkan pada ekstensi Chrome **PhishShield**. Proyek ini dikembangkan dengan prinsip **Privacy by Design** dan **Zero Network Footprint**, memastikan perlindungan menyeluruh terhadap privasi aktivitas penjelajahan pengguna.

---

## 1. Prinsip Utama: Privasi Sejak Desain (Privacy by Design)

PhishShield dirancang untuk mahasiswa, institusi pendidikan, dan masyarakat umum dengan filosofi bahwa **keamanan siber tidak boleh mengorbankan privasi pengguna**. Ekstensi ini beroperasi secara mandiri di sisi klien (*client-side only*) tanpa bergantung pada server backend, cloud API, maupun layanan analitik pihak ketiga.

| Prinsip | Implementasi Teknis |
|---|---|
| **Zero Network Footprint** | Tidak ada fungsi `fetch()`, `XMLHttpRequest`, `WebSocket`, atau pemanggilan API remote di seluruh kode ekstensi. |
| **Local Inference** | Model machine learning *Random Forest* dievaluasi sepenuhnya di dalam peramban melalui JavaScript murni (ES Modules). |
| **Minimal Data Exposure** | Hanya string hostname yang dievaluasi; path, query parameters, data formulir, dan konten halaman diabaikan oleh mesin deteksi utama. |
| **Local Storage Only** | Seluruh data konfigurasi dan riwayat kuis tersimpan di penyimpanan lokal peramban (`chrome.storage.local`). |

---

## 2. Data Apa yang Diproses?

PhishShield menerapkan pembatasan data yang sangat ketat:

### A. Data yang Diproses:
- **Hostname Situs Web**: Saat pengguna menavigasi ke sebuah situs (misal `https://subdomain.example.com/path/login?token=xyz`), PhishShield hanya mengekstraksi bagian hostname-nya saja, yaitu `subdomain.example.com`.
- **Fitur Leksikal Hostname**: 16 fitur struktural dihitung secara matematis di memori lokal peramban (seperti panjang hostname, rasio angka, entropi Shannon, dan jumlah titik).
- **Elemen DOM Lokal (Opsional)**: Hanya saat pengguna menekan tombol *"Periksa Elemen Halaman Ini"* di popup, skrip lokal memeriksa keberadaan input kata sandi, formulir lintas-domain, dan iframe tersembunyi pada tab aktif tersebut.

### B. Data yang TIDAK PERNAH Diproses:
- **Path dan Parameter URL**: Jalur direktori (`/login`, `/reset-password`), query string (`?session=123&user=abc`), dan fragment (`#token`) diabaikan sepenuhnya dan tidak pernah dimasukkan ke dalam model ML.
- **Isi Formulir & Kredensial**: Nama pengguna, kata sandi, PIN, nomor kartu kredit, dan data formulir yang diinputkan pengguna tidak pernah dibaca atau disimpan.
- **Riwayat Navigasi Lengkap**: Ekstensi tidak mencatat, mengindeks, atau membuat log riwayat penelusuran pengguna ke konsol maupun media penyimpanan eksternal.

---

## 3. Di Mana Data Disimpan?

Seluruh data yang dibutuhkan PhishShield disimpan secara eksklusif di penyimpanan lokal peramban pengguna melalui API `chrome.storage.local`. Data tidak pernah disinkronkan ke cloud atau akun Google.

Rincian entitas data lokal:
1. **Preferensi Preset Sensitivitas (`preset`)**:
   - Menyimpan pilihan ambang batas deteksi: `'strict'` (Ketat, threshold 0,7 — default) atau `'balanced'` (Seimbang, threshold 0,5).
2. **Whitelist Pribadi Pengguna (`userWhitelist`)**:
   - Daftar hostname atau pola wildcard (`*.domain.com`) yang ditambahkan secara manual oleh pengguna agar tidak diperiksa oleh model.
3. **Pengecualian Sesi Sementara (`sessionBypass`)**:
   - Daftar hostname yang diizinkan sementara setelah pengguna memilih opsi *"Tetap Lanjutkan (Sesi Ini)"* pada halaman peringatan.
4. **Hasil Pre-Test & Post-Test Literasi (`resp_<timestamp>_<uuid>`)**:
   - Catatan pengerjaan kuis edukasi yang bersifat **anonim** (berisi pengenal acak UUID, mode pre/post, skor, jumlah jawaban benar, dan stempel waktu). Data ini dapat diekspor pengguna ke file CSV lokal untuk keperluan laporan studi literasi digital.

> [!NOTE]
> Pengguna memiliki kendali penuh atas data mereka. Menghapus ekstensi atau membersihkan cache peramban akan menghapus seluruh data lokal tersebut secara permanen.

---

## 4. Apa yang TIDAK PERNAH Dilakukan?

PhishShield memberikan jaminan mutlak terkait hal-hal berikut:
1. **Tidak Ada Permintaan Jaringan Keluar**: Tidak ada lalu lintas HTTP/HTTPS yang dikirimkan ke server pengembang, universitas, atau pihak ketiga manapun.
2. **Tidak Ada Pelacak / Telemetri**: Tidak menggunakan Google Analytics, Mixpanel, Sentry, Bugsnag, atau skrip pelacakan perilaku lainnya.
3. **Tidak Menjual / Membagikan Data**: Karena data tidak pernah dikumpulkan di server, tidak ada data yang dapat dibagikan, dipindahtangankan, atau diperjualbelikan kepada pihak mana pun.
4. **Tidak Ada Pengiklanan**: Ekstensi bebas dari iklan komersial maupun skrip afiliasi.

---

## 5. Justifikasi Izin (Permissions) di `manifest.json`

Setiap izin yang diminta dalam `manifest.json` memiliki alasan fungsional yang spesifik dan terukur:

| Izin | Tujuan & Justifikasi Teknis | Mengapa Tidak Bisa Dihilangkan? |
|---|---|---|
| **`webNavigation`** | Digunakan untuk memantau event navigasi frame utama (`onBeforeNavigate`, `frameId === 0`). Memungkinkan PhishShield mengevaluasi hostname sebelum konten web yang berpotensi berbahaya dirender oleh peramban. | Jika dihilangkan, ekstensi tidak dapat mencegah pengguna memuat situs phishing sebelum serangan terjadi. |
| **`storage`** | Digunakan untuk menyimpan preferensi sensitivitas, whitelist pribadi, status bypass sesi, dan riwayat pengerjaan tes literasi secara offline pada `chrome.storage.local`. | Diperlukan agar pengaturan pengguna tetap tersimpan antar-sesi peramban tanpa memerlukan server backend. |
| **`activeTab`** | Digunakan untuk memberikan akses sementara ke tab yang sedang aktif **hanya saat pengguna secara sadar mengklik ikon ekstensi**. | Memungkinkan popup membaca hostname tab aktif dan menjalankan inspeksi DOM tanpa memerlukan izin pemantauan tab terus-menerus. |
| **`scripting`** | Digunakan untuk menginjeksi fungsi inspeksi lokal (`extension/lib/page_rules.js`) ke tab aktif saat pengguna menekan tombol *"Periksa Elemen Halaman Ini"*. | Diperlukan untuk mengevaluasi heuristik formulir login dan iframe tersembunyi secara on-demand tanpa meminta izin `host_permissions` luas. |

### Mengapa Tidak Ada `host_permissions` Luas?
PhishShield secara sengaja **tidak meminta** izin `host_permissions` seperti `<all_urls>` atau `*://*/*`. Dengan tidak meminta izin ini:
- Peramban Chrome tidak akan menampilkan peringatan menakutkan seperti *"Ekstensi ini dapat membaca dan mengubah semua data Anda di semua situs web"*.
- Ekstensi secara arsitektural tidak memiliki wewenang untuk membaca lalu lintas jaringan, memanipulasi konten web di latar belakang, atau mengakses cookie situs pihak ketiga.

---

## 6. Audit Keamanan Kode & Kebijakan Konten (CSP)

Untuk menjamin integritas keamanan, kode sumber PhishShield mematuhi standar berikut:

1. **Content Security Policy (CSP) Ketat**:
   ```json
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self';"
   }
   ```
   Ekstensi melarang evaluasi string dinamis (`unsafe-eval`), melarang pemanggilan skrip inline, dan melarang pengunduhan skrip eksternal (CDN/remote).
2. **Pencegahan Cross-Site Scripting (XSS)**:
   - Seluruh rendering teks di UI (halaman peringatan, popup, dan modul edukasi) menggunakan API DOM yang aman seperti `element.textContent` dan `document.createElement`.
   - Penggunaan properti berbahaya seperti `innerHTML` dan `document.write` dilarang keras dan diawasi melalui pengujian unit otomatis (`tests/unit/security_audit.test.js`).
3. **Verifikasi Otomatis**:
   - Seluruh batasan keamanan dan privasi di atas diuji secara otomatis pada rangkaian pengujian CI/CD menggunakan pengujian unit Node.js.

---

## 7. Kontak & Keterbukaan Kode

Kode sumber lengkap PhishShield tersedia secara terbuka untuk kepentingan riset akademis, tinjauan sejawat (*peer review*), dan audit keamanan independen. 

Jika Anda memiliki pertanyaan mengenai implementasi privasi ini, silakan membuka diskusi atau issue pada repositori proyek.
