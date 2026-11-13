// Simple cryptographic / checksum utility for Minutes integrity verification

export function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestamp = Date.now().toString(16).slice(-4);
  return `MIN-${hex.toUpperCase()}-${timestamp.toUpperCase()}`;
}
