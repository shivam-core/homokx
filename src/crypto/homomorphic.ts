/**
 * Homomorphic functions and group operations for HomoKX
 *
 * Implements:
 * - E_k(m) = m^k mod p
 * - Validation of order-q subgroup membership: 2 <= x <= p-2 and x^q mod p == 1
 * - Contribution sampling: r^2 mod p for r in [2, p-2]
 * - Verifiers for algebraic properties H1, H2, H3
 */

import { modPow, modInv, randomInRange } from './bigint';

/**
 * Homomorphic exponentiation: E_k(m) = m^k mod p
 */
export function E(m: bigint, k: bigint, p: bigint): bigint {
  return modPow(m, k, p);
}

/**
 * Validate that x is a non-trivial element of the prime-order-q subgroup of Z_p^*
 * Requirements:
 * 1. 2 <= x <= p - 2
 * 2. x^q mod p == 1
 */
export function isValidGroupElement(x: bigint, p: bigint, q: bigint): boolean {
  if (x < 2n || x > p - 2n) {
    return false;
  }
  return modPow(x, q, p) === 1n;
}

/**
 * Strict validator: throws error if element is invalid
 */
export function validateGroupElement(x: bigint, p: bigint, q: bigint): void {
  if (!isValidGroupElement(x, p, q)) {
    throw new Error('Invalid group element');
  }
}

/**
 * Sample a secret contribution K in the prime-order-q subgroup
 * Computed as r^2 mod p for random r in [2, p - 2]
 */
export function sampleSubgroupElement(p: bigint, q: bigint): bigint {
  while (true) {
    const r = randomInRange(2n, p - 2n);
    const k = modPow(r, 2n, p);
    if (isValidGroupElement(k, p, q)) {
      return k;
    }
  }
}

/**
 * Sample a private exponent in [2, q - 2]
 */
export function samplePrivateExponent(q: bigint): bigint {
  return randomInRange(2n, q - 2n);
}

/**
 * (H1) Multiplicative Homomorphism:
 * E_k(m1 * m2 mod p) == E_k(m1) * E_k(m2) mod p
 */
export function verifyH1(m1: bigint, m2: bigint, k: bigint, p: bigint): boolean {
  const left = E((m1 * m2) % p, k, p);
  const right = (E(m1, k, p) * E(m2, k, p)) % p;
  return left === right;
}

/**
 * (H2) Commutativity:
 * E_a(E_b(m)) == E_b(E_a(m)) mod p
 */
export function verifyH2(m: bigint, a: bigint, b: bigint, p: bigint): boolean {
  const left = E(E(m, b, p), a, p);
  const right = E(E(m, a, p), b, p);
  return left === right;
}

/**
 * (H3) Invertibility:
 * E_{k^-1 mod q}(E_k(m)) == m mod p
 */
export function verifyH3(m: bigint, k: bigint, p: bigint, q: bigint): boolean {
  const kInv = modInv(k, q);
  const blinded = E(m, k, p);
  const unblinded = E(blinded, kInv, p);
  return unblinded === m;
}
