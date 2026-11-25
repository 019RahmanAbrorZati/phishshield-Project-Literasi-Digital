// Script placeholder halaman peringatan Fase 3
const params = new URLSearchParams(window.location.search);
const host = params.get('host') || '-';
const score = params.get('score') || '0';

const hostEl = document.getElementById('target-host');
if (hostEl) hostEl.textContent = `Hostname terindikasi: ${host}`;

const scoreEl = document.getElementById('target-score');
if (scoreEl) scoreEl.textContent = `Skor indikasi phishing: ${score}`;
