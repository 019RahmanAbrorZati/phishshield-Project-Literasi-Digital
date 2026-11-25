/**
 * PhishShield - Popup Controller
 * Mengelola status tab aktif, whitelist pribadi, preset ambang batas, dan navigasi edukasi.
 * Seluruh manipulasi DOM menggunakan textContent (bebas risiko XSS).
 */
import { hostOf } from '../lib/features.js';
import { evaluatePageRules, inspectPageDom } from '../lib/page_rules.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Navigasi Tab
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 2. Muat Pengaturan dari Service Worker
  let currentSettings = {
    preset: 'ketat',
    userWhitelist: [],
    sessionBypass: [],
    threshold: 0.7
  };

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response && response.success) {
        currentSettings = response;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat pengaturan awal:', err);
  }

  // 3. Status Tab Aktif
  await initActiveTabStatus();

  // 4. Inisialisasi Whitelist
  renderWhitelist(currentSettings.userWhitelist);
  setupWhitelistForm();

  // 5. Inisialisasi Preset
  setupPresetControls(currentSettings.preset);

  // 6. Inisialisasi Tombol Edukasi
  const btnEdu = document.getElementById('btn-open-education');
  if (btnEdu) {
    btnEdu.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({
          url: chrome.runtime.getURL('education/education.html')
        });
      }
    });
  }

  // 7. Pemeriksaan Elemen Halaman (Fase 6 Opsional)
  const btnInspect = document.getElementById('btn-inspect-page');
  const inspectResultBox = document.getElementById('page-inspect-results');
  const inspectListEl = document.getElementById('inspect-list');

  if (btnInspect) {
    btnInspect.addEventListener('click', async () => {
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) {
        alert('Fitur ini hanya dapat dijalankan di peramban Chrome aktif.');
        return;
      }

      btnInspect.disabled = true;
      btnInspect.textContent = 'Memeriksa DOM...';

      try {
        const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = activeTabs[0];
        if (!tab || !tab.id || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
          alert('Pemeriksaan elemen hanya dapat dilakukan pada halaman web http/https.');
          btnInspect.disabled = false;
          btnInspect.textContent = '🔍 Periksa Elemen Halaman Ini';
          return;
        }

        const injectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: inspectPageDom
        });

        const rawData = injectionResults?.[0]?.result;
        const evaluation = evaluatePageRules(rawData);

        if (inspectListEl) {
          while (inspectListEl.firstChild) inspectListEl.removeChild(inspectListEl.firstChild);

          for (const item of evaluation.findings) {
            const li = document.createElement('li');
            li.className = `inspect-item ${item.level}`;
            li.textContent = item.message;
            inspectListEl.appendChild(li);
          }
        }

        if (inspectResultBox) {
          inspectResultBox.style.display = 'block';
        }
      } catch (err) {
        console.warn('Gagal memeriksa elemen halaman:', err);
        alert('Tidak dapat memeriksa elemen halaman (halaman mungkin dilindungi atau menolak injeksi script).');
      } finally {
        btnInspect.disabled = false;
        btnInspect.textContent = '🔍 Periksa Elemen Halaman Ini';
      }
    });
  }

  /**
   * Menginisialisasi status hostname pada tab yang sedang dibuka pengguna.
   */
  async function initActiveTabStatus() {
    const hostEl = document.getElementById('active-host');
    const badgeEl = document.getElementById('status-badge');
    const scoreEl = document.getElementById('status-score');
    const descEl = document.getElementById('status-desc');
    const btnQuickWhitelist = document.getElementById('btn-quick-whitelist');

    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
      if (hostEl) hostEl.textContent = 'Mode Pengujian (Non-Chrome)';
      return;
    }

    try {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTabs || activeTabs.length === 0) {
        if (hostEl) hostEl.textContent = 'Tidak ada tab aktif';
        return;
      }

      const activeTab = activeTabs[0];
      const url = activeTab.url || '';

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (hostEl) hostEl.textContent = 'Halaman Internal Peramban';
        if (badgeEl) {
          badgeEl.className = 'status-badge safe';
          badgeEl.textContent = 'AMAN (INTERNAL)';
        }
        if (scoreEl) scoreEl.textContent = '0%';
        if (descEl) descEl.textContent = 'Halaman sistem peramban atau berkas lokal tidak diperiksa model.';
        return;
      }

      const host = hostOf(url);
      if (hostEl) hostEl.textContent = host;

      // Minta service worker memeriksa status URL aktif
      const inspectRes = await chrome.runtime.sendMessage({
        action: 'inspectUrl',
        url
      });

      if (inspectRes && inspectRes.success) {
        const { score, allowed, threshold } = inspectRes;
        const scorePercent = Math.min(100, Math.max(0, Math.round(score * 100)));

        if (scoreEl) scoreEl.textContent = `Skor Risiko: ${scorePercent}%`;

        if (allowed) {
          if (badgeEl) {
            badgeEl.className = 'status-badge neutral';
            badgeEl.textContent = 'AMAN (DIREKOMENDASIKAN)';
          }
          if (descEl) {
            descEl.textContent = 'Domain ini terdaftar dalam allowlist bawaan atau whitelist pribadi Anda.';
          }
          if (btnQuickWhitelist) btnQuickWhitelist.style.display = 'none';
        } else if (score >= threshold) {
          if (badgeEl) {
            badgeEl.className = 'status-badge warning';
            badgeEl.textContent = 'DICURIGAI BERBAHAYA';
          }
          if (descEl) {
            descEl.textContent = 'Struktur nama domain memiliki kemiripan pola dengan indikasi phishing.';
          }
          if (btnQuickWhitelist) {
            btnQuickWhitelist.style.display = 'block';
            btnQuickWhitelist.onclick = async () => {
              await addWhitelistItem(host);
              await initActiveTabStatus();
            };
          }
        } else {
          if (badgeEl) {
            badgeEl.className = 'status-badge safe';
            badgeEl.textContent = 'AMAN (SKOR RENDAH)';
          }
          if (descEl) {
            descEl.textContent = 'Struktur nama domain tidak menunjukkan indikasi phishing mencurigakan.';
          }
          if (btnQuickWhitelist) btnQuickWhitelist.style.display = 'none';
        }
      } else {
        if (badgeEl) {
          badgeEl.className = 'status-badge warning';
          badgeEl.textContent = 'GAGAL MEMUAT';
        }
        if (scoreEl) scoreEl.textContent = '-';
        if (descEl) {
          descEl.textContent = inspectRes?.error || 'Tidak dapat memeriksa status situs.';
        }
        if (btnQuickWhitelist) btnQuickWhitelist.style.display = 'none';
      }
    } catch (err) {
      console.warn('Gagal memeriksa tab aktif:', err);
      if (badgeEl) {
        badgeEl.className = 'status-badge warning';
        badgeEl.textContent = 'GAGAL MEMUAT';
      }
      if (scoreEl) scoreEl.textContent = '-';
      if (descEl) descEl.textContent = err?.message || 'Gagal memuat status situs.';
      if (btnQuickWhitelist) btnQuickWhitelist.style.display = 'none';
    }
  }

  /**
   * Menampilkan daftar entri whitelist secara aman ke dalam DOM.
   * @param {string[]} list
   */
  function renderWhitelist(list) {
    const listEl = document.getElementById('whitelist-list');
    const emptyEl = document.getElementById('whitelist-empty');
    if (!listEl) return;

    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    if (!Array.isArray(list) || list.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    for (const hostItem of list) {
      const li = document.createElement('li');
      li.className = 'whitelist-item';

      const code = document.createElement('code');
      code.className = 'whitelist-host';
      code.textContent = hostItem; // Bebas XSS

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'btn-del';
      btnDel.textContent = 'Hapus';
      btnDel.addEventListener('click', async () => {
        await removeWhitelistItem(hostItem);
      });

      li.appendChild(code);
      li.appendChild(btnDel);
      listEl.appendChild(li);
    }
  }

  /**
   * Mengatur form tambah whitelist.
   */
  function setupWhitelistForm() {
    const form = document.getElementById('whitelist-form');
    const input = document.getElementById('whitelist-input');

    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (!val) return;

      await addWhitelistItem(val);
      input.value = '';
    });
  }

  async function addWhitelistItem(host) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const res = await chrome.runtime.sendMessage({
          action: 'addWhitelist',
          host
        });
        if (res && res.success) {
          renderWhitelist(res.userWhitelist);
        }
      }
    } catch (err) {
      console.error('Gagal menambah whitelist:', err);
    }
  }

  async function removeWhitelistItem(host) {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const res = await chrome.runtime.sendMessage({
          action: 'removeWhitelist',
          host
        });
        if (res && res.success) {
          renderWhitelist(res.userWhitelist);
        }
      }
    } catch (err) {
      console.error('Gagal menghapus whitelist:', err);
    }
  }

  /**
   * Mengatur event switch preset sensitivitas (Ketat vs Seimbang).
   * @param {string} currentPreset
   */
  function setupPresetControls(currentPreset) {
    const radioKetat = document.getElementById('preset-ketat');
    const radioSeimbang = document.getElementById('preset-seimbang');
    const cardKetat = radioKetat?.closest('.preset-card');
    const cardSeimbang = radioSeimbang?.closest('.preset-card');

    function updateCardVisuals(val) {
      if (val === 'seimbang') {
        if (radioSeimbang) radioSeimbang.checked = true;
        cardSeimbang?.classList.add('active');
        cardKetat?.classList.remove('active');
      } else {
        if (radioKetat) radioKetat.checked = true;
        cardKetat?.classList.add('active');
        cardSeimbang?.classList.remove('active');
      }
    }

    updateCardVisuals(currentPreset);

    async function onPresetChange(val) {
      updateCardVisuals(val);
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          await chrome.runtime.sendMessage({
            action: 'setPreset',
            preset: val
          });
          await initActiveTabStatus();
        }
      } catch (err) {
        console.error('Gagal mengubah preset:', err);
      }
    }

    if (radioKetat) {
      radioKetat.addEventListener('change', () => onPresetChange('ketat'));
    }
    if (radioSeimbang) {
      radioSeimbang.addEventListener('change', () => onPresetChange('seimbang'));
    }
  }
});
