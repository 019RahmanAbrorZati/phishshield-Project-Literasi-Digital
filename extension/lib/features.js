/**
 * PhishShield - Feature Extraction Engine
 * Port persis dari referensi Python host_features (berbasis meta.json)
 */
import { META } from './meta.js';

const IPV4_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;

// Precompute sets untuk efisiensi
const SECOND_LEVEL_SET = new Set(META.second_level_labels);
const RISKY_TLD_SET = new Set(META.risky_tld);
const FREE_HOSTING_LIST = META.free_hosting;
const DYNAMIC_DNS_LIST = META.dynamic_dns;
const SENSITIVE_KEYWORDS = META.sensitive_keywords;

/**
 * Menghitung Shannon Entropy dari sebuah string hostname.
 * @param {string} s - String input
 * @returns {number} Nilai entropi Shannon
 */
export function shannon(s) {
  if (!s || s.length === 0) return 0.0;
  const n = s.length;
  const counts = new Map();
  for (let i = 0; i < n; i++) {
    const ch = s[i];
    counts.set(ch, (counts.get(ch) || 0) + 1);
  }
  let ent = 0.0;
  for (const count of counts.values()) {
    const p = count / n;
    ent -= p * Math.log2(p);
  }
  return ent === 0 ? 0.0 : ent;
}

/**
 * Mengekstrak dan menormalisasi hostname dari URL.
 * - Menangani URL tanpa skema (default ke http://)
 * - Menghapus prefix "www."
 * - Menghapus kurung siku IPv6 jika ada ([::1] -> ::1)
 * @param {string} url - String URL
 * @returns {string} Hostname yang telah dinormalisasi
 */
export function hostOf(url) {
  let s = String(url ?? '').trim();
  if (!s) return '';
  if (!s.includes('://')) {
    s = 'http://' + s;
  }
  let h = '';
  try {
    const parsed = new URL(s);
    h = parsed.hostname || '';
  } catch {
    h = '';
  }
  // Buang kurung siku IPv6 agar selaras dengan output urlparse Python
  if (h.startsWith('[') && h.endsWith(']')) {
    h = h.slice(1, -1);
  }
  h = h.toLowerCase();
  if (h.startsWith('www.')) {
    h = h.slice(4);
  }
  return h;
}

/**
 * Mengekstrak 16 fitur hostname sesuai urutan dan spesifikasi model.
 * @param {string} url - URL yang akan diperiksa
 * @param {object} [meta] - Metadata konstanta opsional (default ke META)
 * @returns {Record<string, number>} Objek fitur dengan 16 fitur
 */
export function hostFeatures(url, meta = META) {
  const host = hostOf(url);
  const labels = host ? host.split('.') : [''];
  const is_ip = IPV4_REGEX.test(host) ? 1 : 0;

  const secondLevel = meta === META ? SECOND_LEVEL_SET : new Set(meta.second_level_labels);
  const riskyTld = meta === META ? RISKY_TLD_SET : new Set(meta.risky_tld);
  const freeHosting = meta.free_hosting || FREE_HOSTING_LIST;
  const dynamicDns = meta.dynamic_dns || DYNAMIC_DNS_LIST;
  const sensitiveKw = meta.sensitive_keywords || SENSITIVE_KEYWORDS;

  const lastLabel = labels[labels.length - 1];
  const secondLastLabel = labels.length >= 2 ? labels[labels.length - 2] : '';
  const base = (labels.length >= 3 && lastLabel.length === 2 && secondLevel.has(secondLastLabel)) ? 3 : 2;
  const n_sub = is_ip ? 0 : Math.max(0, labels.length - base);

  let digits = 0;
  for (let i = 0; i < host.length; i++) {
    const code = host.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      digits++;
    }
  }

  const digit_ratio = host.length > 0 ? digits / host.length : 0.0;

  let longest_label = 0;
  for (const l of labels) {
    if (l.length > longest_label) {
      longest_label = l.length;
    }
  }

  const tld_len = lastLabel.length;
  const has_punycode = host.includes('xn--') ? 1 : 0;
  const is_free_hosting = freeHosting.some(fh => host.endsWith(fh)) ? 1 : 0;
  const is_dynamic_dns = dynamicDns.some(dd => host.includes(dd)) ? 1 : 0;
  const risky_tld = riskyTld.has(lastLabel) ? 1 : 0;

  let n_sensitive_kw = 0;
  for (const kw of sensitiveKw) {
    if (host.includes(kw)) {
      n_sensitive_kw++;
    }
  }

  const entropy = shannon(host);

  return {
    host_len: host.length,
    n_labels: labels.length,
    n_subdomains: n_sub,
    n_dots: (host.match(/\./g) || []).length,
    n_hyphens: (host.match(/-/g) || []).length,
    n_digits: digits,
    digit_ratio: digit_ratio,
    longest_label: longest_label,
    tld_len: tld_len,
    is_ip: is_ip,
    has_punycode: has_punycode,
    is_free_hosting: is_free_hosting,
    is_dynamic_dns: is_dynamic_dns,
    risky_tld: risky_tld,
    n_sensitive_kw: n_sensitive_kw,
    entropy: entropy
  };
}
