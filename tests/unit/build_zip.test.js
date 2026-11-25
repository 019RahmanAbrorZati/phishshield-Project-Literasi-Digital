import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildZip } from '../../scripts/build_zip.js';

describe('Skrip Packaging Distribusi (build_zip.js - Fase 10)', () => {
  const rootDir = fileURLToPath(new URL('../../', import.meta.url));
  const distDir = join(rootDir, 'dist');
  const expectedZip = join(distDir, 'phishshield-v1.0.0.zip');

  it('Berhasil membuat file arsip zip distribusi ekstensi', () => {
    // Hapus zip lama jika ada
    if (existsSync(expectedZip)) {
      rmSync(expectedZip, { force: true });
    }

    const result = buildZip();

    assert.ok(existsSync(result.zipPath), 'File ZIP harus berhasil dibuat');
    assert.strictEqual(result.filename, 'phishshield-v1.0.0.zip');
    assert.ok(result.fileCount >= 10, 'Jumlah berkas dalam zip harus memuat seluruh isi extension/');
    assert.ok(result.sizeBytes > 50000, 'Ukuran ZIP harus valid dan lebih besar dari 50 KB');

    // Baca header ZIP untuk memverifikasi PK signature (0x04034b50)
    const buf = readFileSync(result.zipPath);
    assert.strictEqual(buf.readUInt32LE(0), 0x04034b50, 'Magic signature PKZIP tidak valid');
  });

  it('Memverifikasi arsip ZIP memuat file penting ekstensi', () => {
    const buf = readFileSync(expectedZip);
    const contentStr = buf.toString('latin1');

    // Pastikan path penting tercatat dalam struktur zip
    assert.ok(contentStr.includes('manifest.json'), 'ZIP harus memuat manifest.json');
    assert.ok(contentStr.includes('background/service_worker.js'), 'ZIP harus memuat background/service_worker.js');
    assert.ok(contentStr.includes('lib/rf.js'), 'ZIP harus memuat lib/rf.js');
    assert.ok(contentStr.includes('lib/features.js'), 'ZIP harus memuat lib/features.js');
    assert.ok(contentStr.includes('popup/popup.html'), 'ZIP harus memuat popup/popup.html');
    assert.ok(contentStr.includes('warning/warning.html'), 'ZIP harus memuat warning/warning.html');
    assert.ok(contentStr.includes('education/education.html'), 'ZIP harus memuat education/education.html');
  });
});
