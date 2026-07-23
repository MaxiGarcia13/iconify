import type { Buffer } from 'node:buffer';

const EOCD_SIG = 0x06_05_4B_50;
const CD_SIG = 0x02_01_4B_50;

/** List entry names from a ZIP central directory (no extra deps). */
export function listZipEntryNames(zip: Buffer): string[] {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === EOCD_SIG) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('ZIP end of central directory not found');
  }

  const totalEntries = zip.readUInt16LE(eocd + 10);
  let offset = zip.readUInt32LE(eocd + 16);
  const names: string[] = [];

  for (let i = 0; i < totalEntries; i++) {
    if (zip.readUInt32LE(offset) !== CD_SIG) {
      throw new Error(`Invalid central directory signature at entry ${i}`);
    }
    const nameLen = zip.readUInt16LE(offset + 28);
    const extraLen = zip.readUInt16LE(offset + 30);
    const commentLen = zip.readUInt16LE(offset + 32);
    names.push(zip.subarray(offset + 46, offset + 46 + nameLen).toString('utf8'));
    offset += 46 + nameLen + extraLen + commentLen;
  }

  return names;
}
