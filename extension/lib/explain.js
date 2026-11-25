/**
 * PhishShield - Explainer Engine (Penjelas Risiko Berbasis Fitur)
 *
 * Menerjemahkan 16 fitur teknis model hostname menjadi penjelasan edukatif
 * berbahasa Indonesia yang dapat dipahami pengguna awam.
 * Seluruh alasan bersumber langsung dan terbatas hanya pada fitur model.
 */

export const DISCLAIMER_TEXT =
  'Perhatian: Hasil ini adalah indikasi risiko berdasarkan analisis struktur nama domain, bukan vonis kepastian. Situs mungkin sah namun memiliki kemiripan pola teknis dengan situs berbahaya.';

/**
 * Menghasilkan daftar alasan risiko berdasarkan objek fitur hostname.
 * @param {Record<string, number>} features - 16 fitur hostname
 * @param {string} [host] - Nama domain/host terkait
 * @returns {{ reasons: string[], disclaimer: string, host: string }}
 */
export function explainFeatures(features, host = '') {
  if (!features) {
    return {
      reasons: ['Kombinasi struktur nama domain memiliki kemiripan pola dengan dataset situs phishing.'],
      disclaimer: DISCLAIMER_TEXT,
      host
    };
  }

  const candidateReasons = [];

  // 1. Alamat IP langsung (bobot relevansi sangat tinggi)
  if (features.is_ip === 1) {
    candidateReasons.push({
      priority: 1,
      id: 'is_ip',
      text: 'Menggunakan alamat IP numerik langsung sebagai pengganti nama domain resmi.'
    });
  }

  // 2. Karakter Punycode (homograf)
  if (features.has_punycode === 1) {
    candidateReasons.push({
      priority: 2,
      id: 'has_punycode',
      text: 'Memakai karakter khusus Punycode (xn--) yang kerap digunakan untuk memalsukan nama domain resmi.'
    });
  }

  // 3. Hosting gratis / subdomain bersama
  if (features.is_free_hosting === 1) {
    candidateReasons.push({
      priority: 3,
      id: 'is_free_hosting',
      text: 'Berada di platform hosting gratis atau subdomain bersama yang sering disalahgunakan untuk membuat situs tiruan.'
    });
  }

  // 4. Layanan Dynamic DNS
  if (features.is_dynamic_dns === 1) {
    candidateReasons.push({
      priority: 4,
      id: 'is_dynamic_dns',
      text: 'Menggunakan layanan Dynamic DNS yang kerap dimanfaatkan untuk menyamarkan identitas kepemilikan situs.'
    });
  }

  // 5. TLD berisiko tinggi
  if (features.risky_tld === 1) {
    candidateReasons.push({
      priority: 5,
      id: 'risky_tld',
      text: 'Menggunakan akhiran domain (TLD) yang berisiko tinggi dan sering dikaitkan dengan penyebaran tautan berbahaya.'
    });
  }

  // 6. Kata kunci sensitif (login, bank, verif, klaim, dll)
  if (features.n_sensitive_kw > 0) {
    candidateReasons.push({
      priority: 6,
      id: 'n_sensitive_kw',
      text: `Memuat ${features.n_sensitive_kw} kata kunci sensitif (seperti verifikasi, login, akun, atau klaim) di nama domain.`
    });
  }

  // 7. Banyak tanda hubung (hyphens)
  if (features.n_hyphens >= 2) {
    candidateReasons.push({
      priority: 7,
      id: 'n_hyphens',
      text: `Menggunakan banyak tanda hubung (${features.n_hyphens} tanda hubung) yang sering dipakai meniru nama merek sah.`
    });
  }

  // 8. Banyak subdomain
  if (features.n_subdomains >= 2) {
    candidateReasons.push({
      priority: 8,
      id: 'n_subdomains',
      text: `Memiliki ${features.n_subdomains} tingkatan subdomain yang tidak lazim untuk situs resmi.`
    });
  }

  // 9. Entropi tinggi / ketidakteraturan karakter atau panjang ekstrem
  if (features.entropy >= 3.75 || features.host_len >= 32 || features.longest_label >= 22) {
    candidateReasons.push({
      priority: 9,
      id: 'entropy_or_len',
      text: 'Nama domain memiliki tingkat keacakan karakter yang tinggi atau panjang nama domain yang tidak wajar.'
    });
  }

  // 10. Rasio angka tinggi pada domain non-IP
  if (features.digit_ratio >= 0.25 && features.is_ip !== 1) {
    candidateReasons.push({
      priority: 10,
      id: 'digit_ratio',
      text: 'Nama domain memuat proporsi angka yang cukup banyak di luar kebiasaan domain populer.'
    });
  }

  // Urutkan berdasarkan prioritas relevansi
  candidateReasons.sort((a, b) => a.priority - b.priority);

  // Batasi maksimal 4 alasan
  let reasons = candidateReasons.slice(0, 4).map(r => r.text);

  // Jika tidak ada fitur spesifik yang terpicu
  if (reasons.length === 0) {
    reasons.push('Kombinasi struktur nama domain memiliki kemiripan pola dengan dataset situs phishing.');
  }

  return {
    reasons,
    disclaimer: DISCLAIMER_TEXT,
    host
  };
}
