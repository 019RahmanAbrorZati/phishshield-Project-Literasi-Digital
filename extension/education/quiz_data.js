export const QUIZ_BANK = {
  "pretest": [
    {
      "id": 1,
      "scenario": "Anda menerima pesan SMS yang meminta verifikasi akun bank dengan tautan http://103.25.76.12/login. Bagaimana penilaian Anda terhadap tautan ini?",
      "url": "http://103.25.76.12/login",
      "options": [
        "Aman, karena langsung menuju server IP bank.",
        "Mencurigakan, karena bank resmi menggunakan nama domain terdaftar, bukan alamat IP numerik langsung.",
        "Aman, asalkan menggunakan koneksi Wi-Fi pribadi.",
        "Mencurigakan, hanya jika alamat IP tersebut diawali angka 192."
      ],
      "answer": 1,
      "explanation": "Institusi perbankan dan layanan resmi selalu menggunakan nama domain resmi terdaftar. Penggunaan alamat IP langsung adalah indikasi kuat upaya penyamaran identitas server phishing."
    },
    {
      "id": 2,
      "scenario": "Sebuah tautan undian mengarahkan Anda ke alamat http://hadiah-gelegar-bca.web.app. Apakah situs ini aman untuk memasukkan PIN?",
      "url": "http://hadiah-gelegar-bca.web.app",
      "options": [
        "Aman, karena memuat nama bank di depan.",
        "Aman, karena web.app adalah layanan milik perusahaan teknologi terpercaya.",
        "Berbahaya, karena domain utamanya adalah web.app (hosting gratis) yang siapa saja bisa buat, bukan domain resmi bca.co.id.",
        "Aman, jika halaman tersebut memuat logo bank yang rapi."
      ],
      "answer": 2,
      "explanation": "Platform hosting gratis seperti web.app atau firebaseapp.com sering dimanfaatkan penipu untuk membuat halaman tiruan. Nama bank di subdomain hanyalah teks buatan penipu; domain utamanya bukan bca.co.id."
    },
    {
      "id": 3,
      "scenario": "Seorang teman mengirim tautan pembaruan akun media sosial: http://update-secure-instagram.duckdns.org. Apa tanda mencurigakan dari tautan ini?",
      "url": "http://update-secure-instagram.duckdns.org",
      "options": [
        "Tautan terlalu pendek.",
        "Menggunakan layanan Dynamic DNS (duckdns.org) yang lazim digunakan menyembunyikan identitas situs penipuan.",
        "Tautan menggunakan huruf kecil semua.",
        "Tidak ada yang mencurigakan karena ada kata 'secure'."
      ],
      "answer": 1,
      "explanation": "Layanan Dynamic DNS seperti duckdns.org memungkinkan pembuat situs mengganti alamat IP dengan mudah tanpa verifikasi identitas, sehingga kerap dipakai untuk infrastruktur phishing sementara."
    },
    {
      "id": 4,
      "scenario": "Anda melihat tautan promo kuota gratis dengan alamat http://telkomsel-promo-klaim.xyz. Bagaimana Anda menyikapinya?",
      "url": "http://telkomsel-promo-klaim.xyz",
      "options": [
        "Segera klaim karena domain .xyz adalah domain resmi operator.",
        "Mencurigakan, karena memakai TLD berisiko (.xyz) dan kata sensitif (promo, klaim) di luar domain resmi telkomsel.com.",
        "Aman jika dibuka melalui ponsel.",
        "Aman jika warna latarnya merah khas operator."
      ],
      "answer": 1,
      "explanation": "Domain berakhiran TLD berisiko murah seperti .xyz yang dipadukan dengan kata kunci promo dan klaim adalah ciri khas situs jebakan penipuan kuota atau hadiah."
    },
    {
      "id": 5,
      "scenario": "Perhatikan alamat situs berikut: https://www.paypa1.com/signin. Apa potensi ancaman pada tautan ini?",
      "url": "https://www.paypa1.com/signin",
      "options": [
        "Tidak ada, tautan memiliki sertifikat HTTPS yang valid.",
        "Merupakan teknik typosquatting, di mana huruf 'l' diganti dengan angka '1' untuk mengecoh mata pengguna.",
        "Tautan ini resmi karena beralamat .com.",
        "Aman karena memiliki halaman signin."
      ],
      "answer": 1,
      "explanation": "Typosquatting adalah teknik pemalsuan domain dengan mengganti karakter yang mirip (seperti huruf 'l' dengan angka '1'). Pengguna yang tidak teliti dapat terkecoh mengira itu situs paypal.com asli."
    },
    {
      "id": 6,
      "scenario": "Tautan email verifikasi memiliki hostname http://xn--gogle-qqa.com. Apa arti awalan 'xn--' pada nama domain tersebut?",
      "url": "http://xn--gogle-qqa.com",
      "options": [
        "Domain menggunakan enkripsi tingkat militer.",
        "Domain menggunakan format Punycode (karakter non-Latin / homograf) yang meniru ejaan Google untuk menipu pengguna.",
        "Domain tersebut adalah server cadangan resmi.",
        "Domain tersebut hanya bisa dibuka di aplikasi mobile."
      ],
      "answer": 1,
      "explanation": "Awalan xn-- menandakan domain Punycode yang memakai karakter alfabet non-Latin (homograf). Penyerang menggunakan karakter yang bentuk visualnya serupa dengan huruf Latin untuk memalsukan nama domain populer."
    },
    {
      "id": 7,
      "scenario": "Anda membuka situs https://login.verifikasi-akun-bank-anda.update-keamanan.example.com. Mengapa struktur hostname ini mencurigakan?",
      "url": "https://login.verifikasi-akun-bank-anda.update-keamanan.example.com",
      "options": [
        "Memiliki terlalu banyak tanda hubung dan kata kunci sensitif yang disusun untuk menciptakan kepanikan.",
        "Menggunakan protokol HTTPS.",
        "Domain berakhiran .com.",
        "Tidak mencurigakan sama sekali."
      ],
      "answer": 0,
      "explanation": "Hostname dengan banyak tanda hubung beruntun dan deretan kata kunci sensitif (login, verifikasi, akun, update, keamanan) dibuat untuk meniru narasi keamanan palsu, padahal domain utamanya bukan milik bank."
    },
    {
      "id": 8,
      "scenario": "Tautan yang Anda terima adalah https://bca.co.id.portal-layanan-nasabah.xyz. Di manakah domain utama yang sebenarnya?",
      "url": "https://bca.co.id.portal-layanan-nasabah.xyz",
      "options": [
        "bca.co.id",
        "portal-layanan-nasabah.xyz",
        "co.id",
        "bca.co.id.portal"
      ],
      "answer": 1,
      "explanation": "Domain utama dibaca dari bagian paling kanan sebelum path. 'bca.co.id' di sini hanyalah subdomain dari domain penyerang yang sebenarnya, yaitu portal-layanan-nasabah.xyz."
    },
    {
      "id": 9,
      "scenario": "Jika sebuah situs memiliki sertifikat HTTPS (ikon gembok hijau/terkunci di address bar), apakah situs tersebut dijamin bukan situs phishing?",
      "url": "https://akun-anda-terkunci-bca.xyz",
      "options": [
        "Ya, HTTPS menjamin pemilik situs telah terverifikasi dan bukan penipu.",
        "Tidak, HTTPS hanya mengenkripsi transmisi data; siapa pun termasuk penipu dapat memasang sertifikat HTTPS gratis pada domain phishing.",
        "Ya, karena browser akan memblokir HTTPS jika situs berbahaya.",
        "Ya, asalkan koneksi internet stabil."
      ],
      "answer": 1,
      "explanation": "Ikon gembok/HTTPS hanya berarti jalur komunikasi antara browser dan server dienkripsi, bukan berarti pemilik situs dapat dipercaya. Penipu saat ini sangat mudah mendapatkan sertifikat SSL gratis untuk domain phishing."
    },
    {
      "id": 10,
      "scenario": "Manakah di antara tautan berikut yang merupakan portal resmi universitas yang sah?",
      "url": "https://siakad.unesa.ac.id/login",
      "options": [
        "https://siakad.unesa.ac.id/login",
        "http://unesa-siakad-login.weebly.com",
        "http://siakad-unesa.duckdns.org",
        "https://unesa.ac.id.siakad-portal.online"
      ],
      "answer": 0,
      "explanation": "Tautan sah menggunakan second-level domain perguruan tinggi resmi Indonesia (.ac.id) dengan domain utama unesa.ac.id dan subdomain siakad. Pilihan lain menggunakan hosting gratis, dynamic DNS, atau TLD berisiko."
    }
  ],
  "posttest": [
    {
      "id": 1,
      "scenario": "Sebuah pesan darurat meminta Anda memperbarui data pajak di http://194.67.210.5/djp. Bagaimana Anda menilai tautan ini?",
      "url": "http://194.67.210.5/djp",
      "options": [
        "Aman, karena langsung menuju server teknis kantor pajak.",
        "Mencurigakan, karena instansi pemerintah Indonesia menggunakan domain resmi berakhiran .go.id, bukan alamat IP langsung.",
        "Aman, jika dibuka pada jam kerja kantor pemerintah.",
        "Mencurigakan hanya jika tautan meminta NPWP."
      ],
      "answer": 1,
      "explanation": "Layanan pemerintah resmi Indonesia selalu beralamat pada domain .go.id (seperti pajak.go.id). Tautan yang menggunakan alamat IP numerik langsung merupakan ciri kuat server phishing."
    },
    {
      "id": 2,
      "scenario": "Anda menerima informasi bantuan kuota belajar di alamat http://bantuan-kemdikbud.pages.dev. Apakah situs ini resmi?",
      "url": "http://bantuan-kemdikbud.pages.dev",
      "options": [
        "Resmi, karena mencantumkan nama kemdikbud.",
        "Tidak resmi, karena pages.dev adalah layanan hosting bersama Cloudflare Pages yang dapat didaftarkan secara bebas oleh siapa pun.",
        "Resmi, karena domain diakhiri kata .dev untuk pengembang.",
        "Resmi jika ada logo Tut Wuri Handayani di halaman tersebut."
      ],
      "answer": 1,
      "explanation": "Hosting gratis seperti pages.dev, web.app, atau github.io sering dipakai penipu untuk menampung situs tiruan. Instansi resmi pemerintah menggunakan kemdikbud.go.id, bukan subdomain hosting gratis."
    },
    {
      "id": 3,
      "scenario": "Pemberitahuan pemblokiran akun dompet digital menyuruh Anda masuk ke http://konfirmasi-dana-wallet.ddns.net. Mengapa alamat ini berbahaya?",
      "url": "http://konfirmasi-dana-wallet.ddns.net",
      "options": [
        "Karena menggunakan penyedia Dynamic DNS (ddns.net) yang menyembunyikan identitas asli pemilik situs phishing.",
        "Karena ada kata 'wallet' di dalamnya.",
        "Karena nama domain terlalu pendek.",
        "Tidak berbahaya jika kita memasukkan PIN yang salah terlebih dahulu."
      ],
      "answer": 0,
      "explanation": "Penyedia Dynamic DNS (ddns.net, duckdns.org, no-ip) sering dipakai penjahat siber karena dapat dibuat instan dan alamat IP-nya bisa diubah sewaktu-waktu untuk menghindari pemblokiran."
    },
    {
      "id": 4,
      "scenario": "Anda menemukan iklan undian berhadiah mobil di http://gelegar-hadiah-bri.top. Apa indikator bahayanya?",
      "url": "http://gelegar-hadiah-bri.top",
      "options": [
        "Menggunakan TLD berisiko (.top) dan nama bank palsu, bukan domain resmi bri.co.id.",
        "Domain berakhiran kata 'top' yang berarti situs teratas di internet.",
        "Tidak ada bahaya asalkan tidak membagikan OTP.",
        "Aman jika iklan tersebut muncul di situs berita terkenal."
      ],
      "answer": 0,
      "explanation": "TLD berisiko seperti .top, .xyz, dan .click sering dipakai penipu karena biaya registrasinya murah dan pengawasannya longgar. Situs resmi bank BRI adalah bri.co.id."
    },
    {
      "id": 5,
      "scenario": "Anda menerima tautan konfirmasi pesanan dari http://www.tokopedla.com/order. Apa yang janggal dari alamat ini?",
      "url": "http://www.tokopedla.com/order",
      "options": [
        "Tautan menggunakan typosquatting dengan mengganti huruf 'i' menjadi huruf 'l' kecil (tokopedla vs tokopedia).",
        "Tautan menggunakan huruf kapital.",
        "Tautan memiliki path /order.",
        "Tidak ada yang janggal karena terlihat serupa."
      ],
      "answer": 0,
      "explanation": "Ini adalah contoh typosquatting di mana penipu mendaftarkan domain dengan kesalahan ketik yang nyaris tidak terlihat mata (huruf 'i' diganti 'l') untuk mengelabui pengguna agar memasukkan kredensial."
    },
    {
      "id": 6,
      "scenario": "Tautan yang Anda periksa beralamat http://xn--aple-4qa.com/login. Apa fungsi teknik Punycode ini bagi penipu?",
      "url": "http://xn--aple-4qa.com/login",
      "options": [
        "Mempercepat waktu muat halaman login.",
        "Memanfaatkan karakter beraksen non-Latin (homograf) agar di mata pengguna tampak seperti kata 'apple' asli.",
        "Membantu Google mengindeks halaman lebih cepat.",
        "Menyembunyikan kata sandi saat diketik pengguna."
      ],
      "answer": 1,
      "explanation": "Punycode (xn--) memungkinkan registrasi nama domain menggunakan karakter Unicode non-Latin yang memiliki bentuk mirip huruf Latin (serangan homograf) untuk mengelabui pengguna awam."
    },
    {
      "id": 7,
      "scenario": "Tautan SMS berbunyi: https://akun-bank-anda-diblokir-segera-verif-sekarang.example.com. Mengapa pola ini mencurigakan?",
      "url": "https://akun-bank-anda-diblokir-segera-verif-sekarang.example.com",
      "options": [
        "Hostname sangat panjang, memuat banyak tanda hubung, dan memakai kata sensitif intimidatif untuk memancing kepanikan.",
        "Karena menggunakan protokol transfer data HTTPS.",
        "Karena server berada di luar negeri.",
        "Tidak mencurigakan jika SMS dikirim langsung ke nomor ponsel Anda."
      ],
      "answer": 0,
      "explanation": "Kombinasi nama domain panjang, banyak tanda hubung, dan penggunaan kata-kata panik (diblokir, verif, sekarang) adalah teknik rekayasa sosial khas phishing untuk memanipulasi emosi korban."
    },
    {
      "id": 8,
      "scenario": "Pada tautan https://klikbca.com.layanan-keamanan-ebank.online/login, siapakah pemilik domain sebenarnya yang menerima data Anda?",
      "url": "https://klikbca.com.layanan-keamanan-ebank.online/login",
      "options": [
        "Bank Central Asia (BCA)",
        "Pemilik domain layanan-keamanan-ebank.online",
        "Penyedia internet Anda",
        "Peramban Google Chrome"
      ],
      "answer": 1,
      "explanation": "Nama domain selalu ditentukan oleh label di depan TLD (.online). Di sini, domain utamanya adalah layanan-keamanan-ebank.online. Teks klikbca.com hanyalah subdomain tipuan buatan penipu."
    },
    {
      "id": 9,
      "scenario": "Jika Anda tidak sengaja memasukkan password akun di situs yang dicurigai phishing, tindakan pertama apa yang harus dilakukan?",
      "url": "https://situs-pencuri-data.xyz/login",
      "options": [
        "Menunggu 24 jam untuk melihat apakah ada transaksi mencurigakan.",
        "Segera membuka situs resmi asli dan mengganti password akun Anda serta mengaktifkan verifikasi 2 langkah (2FA).",
        "Menutup browser dan mematikan laptop tanpa melakukan apa pun.",
        "Mengirim email komplain ke pemilik situs palsu tersebut."
      ],
      "answer": 1,
      "explanation": "Tindakan tanggap darurat utama adalah langsung mengubah kata sandi di situs resmi sebelum penyerang sempat memanfaatkannya, serta mengaktifkan 2-Factor Authentication (2FA) untuk mengunci akses."
    },
    {
      "id": 10,
      "scenario": "Manakah di antara tautan berikut yang merupakan portal resmi perpajakan Republik Indonesia yang sah?",
      "url": "https://djponline.pajak.go.id",
      "options": [
        "https://djponline.pajak.go.id",
        "http://lapor-pajak-djp.pages.dev",
        "https://djp-online-pajak.click",
        "http://pajak.go.id.ebilling-portal.xyz"
      ],
      "answer": 0,
      "explanation": "Portal resmi perpajakan menggunakan domain tingkat dua pemerintah (.go.id) dengan domain utama pajak.go.id (dan subdomain djponline). Pilihan lainnya menggunakan hosting gratis atau TLD berisiko."
    }
  ]
}
;
export default QUIZ_BANK;
