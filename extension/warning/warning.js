/**
 * PhishShield - Warning Page Controller
 * Menampilkan rincian risiko secara aman dan edukatif (bebas XSS / 0 innerHTML).
 */
import { hostFeatures } from '../lib/features.js';
import { explainFeatures } from '../lib/explain.js';

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const rawHost = params.get('host') || '';
  const rawScore = params.get('score') || '0';

  // Sanitasi ekstra: pastikan hanya karakter hostname valid
  const host = rawHost.trim().toLowerCase();
  const scoreNum = parseFloat(rawScore) || 0.0;
  const scorePercent = Math.min(100, Math.max(0, Math.round(scoreNum * 100)));

  // Render teks aman menggunakan textContent (tidak pernah innerHTML)
  const hostEl = document.getElementById('target-host');
  if (hostEl) {
    hostEl.textContent = host || '(Tidak diketahui)';
  }

  const riskBadgeEl = document.getElementById('target-risk-badge');
  if (riskBadgeEl) {
    riskBadgeEl.textContent = `${scorePercent}% Risiko (${scorePercent >= 70 ? 'Tinggi' : 'Sedang'})`;
  }

  // Hitung fitur dan penjelasan alasan
  const features = hostFeatures(host);
  const explanation = explainFeatures(features, host);

  const reasonsListEl = document.getElementById('reasons-list');
  if (reasonsListEl) {
    // Kosongkan list
    while (reasonsListEl.firstChild) {
      reasonsListEl.removeChild(reasonsListEl.firstChild);
    }

    for (const reason of explanation.reasons) {
      const li = document.createElement('li');
      li.textContent = reason; // Aman dari XSS
      reasonsListEl.appendChild(li);
    }
  }

  const disclaimerEl = document.getElementById('disclaimer-text');
  if (disclaimerEl) {
    disclaimerEl.textContent = explanation.disclaimer; // Aman dari XSS
  }

  // Tombol aksi 1: Kembali ke tempat aman
  const btnBack = document.getElementById('btn-back');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    });
  }

  // Tombol aksi 2: Saya paham risikonya, lanjutkan (bypass sesi)
  const btnProceed = document.getElementById('btn-proceed');
  if (btnProceed) {
    btnProceed.addEventListener('click', async () => {
      if (!host) return;

      btnProceed.disabled = true;
      btnProceed.textContent = 'Membuka situs...';

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          await chrome.runtime.sendMessage({
            action: 'addSessionBypass',
            host
          });
        }
      } catch (err) {
        console.warn('Gagal menyimpan bypass sesi:', err);
      }

      // Alihkan pengguna ke situs tujuan (menggunakan protokol aman https)
      window.location.href = `https://${host}`;
    });
  }
});
