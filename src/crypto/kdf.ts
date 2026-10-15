/**
 * Key Derivation Functions (KDF) and Key Confirmation for HomoKX
 *
 * Implements:
 * - SHA-256 hashing via WebCrypto
 * - HKDF-SHA256 key derivation (RFC 5869)
 * - HMAC-SHA256 key confirmation tags
 */

import { I2OSP, toHex } from './bigint';

/**
 * SHA-256 hash using WebCrypto
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuf = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  return new Uint8Array(hashBuf);
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

/**
 * Build transcript bytes from protocol messages M1..M6
 */
export function buildTranscriptBytes(
  messages: bigint[],
  byteLength: number
): Uint8Array {
  const serialized = messages.map((m) => I2OSP(m, byteLength));
  return concatBytes(...serialized);
}

/**
 * Derive final shared session key using HKDF-SHA256
 *
 * SK = HKDF-SHA256(
 *   ikm = I2OSP(K_A) || I2OSP(K_B),
 *   salt = SHA-256(transcript),
 *   info = "HomoKX v1",
 *   length = 32 bytes
 * )
 */
export async function deriveSessionKey(
  kA: bigint,
  kB: bigint,
  messagesM1ToM6: bigint[],
  byteLength: number
): Promise<{ skBytes: Uint8Array; skHex: string; transcriptHash: Uint8Array }> {
  // Input Keying Material (IKM)
  const ikm = concatBytes(I2OSP(kA, byteLength), I2OSP(kB, byteLength));

  // Transcript Hash as Salt
  const transcriptBytes = buildTranscriptBytes(messagesM1ToM6, byteLength);
  const salt = await sha256(transcriptBytes);

  // Info
  const info = new TextEncoder().encode('HomoKX v1');

  // Import IKM for HKDF
  const baseKey = await crypto.subtle.importKey(
    'raw',
    ikm as unknown as BufferSource,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );

  // Derive 32 bytes (256 bits)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      info: info as unknown as BufferSource,
    },
    baseKey,
    256
  );

  const skBytes = new Uint8Array(derivedBits);
  return {
    skBytes,
    skHex: toHex(skBytes),
    transcriptHash: salt,
  };
}

/**
 * Compute HMAC-SHA256 confirmation tag
 * tag = HMAC-SHA256(SK, "confirm" || role || SHA-256(transcript))
 */
export async function computeConfirmationTag(
  skBytes: Uint8Array,
  role: 'Alice' | 'Bob',
  transcriptHash: Uint8Array
): Promise<string> {
  const prefix = new TextEncoder().encode('confirm');
  const roleBytes = new TextEncoder().encode(role);
  const data = concatBytes(prefix, roleBytes, transcriptHash);

  const hmacKey = await crypto.subtle.importKey(
    'raw',
    skBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', hmacKey, data as unknown as BufferSource);
  return toHex(new Uint8Array(sig));
}

/**
 * Verify HMAC-SHA256 confirmation tag
 */
export async function verifyConfirmationTag(
  skBytes: Uint8Array,
  role: 'Alice' | 'Bob',
  transcriptHash: Uint8Array,
  tagHex: string
): Promise<boolean> {
  const computedTag = await computeConfirmationTag(skBytes, role, transcriptHash);
  return computedTag.toLowerCase() === tagHex.toLowerCase();
}
