/**
 * PhishShield - Heuristic Page Element Rules Engine (Fase 6 Opsional)
 *
 * Menganalisis elemen DOM halaman yang sedang dibuka untuk memberikan
 * informasi tambahan kepada pengguna:
 * 1. Ada field input kata sandi (<input type="password">).
 * 2. Form dikirimkan ke domain berbeda (cross-domain form submission).
 * 3. Keberadaan iframe tersembunyi (hidden iframes).
 *
 * Catatan Penting & Keterbatasan:
 * Aturan ini murni berbasis heuristik struktur DOM dan BUKAN input bagi model Random Forest.
 * Hasil analisis hanya sebagai indikasi pendukung karena situs sah (misal: login OAuth
 * atau payment gateway) juga dapat mengirimkan form ke domain eksternal.
 */

export const RULES_DISCLAIMER =
  'Peringatan: Analisis ini adalah informasi tambahan berbasis aturan heuristik DOM, bukan hasil pembelajaran mesin (ML). Situs sah seperti payment gateway atau sistem login terpusat juga dapat memicu aturan ini.';

/**
 * Mengevaluasi aturan elemen halaman dari data terstruktur.
 * @param {{
 *   currentUrl: string,
 *   hasPasswordField: boolean,
 *   forms: Array<{ action: string, method?: string, hasPassword?: boolean }>,
 *   iframes: Array<{ isHidden: boolean, src?: string }>
 * }} data
 * @returns {{
 *   findings: Array<{ rule: string, level: 'warning'|'danger'|'info', message: string }>,
 *   hasPasswordField: boolean,
 *   hasExternalFormAction: boolean,
 *   externalActions: string[],
 *   hiddenIframeCount: number,
 *   totalIframeCount: number,
 *   disclaimer: string
 * }}
 */
export function evaluatePageRules(data) {
  const findings = [];
  const currentUrl = data?.currentUrl || '';
  let currentHost = '';
  try {
    currentHost = new URL(currentUrl).hostname.toLowerCase();
    if (currentHost.startsWith('www.')) currentHost = currentHost.slice(4);
  } catch {
    currentHost = '';
  }

  const hasPasswordField = Boolean(data?.hasPasswordField);
  const forms = Array.isArray(data?.forms) ? data.forms : [];
  const iframes = Array.isArray(data?.iframes) ? data.iframes : [];

  // 1. Aturan Input Password
  if (hasPasswordField) {
    findings.push({
      rule: 'password_field_present',
      level: 'warning',
      message: 'Halaman ini memuat formulir input kata sandi (password). Pastikan Anda berada di situs resmi sebelum memasukkan kredensial.'
    });
  }

  // 2. Aturan Form Action ke Domain Eksternal
  const externalActions = [];
  for (const f of forms) {
    const actionUrl = f.action ? f.action.trim() : '';
    if (!actionUrl || actionUrl.startsWith('#') || actionUrl.startsWith('javascript:')) {
      continue;
    }

    try {
      // Resolusi URL relatif terhadap currentUrl
      const resolved = new URL(actionUrl, currentUrl || 'http://localhost');
      let targetHost = resolved.hostname.toLowerCase();
      if (targetHost.startsWith('www.')) targetHost = targetHost.slice(4);

      if (currentHost && targetHost && targetHost !== currentHost) {
        externalActions.push(resolved.origin);
        findings.push({
          rule: 'external_form_action',
          level: 'danger',
          message: `Formulir mengirim data ke domain luar (${targetHost}), berbeda dari domain halaman saat ini.`
        });
      }
    } catch {
      // Format URL action tidak dapat di-parse
    }
  }

  const hasExternalFormAction = externalActions.length > 0;

  // 3. Aturan Iframe Tersembunyi
  let hiddenIframeCount = 0;
  for (const frame of iframes) {
    if (frame.isHidden) {
      hiddenIframeCount++;
    }
  }

  if (hiddenIframeCount > 0) {
    findings.push({
      rule: 'hidden_iframes_present',
      level: 'warning',
      message: `Terdeteksi ${hiddenIframeCount} elemen iframe tersembunyi yang berpotensi memuat konten pihak ketiga tanpa terlihat.`
    });
  }

  if (findings.length === 0) {
    findings.push({
      rule: 'no_anomalies_found',
      level: 'info',
      message: 'Tidak ditemukan anomali umum (tanpa field password, form eksternal, atau iframe tersembunyi).'
    });
  }

  return {
    findings,
    hasPasswordField,
    hasExternalFormAction,
    externalActions: Array.from(new Set(externalActions)),
    hiddenIframeCount,
    totalIframeCount: iframes.length,
    disclaimer: RULES_DISCLAIMER
  };
}

/**
 * Fungsi mandiri untuk diinjeksi via chrome.scripting.executeScript.
 * Dijalankan di dalam konteks tab halaman aktif peramban.
 * @returns {object} Data elemen halaman yang diekstrak
 */
export function inspectPageDom() {
  const currentUrl = window.location.href;

  // Cek keberadaan password input
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  const hasPasswordField = passwordInputs.length > 0;

  // Cek forms
  const formElements = document.querySelectorAll('form');
  const forms = [];
  formElements.forEach(form => {
    const action = form.getAttribute('action') || '';
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    const hasPassword = form.querySelector('input[type="password"]') !== null;
    forms.push({ action, method, hasPassword });
  });

  // Cek iframes
  const iframeElements = document.querySelectorAll('iframe');
  const iframes = [];
  iframeElements.forEach(frame => {
    const style = window.getComputedStyle(frame);
    const isHiddenStyle =
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity || '1') === 0;

    const width = parseFloat(frame.getAttribute('width') || style.width || '300');
    const height = parseFloat(frame.getAttribute('height') || style.height || '150');
    const isZeroDim = (width <= 1 && width >= 0) || (height <= 1 && height >= 0);

    const isHidden = isHiddenStyle || isZeroDim;
    const src = frame.getAttribute('src') || '';
    iframes.push({ isHidden, src });
  });

  return {
    currentUrl,
    hasPasswordField,
    forms,
    iframes
  };
}

/**
 * Helper untuk mem-parsing string HTML menjadi struktur data aturan di lingkungan Node.js.
 * @param {string} htmlText - Konten teks HTML
 * @param {string} currentUrl - URL dasar halaman
 * @returns {object} Hasil evaluasi aturan
 */
export function inspectPageHtml(htmlText, currentUrl) {
  const hasPasswordField = /<input[^>]+type=["']password["']/i.test(htmlText);

  // Ekstrak tag form
  const forms = [];
  const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let formMatch;
  while ((formMatch = formRegex.exec(htmlText)) !== null) {
    const formAttrs = formMatch[1];
    const formBody = formMatch[2];

    const actionMatch = /action=["']([^"']*)["']/i.exec(formAttrs);
    const action = actionMatch ? actionMatch[1] : '';

    const methodMatch = /method=["']([^"']*)["']/i.exec(formAttrs);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

    const hasPassword = /<input[^>]+type=["']password["']/i.test(formBody);
    forms.push({ action, method, hasPassword });
  }

  // Ekstrak tag iframe
  const iframes = [];
  const iframeRegex = /<iframe\b([^>]*)>/gi;
  let iframeMatch;
  while ((iframeMatch = iframeRegex.exec(htmlText)) !== null) {
    const attrs = iframeMatch[1];
    const srcMatch = /src=["']([^"']*)["']/i.exec(attrs);
    const src = srcMatch ? srcMatch[1] : '';

    const isHidden =
      /style=["'][^"']*(display:\s*none|visibility:\s*hidden|opacity:\s*0)/i.test(attrs) ||
      /width=["']0["']/i.test(attrs) ||
      /height=["']0["']/i.test(attrs) ||
      /width=["']1["']/i.test(attrs) ||
      /height=["']1["']/i.test(attrs);

    iframes.push({ isHidden, src });
  }

  return evaluatePageRules({
    currentUrl,
    hasPasswordField,
    forms,
    iframes
  });
}
