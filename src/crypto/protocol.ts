/**
 * HomoKX Protocol Implementation
 *
 * Implements the 3-round commutative homomorphic key exchange:
 * - Round 1: A->B: M1 = K_A^a1 | B->A: M2 = K_B^b2
 * - Round 2: B->A: M3 = M1^b1 | A->B: M4 = M2^a2
 * - Round 3: A->B: M5 = M3^(a1^-1) | B->A: M6 = M4^(b2^-1)
 * - Recovery: Bob computes K_A = M5^(b1^-1), Alice computes K_B = M6^(a2^-1)
 * - Validation on EVERY received value: 2 <= x <= p-2 and x^q mod p == 1
 * - Final key derivation with HKDF-SHA256
 * - Key confirmation tag exchange and verification
 */

import { GroupParams } from './params';
import { modPow, modInv } from './bigint';
import {
  samplePrivateExponent,
  sampleSubgroupElement,
  validateGroupElement,
} from './homomorphic';
import {
  deriveSessionKey,
  computeConfirmationTag,
  verifyConfirmationTag,
} from './kdf';
import {
  PartyKeyPair,
  signMessage,
  verifyMessageSignature,
} from './auth';

export interface ProtocolMessage {
  id: string;
  round: number;
  from: 'Alice' | 'Bob' | 'Eve';
  to: 'Alice' | 'Bob' | 'Eve';
  name: string;
  formula: string;
  value: bigint;
  signature?: string;
  timestamp?: number;
}

export interface PartySecrets {
  e1: bigint; // a1 for Alice, b1 for Bob
  e2: bigint; // a2 for Alice, b2 for Bob
  kOwn: bigint; // K_A for Alice, K_B for Bob
  kRecovered?: bigint; // K_B for Alice, K_A for Bob
}

export class ProtocolParty {
  public role: 'Alice' | 'Bob';
  public params: GroupParams;
  public secrets: PartySecrets;
  public authKey?: PartyKeyPair;
  public peerPublicKey?: CryptoKey;
  public sessionId: string;
  public authenticated: boolean;

  public sessionKeyHex?: string;
  public sessionKeyBytes?: Uint8Array;
  public transcriptHash?: Uint8Array;
  public confirmationTagSent?: string;
  public confirmationTagReceived?: string;
  public confirmationValid?: boolean;

  constructor(
    role: 'Alice' | 'Bob',
    params: GroupParams,
    sessionId: string,
    authenticated = false,
    authKey?: PartyKeyPair,
    peerPublicKey?: CryptoKey,
    presetSecrets?: Partial<PartySecrets>
  ) {
    this.role = role;
    this.params = params;
    this.sessionId = sessionId;
    this.authenticated = authenticated;
    this.authKey = authKey;
    this.peerPublicKey = peerPublicKey;

    const e1 = presetSecrets?.e1 ?? samplePrivateExponent(params.q);
    const e2 = presetSecrets?.e2 ?? samplePrivateExponent(params.q);
    const kOwn = presetSecrets?.kOwn ?? sampleSubgroupElement(params.p, params.q);

    this.secrets = {
      e1,
      e2,
      kOwn,
      kRecovered: presetSecrets?.kRecovered,
    };
  }

  /**
   * Reset party state for a new session
   */
  public resetSecrets(preset?: Partial<PartySecrets>): void {
    this.secrets = {
      e1: preset?.e1 ?? samplePrivateExponent(this.params.q),
      e2: preset?.e2 ?? samplePrivateExponent(this.params.q),
      kOwn: preset?.kOwn ?? sampleSubgroupElement(this.params.p, this.params.q),
      kRecovered: preset?.kRecovered,
    };
    this.sessionKeyHex = undefined;
    this.sessionKeyBytes = undefined;
    this.transcriptHash = undefined;
    this.confirmationTagSent = undefined;
    this.confirmationTagReceived = undefined;
    this.confirmationValid = undefined;
  }

  /**
   * Helper to validate incoming messages
   */
  public async validateIncomingMessage(msg: ProtocolMessage): Promise<void> {
    // 1. Subgroup validation
    validateGroupElement(msg.value, this.params.p, this.params.q);

    // 2. Authentication signature validation if enabled
    if (this.authenticated) {
      if (!msg.signature || !this.peerPublicKey) {
        throw new Error(`Message ${msg.name} failed signature verification (no signature or peer key)`);
      }
      const valid = await verifyMessageSignature(
        this.peerPublicKey,
        msg.round,
        msg.value,
        this.params.byteLength,
        this.sessionId,
        msg.signature
      );
      if (!valid) {
        throw new Error(`Message ${msg.name} has invalid ECDSA signature`);
      }
    }
  }

  /**
   * Helper to sign an outgoing message if authenticated
   */
  public async signOutgoingMessage(
    round: number,
    value: bigint
  ): Promise<string | undefined> {
    if (!this.authenticated || !this.authKey) return undefined;
    return await signMessage(
      this.authKey.keyPair.privateKey,
      round,
      value,
      this.params.byteLength,
      this.sessionId
    );
  }

  // Round 1 computations
  public async createM1(): Promise<ProtocolMessage> {
    if (this.role !== 'Alice') throw new Error('Only Alice produces M1');
    const value = modPow(this.secrets.kOwn, this.secrets.e1, this.params.p);
    const signature = await this.signOutgoingMessage(1, value);
    return {
      id: 'm1',
      round: 1,
      from: 'Alice',
      to: 'Bob',
      name: 'M1',
      formula: 'K_A^{a1} mod p',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  public async createM2(): Promise<ProtocolMessage> {
    if (this.role !== 'Bob') throw new Error('Only Bob produces M2');
    const value = modPow(this.secrets.kOwn, this.secrets.e2, this.params.p);
    const signature = await this.signOutgoingMessage(1, value);
    return {
      id: 'm2',
      round: 1,
      from: 'Bob',
      to: 'Alice',
      name: 'M2',
      formula: 'K_B^{b2} mod p',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  // Round 2 computations
  public async processM1AndCreateM3(m1: ProtocolMessage): Promise<ProtocolMessage> {
    if (this.role !== 'Bob') throw new Error('Only Bob processes M1 into M3');
    await this.validateIncomingMessage(m1);
    const value = modPow(m1.value, this.secrets.e1, this.params.p);
    const signature = await this.signOutgoingMessage(2, value);
    return {
      id: 'm3',
      round: 2,
      from: 'Bob',
      to: 'Alice',
      name: 'M3',
      formula: 'M1^{b1} mod p = K_A^{a1 \\cdot b1}',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  public async processM2AndCreateM4(m2: ProtocolMessage): Promise<ProtocolMessage> {
    if (this.role !== 'Alice') throw new Error('Only Alice processes M2 into M4');
    await this.validateIncomingMessage(m2);
    const value = modPow(m2.value, this.secrets.e2, this.params.p);
    const signature = await this.signOutgoingMessage(2, value);
    return {
      id: 'm4',
      round: 2,
      from: 'Alice',
      to: 'Bob',
      name: 'M4',
      formula: 'M2^{a2} mod p = K_B^{b2 \\cdot a2}',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  // Round 3 computations
  public async processM3AndCreateM5(m3: ProtocolMessage): Promise<ProtocolMessage> {
    if (this.role !== 'Alice') throw new Error('Only Alice processes M3 into M5');
    await this.validateIncomingMessage(m3);
    const a1Inv = modInv(this.secrets.e1, this.params.q);
    const value = modPow(m3.value, a1Inv, this.params.p);
    const signature = await this.signOutgoingMessage(3, value);
    return {
      id: 'm5',
      round: 3,
      from: 'Alice',
      to: 'Bob',
      name: 'M5',
      formula: 'M3^{a1^{-1}} mod p = K_A^{b1}',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  public async processM4AndCreateM6(m4: ProtocolMessage): Promise<ProtocolMessage> {
    if (this.role !== 'Bob') throw new Error('Only Bob processes M4 into M6');
    await this.validateIncomingMessage(m4);
    const b2Inv = modInv(this.secrets.e2, this.params.q);
    const value = modPow(m4.value, b2Inv, this.params.p);
    const signature = await this.signOutgoingMessage(3, value);
    return {
      id: 'm6',
      round: 3,
      from: 'Bob',
      to: 'Alice',
      name: 'M6',
      formula: 'M4^{b2^{-1}} mod p = K_B^{a2}',
      value,
      signature,
      timestamp: Date.now(),
    };
  }

  // Recovery
  public async processM5AndRecoverKA(m5: ProtocolMessage): Promise<bigint> {
    if (this.role !== 'Bob') throw new Error('Only Bob recovers KA from M5');
    await this.validateIncomingMessage(m5);
    const b1Inv = modInv(this.secrets.e1, this.params.q);
    const kA = modPow(m5.value, b1Inv, this.params.p);
    validateGroupElement(kA, this.params.p, this.params.q);
    this.secrets.kRecovered = kA;
    return kA;
  }

  public async processM6AndRecoverKB(m6: ProtocolMessage): Promise<bigint> {
    if (this.role !== 'Alice') throw new Error('Only Alice recovers KB from M6');
    await this.validateIncomingMessage(m6);
    const a2Inv = modInv(this.secrets.e2, this.params.q);
    const kB = modPow(m6.value, a2Inv, this.params.p);
    validateGroupElement(kB, this.params.p, this.params.q);
    this.secrets.kRecovered = kB;
    return kB;
  }

  /**
   * Finalize session key derivation
   */
  public async finalizeKey(messagesM1ToM6: bigint[]): Promise<string> {
    if (!this.secrets.kRecovered) {
      throw new Error('Cannot finalize key before recovering peer secret');
    }
    const kA = this.role === 'Alice' ? this.secrets.kOwn : this.secrets.kRecovered;
    const kB = this.role === 'Bob' ? this.secrets.kOwn : this.secrets.kRecovered;

    const { skBytes, skHex, transcriptHash } = await deriveSessionKey(
      kA,
      kB,
      messagesM1ToM6,
      this.params.byteLength
    );

    this.sessionKeyBytes = skBytes;
    this.sessionKeyHex = skHex;
    this.transcriptHash = transcriptHash;

    // Generate confirmation tag for own role
    this.confirmationTagSent = await computeConfirmationTag(
      skBytes,
      this.role,
      transcriptHash
    );

    return skHex;
  }

  /**
   * Verify peer's confirmation tag
   */
  public async verifyPeerConfirmationTag(peerTag: string): Promise<boolean> {
    if (!this.sessionKeyBytes || !this.transcriptHash) {
      throw new Error('Session key not yet derived');
    }
    this.confirmationTagReceived = peerTag;
    const peerRole = this.role === 'Alice' ? 'Bob' : 'Alice';
    const valid = await verifyConfirmationTag(
      this.sessionKeyBytes,
      peerRole,
      this.transcriptHash,
      peerTag
    );
    this.confirmationValid = valid;
    return valid;
  }
}

/**
 * Execute the complete protocol in one pass (for automated runs, benchmarking, and unit testing)
 */
export async function runFullProtocol(
  params: GroupParams,
  authenticated = false,
  aliceKeyPair?: PartyKeyPair,
  bobKeyPair?: PartyKeyPair,
  presetAlice?: Partial<PartySecrets>,
  presetBob?: Partial<PartySecrets>
): Promise<{
  alice: ProtocolParty;
  bob: ProtocolParty;
  messages: ProtocolMessage[];
  success: boolean;
  durationMs: number;
}> {
  const start = performance.now();
  const sessionId = 'session_' + Math.random().toString(36).substring(2, 10);

  const alice = new ProtocolParty(
    'Alice',
    params,
    sessionId,
    authenticated,
    aliceKeyPair,
    bobKeyPair?.keyPair.publicKey,
    presetAlice
  );

  const bob = new ProtocolParty(
    'Bob',
    params,
    sessionId,
    authenticated,
    bobKeyPair,
    aliceKeyPair?.keyPair.publicKey,
    presetBob
  );

  // Round 1
  const m1 = await alice.createM1();
  const m2 = await bob.createM2();

  // Round 2
  const m3 = await bob.processM1AndCreateM3(m1);
  const m4 = await alice.processM2AndCreateM4(m2);

  // Round 3
  const m5 = await alice.processM3AndCreateM5(m3);
  const m6 = await bob.processM4AndCreateM6(m4);

  // Recovery
  await bob.processM5AndRecoverKA(m5);
  await alice.processM6AndRecoverKB(m6);

  const messageValues = [m1.value, m2.value, m3.value, m4.value, m5.value, m6.value];

  // Key Derivation
  await alice.finalizeKey(messageValues);
  await bob.finalizeKey(messageValues);

  // Key Confirmation
  const aliceConfirmed = await alice.verifyPeerConfirmationTag(bob.confirmationTagSent!);
  const bobConfirmed = await bob.verifyPeerConfirmationTag(alice.confirmationTagSent!);

  const durationMs = performance.now() - start;

  return {
    alice,
    bob,
    messages: [m1, m2, m3, m4, m5, m6],
    success:
      aliceConfirmed &&
      bobConfirmed &&
      alice.sessionKeyHex === bob.sessionKeyHex &&
      alice.secrets.kRecovered === bob.secrets.kOwn &&
      bob.secrets.kRecovered === alice.secrets.kOwn,
    durationMs,
  };
}
