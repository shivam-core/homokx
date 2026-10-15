/**
 * Authentication module using ECDSA P-256 with WebCrypto
 *
 * Implements:
 * - Long-term key pair generation (P-256)
 * - Exportable public keys for UI pinning
 * - Per-message signing over (round || message || sessionId)
 * - Signature verification
 */

import { I2OSP, toHex, fromHex } from './bigint';
import { concatBytes } from './kdf';

export interface PartyKeyPair {
  keyPair: CryptoKeyPair;
  publicKeyHex: string;
  fingerprint: string;
}

/**
 * Generate a new long-term ECDSA P-256 key pair
 */
export async function generateAuthKeyPair(): Promise<PartyKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const spkiBytes = new Uint8Array(spki);
  const publicKeyHex = toHex(spkiBytes);

  // Compute an 8-byte display fingerprint
  const hash = await crypto.subtle.digest('SHA-256', spkiBytes as unknown as BufferSource);
  const fpBytes = new Uint8Array(hash).slice(0, 8);
  const fingerprint = toHex(fpBytes).toUpperCase();

  return {
    keyPair,
    publicKeyHex,
    fingerprint,
  };
}

/**
 * Construct payload for signing: (round number || message || session id)
 */
export function buildAuthPayload(
  round: number,
  message: bigint,
  byteLength: number,
  sessionId: string
): Uint8Array {
  const roundBytes = new Uint8Array([round]);
  const msgBytes = I2OSP(message, byteLength);
  const sessionBytes = new TextEncoder().encode(sessionId);
  return concatBytes(roundBytes, msgBytes, sessionBytes);
}

/**
 * Sign a message using ECDSA P-256 / SHA-256
 */
export async function signMessage(
  privateKey: CryptoKey,
  round: number,
  message: bigint,
  byteLength: number,
  sessionId: string
): Promise<string> {
  const payload = buildAuthPayload(round, message, byteLength, sessionId);
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    privateKey,
    payload as unknown as BufferSource
  );
  return toHex(new Uint8Array(signature));
}

/**
 * Verify a message signature using the sender's public key
 */
export async function verifyMessageSignature(
  publicKey: CryptoKey,
  round: number,
  message: bigint,
  byteLength: number,
  sessionId: string,
  signatureHex: string
): Promise<boolean> {
  try {
    const payload = buildAuthPayload(round, message, byteLength, sessionId);
    const signatureBytes = fromHex(signatureHex);
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' },
      },
      publicKey,
      signatureBytes as unknown as BufferSource,
      payload as unknown as BufferSource
    );
  } catch {
    return false;
  }
}
