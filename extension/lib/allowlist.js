/**
 * PhishShield - Allowlist & Heuristic Matching Engine
 *
 * Catatan Desain & Batasan:
 * Allowlist adalah heuristik untuk mencegah kesalahan deteksi (false positive) pada situs populer.
 * Aturan pencocokan:
 * 1. Hostname (setelah membuang 'www.') harus sama persis dengan entri (exact match).
 * 2. Hanya entri yang diawali '*.' yang boleh mencocokkan subdomain.
 * 3. Tidak pernah memakai endsWith tanpa batas titik.
 * 4. Platform konten pengguna (docs.google.com, *.github.io, *.web.app, dll.) TIDAK dimasukkan.
 */

export const DEFAULT_ALLOWLIST = [
  "google.com",
  "accounts.google.com",
  "mail.google.com",
  "colab.research.google.com",
  "classroom.google.com",
  "youtube.com",
  "github.com",
  "wikipedia.org",
  "id.wikipedia.org",
  "stackoverflow.com",
  "microsoft.com",
  "login.microsoftonline.com",
  "teams.microsoft.com",
  "apple.com",
  "amazon.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "whatsapp.com",
  "web.whatsapp.com",
  "t.me",
  "tiktok.com",
  "netflix.com",
  "spotify.com",
  "zoom.us",
  "kompas.com",
  "detik.com",
  "tokopedia.com",
  "seller.tokopedia.com",
  "shopee.co.id",
  "bukalapak.com",
  "blibli.com",
  "traveloka.com",
  "tiket.com",
  "bca.co.id",
  "klikbca.com",
  "bri.co.id",
  "bankmandiri.co.id",
  "bni.co.id",
  "djp.go.id",
  "pajak.go.id"
];

/**
 * Memeriksa apakah suatu hostname cocok dengan suatu pola.
 * @param {string} host - Hostname yang sudah dibersihkan (lowercase, tanpa www.)
 * @param {string} pattern - Pola domain dari allowlist atau whitelist pengguna
 * @returns {boolean}
 */
export function matchesPattern(host, pattern) {
  if (!host || !pattern) return false;
  let h = host.toLowerCase().trim();
  let p = pattern.toLowerCase().trim();

  if (h.startsWith('www.')) h = h.slice(4);
  if (p.startsWith('www.')) p = p.slice(4);

  // Jika pola diawali wildcard '*.'
  if (p.startsWith('*.')) {
    const base = p.slice(2);
    // Mencocokkan domain dasar persis ATAU subdomain berbatas titik
    return h === base || h.endsWith('.' + base);
  }

  // Exact match persis
  return h === p;
}

/**
 * Memeriksa apakah hostname diizinkan (lolos allowlist bawaan atau whitelist pribadi).
 * @param {string} host - Hostname yang akan diperiksa
 * @param {string[]} [allowlist] - Daftar allowlist bawaan (default: DEFAULT_ALLOWLIST)
 * @param {string[]} [userWhitelist] - Daftar whitelist pribadi pengguna
 * @returns {boolean}
 */
export function isAllowed(host, allowlist = DEFAULT_ALLOWLIST, userWhitelist = []) {
  if (!host) return false;
  let h = host.toLowerCase().trim();
  if (h.startsWith('www.')) {
    h = h.slice(4);
  }

  // 1. Periksa allowlist bawaan
  for (let i = 0; i < allowlist.length; i++) {
    if (matchesPattern(h, allowlist[i])) {
      return true;
    }
  }

  // 2. Periksa whitelist pribadi pengguna
  if (Array.isArray(userWhitelist)) {
    for (let i = 0; i < userWhitelist.length; i++) {
      if (matchesPattern(h, userWhitelist[i])) {
        return true;
      }
    }
  }

  return false;
}
