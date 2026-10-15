/**
 * Active Man-In-The-Middle (MITM) and Passive Eavesdropper logic for HomoKX
 *
 * Simulates Eve:
 * - Unauthenticated mode: Runs separate protocol instances with Alice and Bob using her own exponents,
 *   unblinds both secret contributions (K_A and K_B), and derives independent session keys with both.
 *   Shows red "Session compromised — Eve holds both keys" with Alice's SK != Bob's SK.
 * - Authenticated mode: Eve's forged messages fail ECDSA signature verification against pinned keys,
 *   causing the session to immediately abort.
 * - Passive mode: Eavesdropper view listing public messages M1..M6.
 */

import { GroupParams } from './params';
import { modPow, modInv } from './bigint';
import {
  samplePrivateExponent,
  sampleSubgroupElement,
  validateGroupElement,
} from './homomorphic';
import { ProtocolMessage, ProtocolParty } from './protocol';
import { generateAuthKeyPair, PartyKeyPair } from './auth';
import { deriveSessionKey } from './kdf';

export interface EveSessionResult {
  compromised: boolean;
  attackBlocked: boolean;
  abortReason?: string;
  recoveredKA?: bigint;
  recoveredKB?: bigint;
  aliceSessionKeyHex?: string;
  bobSessionKeyHex?: string;
  eveKeyWithAliceHex?: string;
  eveKeyWithBobHex?: string;
  interceptedMessages: ProtocolMessage[];
  eavesdroppedPublicMessages: ProtocolMessage[];
}

export class EveAttacker {
  public params: GroupParams;
  public authenticated: boolean;
  public eveAuthKey?: PartyKeyPair;

  // Eve's exponents and contributions for Alice-Eve session
  public eB1: bigint;
  public eB2: bigint;
  public kEveA: bigint;

  // Eve's exponents and contributions for Bob-Eve session
  public eA1: bigint;
  public eA2: bigint;
  public kEveB: bigint;

  public recoveredKA?: bigint;
  public recoveredKB?: bigint;
  public sessionKeyAliceHex?: string;
  public sessionKeyBobHex?: string;

  constructor(params: GroupParams, authenticated = false, eveAuthKey?: PartyKeyPair) {
    this.params = params;
    this.authenticated = authenticated;
    this.eveAuthKey = eveAuthKey;

    this.eB1 = samplePrivateExponent(params.q);
    this.eB2 = samplePrivateExponent(params.q);
    this.kEveA = sampleSubgroupElement(params.p, params.q);

    this.eA1 = samplePrivateExponent(params.q);
    this.eA2 = samplePrivateExponent(params.q);
    this.kEveB = sampleSubgroupElement(params.p, params.q);
  }

  /**
   * Run the active MITM attack against Alice and Bob
   */
  public async executeAttack(
    alice: ProtocolParty,
    bob: ProtocolParty
  ): Promise<EveSessionResult> {
    const interceptedMessages: ProtocolMessage[] = [];

    try {
      // -------------------------------------------------------------
      // ROUND 1
      // Alice sends M1 towards Bob: M1 = K_A^a1
      const m1_A = await alice.createM1();
      interceptedMessages.push(m1_A);

      // Bob sends M2 towards Alice: M2 = K_B^b2
      const m2_B = await bob.createM2();
      interceptedMessages.push(m2_B);

      // If authenticated, Eve cannot forge valid signatures under Alice or Bob's keys.
      // Eve attempts to inject her own messages:
      const fakeSigAlice = this.authenticated
        ? 'eve_forged_sig_' + Math.random().toString(16).substring(2)
        : undefined;
      const fakeSigBob = this.authenticated
        ? 'eve_forged_sig_' + Math.random().toString(16).substring(2)
        : undefined;

      // Eve generates M2_Eve to Alice (pretending to be Bob)
      const m2_EveVal = modPow(this.kEveA, this.eB2, this.params.p);
      const m2_Eve: ProtocolMessage = {
        id: 'm2_eve',
        round: 1,
        from: 'Eve',
        to: 'Alice',
        name: 'M2 (Eve→Alice)',
        formula: 'K_{EveA}^{e_{B2}} mod p',
        value: m2_EveVal,
        signature: fakeSigBob,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m2_Eve);

      // Eve generates M1_Eve to Bob (pretending to be Alice)
      const m1_EveVal = modPow(this.kEveB, this.eA1, this.params.p);
      const m1_Eve: ProtocolMessage = {
        id: 'm1_eve',
        round: 1,
        from: 'Eve',
        to: 'Bob',
        name: 'M1 (Eve→Bob)',
        formula: 'K_{EveB}^{e_{A1}} mod p',
        value: m1_EveVal,
        signature: fakeSigAlice,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m1_Eve);

      // -------------------------------------------------------------
      // ROUND 2
      // Alice receives M2_Eve (verifies signature if authenticated -> MUST abort if authenticated)
      const m4_A = await alice.processM2AndCreateM4(m2_Eve);
      interceptedMessages.push(m4_A);

      // Bob receives M1_Eve (verifies signature if authenticated -> MUST abort if authenticated)
      const m3_B = await bob.processM1AndCreateM3(m1_Eve);
      interceptedMessages.push(m3_B);

      // Eve generates M3_Eve to Alice: M3 = (M1_A)^eB1
      const m3_EveVal = modPow(m1_A.value, this.eB1, this.params.p);
      const m3_Eve: ProtocolMessage = {
        id: 'm3_eve',
        round: 2,
        from: 'Eve',
        to: 'Alice',
        name: 'M3 (Eve→Alice)',
        formula: 'M1_A^{e_{B1}} mod p = K_A^{a1 \\cdot e_{B1}}',
        value: m3_EveVal,
        signature: fakeSigBob,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m3_Eve);

      // Eve generates M4_Eve to Bob: M4 = (M2_B)^eA2
      const m4_EveVal = modPow(m2_B.value, this.eA2, this.params.p);
      const m4_Eve: ProtocolMessage = {
        id: 'm4_eve',
        round: 2,
        from: 'Eve',
        to: 'Bob',
        name: 'M4 (Eve→Bob)',
        formula: 'M2_B^{e_{A2}} mod p = K_B^{b2 \\cdot e_{A2}}',
        value: m4_EveVal,
        signature: fakeSigAlice,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m4_Eve);

      // -------------------------------------------------------------
      // ROUND 3
      // Alice processes M3_Eve into M5_A = (M3_Eve)^(a1^-1) = K_A^eB1
      const m5_A = await alice.processM3AndCreateM5(m3_Eve);
      interceptedMessages.push(m5_A);

      // Bob processes M4_Eve into M6_B = (M4_Eve)^(b2^-1) = K_B^eA2
      const m6_B = await bob.processM4AndCreateM6(m4_Eve);
      interceptedMessages.push(m6_B);

      // Eve intercepts M5_A and unblinds K_A with eB1^-1!
      const eB1Inv = modInv(this.eB1, this.params.q);
      const recoveredKA = modPow(m5_A.value, eB1Inv, this.params.p);
      validateGroupElement(recoveredKA, this.params.p, this.params.q);
      this.recoveredKA = recoveredKA;

      // Eve intercepts M6_B and unblinds K_B with eA2^-1!
      const eA2Inv = modInv(this.eA2, this.params.q);
      const recoveredKB = modPow(m6_B.value, eA2Inv, this.params.p);
      validateGroupElement(recoveredKB, this.params.p, this.params.q);
      this.recoveredKB = recoveredKB;

      // Eve finishes Alice's session by unblinding eB2 from M4_A:
      const eB2Inv = modInv(this.eB2, this.params.q);
      const m6_EveVal = modPow(m4_A.value, eB2Inv, this.params.p); // = kEveA^a2
      const m6_Eve: ProtocolMessage = {
        id: 'm6_eve',
        round: 3,
        from: 'Eve',
        to: 'Alice',
        name: 'M6 (Eve→Alice)',
        formula: 'M4_A^{e_{B2}^{-1}} mod p = K_{EveA}^{a2}',
        value: m6_EveVal,
        signature: fakeSigBob,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m6_Eve);

      // Eve finishes Bob's session by unblinding eA1 from M3_B:
      const eA1Inv = modInv(this.eA1, this.params.q);
      const m5_EveVal = modPow(m3_B.value, eA1Inv, this.params.p); // = kEveB^b1
      const m5_Eve: ProtocolMessage = {
        id: 'm5_eve',
        round: 3,
        from: 'Eve',
        to: 'Bob',
        name: 'M5 (Eve→Bob)',
        formula: 'M3_B^{e_{A1}^{-1}} mod p = K_{EveB}^{b1}',
        value: m5_EveVal,
        signature: fakeSigAlice,
        timestamp: Date.now(),
      };
      interceptedMessages.push(m5_Eve);

      // Alice recovers kEveA from M6_Eve
      await alice.processM6AndRecoverKB(m6_Eve);

      // Bob recovers kEveB from M5_Eve
      await bob.processM5AndRecoverKA(m5_Eve);

      // Alice derives session key (thinking she shares it with Bob)
      const aliceTranscript = [
        m1_A.value,
        m2_Eve.value,
        m3_Eve.value,
        m4_A.value,
        m5_A.value,
        m6_Eve.value,
      ];
      const aliceKeyHex = await alice.finalizeKey(aliceTranscript);

      // Bob derives session key (thinking he shares it with Alice)
      const bobTranscript = [
        m1_Eve.value,
        m2_B.value,
        m3_B.value,
        m4_Eve.value,
        m5_Eve.value,
        m6_B.value,
      ];
      const bobKeyHex = await bob.finalizeKey(bobTranscript);

      // Eve derives BOTH keys:
      // Eve-Alice key:
      const eveAliceKey = await deriveSessionKey(
        recoveredKA,
        this.kEveA,
        aliceTranscript,
        this.params.byteLength
      );
      this.sessionKeyAliceHex = eveAliceKey.skHex;

      // Eve-Bob key:
      const eveBobKey = await deriveSessionKey(
        this.kEveB,
        recoveredKB,
        bobTranscript,
        this.params.byteLength
      );
      this.sessionKeyBobHex = eveBobKey.skHex;

      return {
        compromised: true,
        attackBlocked: false,
        recoveredKA,
        recoveredKB,
        aliceSessionKeyHex: aliceKeyHex,
        bobSessionKeyHex: bobKeyHex,
        eveKeyWithAliceHex: eveAliceKey.skHex,
        eveKeyWithBobHex: eveBobKey.skHex,
        interceptedMessages,
        eavesdroppedPublicMessages: interceptedMessages,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        compromised: false,
        attackBlocked: true,
        abortReason: msg,
        interceptedMessages,
        eavesdroppedPublicMessages: interceptedMessages,
      };
    }
  }
}

/**
 * Execute passive or active MITM simulation
 */
export async function simulateEve(
  params: GroupParams,
  authenticated: boolean,
  aliceKeyPair?: PartyKeyPair,
  bobKeyPair?: PartyKeyPair
): Promise<EveSessionResult> {
  const sessionId = 'session_mitm_' + Math.random().toString(36).substring(2, 8);
  const eveKeyPair = authenticated ? await generateAuthKeyPair() : undefined;

  const alice = new ProtocolParty(
    'Alice',
    params,
    sessionId,
    authenticated,
    aliceKeyPair,
    bobKeyPair?.keyPair.publicKey
  );

  const bob = new ProtocolParty(
    'Bob',
    params,
    sessionId,
    authenticated,
    bobKeyPair,
    aliceKeyPair?.keyPair.publicKey
  );

  const eve = new EveAttacker(params, authenticated, eveKeyPair);
  return await eve.executeAttack(alice, bob);
}
