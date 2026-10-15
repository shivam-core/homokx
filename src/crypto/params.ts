/**
 * HomoKX Cryptographic Group Parameters
 *
 * Group: Safe prime p = 2q + 1, with subgroup of quadratic residues of prime order q.
 * Production: RFC 3526 Section 3 (2048-bit MODP Group 14)
 * Toy mode: p = 1019, q = 509
 * Minimal worked example mode: p = 23, q = 11
 */

export interface GroupParams {
  name: string;
  id: 'toy' | 'rfc3526_2048';
  p: bigint;
  q: bigint;
  byteLength: number;
}

// RFC 3526 §3 2048-bit MODP Group (Group 14)
// p = 2^2048 - 2^1984 - 1 + 2^64 * { [2^1918 pi] + 124476 }
const RFC_3526_2048_HEX =
  'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1' +
  '29024E088A67CC74020BBEA63B139B22514A08798E3404DD' +
  'EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245' +
  'E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED' +
  'EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D' +
  'C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F' +
  '83655D23DCA3AD961C62F356208552BB9ED529077096966D' +
  '670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B' +
  'E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9' +
  'DE2BCBF6955817183995497CEA956AE515D2261898FA0510' +
  '15728E5A8AACAA68FFFFFFFFFFFFFFFF';

export const RFC3526_2048_P = BigInt('0x' + RFC_3526_2048_HEX);
export const RFC3526_2048_Q = (RFC3526_2048_P - 1n) / 2n;

// Toy Group: p = 1019, q = 509 (both prime, safe prime p = 2*509 + 1)
export const TOY_GROUP_P = 1019n;
export const TOY_GROUP_Q = 509n;

// Worked Example Group: p = 23, q = 11 (2*11 + 1 = 23)
export const EXAMPLE_GROUP_P = 23n;
export const EXAMPLE_GROUP_Q = 11n;

export const GROUP_2048: GroupParams = {
  name: '2048-bit MODP Group (RFC 3526 Group 14)',
  id: 'rfc3526_2048',
  p: RFC3526_2048_P,
  q: RFC3526_2048_Q,
  byteLength: 256,
};

export const GROUP_TOY: GroupParams = {
  name: 'Toy Group (p = 1019, q = 509)',
  id: 'toy',
  p: TOY_GROUP_P,
  q: TOY_GROUP_Q,
  byteLength: 2,
};
