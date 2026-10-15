/**
 * BigInt math primitives for HomoKX
 *
 * Implements:
 * - modPow: binary exponentiation
 * - egcd: extended Euclidean algorithm
 * - modInv: modular inverse
 * - randomInRange / randomBelow: unbiased rejection sampling with crypto.getRandomValues
 * - millerRabin: probabilistic primality testing (rounds = 40)
 * - I2OSP & OS2IP: RFC 8017 BigInt <-> Uint8Array conversions
 */

/**
 * Fast modular exponentiation (base^exp mod modulus)
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod <= 0n) throw new Error('Modulus must be positive');
  if (mod === 1n) return 0n;
  if (exp < 0n) throw new Error('Negative exponent not supported in modPow');

  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod;
    }
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

/**
 * Extended Euclidean Algorithm
 * Returns { gcd, x, y } such that a*x + b*y = gcd
 */
export function egcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  let [old_r, r] = [a, b];
  let [old_s, s] = [1n, 0n];
  let [old_t, t] = [0n, 1n];

  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }

  return { gcd: old_r, x: old_s, y: old_t };
}

/**
 * Modular inverse: a^-1 mod m
 * Throws if gcd(a, m) != 1
 */
export function modInv(a: bigint, m: bigint): bigint {
  if (m <= 0n) throw new Error('Modulus must be positive');
  const normalizedA = ((a % m) + m) % m;
  const { gcd, x } = egcd(normalizedA, m);
  if (gcd !== 1n) {
    throw new Error(`Modular inverse does not exist for ${a} mod ${m}`);
  }
  return ((x % m) + m) % m;
}

/**
 * Cryptographically secure random BigInt in [0, max - 1]
 * Uses Web Crypto API with rejection sampling to eliminate modulo bias.
 */
export function randomBelow(max: bigint): bigint {
  if (max <= 1n) return 0n;

  const bits = max.toString(2).length;
  const byteCount = Math.ceil(bits / 8);
  const excessBits = byteCount * 8 - bits;
  const mask = 0xff >>> excessBits;

  const buf = new Uint8Array(byteCount);

  // Rejection sampling
  while (true) {
    crypto.getRandomValues(buf);
    // Mask off highest bits to fit the exact bit-length of max
    buf[0] &= mask;

    let candidate = 0n;
    for (let i = 0; i < byteCount; i++) {
      candidate = (candidate << 8n) | BigInt(buf[i]);
    }

    if (candidate < max) {
      return candidate;
    }
  }
}

/**
 * Cryptographically secure random BigInt in [min, max] (inclusive)
 */
export function randomInRange(min: bigint, max: bigint): bigint {
  if (min > max) throw new Error(`min (${min}) cannot exceed max (${max})`);
  const range = max - min + 1n;
  return min + randomBelow(range);
}

/**
 * Miller-Rabin Primality Test
 * @param n Candidate integer to test
 * @param rounds Number of Miller-Rabin iterations (default 40 for cryptographic certainty)
 */
export function millerRabin(n: bigint, rounds = 40): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if ((n & 1n) === 0n) return false;

  // Small prime pre-check for fast exit on composite numbers
  const smallPrimes = [3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const p of smallPrimes) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  // Factor n - 1 as 2^s * d with d odd
  let d = n - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  for (let i = 0; i < rounds; i++) {
    const a = randomInRange(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) {
      continue;
    }

    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }

    if (composite) {
      return false;
    }
  }

  return true;
}

/**
 * I2OSP: Integer-to-Octet-String Primitive (RFC 8017)
 * Converts non-negative BigInt to big-endian byte array, optionally padded to specified length.
 */
export function I2OSP(val: bigint, length?: number): Uint8Array {
  if (val < 0n) throw new Error('I2OSP only supports non-negative BigInt');

  let hex = val.toString(16);
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  const minBytes = hex.length / 2;
  const targetLength = length !== undefined ? Math.max(length, minBytes) : minBytes;

  const out = new Uint8Array(targetLength);
  const padOffset = targetLength - minBytes;

  for (let i = 0; i < minBytes; i++) {
    out[padOffset + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return out;
}

/**
 * OS2IP: Octet-String-to-Integer Primitive (RFC 8017)
 * Converts big-endian byte array to BigInt
 */
export function OS2IP(bytes: Uint8Array): bigint {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex ? BigInt('0x' + hex) : 0n;
}

/**
 * Format bytes to lowercase hexadecimal string
 */
export function toHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

/**
 * Parse hexadecimal string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.replace(/\s+/g, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const out = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Format large BigInt with truncation for UI display
 */
export function formatBigIntTruncated(val: bigint, leading = 10, trailing = 10): string {
  const s = val.toString(10);
  if (s.length <= leading + trailing + 3) {
    return s;
  }
  return `${s.slice(0, leading)}...${s.slice(-trailing)}`;
}
