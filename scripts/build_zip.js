/**
 * scripts/build_zip.js
 * Skrip packaging mandiri (Zero-Dependency) untuk membuat arsip distribusi PhishShield (.zip).
 * Menggunakan format standar PKZIP dengan zlib.deflateRawSync bawaan Node.js.
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const extDir = join(rootDir, 'extension');
const distDir = join(rootDir, 'dist');

// Buat tabel CRC32 standar IEEE 802.3
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function calculateCrc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = ((date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2))) & 0xffff;
  const dosDate = (((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { dosTime, dosDate };
}

function getAllFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

export function buildZip() {
  if (!existsSync(extDir)) {
    throw new Error(`Direktori extension tidak ditemukan pada ${extDir}`);
  }

  const manifestPath = join(extDir, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const version = manifest.version || '1.0.0';

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const zipFilename = `phishshield-v${version}.zip`;
  const zipFilePath = join(distDir, zipFilename);

  const files = getAllFiles(extDir);
  const { dosTime, dosDate } = getDosDateTime();

  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const filePath of files) {
    const relativePath = relative(extDir, filePath).replace(/\\/g, '/');
    const rawData = readFileSync(filePath);
    const uncompressedSize = rawData.length;
    const fileCrc = calculateCrc32(rawData);

    // Kompresi DEFLATE
    let compressedData = zlib.deflateRawSync(rawData);
    let compressionMethod = 8; // DEFLATE

    // Jika hasil kompresi lebih besar atau data kosong, simpan tanpa kompresi (STORED)
    if (compressedData.length >= uncompressedSize || uncompressedSize === 0) {
      compressedData = rawData;
      compressionMethod = 0;
    }

    const compressedSize = compressedData.length;
    const nameBuffer = Buffer.from(relativePath, 'utf8');

    // 1. Local File Header (30 bytes + nameBuffer.length)
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Signature
    localHeader.writeUInt16LE(20, 4);          // Version needed
    localHeader.writeUInt16LE(0, 6);           // Flags
    localHeader.writeUInt16LE(compressionMethod, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(fileCrc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);          // Extra field len
    nameBuffer.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // 2. Central Directory Header (46 bytes + nameBuffer.length)
    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Signature
    centralHeader.writeUInt16LE(20, 4);          // Version made by
    centralHeader.writeUInt16LE(20, 6);          // Version needed
    centralHeader.writeUInt16LE(0, 8);           // Flags
    centralHeader.writeUInt16LE(compressionMethod, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(fileCrc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);          // Extra field len
    centralHeader.writeUInt16LE(0, 32);          // Comment len
    centralHeader.writeUInt16LE(0, 34);          // Disk start
    centralHeader.writeUInt16LE(0, 36);          // Internal attr
    centralHeader.writeUInt32LE(0, 38);          // External attr
    centralHeader.writeUInt32LE(currentOffset, 42); // Offset of local header
    nameBuffer.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length + compressedData.length;
  }

  const centralDirectoryOffset = currentOffset;
  const centralDirectorySize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

  // 3. End of Central Directory Record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);       // Signature
  eocd.writeUInt16LE(0, 4);                // Disk num
  eocd.writeUInt16LE(0, 6);                // Start disk
  eocd.writeUInt16LE(files.length, 8);     // Entries on disk
  eocd.writeUInt16LE(files.length, 10);    // Total entries
  eocd.writeUInt32LE(centralDirectorySize, 12);
  eocd.writeUInt32LE(centralDirectoryOffset, 16);
  eocd.writeUInt16LE(0, 20);               // Comment len

  const fullZipBuffer = Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  writeFileSync(zipFilePath, fullZipBuffer);

  return {
    zipPath: zipFilePath,
    filename: zipFilename,
    fileCount: files.length,
    sizeBytes: fullZipBuffer.length
  };
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1] && process.argv[1].endsWith('build_zip.js')) {
  try {
    console.log('📦 Memulai proses packaging PhishShield...');
    const result = buildZip();
    console.log(`✅ Berhasil membuat arsip: ${result.filename}`);
    console.log(`   - Lokasi: ${result.zipPath}`);
    console.log(`   - Jumlah Berkas: ${result.fileCount} berkas`);
    console.log(`   - Ukuran Arsip: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error('❌ Gagal membuat paket distribusi:', err.message);
    process.exit(1);
  }
}
