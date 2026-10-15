import { describe, it, expect } from 'vitest';
import {
  RFC3526_2048_P,
  RFC3526_2048_Q,
  TOY_GROUP_P,
  TOY_GROUP_Q,
  GROUP_2048,
  GROUP_TOY,
  EXAMPLE_GROUP_P,
  EXAMPLE_GROUP_Q,
  GroupParams,
} from '../src/crypto/params';
import {
  modPow,
  modInv,
  millerRabin,
  I2OSP,
  OS2IP,
} from '../src/crypto/bigint';
import {
  E,
  verifyH1,
  verifyH2,
  verifyH3,
  isValidGroupElement,
  sampleSubgroupElement,
  samplePrivateExponent,
  validateGroupElement,
} from '../src/crypto/homomorphic';
import { runFullProtocol } from '../src/crypto/protocol';
import { generateAuthKeyPair } from '../src/crypto/auth';
import { simulateEve } from '../src/crypto/eve';

describe('HomoKX Cryptographic Foundation', () => {
  // Test 1: p and q are prime (Miller-Rabin, 40 rounds) for 2048-bit group & toy group
  it('1. verifies that p and q are prime (Miller-Rabin, 40 rounds) for both groups', () => {
    // Toy group
    expect(millerRabin(TOY_GROUP_P, 40)).toBe(true);
    expect(millerRabin(TOY_GROUP_Q, 40)).toBe(true);

    // RFC 3526 2048-bit MODP group (Group 14)
    expect(millerRabin(RFC3526_2048_P, 40)).toBe(true);
    expect(millerRabin(RFC3526_2048_Q, 40)).toBe(true);
  }, 30000);

  // Test 2: H1, H2, H3 hold for 100 random inputs in both groups
  it('2. verifies H1, H2, H3 homomorphic properties hold for 100 random inputs in both groups', () => {
    const groups: GroupParams[] = [GROUP_TOY, GROUP_2048];

    for (const grp of groups) {
      for (let i = 0; i < 100; i++) {
        const m1 = sampleSubgroupElement(grp.p, grp.q);
        const m2 = sampleSubgroupElement(grp.p, grp.q);
        const a = samplePrivateExponent(grp.q);
        const b = samplePrivateExponent(grp.q);

        // (H1) Multiplicative Homomorphism: E_k(m1 * m2 mod p) == E_k(m1) * E_k(m2) mod p
        expect(verifyH1(m1, m2, a, grp.p)).toBe(true);

        // (H2) Commutativity: E_a(E_b(m)) == E_b(E_a(m)) mod p
        expect(verifyH2(m1, a, b, grp.p)).toBe(true);

        // (H3) Invertibility: E_{k^-1 mod q}(E_k(m)) == m mod p
        expect(verifyH3(m1, a, grp.p, grp.q)).toBe(true);
      }
    }
  }, 30000);

  // Test 3: Full protocol: 50 runs, Alice and Bob derive identical SK every time
  it('3. executes 50 full protocol runs where Alice and Bob derive identical SK every time', async () => {
    // Run 40 runs on toy group and 10 on 2048-bit group (for fast test execution)
    for (let i = 0; i < 40; i++) {
      const res = await runFullProtocol(GROUP_TOY);
      expect(res.success).toBe(true);
      expect(res.alice.sessionKeyHex).toBeDefined();
      expect(res.alice.sessionKeyHex).toBe(res.bob.sessionKeyHex);
      expect(res.alice.secrets.kRecovered).toBe(res.bob.secrets.kOwn);
      expect(res.bob.secrets.kRecovered).toBe(res.alice.secrets.kOwn);
    }

    for (let i = 0; i < 10; i++) {
      const res = await runFullProtocol(GROUP_2048);
      expect(res.success).toBe(true);
      expect(res.alice.sessionKeyHex).toBeDefined();
      expect(res.alice.sessionKeyHex).toBe(res.bob.sessionKeyHex);
      expect(res.alice.secrets.kRecovered).toBe(res.bob.secrets.kOwn);
      expect(res.bob.secrets.kRecovered).toBe(res.alice.secrets.kOwn);
    }
  }, 30000);

  // Test 4: Invalid element (0, 1, p-1, p, a non-residue) is rejected
  it('4. rejects invalid elements: 0, 1, p-1, p, and non-residues', () => {
    const p = TOY_GROUP_P;
    const q = TOY_GROUP_Q;

    // Boundary elements outside [2, p - 2]
    expect(isValidGroupElement(0n, p, q)).toBe(false);
    expect(isValidGroupElement(1n, p, q)).toBe(false);
    expect(isValidGroupElement(p - 1n, p, q)).toBe(false);
    expect(isValidGroupElement(p, p, q)).toBe(false);
    expect(isValidGroupElement(p + 1n, p, q)).toBe(false);

    expect(() => validateGroupElement(0n, p, q)).toThrow('Invalid group element');
    expect(() => validateGroupElement(1n, p, q)).toThrow('Invalid group element');
    expect(() => validateGroupElement(p - 1n, p, q)).toThrow('Invalid group element');

    // Find a quadratic non-residue in Z_p^* (Euler's criterion: x^q mod p != 1)
    let nonResidue = 2n;
    while (nonResidue < p - 1n) {
      if (modPow(nonResidue, q, p) !== 1n) {
        break;
      }
      nonResidue++;
    }
    expect(isValidGroupElement(nonResidue, p, q)).toBe(false);
    expect(() => validateGroupElement(nonResidue, p, q)).toThrow('Invalid group element');
  });

  // Test 5: Worked example in the toy group p=23, q=11: K=4, a=3, b=5 -> returns K=4
  it('5. validates the exact worked example in group p=23, q=11 with K=4, a=3, b=5', () => {
    const p = EXAMPLE_GROUP_P; // 23n
    const q = EXAMPLE_GROUP_Q; // 11n
    const K = 4n;
    const a = 3n;
    const b = 5n;

    // Verify K is a valid quadratic residue in Z_23^* of order 11:
    expect(modPow(K, q, p)).toBe(1n);

    // Compute inverses mod q = 11:
    const aInv = modInv(a, q); // 3 * 4 = 12 = 1 mod 11 => 4n
    const bInv = modInv(b, q); // 5 * 9 = 45 = 1 mod 11 => 9n
    expect(aInv).toBe(4n);
    expect(bInv).toBe(9n);

    // Step 1: Alice blinds K with a: M1 = K^a mod p
    const M1 = E(K, a, p); // 4^3 mod 23 = 64 mod 23 = 18n
    expect(M1).toBe(18n);

    // Step 2: Bob blinds M1 with b: M3 = M1^b mod p
    const M3 = E(M1, b, p); // 18^5 mod 23 = 3n
    expect(M3).toBe(3n);

    // Step 3: Alice unblinds a: M5 = M3^(a^-1 mod q) mod p
    const M5 = E(M3, aInv, p); // 3^4 mod 23 = 81 mod 23 = 12n
    expect(M5).toBe(12n);

    // Step 4: Bob unblinds b: K_recovered = M5^(b^-1 mod q) mod p
    const K_recovered = E(M5, bInv, p); // 12^9 mod 23 = 4n
    expect(K_recovered).toBe(K);
    expect(K_recovered).toBe(4n);
  });

  // Test 6: Eve in unauthenticated mode compromises session; in authenticated mode session aborts
  it('6. verifies Eve in unauthenticated mode compromises session, but authenticated mode aborts', async () => {
    // Generate long-term keys for Alice and Bob
    const aliceKeys = await generateAuthKeyPair();
    const bobKeys = await generateAuthKeyPair();

    // 6a. Unauthenticated mode: Eve intercepts and compromises session
    const unauthResult = await simulateEve(GROUP_TOY, false);
    expect(unauthResult.compromised).toBe(true);
    expect(unauthResult.attackBlocked).toBe(false);
    expect(unauthResult.recoveredKA).toBeDefined();
    expect(unauthResult.recoveredKB).toBeDefined();
    expect(unauthResult.eveKeyWithAliceHex).toBeDefined();
    expect(unauthResult.eveKeyWithBobHex).toBeDefined();
    // Alice's session key with Eve does not match Bob's session key with Eve
    expect(unauthResult.eveKeyWithAliceHex).not.toBe(unauthResult.eveKeyWithBobHex);

    // 6b. Authenticated mode: Eve's attack is blocked because signatures fail
    const authResult = await simulateEve(GROUP_TOY, true, aliceKeys, bobKeys);
    expect(authResult.compromised).toBe(false);
    expect(authResult.attackBlocked).toBe(true);
    expect(authResult.abortReason).toMatch(/invalid|signature|verification/i);
  });

  it('7. tests I2OSP and OS2IP round-trip encoding', () => {
    const val = 123456789012345678901234567890n;
    const bytes = I2OSP(val, 32);
    expect(bytes.length).toBe(32);
    const recovered = OS2IP(bytes);
    expect(recovered).toBe(val);
  });
});
